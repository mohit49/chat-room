# Random Connect Feature Documentation

## Overview

Random Connect is a feature that allows online users to connect randomly with each other for video/audio chat. It's similar to Omegle or Chatroulette, providing a real-time, peer-to-peer communication experience with advanced filtering options.

## Features

### Core Functionality

1. **Random Matching**
   - Connects online users randomly
   - One-to-one connections only
   - Skips users already in active random chat sessions
   - Intelligent matching algorithm based on user filters

2. **User Filters**
   - Gender filter (Male, Female, Other, or Any)
   - Country filter
   - State filter
   - City filter
   - Bidirectional filter matching (both users' filters must match)

3. **Video Calling**
   - WebRTC-based peer-to-peer video communication
   - Toggle video on/off
   - Picture-in-picture local video view
   - High-quality video streaming

4. **Audio Calling**
   - Real-time audio communication
   - Toggle audio/microphone on/off
   - Clear audio quality

5. **Text Chat**
   - Real-time messaging during video call
   - Typing indicators
   - Message history for current session
   - Side panel chat interface

6. **Connection Controls**
   - **Skip**: Skip during the connecting phase (before fully connected)
   - **Next**: Disconnect from current user and find new match
   - **Exit**: Leave random chat completely and return to home
   - Auto-reconnect after disconnection

7. **User Interface**
   - Full-screen immersive experience
   - Clean, modern design
   - Responsive controls
   - Status indicators (searching, connecting, connected, disconnected)

## Architecture

### Backend Components

#### 1. Database Schema (`server/database/schemas/randomChat.schema.ts`)
```typescript
- sessionId: Unique identifier for each random chat session
- user1Id & user2Id: Participating user IDs
- status: Session status (connecting, connected, disconnected)
- messages: Array of chat messages
- startedAt & endedAt: Session timestamps
```

#### 2. Service Layer (`server/services/randomChat.service.ts`)
- `getAvailableUsers()`: Get users matching filters
- `createSession()`: Create new random chat session
- `updateSessionStatus()`: Update session state
- `getActiveSession()`: Get user's current active session
- `saveMessage()`: Save chat message
- `endSession()`: Terminate session

#### 3. Socket Handlers (`server/socket/socketHandlers.ts`)

**State Management:**
- `randomChatWaitingQueue`: Users waiting for matches
- `randomChatActiveSessions`: Active chat sessions
- `usersInRandomChat`: Mapping of users to their sessions

**Socket Events:**
- `random_chat_join_queue`: User joins the matching queue
- `random_chat_leave_queue`: User leaves the queue
- `random_chat_skip`: Skip current match
- `random_chat_next`: Get next match
- `random_chat_exit`: Exit random chat
- `random_chat_message`: Send text message
- `random_chat_typing`: Typing indicator
- `random_chat_offer`: WebRTC offer
- `random_chat_answer`: WebRTC answer
- `random_chat_ice_candidate`: WebRTC ICE candidate

**Emitted Events:**
- `random_chat_searching`: Searching for match
- `random_chat_match_found`: Match found
- `random_chat_connected`: Connected to partner
- `random_chat_partner_disconnected`: Partner left
- `random_chat_partner_skipped`: Partner skipped
- `random_chat_error`: Error occurred

#### 4. API Routes (`server/routes/randomChat.routes.ts`)
- `GET /api/chat/random/available-users`: Get available users with filters
- `GET /api/chat/random/active-session`: Get user's active session
- `POST /api/chat/random/end-session/:sessionId`: End session
- `GET /api/chat/random/messages/:sessionId`: Get session messages

### Frontend Components

#### 1. Page (`app/random-connect/page.tsx`)
- Authentication check
- Online status verification
- Full-screen wrapper
- Integration with RandomChatWidget

#### 2. Widget (`components/chat/RandomChatWidget.tsx`)

**State Management:**
- Connection status tracking
- Partner information
- Messages and typing indicators
- Video/audio states
- Filter settings

**WebRTC Implementation:**
- Peer connection setup
- Media stream handling
- ICE candidate exchange
- Offer/answer negotiation
- Track management

**UI Components:**
- Video display (local and remote)
- Chat interface
- Control buttons
- Status overlays
- Filter panel

## Usage Guide

### For End Users

1. **Starting Random Connect**
   - Navigate to "Random Connect" from the main navigation
   - Ensure you're online
   - Grant camera and microphone permissions

2. **Setting Filters** (Optional)
   - Click "Filters" button
   - Set gender, country, state, or city preferences
   - Filters apply bidirectionally

3. **Finding a Match**
   - Click "Start Random Chat"
   - Wait while system finds a match
   - Connection automatically established

4. **During Chat**
   - Toggle video/audio using bottom controls
   - Send text messages via chat panel
   - View partner's profile information

5. **Changing Partners**
   - **Skip**: Use during connection phase to skip current match
   - **Next**: Disconnect and find new partner immediately
   - **Exit**: Leave random chat completely

### For Developers

#### Adding Random Connect to Navigation

```typescript
import { Video } from 'lucide-react';

<Button onClick={() => router.push('/random-connect')}>
  <Video className="h-4 w-4 mr-2" />
  Random Connect
</Button>
```

#### Handling Socket Events

```typescript
socket.on('random_chat_match_found', (data) => {
  console.log('Match found:', data.partner);
  // Handle match found
});

socket.emit('random_chat_join_queue', {
  filters: {
    gender: 'female',
    country: 'USA'
  }
});
```

#### WebRTC Configuration

```typescript
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
```

## Security Considerations

1. **Authentication Required**
   - Only authenticated users can access Random Connect
   - Session validation on server side

2. **Online Status Check**
   - Only online users participate in matching
   - Prevents ghost connections

3. **Session Validation**
   - Server validates user participation in sessions
   - Prevents unauthorized access to others' sessions

4. **Clean Disconnection**
   - Proper cleanup on user disconnect
   - Partner notification on disconnection
   - Session marked as inactive in database

## Performance Optimization

1. **Efficient Matching Algorithm**
   - O(n) complexity for finding matches
   - Filter-based pre-filtering
   - Random selection from eligible candidates

2. **WebRTC Direct Connection**
   - Peer-to-peer communication
   - Minimal server load
   - Low latency video/audio

3. **State Management**
   - In-memory maps for quick lookups
   - Minimal database queries during active sessions
   - Batch updates where possible

## Troubleshooting

### Common Issues

1. **No Matches Found**
   - Check if filters are too restrictive
   - Verify online user count
   - Try removing some filters

2. **Video/Audio Not Working**
   - Check browser permissions
   - Verify camera/microphone access
   - Try refreshing the page

3. **Connection Failed**
   - Check internet connection
   - Verify WebRTC support in browser
   - Check firewall settings

4. **Partner Disconnected Immediately**
   - May be network issue
   - Partner may have skipped
   - System will auto-search for new match

## Future Enhancements

1. **Interest-Based Matching**
   - Add interest tags
   - Match based on common interests

2. **Report System**
   - Report inappropriate behavior
   - Block specific users

3. **Session Recording** (with consent)
   - Save favorite conversations
   - Replay past sessions

4. **Language Filters**
   - Filter by preferred language
   - Auto-translation support

5. **Premium Features**
   - Priority matching
   - Advanced filters
   - Ad-free experience

## Technical Requirements

### Browser Support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Permissions Required
- Camera access
- Microphone access
- Network connection

### Server Requirements
- Node.js 16+
- MongoDB 4.4+
- Socket.IO 4.0+
- WebRTC support

## API Reference

### Socket Events

#### Client → Server

```typescript
// Join matching queue
socket.emit('random_chat_join_queue', {
  filters?: {
    gender?: string;
    country?: string;
    state?: string;
    city?: string;
  }
});

// Leave queue
socket.emit('random_chat_leave_queue');

// Skip current match
socket.emit('random_chat_skip');

// Get next match
socket.emit('random_chat_next');

// Exit random chat
socket.emit('random_chat_exit');

// Send message
socket.emit('random_chat_message', {
  sessionId: string;
  message: string;
  messageType?: 'text' | 'image' | 'audio';
});

// WebRTC signaling
socket.emit('random_chat_offer', {
  sessionId: string;
  offer: RTCSessionDescriptionInit;
});

socket.emit('random_chat_answer', {
  sessionId: string;
  answer: RTCSessionDescriptionInit;
});

socket.emit('random_chat_ice_candidate', {
  sessionId: string;
  candidate: RTCIceCandidateInit;
});
```

#### Server → Client

```typescript
// Status updates
socket.on('random_chat_searching', () => {});
socket.on('random_chat_match_found', (data: {
  sessionId: string;
  partner: {
    id: string;
    username: string;
    profile: object;
  }
}) => {});
socket.on('random_chat_connected', () => {});

// Partner events
socket.on('random_chat_partner_disconnected', () => {});
socket.on('random_chat_partner_skipped', () => {});

// Messages
socket.on('random_chat_message', (data: {
  message: {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: Date;
  }
}) => {});

// Typing
socket.on('random_chat_typing', (data: {
  isTyping: boolean;
}) => {});

// Errors
socket.on('random_chat_error', (data: {
  error: string;
}) => {});

// WebRTC signaling
socket.on('random_chat_offer', (data: {
  sessionId: string;
  offer: RTCSessionDescriptionInit;
}) => {});

socket.on('random_chat_answer', (data: {
  sessionId: string;
  answer: RTCSessionDescriptionInit;
}) => {});

socket.on('random_chat_ice_candidate', (data: {
  sessionId: string;
  candidate: RTCIceCandidateInit;
}) => {});
```

### REST API

```typescript
// Get available users
GET /api/chat/random/available-users?gender=male&country=USA
Response: {
  success: boolean;
  data: User[];
}

// Get active session
GET /api/chat/random/active-session
Response: {
  success: boolean;
  data: Session | null;
}

// End session
POST /api/chat/random/end-session/:sessionId
Response: {
  success: boolean;
  message: string;
}

// Get session messages
GET /api/chat/random/messages/:sessionId
Response: {
  success: boolean;
  data: Message[];
}
```

## Contributing

When contributing to Random Connect:

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Test with multiple users
5. Verify WebRTC compatibility

## License

This feature is part of the Flipy Chat application.

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Author:** Flipy Chat Team


