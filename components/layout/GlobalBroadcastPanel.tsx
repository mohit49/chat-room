'use client';

import { useEffect, useState } from 'react';
import { useBroadcast } from '@/lib/contexts/BroadcastContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Play, Pause, Square, Volume2, VolumeX, X } from 'lucide-react';

export default function GlobalBroadcastPanel() {
  const { activeBroadcast, isBroadcasting, isPaused, isListening, isMuted, stopBroadcast, pauseBroadcast, resumeBroadcast, toggleMute, toggleListen } = useBroadcast();
  const { user } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show panel if user is listening OR if user is broadcasting
    const isOwnBroadcastCheck = activeBroadcast?.userId === user?.id;
    const shouldShow = activeBroadcast && (isListening || isOwnBroadcastCheck);
    setIsVisible(!!shouldShow);
    
    if (activeBroadcast) {
      console.log('📡 GlobalBroadcastPanel DEBUG:');
      console.log('  - Active broadcast:', activeBroadcast);
      console.log('  - Room Name:', activeBroadcast.roomName);
      console.log('  - Is Listening:', isListening);
      console.log('  - Is Own Broadcast:', isOwnBroadcastCheck);
      console.log('  - Current User ID:', user?.id);
      console.log('  - Broadcaster ID:', activeBroadcast.userId);
      console.log('  - Should Show Panel:', shouldShow);
      console.log('  - Panel Will Display:', shouldShow ? '✅ YES' : '❌ NO');
    } else {
      console.log('📡 GlobalBroadcastPanel: No active broadcast');
    }
  }, [activeBroadcast, isListening, user?.id]);

  if (!isVisible || !activeBroadcast) return null;

  const isOwnBroadcast = activeBroadcast.userId === user?.id;

  const handlePanelClick = () => {
    // Navigate to the room when panel is clicked
    if (activeBroadcast.roomId) {
      router.push(`/rooms/${activeBroadcast.roomId}/chat`);
    }
  };

  const handleExitBroadcast = () => {
    // Stop listening - this will hide the panel
    if (isListening) {
      toggleListen(); // This will set isListening to false
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out cursor-pointer"
      style={{
        background: isOwnBroadcast 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onClick={handlePanelClick}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Broadcast Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Radio className="h-5 w-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm sm:text-base">
                  {isOwnBroadcast ? (isPaused ? 'Broadcasting (Paused)' : 'Broadcasting') : 'Live Broadcast'}
                </span>
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 text-white border-white/30 text-xs"
                >
                  LIVE
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-white/90 text-xs sm:text-sm font-medium">
                  {isOwnBroadcast 
                    ? `📍 ${activeBroadcast.roomName}` 
                    : `${activeBroadcast.username} in ${activeBroadcast.roomName}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isOwnBroadcast ? (
              // Broadcaster Controls
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPaused ? resumeBroadcast : pauseBroadcast}
                  className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 p-0 sm:p-2 bg-white/10 hover:bg-white/20 text-white border-white/30 transition-all"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Pause</span>
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopBroadcast}
                  className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 p-0 sm:p-2 bg-red-500/20 hover:bg-red-500/30 text-white border-red-300/30 transition-all"
                  title="Stop Broadcasting"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span className="ml-2 hidden sm:inline">Stop</span>
                </Button>
              </>
            ) : (
              // Listener Controls
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleListen}
                  className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 p-0 sm:p-2 bg-white/10 hover:bg-white/20 text-white border-white/30 transition-all"
                  title={isListening ? 'Pause' : 'Play'}
                >
                  {isListening ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Play</span>
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="h-9 w-9 p-0 bg-white/10 hover:bg-white/20 text-white border-white/30 transition-all"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitBroadcast}
                  className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 p-0 sm:p-2 bg-white/10 hover:bg-red-500/30 text-white border-white/30 transition-all"
                  title="Exit Broadcast"
                >
                  <X className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Exit</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Animated wave effect */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          animation: 'wave 2s linear infinite'
        }}
      >
        <style jsx>{`
          @keyframes wave {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    </div>
  );
}

