'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { createInstantChat } from '@/lib/api/instantChat';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface InstantChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstantChatDialog({ isOpen, onClose }: InstantChatDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [storeHistory, setStoreHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatLink, setChatLink] = useState('');
  const [chatId, setChatId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateChat = async () => {
    setLoading(true);
    try {
      const response = await createInstantChat(storeHistory);
      
      if (response.success) {
        const link = `${window.location.origin}/instant-chat/${response.chat.chatId}`;
        setChatLink(link);
        setChatId(response.chat.chatId);
      } else {
        alert('Failed to create instant chat: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating instant chat:', error);
      alert('Failed to create instant chat');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(chatLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleJoinChat = () => {
    router.push(`/instant-chat/${chatId}`);
    onClose();
  };

  const handleClose = () => {
    setChatLink('');
    setChatId('');
    setStoreHistory(false);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Instant Chat</DialogTitle>
          <DialogDescription>
            Create a secure chat room and share the link with anyone
          </DialogDescription>
        </DialogHeader>

        {!chatLink ? (
          // Step 1: Create Chat
          <div className="space-y-4 py-4">
            {/* Creator Info */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-3">
              <p className="text-sm text-pink-900">
                <strong>Creating as:</strong> {user?.username || 'User'}
              </p>
              <p className="text-xs text-pink-700 mt-1">
                Your name will be visible to participants
              </p>
            </div>

            <div className="flex items-center justify-between bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="space-y-0.5 flex-1 pr-4">
                <Label
                  htmlFor="storeHistory"
                  className="text-base font-medium cursor-pointer text-pink-900"
                >
                  Store chat history
                </Label>
                <p className="text-sm text-pink-700">
                  Store chats for later
                </p>
              </div>
              <Switch
                id="storeHistory"
                checked={storeHistory}
                onCheckedChange={setStoreHistory}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Chat rooms automatically expire after 24 hours for security.
              </p>
            </div>

            <Button
              onClick={handleCreateChat}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Chat...
                </>
              ) : (
                'Create Instant Chat'
              )}
            </Button>
          </div>
        ) : (
          // Step 2: Share Link
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={chatLink}
                  className="flex-1 font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600">✓ Link copied to clipboard!</p>
              )}
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-semibold text-pink-900">Share this link with:</h4>
              <ul className="text-xs text-pink-800 space-y-1 list-disc list-inside">
                <li>Anyone you want to chat with</li>
                <li>Multiple people at once</li>
                <li>They don't need an account to join</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                ✓ Chat room created successfully! Share the link above to invite others.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handleJoinChat}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Join Chat
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

