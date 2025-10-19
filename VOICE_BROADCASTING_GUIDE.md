# Voice Broadcasting System - Complete Guide

## ✅ Implemented Features

### 1. **Admin-Only Live Broadcasting**
- Only room admins can start broadcasts
- Radio button in chat header (top right)
- One broadcaster per room at a time

### 2. **Real-Time Audio Streaming**
- Captures microphone audio with high quality
- Streams via Socket.IO to all room members
- Low-latency audio playback
- Echo cancellation & noise suppression

### 3. **Broadcast Notifications**
- **Green strip** in chat showing broadcaster name
- **"Live" badge** on room cards (home/rooms pages)
- **Play/Pause/Mute controls** for listeners
- Persists across page refreshes

---

## 🔒 HTTPS Requirement

### **CRITICAL: Voice broadcasting REQUIRES HTTPS in production!**

| Environment | Microphone Access | Broadcasting |
|-------------|-------------------|--------------|
| **localhost** | ✅ Works | ✅ Works |
| **HTTP (network/domain)** | ❌ BLOCKED | ❌ Won't work |
| **HTTPS** | ✅ Works | ✅ Works |

### Why HTTPS is Required:
- Browser security policy blocks `getUserMedia()` on insecure contexts
- WebRTC APIs require secure context
- Only localhost is exempt from this requirement

---

## 🚀 Setup for Production

### **Option 1: Local Network (Development/Testing)**

**Works without HTTPS on localhost:**
```bash
npm run dev
# Access via: http://localhost:3000
```

✅ Broadcasting will work
✅ All features functional

### **Option 2: Production Deployment with HTTPS**

**Required for network/domain access:**

1. **Get SSL Certificate**
   - Use Let's Encrypt (free)
   - Or use Cloudflare SSL
   - Or use your hosting provider's SSL

2. **Configure Server**
   ```bash
   # Set environment variables
   USE_HTTPS=true
   DOMAIN=yourdomain.com
   ```

3. **Build and Deploy**
   ```bash
   npm run build:prod
   npm run start:domain
   ```

4. **Access via HTTPS**
   ```
   https://yourdomain.com
   ```

✅ Broadcasting will work
✅ All features functional

---

## 📱 How to Use

### **For Admin (Broadcaster):**

1. **Start Broadcasting**
   - Open chat (widget or full-screen)
   - Click Radio button (📻) in top right
   - Allow microphone access when prompted
   - Green strip appears: "You are broadcasting now"

2. **While Broadcasting**
   - Speak into your microphone
   - All room members hear you in real-time
   - Radio button turns red with pulse animation

3. **Stop Broadcasting**
   - Click Radio button again
   - Microphone stops
   - Green strip disappears for everyone

### **For Listeners (Other Users):**

1. **Join Broadcast**
   - Green strip automatically appears
   - Shows broadcaster's name
   - Audio starts playing automatically

2. **Control Playback**
   - **Play/Pause** (▶/⏸) - Control audio playback
   - **Mute/Unmute** (🔊/🔇) - Control volume

3. **From Room Cards**
   - See "Live" badge on room cards
   - Same Play/Pause/Mute controls available
   - Click to join chat and listen

---

## 🔧 Technical Details

### **Audio Streaming Flow:**

```
Admin's Browser:
1. getUserMedia() → Capture microphone
2. AudioContext → Process audio
3. ScriptProcessor → Extract audio data
4. Socket.emit('audio_stream') → Send to server

Server:
5. Receive audio_stream event
6. socket.to(`room_${roomId}`) → Relay to all room members

Listener's Browser:
7. Receive audio_stream event
8. AudioContext → Create audio buffer
9. BufferSource → Play audio chunks
10. Speakers → Output sound
```

### **Audio Quality Settings:**
- **Sample Rate**: 48kHz
- **Buffer Size**: 4096 samples
- **Channels**: Mono (1 channel)
- **Processing**: Echo cancellation, noise suppression, auto gain

---

## ⚠️ Troubleshooting

### **"Failed to start voice broadcast"**

**Possible causes:**
1. **Not using HTTPS** (most common)
   - ✅ Solution: Deploy with HTTPS or use localhost

2. **Microphone permission denied**
   - ✅ Solution: Allow microphone in browser settings

3. **No microphone connected**
   - ✅ Solution: Connect a microphone device

4. **Browser not supported**
   - ✅ Solution: Use Chrome, Firefox, or Safari (latest versions)

### **"Receiver can't hear audio"**

**Check:**
1. ✅ Is receiver in the same room?
2. ✅ Is receiver's browser on HTTPS or localhost?
3. ✅ Is receiver's volume not muted?
4. ✅ Did receiver click Play (if paused)?
5. ✅ Check browser console for errors

### **"Green strip doesn't appear"**

**Solutions:**
1. Refresh the page - broadcast state will restore
2. Join the room chat - triggers broadcast status check
3. Check socket connection status
4. Verify you're a member of the room

---

## 🌐 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 80+ | ✅ Full support |
| Firefox | 75+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 80+ | ✅ Full support |
| Mobile Safari | iOS 14+ | ✅ Works with HTTPS |
| Mobile Chrome | Android 80+ | ✅ Works with HTTPS |

**Note:** All require HTTPS except on localhost!

---

## 📊 Console Log Suppression

### **Automatic in Production**

**Frontend (Next.js):**
- All `console.log()` removed during build
- `console.error()` and `console.warn()` kept
- Configured in `next.config.ts`

**Backend (Node.js):**
- `console.log()` suppressed at runtime
- `console.error()` and `console.warn()` kept
- Configured in `server/utils/logger.ts`

**Build for production:**
```bash
NODE_ENV=production npm run build
NODE_ENV=production npm run server:prod
```

---

## 🎯 Quick Setup Checklist

- [ ] SSL certificate installed
- [ ] HTTPS configured on server
- [ ] Domain pointing to server
- [ ] Firewall allows HTTPS (port 443)
- [ ] Environment variables set
- [ ] Built with production flag
- [ ] Tested microphone access
- [ ] Verified socket connection

---

## 💡 Tips

1. **Test on localhost first** - No HTTPS needed
2. **Use Let's Encrypt** - Free SSL certificates
3. **Check browser console** - Shows permission errors
4. **Grant microphone access** - Required for broadcasting
5. **Use headphones** - Prevents audio feedback for listeners

---

## 🎉 Features Summary

✅ Admin-only broadcasting
✅ Live audio streaming
✅ Green notification strip
✅ Broadcaster name display
✅ Play/Pause controls
✅ Mute/Unmute controls
✅ Room card "Live" badges
✅ Persistent broadcast state
✅ Multi-page support (chat, home, rooms)
✅ Mobile responsive
✅ HTTPS security check
✅ Production console log removal

**The system is complete and production-ready with HTTPS!** 🚀

