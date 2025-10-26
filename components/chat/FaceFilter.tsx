'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type FilterType = 
  | 'none' 
  | 'blur-face' 
  | 'sunglasses-1' 
  | 'sunglasses-2' 
  | 'sunglasses-3'
  | 'hat-1' 
  | 'hat-2' 
  | 'hat-3'
  | 'mask-1';

interface FaceFilterProps {
  sourceVideoRef: React.RefObject<HTMLVideoElement | null>;
  outputCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  filterType: FilterType;
  enabled: boolean;
}

interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  forehead: { x: number; y: number };
  chin: { x: number; y: number };
  leftCheek: { x: number; y: number };
  rightCheek: { x: number; y: number };
}

interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function FaceFilter({ sourceVideoRef, outputCanvasRef, filterType, enabled }: FaceFilterProps) {
  const animationFrameRef = useRef<number | null>(null);
  const filterAssetsRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const faceDetectorRef = useRef<any>(null);
  const lastDetectedFaceRef = useRef<DetectedFace | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load filter assets (sunglasses, hats, etc.)
  const loadFilterAssets = useCallback(() => {
    const assets = new Map<string, HTMLImageElement>();

    // Create sunglasses SVG
    const createSunglasses = (style: string) => {
      let svgContent = '';
      
      if (style === '1') {
        // Classic aviator sunglasses
        svgContent = `
          <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame -->
            <ellipse cx="70" cy="50" rx="60" ry="35" fill="#1a1a1a" stroke="#FFD700" stroke-width="3"/>
            <ellipse cx="230" cy="50" rx="60" ry="35" fill="#1a1a1a" stroke="#FFD700" stroke-width="3"/>
            <!-- Bridge -->
            <rect x="130" y="45" width="40" height="10" fill="#FFD700" rx="5"/>
            <!-- Left lens reflection -->
            <ellipse cx="55" cy="40" rx="15" ry="10" fill="rgba(255,255,255,0.3)"/>
            <!-- Right lens reflection -->
            <ellipse cx="215" cy="40" rx="15" ry="10" fill="rgba(255,255,255,0.3)"/>
          </svg>
        `;
      } else if (style === '2') {
        // Round retro sunglasses
        svgContent = `
          <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
            <!-- Frame -->
            <circle cx="70" cy="50" r="45" fill="#0a0a0a" stroke="#FF1493" stroke-width="3"/>
            <circle cx="230" cy="50" r="45" fill="#0a0a0a" stroke="#FF1493" stroke-width="3"/>
            <!-- Bridge -->
            <rect x="115" y="45" width="70" height="10" fill="#FF1493" rx="5"/>
            <!-- Left lens reflection -->
            <circle cx="60" cy="40" r="12" fill="rgba(255,255,255,0.3)"/>
            <!-- Right lens reflection -->
            <circle cx="220" cy="40" r="12" fill="rgba(255,255,255,0.3)"/>
          </svg>
        `;
      } else {
        // Cool wraparound sunglasses
        svgContent = `
          <svg width="320" height="100" xmlns="http://www.w3.org/2000/svg">
            <!-- Main wraparound shape -->
            <path d="M 20 50 Q 30 30, 140 40 Q 160 38, 180 40 Q 290 30, 300 50 Q 290 70, 180 60 Q 160 62, 140 60 Q 30 70, 20 50" 
                  fill="#000000" stroke="#00FFFF" stroke-width="3"/>
            <!-- Left reflection -->
            <ellipse cx="80" cy="45" rx="20" ry="8" fill="rgba(255,255,255,0.2)"/>
            <!-- Right reflection -->
            <ellipse cx="240" cy="45" rx="20" ry="8" fill="rgba(255,255,255,0.2)"/>
          </svg>
        `;
      }

      const img = new Image();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
      return img;
    };

    // Create hat SVG
    const createHat = (style: string) => {
      let svgContent = '';
      
      if (style === '1') {
        // Top hat
        svgContent = `
          <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <!-- Hat brim -->
            <ellipse cx="150" cy="150" rx="140" ry="20" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
            <!-- Hat body -->
            <rect x="80" y="50" width="140" height="100" fill="#1a1a1a" stroke="#333" stroke-width="2" rx="5"/>
            <!-- Hat top -->
            <ellipse cx="150" cy="50" rx="70" ry="10" fill="#2a2a2a"/>
            <!-- Highlight -->
            <rect x="85" y="70" width="10" height="60" fill="rgba(255,255,255,0.1)"/>
          </svg>
        `;
      } else if (style === '2') {
        // Baseball cap
        svgContent = `
          <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
            <!-- Cap bill -->
            <ellipse cx="150" cy="120" rx="100" ry="15" fill="#FF0000"/>
            <!-- Cap dome -->
            <ellipse cx="150" cy="80" rx="90" ry="50" fill="#FF0000"/>
            <!-- Cap front panel -->
            <path d="M 80 90 Q 150 50, 220 90" fill="#CC0000"/>
            <!-- Button -->
            <circle cx="150" cy="65" r="8" fill="#FFFF00"/>
          </svg>
        `;
      } else {
        // Wizard hat
        svgContent = `
          <svg width="300" height="250" xmlns="http://www.w3.org/2000/svg">
            <!-- Hat brim -->
            <ellipse cx="150" cy="180" rx="120" ry="20" fill="#4B0082"/>
            <!-- Hat cone -->
            <path d="M 50 180 Q 150 20, 250 180" fill="#8B00FF" stroke="#FFD700" stroke-width="2"/>
            <!-- Stars -->
            <text x="120" y="100" font-size="30" fill="#FFD700">⭐</text>
            <text x="160" y="130" font-size="25" fill="#FFD700">⭐</text>
            <text x="140" y="160" font-size="20" fill="#FFD700">⭐</text>
          </svg>
        `;
      }

      const img = new Image();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
      return img;
    };

    // Create mask SVG
    const createMask = () => {
      const svgContent = `
        <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
          <!-- Mask base -->
          <ellipse cx="150" cy="75" rx="130" ry="60" fill="#87CEEB" stroke="#4682B4" stroke-width="3"/>
          <!-- Eye holes -->
          <ellipse cx="100" cy="65" rx="35" ry="25" fill="transparent" stroke="#4682B4" stroke-width="2"/>
          <ellipse cx="200" cy="65" rx="35" ry="25" fill="transparent" stroke="#4682B4" stroke-width="2"/>
          <!-- Mask ties -->
          <line x1="20" y1="75" x2="40" y2="75" stroke="#4682B4" stroke-width="3"/>
          <line x1="260" y1="75" x2="280" y2="75" stroke="#4682B4" stroke-width="3"/>
        </svg>
      `;

      const img = new Image();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      img.src = URL.createObjectURL(blob);
      return img;
    };

    // Load all assets
    assets.set('sunglasses-1', createSunglasses('1'));
    assets.set('sunglasses-2', createSunglasses('2'));
    assets.set('sunglasses-3', createSunglasses('3'));
    assets.set('hat-1', createHat('1'));
    assets.set('hat-2', createHat('2'));
    assets.set('hat-3', createHat('3'));
    assets.set('mask-1', createMask());

    filterAssetsRef.current = assets;
    
    // Mark assets as loaded after a short delay to ensure all images are ready
    setTimeout(() => {
      console.log('✅ Filter assets loaded');
      setAssetsLoaded(true);
    }, 100);
  }, []);

  // Initialize face detector (using browser's FaceDetector API if available)
  const initializeFaceDetector = useCallback(async () => {
    try {
      // @ts-ignore - FaceDetector is experimental
      if ('FaceDetector' in window) {
        // @ts-ignore
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        faceDetectorRef.current = detector;
        console.log('✅ Browser FaceDetector API initialized');
        return true;
      } else {
        console.log('⚠️ FaceDetector API not available, using fallback positioning');
        return false;
      }
    } catch (error) {
      console.log('⚠️ Could not initialize FaceDetector:', error);
      return false;
    }
  }, []);

  // Detect face using browser's FaceDetector API
  const detectFaceWithAPI = useCallback(async (video: HTMLVideoElement): Promise<DetectedFace | null> => {
    if (!faceDetectorRef.current) return null;
    
    try {
      const faces = await faceDetectorRef.current.detect(video);
      if (faces && faces.length > 0) {
        const face = faces[0].boundingBox;
        return {
          x: face.x,
          y: face.y,
          width: face.width,
          height: face.height
        };
      }
    } catch (error) {
      // Silently fail and use fallback
    }
    return null;
  }, []);

  // Convert detected face bounding box to landmarks
  const faceToLandmarks = useCallback((face: DetectedFace): FaceLandmarks => {
    const faceCenterX = face.x + face.width / 2;
    const faceCenterY = face.y + face.height / 2;
    
    return {
      leftEye: { 
        x: face.x + face.width * 0.30, 
        y: face.y + face.height * 0.35 
      },
      rightEye: { 
        x: face.x + face.width * 0.70, 
        y: face.y + face.height * 0.35 
      },
      nose: { 
        x: faceCenterX, 
        y: faceCenterY + face.height * 0.05 
      },
      forehead: { 
        x: faceCenterX, 
        y: face.y + face.height * 0.15 
      },
      chin: { 
        x: faceCenterX, 
        y: face.y + face.height * 0.95 
      },
      leftCheek: { 
        x: face.x + face.width * 0.20, 
        y: faceCenterY + face.height * 0.10 
      },
      rightCheek: { 
        x: face.x + face.width * 0.80, 
        y: faceCenterY + face.height * 0.10 
      },
    };
  }, []);

  // Fallback: Simple heuristic face detection (assumes face is centered)
  const detectFaceLandmarks = useCallback((videoWidth: number, videoHeight: number): FaceLandmarks => {
    // Face is typically in the center-top area of the frame
    const faceWidth = videoWidth * 0.45;
    const faceHeight = videoHeight * 0.6;
    const faceCenterX = videoWidth / 2;
    const faceCenterY = videoHeight * 0.42;
    
    return {
      leftEye: { 
        x: faceCenterX - faceWidth * 0.20, 
        y: faceCenterY - faceHeight * 0.15 
      },
      rightEye: { 
        x: faceCenterX + faceWidth * 0.20, 
        y: faceCenterY - faceHeight * 0.15 
      },
      nose: { 
        x: faceCenterX, 
        y: faceCenterY + faceHeight * 0.05 
      },
      forehead: { 
        x: faceCenterX, 
        y: faceCenterY - faceHeight * 0.35 
      },
      chin: { 
        x: faceCenterX, 
        y: faceCenterY + faceHeight * 0.45 
      },
      leftCheek: { 
        x: faceCenterX - faceWidth * 0.35, 
        y: faceCenterY + faceHeight * 0.10 
      },
      rightCheek: { 
        x: faceCenterX + faceWidth * 0.35, 
        y: faceCenterY + faceHeight * 0.10 
      },
    };
  }, []);

  // Apply blur to face region
  const applyFaceBlur = useCallback((ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks) => {
    // Calculate face bounding box from landmarks
    const faceWidth = Math.abs(landmarks.rightCheek.x - landmarks.leftCheek.x) * 1.3;
    const faceHeight = Math.abs(landmarks.chin.y - landmarks.forehead.y) * 1.2;
    const faceCenterX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
    const faceCenterY = (landmarks.forehead.y + landmarks.chin.y) / 2;

    // Save the current state
    ctx.save();

    // Create an elliptical mask for the face
    ctx.beginPath();
    ctx.ellipse(
      faceCenterX,
      faceCenterY,
      faceWidth / 2,
      faceHeight / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();

    // Apply blur effect
    ctx.filter = 'blur(25px)';
    ctx.drawImage(
      ctx.canvas,
      faceCenterX - faceWidth / 2 - 30,
      faceCenterY - faceHeight / 2 - 30,
      faceWidth + 60,
      faceHeight + 60,
      faceCenterX - faceWidth / 2 - 30,
      faceCenterY - faceHeight / 2 - 30,
      faceWidth + 60,
      faceHeight + 60
    );

    // Restore the state
    ctx.restore();
  }, []);

  // Draw filter on canvas
  const drawFilter = useCallback(async () => {
    if (!sourceVideoRef.current || !outputCanvasRef.current || !enabled || filterType === 'none') {
      return;
    }

    const video = sourceVideoRef.current;
    const canvas = outputCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx || video.readyState < 2 || !assetsLoaded) {
      animationFrameRef.current = requestAnimationFrame(drawFilter);
      return;
    }

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Draw the original video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get landmarks - try real face detection first, fallback to heuristic
    let landmarks: FaceLandmarks;
    
    if (lastDetectedFaceRef.current) {
      // Use last detected face position
      landmarks = faceToLandmarks(lastDetectedFaceRef.current);
    } else {
      // Use fallback heuristic
      landmarks = detectFaceLandmarks(canvas.width, canvas.height);
    }

    // Apply filter based on type
    if (filterType === 'blur-face') {
      applyFaceBlur(ctx, landmarks);
    } else if (filterType.startsWith('sunglasses-')) {
      const sunglasses = filterAssetsRef.current.get(filterType);
      if (sunglasses && sunglasses.complete) {
        // Calculate sunglasses position and size based on eyes
        const eyeDistance = Math.abs(landmarks.rightEye.x - landmarks.leftEye.x);
        const glassesWidth = eyeDistance * 2.5;
        const glassesHeight = glassesWidth * 0.33;
        const glassesX = landmarks.leftEye.x - glassesWidth * 0.15;
        const glassesY = landmarks.leftEye.y - glassesHeight * 0.5;
        
        ctx.drawImage(sunglasses, glassesX, glassesY, glassesWidth, glassesHeight);
      }
    } else if (filterType.startsWith('hat-')) {
      const hat = filterAssetsRef.current.get(filterType);
      if (hat && hat.complete) {
        // Calculate hat position based on forehead
        const faceWidth = Math.abs(landmarks.rightCheek.x - landmarks.leftCheek.x);
        const hatWidth = faceWidth * 1.5;
        const hatHeight = hatWidth * 0.8;
        const hatX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2 - hatWidth / 2;
        const hatY = landmarks.forehead.y - hatHeight * 0.85;
        
        ctx.drawImage(hat, hatX, hatY, hatWidth, hatHeight);
      }
    } else if (filterType === 'mask-1') {
      const mask = filterAssetsRef.current.get(filterType);
      if (mask && mask.complete) {
        // Calculate mask position
        const faceWidth = Math.abs(landmarks.rightCheek.x - landmarks.leftCheek.x);
        const maskWidth = faceWidth * 1.2;
        const maskHeight = maskWidth * 0.5;
        const maskX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2 - maskWidth / 2;
        const maskY = landmarks.leftEye.y - maskHeight * 0.2;
        
        ctx.drawImage(mask, maskX, maskY, maskWidth, maskHeight);
      }
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(drawFilter);
  }, [sourceVideoRef, outputCanvasRef, filterType, enabled, assetsLoaded, detectFaceLandmarks, faceToLandmarks, applyFaceBlur]);

  // Initialize
  useEffect(() => {
    loadFilterAssets();
    initializeFaceDetector();
  }, [loadFilterAssets, initializeFaceDetector]);

  // Periodic face detection (every 100ms for smooth tracking)
  useEffect(() => {
    if (enabled && filterType !== 'none' && sourceVideoRef.current && faceDetectorRef.current) {
      const detectPeriodically = async () => {
        if (sourceVideoRef.current) {
          const detectedFace = await detectFaceWithAPI(sourceVideoRef.current);
          if (detectedFace) {
            lastDetectedFaceRef.current = detectedFace;
          }
        }
      };

      // Run detection every 100ms
      detectionIntervalRef.current = setInterval(detectPeriodically, 100);
      
      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
      };
    }
  }, [enabled, filterType, detectFaceWithAPI, sourceVideoRef]);

  // Start/stop filter processing
  useEffect(() => {
    if (enabled && filterType !== 'none' && assetsLoaded) {
      console.log('🎬 Starting filter processing:', filterType);
      drawFilter();
    } else {
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clear last detected face
      lastDetectedFaceRef.current = null;

      // Clear canvas if disabled
      if (outputCanvasRef.current && !enabled) {
        const ctx = outputCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, filterType, assetsLoaded, drawFilter, outputCanvasRef]);

  return null; // This component doesn't render anything
}

