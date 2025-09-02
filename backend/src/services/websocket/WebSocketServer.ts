import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { verifyJWT } from '../auth/jwt.js';
import { logger } from '../../utils/logger.js';
import { NotificationService } from './NotificationService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedSocket extends SocketIO.Socket {
  userId: string;
  userRole: 'CREATOR' | 'BRAND' | 'ADMIN';
  userEmail: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private notificationService: NotificationService;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private userPresence = new Map<string, {
    userId: string;
    lastSeen: Date;
    status: 'online' | 'away' | 'offline';
    currentPage?: string;
  }>();

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.notificationService = new NotificationService(this);
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupPresenceTracking();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication failed: No token provided'));
        }

        const decoded = verifyJWT(token);
        if (!decoded || !decoded.userId) {
          return next(new Error('Authentication failed: Invalid token'));
        }

        // Fetch user details from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true },
        });

        if (!user) {
          return next(new Error('Authentication failed: User not found'));
        }

        // Attach user info to socket
        (socket as AuthenticatedSocket).userId = user.id;
        (socket as AuthenticatedSocket).userRole = user.role as any;
        (socket as AuthenticatedSocket).userEmail = user.email;

        next();
      } catch (error: any) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 120; // 120 requests per minute

      const clientId = (socket as AuthenticatedSocket).userId;
      const now = Date.now();
      const clientData = rateLimitMap.get(clientId);

      if (!clientData || now > clientData.resetTime) {
        rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (clientData.count >= maxRequests) {
        return next(new Error('Rate limit exceeded'));
      }

      clientData.count++;
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const { userId, userRole, userEmail } = socket;
      
      logger.info(`User connected: ${userEmail} (${userId}) - Socket: ${socket.id}`);

      // Track connected user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Update presence
      this.updateUserPresence(userId, 'online');

      // Join user to their personal room for direct notifications
      socket.join(`user:${userId}`);

      // Join role-based rooms
      socket.join(`role:${userRole}`);

      // Join deal-specific rooms based on user's active deals
      this.joinUserDeals(socket, userId);

      // Handle joining specific rooms
      socket.on('join-room', (room: string) => {
        if (this.isValidRoom(room, socket)) {
          socket.join(room);
          logger.info(`User ${userId} joined room: ${room}`);
        }
      });

      socket.on('leave-room', (room: string) => {
        socket.leave(room);
        logger.info(`User ${userId} left room: ${room}`);
      });

      // Handle page navigation for presence
      socket.on('page-changed', (page: string) => {
        const presence = this.userPresence.get(userId);
        if (presence) {
          presence.currentPage = page;
          presence.lastSeen = new Date();
        }
      });

      // Handle user status updates
      socket.on('status-change', (status: 'online' | 'away') => {
        this.updateUserPresence(userId, status);
        this.broadcastPresenceUpdate(userId);
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { room: string; context?: string }) => {
        socket.to(data.room).emit('user-typing', {
          userId,
          userEmail,
          context: data.context,
        });
      });

      socket.on('typing-stop', (data: { room: string; context?: string }) => {
        socket.to(data.room).emit('user-stopped-typing', {
          userId,
          context: data.context,
        });
      });

      // Handle real-time collaboration
      socket.on('document-cursor', (data: { room: string; position: any }) => {
        socket.to(data.room).emit('cursor-moved', {
          userId,
          userEmail,
          position: data.position,
        });
      });

      // Handle milestone progress updates
      socket.on('milestone-progress', (data: { milestoneId: string; progress: number }) => {
        this.broadcastToRoom(`milestone:${data.milestoneId}`, 'milestone-progress-updated', {
          milestoneId: data.milestoneId,
          progress: data.progress,
          updatedBy: userId,
        });
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        logger.info(`User disconnected: ${userEmail} (${userId}) - Reason: ${reason}`);
        
        // Remove from connected users
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
            this.updateUserPresence(userId, 'offline');
            this.broadcastPresenceUpdate(userId);
          }
        }
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Successfully connected to FlowPay real-time services',
        userId,
        connectedUsers: Array.from(this.connectedUsers.keys()),
      });
    });
  }

  private setupPresenceTracking(): void {
    // Update away status for inactive users
    setInterval(() => {
      const now = new Date();
      const awayThreshold = 5 * 60 * 1000; // 5 minutes

      this.userPresence.forEach((presence, userId) => {
        if (presence.status === 'online' && 
            (now.getTime() - presence.lastSeen.getTime()) > awayThreshold) {
          this.updateUserPresence(userId, 'away');
          this.broadcastPresenceUpdate(userId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private async joinUserDeals(socket: AuthenticatedSocket, userId: string): Promise<void> {
    try {
      const deals = await prisma.deal.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { project: { brandId: userId } },
          ],
        },
        select: { id: true },
      });

      for (const deal of deals) {
        socket.join(`deal:${deal.id}`);
      }

      logger.info(`User ${userId} joined ${deals.length} deal rooms`);
    } catch (error: any) {
      logger.error('Error joining user deals:', error);
    }
  }

  private isValidRoom(room: string, socket: AuthenticatedSocket): boolean {
    const { userId, userRole } = socket;
    
    // Allow personal rooms
    if (room === `user:${userId}`) return true;
    
    // Allow role rooms
    if (room === `role:${userRole}`) return true;
    
    // Allow admin to join any room
    if (userRole === 'ADMIN') return true;
    
    // Validate deal/milestone rooms (should check database permissions)
    if (room.startsWith('deal:') || room.startsWith('milestone:')) {
      // TODO: Implement proper permission checking
      return true;
    }
    
    return false;
  }

  private updateUserPresence(userId: string, status: 'online' | 'away' | 'offline'): void {
    this.userPresence.set(userId, {
      userId,
      lastSeen: new Date(),
      status,
      currentPage: this.userPresence.get(userId)?.currentPage,
    });
  }

  private broadcastPresenceUpdate(userId: string): void {
    const presence = this.userPresence.get(userId);
    if (presence) {
      this.io.emit('presence-updated', presence);
    }
  }

  // Public methods for sending notifications
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public sendToRole(role: 'CREATOR' | 'BRAND' | 'ADMIN', event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Get connected users
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getUserPresence(userId: string) {
    return this.userPresence.get(userId);
  }

  public getAllPresence() {
    return Array.from(this.userPresence.values());
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket server...');
    
    // Notify all connected clients
    this.broadcast('server-shutdown', {
      message: 'Server is shutting down for maintenance',
      timestamp: new Date().toISOString(),
    });

    // Close all connections
    this.io.close();
    
    logger.info('WebSocket server shut down successfully');
  }
}