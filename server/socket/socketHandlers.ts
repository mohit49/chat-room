import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserModel as User } from '../database/schemas/user.schema';
import { notificationService } from '../services/notification.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

// Store connected users
export const connectedUsers = new Map<string, string>(); // userId -> socketId

export const setupSocketHandlers = (io: SocketIOServer) => {
  console.log('🔌 Setting up Socket.IO handlers');
  
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);
    
    // Handle authentication after connection
    socket.on('authenticate', async (data) => {
      try {
        console.log('🔌 Authentication attempt:', {
          socketId: socket.id,
          hasToken: !!data.token
        });
        
        if (!data.token) {
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }

        const decoded = jwt.verify(data.token, config.jwt.secret) as any;
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          socket.emit('auth_error', { message: 'User not found' });
          return;
        }

        socket.userId = user._id.toString();
        socket.user = user;
        
        console.log(`✅ Socket authenticated for user: ${socket.userId}`);
        
        // Store user connection
        connectedUsers.set(socket.userId, socket.id);
        console.log(`👤 Stored connection for user ${socket.userId} -> socket ${socket.id}`);
        
        // Join user to their personal room for notifications
        socket.join(`user_${socket.userId}`);
        
        // Send connection confirmation
        socket.emit('connection_confirmed', {
          userId: socket.userId,
          socketId: socket.id,
          message: 'Successfully connected to notification service'
        });

        // Send user online status to all rooms they're in
        socket.emit('user_online_status', {
          userId: socket.userId,
          isOnline: true
        });
        
      } catch (error) {
        console.log('❌ Socket authentication error:', error);
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    // Handle joining room channels
    socket.on('join_room', async (roomId: string) => {
      socket.join(`room_${roomId}`);
      console.log(`User ${socket.userId} joined room ${roomId}`);
      
      // Notify other room members that user joined
      socket.to(`room_${roomId}`).emit('user_joined_room', {
        userId: socket.userId,
        username: socket.user?.username || socket.user?.mobileNumber
      });

      // Send current online members to the user who joined
      await sendRoomMembersStatus(io, roomId);
    });

    // Handle leaving room channels
    socket.on('leave_room', (roomId: string) => {
      socket.leave(`room_${roomId}`);
      console.log(`User ${socket.userId} left room ${roomId}`);
      
      // Notify other room members that user left
      socket.to(`room_${roomId}`).emit('user_left_room', {
        userId: socket.userId,
        username: socket.user?.username || socket.user?.mobileNumber
      });
    });

    // Handle sending messages
    socket.on('send_message', (messageData) => {
      // Broadcast message to all room members including sender
      io.to(`room_${messageData.roomId}`).emit('new_message', messageData);
    });

    // Handle typing indicators for rooms
    socket.on('user_typing', (data) => {
      console.log('⌨️ Received typing event:', {
        from: socket.userId,
        roomId: data.roomId,
        isTyping: data.isTyping,
        username: socket.user?.username || socket.user?.mobileNumber
      });
      
      // Broadcast to all room members except sender
      const typingData = {
        userId: socket.userId,
        username: socket.user?.username || socket.user?.mobileNumber,
        isTyping: data.isTyping,
        roomId: data.roomId
      };
      
      console.log('⌨️ Broadcasting typing event to room:', `room_${data.roomId}`, typingData);
      socket.to(`room_${data.roomId}`).emit('user_typing', typingData);
    });

    // Handle typing indicators for direct messages
    socket.on('direct_message_typing', (data) => {
      const { targetUserId, isTyping } = data;
      
      // Send typing indicator to the target user
      io.to(`user_${targetUserId}`).emit('direct_message_typing', {
        userId: socket.userId,
        username: socket.user?.username || socket.user?.mobileNumber,
        isTyping: isTyping
      });
    });

    // Handle message read status
    socket.on('message_read', async (data) => {
      try {
        const { senderId, receiverId } = data;
        
        console.log('📖 Message read event received:', {
          senderId,
          receiverId,
          readBy: socket.userId
        });

        // Import the direct message service to mark messages as read
        const { directMessageService } = await import('../services/directMessage.service');
        
        // Mark messages as read
        const success = await directMessageService.markMessagesAsSeen(receiverId, senderId);
        
        if (success) {
          // Notify the sender that their messages were read
          io.to(`user_${senderId}`).emit('messages_read', {
            readBy: receiverId,
            readByUsername: socket.user?.username || socket.user?.mobileNumber,
            timestamp: new Date().toISOString()
          });
          
          console.log('✅ Messages marked as read and sender notified');
        }
      } catch (error) {
        console.error('❌ Error handling message read event:', error);
      }
    });

    // Voice broadcasting events
    socket.on('voice_broadcast_start', (data) => {
      console.log('🎤 Voice broadcast started:', data);
      socket.to(`room_${data.roomId}`).emit('voice_broadcast_started', {
        userId: socket.userId,
        username: socket.user?.username || socket.user?.mobileNumber,
        roomId: data.roomId
      });
    });

    socket.on('voice_broadcast_stop', (data) => {
      console.log('🎤 Voice broadcast stopped:', data);
      socket.to(`room_${data.roomId}`).emit('voice_broadcast_stopped', {
        userId: socket.userId,
        roomId: data.roomId
      });
    });

    socket.on('voice_join_request', (data) => {
      console.log('🎤 Voice join request:', data);
      socket.to(`user_${data.broadcasterId}`).emit('voice_join_request', {
        requesterId: socket.userId,
        requesterName: socket.user?.username || socket.user?.mobileNumber,
        roomId: data.roomId
      });
    });

    socket.on('voice_offer', (data) => {
      console.log('🎤 Voice offer:', data);
      socket.to(`user_${data.targetUserId}`).emit('voice_offer', {
        offer: data.offer,
        fromUserId: socket.userId,
        roomId: data.roomId
      });
    });

    socket.on('voice_answer', (data) => {
      console.log('🎤 Voice answer:', data);
      socket.to(`user_${data.targetUserId}`).emit('voice_answer', {
        answer: data.answer,
        fromUserId: socket.userId,
        roomId: data.roomId
      });
    });

    socket.on('voice_ice_candidate', (data) => {
      console.log('🎤 Voice ICE candidate:', data);
      socket.to(`user_${data.targetUserId}`).emit('voice_ice_candidate', {
        candidate: data.candidate,
        fromUserId: socket.userId,
        roomId: data.roomId
      });
    });

    // Handle notification events
    socket.on('mark_notification_read', async (notificationId: string) => {
      if (!socket.userId) return;
      
      try {
        await notificationService.markAsRead(notificationId, socket.userId);
        socket.emit('notification_read', { notificationId, success: true });
      } catch (error) {
        socket.emit('notification_read', { notificationId, success: false, error: 'Failed to mark as read' });
      }
    });

    // Handle approving room invitation
    socket.on('approve_invitation', async (notificationId: string) => {
      if (!socket.userId) return;
      
      try {
        const result = await notificationService.approveRoomInvitation(notificationId, socket.userId);
        
        if (result.success) {
          socket.emit('invitation_approved', { 
            notificationId, 
            success: true, 
            roomId: result.roomId 
          });
          
          // Notify admin about approval
          const notification = await notificationService.getNotificationById(notificationId, socket.userId);
          if (notification) {
            io.to(`user_${notification.senderId}`).emit('notification', {
              type: 'room_approved',
              title: 'Room Invitation Approved',
              message: `${socket.user?.username || socket.user?.mobileNumber} has accepted your invitation`,
              roomId: notification.roomId
            });
          }
        } else {
          socket.emit('invitation_approved', { 
            notificationId, 
            success: false, 
            error: result.error 
          });
        }
      } catch (error) {
        socket.emit('invitation_approved', { 
          notificationId, 
          success: false, 
          error: 'Failed to approve invitation' 
        });
      }
    });

    // Handle rejecting room invitation
    socket.on('reject_invitation', async (notificationId: string) => {
      if (!socket.userId) return;
      
      try {
        const success = await notificationService.rejectRoomInvitation(notificationId, socket.userId);
        
        if (success) {
          socket.emit('invitation_rejected', { notificationId, success: true });
          
          // Notify admin about rejection
          const notification = await notificationService.getNotificationById(notificationId, socket.userId);
          if (notification) {
            io.to(`user_${notification.senderId}`).emit('notification', {
              type: 'room_rejected',
              title: 'Room Invitation Rejected',
              message: `${socket.user?.username || socket.user?.mobileNumber} has declined your invitation`,
              roomId: notification.roomId
            });
          }
        } else {
          socket.emit('invitation_rejected', { notificationId, success: false });
        }
      } catch (error) {
        socket.emit('invitation_rejected', { notificationId, success: false });
      }
    });


    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User ${socket.userId} disconnected`);
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Notify all rooms that this user went offline
        const rooms = Array.from(socket.rooms).filter(room => room.startsWith('room_'));
        for (const room of rooms) {
          const roomId = room.replace('room_', '');
          await sendRoomMembersStatus(io, roomId);
        }
      }
    });
  });
};

// Helper function to send notification to user
export const sendNotificationToUser = async (io: SocketIOServer, userId: string, notification: any) => {
  const socketId = connectedUsers.get(userId);
  console.log(`📤 Attempting to send notification to user ${userId}, socketId: ${socketId}`);
  
  // Always store notification in database first
  try {
    await notificationService.createNotification({
      recipientId: userId,
      type: notification.type || 'general',
      title: notification.title || 'Notification',
      message: notification.message || '',
      senderId: notification.senderId,
      messageId: notification.messageId,
      status: 'unread',
      metadata: notification.metadata || {}
    });
    console.log(`✅ Notification stored in database for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to store notification in database for user ${userId}:`, error);
  }
  
  // If user is connected, also send via socket
  if (socketId) {
    // Send different socket events based on notification type
    if (notification.type === 'direct_message') {
      console.log(`📤 Sending message_notification to user ${userId} via socket ${socketId}:`, notification);
      io.to(socketId).emit('message_notification', notification);
      console.log(`✅ Message notification sent to user ${userId} via socket ${socketId}`);
    } else {
      console.log(`📤 Sending general notification to user ${userId} via socket ${socketId}:`, notification);
      io.to(socketId).emit('notification', notification);
      console.log(`✅ General notification sent to user ${userId} via socket ${socketId}`);
    }
  } else {
    console.log(`📝 User ${userId} not connected, notification stored for later viewing`);
  }
};

// Helper function to send notification to room
export const sendNotificationToRoom = (io: SocketIOServer, roomId: string, notification: any) => {
  io.to(`room_${roomId}`).emit('room_notification', notification);
};

// Helper function to send room members online status
export const sendRoomMembersStatus = async (io: SocketIOServer, roomId: string) => {
  try {
    // Import RoomModel here to avoid circular dependency
    const roomSchema = await import('../database/schemas/room.schema');
    const RoomModel = roomSchema.default;
    
    // Get room members
    const room = await RoomModel.findById(roomId);
    if (!room) {
      console.log(`❌ Room ${roomId} not found`);
      return;
    }

    // Get online status for each member
    const membersWithStatus = room.members.map(member => ({
      userId: member.userId,
      username: member.username || 'Unknown',
      isOnline: connectedUsers.has(member.userId),
      role: member.role
    }));

    console.log(`📊 Room ${roomId} members status:`, membersWithStatus);

    // Send to all room members
    io.to(`room_${roomId}`).emit('room_members_status', membersWithStatus);
  } catch (error) {
    console.error('❌ Error sending room members status:', error);
  }
};
