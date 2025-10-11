'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { APP_HEADER_CONFIGS } from '@/lib/config/app-header';
import AppHeader from '@/components/layout/AppHeader';
import { api } from '@/lib/api';
import { Notification } from '@/lib/api/notification';
import { Check, X, Trash2, Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      setLoading(true);
      const response = await api.getNotifications(20, pageNum * 20) as any;
      if (response.success) {
        if (reset) {
          setNotifications(response.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.notifications]);
        }
        setHasMore(response.notifications.length === 20);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read' as const }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'read' as const }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleApproveInvitation = async (notificationId: string) => {
    try {
      const response = await api.approveInvitation(notificationId) as any;
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'approved' as const }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error approving invitation:', error);
    }
  };

  const handleRejectInvitation = async (notificationId: string) => {
    try {
      const response = await api.rejectInvitation(notificationId) as any;
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'rejected' as const }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleRoomInvitationClick = (notification: Notification) => {
    // Redirect to the specific room page for room invitations
    if (notification.roomId) {
      router.push(`/rooms/${notification.roomId}`);
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
      default:
        return '📢';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'approved':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'read':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'unread':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'room_invitation':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'room_approved':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'room_rejected':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'room_removed':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'role_changed':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 lg:py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <AppHeader
          {...APP_HEADER_CONFIGS.notifications}
        />

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.status === 'read')}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You don't have any notifications yet. When someone invites you to a room or updates your role, you'll see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all hover:shadow-md ${
                  notification.status === 'unread' ? 'ring-2 ring-primary/20' : ''
                } ${
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
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-muted-foreground mb-3">
                            {notification.message}
                          </p>
                        </div>
                        
                        {/* Status and Type Badges */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Badge className={getStatusColor(notification.status)}>
                            {notification.status}
                          </Badge>
                          <Badge variant="outline" className={getTypeColor(notification.type)}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Sender Info */}
                      {notification.sender && (
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                notification.sender.profile?.profilePicture?.type === 'upload'
                                  ? notification.sender.profile.profilePicture.url
                                  : notification.sender.profile?.profilePicture?.type === 'avatar'
                                  ? `https://api.dicebear.com/7.x/${notification.sender.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${notification.sender.profile.profilePicture.seed || notification.sender.username}`
                                  : undefined
                              }
                            />
                            <AvatarFallback className="text-xs">
                              {notification.sender.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            from @{notification.sender.username}
                          </span>
                        </div>
                      )}

                      {/* Room Info */}
                      {notification.room && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {notification.room.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Room: {notification.room.name} ({notification.room.roomId})
                          </span>
                        </div>
                      )}

                      {/* Timestamp and Actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {/* Action Buttons */}
                          {notification.type === 'room_invitation' && notification.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleRoomInvitationClick(notification)}
                              className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                            >
                              View Details →
                            </Button>
                          )}
                          
                          {notification.type !== 'room_invitation' && notification.status === 'unread' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-8 px-3"
                            >
                              Mark Read
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-8 px-3 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
