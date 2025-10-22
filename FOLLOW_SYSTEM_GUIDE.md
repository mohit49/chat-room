# Follow/Unfollow Feature Documentation

## Overview
The follow/unfollow feature allows users to follow each other with an approval workflow. Users can send follow requests, receive notifications, and manage their connections.

## Features

### 1. Follow Request System
- Users can send follow requests to other users by clicking a "Follow" button
- The button dynamically changes state based on the relationship:
  - **Follow**: Initial state, click to send follow request
  - **Requested**: Follow request sent, waiting for approval (click to cancel)
  - **Following**: Request approved, now following (click to unfollow)

### 2. Notification System
- **Follow Request Notification**: When a user sends a follow request, the receiver gets a notification
- **Follow Accepted Notification**: When the receiver accepts the request, the sender gets a notification
- Both types of notifications appear as:
  - Real-time toast notifications
  - Socket.io events for instant updates
  - Persistent notifications in the notification center

### 3. Approval Workflow
- Follow requests require approval from the receiver
- Until approved, the relationship is in "pending" state
- Users can:
  - Accept follow requests
  - Reject follow requests
  - Cancel their own pending requests

### 4. Followers/Following Management
- View followers count and following count on profiles
- Click on the count to open a dialog showing:
  - **Followers Tab**: List of users following you
  - **Following Tab**: List of users you're following
- Each item shows:
  - User's profile picture
  - Username
  - Location
  - Unfollow button (for following tab only)

### 5. Unfollow Confirmation
- All unfollow actions require confirmation via a shadcn dialog
- Prevents accidental unfollows
- Applies to:
  - Unfollow button on user profiles
  - Unfollow button in the following list dialog

## Technical Implementation

### Backend Components

#### Models & Schemas
- **FollowRequest Model** (`server/models/follow.model.ts`)
  - Manages follow request operations
  - Status: pending, accepted, rejected, cancelled
  - Automatic expiration after 30 days

- **FollowRelationship Model** (`server/database/schemas/follow.schema.ts`)
  - Tracks active follow relationships
  - Prevents self-following
  - Indexed for efficient queries

#### API Endpoints
Base URL: `/api/user/follow`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:userId` | Send follow request to user |
| DELETE | `/:userId` | Unfollow user |
| DELETE | `/request/:userId` | Cancel pending follow request |
| POST | `/request/:requestId/accept` | Accept follow request |
| POST | `/request/:requestId/reject` | Reject follow request |
| GET | `/requests` | Get all pending follow requests |
| GET | `/status/:userId` | Get follow status with user |
| GET | `/followers/:userId` | Get list of followers |
| GET | `/following/:userId` | Get list of following |
| GET | `/counts/:userId` | Get follower/following counts |

#### Services
- **Follow Service** (`server/services/follow.service.ts`)
  - Business logic for follow operations
  - Creates notifications when requests are sent/accepted
  - Emits socket events for real-time updates

#### Notifications
- Integrated with existing notification system
- Types: `follow_request`, `follow_accepted`
- Stored in database and sent via socket

### Frontend Components

#### Core Components

1. **FollowButton** (`components/user/FollowButton.tsx`)
   - Smart button component with state management
   - Automatically fetches and updates follow status
   - Shows different states: Follow, Requested, Following
   - Includes unfollow confirmation dialog

2. **FollowListDialog** (`components/user/FollowListDialog.tsx`)
   - Modal dialog showing followers and following
   - Tabbed interface for switching between lists
   - Click on user to navigate to their profile
   - Unfollow button with confirmation for following list

3. **GlobalFollowListener** (`components/layout/GlobalFollowListener.tsx`)
   - Global socket event listener for follow events
   - Shows toast notifications for follow requests/acceptances
   - Automatically integrated in app layout

4. **UserActionButtons** (`components/user/UserActionButtons.tsx`)
   - Contains follow button, message button, and block button
   - Integrated in user profile pages

#### API Client
- **Follow API** (`lib/api/follow.ts`)
  - Type-safe API methods for all follow operations
  - Error handling and response typing

#### Socket Events
- **Event Types**:
  - `follow:request` - Emitted when someone sends you a follow request
  - `follow:accepted` - Emitted when someone accepts your follow request

### Database Schema

#### FollowRequest Collection
```typescript
{
  requesterId: string,      // User who sent the request
  receiverId: string,       // User who received the request
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled',
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date          // Auto-expires after 30 days
}
```

#### FollowRelationship Collection
```typescript
{
  followerId: string,      // User who is following
  followingId: string,     // User being followed
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Display Follow Button on User Profile
```tsx
import { FollowButton } from '@/components/user/FollowButton';

<FollowButton
  userId={user.id}
  username={user.username}
  onFollowStatusChange={(status) => {
    console.log('Follow status changed:', status);
  }}
/>
```

### Display Followers/Following Dialog
```tsx
import { FollowListDialog } from '@/components/user/FollowListDialog';

<FollowListDialog
  userId={user.id}
  followerCount={followCounts.followers}
  followingCount={followCounts.following}
/>
```

### Get Follow Status
```typescript
import { getFollowStatus } from '@/lib/api/follow';

const status = await getFollowStatus(userId);
console.log(status);
// {
//   isFollowing: boolean,
//   isFollowedBy: boolean,
//   followRequestSent: boolean,
//   followRequestReceived: boolean
// }
```

### Listen to Follow Events
```tsx
import { useSocketEvents } from '@/hooks/useSocketEvents';

useSocketEvents({
  onFollowRequest: (data) => {
    console.log('New follow request:', data);
    // Handle follow request notification
  },
  onFollowAccepted: (data) => {
    console.log('Follow request accepted:', data);
    // Handle acceptance notification
  }
}, 'MyComponent');
```

## UI/UX Flow

### Sending a Follow Request
1. User A visits User B's profile
2. User A clicks "Follow" button
3. Button changes to "Requested" state
4. User B receives real-time notification
5. User B can accept or reject the request

### Accepting a Follow Request
1. User B receives notification
2. User B clicks notification or goes to notification center
3. User B clicks "Accept" on the follow request
4. Follow relationship is created
5. User A receives "Follow request accepted" notification
6. User A's button changes to "Following" state

### Unfollowing a User
1. User A clicks "Following" button or unfollow in list
2. Confirmation dialog appears
3. User A confirms unfollow action
4. Follow relationship is deleted
5. Button returns to "Follow" state

## Security Features

- All endpoints require authentication
- Users cannot follow themselves
- Follow requests are unique per user pair
- Automatic expiration of pending requests (30 days)
- Authorization checks for accepting/rejecting requests

## Performance Optimizations

- Indexed database queries for fast lookups
- Efficient socket event broadcasting
- Real-time status updates without page refresh
- Optimistic UI updates for better UX

## Installation

### Install Required Dependencies
```bash
npm install @radix-ui/react-toast
```

### Database Indexes
The follow schema automatically creates indexes for:
- `requesterId` and `receiverId` (unique compound)
- `receiverId` and `status`
- `followerId` and `followingId` (unique compound)
- `status` and `createdAt`

## Testing

### Test Follow Workflow
1. Create two test users
2. Log in as User A
3. Visit User B's profile
4. Click "Follow" button
5. Log in as User B
6. Check notifications for follow request
7. Accept the request
8. Log back in as User A
9. Verify "Following" button state
10. Test unfollow functionality

### Test Socket Events
1. Open two browser windows/tabs
2. Log in as different users
3. Send follow request from one user
4. Verify real-time notification on other user's tab
5. Accept request and verify notification on sender's tab

## Troubleshooting

### Follow Button Not Updating
- Check socket connection status
- Verify authentication token is valid
- Check browser console for errors
- Ensure GlobalFollowListener is mounted

### Notifications Not Appearing
- Verify socket connection is established
- Check that notification settings allow follow notifications
- Ensure push notification permissions are granted
- Check browser console for socket errors

### Follow Count Not Accurate
- Refresh the page to fetch latest counts
- Check database for orphaned relationships
- Verify follow service is correctly updating relationships

## Future Enhancements

- Private/public follow settings
- Follow request limits to prevent spam
- Mutual following indicators
- Follow suggestions based on mutual connections
- Bulk follow/unfollow operations
- Follow analytics and insights


