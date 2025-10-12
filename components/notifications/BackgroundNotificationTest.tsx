"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Bell, MessageCircle, Vibrate } from 'lucide-react';
import { useEnhancedNudge } from '@/lib/contexts/EnhancedNudgeContext';

export function BackgroundNotificationTest() {
  const { showMessageNudge, showRoomNudge, isPushEnabled } = useEnhancedNudge();
  const [testMessage, setTestMessage] = useState('Test message for background notification');
  const [isPWA, setIsPWA] = useState(false);

  React.useEffect(() => {
    // Check if running in PWA mode
    setIsPWA(typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  const handleTestBackgroundNotification = async () => {
    await showMessageNudge(
      'test-user-123',
      'Background Test User',
      testMessage,
      {
        type: 'avatar',
        avatarStyle: 'avataaars',
        seed: 'background-test'
      }
    );
  };

  const handleTestRoomBackgroundNotification = async () => {
    await showRoomNudge(
      'test-room-456',
      'Background Test Room',
      testMessage,
      'test-sender-789',
      'Background Sender'
    );
  };

  const handleTestVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    } else {
      alert('Vibration not supported on this device');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Background Notification Test
        </CardTitle>
        <CardDescription>
          Test notifications that appear on home screen when app is closed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isPWA ? "default" : "secondary"}>
            <Smartphone className="h-3 w-3 mr-1" />
            {isPWA ? 'PWA Mode' : 'Browser Mode'}
          </Badge>
          <Badge variant={isPushEnabled() ? "default" : "destructive"}>
            <Bell className="h-3 w-3 mr-1" />
            Push {isPushEnabled() ? 'Enabled' : 'Disabled'}
          </Badge>
          <Badge variant={'vibrate' in navigator ? "default" : "secondary"}>
            <Vibrate className="h-3 w-3 mr-1" />
            Vibration {'vibrate' in navigator ? 'Supported' : 'Not Supported'}
          </Badge>
        </div>

        {/* Test Message Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Message</label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
            rows={2}
            placeholder="Enter test message for background notification..."
          />
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestBackgroundNotification}
            disabled={!isPushEnabled()}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Test Direct Message
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestRoomBackgroundNotification}
            disabled={!isPushEnabled()}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Test Room Message
          </Button>
        </div>

        {/* Vibration Test */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestVibration}
          className="w-full flex items-center gap-2"
        >
          <Vibrate className="h-4 w-4" />
          Test Vibration
        </Button>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p><strong>Testing Background Notifications:</strong></p>
          <p>1. Ensure push notifications are enabled</p>
          <p>2. Click test buttons above</p>
          <p>3. Close the app completely (swipe away or close tab)</p>
          <p>4. Wait for notification to appear on home screen</p>
          <p>5. Notification should vibrate and be clickable</p>
          <p>6. Clicking notification should open the app</p>
        </div>

        {/* Troubleshooting */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p><strong>Troubleshooting:</strong></p>
          <p>• If notifications don't appear: Check browser notification permissions</p>
          <p>• If no vibration: Device may not support vibration or is in silent mode</p>
          <p>• If app doesn't open: Ensure PWA is properly installed</p>
          <p>• For iOS: Notifications work differently, may need to check Settings</p>
        </div>
      </CardContent>
    </Card>
  );
}
