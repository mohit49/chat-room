import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserModel as User } from '../database/schemas/user.schema';
import { notificationService } from '../services/notification.service';
import { userService } from '../services/user.service';
import { OnlineStatus } from '../../types';

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

// Store open direct message chats
export const openDirectMessageChats = new Map<string, Set<string>>(); // userId -> Set of userIds they're chatting with

// Store disconnect timers for grace period
export const disconnectTimers = new Map<string, NodeJS.Timeout>(); // userId -> timeout

// Random Chat State Management
export const randomChatWaitingQueue = new Map<string, {
  userId: string;
  socketId: string;
  username: string;
  profile: any;
  filters?: any;
  joinedAt: Date;
}>(); // userId -> waiting user info

export const randomChatActiveSessions = new Map<string, {
  sessionId: string;
  user1Id: string;
  user2Id: string;
  user1SocketId: string;
  user2SocketId: string;
  status: 'connecting' | 'connected';
  startedAt: Date;
}>(); // sessionId -> session info

// Track which users are in active random chat
export const usersInRandomChat = new Map<string, string>(); // userId -> sessionId

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
            username: user.username,
            connectedAt: new Date()
          });
          console.log(`📋 Session stored: ${sessionId} → User: ${socket.userId}`);
        }
        
        // Join user to their personal room for notifications
        socket.join(`user_${socket.userId}`);
        
        // Send connection confirmation with session info
        socket.emit('connection_confirmed', {
          userId: socket.userId,
          username: user.username,
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

        // Cancel any existing disconnect timer
        if (disconnectTimers.has(socket.userId)) {
          clearTimeout(disconnectTimers.get(socket.userId));
          disconnectTimers.delete(socket.userId);
          console.log(`⏰ Cancelled disconnect timer for user ${socket.userId}`);
        }

        // Update user status to online and lastSeen
        await userService.updateUserStatus(socket.userId, 'online', new Date());

        // Broadcast online status to all users
        io.emit('user_online_status', {
          userId: socket.userId,
          isOnline: true,
          socketId: socket.id // Include new socket ID
        });
        
        // Notify other users that this user came online
        const userForBroadcast = await User.findById(socket.userId).select('username email profile').lean();
        if (userForBroadcast) {
          socket.broadcast.emit('user_online', {
            userId: socket.userId,
            user: {
              id: userForBroadcast._id.toString(),
              username: userForBroadcast.username,
              email: userForBroadcast.email,
              profile: {
                profilePicture: userForBroadcast.profile?.profilePicture,
                location: {
                  city: userForBroadcast.profile?.location?.city,
                  state: userForBroadcast.profile?.location?.state,
                  isVisible: userForBroadcast.profile?.location?.isVisible
                }
              },
              isOnline: true
            }
          });
          console.log(`✅ Broadcast user_online event for user ${socket.userId}`);
        }
        
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
    socket.on('send_message', async (messageData) => {
      // Update lastSeen on message activity
      if (socket.userId) {
        await userService.updateLastSeen(socket.userId);
      }
      
      // Broadcast message to all room members including sender
      io.to(`room_${messageData.roomId}`).emit('new_message', messageData);
    });

    // Handle typing indicators for rooms
    socket.on('user_typing', async (data) => {
      // Update lastSeen on typing activity
      if (socket.userId) {
        await userService.updateLastSeen(socket.userId);
      }
      
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

    // Handle opening direct message chat
    socket.on('open_direct_chat', (data: { targetUserId: string }) => {
      if (!socket.userId) return;
      
      // Track that this user has opened chat with targetUserId
      if (!openDirectMessageChats.has(socket.userId)) {
        openDirectMessageChats.set(socket.userId, new Set());
      }
      openDirectMessageChats.get(socket.userId)!.add(data.targetUserId);
      
      console.log(`💬 User ${socket.userId} opened chat with ${data.targetUserId}`);
    });

    // Handle closing direct message chat
    socket.on('close_direct_chat', (data: { targetUserId: string }) => {
      if (!socket.userId) return;
      
      // Remove from open chats
      const userChats = openDirectMessageChats.get(socket.userId);
      if (userChats) {
        userChats.delete(data.targetUserId);
        if (userChats.size === 0) {
          openDirectMessageChats.delete(socket.userId);
        }
      }
      
      console.log(`💬 User ${socket.userId} closed chat with ${data.targetUserId}`);
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
      
      // ✅ SECURITY: Verify user is admin before allowing broadcast
      try {
        const roomSchema = await import('../database/schemas/room.schema');
        const RoomModel = roomSchema.default;
        const room = await RoomModel.findById(data.roomId);
        
        if (!room) {
          console.error('❌ Room not found:', data.roomId);
          socket.emit('broadcast_error', { error: 'Room not found' });
          return;
        }
        
        // Check if user is admin
        const member = room.members.find((m: any) => m.userId === socket.userId);
        if (!member || member.role !== 'admin') {
          console.error('❌ User is not admin, cannot broadcast:', socket.userId);
          socket.emit('broadcast_error', { error: 'Only admins can broadcast' });
          return;
        }
        
        console.log('✅ Admin verification passed for user:', socket.userId);
        
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
        
        // Send to each room member individually (for home/rooms page)
        room.members.forEach((member: any) => {
          const memberSocketId = connectedUsers.get(member.userId);
          if (memberSocketId) {
            io.to(memberSocketId).emit('voice_broadcast_started', broadcastData);
          }
        });
        console.log('✅ Broadcast notification sent to all room members');
        
        // 📲 Send push notifications to all room members (except broadcaster)
        try {
          const { UserModel } = await import('../database/schemas/user.schema');
          const { pushNotificationService } = await import('../services/pushNotification.service');
          
          const memberIds = room.members
            .filter((m: any) => m.userId !== socket.userId)
            .map((m: any) => m.userId);

          // Get users with push enabled
          const usersWithPush = await UserModel.find({
            _id: { $in: memberIds },
            'profile.notificationSettings.pushEnabled': true
          });

          if (usersWithPush.length > 0) {
            await pushNotificationService.sendPushToMultipleUsers(
              usersWithPush.map((u: any) => u._id.toString()),
              {
                title: '🎙️ Live Broadcast Started!',
                body: `${socket.user?.username || socket.user?.mobileNumber} is broadcasting in ${room.name}`,
                icon: '/logo-icon.png',
                data: {
                  type: 'voice_broadcast',
                  roomId: data.roomId,
                  roomName: room.name,
                  broadcasterId: socket.userId,
                  broadcasterName: socket.user?.username || socket.user?.mobileNumber
                }
              }
            );
            console.log(`📲 Push notifications sent to ${usersWithPush.length} room members`);
          }
        } catch (pushError) {
          console.error('❌ Failed to send push notifications for broadcast:', pushError);
          // Don't fail the broadcast if push fails
        }
        
        console.log('✅ Broadcast started notification sent to room:', data.roomId);
      } catch (error) {
        console.error('❌ Error starting broadcast:', error);
        socket.emit('broadcast_error', { error: 'Failed to start broadcast' });
      }
    });

    // Handle audio streaming
    socket.on('audio_stream', async (data: { roomId: string; audioData: number[]; format?: string }) => {
      // ✅ SECURITY: Verify user is admin and is the active broadcaster
      const activeBroadcast = activeBroadcasts.get(data.roomId);
      
      if (!activeBroadcast || activeBroadcast.userId !== socket.userId) {
        console.warn('⚠️ Unauthorized audio stream attempt from user:', socket.userId);
        return;
      }
      
      // Relay audio stream to all room members except broadcaster
      socket.to(`room_${data.roomId}`).emit('audio_stream', {
        roomId: data.roomId,
        audioData: data.audioData,
        format: data.format || 'float32' // Pass through the format
      });
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

    // Handle get online users request
    socket.on('get_online_users', async () => {
      if (!socket.userId) return;
      
      try {
        console.log('📋 Get online users request from:', socket.userId);
        
        // Get all connected user IDs
        const onlineUserIds = Array.from(connectedUsers.keys()).filter(id => id !== socket.userId);
        console.log('👥 Online user IDs:', onlineUserIds);
        
        if (onlineUserIds.length === 0) {
          socket.emit('online_users', { users: [] });
          return;
        }
        
        // Fetch user details from database
        const users = await User.find({ _id: { $in: onlineUserIds } })
          .select('username email profile')
          .lean();
        
        // Format users for response
        const onlineUsers = users.map(user => ({
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          profile: {
            profilePicture: user.profile?.profilePicture,
            location: {
              city: user.profile?.location?.city,
              state: user.profile?.location?.state,
              isVisible: user.profile?.location?.isVisible
            }
          },
          isOnline: true
        }));
        
        console.log('✅ Sending online users:', onlineUsers.length);
        socket.emit('online_users', { users: onlineUsers });
      } catch (error) {
        console.error('❌ Error fetching online users:', error);
        socket.emit('online_users', { users: [] });
      }
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

    // Handle app lifecycle events
    socket.on('closing_app', async () => {
      console.log(`📱 User ${socket.userId} is closing the app`);
      if (socket.userId) {
        // Cancel any existing disconnect timer
        if (disconnectTimers.has(socket.userId)) {
          clearTimeout(disconnectTimers.get(socket.userId));
          disconnectTimers.delete(socket.userId);
        }
        
        // Immediately set offline (bypass grace period)
        await userService.updateUserStatus(socket.userId, 'offline', new Date());
        
        // Broadcast offline status
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          lastSeen: new Date()
        });
        
        console.log(`📱 User ${socket.userId} marked offline due to app close`);
      }
    });

    socket.on('app_background', async () => {
      console.log(`📱 User ${socket.userId} app went to background`);
      if (socket.userId) {
        // Update lastSeen but keep online status
        await userService.updateLastSeen(socket.userId);
      }
    });

    socket.on('app_foreground', async () => {
      console.log(`📱 User ${socket.userId} app came to foreground`);
      if (socket.userId) {
        // Update lastSeen and ensure online status
        await userService.updateUserStatus(socket.userId, 'online', new Date());
      }
    });

    // ====================
    // Instant Chat Handlers
    // ====================
    
    // Join instant chat room
    socket.on('join_instant_chat', (data: { chatId: string; participantId: string }) => {
      const { chatId, participantId } = data;
      socket.join(`instant_chat_${chatId}`);
      console.log(`👤 Participant ${participantId} joined instant chat: ${chatId}`);
      
      // Notify others in the chat
      socket.to(`instant_chat_${chatId}`).emit('instant_chat_user_joined', {
        participantId,
        chatId
      });
    });

    // Leave instant chat room
    socket.on('leave_instant_chat', async (data: { chatId: string; participantId: string; isCreator?: boolean }) => {
      const { chatId, participantId, isCreator } = data;
      socket.leave(`instant_chat_${chatId}`);
      console.log(`👤 Participant ${participantId} left instant chat: ${chatId}`);
      
      // If creator is leaving, end the chat for everyone
      if (isCreator) {
        console.log(`🚪 Creator is leaving instant chat ${chatId}, ending chat for all participants`);
        
        // Mark chat as inactive in database
        try {
          const { default: InstantChatModel } = await import('../database/schemas/instantChat.schema');
          await InstantChatModel.findOneAndUpdate(
            { chatId },
            { isActive: false }
          );
        } catch (error) {
          console.error('Error marking instant chat as inactive:', error);
        }
        
        // Notify all participants that creator has ended the chat
        io.to(`instant_chat_${chatId}`).emit('instant_chat_ended', {
          chatId,
          reason: 'Creator has left the chat'
        });
      } else {
        // Regular participant leaving, just notify others
        socket.to(`instant_chat_${chatId}`).emit('instant_chat_user_left', {
          participantId,
          chatId
        });
      }
    });

    // Send instant chat message
    socket.on('instant_chat_message', (data: {
      chatId: string;
      message: any;
    }) => {
      console.log(`💬 Instant chat message in ${data.chatId}:`, data.message);
      
      // Broadcast to all participants in the instant chat
      io.to(`instant_chat_${data.chatId}`).emit('instant_chat_message', {
        chatId: data.chatId,
        message: data.message
      });
    });

    // Typing indicator for instant chat
    socket.on('instant_chat_typing', (data: {
      chatId: string;
      participantId: string;
      participantName: string;
      isTyping: boolean;
    }) => {
      // Broadcast to others in the instant chat
      socket.to(`instant_chat_${data.chatId}`).emit('instant_chat_typing', {
        chatId: data.chatId,
        participantId: data.participantId,
        participantName: data.participantName,
        isTyping: data.isTyping
      });
    });

    // Delete message in instant chat
    socket.on('instant_chat_delete_message', (data: {
      chatId: string;
      messageId: string;
    }) => {
      console.log(`🗑️ Delete message ${data.messageId} in instant chat ${data.chatId}`);
      
      // Broadcast to all participants in the instant chat (including sender)
      io.to(`instant_chat_${data.chatId}`).emit('instant_chat_message_deleted', {
        chatId: data.chatId,
        messageId: data.messageId
      });
    });

    // ====================
    // End Instant Chat Handlers
    // ====================

    // ====================
    // Random Chat Handlers
    // ====================

    // Join random chat queue
    socket.on('random_chat_join_queue', async (data: { 
      filters?: { gender?: string; country?: string; state?: string; city?: string } 
    }) => {
      if (!socket.userId) return;
      
      try {
        console.log(`🎲 User ${socket.userId} joining random chat queue with filters:`, data.filters);
        
        // Check if user is already in active session
        const existingSession = usersInRandomChat.get(socket.userId);
        if (existingSession) {
          console.log(`⚠️ User ${socket.userId} already in active session ${existingSession}`);
          socket.emit('random_chat_error', { 
            error: 'You are already in an active random chat session' 
          });
          return;
        }
        
        // Get user details
        const user = await User.findById(socket.userId).select('username mobileNumber profile').lean();
        if (!user) {
          socket.emit('random_chat_error', { error: 'User not found' });
          return;
        }
        
        // Add to waiting queue
        randomChatWaitingQueue.set(socket.userId, {
          userId: socket.userId,
          socketId: socket.id,
          username: user.username,
          profile: {
            profilePicture: user.profile?.profilePicture,
            gender: user.profile?.gender,
            location: {
              city: user.profile?.location?.city,
              state: user.profile?.location?.state,
              country: user.profile?.location?.country
            }
          },
          filters: data.filters,
          joinedAt: new Date()
        });
        
        console.log(`✅ User ${socket.userId} added to random chat queue. Queue size: ${randomChatWaitingQueue.size}`);
        
        // Emit searching status
        socket.emit('random_chat_searching');
        
        // Try to find a match
        await findRandomChatMatch(io, socket.userId);
        
      } catch (error) {
        console.error('❌ Error joining random chat queue:', error);
        socket.emit('random_chat_error', { error: 'Failed to join random chat queue' });
      }
    });

    // Leave random chat queue
    socket.on('random_chat_leave_queue', () => {
      if (!socket.userId) return;
      
      randomChatWaitingQueue.delete(socket.userId);
      console.log(`🎲 User ${socket.userId} left random chat queue. Queue size: ${randomChatWaitingQueue.size}`);
      
      socket.emit('random_chat_queue_left');
    });

    // Skip current match attempt (during connecting phase)
    socket.on('random_chat_skip', async () => {
      if (!socket.userId) return;
      
      try {
        const sessionId = usersInRandomChat.get(socket.userId);
        if (!sessionId) return;
        
        const session = randomChatActiveSessions.get(sessionId);
        if (!session) return;
        
        console.log(`⏭️ User ${socket.userId} skipping match in session ${sessionId}`);
        
        // Get other user ID
        const otherUserId = session.user1Id === socket.userId ? session.user2Id : session.user1Id;
        const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
        
        // Clean up session
        randomChatActiveSessions.delete(sessionId);
        usersInRandomChat.delete(socket.userId);
        usersInRandomChat.delete(otherUserId);
        
        // Mark session as disconnected in database
        const { randomChatService } = await import('../services/randomChat.service');
        await randomChatService.endSession(sessionId);
        
        // Notify both users
        socket.emit('random_chat_skipped');
        io.to(otherUserSocketId).emit('random_chat_partner_skipped');
        
        // Put both users back in queue if they haven't left
        if (connectedUsers.has(socket.userId)) {
          await findRandomChatMatch(io, socket.userId);
        }
        if (connectedUsers.has(otherUserId)) {
          await findRandomChatMatch(io, otherUserId);
        }
        
      } catch (error) {
        console.error('❌ Error skipping random chat:', error);
      }
    });

    // Next - disconnect and find new match
    socket.on('random_chat_next', async () => {
      if (!socket.userId) return;
      
      try {
        const sessionId = usersInRandomChat.get(socket.userId);
        if (!sessionId) return;
        
        const session = randomChatActiveSessions.get(sessionId);
        if (!session) return;
        
        console.log(`⏭️ User ${socket.userId} requesting next match in session ${sessionId}`);
        
        // Get other user ID
        const otherUserId = session.user1Id === socket.userId ? session.user2Id : session.user1Id;
        const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
        
        // Clean up session
        randomChatActiveSessions.delete(sessionId);
        usersInRandomChat.delete(socket.userId);
        usersInRandomChat.delete(otherUserId);
        
        // Mark session as disconnected in database
        const { randomChatService } = await import('../services/randomChat.service');
        await randomChatService.endSession(sessionId);
        
        // Notify other user that partner disconnected
        io.to(otherUserSocketId).emit('random_chat_partner_disconnected');
        
        // Current user gets searching status
        socket.emit('random_chat_searching');
        
        // Put current user back in queue
        await findRandomChatMatch(io, socket.userId);
        
        // Put other user back in queue if they're still connected
        if (connectedUsers.has(otherUserId)) {
          await findRandomChatMatch(io, otherUserId);
        }
        
      } catch (error) {
        console.error('❌ Error requesting next random chat:', error);
      }
    });

    // Previous - reconnect with previous match
    socket.on('random_chat_previous', async (data: { partnerId: string }) => {
      if (!socket.userId) return;
      
      try {
        const { partnerId } = data;
        console.log(`⏮️ User ${socket.userId} requesting previous match with ${partnerId}`);
        
        // Clean up current session first
        const currentSessionId = usersInRandomChat.get(socket.userId);
        if (currentSessionId) {
          const currentSession = randomChatActiveSessions.get(currentSessionId);
          if (currentSession) {
            const otherUserId = currentSession.user1Id === socket.userId ? currentSession.user2Id : currentSession.user1Id;
            const otherUserSocketId = currentSession.user1Id === socket.userId ? currentSession.user2SocketId : currentSession.user1SocketId;
            
            randomChatActiveSessions.delete(currentSessionId);
            usersInRandomChat.delete(socket.userId);
            usersInRandomChat.delete(otherUserId);
            
            const { randomChatService } = await import('../services/randomChat.service');
            await randomChatService.endSession(currentSessionId);
            
            io.to(otherUserSocketId).emit('random_chat_partner_disconnected');
          }
        }
        
        // Check if the requested partner is online and available
        if (!connectedUsers.has(partnerId)) {
          socket.emit('random_chat_error', { 
            message: 'Previous user is no longer available. Finding a new match...' 
          });
          // Find a new random match instead
          await findRandomChatMatch(io, socket.userId);
          return;
        }
        
        // Check if partner is already in a chat
        if (usersInRandomChat.has(partnerId)) {
          socket.emit('random_chat_error', { 
            message: 'Previous user is currently in another chat. Finding a new match...' 
          });
          // Find a new random match instead
          await findRandomChatMatch(io, socket.userId);
          return;
        }
        
        // Get partner's details
        const partnerSocketId = Array.from(connectedUsers.entries()).find(([id]) => id === partnerId)?.[1];
        if (!partnerSocketId) {
          socket.emit('random_chat_error', { 
            message: 'Could not connect to previous user. Finding a new match...' 
          });
          await findRandomChatMatch(io, socket.userId);
          return;
        }
        
        // Get user profiles
        const { userService } = await import('../services/user.service');
        const currentUser = await userService.getUserById(socket.userId);
        const partnerUser = await userService.getUserById(partnerId);
        
        if (!currentUser || !partnerUser) {
          socket.emit('random_chat_error', { message: 'User not found' });
          return;
        }
        
        // Create new session
        const { randomChatService } = await import('../services/randomChat.service');
        const session = await randomChatService.createSession(socket.userId, partnerId);
        
        // Store session in memory
        randomChatActiveSessions.set(session.sessionId, {
          sessionId: session.sessionId,
          user1Id: socket.userId,
          user2Id: partnerId,
          user1SocketId: socket.id,
          user2SocketId: partnerSocketId,
          status: 'connecting',
          startedAt: new Date()
        });
        
        usersInRandomChat.set(socket.userId, session.sessionId);
        usersInRandomChat.set(partnerId, session.sessionId);
        
        // Notify both users
        socket.emit('random_chat_match_found', {
          sessionId: session.sessionId,
          partner: {
            id: partnerUser.id,
            username: partnerUser.username,
            profile: {
              profilePicture: partnerUser.profile?.profilePicture,
              gender: partnerUser.profile?.gender || 'not specified',
              location: partnerUser.profile?.location || {}
            }
          }
        });
        
        io.to(partnerSocketId).emit('random_chat_match_found', {
          sessionId: session.sessionId,
          partner: {
            id: currentUser.id,
            username: currentUser.username,
            profile: {
              profilePicture: currentUser.profile?.profilePicture,
              gender: currentUser.profile?.gender || 'not specified',
              location: currentUser.profile?.location || {}
            }
          }
        });
        
        console.log(`✅ Reconnected users ${socket.userId} and ${partnerId}`);
        
      } catch (error) {
        console.error('❌ Error reconnecting to previous match:', error);
        socket.emit('random_chat_error', { 
          message: 'Failed to reconnect. Finding a new match...' 
        });
        await findRandomChatMatch(io, socket.userId);
      }
    });

    // Exit random chat completely
    socket.on('random_chat_exit', async () => {
      if (!socket.userId) return;
      
      try {
        console.log(`🚪 User ${socket.userId} exiting random chat`);
        
        // Remove from queue
        randomChatWaitingQueue.delete(socket.userId);
        
        // Check if in active session
        const sessionId = usersInRandomChat.get(socket.userId);
        if (sessionId) {
          const session = randomChatActiveSessions.get(sessionId);
          if (session) {
            // Get other user
            const otherUserId = session.user1Id === socket.userId ? session.user2Id : session.user1Id;
            const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
            
            // Clean up session
            randomChatActiveSessions.delete(sessionId);
            usersInRandomChat.delete(socket.userId);
            usersInRandomChat.delete(otherUserId);
            
            // Mark session as disconnected in database
            const { randomChatService } = await import('../services/randomChat.service');
            await randomChatService.endSession(sessionId);
            
            // Notify other user
            io.to(otherUserSocketId).emit('random_chat_partner_disconnected');
          }
        }
        
        socket.emit('random_chat_exited');
        console.log(`✅ User ${socket.userId} exited random chat`);
        
      } catch (error) {
        console.error('❌ Error exiting random chat:', error);
      }
    });

    // Accept match
    socket.on('random_chat_accept_match', async (data: { sessionId: string }) => {
      if (!socket.userId) return;
      
      try {
        const session = randomChatActiveSessions.get(data.sessionId);
        if (!session) {
          socket.emit('random_chat_error', { error: 'Session not found' });
          return;
        }
        
        // Update session status
        session.status = 'connected';
        
        console.log(`✅ User ${socket.userId} accepted match in session ${data.sessionId}`);
        
        // Update database
        const { randomChatService } = await import('../services/randomChat.service');
        await randomChatService.updateSessionStatus(data.sessionId, 'connected');
        
        // Notify both users
        const bothAccepted = true; // For now, first accept makes it connected
        if (bothAccepted) {
          io.to(session.user1SocketId).emit('random_chat_connected', {
            sessionId: data.sessionId,
            partnerId: session.user2Id
          });
          io.to(session.user2SocketId).emit('random_chat_connected', {
            sessionId: data.sessionId,
            partnerId: session.user1Id
          });
        }
        
      } catch (error) {
        console.error('❌ Error accepting match:', error);
      }
    });

    // Random chat message
    socket.on('random_chat_message', async (data: {
      sessionId: string;
      message: string;
      messageType?: 'text' | 'image' | 'audio';
      imageUrl?: string;
      audioUrl?: string;
    }) => {
      if (!socket.userId) return;
      
      try {
        const session = randomChatActiveSessions.get(data.sessionId);
        if (!session) return;
        
        // Verify user is part of session
        if (session.user1Id !== socket.userId && session.user2Id !== socket.userId) {
          return;
        }
        
        const messageData = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          senderId: socket.userId,
          senderName: socket.user?.username || socket.user?.mobileNumber || 'Unknown',
          message: data.message,
          messageType: data.messageType || 'text',
          imageUrl: data.imageUrl,
          audioUrl: data.audioUrl,
          timestamp: new Date()
        };
        
        // Save to database
        const { randomChatService } = await import('../services/randomChat.service');
        await randomChatService.saveMessage(data.sessionId, messageData);
        
        // Broadcast to both users
        io.to(session.user1SocketId).emit('random_chat_message', {
          sessionId: data.sessionId,
          message: messageData
        });
        io.to(session.user2SocketId).emit('random_chat_message', {
          sessionId: data.sessionId,
          message: messageData
        });
        
      } catch (error) {
        console.error('❌ Error sending random chat message:', error);
      }
    });

    // Typing indicator
    socket.on('random_chat_typing', (data: { sessionId: string; isTyping: boolean }) => {
      if (!socket.userId) return;
      
      const session = randomChatActiveSessions.get(data.sessionId);
      if (!session) return;
      
      // Send to other user
      const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
      io.to(otherUserSocketId).emit('random_chat_typing', {
        sessionId: data.sessionId,
        isTyping: data.isTyping
      });
    });

    // WebRTC signaling for video/audio
    socket.on('random_chat_offer', (data: { sessionId: string; offer: any }) => {
      if (!socket.userId) return;
      
      const session = randomChatActiveSessions.get(data.sessionId);
      if (!session) return;
      
      const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
      io.to(otherUserSocketId).emit('random_chat_offer', {
        sessionId: data.sessionId,
        offer: data.offer,
        fromUserId: socket.userId
      });
    });

    socket.on('random_chat_answer', (data: { sessionId: string; answer: any }) => {
      if (!socket.userId) return;
      
      const session = randomChatActiveSessions.get(data.sessionId);
      if (!session) return;
      
      const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
      io.to(otherUserSocketId).emit('random_chat_answer', {
        sessionId: data.sessionId,
        answer: data.answer,
        fromUserId: socket.userId
      });
    });

    socket.on('random_chat_ice_candidate', (data: { sessionId: string; candidate: any }) => {
      if (!socket.userId) return;
      
      const session = randomChatActiveSessions.get(data.sessionId);
      if (!session) return;
      
      const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
      io.to(otherUserSocketId).emit('random_chat_ice_candidate', {
        sessionId: data.sessionId,
        candidate: data.candidate,
        fromUserId: socket.userId
      });
    });

    // ====================
    // End Random Chat Handlers
    // ====================

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User ${socket.userId} disconnected`);
      if (socket.userId) {
        // Clean up open direct message chats
        openDirectMessageChats.delete(socket.userId);
        
        // Clean up random chat if user was in session or queue
        randomChatWaitingQueue.delete(socket.userId);
        const randomSessionId = usersInRandomChat.get(socket.userId);
        if (randomSessionId) {
          const session = randomChatActiveSessions.get(randomSessionId);
          if (session) {
            // Get other user
            const otherUserId = session.user1Id === socket.userId ? session.user2Id : session.user1Id;
            const otherUserSocketId = session.user1Id === socket.userId ? session.user2SocketId : session.user1SocketId;
            
            // Clean up session
            randomChatActiveSessions.delete(randomSessionId);
            usersInRandomChat.delete(socket.userId);
            usersInRandomChat.delete(otherUserId);
            
            // Mark session as disconnected in database
            try {
              const { randomChatService } = await import('../services/randomChat.service');
              await randomChatService.endSession(randomSessionId);
            } catch (error) {
              console.error('Error ending random chat session:', error);
            }
            
            // Notify other user
            io.to(otherUserSocketId).emit('random_chat_partner_disconnected');
            console.log(`🎲 Cleaned up random chat session ${randomSessionId} due to disconnect`);
          }
        }
        
        // Only remove from connectedUsers if this is the current socket for this user
        const currentSocketId = connectedUsers.get(socket.userId);
        if (currentSocketId === socket.id) {
          connectedUsers.delete(socket.userId);
          console.log(`🗑️ Removed user ${socket.userId} from connected users`);
          
          // Cancel any existing disconnect timer
          if (disconnectTimers.has(socket.userId)) {
            clearTimeout(disconnectTimers.get(socket.userId));
            disconnectTimers.delete(socket.userId);
          }
          
          // Set status to "away" immediately
          await userService.updateUserStatus(socket.userId, 'away');
          
          // Broadcast away status to all users
          socket.broadcast.emit('user_away', {
            userId: socket.userId
          });
          
          // Start grace period timer (5 minutes)
          const timer = setTimeout(async () => {
            if (!socket.userId) return;
            console.log(`⏰ Grace period expired for user ${socket.userId}, setting offline`);
            await userService.updateUserStatus(socket.userId, 'offline', new Date());
            
            // Broadcast offline status with lastSeen
            socket.broadcast.emit('user_offline', {
              userId: socket.userId,
              lastSeen: new Date()
            });
            
            disconnectTimers.delete(socket.userId);
          }, 5 * 60 * 1000); // 5 minutes
          
          if (socket.userId) {
            disconnectTimers.set(socket.userId, timer);
          }
          console.log(`⏰ Started grace period timer for user ${socket.userId}`);
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

// Helper function to check if user has direct chat open
export const isDirectChatOpen = (userId: string, otherUserId: string): boolean => {
  const userChats = openDirectMessageChats.get(userId);
  return userChats ? userChats.has(otherUserId) : false;
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

// Helper function to find a random chat match
async function findRandomChatMatch(io: SocketIOServer, userId: string) {
  try {
    const currentUser = randomChatWaitingQueue.get(userId);
    if (!currentUser) {
      console.log(`⚠️ User ${userId} not in waiting queue`);
      return;
    }
    
    console.log(`🔍 Finding match for user ${userId} with filters:`, currentUser.filters);
    
    // Find potential matches
    const potentialMatches: any[] = [];
    
    for (const [candidateId, candidate] of randomChatWaitingQueue.entries()) {
      // Skip self
      if (candidateId === userId) continue;
      
      // Skip users already in active sessions
      if (usersInRandomChat.has(candidateId)) continue;
      
      // Check if candidate matches current user's filters
      let matchesFilters = true;
      
      if (currentUser.filters) {
        if (currentUser.filters.gender && currentUser.filters.gender !== '' && 
            candidate.profile.gender !== currentUser.filters.gender) {
          matchesFilters = false;
        }
        if (currentUser.filters.country && 
            candidate.profile.location.country !== currentUser.filters.country) {
          matchesFilters = false;
        }
        if (currentUser.filters.state && 
            candidate.profile.location.state !== currentUser.filters.state) {
          matchesFilters = false;
        }
        if (currentUser.filters.city && 
            candidate.profile.location.city !== currentUser.filters.city) {
          matchesFilters = false;
        }
      }
      
      // Check if current user matches candidate's filters
      if (candidate.filters) {
        if (candidate.filters.gender && candidate.filters.gender !== '' && 
            currentUser.profile.gender !== candidate.filters.gender) {
          matchesFilters = false;
        }
        if (candidate.filters.country && 
            currentUser.profile.location.country !== candidate.filters.country) {
          matchesFilters = false;
        }
        if (candidate.filters.state && 
            currentUser.profile.location.state !== candidate.filters.state) {
          matchesFilters = false;
        }
        if (candidate.filters.city && 
            currentUser.profile.location.city !== candidate.filters.city) {
          matchesFilters = false;
        }
      }
      
      if (matchesFilters) {
        potentialMatches.push(candidate);
      }
    }
    
    console.log(`✅ Found ${potentialMatches.length} potential matches for user ${userId}`);
    
    if (potentialMatches.length === 0) {
      console.log(`⏳ No matches found for user ${userId}, keeping in queue`);
      return;
    }
    
    // Pick a random match
    const match = potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
    
    // Create session
    const { randomChatService } = await import('../services/randomChat.service');
    const session = await randomChatService.createSession(userId, match.userId);
    
    // Remove both users from waiting queue
    randomChatWaitingQueue.delete(userId);
    randomChatWaitingQueue.delete(match.userId);
    
    // Add to active sessions
    const sessionInfo = {
      sessionId: session.sessionId,
      user1Id: userId,
      user2Id: match.userId,
      user1SocketId: currentUser.socketId,
      user2SocketId: match.socketId,
      status: 'connecting' as const,
      startedAt: new Date()
    };
    
    randomChatActiveSessions.set(session.sessionId, sessionInfo);
    usersInRandomChat.set(userId, session.sessionId);
    usersInRandomChat.set(match.userId, session.sessionId);
    
    console.log(`🎉 Match found! Session ${session.sessionId}: ${userId} <-> ${match.userId}`);
    
    // Notify both users
    io.to(currentUser.socketId).emit('random_chat_match_found', {
      sessionId: session.sessionId,
      partner: {
        id: match.userId,
        username: match.username,
        profile: match.profile
      }
    });
    
    io.to(match.socketId).emit('random_chat_match_found', {
      sessionId: session.sessionId,
      partner: {
        id: userId,
        username: currentUser.username,
        profile: currentUser.profile
      }
    });
    
  } catch (error) {
    console.error('❌ Error finding random chat match:', error);
  }
}
