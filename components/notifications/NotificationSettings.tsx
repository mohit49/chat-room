"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { usePushNotifications } from '@/lib/contexts/PushNotificationContext';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isInitialized,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission,
  } = usePushNotifications();

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      if (permission === 'default') {
        const newPermission = await requestPermission();
        if (newPermission === 'granted') {
          await subscribe();
        }
      } else if (permission === 'granted') {
        await subscribe();
      }
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  if (!isSupported) {
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
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive notifications for new messages and updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Enable Notifications</div>
            <div className="text-xs text-muted-foreground">
              {permission === 'granted' && isSubscribed
                ? 'Notifications are enabled'
                : permission === 'denied'
                ? 'Notifications are blocked'
                : 'Click to enable notifications'}
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
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {isSubscribed && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="flex-1"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Notification
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Status: {isInitialized ? 'Ready' : 'Initializing...'} • 
          Permission: {permission} • 
          Subscribed: {isSubscribed ? 'Yes' : 'No'}
        </div>
      </CardContent>
    </Card>
  );
}
