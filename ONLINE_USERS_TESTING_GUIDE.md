# Testing Online Users Carousel

## Quick Test Steps

### 1. Restart Your Server
The socket handlers have been updated, so restart the backend:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 2. Test with Two Browsers

**Browser 1 (e.g., Chrome):**
1. Open `http://localhost:3000`
2. Login with User 1
3. Navigate to the home page
4. Check the browser console for:
   ```
   ✅ Socket authenticated
   📋 Get online users request
   ```

**Browser 2 (e.g., Firefox or Chrome Incognito):**
1. Open `http://localhost:3000`
2. Login with User 2
3. Navigate to the home page
4. **Check both browsers** - you should see:
   - **Browser 1**: User 2 appears in the online users carousel
   - **Browser 2**: User 1 appears in the online users carousel

### 3. Test Real-time Updates

**Test Online Event:**
1. Login with User 3 in a third browser/tab
2. **Both previous browsers** should automatically show User 3 in the carousel

**Test Offline Event:**
1. Close Browser 3 (or logout)
2. **Both remaining browsers** should remove User 3 from the carousel

## What to Look For

### ✅ Success Indicators

**1. Online Users Carousel Appears**
- Shows a card with "Online Users" heading
- Green Users icon
- User count badge (e.g., "2")

**2. User Cards Display**
- Profile picture (uploaded or avatar)
- Username with @ symbol
- Location (City, State) if visible
- Green "Online" badge
- Green online indicator dot

**3. Real-time Updates**
- Users appear when they login
- Users disappear when they logout
- No page refresh needed

**4. Console Logs (Backend)**
```
🔌 New socket connection: abc123
🔌 Authentication attempt
✅ Broadcast user_online event for user xyz
📋 Get online users request from: xyz
👥 Online user IDs: [...]
✅ Sending online users: 2
```

**5. Console Logs (Frontend)**
```
👤 User came online: {...}
👥 Online users list: {...}
```

### ❌ Common Issues

**Issue: "No users online right now"**
- Check if both users are logged in
- Check socket connection in browser console
- Check backend logs for authentication

**Issue: Users not appearing**
- Refresh both browsers
- Check browser console for errors
- Verify socket is connected (look for `connection_confirmed` event)

**Issue: Users not updating in real-time**
- Check socket connection
- Look for socket errors in console
- Verify backend is emitting events

## Debug Commands

### Check Browser Console
```javascript
// In browser console
console.log('Socket connected:', !!socket);
```

### Check Backend Logs
Look for these messages in your terminal:
```
✅ Broadcast user_online event
✅ Sending online users: X
✅ Broadcast user_offline event
```

### Network Tab
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for socket.io connection
4. Check messages being sent/received

## Expected Behavior

### When User Logs In
1. Socket authenticates
2. Backend emits `user_online` to all other users
3. Backend responds to `get_online_users` with current list
4. Carousel updates with all online users

### When User Logs Out
1. Socket disconnects
2. Backend emits `user_offline` to all users
3. Carousel removes that user

### When Page Loads
1. Component mounts
2. Socket emits `get_online_users`
3. Backend responds with current online users
4. Carousel displays all online users

## Troubleshooting

### Problem: Carousel not showing
**Solution:**
- Check if socket is connected
- Verify user is authenticated
- Check browser console for errors

### Problem: Same user appears in their own carousel
**Solution:**
- This shouldn't happen - currentUserId is filtered out
- Check if user.id is being passed correctly to component

### Problem: Location not showing
**Solution:**
- Verify user has location set in profile
- Check if location visibility is enabled
- Ensure Google Maps API key is configured

### Problem: Profile pictures not loading
**Solution:**
- Check if profile pictures are set
- Verify DiceBear API is accessible
- Check browser console for image load errors

## Test Checklist

- [ ] Server restarted after code changes
- [ ] Two different browsers/tabs open
- [ ] Both users logged in successfully
- [ ] Both users on home page
- [ ] Online Users carousel visible
- [ ] User cards show correct information
- [ ] Profile pictures display
- [ ] Usernames show with @ symbol
- [ ] Locations display (if visible)
- [ ] Online badges show
- [ ] Green indicator dots visible
- [ ] Horizontal scrolling works
- [ ] Real-time: new user appears when logging in
- [ ] Real-time: user disappears when logging out
- [ ] Console shows no errors
- [ ] Backend logs show socket events

## Advanced Testing

### Test with Multiple Users (3+)
1. Open 3-5 different browsers/tabs
2. Login with different users
3. All should appear in each other's carousels
4. Test horizontal scrolling with many users

### Test Privacy Settings
1. User 1: Set location to hidden
2. User 2: Should see User 1 without location
3. User 1: Set location to visible
4. User 2: Should now see User 1's location

### Test Reconnection
1. Disable network temporarily
2. Re-enable network
3. Users should reconnect automatically
4. Carousel should update

## Support

If issues persist:
1. Clear browser cache
2. Delete node_modules and reinstall
3. Check MongoDB is running
4. Verify all environment variables are set
5. Check firewall isn't blocking WebSocket connections

---

**Status**: Ready for Testing ✅  
**Last Updated**: October 21, 2025
