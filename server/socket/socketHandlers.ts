import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserModel as User } from '../database/schemas/user.schema';
import { notificationService } from '../services/notification.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

// Store connected users with session management
export const connectedUsers = new Map<string, string>(); // userId -> socketId
export const userSessions = new Map<string, {
  socketId: string;
  sessionId: string;
  userId: string;
  username: string;
  connectedAt: Date;
}>(); // sessionId -> user info

// Store active broadcasts
export const activeBroadcasts = new Map<string, {
  roomId: string;
  userId: string;
  username: string;
  startedAt: Date;
}>(); // roomId -> broadcast info

export const setupSocketHandlers = (io: SocketIOServer) => {
  console.log('🔌 Setting up Socket.IO handlers');
  
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);
    
    // Handle authentication after connection
    socket.on('authenticate', async (data) => {
      try {
        const { token, sessionId, reuseSession } = data;
        
        console.log('🔌 Authentication attempt:', {
          socketId: socket.id,
          sessionId,
          reuseSession,
          hasToken: !!token
        });
        
        if (!token) {
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }

        const decoded = jwt.verify(token, config.jwt.secret) as any;
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          socket.emit('auth_error', { message: 'User not found' });
          return;
        }

        socket.userId = user._id.toString();
        socket.user = user;
        
        // Check if user was previously connected with different socket
        const oldSocketId = connectedUsers.get(socket.userId);
        if (oldSocketId && oldSocketId !== socket.id) {
          console.log(`🔄 User ${socket.userId} reconnecting - updating socket ID mapping`);
          console.log(`   Old socket: ${oldSocketId} → New socket: ${socket.id}`);
          
          // Disconnect old socket if it exists
          const oldSocket = io.sockets.sockets.get(oldSocketId);
          if (oldSocket) {
            console.log(`🔌 Disconnecting old socket: ${oldSocketId}`);
            oldSocket.disconnect(true);
          }
        }
        
        // Update user connection mapping
        connectedUsers.set(socket.userId, socket.id);
        
        // Store session info
        if (sessionId) {
          userSessions.set(sessionId, {
            socketId: socket.id,
            sessionId,
            userId: socket.userId,
            username: user.username || user.mobileNumber,
            connectedAt: new Date()
          });
          console.log(`📋 Session stored: ${sessionId} → User: ${socket.userId}`);
        }
        
        // Join user to their personal room for notifications
        socket.join(`user_${socket.userId}`);
        
        // Send connection confirmation with session info
        socket.emit('connection_confirmed', {
          userId: socket.userId,
          username: user.username || user.mobileNumber,
          socketId: socket.id,
          sessionId,
          message: 'Successfully connected to notification service'
        });

        // Send active broadcasts for all rooms this user is a member of
        if (activeBroadcasts.size > 0) {
          try {
            const roomSchema = await import('../database/schemas/room.schema');
            const RoomModel = roomSchema.default;
            
            // Find all rooms where this user is a member
            const userRooms = await RoomModel.find({
              'members.userId': socket.userId,
              isActive: true
            });
            
            // Send broadcast status for each room
            userRooms.forEach(room => {
              const roomBroadcast = activeBroadcasts.get(room._id.toString());
              if (roomBroadcast) {
                console.log(`📻 Sending active broadcast status for room ${room._id} to user ${socket.userId}`);
                socket.emit('voice_broadcast_started', {
                  userId: roomBroadcast.userId,
                  username: roomBroadcast.username,
                  roomId: roomBroadcast.roomId
                });
              }
            });
          } catch (error) {
            console.error('❌ Error sending active broadcast status:', error);
          }
        }

        // Broadcast online status to all users with updated socket mapping
        io.emit('user_online_status', {
          userId: socket.userId,
          isOnline: true,
          socketId: socket.id // Include new socket ID
        });
        
        // Send current online users list to all users (refresh mappings)
        const onlineUsersList = Array.from(connectedUsers.keys());
        io.emit('online_users_update', onlineUsersList);
        
        // Notify all connected users about the socket mapping update
        socket.broadcast.emit('socket_mapping_update', {
          userId: socket.userId,
          newSocketId: socket.id,
          oldSocketId: oldSocketId
        });
        
      } catch (error) {
        console.log('❌ Socket authentication error:', error);
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    // Handle joining room channels
    socket.on('join_room', async (roomId: string) => {
      // Validate roomId
      if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.log(`❌ Invalid roomId received: ${roomId}`);
        socket.emit('join_room_error', { error: 'Invalid room ID' });
        return;
      }

      socket.join(`room_${roomId}`);
      console.log(`User ${socket.userId} joined room ${roomId}`);
      
      // Notify other room members that user joined
      socket.to(`room_${roomId}`).emit('user_joined_room', {
        userId: socket.userId,
        username: socket.user?.username || socket.user?.mobileNumber
      });

      // Send current online members to the user who joined
      await sendRoomMembersStatus(io, roomId);
      
      // Send current broadcast status if there's an active broadcast
      const activeBroadcast = activeBroadcasts.get(roomId);
      if (activeBroadcast) {
        console.log(`📻 Sending active broadcast status to user joining room ${roomId}:`, activeBroadcast);
        socket.emit('voice_broadcast_started', {
          userId: activeBroadcast.userId,
          username: activeBroadcast.username,
          roomId: activeBroadcast.roomId
        });
      }
    });

    // Handle leaving room channels
    socket.on('leave_room', (roomId: string) => {
      // Validate roomId
      if (!roomId || roomId === 'undefined' || roomId === 'null') {
        console.log(`❌ Invalid roomId received for leave_room: ${roomId}`);
        return;
      }

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
      // Validate roomId
      if (!data.roomId || data.roomId === 'undefined' || data.roomId === 'null') {
        console.log(`❌ Invalid roomId received for user_typing: ${data.roomId}`);
        return;
      }

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

    // Handle real-time message deletion
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, senderId, receiverId, messageType, imageUrl, audioUrl } = data;
        
        // Verify the sender is the one deleting
        if (senderId !== socket.userId) {
          socket.emit('delete_error', { error: 'You can only delete your own messages' });
          return;
        }

        // Delete from database
        const { directMessageService } = await import('../services/directMessage.service');
        const success = await directMessageService.deleteMessage(messageId, senderId);
        
        if (success) {
          // Delete associated files if they exist
          if (imageUrl || audioUrl) {
            const { deleteFile } = await import('../utils/fileDelete');
            if (imageUrl) await deleteFile(imageUrl);
            if (audioUrl) await deleteFile(audioUrl);
          }

          // Broadcast deletion to both users
          io.to(`user_${receiverId}`).emit('message_deleted', { messageId });
          io.to(`user_${senderId}`).emit('message_deleted', { messageId });
          
          console.log(`✅ Message ${messageId} deleted in real-time`);
        } else {
          socket.emit('delete_error', { error: 'Failed to delete message' });
        }
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        socket.emit('delete_error', { error: 'Failed to delete message' });
      }
    });

    // Handle real-time conversation deletion
    socket.on('delete_conversation', async (data) => {
      try {
        const { senderId, receiverId } = data;
        
        // Verify the sender
        if (senderId !== socket.userId) {
          socket.emit('delete_error', { error: 'Unauthorized' });
          return;
        }

        // Delete conversation from database
        const { directMessageService } = await import('../services/directMessage.service');
        const success = await directMessageService.deleteConversation(senderId, receiverId);
        
        if (success) {
          // Broadcast conversation deletion to both users
          io.to(`user_${receiverId}`).emit('conversation_deleted');
          io.to(`user_${senderId}`).emit('conversation_deleted');
          
          console.log(`✅ Conversation between ${senderId} and ${receiverId} deleted in real-time`);
        } else {
          socket.emit('delete_error', { error: 'Failed to delete conversation' });
        }
      } catch (error) {
        console.error('❌ Error deleting conversation:', error);
        socket.emit('delete_error', { error: 'Failed to delete conversation' });
      }
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
    socket.on('voice_broadcast_start', async (data) => {
      console.log('🎤 Voice broadcast started:', data);
      const broadcastData = {
        userId: socket.userId,
        username: socket.user?.username || socket.user?.mobileNumber,
        roomId: data.roomId
      };
      
      // Store active broadcast
      activeBroadcasts.set(data.roomId, {
        roomId: data.roomId,
        userId: socket.userId!,
        username: socket.user?.username || socket.user?.mobileNumber || 'Unknown',
        startedAt: new Date()
      });
      console.log('📻 Active broadcast stored for room:', data.roomId);
      
      // Send to all room members in room channel
      io.to(`room_${data.roomId}`).emit('voice_broadcast_started', broadcastData);
      
      // Also send to broadcaster
      socket.emit('voice_broadcast_started', broadcastData);
      
      // Get all room members and send to each individually (for home/rooms page)
      try {
        const roomSchema = await import('../database/schemas/room.schema');
        const RoomModel = roomSchema.default;
        const room = await RoomModel.findById(data.roomId);
        
        if (room) {
          // Send to each room member individually
          room.members.forEach(member => {
            const memberSocketId = connectedUsers.get(member.userId);
            if (memberSocketId) {
              io.to(memberSocketId).emit('voice_broadcast_started', broadcastData);
            }
          });
          console.log('✅ Broadcast notification sent to all room members');
        }
      } catch (error) {
        console.error('❌ Error notifying room members:', error);
      }
      
      console.log('✅ Broadcast started notification sent to room:', data.roomId);
    });

    socket.on('voice_broadcast_stop', async (data) => {
      console.log('🎤 Voice broadcast stopped:', data);
      const stopData = {
        userId: socket.userId,
        roomId: data.roomId
      };
      
      // Remove from active broadcasts
      activeBroadcasts.delete(data.roomId);
      console.log('📻 Active broadcast removed for room:', data.roomId);
      
      // Send to all room members in room channel
      io.to(`room_${data.roomId}`).emit('voice_broadcast_stopped', stopData);
      
      // Also send to broadcaster
      socket.emit('voice_broadcast_stopped', stopData);
      
      // Get all room members and send to each individually (for home/rooms page)
      try {
        const roomSchema = await import('../database/schemas/room.schema');
        const RoomModel = roomSchema.default;
        const room = await RoomModel.findById(data.roomId);
        
        if (room) {
          // Send to each room member individually
          room.members.forEach(member => {
            const memberSocketId = connectedUsers.get(member.userId);
            if (memberSocketId) {
              io.to(memberSocketId).emit('voice_broadcast_stopped', stopData);
            }
          });
          console.log('✅ Broadcast stop notification sent to all room members');
        }
      } catch (error) {
        console.error('❌ Error notifying room members:', error);
      }
      
      console.log('✅ Broadcast stopped notification sent to room:', data.roomId);
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
        // Only remove from connectedUsers if this is the current socket for this user
        const currentSocketId = connectedUsers.get(socket.userId);
        if (currentSocketId === socket.id) {
          connectedUsers.delete(socket.userId);
          console.log(`🗑️ Removed user ${socket.userId} from connected users`);
          
          // Broadcast offline status to all users
          socket.broadcast.emit('user_online_status', {
            userId: socket.userId,
            isOnline: false
          });
        } else {
          console.log(`🔄 User ${socket.userId} has newer connection, keeping online status`);
        }
        
        // Clean up session info for this socket
        for (const [sessionId, sessionInfo] of userSessions.entries()) {
          if (sessionInfo.socketId === socket.id) {
            userSessions.delete(sessionId);
            console.log(`🗑️ Cleaned up session: ${sessionId}`);
            break;
          }
        }
        
        // Notify all rooms that this user's status may have changed
        const rooms = Array.from(socket.rooms).filter(room => room.startsWith('room_'));
        for (const room of rooms) {
          const roomId = room.replace('room_', '');
          await sendRoomMembersStatus(io, roomId);
        }
      }
    });
  });
};

// Helper function to get current socket ID for user
export const getCurrentSocketId = (userId: string): string | undefined => {
  return connectedUsers.get(userId);
};

// Helper function to update socket mapping when user reconnects
export const updateUserSocketMapping = (userId: string, newSocketId: string, oldSocketId?: string) => {
  if (oldSocketId && oldSocketId !== newSocketId) {
    console.log(`🔄 Updating socket mapping for user ${userId}: ${oldSocketId} → ${newSocketId}`);
  }
  connectedUsers.set(userId, newSocketId);
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
    // Validate roomId before proceeding
    if (!roomId || roomId === 'undefined' || roomId === 'null') {
      console.log(`❌ Invalid roomId provided to sendRoomMembersStatus: ${roomId}`);
      return;
    }

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
