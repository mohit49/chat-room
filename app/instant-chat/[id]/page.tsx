'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, Clock, Users } from 'lucide-react';
import { getInstantChat, joinInstantChat } from '@/lib/api/instantChat';
import InstantChatWidget from '@/components/chat/InstantChatWidget';

export default function InstantChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [chatExists, setChatExists] = useState(false);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [participantId, setParticipantId] = useState('');

  useEffect(() => {
    checkChatExists();
    
    // Check if user has previously joined this chat
    const storedParticipant = localStorage.getItem(`instant_chat_${chatId}_participant`);
    if (storedParticipant) {
      try {
        const data = JSON.parse(storedParticipant);
        console.log('📦 Found stored participant data:', data);
        
        // Auto-fill name and participant ID
        setUserName(data.participantName);
        setParticipantId(data.participantId);
        
        // Optionally auto-join (commented out - let user decide)
        // setJoined(true);
      } catch (error) {
        console.error('Error parsing stored participant data:', error);
      }
    }
  }, [chatId]);

  const checkChatExists = async () => {
    try {
      const response = await getInstantChat(chatId);
      
      if (response.success) {
        setChatExists(true);
        setChatDetails(response.chat);
      } else {
        setChatExists(false);
      }
    } catch (error) {
      console.error('Error checking chat:', error);
      setChatExists(false);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    setJoining(true);
    try {
      const response = await joinInstantChat(chatId, userName.trim());
      
      if (response.success) {
        setParticipantId(response.participantId);
        setJoined(true);
        
        // Store participant info in localStorage for this chat
        localStorage.setItem(`instant_chat_${chatId}_participant`, JSON.stringify({
          participantId: response.participantId,
          participantName: userName.trim(),
          joinedAt: new Date().toISOString()
        }));
        
        console.log(`✅ Joined chat as: ${userName.trim()} (${response.participantId})`);
      } else {
        alert('Failed to join chat: ' + response.error);
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      alert('Failed to join chat');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chatExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-900">Chat Not Found</CardTitle>
            <CardDescription>
              This instant chat doesn't exist or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                The chat link you're trying to access is either invalid or has expired. 
                Instant chats automatically expire after 24 hours.
              </p>
            </div>
            <Button
              onClick={() => router.push('/home')}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Join Instant Chat
            </CardTitle>
            <CardDescription>
              {chatDetails?.creatorName && `Started by ${chatDetails.creatorName}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Participants</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {chatDetails?.participants?.length || 0}
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Expires In</span>
                </div>
                <p className="text-lg font-bold text-green-900">24h</p>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="userName">Enter your name to join</Label>
              <Input
                id="userName"
                placeholder="Your name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                maxLength={50}
                disabled={joining}
              />
              <p className="text-xs text-muted-foreground">
                This name will be visible to {chatDetails?.creatorName || 'the chat creator'} and other participants
              </p>
            </div>

            {/* Privacy Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>No account needed:</strong> Just enter your name to join. Your name and messages 
                {chatDetails?.storeHistory ? ' will be stored for 24 hours' : ' are temporary and not stored'}.
              </p>
            </div>

            {/* Join Button */}
            <Button
              onClick={handleJoin}
              disabled={!userName.trim() || joining}
              className="w-full"
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Chat'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chat Interface
  return (
    <InstantChatWidget
      chatId={chatId}
      participantId={participantId}
      participantName={userName}
      storeHistory={chatDetails?.storeHistory || false}
      creatorId={chatDetails?.creatorId}
    />
  );
}

