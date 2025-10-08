'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Bell, Users, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NudgeNotificationData {
  id: string;
  type: 'message' | 'follow' | 'room' | 'general';
  title: string;
  message: string;
  senderId?: string;
  senderUsername?: string;
  senderProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  roomId?: string;
  roomName?: string;
  timestamp: string;
  data?: any;
}

interface NudgeNotificationProps {
  notification: NudgeNotificationData;
  onClose: (id: string) => void;
  onClick?: (notification: NudgeNotificationData) => void;
  autoHide?: boolean;
  duration?: number;
}

export function NudgeNotification({ 
  notification, 
  onClose, 
  onClick,
  autoHide = true,
  duration = 5000 
}: NudgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Show notification with animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-hide notification
    if (autoHide) {
      const hideTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => clearTimeout(showTimer);
  }, [autoHide, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'follow':
        return <UserPlus className="h-4 w-4" />;
      case 'room':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAvatarSrc = (profilePicture?: NudgeNotificationData['senderProfilePicture']) => {
    if (!profilePicture) return '';
    
    if (profilePicture.type === 'upload' && profilePicture.url) {
      return profilePicture.url;
    }
    
    if (profilePicture.type === 'avatar' && profilePicture.avatarStyle && profilePicture.seed) {
      const style = profilePicture.avatarStyle.toLowerCase().replace(/\s+/g, '-');
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${profilePicture.seed}`;
    }
    
    return '';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] transform transition-all duration-300 ease-in-out",
        isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <Card 
        className={cn(
          "shadow-lg border-l-4 cursor-pointer hover:shadow-xl transition-shadow",
          notification.type === 'message' && "border-l-blue-500",
          notification.type === 'follow' && "border-l-green-500",
          notification.type === 'room' && "border-l-purple-500",
          notification.type === 'general' && "border-l-gray-500"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {notification.senderProfilePicture ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getAvatarSrc(notification.senderProfilePicture)} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {notification.senderUsername?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  {getIcon()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {notification.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {notification.senderUsername && (
                <p className="text-xs text-muted-foreground mt-1">
                  from @{notification.senderUsername}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NudgeNotificationContainerProps {
  notifications: NudgeNotificationData[];
  onClose: (id: string) => void;
  onClick?: (notification: NudgeNotificationData) => void;
  maxNotifications?: number;
}

export function NudgeNotificationContainer({ 
  notifications, 
  onClose, 
  onClick,
  maxNotifications = 3 
}: NudgeNotificationContainerProps) {
  // Show only the latest notifications
  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index
          }}
        >
          <NudgeNotification
            notification={notification}
            onClose={onClose}
            onClick={onClick}
          />
        </div>
      ))}
    </div>
  );
}
