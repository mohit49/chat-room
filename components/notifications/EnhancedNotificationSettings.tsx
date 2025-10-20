"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, TestTube, MessageCircle, Users, UserPlus, Mail, UserCheck } from 'lucide-react';
import { usePushNotifications } from '@/lib/contexts/PushNotificationContext';
import { useEnhancedNudge } from '@/lib/contexts/EnhancedNudgeContext';

export function EnhancedNotificationSettings() {
  const {
    isSupported: pushSupported,
    permission,
    isSubscribed,
    isInitialized,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission,
  } = usePushNotifications();

  const {
    showMessageNudge,
    showFollowNudge,
    showRoomNudge,
    showGeneralNudge,
    enablePushNotifications,
    disablePushNotifications,
    isPushEnabled
  } = useEnhancedNudge();

  const [testingNotification, setTestingNotification] = useState(false);
  const [savedPushEnabled, setSavedPushEnabled] = useState(true);  // Default to true
  const [loading, setLoading] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState({
    directMessages: true,
    roomMessages: true,
    follows: true,
    roomInvites: true
  });
  const [autoRequestedPermission, setAutoRequestedPermission] = useState(false);

  // Auto-request permission and subscribe on mount
  useEffect(() => {
    const autoEnableNotifications = async () => {
      if (!isInitialized) return;

      // If permission is default and not yet requested
      if (permission === 'default' && !autoRequestedPermission) {
        setAutoRequestedPermission(true);
        console.log('📱 Auto-requesting notification permission...');
        
        const perm = await requestPermission();
        if (perm === 'granted') {
          console.log('✅ Permission granted, subscribing...');
          const subscribed = await subscribe();
          if (subscribed) {
            await enablePushNotifications();
            await saveNotificationSettings({ pushEnabled: true });
          }
        }
      }
      
      // If permission already granted but not subscribed, auto-subscribe
      else if (permission === 'granted' && !isSubscribed && savedPushEnabled) {
        console.log('🔄 Permission granted but not subscribed. Auto-subscribing...');
        const subscribed = await subscribe();
        if (subscribed) {
          await enablePushNotifications();
        }
      }
    };

    autoEnableNotifications();
  }, [isInitialized, permission, isSubscribed, savedPushEnabled, autoRequestedPermission]);

  // Load saved notification settings from backend
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Use proper API base URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/notifications/push/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSavedPushEnabled(data.settings.pushEnabled !== false);  // Default true
          setNotificationPreferences({
            directMessages: data.settings.directMessages !== false,
            roomMessages: data.settings.roomMessages !== false,
            follows: data.settings.follows !== false,
            roomInvites: data.settings.roomInvites !== false
          });
          console.log('✅ Loaded notification settings:', data.settings);
          
          // If push was enabled but subscription is lost, try to re-subscribe
          if (data.settings.pushEnabled !== false && !isSubscribed && isInitialized) {
            if (permission === 'granted') {
              console.log('🔄 Settings say enabled but not subscribed. Re-subscribing...');
              await subscribe();
              await enablePushNotifications();
            } else if (permission === 'default') {
              console.log('📱 Settings say enabled but permission needed. Will request...');
              // Will be handled by auto-request effect
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const newPreferences = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(newPreferences);
    await saveNotificationSettings(newPreferences);
  };

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
      await disablePushNotifications();
      // Save to backend
      await saveNotificationSettings({ pushEnabled: false });
    } else {
      if (permission === 'default') {
        const newPermission = await requestPermission();
        if (newPermission === 'granted') {
          await subscribe();
          await enablePushNotifications();
          // Save to backend
          await saveNotificationSettings({ pushEnabled: true });
        }
      } else if (permission === 'granted') {
        await subscribe();
        await enablePushNotifications();
        // Save to backend
        await saveNotificationSettings({ pushEnabled: true });
      }
    }
  };

  const saveNotificationSettings = async (settings: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token found');
        return;
      }

      console.log('💾 Saving notification settings:', settings);

      // Use proper API base URL (port 3001)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      console.log('📡 API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/notifications/push/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notification settings saved to database:', data.settings);
        if (settings.pushEnabled !== undefined) {
          setSavedPushEnabled(settings.pushEnabled);
        }
      } else {
        // Log the error response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to save notification settings');
        console.error('❌ Status:', response.status);
        console.error('❌ Error:', errorData);
      }
    } catch (error) {
      console.error('❌ Failed to save notification settings:', error);
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const handleTestMessageNudge = async () => {
    setTestingNotification(true);
    await showMessageNudge(
      'test-user-id',
      'Test User',
      'This is a test message notification!',
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'test-user'
      },
      'test-room-id',
      'Test Room'
    );
    setTimeout(() => setTestingNotification(false), 2000);
  };

  const handleTestFollowNudge = async () => {
    setTestingNotification(true);
    await showFollowNudge(
      'test-follower-id',
      'Test Follower',
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'test-follower'
      }
    );
    setTimeout(() => setTestingNotification(false), 2000);
  };

  const handleTestRoomNudge = async () => {
    setTestingNotification(true);
    await showRoomNudge(
      'test-room-id',
      'Test Room',
      'Welcome to the test room!',
      'test-sender-id',
      'Test Sender'
    );
    setTimeout(() => setTestingNotification(false), 2000);
  };

  const handleTestGeneralNudge = async () => {
    setTestingNotification(true);
    await showGeneralNudge(
      'Test Notification',
      'This is a test general notification!'
    );
    setTimeout(() => setTestingNotification(false), 2000);
  };

  if (!pushSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Enhanced Notifications
        </CardTitle>
        <CardDescription>
          Manage both in-app nudges and push notifications for messages and updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Push Notifications</div>
            <div className="text-xs text-muted-foreground">
              {permission === 'granted' && (isSubscribed || savedPushEnabled)
                ? '✅ Push notifications are enabled and saved'
                : permission === 'denied'
                ? '❌ Push notifications are blocked in browser'
                : loading
                ? 'Loading settings...'
                : 'Click to enable push notifications'}
            </div>
          </div>
          <Switch
            checked={isSubscribed || savedPushEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={loading || !isInitialized || permission === 'denied'}
          />
        </div>

        {savedPushEnabled && !isSubscribed && permission === 'granted' && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">
              ⚠️ Push notifications are enabled in your settings but subscription is inactive. Click the toggle to reconnect.
            </p>
          </div>
        )}

        {permission === 'denied' && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">
              Push notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {/* Notification Preferences */}
        {(isSubscribed || savedPushEnabled) && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm font-medium">Notification Types</div>
            <div className="text-xs text-muted-foreground mb-3">
              Choose which notifications you want to receive
            </div>
            
            <div className="space-y-3">
              {/* Direct Messages */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="direct-messages" className="text-sm cursor-pointer">
                    Direct Messages
                  </Label>
                </div>
                <Switch
                  id="direct-messages"
                  checked={notificationPreferences.directMessages}
                  onCheckedChange={(checked) => handlePreferenceChange('directMessages', checked)}
                />
              </div>

              {/* Room Messages */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="room-messages" className="text-sm cursor-pointer">
                    Room Messages
                  </Label>
                </div>
                <Switch
                  id="room-messages"
                  checked={notificationPreferences.roomMessages}
                  onCheckedChange={(checked) => handlePreferenceChange('roomMessages', checked)}
                />
              </div>

              {/* Follows */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="follows" className="text-sm cursor-pointer">
                    New Followers
                  </Label>
                </div>
                <Switch
                  id="follows"
                  checked={notificationPreferences.follows}
                  onCheckedChange={(checked) => handlePreferenceChange('follows', checked)}
                />
              </div>

              {/* Room Invites */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="room-invites" className="text-sm cursor-pointer">
                    Room Invitations
                  </Label>
                </div>
                <Switch
                  id="room-invites"
                  checked={notificationPreferences.roomInvites}
                  onCheckedChange={(checked) => handlePreferenceChange('roomInvites', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Button (collapsed) */}
        <details className="pt-4 border-t">
          <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
            Test Notifications (Developer)
          </summary>
          <div className="mt-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={!isSubscribed || testingNotification}
              className="w-full flex items-center justify-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Send Test Push Notification
            </Button>
          </div>
        </details>

        {/* Status Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Status: {isInitialized ? '✅ Ready' : '⏳ Initializing...'}</div>
          <div>Permission: <span className="font-medium">{permission}</span></div>
          <div>Active Subscription: <span className="font-medium">{isSubscribed ? 'Yes' : 'No'}</span></div>
          <div>Saved in Profile: <span className="font-medium">{savedPushEnabled ? 'Enabled' : 'Disabled'}</span></div>
          <div>Service: {isPushEnabled() ? '✅ Active' : '⏸️ Inactive'}</div>
        </div>
      </CardContent>
    </Card>
  );
}
