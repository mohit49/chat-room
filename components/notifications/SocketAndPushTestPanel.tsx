"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Bell, MessageCircle } from 'lucide-react';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useEnhancedNudge } from '@/lib/contexts/EnhancedNudgeContext';

export function SocketAndPushTestPanel() {
  const { socket, connected, connectionConfirmed } = useSocket();
  const { showMessageNudge, isPushEnabled } = useEnhancedNudge();
  const [testMessage, setTestMessage] = useState('Hello! This is a test message.');

  const handleTestPushNotification = async () => {
    await showMessageNudge(
      'test-user-123',
      'Test User',
      testMessage,
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'test-user'
      }
    );
  };

  const handleTestRoomNotification = async () => {
    await showMessageNudge(
      'test-user-456',
      'Room User',
      testMessage,
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'room-user'
      },
      'test-room-123',
      'Test Room'
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Socket & Push Test Panel
        </CardTitle>
        <CardDescription>
          Test socket connection and push notifications for received messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Socket Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Socket Connection</h4>
            <Badge variant={connected ? "default" : "destructive"}>
              {connected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            {connectionConfirmed && (
              <Badge variant="secondary">Confirmed</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Socket ID: {socket?.id || 'Not connected'}
          </p>
        </div>

        {/* Push Notification Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Push Notifications</h4>
            <Badge variant={isPushEnabled() ? "default" : "secondary"}>
              <Bell className="h-3 w-3 mr-1" />
              {isPushEnabled() ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>

        {/* Test Message Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Message</label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
            rows={2}
            placeholder="Enter test message..."
          />
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestPushNotification}
            disabled={!isPushEnabled()}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Test Direct Message
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestRoomNotification}
            disabled={!isPushEnabled()}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Test Room Message
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Testing Steps:</strong></p>
          <p>1. Ensure socket is connected (green badge)</p>
          <p>2. Enable push notifications in settings</p>
          <p>3. Click test buttons to send notifications</p>
          <p>4. Check both in-app nudges and system notifications</p>
          <p>5. Test with app in background for push notifications</p>
        </div>
      </CardContent>
    </Card>
  );
}
