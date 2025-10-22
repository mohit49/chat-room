'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, UserPlus, Trash2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { Notification } from '@/lib/api/notification';
import { sendFollowRequest, removeFollower } from '@/lib/api/follow';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useToast } from '@/hooks/use-toast';

interface NotificationIconProps {
  className?: string;
}

export default function NotificationIcon({ className }: NotificationIconProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { socket, connected, connectionConfirmed } = useSocket();
  const { toast } = useToast();
  
  // Socket events
  const socketEvents = useSocketEvents({
    onNotification: (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    },
    onNotificationRead: (data: { notificationId: string; success: boolean }) => {
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === data.notificationId 
              ? { ...notif, status: 'read' as const }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    },
    onInvitationApproved: (data: { notificationId: string; success: boolean; roomId?: string }) => {
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === data.notificationId 
              ? { ...notif, status: 'approved' as const }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    },
    onInvitationRejected: (data: { notificationId: string; success: boolean }) => {
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === data.notificationId 
              ? { ...notif, status: 'rejected' as const }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  }, 'NotificationIcon');

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);


  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications(10, 0) as any;
      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadCount() as any;
      if (response.success && response.data?.count) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (socket) {
        socketEvents.emit('mark_notification_read', notificationId);
      } else {
        await api.markAsRead(notificationId);
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'read' as const }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleApproveInvitation = async (notificationId: string) => {
    try {
      if (socket) {
        socketEvents.emit('approve_invitation', notificationId);
      } else {
        const response = await api.approveInvitation(notificationId) as any;
        if (response.success) {
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === notificationId 
                ? { ...notif, status: 'approved' as const }
                : notif
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          
          // Navigate to room if roomId is provided
          if (response.roomId) {
            router.push(`/rooms/${response.roomId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error approving invitation:', error);
    }
  };

  const handleRoomInvitationClick = (notification: Notification) => {
    // Redirect to the specific room page for room invitations
    if (notification.roomId) {
      router.push(`/rooms/${notification.roomId}`);
    }
    setIsOpen(false);
  };

  const handleAcceptFollowRequest = async (notification: Notification) => {
    try {
      const senderId = notification.senderId;
      if (!senderId) {
        console.error('No sender ID found in notification');
        return;
      }

      // Follow them back
      await sendFollowRequest(senderId);
      
      // Mark notification as read
      await handleMarkAsRead(notification.id);
      
      // Update notification in UI
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notification.id 
            ? { ...notif, status: 'read' as const }
            : notif
        )
      );
      
    } catch (error: any) {
      console.error('Error following back:', error);
      // If already following, just mark as read
      if (error.message?.includes('already following') || error.message?.includes('already sent')) {
        await handleMarkAsRead(notification.id);
      }
    }
  };

  const handleRejectFollowRequest = async (notification: Notification) => {
    try {
      const senderId = notification.senderId;
      if (!senderId) {
        console.error('No sender ID found in notification');
        return;
      }

      // Remove them as a follower
      await removeFollower(senderId);
      
      // Mark notification as rejected
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notification.id 
            ? { ...notif, status: 'rejected' as const }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error removing follower:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const response = await api.deleteNotification(notificationId) as any;
      if (response.success) {
        // Remove notification from the list
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        const deletedNotif = notifications.find(n => n.id === notificationId);
        if (deletedNotif && deletedNotif.status === 'unread') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        toast({
          title: "Notification deleted",
          description: "The notification has been removed.",
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const response = await api.clearAllNotifications() as any;
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
        
        toast({
          title: "All notifications cleared",
          description: "All your notifications have been deleted.",
        });
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear notifications. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'room_invitation':
        return '🔔';
      case 'room_approved':
        return '✅';
      case 'room_rejected':
        return '❌';
      case 'room_removed':
        return '🚫';
      case 'role_changed':
        return '👑';
      case 'follow_request':
        return '👤';
      case 'follow_accepted':
        return '✅';
      default:
        return '📢';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'read':
        return 'text-gray-600 bg-gray-100';
      case 'unread':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProfilePictureUrl = (profilePicture: any) => {
    if (!profilePicture) return null;
    
    if (profilePicture.type === 'upload' && profilePicture.url) {
      return profilePicture.url;
    } else if (profilePicture.type === 'avatar' && profilePicture.seed) {
      return `https://api.dicebear.com/7.x/${profilePicture.avatarStyle || 'avataaars'}/svg?seed=${profilePicture.seed}`;
    }
    
    return null;
  };

  const getUserInitials = (username: string) => {
    if (!username) return '?';
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
            connectionConfirmed ? 'bg-green-500' : connected ? 'bg-yellow-500' : 'bg-red-500'
          }`} title={
            connectionConfirmed ? 'Socket connected and confirmed' : 
            connected ? 'Socket connected, waiting for confirmation' : 
            'Socket disconnected'
          } />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-1">
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearAllNotifications}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear All
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/notifications')}
                className="text-xs"
              >
                View All
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`overflow-hidden transition-all hover:shadow-md ${
                    notification.type === 'room_invitation' 
                      ? 'cursor-pointer border-l-4 border-l-blue-500' 
                      : notification.type === 'follow_request' && notification.status === 'unread'
                      ? 'border-l-4 border-l-purple-500'
                      : notification.type === 'follow_accepted'
                      ? 'border-l-4 border-l-green-500'
                      : ''
                  }`}
                  onClick={() => {
                    if (notification.type === 'room_invitation') {
                      handleRoomInvitationClick(notification);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Profile Picture for follow notifications */}
                      {(notification.type === 'follow_request' || notification.type === 'follow_accepted') && (
                        <Avatar className="h-10 w-10 border-2 border-background">
                          <AvatarImage 
                            src={getProfilePictureUrl(notification.metadata?.senderProfilePicture) || undefined} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <UserPlus className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {/* Icon for other notifications */}
                      {notification.type !== 'follow_request' && notification.type !== 'follow_accepted' && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight">
                              {notification.title}
                            </h4>
                            {notification.metadata?.senderUsername && (
                              <p className="text-xs text-muted-foreground">
                                @{notification.metadata.senderUsername}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={notification.status === 'unread' ? 'default' : 'secondary'}
                              className="flex-shrink-0 text-xs"
                            >
                              {notification.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              title="Delete notification"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Message */}
                        <p className="text-sm text-muted-foreground leading-snug">
                          {notification.message}
                        </p>
                        
                        {/* Footer with date and actions in column layout */}
                        <div className="flex flex-col gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          {/* Actions */}
                          <div className="flex gap-1.5">
                            {notification.type === 'follow_request' && notification.status === 'unread' && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptFollowRequest(notification);
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Follow Back
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectFollowRequest(notification);
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </>
                            )}
                            {notification.type === 'room_invitation' && notification.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                View Details →
                              </Button>
                            )}
                            {notification.status === 'unread' && 
                             notification.type !== 'room_invitation' && 
                             notification.type !== 'follow_request' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
