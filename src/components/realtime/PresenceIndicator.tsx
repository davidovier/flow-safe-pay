import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocket, PresenceData } from '@/hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface PresenceIndicatorProps {
  userId: string;
  user?: User;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PresenceIndicator({ 
  userId, 
  user, 
  showLastSeen = false, 
  size = 'md',
  className = '' 
}: PresenceIndicatorProps) {
  const { presence } = useWebSocket();
  const userPresence = presence.get(userId);

  if (!userPresence) {
    return (
      <div className={`relative ${className}`}>
        <Avatar className={getAvatarSize(size)}>
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback className="bg-gray-100 text-gray-600">
            {getInitials(user?.name || user?.email || 'U')}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-400',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      online: 'Online',
      away: 'Away',
      offline: 'Offline',
    };
    return labels[status as keyof typeof labels] || 'Unknown';
  };

  const getIndicatorSize = (size: string) => {
    const sizes = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
    };
    return sizes[size as keyof typeof sizes] || 'w-3 h-3';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            <Avatar className={getAvatarSize(size)}>
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {getInitials(user?.name || user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            
            {/* Status indicator */}
            <div 
              className={`
                absolute bottom-0 right-0 ${getIndicatorSize(size)} rounded-full border-2 border-white
                ${getStatusColor(userPresence.status)}
              `}
            />
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="top">
          <div className="text-center">
            <p className="font-medium">{user?.name || user?.email || 'Unknown User'}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(userPresence.status)}`} />
              <span className="text-xs">{getStatusLabel(userPresence.status)}</span>
            </div>
            {showLastSeen && userPresence.lastSeen && (
              <p className="text-xs text-muted-foreground mt-1">
                Last seen {formatDistanceToNow(new Date(userPresence.lastSeen), { addSuffix: true })}
              </p>
            )}
            {userPresence.currentPage && (
              <p className="text-xs text-muted-foreground">
                Viewing: {userPresence.currentPage}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface PresenceListProps {
  userIds: string[];
  users?: Record<string, User>;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PresenceList({ 
  userIds, 
  users = {}, 
  maxDisplay = 5, 
  size = 'md',
  className = '' 
}: PresenceListProps) {
  const { presence, connectedUsers } = useWebSocket();
  
  // Filter to only show users who are actually online
  const onlineUsers = userIds.filter(id => {
    const userPresence = presence.get(id);
    return userPresence?.status === 'online';
  });

  const displayUsers = onlineUsers.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, onlineUsers.length - maxDisplay);

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-1">
        {displayUsers.map((userId) => (
          <PresenceIndicator
            key={userId}
            userId={userId}
            user={users[userId]}
            size={size}
            showLastSeen
          />
        ))}
      </div>
      
      {hiddenCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${getAvatarSize(size)} bg-gray-100 rounded-full flex items-center justify-center ml-1 cursor-help`}>
                <span className="text-xs font-medium text-gray-600">
                  +{hiddenCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hiddenCount} more user{hiddenCount === 1 ? '' : 's'} online</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

interface TypingIndicatorProps {
  room: string;
  currentUserId: string;
  users?: Record<string, User>;
  className?: string;
}

export function TypingIndicator({ 
  room, 
  currentUserId, 
  users = {},
  className = '' 
}: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleTypingStart = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (userId !== currentUserId) {
        setTypingUsers(prev => new Set(prev.add(userId)));
      }
    };

    const handleTypingStop = (event: CustomEvent) => {
      const { userId } = event.detail;
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    window.addEventListener('user-typing', handleTypingStart as EventListener);
    window.addEventListener('user-stopped-typing', handleTypingStop as EventListener);

    return () => {
      window.removeEventListener('user-typing', handleTypingStart as EventListener);
      window.removeEventListener('user-stopped-typing', handleTypingStop as EventListener);
    };
  }, [currentUserId]);

  if (typingUsers.size === 0) {
    return null;
  }

  const typingUsersList = Array.from(typingUsers);
  const userNames = typingUsersList.map(id => users[id]?.name || 'Someone');

  const getTypingText = () => {
    if (userNames.length === 1) {
      return `${userNames[0]} is typing...`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} are typing...`;
    } else {
      return `${userNames[0]} and ${userNames.length - 1} others are typing...`;
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="italic">{getTypingText()}</span>
    </div>
  );
}

// Helper functions
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarSize(size: string): string {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };
  return sizes[size as keyof typeof sizes] || 'w-8 h-8 text-sm';
}