'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImageMessage {
  id: string;
  imageUrl: string;
  message: string;
  timestamp: string;
  senderUsername: string;
}

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageMessage[];
  currentImageIndex: number;
}

export default function ImageLightbox({ 
  isOpen, 
  onClose, 
  images, 
  currentImageIndex 
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(currentImageIndex);

  // Update current index when prop changes
  useEffect(() => {
    setCurrentIndex(currentImageIndex);
  }, [currentImageIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  const downloadImage = async () => {
    if (!images[currentIndex]) return;
    
    try {
      const imageUrl = images[currentIndex].imageUrl;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${images[currentIndex].timestamp}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  if (!images.length || currentIndex < 0 || currentIndex >= images.length) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Image Viewer</DialogTitle>
        </DialogHeader>
        
        {/* Header with controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
              {currentIndex + 1} of {images.length}
            </Badge>
            <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
              {currentImage.senderUsername} • {formatDate(currentImage.timestamp)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadImage}
              className="text-white hover:bg-white/20 bg-black/50"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 bg-black/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main image display */}
        <div className="relative flex items-center justify-center min-h-[400px] max-h-[80vh] p-8">
          <img
            src={currentImage.imageUrl}
            alt={currentImage.message || 'Shared image'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: 'calc(80vh - 8rem)' }}
          />
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/50 h-12 w-12 rounded-full"
                title="Previous image (←)"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 bg-black/50 h-12 w-12 rounded-full"
                title="Next image (→)"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Image caption */}
        {currentImage.message && currentImage.message !== '📷 Image' && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-black/70 text-white p-3 rounded-lg text-center">
              <p className="text-sm">{currentImage.message}</p>
            </div>
          </div>
        )}

        {/* Thumbnail strip for multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex space-x-2 bg-black/50 p-2 rounded-lg max-w-md overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden ${
                    index === currentIndex 
                      ? 'border-white' 
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img
                    src={image.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

