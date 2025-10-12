"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, UserPlus, Users, Bell } from 'lucide-react';
import { useNudgeNotifications } from '@/hooks/useNudgeNotifications';

export function NudgeTestPanel() {
  const {
    notifyNewMessage,
    notifyNewFollower,
    notifyRoomActivity,
    notifyGeneral,
    enablePush,
    disablePush,
    isPushEnabled
  } = useNudgeNotifications();

  const handleTestMessage = async () => {
    await notifyNewMessage(
      'test-user-123',
      'John Doe',
      'Hey! How are you doing?',
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'john-doe'
      },
      'room-456',
      'General Chat'
    );
  };

  const handleTestDirectMessage = async () => {
    await notifyNewMessage(
      'test-user-789',
      'Jane Smith',
      'Can we meet tomorrow?',
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'jane-smith'
      }
    );
  };

  const handleTestFollower = async () => {
    await notifyNewFollower(
      'follower-123',
      'New User',
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'new-user'
      }
    );
  };

  const handleTestRoomActivity = async () => {
    await notifyRoomActivity(
      'room-789',
      'Tech Discussion',
      'New topic: React vs Vue',
      'user-456',
      'Tech Lead'
    );
  };

  const handleTestGeneral = async () => {
    await notifyGeneral(
      'System Update',
      'New features have been added to the chat app!'
    );
  };

  const handleTogglePush = async () => {
    if (isPushEnabled()) {
      await disablePush();
    } else {
      await enablePush();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Test Enhanced Notifications
        </CardTitle>
        <CardDescription>
          Test different types of notifications with both in-app nudges and push notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestMessage}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Room Message
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestDirectMessage}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Direct Message
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestFollower}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            New Follower
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestRoomActivity}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Room Activity
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestGeneral}
          className="w-full flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          General Notification
        </Button>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Push Notifications</span>
            <Button
              variant={isPushEnabled() ? "destructive" : "default"}
              size="sm"
              onClick={handleTogglePush}
            >
              {isPushEnabled() ? 'Disable' : 'Enable'} Push
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Status: {isPushEnabled() ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
