# PWA Implementation Guide

## Overview
This chat app now includes Progressive Web App (PWA) functionality with push notifications and an install prompt.

## Features Implemented

### 1. PWA Configuration
- **Manifest File**: `/public/manifest.json` - Defines app metadata, icons, and display settings
- **Service Worker**: `/public/sw.js` - Handles offline functionality and push notifications
- **Offline Page**: `/public/offline.html` - Shows when the app is offline

### 2. Install Prompt
- **Component**: `components/pwa/PWAInstallPrompt.tsx` - Beautiful install prompt using shadcn UI
- **Manager**: `components/pwa/PWAManager.tsx` - Handles install prompt logic and timing
- **Features**:
  - Shows after 3 seconds on first visit
  - Remembers dismissal for 7 days
  - Different instructions for iOS vs Android/Desktop
  - Smooth animations and modern UI

### 3. Push Notifications
- **Service**: `lib/services/pushNotificationService.ts` - Core push notification functionality
- **Context**: `lib/contexts/PushNotificationContext.tsx` - React context for push notifications
- **Settings**: `components/notifications/NotificationSettings.tsx` - User settings component
- **Features**:
  - Permission handling
  - Subscription management
  - Test notifications
  - Server integration ready

### 4. Offline Support
- **Caching**: Static assets are cached for offline access
- **Background Sync**: Messages can be queued when offline
- **Fallback**: Offline page shown when network is unavailable

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` files:

```env
# For push notifications (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_EMAIL=your_email@example.com
```

### 2. Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

### 3. Server Integration
The push notification service is ready for server integration. You'll need to:

1. Install web-push on your server:
```bash
npm install web-push
```

2. Add push notification endpoints to your server:
```javascript
// Example server endpoint
app.post('/api/notifications/subscribe', async (req, res) => {
  const { subscription } = req.body;
  // Store subscription in database
  // Associate with user
});

app.post('/api/notifications/send', async (req, res) => {
  const { userId, message } = req.body;
  // Get user's subscription
  // Send push notification
});
```

### 4. Icons
Replace the placeholder SVG icons with actual PNG icons:
- `/public/icon-192x192.png` (192x192px)
- `/public/icon-512x512.png` (512x512px)

## Usage

### Install Prompt
The install prompt will automatically appear for eligible users. It includes:
- Cross-platform support (iOS, Android, Desktop)
- Smart timing (shows after 3 seconds)
- Dismissal memory (won't show again for 7 days)
- Beautiful shadcn UI design

### Push Notifications
Users can manage notifications in their profile settings:
1. Go to Profile page
2. Scroll to "Notification Settings"
3. Toggle notifications on/off
4. Test notifications

### Offline Mode
The app automatically:
- Caches static assets
- Shows offline page when disconnected
- Queues messages for later sending
- Syncs when connection is restored

## Testing

### Local Testing
1. Start the development server: `npm run dev`
2. Open Chrome DevTools
3. Go to Application tab
4. Check Service Workers and Manifest
5. Test install prompt and notifications

### Production Testing
1. Deploy to HTTPS domain
2. Test on mobile devices
3. Verify install prompts work
4. Test push notifications

## Browser Support
- **Chrome/Edge**: Full PWA support
- **Firefox**: Basic PWA support
- **Safari**: Limited PWA support (iOS 11.3+)
- **Mobile**: Excellent support on Android, good on iOS

## Troubleshooting

### Install Prompt Not Showing
- Ensure HTTPS in production
- Check browser console for errors
- Verify manifest.json is accessible
- Clear browser cache

### Push Notifications Not Working
- Check VAPID keys are set correctly
- Verify service worker is registered
- Check browser notification permissions
- Ensure server endpoints are implemented

### Offline Mode Issues
- Check service worker registration
- Verify caching strategy
- Check network tab in DevTools
- Ensure offline.html is accessible

## Next Steps
1. Replace placeholder icons with actual app icons
2. Implement server-side push notification endpoints
3. Add more sophisticated offline caching
4. Customize install prompt messaging
5. Add analytics for PWA usage
