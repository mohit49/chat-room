'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playMessageSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider = ({ children }: SoundProviderProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load sound preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('chat-sound-enabled');
    if (savedPreference !== null) {
      setSoundEnabled(JSON.parse(savedPreference));
    }
  }, []);

  // Save sound preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chat-sound-enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const playMessageSound = () => {
    if (soundEnabled) {
      // Import dynamically to avoid SSR issues
      import('@/lib/utils/sound').then(({ playPopSound }) => {
        playPopSound();
      }).catch(error => {
        console.error('Error loading sound utility:', error);
      });
    }
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playMessageSound }}>
      {children}
    </SoundContext.Provider>
  );
};
