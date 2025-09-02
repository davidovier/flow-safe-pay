import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ExternalLink, Clock, User } from 'lucide-react';
import { NotificationData } from '@/hooks/useWebSocket';

interface NotificationItemProps {
  notification: NotificationData;
  onRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onClick?: (notification: NotificationData) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onRead,
  onDismiss,
  onClick,
  showActions = false,
  compact = false,
}: NotificationItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(notification);
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRead?.(notification.id);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(notification.id);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'DEAL_CREATED': <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">🤝</div>,
      'DEAL_ACCEPTED': <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✅</div>,
      'DEAL_FUNDED': <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">💰</div>,
      'MILESTONE_SUBMITTED': <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">📤</div>,
      'MILESTONE_APPROVED': <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✅</div>,
      'MILESTONE_REJECTED': <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">❌</div>,
      'MILESTONE_AUTO_RELEASED': <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">⏰</div>,
      'PAYMENT_RECEIVED': <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">💳</div>,
      'PAYMENT_FAILED': <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">⚠️</div>,
      'KYC_APPROVED': <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">🆔</div>,
      'KYC_REJECTED': <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">❌</div>,
      'DISPUTE_CREATED': <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">⚡</div>,
      'DISPUTE_RESOLVED': <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✅</div>,
      'REMINDER': <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">⏰</div>,
      'SYSTEM_ALERT': <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">📢</div>,
    };
    
    return icons[type] || <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">📬</div>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'LOW': 'secondary',
      'MEDIUM': 'default',
      'HIGH': 'default',
      'URGENT': 'destructive',
    } as const;
    
    const colors = {
      'LOW': 'text-gray-600',
      'MEDIUM': 'text-blue-600',
      'HIGH': 'text-orange-600', 
      'URGENT': 'text-red-600',
    };

    if (priority === 'MEDIUM') return null;

    return (
      <Badge variant={variants[priority as keyof typeof variants]} className="text-xs">
        {priority}
      </Badge>
    );
  };

  const isUnread = !notification.readAt;

  return (
    <div 
      className={`
        relative p-4 border rounded-lg transition-all duration-200 cursor-pointer
        ${isUnread 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
        }
        ${compact ? 'p-3' : ''}
      `}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0">
          {getTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-medium text-sm ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
              {notification.title}
            </h4>
            {getPriorityBadge(notification.priority)}
          </div>

          <p className={`text-sm text-gray-600 mb-2 ${compact ? 'line-clamp-1' : 'line-clamp-3'}`}>
            {notification.message}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </div>
              
              {notification.actor && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {notification.actor.name}
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                {notification.actionUrl && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                
                {isUnread && onRead && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={handleMarkRead}
                    title="Mark as read"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
                
                {onDismiss && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={handleDismiss}
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Action URL button */}
          {notification.actionUrl && !showActions && (
            <div className="mt-2">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                View Details
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}