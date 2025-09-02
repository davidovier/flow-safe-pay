import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PresenceList, PresenceIndicator } from './PresenceIndicator';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { 
  Users, 
  Activity, 
  Wifi, 
  WifiOff, 
  Bell, 
  Eye,
  MessageCircle,
  Zap
} from 'lucide-react';

interface RealTimeDashboardProps {
  className?: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  user: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function RealTimeDashboard({ className = '' }: RealTimeDashboardProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [currentPage, setCurrentPage] = useState('/dashboard');

  const {
    isConnected,
    isConnecting,
    connectedUsers,
    unreadCount,
    presence,
    connect,
    disconnect,
    updatePage,
    updateStatus,
  } = useWebSocket({
    onNotification: (notification) => {
      // Add to activity feed
      setRecentActivity(prev => [{
        id: notification.id,
        type: 'notification',
        user: notification.actor?.name || 'System',
        action: notification.title,
        timestamp: new Date(notification.createdAt),
        metadata: { priority: notification.priority, type: notification.type },
      }, ...prev.slice(0, 9)]);
    },
    onPresenceUpdate: (presenceData) => {
      // Add presence change to activity feed
      setRecentActivity(prev => [{
        id: `presence-${presenceData.userId}-${Date.now()}`,
        type: 'presence',
        user: presenceData.userId,
        action: `went ${presenceData.status}`,
        timestamp: new Date(),
        metadata: { status: presenceData.status },
      }, ...prev.slice(0, 9)]);
    },
  });

  useEffect(() => {
    // Listen for custom events from WebSocket
    const handleMilestoneProgress = (event: CustomEvent) => {
      setRecentActivity(prev => [{
        id: `progress-${event.detail.milestoneId}-${Date.now()}`,
        type: 'milestone',
        user: event.detail.updatedBy,
        action: `updated milestone progress`,
        timestamp: new Date(),
        metadata: { 
          milestoneId: event.detail.milestoneId,
          progress: event.detail.progress 
        },
      }, ...prev.slice(0, 9)]);
    };

    const handleUserTyping = (event: CustomEvent) => {
      // Could show typing indicators in activity feed if desired
      console.log('User typing:', event.detail);
    };

    window.addEventListener('milestone-progress-updated', handleMilestoneProgress as EventListener);
    window.addEventListener('user-typing', handleUserTyping as EventListener);

    return () => {
      window.removeEventListener('milestone-progress-updated', handleMilestoneProgress as EventListener);
      window.removeEventListener('user-typing', handleUserTyping as EventListener);
    };
  }, []);

  // Update page when component mounts
  useEffect(() => {
    updatePage('/dashboard');
  }, [updatePage]);

  const handleStatusChange = (status: 'online' | 'away') => {
    updateStatus(status);
  };

  const getConnectionStatus = () => {
    if (isConnecting) return { icon: Activity, color: 'text-yellow-500', text: 'Connecting...' };
    if (isConnected) return { icon: Wifi, color: 'text-green-500', text: 'Connected' };
    return { icon: WifiOff, color: 'text-red-500', text: 'Disconnected' };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'notification': return <Bell className="h-4 w-4 text-blue-500" />;
      case 'presence': return <Users className="h-4 w-4 text-green-500" />;
      case 'milestone': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StatusIcon className={`h-5 w-5 ${connectionStatus.color}`} />
            Real-Time Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{connectionStatus.text}</p>
              <p className="text-xs text-muted-foreground">
                {connectedUsers.length} user{connectedUsers.length === 1 ? '' : 's'} online
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={isConnected ? 'outline' : 'default'}
                size="sm"
                onClick={isConnected ? disconnect : connect}
                disabled={isConnecting}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
              
              <NotificationCenter />
            </div>
          </div>

          {/* Status Controls */}
          {isConnected && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => handleStatusChange('online')}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                Online
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => handleStatusChange('away')}
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
                Away
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Online Users */}
      {isConnected && connectedUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Online Users ({connectedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PresenceList 
              userIds={connectedUsers}
              maxDisplay={8}
              size="md"
              className="flex-wrap gap-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs mt-1">Real-time events will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    
                    {activity.metadata && (
                      <div className="flex items-center gap-2 mt-1">
                        {activity.metadata.priority && (
                          <Badge 
                            variant={activity.metadata.priority === 'HIGH' || activity.metadata.priority === 'URGENT' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {activity.metadata.priority}
                          </Badge>
                        )}
                        {activity.metadata.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.status}
                          </Badge>
                        )}
                        {activity.metadata.progress !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.progress}% complete
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WebSocket Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Connected: {isConnected.toString()}</p>
            <p>Connecting: {isConnecting.toString()}</p>
            <p>Connected Users: {connectedUsers.length}</p>
            <p>Unread Notifications: {unreadCount}</p>
            <p>Presence Entries: {presence.size}</p>
            <p>Current Page: {currentPage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}