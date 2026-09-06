'use client';

/**
 * Audio System for Hourglass Command
 *
 * SFX: High-quality OGG files generated with professional synthesis techniques
 * BGM: ElevenLabs Music (ambientBGM_v5.ogg)
 *   - music_v2 model, force_instrumental
 *   - ~45-second seamless loop
 *   - Starter plan
 */

import { getAudioUrl } from './base-path';

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

// SFX version for cache-busting (update when ElevenLabs regenerates files)
const SFX_VERSION = '20260905-elevenlabs-sfx';

// Map SFX types to audio file paths with cache-bust query params
const SFX_FILES: Record<SFXType, string> = {
  injectArrive: `/audio/injectArrive.ogg?v=${SFX_VERSION}`,
  correctDecision: `/audio/correctDecision.ogg?v=${SFX_VERSION}`,
  wrongDecision: `/audio/wrongDecision.ogg?v=${SFX_VERSION}`,
  tacticalDeploy: `/audio/tacticalDeploy.ogg?v=${SFX_VERSION}`,
  microTask: `/audio/microTask.ogg?v=${SFX_VERSION}`,
  warning: `/audio/error.ogg?v=${SFX_VERSION}`, // Use error sound for warning
  error: `/audio/error.ogg?v=${SFX_VERSION}`,
  scoreUp: `/audio/scoreUp.ogg?v=${SFX_VERSION}`,
  streakBonus: `/audio/streakBonus.ogg?v=${SFX_VERSION}`,
  timerTick: `/audio/microTask.ogg?v=${SFX_VERSION}`, // Subtle tick
  timerUrgent: `/audio/timerUrgent.ogg?v=${SFX_VERSION}`,
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

  loadAudioConfig();

  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  Object.entries(SFX_FILES).forEach(([type, path]) => {
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < 3; i++) {
      const audio = new Audio(getAudioUrl(path));
      audio.preload = 'auto';
      audio.volume = config.volume;
      pool.push(audio);
    }
    audioPool.set(type as SFXType, pool);
  });
}

// Ambient BGM support
// v5: ElevenLabs Music (music_v2, force_instrumental, ~45s, Starter plan)
// Brighter midrange, seamless loop
// Cache-bust query ensures CDN/browser serves the new file
const BGM_FILE = '/audio/ambientBGM_v5.ogg?v=20260905-elevenlabs-v5';
let ambientAudio: HTMLAudioElement | null = null;
let ambientFadeInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Get reference to ambient BGM audio element (for VO ducking)
 */
export function getAmbientAudioElement(): HTMLAudioElement | null {
  return ambientAudio;
}

export function startAmbientMusic(): void {
  if (typeof window === 'undefined' || !config.enabled) return;

  if (!ambientAudio) {
    ambientAudio = new Audio(getAudioUrl(BGM_FILE));
    ambientAudio.loop = true;
    ambientAudio.volume = 0;
    ambientAudio.preload = 'auto';
  }

  ambientAudio
    .play()
    .then(() => {
      // Fade in to low volume
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
