'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Zap, Shield, Clock } from 'lucide-react';
import InstantChatDialog from './InstantChatDialog';

export default function InstantChatSection() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Card className="overflow-hidden relative">
        {/* Pink gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-red-500">
        </div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-white">
            <MessageSquarePlus className="h-5 w-5" />
            Instant Chat
          </CardTitle>
          <CardDescription className="text-white/90">
            Start a secure chat instantly - no account needed for participants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30">
              <Zap className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white">Instant Access</h4>
                <p className="text-xs text-white/90">Share a link, start chatting immediately</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30">
              <Shield className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white">Secure</h4>
                <p className="text-xs text-white/90">End-to-end encrypted conversations</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/30">
              <Clock className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white">Auto-Expire</h4>
                <p className="text-xs text-white/90">Chats expire after 24 hours</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/25 backdrop-blur-sm rounded-lg p-4 space-y-2 border border-white/30">
            <h3 className="font-semibold text-white">How it works:</h3>
            <ol className="text-sm text-white/95 space-y-1 list-decimal list-inside">
              <li>Click "Start Instant Chat" to create a unique chat room</li>
              <li>Share the generated link with anyone you want to chat with</li>
              <li>They enter their name and join instantly - no signup required!</li>
              <li>Chat with text, images, and voice messages</li>
            </ol>
          </div>

          {/* Call to Action Button */}
          <Button
            onClick={() => setShowDialog(true)}
            size="lg"
            className="w-full bg-white text-pink-600 hover:bg-pink-50 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            Start Instant Chat
          </Button>
        </CardContent>
      </Card>

      {/* Instant Chat Dialog */}
      <InstantChatDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}

