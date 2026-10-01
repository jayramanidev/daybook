/**
 * Haptic and subtle tactile feedback utilities.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playTactileTone(frequency: number, duration: number, gainValue = 0.05) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export function triggerHaptic(type: 'confirm' | 'tick' | 'tap', enabled: boolean = true) {
  if (!enabled) return;

  // Browser vibration API
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'confirm') {
        navigator.vibrate([25, 30, 40]);
      } else if (type === 'tick') {
        navigator.vibrate(18);
      } else {
        navigator.vibrate(12);
      }
    } catch {
      // Ignore vibration error
    }
  }

  // Micro-audio tactile response
  if (type === 'confirm') {
    playTactileTone(520, 0.08, 0.04);
    setTimeout(() => playTactileTone(680, 0.12, 0.05), 40);
  } else if (type === 'tick') {
    playTactileTone(380, 0.04, 0.03);
  } else {
    playTactileTone(440, 0.03, 0.02);
  }
}
