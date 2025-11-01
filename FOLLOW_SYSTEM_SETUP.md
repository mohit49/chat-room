# Follow/Unfollow Feature - Quick Setup

## Installation Steps

### 1. Install Required Dependencies

Run the following command to install the required Radix UI toast component:

```bash
npm install @radix-ui/react-toast
```

### 2. Verify File Structure

Ensure all the following files have been created:

**Backend Files:**
- `server/database/schemas/follow.schema.ts` ✓
- `server/models/follow.model.ts` ✓
- `server/services/follow.service.ts` ✓
- `server/controllers/follow.controller.ts` ✓
- `server/routes/follow.routes.ts` ✓

**Frontend Files:**
- `lib/api/follow.ts` ✓
- `components/user/FollowButton.tsx` ✓
- `components/user/FollowListDialog.tsx` ✓
- `components/layout/GlobalFollowListener.tsx` ✓
- `components/ui/toast.tsx` ✓
- `components/ui/toaster.tsx` ✓
- `hooks/use-toast.ts` ✓

### 3. Database Migration

The MongoDB schemas will be created automatically when you first use the follow feature. No manual migration needed.

### 4. Testing the Feature

1. **Start the Server:**
   ```bash
   npm run dev
   ```

2. **Test Follow Workflow:**
   - Create/login with two different user accounts
   - Visit another user's profile
   - Click the "Follow" button
   - Check notifications on the receiving user's account
   - Accept the follow request
   - Verify the button state changes to "Following"

3. **Test Unfollow:**
   - Click the "Following" button
   - Confirm the unfollow action in the dialog
   - Verify the button returns to "Follow" state

4. **Test Followers/Following List:**
   - On your profile page, click on the followers/following count
   - Verify the dialog opens with tabs
   - Click on a user to navigate to their profile
   - Test the unfollow button in the following tab

### 5. Socket Events Testing

Open two browser tabs with different logged-in users:
1. Send a follow request from Tab 1
2. Verify real-time toast notification appears in Tab 2
3. Accept the request in Tab 2
4. Verify acceptance notification appears in Tab 1

## API Endpoints Reference

All endpoints are prefixed with `/api/user/follow` and require authentication.

| Action | Method | Endpoint |
|--------|--------|----------|
| Send follow request | POST | `/:userId` |
| Unfollow user | DELETE | `/:userId` |
| Cancel request | DELETE | `/request/:userId` |
| Accept request | POST | `/request/:requestId/accept` |
| Reject request | POST | `/request/:requestId/reject` |
| Get requests | GET | `/requests` |
| Get status | GET | `/status/:userId` |
| Get followers | GET | `/followers/:userId` |
| Get following | GET | `/following/:userId` |
| Get counts | GET | `/counts/:userId` |

## Troubleshooting

### Common Issues

**Issue: Follow button not showing**
- Check if user is logged in
- Verify the user ID is not the same as the current user
- Check browser console for errors

**Issue: Notifications not appearing**
- Verify socket connection is established
- Check notification permissions in browser
- Ensure GlobalFollowListener is mounted in layout

**Issue: Toast notifications missing**
- Run `npm install @radix-ui/react-toast`
- Verify Toaster component is in root layout

**Issue: Database errors**
- Ensure MongoDB is running
- Check connection string in environment variables
- Verify user has permissions to create collections

## Environment Variables

No additional environment variables are required. The feature uses existing:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret for authentication

## Next Steps

After installation, you can:
1. Customize the UI styling of follow buttons
2. Add follow analytics to user dashboards
3. Implement follow suggestions
4. Add privacy settings for follow requests
5. Integrate with recommendation algorithms

For detailed documentation, see `FOLLOW_SYSTEM_GUIDE.md`









