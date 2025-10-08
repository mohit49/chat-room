'use client';

import { useState, useEffect } from 'react';
import DirectMessageWidget from '@/components/chat/DirectMessageWidget';

// Global chat state management
let globalChatState = {
  isOpen: false,
  selectedUser: null as any
};

// Global listeners for chat state changes
const chatListeners = new Set<(state: typeof globalChatState) => void>();

export const openChat = (user: { id: string; username: string; profilePicture?: any }) => {
  console.log('🌐 Global openChat called:', user);
  globalChatState = {
    isOpen: true,
    selectedUser: user
  };
  
  // Notify all listeners
  chatListeners.forEach(listener => listener(globalChatState));
};

export const closeChat = () => {
  console.log('🌐 Global closeChat called');
  globalChatState = {
    isOpen: false,
    selectedUser: null
  };
  
  // Notify all listeners
  chatListeners.forEach(listener => listener(globalChatState));
};

export const isChatOpenForUser = (userId: string) => {
  return globalChatState.isOpen && globalChatState.selectedUser?.id === userId;
};

export const isAnyChatOpen = () => {
  return globalChatState.isOpen;
};

const GlobalChatManager = () => {
  const [chatState, setChatState] = useState(globalChatState);

  useEffect(() => {
    console.log('🌐 GlobalChatManager mounted');
    
    // Add listener for global chat state changes
    const listener = (state: typeof globalChatState) => {
      console.log('🌐 GlobalChatManager received state update:', state);
      setChatState(state);
    };
    
    chatListeners.add(listener);
    
    return () => {
      console.log('🌐 GlobalChatManager unmounted');
      chatListeners.delete(listener);
    };
  }, []);

  console.log('🌐 GlobalChatManager rendering with state:', chatState);

  if (!chatState.selectedUser) return null;

  return (
    <DirectMessageWidget
      isOpen={chatState.isOpen}
      onClose={closeChat}
      targetUser={chatState.selectedUser}
    />
  );
};

export default GlobalChatManager;
