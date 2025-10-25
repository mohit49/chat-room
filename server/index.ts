import express, { Express, Request } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import os from 'os';
import config from './config';
import { database } from './database/connection';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import usernameRoutes from './routes/username.routes';
import roomRoutes from './routes/room.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import followRoutes from './routes/follow.routes';
import blockRoutes from './routes/block.routes';
import directMessageRoutes from './routes/directMessage.routes';
import notificationRoutesNew from './routes/notification.routes';
import profilePictureRoutes from './routes/profilePicture.routes';
import pushNotificationRoutes from './routes/pushNotification.routes';
import instantChatRoutes from './routes/instantChat.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupSocketHandlers, connectedUsers } from './socket/socketHandlers';
import socketService from './services/socket.service';
import './utils/logger'; // Initialize logger to suppress console in production

// Type definitions
interface NetworkIP {
  interface: string;
  address: string;
  url: string;
  apiUrl: string;
}

// Function to get network IP addresses
function getNetworkIPs(): NetworkIP[] {
  const interfaces = os.networkInterfaces();
  const addresses: NetworkIP[] = [];

  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      for (const iface of networkInterface) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            interface: name,
            address: iface.address,
            url: `http://${iface.address}:3000`,
            apiUrl: `http://${iface.address}:${config.port}`
          });
        }
      }
    }
  }

  return addresses;
}

const app: Express = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origin,
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 120000, // Increased to 2 minutes for better mobile connectivity
  pingInterval: 25000
});

// Initialize database connection
database.connect();

// Middleware
app.use(cors(config.cors));
// Only parse JSON for non-multipart requests
app.use((req, res, next) => {
  if (req.url.includes('/upload-image') || req.url.includes('/upload-audio')) {
    next(); // Skip all body parsing for upload routes
  } else {
    express.json()(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.url.includes('/upload-image') || req.url.includes('/upload-audio')) {
    next(); // Skip URL encoding for upload routes
  } else {
    express.urlencoded({ extended: true })(req, res, next);
  }
});
app.use(cookieParser());

// Serve static files from public/uploads directory
app.use('/uploads', express.static('public/uploads'));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'));
    }
  }
});

// Extend Request interface to include upload
declare global {
  namespace Express {
    interface Request {
      upload?: multer.Multer;
    }
  }
}

// Make upload available to routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: config.env,
    database: {
      connected: database.getConnectionStatus(),
      url: config.database.url
    },
    timestamp: new Date().toISOString(),
  });
});

// Network IP information endpoint
app.get('/api/network-info', (req, res) => {
  const networkIPs = getNetworkIPs();
  res.json({
    success: true,
    localhost: {
      frontend: 'http://localhost:3000',
      backend: `http://localhost:${config.port}`,
      api: `http://localhost:${config.port}/api`
    },
    network: networkIPs.map(ip => ({
      interface: ip.interface,
      address: ip.address,
      frontend: ip.url,
      backend: ip.apiUrl,
      api: `${ip.apiUrl}/api`
    })),
    demo: {
      message: 'Demo mode is active - use any mobile number and the generated OTP',
      instructions: [
        '1. Enter any mobile number',
        '2. Click "Send OTP"',
        '3. Use the generated OTP to login',
        '4. Access from other devices using network URLs above'
      ]
    }
  });
});

// Socket.IO test endpoint
app.get('/api/socket-test', (req, res) => {
  res.json({
    connectedUsers: Array.from(connectedUsers.entries()),
    totalConnections: connectedUsers.size,
    socketIO: 'active'
  });
});

// Test database message storage
app.get('/api/test-db-messages', async (req, res) => {
  try {
    const { ChatMessageModel } = await import('./database/schemas/chatMessage.schema');
    const messageCount = await ChatMessageModel.countDocuments();
    const recentMessages = await ChatMessageModel.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .select('roomId userId username message messageType timestamp');
    
    res.json({
      success: true,
      totalMessages: messageCount,
      recentMessages: recentMessages.map(msg => ({
        id: (msg as any)._id.toString(),
        roomId: msg.roomId,
        userId: msg.userId,
        username: msg.username,
        message: msg.message.substring(0, 50) + '...',
        messageType: msg.messageType,
        timestamp: msg.timestamp
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages from database',
      details: error.message
    });
  }
});

// Test admin message sending
app.post('/api/test-admin-message', async (req, res) => {
  try {
    const { roomId, userId, message } = req.body;
    
    if (!roomId || !userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'roomId, userId, and message are required'
      });
    }

    // Import chat service
    const { chatService } = await import('./services/chat.service');
    
    // Test sending message
    const result = await chatService.sendMessage({
      roomId,
      userId,
      message,
      messageType: 'text'
    });

    res.json({
      success: true,
      result,
      message: 'Test message sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send test message',
      details: error.message
    });
  }
});

// Test message retrieval without authentication
app.get('/api/test-messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Import chat service
    const { chatService } = await import('./services/chat.service');
    
    // Test getting messages (using a real userId for testing)
    const result = await chatService.getRoomMessages(roomId, '68e0df339ae74da770af3fc5');

    res.json({
      success: true,
      result,
      message: 'Test message retrieval'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test messages',
      details: error.message
    });
  }
});

// Test notification endpoint
app.post('/api/test-notification', async (req, res) => {
  const { userId, message } = req.body;
  
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  try {
    const notificationService = require('./services/notification.service').default;
    await notificationService.createNotification({
      type: 'room_invitation',
      title: 'Test Notification',
      message: message,
      recipientId: userId,
      senderId: userId, // Self-send for testing
      status: 'pending'
    });
    
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Check VAPID keys on startup
console.log('🔐 Checking VAPID configuration...');
console.log('VAPID Public Key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
console.log('VAPID Private Key:', process.env.VAPID_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
console.log('VAPID Email:', process.env.VAPID_EMAIL || 'mailto:admin@chatapp.com');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user/follow', followRoutes);
app.use('/api/user/block', blockRoutes);
app.use('/api/user/notifications', notificationRoutesNew);
app.use('/api/user/profile-picture', profilePictureRoutes);
app.use('/api/user', userRoutes);
app.use('/api/username', usernameRoutes);
app.use('/api/rooms', roomRoutes);
// IMPORTANT: More specific routes must come BEFORE general routes
app.use('/api/notifications/push', pushNotificationRoutes);  // Must be before /api/notifications
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat/direct-message', directMessageRoutes);  // Must be before /api/chat
app.use('/api/chat/instant', instantChatRoutes);  // Instant chat routes
app.use('/api/chat', chatRoutes);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Initialize socket service
socketService.setIO(io);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
server.listen(config.port, '0.0.0.0', () => {
  const networkIPs = getNetworkIPs();
  
  console.log(`🚀 Server is running on:`);
  console.log(`   Local:   http://localhost:${config.port}`);
  
  if (networkIPs.length > 0) {
    console.log(`   Network IPs:`);
    networkIPs.forEach((ip, index) => {
      console.log(`     ${index + 1}. ${ip.interface}: ${ip.address}`);
      console.log(`        Frontend: ${ip.url}`);
      console.log(`        Backend:  ${ip.apiUrl}`);
    });
  } else {
    console.log(`   Network: No network interfaces found`);
  }
  
  console.log(`📝 Environment: ${config.env}`);
  console.log(`🔗 API: http://localhost:${config.port}/api`);
  console.log(`🔌 Socket.IO: http://localhost:${config.port}`);
  
  if (networkIPs.length > 0) {
    console.log(`\n💡 Demo Mode - Access URLs:`);
    console.log(`   Local:   http://localhost:3000`);
    networkIPs.forEach((ip) => {
      console.log(`   Network: ${ip.url}`);
    });
  }
});

export { app, io };
