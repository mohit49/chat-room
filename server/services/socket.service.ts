import { Server as SocketIOServer } from 'socket.io';
import { sendNotificationToUser } from '../socket/socketHandlers';

class SocketService {
  private io: SocketIOServer | null = null;

  setIO(io: SocketIOServer) {
    this.io = io;
  }

  async sendNotificationToUser(userId: string, notification: any) {
    console.log(`🔌 SocketService: Attempting to send notification to user ${userId}`);
    console.log(`🔌 SocketService: IO instance available:`, !!this.io);
    
    if (this.io) {
      const { sendNotificationToUser } = require('../socket/socketHandlers');
      await sendNotificationToUser(this.io, userId, notification);
    } else {
      console.warn('❌ SocketService: Socket.IO not initialized, cannot send notification');
    }
  }

  sendNotificationToRoom(roomId: string, notification: any) {
    if (this.io) {
      this.io.to(`room_${roomId}`).emit('room_notification', notification);
    } else {
      console.warn('Socket.IO not initialized, cannot send room notification');
    }
  }
}

export default new SocketService();
