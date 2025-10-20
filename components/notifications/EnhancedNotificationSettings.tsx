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

  // Auto-request permission on mount if default
  useEffect(() => {
    if (!autoRequestedPermission && isInitialized && permission === 'default') {
      setAutoRequestedPermission(true);
      // Auto-request permission and subscribe
      requestPermission().then(async (perm) => {
        if (perm === 'granted') {
          await subscribe();
          await enablePushNotifications();
          await saveNotificationSettings({ pushEnabled: true });
        }
      });
    }
  }, [isInitialized, permission, autoRequestedPermission]);

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

      const response = await fetch('/api/notifications/push/settings', {
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
          if (data.settings.pushEnabled && !isSubscribed && isInitialized && permission === 'granted') {
            console.log('🔄 Re-subscribing to push notifications...');
            await subscribe();
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
      if (!token) return;

      const response = await fetch('/api/notifications/push/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notification settings saved to database:', data.settings);
        if (settings.pushEnabled !== undefined) {
          setSavedPushEnabled(settings.pushEnabled);
        }
      } else {
        console.error('❌ Failed to save notification settings');
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
