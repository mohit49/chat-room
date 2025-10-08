'use client';

import { Socket } from 'socket.io-client';

// Event handler types
export interface SocketEventHandlers {
  // Message events
  onNewMessage?: (message: any) => void;
  onDirectMessage?: (message: any) => void;
  onMessageStatus?: (data: { messageId: string; status: 'sent' | 'delivered' | 'read' }) => void;
  onMessagesRead?: (data: { readBy: string; readByUsername: string; timestamp: string }) => void;
  
  // Typing events
  onUserTyping?: (data: { userId: string; isTyping: boolean; username: string; roomId: string }) => void;
  onDirectMessageTyping?: (data: { userId: string; isTyping: boolean; username: string }) => void;
  
  // Online status events
  onUserOnlineStatus?: (data: { userId: string; isOnline: boolean }) => void;
  onRoomMembersStatus?: (members: any[]) => void;
  onUserJoinedRoom?: (data: { userId: string; username: string }) => void;
  onUserLeftRoom?: (data: { userId: string; username: string }) => void;
  
  // Notification events
  onMessageNotification?: (notification: any) => void;
  onNotification?: (notification: any) => void;
  onNotificationRead?: (data: { notificationId: string; success: boolean }) => void;
  onInvitationApproved?: (data: { notificationId: string; success: boolean; roomId?: string }) => void;
  onInvitationRejected?: (data: { notificationId: string; success: boolean }) => void;
  
  // Voice/WebRTC events
  onVoiceBroadcastStarted?: (data: { userId: string; username: string; roomId: string }) => void;
  onVoiceBroadcastStopped?: (data: { userId: string; roomId: string }) => void;
  onVoiceJoinRequest?: (data: { requesterId: string; requesterName: string; roomId: string }) => void;
  onVoiceOffer?: (data: { offer: any; fromUserId: string; roomId: string }) => void;
  onVoiceAnswer?: (data: { answer: any; fromUserId: string; roomId: string }) => void;
  onVoiceIceCandidate?: (data: { candidate: any; fromUserId: string; roomId: string }) => void;
  
  // Connection events
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onAuthError?: (error: any) => void;
  onConnectionConfirmed?: (data: any) => void;
  onConnectError?: (error: any) => void;
}

// Socket event manager class
export class SocketEventManager {
  private socket: Socket | null = null;
  private handlers: Map<string, SocketEventHandlers> = new Map();
  private isSetup = false;

  constructor(socket: Socket | null) {
    this.socket = socket;
  }

  // Update socket instance
  updateSocket(socket: Socket | null) {
    this.socket = socket;
    if (socket && !this.isSetup) {
      this.setupGlobalListeners();
    }
  }

  // Register event handlers for a specific component
  registerHandlers(componentId: string, handlers: SocketEventHandlers) {
    this.handlers.set(componentId, handlers);
    
    // If socket is available and not yet setup, setup now
    if (this.socket && !this.isSetup) {
      this.setupGlobalListeners();
    }
  }

  // Unregister event handlers for a specific component
  unregisterHandlers(componentId: string) {
    this.handlers.delete(componentId);
  }

  // Setup global socket listeners
  private setupGlobalListeners() {
    if (!this.socket || this.isSetup) return;

    // Message events
    this.socket.on('new_message', (message: any) => {
      this.broadcastToHandlers('onNewMessage', message);
    });

    this.socket.on('direct_message', (message: any) => {
      this.broadcastToHandlers('onDirectMessage', message);
    });

    this.socket.on('message_status', (data: { messageId: string; status: 'sent' | 'delivered' | 'read' }) => {
      this.broadcastToHandlers('onMessageStatus', data);
    });

    this.socket.on('messages_read', (data: { readBy: string; readByUsername: string; timestamp: string }) => {
      this.broadcastToHandlers('onMessagesRead', data);
    });

    // Typing events
    this.socket.on('user_typing', (data: { userId: string; isTyping: boolean; username: string; roomId: string }) => {
      this.broadcastToHandlers('onUserTyping', data);
    });

    this.socket.on('direct_message_typing', (data: { userId: string; isTyping: boolean; username: string }) => {
      this.broadcastToHandlers('onDirectMessageTyping', data);
    });

    // Online status events
    this.socket.on('user_online_status', (data: { userId: string; isOnline: boolean }) => {
      this.broadcastToHandlers('onUserOnlineStatus', data);
    });

    this.socket.on('room_members_status', (members: any[]) => {
      this.broadcastToHandlers('onRoomMembersStatus', members);
    });

    this.socket.on('user_joined_room', (data: { userId: string; username: string }) => {
      this.broadcastToHandlers('onUserJoinedRoom', data);
    });

    this.socket.on('user_left_room', (data: { userId: string; username: string }) => {
      this.broadcastToHandlers('onUserLeftRoom', data);
    });

    // Notification events
    this.socket.on('message_notification', (notification: any) => {
      this.broadcastToHandlers('onMessageNotification', notification);
    });

    this.socket.on('notification', (notification: any) => {
      this.broadcastToHandlers('onNotification', notification);
    });

    this.socket.on('notification_read', (data: { notificationId: string; success: boolean }) => {
      this.broadcastToHandlers('onNotificationRead', data);
    });

    this.socket.on('invitation_approved', (data: { notificationId: string; success: boolean; roomId?: string }) => {
      this.broadcastToHandlers('onInvitationApproved', data);
    });

    this.socket.on('invitation_rejected', (data: { notificationId: string; success: boolean }) => {
      this.broadcastToHandlers('onInvitationRejected', data);
    });

    // Voice/WebRTC events
    this.socket.on('voice_broadcast_started', (data: { userId: string; username: string; roomId: string }) => {
      this.broadcastToHandlers('onVoiceBroadcastStarted', data);
    });

    this.socket.on('voice_broadcast_stopped', (data: { userId: string; roomId: string }) => {
      this.broadcastToHandlers('onVoiceBroadcastStopped', data);
    });

    this.socket.on('voice_join_request', (data: { requesterId: string; requesterName: string; roomId: string }) => {
      this.broadcastToHandlers('onVoiceJoinRequest', data);
    });

    this.socket.on('voice_offer', (data: { offer: any; fromUserId: string; roomId: string }) => {
      this.broadcastToHandlers('onVoiceOffer', data);
    });

    this.socket.on('voice_answer', (data: { answer: any; fromUserId: string; roomId: string }) => {
      this.broadcastToHandlers('onVoiceAnswer', data);
    });

    this.socket.on('voice_ice_candidate', (data: { candidate: any; fromUserId: string; roomId: string }) => {
      this.broadcastToHandlers('onVoiceIceCandidate', data);
    });

    // Connection events
    this.socket.on('connect', () => {
      this.broadcastToHandlers('onConnect');
    });

    this.socket.on('disconnect', (reason: string) => {
      this.broadcastToHandlers('onDisconnect', reason);
    });

    this.socket.on('auth_error', (error: any) => {
      this.broadcastToHandlers('onAuthError', error);
    });

    this.socket.on('connection_confirmed', (data: any) => {
      this.broadcastToHandlers('onConnectionConfirmed', data);
    });

    this.socket.on('connect_error', (error: any) => {
      this.broadcastToHandlers('onConnectError', error);
    });

    this.isSetup = true;
  }

  // Broadcast event to all registered handlers
  private broadcastToHandlers(eventName: keyof SocketEventHandlers, data?: any) {
    // Only process handlers that have the specific event handler
    for (const [componentId, handlers] of this.handlers) {
      const handler = handlers[eventName];
      if (handler) {
        try {
          if (data !== undefined) {
            handler(data);
          } else {
            (handler as () => void)();
          }
        } catch (error) {
          console.error(`❌ Error in ${componentId} handler for ${eventName}:`, error);
        }
      }
    }
  }

  // Emit events to server
  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Cleanup all listeners
  cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    this.handlers.clear();
    this.isSetup = false;
  }
}

// Global instance
let globalSocketEventManager: SocketEventManager | null = null;

// Get or create global socket event manager
export const getSocketEventManager = (socket?: Socket | null): SocketEventManager => {
  if (!globalSocketEventManager) {
    globalSocketEventManager = new SocketEventManager(socket || null);
  } else if (socket !== undefined && socket !== null && globalSocketEventManager['socket'] !== socket) {
    // Only update if socket has changed
    globalSocketEventManager.updateSocket(socket);
  }
  return globalSocketEventManager;
};

// Cleanup global instance
export const cleanupSocketEventManager = () => {
  if (globalSocketEventManager) {
    globalSocketEventManager.cleanup();
    globalSocketEventManager = null;
  }
};
