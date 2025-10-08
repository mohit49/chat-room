"use client";

import React, { useState } from 'react';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import * as adventurerNeutral from '@dicebear/adventurer-neutral';
import * as avataaars from '@dicebear/avataaars';
import * as avataaarsNeutral from '@dicebear/avataaars-neutral';
import * as bigEars from '@dicebear/big-ears';
import * as bigEarsNeutral from '@dicebear/big-ears-neutral';
import * as bigSmile from '@dicebear/big-smile';
import * as bottts from '@dicebear/bottts';
import * as botttsNeutral from '@dicebear/bottts-neutral';
import * as croodles from '@dicebear/croodles';
import * as croodlesNeutral from '@dicebear/croodles-neutral';
import * as funEmoji from '@dicebear/fun-emoji';
import * as icons from '@dicebear/icons';
import * as identicon from '@dicebear/identicon';
import * as initials from '@dicebear/initials';
import * as lorelei from '@dicebear/lorelei';
import * as loreleiNeutral from '@dicebear/lorelei-neutral';
import * as micah from '@dicebear/micah';
import * as miniavs from '@dicebear/miniavs';
import * as notionists from '@dicebear/notionists';
import * as notionistsNeutral from '@dicebear/notionists-neutral';
import * as openPeeps from '@dicebear/open-peeps';
import * as personas from '@dicebear/personas';
import * as pixelArt from '@dicebear/pixel-art';
import * as pixelArtNeutral from '@dicebear/pixel-art-neutral';
import * as rings from '@dicebear/rings';
import * as shapes from '@dicebear/shapes';
import * as thumbs from '@dicebear/thumbs';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getOptimizedAvatar } from '@/lib/utils/avatarCompression';

interface AvatarSelectorProps {
  onSelect: (avatarStyle: string, seed: string) => void;
  onCancel: () => void;
  username: string;
}

const avatarStyles = [
  { name: 'Adventurer', style: adventurer, description: 'Cartoon characters' },
  { name: 'Adventurer Neutral', style: adventurerNeutral, description: 'Neutral cartoon' },
  { name: 'Avataaars', style: avataaars, description: 'Customizable avatars' },
  { name: 'Avataaars Neutral', style: avataaarsNeutral, description: 'Neutral avatars' },
  { name: 'Big Ears', style: bigEars, description: 'Characters with big ears' },
  { name: 'Big Ears Neutral', style: bigEarsNeutral, description: 'Neutral big ears' },
  { name: 'Big Smile', style: bigSmile, description: 'Happy faces' },
  { name: 'Bottts', style: bottts, description: 'Cute robots' },
  { name: 'Bottts Neutral', style: botttsNeutral, description: 'Neutral robots' },
  { name: 'Croodles', style: croodles, description: 'Doodle style' },
  { name: 'Croodles Neutral', style: croodlesNeutral, description: 'Neutral doodles' },
  { name: 'Fun Emoji', style: funEmoji, description: 'Emoji faces' },
  { name: 'Icons', style: icons, description: 'Simple icons' },
  { name: 'Identicon', style: identicon, description: 'Geometric patterns' },
  { name: 'Initials', style: initials, description: 'Letter initials' },
  { name: 'Lorelei', style: lorelei, description: 'Illustrated faces' },
  { name: 'Lorelei Neutral', style: loreleiNeutral, description: 'Neutral faces' },
  { name: 'Micah', style: micah, description: 'Minimalist' },
  { name: 'Miniavs', style: miniavs, description: 'Mini avatars' },
  { name: 'Notionists', style: notionists, description: 'Notion style' },
  { name: 'Notionists Neutral', style: notionistsNeutral, description: 'Neutral notion' },
  { name: 'Open Peeps', style: openPeeps, description: 'Hand-drawn' },
  { name: 'Personas', style: personas, description: 'Abstract art' },
  { name: 'Pixel Art', style: pixelArt, description: '8-bit style' },
  { name: 'Pixel Art Neutral', style: pixelArtNeutral, description: 'Neutral 8-bit' },
  { name: 'Rings', style: rings, description: 'Colorful rings' },
  { name: 'Shapes', style: shapes, description: 'Geometric' },
  { name: 'Thumbs', style: thumbs, description: 'Thumbs up' },
];

export default function AvatarSelector({ onSelect, onCancel, username }: AvatarSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedSeed, setSelectedSeed] = useState<string>(username || 'default');
  const [showVariations, setShowVariations] = useState<string | null>(null);

  const generateAvatar = (styleName: string, styleModule: any, seed?: string) => {
    try {
      const avatar = createAvatar(styleModule, {
        seed: seed || username || 'default',
        size: 150,
      });
      const dataUri = avatar.toDataUri();
      
      // Get optimized avatar with fallback if too large
      const optimizedDataUri = getOptimizedAvatar(dataUri, styleName, seed || username || 'default', 30000);
      
      console.log('Generated avatar:', { 
        styleName, 
        seed, 
        originalSize: dataUri.length,
        optimizedSize: optimizedDataUri.length,
        compressionRatio: dataUri.length > 0 ? ((dataUri.length - optimizedDataUri.length) / dataUri.length * 100).toFixed(1) + '%' : '0%'
      });
      
      return optimizedDataUri;
    } catch (error) {
      console.error('Error generating avatar:', { styleName, seed, error });
      return '';
    }
  };

  // Generate multiple seed variations for more variety
  const generateSeeds = (baseSeed: string, count: number = 4) => {
    const seeds = [baseSeed];
    const themes = ['happy', 'cool', 'funny', 'cute', 'smart', 'brave', 'kind', 'wild'];
    for (let i = 0; i < count; i++) {
      seeds.push(`${baseSeed}-${themes[i % themes.length]}-${i}`);
    }
    return seeds;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="text-xl font-semibold text-foreground">Choose Avatar Style</h2>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {!showVariations ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Click on any style to see variations (28 styles × 5 variations = 140+ unique avatars!)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3">
                {avatarStyles.map((avatar) => (
                  <div
                    key={avatar.name}
                    className="cursor-pointer border-2 rounded-lg p-3 transition-colors hover:shadow-md border-border bg-card"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowVariations(avatar.name);
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={generateAvatar(avatar.name, avatar.style)}
                        alt={avatar.name}
                        className="w-20 h-20 rounded-full"
                      />
                      <div className="text-center">
                        <p className="font-medium text-xs text-foreground">{avatar.name}</p>
                        <p className="text-xs text-muted-foreground">{avatar.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCancel();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVariations(null);
                  }}
                >
                  ← Back to Styles
                </Button>
              </div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                {showVariations} - Choose Your Variation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3">
                {generateSeeds(username || 'default', 5).map((seed, index) => {
                  const currentStyle = avatarStyles.find(s => s.name === showVariations);
                  if (!currentStyle) return null;
                  
                  return (
                    <div
                      key={seed}
                      className={`cursor-pointer border-2 rounded-lg p-3 transition-colors hover:shadow-md ${
                        selectedSeed === seed ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Avatar selected:', {
                          style: showVariations,
                          seed: seed,
                          styleName: showVariations
                        });
                        setSelectedSeed(seed);
                        setSelectedStyle(showVariations);
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={generateAvatar(showVariations, currentStyle.style, seed)}
                          alt={`${showVariations} ${index + 1}`}
                          className="w-20 h-20 rounded-full"
                        />
                        <p className="text-xs text-center font-medium text-foreground">Variation {index + 1}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVariations(null);
                  }} 
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Avatar confirmed:', {
                      selectedStyle,
                      selectedSeed,
                      data: { selectedStyle, selectedSeed }
                    });
                    onSelect(selectedStyle, selectedSeed);
                  }}
                  className="flex-1"
                  disabled={!selectedStyle || !selectedSeed}
                >
                  Select This Avatar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


