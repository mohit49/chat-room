'use client';

// Image compression utility with aspect ratio preservation
export class ImageCompressor {
  // Compress image while maintaining aspect ratio
  static async compressImage(
    file: File,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        console.log('📸 Original image dimensions:', { width: img.width, height: img.height });

        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        console.log('📸 New image dimensions:', { width, height });

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              console.log('📸 Image compressed:', {
                originalSize: (file.size / 1024).toFixed(2) + ' KB',
                compressedSize: (compressedFile.size / 1024).toFixed(2) + ' KB',
                originalDimensions: `${img.width}x${img.height}`,
                newDimensions: `${width}x${height}`,
                compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
              });
              
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate new dimensions maintaining aspect ratio
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // If image is smaller than max dimensions, keep original size
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Resize based on which dimension is the limiting factor
    if (width > height) {
      // Landscape: width is limiting factor
      width = Math.min(width, maxWidth);
      height = width / aspectRatio;
      
      // Check if height still exceeds max
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // Portrait: height is limiting factor
      height = Math.min(height, maxHeight);
      width = height * aspectRatio;
      
      // Check if width still exceeds max
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  // Get image dimensions without loading full image
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Check if image needs compression
  static shouldCompress(file: File, maxSizeKB: number = 500): boolean {
    return file.size > maxSizeKB * 1024;
  }
}
