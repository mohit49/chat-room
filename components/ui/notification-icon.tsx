'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { Notification } from '@/lib/api/notification';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';

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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/notifications')}
              className="text-xs"
            >
              View All
            </Button>
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
                  className={`p-3 transition-colors ${
                    notification.type === 'room_invitation' 
                      ? 'cursor-pointer hover:bg-accent border-l-4 border-l-blue-500' 
                      : ''
                  }`}
                  onClick={() => {
                    if (notification.type === 'room_invitation') {
                      handleRoomInvitationClick(notification);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {notification.type === 'room_invitation' && notification.status === 'pending' && (
                            <div className="text-xs text-blue-600 font-medium">
                              Click to view details →
                            </div>
                          )}
                          {notification.status === 'unread' && notification.type !== 'room_invitation' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
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
                </Card>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
