# Comprehensive Block System

A fully functional blocking system similar to social media platforms like Twitter, Instagram, and Facebook.

## Features

### 🚫 When You Block Someone

1. **Profile Restrictions**
   - Blocked users cannot view your profile
   - You cannot view blocked users' profiles
   - Attempting to access returns "This profile is not available"

2. **Messaging Restrictions**
   - Cannot send messages to blocked users
   - Blocked users cannot send messages to you
   - Existing conversations remain but cannot be continued

3. **Follow Relationships**
   - All follow relationships are automatically removed (both ways)
   - Blocked users cannot follow you
   - You cannot follow blocked users

4. **Search & Discovery**
   - Blocked users are filtered from search results
   - You won't appear in their search results
   - Mutual invisibility in the app

5. **Notifications**
   - No notifications from blocked users
   - Blocked users don't receive your notifications

## API Endpoints

### Backend Routes (`/user/block`)

```typescript
POST   /user/block/:userId           // Block a user
DELETE /user/block/:userId           // Unblock a user
GET    /user/block                   // Get list of blocked users
GET    /user/block/check/:userId     // Check if a user is blocked
GET    /user/block/status/:userId    // Check block status (both ways)
```

### Frontend API Methods

```typescript
import { blockUser, unblockUser, checkBlockStatus, getBlockedUsers } from '@/lib/api/block';

// Block a user
await blockUser(userId);

// Unblock a user
await unblockUser(userId);

// Check block status (both ways)
const { isBlocked, isBlockedBy } = await checkBlockStatus(userId);

// Get all blocked users
const blockedUsers = await getBlockedUsers();
```

## Usage in Components

### UserActionButtons

The `UserActionButtons` component automatically checks and enforces block status:

```tsx
<UserActionButtons
  targetUserId={userId}
  targetUsername={username}
  onMessageClick={handleMessage}
/>
```

**Features:**
- Fetches block status on mount
- Shows "This user has restricted their profile" if blocked by them
- Hides message and follow buttons when blocked
- Shows Block/Unblock button with appropriate styling
- Toast notifications for block actions

## Implementation Details

### Backend Enforcement

#### 1. Profile Viewing (`user.controller.ts`)
```typescript
// Checks block status before returning profile
const [isBlocked, isBlockedBy] = await Promise.all([
  blockService.isUserBlocked(requesterId, id),
  blockService.isUserBlocked(id, requesterId)
]);

if (isBlocked || isBlockedBy) {
  return res.status(403).json({
    success: false,
    error: 'This profile is not available'
  });
}
```

#### 2. Search Results (`user.controller.ts`)
```typescript
// Filters out blocked users from search results
const filteredUsers = await Promise.all(
  users.map(async (user) => {
    const [isBlocked, isBlockedBy] = await Promise.all([
      blockService.isUserBlocked(requesterId, user.id),
      blockService.isUserBlocked(user.id, requesterId)
    ]);
    
    if (isBlocked || isBlockedBy) return null;
    return user;
  })
);
```

#### 3. Direct Messaging (`directMessage.controller.ts`)
```typescript
// Prevents messaging blocked users
const [isBlocked, isBlockedBy] = await Promise.all([
  blockService.isUserBlocked(senderId, receiverId),
  blockService.isUserBlocked(receiverId, senderId)
]);

if (isBlocked || isBlockedBy) {
  return res.status(403).json({
    success: false,
    error: 'You cannot send messages to this user'
  });
}
```

#### 4. Follow Relationship Cleanup (`block.service.ts`)
```typescript
// Automatically removes follow relationships when blocking
await FollowRelationshipModel.deleteMany({
  $or: [
    { followerId: blockerId, followingId: blockedUserId },
    { followerId: blockedUserId, followingId: blockerId }
  ]
});
```

### Frontend Components

#### UserActionButtons Component
- **Block Status Check**: Automatically fetches block status on mount
- **Conditional Rendering**: Shows appropriate UI based on block state
- **Toast Notifications**: User-friendly feedback for block actions
- **Loading States**: Proper loading indicators during API calls

#### User Profile Page
- **Block Integration**: Uses UserActionButtons component
- **Graceful Handling**: Shows appropriate error messages

## UI/UX Features

### Visual Indicators

1. **Blocked User View**
   ```
   🛡️ This user has restricted their profile
   ```

2. **Block Button States**
   - **Not Blocked**: Red "Block" button
   - **Blocked**: Gray "Unblock" button outline

3. **Hidden Elements When Blocked**
   - Message button
   - Follow button
   - Profile information (if viewing blocked user's profile)

### Toast Notifications

- **On Block**: "User blocked. They can no longer interact with you."
- **On Unblock**: "You have unblocked @username"
- **On Error**: "Failed to update block status"

## Database Schema

### Block Model (`block.schema.ts`)

```typescript
{
  blockerId: ObjectId,      // User who blocked
  blockedUserId: ObjectId,  // User who is blocked
  reason?: string,          // Optional reason
  createdAt: Date,         // When block was created
  updatedAt: Date          // Last updated
}
```

### Indexes
- `{ blockerId: 1, blockedUserId: 1 }` - Unique index
- `{ blockedUserId: 1 }` - For reverse lookups

## Security Considerations

1. **Bidirectional Checks**: Always check both directions (A blocked B, B blocked A)
2. **Server-Side Enforcement**: All restrictions enforced on backend
3. **403 Status Codes**: Used for blocked access attempts
4. **Generic Error Messages**: Don't reveal if someone blocked you
5. **No Data Leakage**: Blocked users get no information about blocker

## Performance Optimizations

1. **Parallel Checks**: Block status checked in parallel using `Promise.all()`
2. **Database Indexes**: Optimized queries with proper indexes
3. **Caching**: Frontend caches block status to reduce API calls
4. **Lazy Loading**: Block checks only when needed

## Testing the Block System

### Manual Testing Checklist

1. ✅ **Profile Access**
   - [ ] Block user → Cannot view their profile
   - [ ] They cannot view your profile
   - [ ] Shows "profile not available" message

2. ✅ **Messaging**
   - [ ] Cannot send messages to blocked user
   - [ ] Blocked user cannot send messages to you
   - [ ] Shows appropriate error

3. ✅ **Search**
   - [ ] Blocked users don't appear in search
   - [ ] You don't appear in their search

4. ✅ **Follow System**
   - [ ] Follow relationships removed on block
   - [ ] Cannot follow blocked users
   - [ ] Blocked users cannot follow you

5. ✅ **Unblock**
   - [ ] Can unblock user
   - [ ] Can view profile after unblock
   - [ ] Can message after unblock
   - [ ] Appears in search after unblock

## Common Issues & Solutions

### Issue: "Block button not showing"
**Solution**: Ensure you're not viewing your own profile. The component hides itself for self-profiles.

### Issue: "Can still see blocked user in old data"
**Solution**: Some cached data may persist. Refresh the page or clear browser cache.

### Issue: "Follow count not updated after block"
**Solution**: The backend removes relationships. Frontend will update on next profile visit.

## Future Enhancements

- [ ] Block lists management page
- [ ] Bulk block/unblock operations
- [ ] Block expiry (temporary blocks)
- [ ] Report user before blocking
- [ ] Block analytics for admins
- [ ] Soft delete vs hard delete conversations

## Related Files

### Backend
- `server/models/block.model.ts` - Block database operations
- `server/services/block.service.ts` - Block business logic
- `server/controllers/block.controller.ts` - Block API endpoints
- `server/routes/block.routes.ts` - Block routes
- `server/database/schemas/block.schema.ts` - Block schema

### Frontend
- `lib/api/block.ts` - Block API client
- `components/user/UserActionButtons.tsx` - Block UI component
- `app/users/[id]/page.tsx` - User profile with block integration

## Support

For issues or questions about the block system, check:
1. Server logs for backend errors
2. Browser console for frontend errors
3. Network tab for API request/response details

