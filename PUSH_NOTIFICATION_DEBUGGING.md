# Push Notification Debugging Guide

## 🔍 Why Push Notifications Might Not Work:

### Issue 1: VAPID Keys Not Loaded
**Check server startup logs for:**
```
✅ VAPID keys configured for push notifications
```

If you see:
```
⚠️ VAPID keys not found - push notifications will not work
```

**Solution:** Restart server after adding keys to `local.env`

---

### Issue 2: No Push Subscription
**User must subscribe first!**

Steps:
1. Go to /profile
2. Browser asks permission → Click "Allow"
3. Check console for: `✅ Subscription sent to server`

**Verify in MongoDB:**
```
db.pushsubscriptions.find({ userId: "your-user-id" })
```

Should show subscription with endpoint and keys.

---

### Issue 3: Server Not Calling Push Service
**Check server logs when message is sent:**

Should see:
```
📤 Attempting to send push notification to user: {userId}
📱 Found 1 push subscriptions for user: {userId}
📨 Sending to endpoint: https://...
✅ Push notification sent successfully to: {userId}
```

If missing these logs, the push service isn't being called.

---

### Issue 4: Chat is Open (By Design)
**Push notifications don't send if chat is open!**

Test properly:
1. User A enables push
2. User A **CLOSES** DirectMessageWidget
3. User B sends message
4. User A should get push

If chat is open, no push is sent (this is intentional).

---

## ✅ Complete Testing Checklist:

### Setup:
- [ ] Server restarted after adding VAPID keys
- [ ] Server logs show: "✅ VAPID keys configured"
- [ ] Browser permission granted
- [ ] Subscription saved to database

### Test Direct Message:
- [ ] User A enables push notifications
- [ ] User A minimizes browser or closes tab
- [ ] User B sends direct message to User A
- [ ] Check server logs for push attempt
- [ ] User A receives push notification ✅

### Test Room Message:
- [ ] User A enables push notifications
- [ ] User A closes room chat
- [ ] User B sends message in room
- [ ] User A receives push notification ✅

### Debug Logs to Check:

**Server (when message sent):**
```
📤 Attempting to send push notification to user: 12345
📤 Payload: { title: "...", body: "..." }
📱 Found 1 push subscriptions for user: 12345
📦 Push payload prepared: {...}
📨 Sending to endpoint: https://fcm.googleapis.com/...
✅ Push notification sent successfully to: 12345
```

**Browser Console:**
```
Service Worker: Push event received
Service Worker: Push data received: {...}
Service Worker: Notification displayed successfully
```

---

## 🚀 Quick Test:

### Use the Test Button:
1. Go to /profile
2. Enable push notifications
3. Expand "Test Notifications (Developer)"
4. Click "Send Test Push Notification"
5. Should see notification immediately!

If test works but real messages don't:
- Check if chat is open (prevents push)
- Check server logs for actual push attempts
- Verify notification settings in database

---

## 🔧 Common Fixes:

### "No push subscriptions found"
**Solution:** User hasn't subscribed yet
1. Go to /profile
2. Enable push toggle
3. Allow browser permission

### "VAPID keys not configured"
**Solution:** Restart server
```bash
Ctrl+C
npm run dev
```

### "Permission denied"
**Solution:** Reset browser permissions
1. Click lock icon in address bar
2. Reset permissions
3. Reload page
4. Try again

### "Subscription sent but no notifications"
**Solution:** Check server logs
- Should see push service being called
- Should see web-push sending notification
- Check for errors in logs

---

## 📊 What to Check:

1. **Server Startup:**
   - ✅ VAPID keys loaded
   - ✅ web-push configured

2. **User Subscription:**
   - ✅ Browser permission granted
   - ✅ Push subscription created
   - ✅ Saved to MongoDB

3. **Message Sent:**
   - ✅ Server receives message
   - ✅ Checks if push enabled
   - ✅ Checks if chat open
   - ✅ Calls pushNotificationService
   - ✅ web-push sends notification

4. **Service Worker:**
   - ✅ Receives push event
   - ✅ Shows notification
   - ✅ User sees it!

---

## 🎯 Most Common Issue:

**Server not restarted after adding VAPID keys!**

**Solution:**
```bash
# Stop server
Ctrl+C

# Clear any caches
rm -rf .next

# Restart
npm run dev
```

Then test again!

