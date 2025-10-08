/**
 * Utility functions for playing notification sounds
 */

// Create a simple pop sound using Web Audio API
export const playPopSound = () => {
  try {
    // Check if audio context is supported
    if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) {
      console.log('Audio context not supported');
      return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();

    // Create oscillator for the pop sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the pop sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Start at 800Hz
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1); // Drop to 200Hz

    // Configure volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // Quick decay

    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);

    console.log('🔊 Pop sound played');
  } catch (error) {
    console.error('Error playing pop sound:', error);
  }
};

// Alternative: Use a simple beep sound
export const playBeepSound = () => {
  try {
    if (typeof window === 'undefined') return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Simple beep configuration
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);

    console.log('🔊 Beep sound played');
  } catch (error) {
    console.error('Error playing beep sound:', error);
  }
};

// Check if user has granted audio permissions
export const checkAudioPermission = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();

    // Try to resume the context (this will prompt for permission if needed)
    await audioContext.resume();
    
    // If we get here, audio is allowed
    audioContext.close();
    return true;
  } catch (error) {
    console.log('Audio permission denied or not available:', error);
    return false;
  }
};
