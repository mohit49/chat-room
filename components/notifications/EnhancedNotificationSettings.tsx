"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, TestTube, MessageCircle, Users, UserPlus } from 'lucide-react';
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

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
      await disablePushNotifications();
    } else {
      if (permission === 'default') {
        const newPermission = await requestPermission();
        if (newPermission === 'granted') {
          await subscribe();
          await enablePushNotifications();
        }
      } else if (permission === 'granted') {
        await subscribe();
        await enablePushNotifications();
      }
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
              {permission === 'granted' && isSubscribed
                ? 'Push notifications are enabled'
                : permission === 'denied'
                ? 'Push notifications are blocked'
                : 'Click to enable push notifications'}
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={!isInitialized || permission === 'denied'}
          />
        </div>

        {permission === 'denied' && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">
              Push notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {/* Test Notifications */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Test Notifications</div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={!isSubscribed || testingNotification}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Basic Push
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestMessageNudge}
              disabled={testingNotification}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestFollowNudge}
              disabled={testingNotification}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Follow
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestRoomNudge}
              disabled={testingNotification}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Room
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestGeneralNudge}
            disabled={testingNotification}
            className="w-full flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            General Notification
          </Button>
        </div>

        {/* Status Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Status: {isInitialized ? 'Ready' : 'Initializing...'}</div>
          <div>Permission: {permission}</div>
          <div>Push Subscribed: {isSubscribed ? 'Yes' : 'No'}</div>
          <div>Enhanced Service: {isPushEnabled() ? 'Enabled' : 'Disabled'}</div>
        </div>
      </CardContent>
    </Card>
  );
}
