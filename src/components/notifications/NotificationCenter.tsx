import React, { useState, useEffect } from 'react';
import { Bell, X, Settings, Check, CheckCheck, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket, NotificationData } from '@/hooks/useWebSocket';
import { NotificationItem } from './NotificationItem';
import { NotificationSettings } from './NotificationSettings';
import { apiClient } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const { unreadCount, isConnected } = useWebSocket({
    onNotification: handleNewNotification,
  });

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, selectedFilter]);

  function handleNewNotification(notification: NotificationData) {
    setNotifications(prev => [notification, ...prev]);
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        includeRead: selectedFilter === 'all' ? 'true' : 'false',
      });

      if (selectedFilter === 'important') {
        params.append('types', 'MILESTONE_APPROVED');
        params.append('types', 'PAYMENT_RECEIVED');
        params.append('types', 'SYSTEM_ALERT');
      }

      const response = await apiClient.get(`/notifications?${params}`);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'DEAL_CREATED': '🤝',
      'DEAL_ACCEPTED': '✅',
      'DEAL_FUNDED': '💰',
      'MILESTONE_SUBMITTED': '📤',
      'MILESTONE_APPROVED': '✅',
      'MILESTONE_REJECTED': '❌',
      'MILESTONE_AUTO_RELEASED': '⏰',
      'PAYMENT_RECEIVED': '💳',
      'PAYMENT_FAILED': '⚠️',
      'KYC_APPROVED': '🆔',
      'KYC_REJECTED': '❌',
      'DISPUTE_CREATED': '⚡',
      'DISPUTE_RESOLVED': '✅',
      'REMINDER': '⏰',
      'SYSTEM_ALERT': '📢',
    };
    
    return icons[type] || '📬';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'LOW': 'text-gray-500',
      'MEDIUM': 'text-blue-500',
      'HIGH': 'text-orange-500',
      'URGENT': 'text-red-500',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-500';
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return !notification.readAt;
      case 'important':
        return ['HIGH', 'URGENT'].includes(notification.priority);
      default:
        return true;
    }
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 p-0" 
        align="end"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {showSettings ? (
          <NotificationSettings onBack={() => setShowSettings(false)} />
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2 mt-2">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} 
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Filters */}
            <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="important" className="text-xs">Important</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="p-0 m-0">
                <NotificationList 
                  notifications={filteredNotifications}
                  loading={loading}
                  onNotificationClick={handleNotificationClick}
                  getNotificationIcon={getNotificationIcon}
                  getPriorityColor={getPriorityColor}
                />
              </TabsContent>
              
              <TabsContent value="unread" className="p-0 m-0">
                <NotificationList 
                  notifications={filteredNotifications}
                  loading={loading}
                  onNotificationClick={handleNotificationClick}
                  getNotificationIcon={getNotificationIcon}
                  getPriorityColor={getPriorityColor}
                />
              </TabsContent>
              
              <TabsContent value="important" className="p-0 m-0">
                <NotificationList 
                  notifications={filteredNotifications}
                  loading={loading}
                  onNotificationClick={handleNotificationClick}
                  getNotificationIcon={getNotificationIcon}
                  getPriorityColor={getPriorityColor}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationListProps {
  notifications: NotificationData[];
  loading: boolean;
  onNotificationClick: (notification: NotificationData) => void;
  getNotificationIcon: (type: string) => string;
  getPriorityColor: (priority: string) => string;
}

function NotificationList({
  notifications,
  loading,
  onNotificationClick,
  getNotificationIcon,
  getPriorityColor,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">No notifications</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-0">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
              !notification.readAt ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
            }`}
            onClick={() => onNotificationClick(notification)}
          >
            <div className="flex items-start gap-3">
              <div className="text-lg shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm leading-tight">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  
                  {!notification.readAt && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  
                  {notification.priority !== 'MEDIUM' && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                    >
                      {notification.priority}
                    </Badge>
                  )}
                </div>

                {notification.actor && (
                  <p className="text-xs text-muted-foreground mt-1">
                    From: {notification.actor.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}