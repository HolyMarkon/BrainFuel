// Utility functions for playing audio feedback
export const playSuccessSound = (): void => {
  try {
    // Try to play the MP3 file first
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Fallback to generated beep sound
      playBeep(800, 200); // High pitch, short duration
    });
  } catch {
    // Fallback to generated beep sound
    playBeep(800, 200);
  }
};

export const playFailSound = (): void => {
  try {
    // Try to play the MP3 file first
    const audio = new Audio('/sounds/fail.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Fallback to generated beep sound
      playBeep(300, 400); // Low pitch, longer duration
    });
  } catch {
    // Fallback to generated beep sound
    playBeep(300, 400);
  }
};

// Generate beep sound using Web Audio API
const playBeep = (frequency: number, duration: number): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.warn('Audio playback not supported:', error);
  }
};
