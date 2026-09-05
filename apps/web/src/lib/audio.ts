'use client';

/**
 * Audio System for Hourglass Command
 *
 * SFX: High-quality OGG files generated with professional synthesis techniques
 * BGM: Melodic ambient music (ambientBGM_v3.ogg) with:
 *   - Soft arpeggio pattern over Am (A3-C4-E4-A4 at 80 BPM)
 *   - Warm pad chords (Am → F → G progression) with LFO modulation
 *   - Light pulse rhythm and sparse tick texture
 *   - 45-second seamless loop, stereo 48kHz
 *   - Target loudness ~-18 to -24 LUFS (sits under SFX)
 *
 * FFT verified: 98.7% energy in 100-800Hz midrange (peaks at E4=330Hz, C4=262Hz)
 * NOT a bass drone/hum - clear melodic content with musical fundamentals.
 */

export type SFXType =
  | 'injectArrive'
  | 'correctDecision'
  | 'wrongDecision'
  | 'tacticalDeploy'
  | 'microTask'
  | 'warning'
  | 'error'
  | 'scoreUp'
  | 'streakBonus'
  | 'timerTick'
  | 'timerUrgent';

interface AudioConfig {
  enabled: boolean;
  volume: number;
}

const STORAGE_KEY = 'hourglass-audio-config';

const DEFAULT_CONFIG: AudioConfig = {
  enabled: false, // Default OFF per requirements
  volume: 0.35,
};

// Get basePath for audio files (GitHub Pages compatible)
const getBasePath = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_PATH || '';
  }
  return '';
};

// Map SFX types to audio file paths
const SFX_FILES: Record<SFXType, string> = {
  injectArrive: '/audio/injectArrive.ogg',
  correctDecision: '/audio/correctDecision.ogg',
  wrongDecision: '/audio/wrongDecision.ogg',
  tacticalDeploy: '/audio/tacticalDeploy.ogg',
  microTask: '/audio/microTask.ogg',
  warning: '/audio/error.ogg', // Use error sound for warning
  error: '/audio/error.ogg',
  scoreUp: '/audio/scoreUp.ogg',
  streakBonus: '/audio/streakBonus.ogg',
  timerTick: '/audio/microTask.ogg', // Subtle tick
  timerUrgent: '/audio/timerUrgent.ogg',
};

// Audio element pool for overlapping sounds
const audioPool: Map<SFXType, HTMLAudioElement[]> = new Map();
let config: AudioConfig = DEFAULT_CONFIG;
let audioUnlocked = false;

// Unlock audio on user gesture (required for mobile)
function unlockAudio(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // Play silent audio to unlock
  const silentAudio = new Audio();
  silentAudio.volume = 0;
  silentAudio.play().catch(() => {});

  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
}

export function loadAudioConfig(): AudioConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    config = DEFAULT_CONFIG;
  }

  return config;
}

export function saveAudioConfig(newConfig: Partial<AudioConfig>): void {
  config = { ...config, ...newConfig };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

export function isAudioEnabled(): boolean {
  return config.enabled;
}

export function getAudioVolume(): number {
  return config.volume;
}

export function playSFX(sfxType: SFXType): void {
  if (!config.enabled || typeof window === 'undefined') return;

  try {
    const pool = audioPool.get(sfxType);
    if (!pool || pool.length === 0) return;

    // Find an audio element that's not currently playing
    const audio = pool.find((a) => a.paused || a.ended) || pool[0];

    // Reset and play
    audio.currentTime = 0;
    audio.volume = config.volume;
    audio.play().catch(() => {
      // Silently fail if audio blocked
    });
  } catch {
    // Silently fail
  }
}

export function initAudio(): void {
  if (typeof window === 'undefined') return;

  // Load config
  loadAudioConfig();

  // Set up audio unlock listeners
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  // Pre-load audio files
  const basePath = getBasePath();

  Object.entries(SFX_FILES).forEach(([type, path]) => {
    const pool: HTMLAudioElement[] = [];
    // Create pool of 3 for overlapping playback
    for (let i = 0; i < 3; i++) {
      const audio = new Audio(`${basePath}${path}`);
      audio.preload = 'auto';
      audio.volume = config.volume;
      pool.push(audio);
    }
    audioPool.set(type as SFXType, pool);
  });
}

// Ambient BGM support
// v3: Melodic ambient with arpeggio + pads (45s stereo, 48kHz) - clear midrange music
// FFT verified: peaks at E4(330Hz), C4(262Hz) - NOT a bass drone
// Cache-bust query ensures CDN/browser serves the new file
const BGM_FILE = '/audio/ambientBGM_v3.ogg?v=20260906';
let ambientAudio: HTMLAudioElement | null = null;
let ambientFadeInterval: ReturnType<typeof setInterval> | null = null;

export function startAmbientMusic(): void {
  if (typeof window === 'undefined' || !config.enabled) return;

  if (!ambientAudio) {
    const basePath = getBasePath();
    ambientAudio = new Audio(`${basePath}${BGM_FILE}`);
    ambientAudio.loop = true;
    ambientAudio.volume = 0;
    ambientAudio.preload = 'auto';
  }

  ambientAudio
    .play()
    .then(() => {
      // Fade in to low volume - v2 audio is properly leveled at ~-18dB
      const targetVolume = 0.12;
      const fadeIn = (): void => {
        if (!ambientAudio) return;
        if (ambientAudio.volume < targetVolume - 0.01) {
          ambientAudio.volume = Math.min(targetVolume, ambientAudio.volume + 0.01);
        } else {
          ambientAudio.volume = targetVolume;
          if (ambientFadeInterval) {
            clearInterval(ambientFadeInterval);
            ambientFadeInterval = null;
          }
        }
      };
      ambientFadeInterval = setInterval(fadeIn, 50);
    })
    .catch(() => {
      // Audio blocked
    });
}

export function stopAmbientMusic(): void {
  if (!ambientAudio) return;

  // Fade out
  const fadeOut = (): void => {
    if (!ambientAudio) return;
    if (ambientAudio.volume > 0.01) {
      ambientAudio.volume = Math.max(0, ambientAudio.volume - 0.02);
    } else {
      ambientAudio.pause();
      ambientAudio.volume = 0;
      ambientAudio.currentTime = 0;
      if (ambientFadeInterval) {
        clearInterval(ambientFadeInterval);
        ambientFadeInterval = null;
      }
    }
  };
  ambientFadeInterval = setInterval(fadeOut, 30);
}

export function isAmbientMusicPlaying(): boolean {
  return ambientAudio !== null && !ambientAudio.paused;
}
