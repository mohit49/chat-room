"use client";

import React, { useState, useRef } from 'react';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import * as avataaars from '@dicebear/avataaars';
import * as bottts from '@dicebear/bottts';
import * as funEmoji from '@dicebear/fun-emoji';
import * as lorelei from '@dicebear/lorelei';
import * as micah from '@dicebear/micah';
import * as openPeeps from '@dicebear/open-peeps';
import * as personas from '@dicebear/personas';
import * as pixelArt from '@dicebear/pixel-art';
import * as shapes from '@dicebear/shapes';
import { Camera, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropModal from './ImageCropModal';
import AvatarSelector from './AvatarSelector';
import { getOptimizedAvatar } from '@/lib/utils/avatarCompression';

interface AvatarUploaderProps {
  currentImage?: string;
  avatarStyle?: string;
  avatarSeed?: string;
  onImageChange: (imageData: string, type: 'upload' | 'avatar', style?: string, seed?: string) => void;
  username: string;
}

const avatarStylesMap: any = {
  'Adventurer': adventurer,
  'Avataaars': avataaars,
  'Bottts': bottts,
  'Fun Emoji': funEmoji,
  'Lorelei': lorelei,
  'Micah': micah,
  'Open Peeps': openPeeps,
  'Personas': personas,
  'Pixel Art': pixelArt,
  'Shapes': shapes,
};

export default function AvatarUploader({
  currentImage,
  avatarStyle,
  avatarSeed,
  onImageChange,
  username,
}: AvatarUploaderProps) {
  const [showCropModal, setShowCropModal] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    // Get optimized image with fallback if too large
    const optimizedImage = getOptimizedAvatar(croppedImage, 'uploaded', 'user', 50000);
    
    onImageChange(optimizedImage, 'upload');
    setShowCropModal(false);
    setTempImage('');
  };

  const handleAvatarSelect = (style: string, seed: string) => {
    const styleModule = avatarStylesMap[style];
    if (styleModule) {
      const avatar = createAvatar(styleModule, {
        seed: seed,
        size: 500,
      });
      const avatarDataUri = avatar.toDataUri();
      
      // Get optimized avatar with fallback if too large
      const optimizedAvatarDataUri = getOptimizedAvatar(avatarDataUri, style, seed, 30000);
      
      onImageChange(optimizedAvatarDataUri, 'avatar', style, seed);
    }
    setShowAvatarSelector(false);
  };

  const getCurrentAvatar = () => {
    if (currentImage) {
      return currentImage;
    }
    if (avatarStyle && avatarSeed) {
      const styleModule = avatarStylesMap[avatarStyle];
      if (styleModule) {
        const avatar = createAvatar(styleModule, {
          seed: avatarSeed,
          size: 500,
        });
        return avatar.toDataUri();
      }
    }
    // Default avatar
    const defaultAvatar = createAvatar(adventurer, {
      seed: username || 'default',
      size: 500,
    });
    return defaultAvatar.toDataUri();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
          <img
            src={getCurrentAvatar()}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="text-white h-8 w-8" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Upload Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowAvatarSelector(true);
          }}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Choose Avatar
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {showCropModal && (
        <ImageCropModal
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropModal(false);
            setTempImage('');
          }}
        />
      )}

      {showAvatarSelector && (
        <AvatarSelector
          onSelect={handleAvatarSelect}
          onCancel={() => setShowAvatarSelector(false)}
          username={username}
        />
      )}
    </div>
  );
}


