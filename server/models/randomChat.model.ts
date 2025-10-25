export interface RandomChatSession {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'connecting' | 'connected' | 'disconnected';
  startedAt: Date;
  endedAt?: Date;
  messages?: RandomChatMessage[];
}

export interface RandomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface RandomChatFilter {
  gender?: 'male' | 'female' | 'other' | '';
  country?: string;
  state?: string;
  city?: string;
}

export interface RandomChatAvailableUser {
  userId: string;
  socketId: string;
  username: string;
  profile: {
    profilePicture?: any;
    gender: string;
    location: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  filters?: RandomChatFilter;
  joinedAt: Date;
}

