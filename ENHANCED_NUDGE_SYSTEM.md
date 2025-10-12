# Enhanced Nudge System with PWA Push Notifications

## Overview
The enhanced nudge system integrates your existing in-app notification nudges with PWA push notifications, providing a seamless notification experience across both in-app and system-level notifications.

## Features

### 🎯 Dual Notification System
- **In-App Nudges**: Beautiful slide-in notifications within the app
- **Push Notifications**: System-level notifications when app is not active
- **Smart Integration**: Automatically shows both or either based on user preferences

### 📱 Notification Types
- **Message Notifications**: New messages in rooms or direct messages
- **Follow Notifications**: New followers
- **Room Notifications**: Room activities and updates
- **General Notifications**: System announcements and updates

### 🔧 Advanced Features
- **User Control**: Enable/disable push notifications per user
- **Smart Timing**: Prevents notification spam
- **Rich Content**: Supports avatars, actions, and custom data
- **Cross-Platform**: Works on iOS, Android, and Desktop

## Implementation

### 1. Enhanced Nudge Service
The core service that bridges in-app nudges with push notifications:

```typescript
import { enhancedNudgeService } from '@/lib/services/enhancedNudgeService';

// Show a message notification (both in-app and push)
await enhancedNudgeService.showMessageNudge(
  'user-123',
  'John Doe',
  'Hey! How are you?',
  { type: 'avatar', avatarStyle: 'avataaars', seed: 'john' },
  'room-456',
  'General Chat'
);
```

### 2. Enhanced Nudge Context
React context for managing notifications throughout the app:

```typescript
import { useEnhancedNudge } from '@/lib/contexts/EnhancedNudgeContext';

const { showMessageNudge, enablePushNotifications } = useEnhancedNudge();

// Enable push notifications
await enablePushNotifications();

// Show notification
await showMessageNudge('user-123', 'John', 'Hello!');
```

### 3. Custom Hook
Simplified hook for easy notification management:

```typescript
import { useNudgeNotifications } from '@/hooks/useNudgeNotifications';

const { notifyNewMessage, notifyNewFollower } = useNudgeNotifications();

// Notify new message
await notifyNewMessage('user-123', 'John', 'Hello!');

// Notify new follower
await notifyNewFollower('user-456', 'Jane');
```

## Usage Examples

### Message Notifications
```typescript
// Room message
await notifyNewMessage(
  'sender-id',
  'Sender Name',
  'Message content',
  { type: 'avatar', avatarStyle: 'avataaars', seed: 'sender' },
  'room-id',
  'Room Name'
);

// Direct message
await notifyNewMessage(
  'sender-id',
  'Sender Name',
  'Message content',
  { type: 'avatar', avatarStyle: 'avataaars', seed: 'sender' }
);
```

### Follow Notifications
```typescript
await notifyNewFollower(
  'follower-id',
  'Follower Name',
  { type: 'avatar', avatarStyle: 'avataaars', seed: 'follower' }
);
```

### Room Notifications
```typescript
await notifyRoomActivity(
  'room-id',
  'Room Name',
  'Activity message',
  'sender-id',
  'Sender Name'
);
```

### General Notifications
```typescript
await notifyGeneral(
  'Notification Title',
  'Notification message',
  { customData: 'value' }
);
```

## Integration with Socket Events

### Example: Real-time Message Notifications
```typescript
// In your socket event handler
socket.on('newMessage', async (data) => {
  const { senderId, senderUsername, message, roomId, roomName, senderProfilePicture } = data;
  
  // Show notification (both in-app and push)
  await notifyNewMessage(
    senderId,
    senderUsername,
    message,
    senderProfilePicture,
    roomId,
    roomName
  );
});
```

### Example: Follow Notifications
```typescript
socket.on('newFollower', async (data) => {
  const { followerId, followerUsername, followerProfilePicture } = data;
  
  await notifyNewFollower(
    followerId,
    followerUsername,
    followerProfilePicture
  );
});
```

## User Settings

### Enhanced Notification Settings Component
The `EnhancedNotificationSettings` component provides:
- Push notification toggle
- Test buttons for different notification types
- Status information
- Permission management

### User Control Flow
1. User goes to Profile page
2. Scrolls to "Enhanced Notifications" section
3. Toggles push notifications on/off
4. Tests different notification types
5. Settings are automatically saved

## Testing

### Test Panel
The `NudgeTestPanel` component provides buttons to test:
- Room messages
- Direct messages
- Follow notifications
- Room activities
- General notifications
- Push notification toggle

### Testing Steps
1. Go to Profile page
2. Scroll to "Test Enhanced Notifications"
3. Click different test buttons
4. Verify both in-app nudges and push notifications work
5. Test with app in background/foreground

## Configuration

### Environment Variables
```env
# VAPID keys for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com
```

### Service Worker Integration
The enhanced nudge system automatically integrates with the existing service worker:
- Handles push notification display
- Manages notification clicks
- Provides offline support

## Best Practices

### 1. Notification Timing
- Don't spam users with too many notifications
- Use smart grouping for similar notifications
- Respect user's notification preferences

### 2. Content Guidelines
- Keep titles short and descriptive
- Use clear, actionable messages
- Include relevant user/room information

### 3. User Experience
- Always provide both in-app and push options
- Allow users to customize notification types
- Test on different devices and browsers

## Troubleshooting

### Common Issues

1. **Push Notifications Not Working**
   - Check VAPID keys are set correctly
   - Verify service worker is registered
   - Check browser notification permissions

2. **In-App Nudges Not Showing**
   - Verify enhanced nudge context is properly wrapped
   - Check for JavaScript errors in console
   - Ensure notification data is valid

3. **Notifications Not Clickable**
   - Check notification click handlers
   - Verify navigation logic
   - Test on different browsers

### Debug Mode
Enable debug logging by adding to your environment:
```env
DEBUG_NUDGES=true
```

## Migration from Old System

### Step 1: Replace Old Nudge Context
```typescript
// Old
import { useNudge } from '@/lib/contexts/NudgeContext';

// New
import { useEnhancedNudge } from '@/lib/contexts/EnhancedNudgeContext';
```

### Step 2: Update Notification Calls
```typescript
// Old
showNudge({
  type: 'message',
  title: 'New Message',
  message: 'Hello!',
  senderId: 'user-123'
});

// New
await showMessageNudge('user-123', 'John', 'Hello!');
```

### Step 3: Add Push Notification Support
```typescript
// Enable push notifications
await enablePushNotifications();
```

## Production Checklist

- [ ] Replace test panel with production notification settings
- [ ] Configure VAPID keys for production
- [ ] Test on multiple devices and browsers
- [ ] Set up server-side push notification endpoints
- [ ] Configure notification analytics
- [ ] Test offline functionality
- [ ] Verify notification permissions flow

## Future Enhancements

1. **Rich Notifications**: Support for images and media
2. **Notification Scheduling**: Delayed and scheduled notifications
3. **User Preferences**: Granular notification type controls
4. **Analytics**: Track notification engagement
5. **A/B Testing**: Test different notification formats
6. **Localization**: Multi-language notification support
