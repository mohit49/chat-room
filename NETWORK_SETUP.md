# Network Access Setup Guide

This guide explains how to configure the chat app to run on both localhost and network IP addresses.

## Quick Start

### 1. Start the App with Network Access
```bash
npm run dev
```

This will start both the Next.js frontend and Express backend on all network interfaces (0.0.0.0).

### 2. Access URLs

**Frontend:**
- Local: http://localhost:3000
- Network: http://192.168.1.10:3000

**Backend API:**
- Local: http://localhost:3001
- Network: http://192.168.1.10:3001

## Configuration Details

### Package.json Scripts
- `npm run dev` - Starts with network access (0.0.0.0)
- `npm run dev:localhost` - Starts with localhost only
- `npm run start` - Production with network access
- `npm run start:localhost` - Production with localhost only

### Server Configuration
The server is configured to:
- Bind to all network interfaces (0.0.0.0)
- Accept CORS requests from both localhost and network IP
- Support both port 3000 and 3002 for frontend

### CORS Origins
The server accepts requests from:
- http://localhost:3000
- http://localhost:3002
- http://192.168.1.10:3000
- http://192.168.1.10:3002

## Environment Variables

Create a `.env.local` file with:

```env
# Server Configuration
PORT=3001

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/chat-app-local

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://192.168.1.10:3000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# For network access, uncomment:
# NEXT_PUBLIC_API_URL=http://192.168.1.10:3001/api
```

## Testing Network Access

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Test localhost access:**
   - Open http://localhost:3000
   - Should work normally

3. **Test network access:**
   - Find your computer's IP address
   - Open http://192.168.1.10:3000 (replace with your IP)
   - Should work from other devices on the same network

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill processes on ports 3000 and 3001
npx kill-port 3000 3001
```

### CORS Errors
If you get CORS errors when accessing via network IP:
1. Check that your IP address is in the CORS origins list
2. Update the CORS_ORIGIN environment variable
3. Restart the server

### Socket.IO Connection Issues
Socket.IO should work automatically with both localhost and network access. If you have issues:
1. Check that both frontend and backend are running
2. Verify the API URL is correct in your environment variables
3. Check browser console for connection errors

## Security Notes

- This configuration is for development only
- For production, use proper domain names and HTTPS
- Consider firewall settings for network access
- The app binds to all interfaces (0.0.0.0) which may not be secure for production

## Mobile Testing

You can test the app on mobile devices:
1. Connect your mobile device to the same WiFi network
2. Find your computer's IP address
3. Open http://192.168.1.10:3000 on your mobile device
4. The app should work normally with real-time features
