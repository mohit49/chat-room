'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, MessageSquare } from 'lucide-react';
import MessageSidePanel from './MessageSidePanel';

export default function MessageIcon() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleTogglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleTogglePanel}
        className="relative"
        aria-label="Open messages"
      >
        <MessageCircle className="h-5 w-5" />
        {/* You can add a notification badge here if needed */}
      </Button>

      <MessageSidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}

