/**
 * WebRTC utilities for voice broadcasting
 */

export interface VoiceBroadcastConfig {
  roomId: string;
  userId: string;
  username: string;
  isAdmin: boolean;
}

export class VoiceBroadcastManager {
  private roomId: string;
  private userId: string;
  private username: string;
  private isAdmin: boolean;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private socket: any;

  constructor(config: VoiceBroadcastConfig, socket: any) {
    this.roomId = config.roomId;
    this.userId = config.userId;
    this.username = config.username;
    this.isAdmin = config.isAdmin;
    this.socket = socket;
  }

  async startBroadcast(): Promise<void> {
    if (!this.isAdmin) {
      throw new Error('Only admins can start voice broadcasts');
    }

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Notify other users that broadcast started
      this.socket.emit('voice_broadcast_start', {
        roomId: this.roomId,
        userId: this.userId,
        username: this.username
      });

      console.log('🎤 Voice broadcast started');
    } catch (error) {
      console.error('Error starting voice broadcast:', error);
      throw error;
    }
  }

  stopBroadcast(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach(connection => {
      connection.close();
    });
    this.peerConnections.clear();

    // Clean up audio elements
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    this.audioElements.clear();

    // Notify other users that broadcast stopped
    this.socket.emit('voice_broadcast_stop', {
      roomId: this.roomId,
      userId: this.userId
    });

    console.log('🎤 Voice broadcast stopped');
  }

  async handleIncomingBroadcast(broadcasterId: string, broadcasterName: string): Promise<void> {
    if (broadcasterId === this.userId) return; // Don't connect to self

    try {
      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Handle incoming audio stream
      peerConnection.ontrack = (event) => {
        const audioElement = new Audio();
        audioElement.srcObject = event.streams[0];
        audioElement.autoplay = true;
        audioElement.volume = 0.8;
        
        this.audioElements.set(broadcasterId, audioElement);
        console.log(`🎧 Connected to ${broadcasterName}'s broadcast`);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('voice_ice_candidate', {
            roomId: this.roomId,
            targetUserId: broadcasterId,
            candidate: event.candidate
          });
        }
      };

      this.peerConnections.set(broadcasterId, peerConnection);

      // Request to join the broadcast
      this.socket.emit('voice_join_request', {
        roomId: this.roomId,
        broadcasterId: broadcasterId,
        userId: this.userId,
        username: this.username
      });

    } catch (error) {
      console.error('Error handling incoming broadcast:', error);
    }
  }

  async handleJoinRequest(requesterId: string, requesterName: string): Promise<void> {
    if (!this.isAdmin || !this.localStream) return;

    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('voice_ice_candidate', {
            roomId: this.roomId,
            targetUserId: requesterId,
            candidate: event.candidate
          });
        }
      };

      this.peerConnections.set(requesterId, peerConnection);

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to requester
      this.socket.emit('voice_offer', {
        roomId: this.roomId,
        targetUserId: requesterId,
        offer: offer
      });

      console.log(`🎤 Sending voice offer to ${requesterName}`);

    } catch (error) {
      console.error('Error handling join request:', error);
    }
  }

  async handleVoiceOffer(offer: RTCSessionDescriptionInit, fromUserId: string): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(offer);

      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer back
      this.socket.emit('voice_answer', {
        roomId: this.roomId,
        targetUserId: fromUserId,
        answer: answer
      });

    } catch (error) {
      console.error('Error handling voice offer:', error);
    }
  }

  async handleVoiceAnswer(answer: RTCSessionDescriptionInit, fromUserId: string): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling voice answer:', error);
    }
  }

  handleIceCandidate(candidate: RTCIceCandidateInit, fromUserId: string): void {
    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (!peerConnection) return;

      peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  cleanup(): void {
    this.stopBroadcast();
  }
}
