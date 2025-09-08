import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  createdAt: string;
  metadata?: Record<string, any>;
  actor?: {
    name: string;
    email: string;
  };
}

export interface PresenceData {
  userId: string;
  lastSeen: Date;
  status: 'online' | 'away' | 'offline';
  currentPage?: string;
}

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
  enablePresence?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onNotification?: (notification: NotificationData) => void;
  onPresenceUpdate?: (presence: PresenceData) => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectedUsers: string[];
  unreadCount: number;
  presence: Map<string, PresenceData>;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    enableNotifications = true,
    enablePresence = true,
    onConnect,
    onDisconnect,
    onNotification,
    onPresenceUpdate,
  } = options;

  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectedUsers: [],
    unreadCount: 0,
    presence: new Map(),
  });

  // Connect to WebSocket server
  const connect = useCallback(async () => {
    if (!userProfile?.id || socketRef.current?.connected) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const token = localStorage.getItem('supabase.auth.token') || 
                   sessionStorage.getItem('supabase.auth.token');

      if (!token) {
        throw new Error('No authentication token available');
      }

      const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 5000,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);
        reconnectAttemptsRef.current = 0;
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));

        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        onDisconnect?.();

        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          scheduleReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: error.message,
        }));

        scheduleReconnect();
      });

      // Welcome message
      socket.on('connected', (data) => {
        console.log('WebSocket welcome:', data);
        setState(prev => ({
          ...prev,
          connectedUsers: data.connectedUsers || [],
        }));
      });

      // Notification events
      if (enableNotifications) {
        socket.on('notification', (notification: NotificationData) => {
          console.log('New notification:', notification);
          
          onNotification?.(notification);
          
          // Show toast for high priority notifications
          if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
            toast({
              title: notification.title,
              description: notification.message,
              duration: notification.priority === 'URGENT' ? 10000 : 5000,
            });
          }
        });

        socket.on('unread-count', (data: { count: number }) => {
          setState(prev => ({ ...prev, unreadCount: data.count }));
        });

        socket.on('system-announcement', (announcement: NotificationData) => {
          toast({
            title: `📢 ${announcement.title}`,
            description: announcement.message,
            duration: 8000,
          });
        });
      }

      // Presence events
      if (enablePresence) {
        socket.on('presence-updated', (presence: PresenceData) => {
          setState(prev => {
            const newPresence = new Map(prev.presence);
            newPresence.set(presence.userId, presence);
            return { ...prev, presence: newPresence };
          });
          
          onPresenceUpdate?.(presence);
        });
      }

      // Deal-specific events
      socket.on('deal-notification', (notification: NotificationData) => {
        console.log('Deal notification:', notification);
        onNotification?.(notification);
      });

      socket.on('milestone-notification', (notification: NotificationData) => {
        console.log('Milestone notification:', notification);
        onNotification?.(notification);
      });

      socket.on('milestone-progress-updated', (data: any) => {
        console.log('Milestone progress updated:', data);
        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('milestone-progress-updated', { detail: data }));
      });

      // Real-time collaboration events
      socket.on('user-typing', (data: { userId: string; userEmail: string; context?: string }) => {
        console.log('User typing:', data);
        window.dispatchEvent(new CustomEvent('user-typing', { detail: data }));
      });

      socket.on('user-stopped-typing', (data: { userId: string; context?: string }) => {
        console.log('User stopped typing:', data);
        window.dispatchEvent(new CustomEvent('user-stopped-typing', { detail: data }));
      });

      socket.on('cursor-moved', (data: { userId: string; userEmail: string; position: any }) => {
        console.log('Cursor moved:', data);
        window.dispatchEvent(new CustomEvent('cursor-moved', { detail: data }));
      });

    } catch (error: any) {
      console.error('Failed to connect to WebSocket:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error.message,
      }));
      
      scheduleReconnect();
    }
  }, [userProfile, onConnect, onDisconnect, onNotification, onPresenceUpdate, enableNotifications, enablePresence, toast]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttemptsRef.current += 1;
    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff

    console.log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));
  }, []);

  // Join a room
  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-room', room);
    }
  }, []);

  // Leave a room
  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-room', room);
    }
  }, []);

  // Update page for presence tracking
  const updatePage = useCallback((page: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('page-changed', page);
    }
  }, []);

  // Update status
  const updateStatus = useCallback((status: 'online' | 'away') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('status-change', status);
    }
  }, []);

  // Send typing indicator
  const startTyping = useCallback((room: string, context?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-start', { room, context });
    }
  }, []);

  const stopTyping = useCallback((room: string, context?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing-stop', { room, context });
    }
  }, []);

  // Send cursor position
  const updateCursor = useCallback((room: string, position: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('document-cursor', { room, position });
    }
  }, []);

  // Update milestone progress
  const updateMilestoneProgress = useCallback((milestoneId: string, progress: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('milestone-progress', { milestoneId, progress });
    }
  }, []);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && userProfile?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userProfile?.id, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    updatePage,
    updateStatus,
    startTyping,
    stopTyping,
    updateCursor,
    updateMilestoneProgress,
    
    // Socket instance (for advanced use cases)
    socket: socketRef.current,
  };
}