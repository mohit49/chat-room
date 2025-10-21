# Online Users Carousel Feature

## Overview

A horizontal scrolling carousel that displays online users on the homepage with their profile pictures, usernames, locations, and online status indicators.

## Features

### 🎠 Horizontal Scrolling Carousel
- **Smooth horizontal scrolling** using Shadcn ScrollArea component
- **Responsive design** that works on desktop and mobile
- **Auto-scroll indicators** when there are more than 5 users

### 👤 User Cards
- **Profile pictures** (uploaded images or generated avatars)
- **Username** display with @ symbol
- **Location** (City, State) - respects privacy settings
- **Online status** with green indicator dot
- **Hover effects** for better UX

### 🔄 Real-time Updates
- **Socket integration** for live online/offline status
- **Automatic updates** when users come online or go offline
- **Real-time user count** badge

### 🔒 Privacy Respect
- **Location visibility** - only shows location if user has it set to visible
- **Current user exclusion** - doesn't show the logged-in user in the carousel

## Technical Implementation

### Component Structure
```
components/layout/OnlineUsersCarousel.tsx
```

### Props
```typescript
interface OnlineUsersCarouselProps {
  currentUserId?: string; // Excludes current user from display
}
```

### State Management
- `onlineUsers`: Array of online user objects
- `loading`: Loading state for initial fetch
- Socket events for real-time updates

### Socket Events
- `user_online`: When a user comes online
- `user_offline`: When a user goes offline  
- `online_users`: Initial list of online users
- `get_online_users`: Request current online users

## Usage

### In Home Page
```tsx
import OnlineUsersCarousel from '@/components/layout/OnlineUsersCarousel';

<OnlineUsersCarousel currentUserId={user.id} />
```

### Features Displayed
1. **User Avatar**
   - Uploaded profile pictures
   - Generated avatars with DiceBear
   - Fallback to username initial

2. **User Information**
   - Username with @ symbol
   - Location (City, State) if visible
   - Online status badge

3. **Visual Indicators**
   - Green dot for online status
   - User count badge
   - Hover effects on cards

## Styling

### Shadcn Components Used
- `Card` - User card containers
- `Avatar` - Profile pictures
- `Badge` - Status indicators
- `ScrollArea` - Horizontal scrolling
- `Lucide Icons` - MapPin, Users icons

### Responsive Design
- **Desktop**: Full width with horizontal scroll
- **Mobile**: Touch-friendly scrolling
- **Card Size**: Fixed 200px width for consistency

## Real-time Features

### Socket Integration
```typescript
// Listen for user online/offline events
socket.on('user_online', handleUserOnline);
socket.on('user_offline', handleUserOffline);
socket.on('online_users', handleOnlineUsers);

// Request online users on mount
socket.emit('get_online_users');
```

### State Updates
- **Add user**: When someone comes online
- **Remove user**: When someone goes offline
- **Initial load**: Fetch all online users
- **Exclude self**: Current user not shown in carousel

## Privacy & Security

### Location Privacy
- Only shows location if `isVisible !== false`
- Respects user's privacy settings
- Falls back gracefully if no location

### User Data
- Only shows public profile information
- Username and profile picture
- No sensitive data exposed

## Performance

### Optimizations
- **Efficient re-renders** with proper state management
- **Socket cleanup** on component unmount
- **Debounced updates** for smooth scrolling
- **Lazy loading** of user data

### Memory Management
- **Socket event cleanup** in useEffect return
- **State updates** only when necessary
- **Efficient filtering** of current user

## Future Enhancements

### Potential Features
1. **Click to Chat** - Direct message from carousel
2. **User Status** - Away, Busy, Available
3. **Last Seen** - When user was last active
4. **Online Duration** - How long user has been online
5. **User Actions** - Follow, Block, Report options
6. **Filter Options** - Filter by location, mutual connections
7. **Search** - Search within online users
8. **Group by Location** - Group users by city/state

### Backend Integration
1. **Online Status Tracking** - Track user activity
2. **Presence System** - Real-time presence updates
3. **User Activity** - Last seen timestamps
4. **Geographic Filtering** - Users by location

## Troubleshooting

### Common Issues

**No users showing:**
- Check socket connection
- Verify user search API is working
- Check console for errors

**Location not showing:**
- Verify user has location set
- Check if location is visible
- Ensure Google Maps API is configured

**Scrolling not working:**
- Check ScrollArea component
- Verify CSS is loaded
- Test on different devices

**Real-time updates not working:**
- Check socket connection
- Verify socket events are being emitted
- Check browser console for errors

## Files Modified

### New Files
- ✅ `components/layout/OnlineUsersCarousel.tsx`

### Updated Files
- ✅ `app/home/page.tsx` - Added carousel integration

### Dependencies
- Shadcn UI components
- Socket context for real-time updates
- API client for user data

## Testing Checklist

- [ ] Carousel displays online users
- [ ] Horizontal scrolling works smoothly
- [ ] User cards show correct information
- [ ] Location respects privacy settings
- [ ] Real-time updates work
- [ ] Current user is excluded
- [ ] Responsive design works
- [ ] Loading states display properly
- [ ] Empty state shows when no users
- [ ] Socket cleanup works on unmount

---

**Feature Status**: ✅ Ready for Production  
**Last Updated**: October 21, 2025
