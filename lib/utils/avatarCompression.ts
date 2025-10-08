// Avatar compression and optimization utilities

/**
 * Compress SVG data by removing unnecessary whitespace and optimizing the string
 */
export function compressSvgData(svgDataUri: string): string {
  try {
    // Extract the SVG content from the data URI
    const base64Match = svgDataUri.match(/^data:image\/svg\+xml;utf8,(.+)$/);
    if (!base64Match) {
      console.warn('Invalid SVG data URI format');
      return svgDataUri;
    }

    const svgContent = decodeURIComponent(base64Match[1]);
    
    // Compress SVG by removing unnecessary whitespace and comments
    const compressedSvg = svgContent
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/\s+>/g, '>') // Remove spaces before closing tags
      .replace(/<\s+/g, '<') // Remove spaces after opening tags
      .replace(/\s+"/g, '"') // Remove spaces before attributes
      .replace(/"\s+/g, '"') // Remove spaces after attributes
      .replace(/\s*=\s*/g, '=') // Remove spaces around equals signs
      .trim();

    // Re-encode as data URI
    const compressedDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(compressedSvg)}`;
    
    console.log('SVG compression:', {
      originalLength: svgDataUri.length,
      compressedLength: compressedDataUri.length,
      compressionRatio: ((svgDataUri.length - compressedDataUri.length) / svgDataUri.length * 100).toFixed(1) + '%'
    });

    return compressedDataUri;
  } catch (error) {
    console.error('Error compressing SVG:', error);
    return svgDataUri; // Return original if compression fails
  }
}

/**
 * Convert SVG data URI to base64 for better compression
 */
export function convertSvgToBase64(svgDataUri: string): string {
  try {
    // Extract the SVG content from the data URI
    const utf8Match = svgDataUri.match(/^data:image\/svg\+xml;utf8,(.+)$/);
    if (!utf8Match) {
      console.warn('Invalid SVG data URI format for base64 conversion');
      return svgDataUri;
    }

    const svgContent = decodeURIComponent(utf8Match[1]);
    
    // Compress SVG first
    const compressedSvg = svgContent
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      .replace(/\s*=\s*/g, '=')
      .trim();

    // Convert to base64
    const base64Svg = btoa(compressedSvg);
    const base64DataUri = `data:image/svg+xml;base64,${base64Svg}`;
    
    console.log('SVG base64 conversion:', {
      originalLength: svgDataUri.length,
      base64Length: base64DataUri.length,
      compressionRatio: ((svgDataUri.length - base64DataUri.length) / svgDataUri.length * 100).toFixed(1) + '%'
    });

    return base64DataUri;
  } catch (error) {
    console.error('Error converting SVG to base64:', error);
    return svgDataUri; // Return original if conversion fails
  }
}

/**
 * Optimize avatar data for storage and transmission
 */
export function optimizeAvatarData(avatarDataUri: string): string {
  // First try base64 conversion for better compression
  const base64Optimized = convertSvgToBase64(avatarDataUri);
  
  // If base64 is larger, use compressed UTF-8
  if (base64Optimized.length > avatarDataUri.length) {
    return compressSvgData(avatarDataUri);
  }
  
  return base64Optimized;
}

/**
 * Create a fallback avatar if the original is too large
 */
export function createFallbackAvatar(style: string, seed: string): string {
  // Create a simple fallback avatar with minimal data
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="40" fill="#e0e0e0" stroke="#ccc" stroke-width="2"/>
    <text x="50" y="55" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">${style.charAt(0)}</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
}

/**
 * Get optimized avatar with fallback if too large
 */
export function getOptimizedAvatar(originalDataUri: string, style: string, seed: string, maxSize: number = 50000): string {
  // First try optimization
  const optimized = optimizeAvatarData(originalDataUri);
  
  // If still too large, use fallback
  if (isAvatarDataTooLarge(optimized, maxSize)) {
    console.warn('Avatar still too large after optimization, using fallback:', { 
      style, 
      originalSize: originalDataUri.length,
      optimizedSize: optimized.length,
      maxSize 
    });
    return createFallbackAvatar(style, seed);
  }
  
  return optimized;
}

/**
 * Check if avatar data is too large and needs optimization
 */
export function isAvatarDataTooLarge(dataUri: string, maxSize: number = 50000): boolean {
  return dataUri.length > maxSize;
}
