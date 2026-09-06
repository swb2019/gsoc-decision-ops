'use client';

/**
 * Voice-Over System for Hourglass Command
 *
 * ElevenLabs professional VO with three voice actors:
 * - Daniel (ops): Critical alerts and decision feedback
 * - Alice (guidance): Tutorial tips and coaching
 * - River (dispatch): Scenario lifecycle announcements
 *
 * Features:
 * - Non-overlapping queue with priority
 * - BGM ducking during VO playback
 * - Separate voiceEnabled toggle (default ON for first-run polish)
 * - Respects user preferences independently of SFX/BGM
 * - Event-specific VO playback with fallback to generic cues
 * - Robust audio unlock with queue flush on first user gesture
 */

import { slugifyTitle } from '@gsoc-decision-ops/core';
import { getBasePath, getAudioUrl } from './base-path';

// Re-export for convenience
export { slugifyTitle, getBasePath };

export type VOType =
  // Daniel (ops) - urgent/feedback
  | 'inject_critical'
  | 'inject_elevated'
  | 'decision_prompt'
  | 'decision_correct'
  | 'decision_miss'
  | 'timer_urgent'
  | 'streak_bonus'
  // Alice (guidance) - tips (all 7)
  | 'tip_intel'
  | 'tip_cop'
  | 'tip_layers'
  | 'tip_tactical'
  | 'tip_team'
  | 'tip_kri'
  | 'tip_guide'
  // River (dispatch) - lifecycle
  | 'scenario_start'
  | 'pause_save'
  | 'aar_ready'
  | 'music_hint';

interface VOConfig {
  voiceEnabled: boolean;
  volume: number;
}

interface VOQueueItem {
  type: VOType | 'event';
  priority: number;
  timestamp: number;
  audioUrl?: string;
  fallbackUrl?: string;
}

const VOICE_STORAGE_KEY = 'hourglass-voice-config';

const DEFAULT_VO_CONFIG: VOConfig = {
  voiceEnabled: true, // Default ON for first-run polish
  volume: 0.85,
};

const VO_VERSION = '20260906-elevenlabs-vo';

const VO_FILES: Record<VOType, { path: string; priority: number }> = {
  // High priority - critical ops (Daniel)
  inject_critical: { path: `/audio/voice/inject_critical.ogg?v=${VO_VERSION}`, priority: 10 },
  timer_urgent: { path: `/audio/voice/timer_urgent.ogg?v=${VO_VERSION}`, priority: 9 },
  decision_prompt: { path: `/audio/voice/decision_prompt.ogg?v=${VO_VERSION}`, priority: 8 },

  // Medium-high priority - feedback (Daniel)
  decision_correct: { path: `/audio/voice/decision_correct.ogg?v=${VO_VERSION}`, priority: 7 },
  decision_miss: { path: `/audio/voice/decision_miss.ogg?v=${VO_VERSION}`, priority: 7 },
  streak_bonus: { path: `/audio/voice/streak_bonus.ogg?v=${VO_VERSION}`, priority: 6 },
  inject_elevated: { path: `/audio/voice/inject_elevated.ogg?v=${VO_VERSION}`, priority: 5 },

  // Medium priority - lifecycle (River)
  scenario_start: { path: `/audio/voice/scenario_start.ogg?v=${VO_VERSION}`, priority: 8 },
  aar_ready: { path: `/audio/voice/aar_ready.ogg?v=${VO_VERSION}`, priority: 5 },
  pause_save: { path: `/audio/voice/pause_save.ogg?v=${VO_VERSION}`, priority: 4 },
  music_hint: { path: `/audio/voice/music_hint.ogg?v=${VO_VERSION}`, priority: 2 },

  // Lower priority - guidance tips (Alice)
  tip_intel: { path: `/audio/voice/tip_intel.ogg?v=${VO_VERSION}`, priority: 3 },
  tip_cop: { path: `/audio/voice/tip_cop.ogg?v=${VO_VERSION}`, priority: 3 },
  tip_layers: { path: `/audio/voice/tip_layers.ogg?v=${VO_VERSION}`, priority: 3 },
  tip_tactical: { path: `/audio/voice/tip_tactical.ogg?v=${VO_VERSION}`, priority: 3 },
  tip_team: { path: `/audio/voice/tip_team.ogg?v=${VO_VERSION}`, priority: 3 },
  tip_kri: { path: `/audio/voice/tip_kri.ogg?v=${VO_VERSION}`, priority: 3 },
  tip_guide: { path: `/audio/voice/tip_guide.ogg?v=${VO_VERSION}`, priority: 3 },
};

// Event VO priority levels (higher = more urgent, plays first)
const EVENT_VO_PRIORITY: Record<string, number> = {
  IMMEDIATE: 10, // Same as inject_critical
  URGENT: 6, // Between streak_bonus and inject_elevated
  ROUTINE: 4, // Same as pause_save
};

let voConfig: VOConfig = { ...DEFAULT_VO_CONFIG };
const voAudioElements: Map<VOType, HTMLAudioElement> = new Map();
let voQueue: VOQueueItem[] = [];
let currentlyPlaying: VOType | 'event' | null = null;
let currentEventAudio: HTMLAudioElement | null = null;
let isVOPlaying = false;
let voUnlocked = false;
let pendingUnlockQueue: VOQueueItem[] = [];
let playAttemptCount = 0;
const MAX_PLAY_ATTEMPTS = 3;

// Reference to BGM element for ducking (set externally)
let bgmElement: HTMLAudioElement | null = null;
let bgmOriginalVolume = 0.12;
const BGM_DUCK_VOLUME = 0.04;
const BGM_DUCK_DURATION = 150;

/**
 * Unlock audio playback after first user gesture.
 * Browsers block autoplay until user interacts with the page.
 * This function:
 * 1. Marks VO as unlocked
 * 2. Plays a silent audio to trigger browser unlock
 * 3. Resets any stuck isVOPlaying state
 * 4. Flushes pending queue items that may have been blocked
 */
function unlockVO(): void {
  if (voUnlocked) return;
  voUnlocked = true;

  const silentAudio = new Audio();
  silentAudio.volume = 0;
  silentAudio
    .play()
    .then(() => {
      silentAudio.pause();
    })
    .catch(() => {});

  document.removeEventListener('click', unlockVO);
  document.removeEventListener('touchstart', unlockVO);
  document.removeEventListener('keydown', unlockVO);

  if (isVOPlaying && !currentEventAudio && !currentlyPlaying) {
    isVOPlaying = false;
  }

  if (pendingUnlockQueue.length > 0) {
    voQueue = [...pendingUnlockQueue, ...voQueue];
    pendingUnlockQueue = [];
    playAttemptCount = 0;
  }

  setTimeout(() => {
    if (!isVOPlaying && voQueue.length > 0) {
      processQueue();
    }
  }, 50);
}

/**
 * Check if audio playback is unlocked (user has interacted with page)
 */
export function isVOUnlocked(): boolean {
  return voUnlocked;
}

export function loadVOConfig(): VOConfig {
  if (typeof window === 'undefined') return DEFAULT_VO_CONFIG;

  try {
    const stored = localStorage.getItem(VOICE_STORAGE_KEY);
    if (stored) {
      voConfig = { ...DEFAULT_VO_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    voConfig = { ...DEFAULT_VO_CONFIG };
  }

  return voConfig;
}

export function saveVOConfig(newConfig: Partial<VOConfig>): void {
  voConfig = { ...voConfig, ...newConfig };
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(voConfig));
  }

  // Update volume on all preloaded elements
  voAudioElements.forEach((audio) => {
    audio.volume = voConfig.volume;
  });
}

export function isVoiceEnabled(): boolean {
  return voConfig.voiceEnabled;
}

export function getVOVolume(): number {
  return voConfig.volume;
}

export function setVoiceEnabled(enabled: boolean): void {
  saveVOConfig({ voiceEnabled: enabled });

  // Stop current playback if disabling
  if (!enabled && currentlyPlaying) {
    if (currentlyPlaying === 'event' && currentEventAudio) {
      currentEventAudio.pause();
      currentEventAudio.currentTime = 0;
      currentEventAudio = null;
    } else {
      const audio = voAudioElements.get(currentlyPlaying as VOType);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
    currentlyPlaying = null;
    isVOPlaying = false;
    voQueue = [];
    restoreBGMVolume();
  }
}

export function setVOVolume(volume: number): void {
  saveVOConfig({ volume: Math.max(0, Math.min(1, volume)) });
}

export function setBGMReference(bgmAudio: HTMLAudioElement | null): void {
  bgmElement = bgmAudio;
  if (bgmAudio) {
    bgmOriginalVolume = bgmAudio.volume;
  }
}

function duckBGM(): void {
  if (!bgmElement || bgmElement.paused) return;

  bgmOriginalVolume = bgmElement.volume;
  const startVolume = bgmElement.volume;
  const startTime = performance.now();

  const fade = (): void => {
    if (!bgmElement) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / BGM_DUCK_DURATION, 1);
    bgmElement.volume = startVolume - (startVolume - BGM_DUCK_VOLUME) * progress;

    if (progress < 1) {
      requestAnimationFrame(fade);
    }
  };
  requestAnimationFrame(fade);
}

function restoreBGMVolume(): void {
  if (!bgmElement || bgmElement.paused) return;

  const startVolume = bgmElement.volume;
  const startTime = performance.now();

  const fade = (): void => {
    if (!bgmElement) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / BGM_DUCK_DURATION, 1);
    bgmElement.volume = startVolume + (bgmOriginalVolume - startVolume) * progress;

    if (progress < 1) {
      requestAnimationFrame(fade);
    }
  };
  requestAnimationFrame(fade);
}

function onVOEnded(): void {
  isVOPlaying = false;
  currentlyPlaying = null;
  currentEventAudio = null;
  playAttemptCount = 0;
  restoreBGMVolume();

  setTimeout(processQueue, 100);
}

/**
 * Handle play failure - queue for retry or move to next item
 */
function handlePlayFailure(item?: VOQueueItem): void {
  isVOPlaying = false;
  currentlyPlaying = null;
  currentEventAudio = null;
  restoreBGMVolume();

  if (!voUnlocked && item) {
    pendingUnlockQueue.push(item);
    return;
  }

  playAttemptCount++;
  if (playAttemptCount >= MAX_PLAY_ATTEMPTS) {
    playAttemptCount = 0;
  }

  setTimeout(processQueue, 100);
}

function processQueue(): void {
  if (isVOPlaying || voQueue.length === 0 || !voConfig.voiceEnabled) {
    return;
  }

  if (isVOPlaying && playAttemptCount === 0) {
    const timeout = setTimeout(() => {
      if (isVOPlaying && !currentEventAudio) {
        const audioPlaying = currentlyPlaying
          ? voAudioElements.get(currentlyPlaying as VOType)
          : null;
        if (!audioPlaying || audioPlaying.paused) {
          isVOPlaying = false;
          currentlyPlaying = null;
          processQueue();
        }
      }
    }, 5000);
    return void timeout;
  }

  voQueue.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.timestamp - b.timestamp;
  });

  const item = voQueue.shift();
  if (!item) return;

  if (item.type === 'event' && item.audioUrl) {
    playEventVOImmediate(item.audioUrl, item.fallbackUrl, item);
  } else if (item.type !== 'event') {
    playVOImmediate(item.type, item);
  }
}

function playVOImmediate(voType: VOType, queueItem?: VOQueueItem): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') {
    handlePlayFailure(queueItem);
    return;
  }

  const audio = voAudioElements.get(voType);
  if (!audio) {
    handlePlayFailure(queueItem);
    return;
  }

  isVOPlaying = true;
  currentlyPlaying = voType;

  duckBGM();

  audio.currentTime = 0;
  audio.volume = voConfig.volume;

  audio
    .play()
    .then(() => {
      playAttemptCount = 0;
    })
    .catch(() => {
      handlePlayFailure(queueItem);
    });
}

function playEventVOImmediate(
  audioUrl: string,
  fallbackUrl?: string,
  queueItem?: VOQueueItem
): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') {
    handlePlayFailure(queueItem);
    return;
  }

  isVOPlaying = true;
  currentlyPlaying = 'event';

  duckBGM();

  const playFallback = (): void => {
    if (fallbackUrl && audioUrl !== fallbackUrl) {
      currentEventAudio = new Audio(fallbackUrl);
      currentEventAudio.volume = voConfig.volume;
      currentEventAudio.addEventListener('ended', onVOEnded);
      currentEventAudio.addEventListener('error', () => {
        handlePlayFailure();
      });
      currentEventAudio.play().catch(() => {
        handlePlayFailure();
      });
    } else {
      handlePlayFailure();
    }
  };

  currentEventAudio = new Audio(audioUrl);
  currentEventAudio.volume = voConfig.volume;

  currentEventAudio.addEventListener('ended', onVOEnded);
  currentEventAudio.addEventListener('error', () => {
    playFallback();
  });

  currentEventAudio.play().catch((err) => {
    if (err.name === 'NotAllowedError' && !voUnlocked && queueItem) {
      isVOPlaying = false;
      currentlyPlaying = null;
      currentEventAudio = null;
      restoreBGMVolume();
      pendingUnlockQueue.push(queueItem);
      return;
    }
    playFallback();
  });
}

/**
 * Queue a voice-over line to play.
 * Higher priority lines play first. Same priority uses FIFO.
 * Won't overlap - lines queue and play sequentially.
 */
export function playVO(voType: VOType): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') return;

  const voInfo = VO_FILES[voType];
  if (!voInfo) return;

  // Add to queue
  voQueue.push({
    type: voType,
    priority: voInfo.priority,
    timestamp: Date.now(),
  });

  // Try to process
  processQueue();
}

/**
 * Build the URL for an event VO file.
 * Exported for testing purposes.
 */
export function getEventVOUrl(title: string): string {
  const slug = slugifyTitle(title);
  return getAudioUrl(`/audio/voice/events/${slug}.ogg?v=${VO_VERSION}`);
}

/**
 * Play event voice-over for an inject.
 * Looks up event-specific VO file by slugified title.
 * Falls back to inject_critical/inject_elevated if file not found.
 *
 * @param title - The inject title (will be slugified to find audio file)
 * @param triagePriority - Optional triage priority for queue priority and fallback selection
 */
export function playEventVO(
  title: string,
  triagePriority?: 'IMMEDIATE' | 'URGENT' | 'ROUTINE'
): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') return;

  const slug = slugifyTitle(title);
  const priority = triagePriority ? EVENT_VO_PRIORITY[triagePriority] : EVENT_VO_PRIORITY.ROUTINE;

  const audioUrl = getAudioUrl(`/audio/voice/events/${slug}.ogg?v=${VO_VERSION}`);
  const fallbackCue = priority >= EVENT_VO_PRIORITY.URGENT ? 'inject_critical' : 'inject_elevated';
  const fallbackUrl = getAudioUrl(`/audio/voice/${fallbackCue}.ogg?v=${VO_VERSION}`);

  voQueue.push({
    type: 'event',
    priority,
    timestamp: Date.now(),
    audioUrl,
    fallbackUrl,
  });

  processQueue();
}

/**
 * Play event voice-over for an Intel Feed item when user clicks/selects it.
 * Higher priority than reveal-triggered VO to ensure immediate feedback.
 *
 * @param title - The inject title
 * @param triagePriority - Optional triage priority for fallback selection
 */
export function playEventVOOnSelect(
  title: string,
  triagePriority?: 'IMMEDIATE' | 'URGENT' | 'ROUTINE'
): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') return;

  const priority = triagePriority
    ? Math.min(EVENT_VO_PRIORITY[triagePriority] + 1, 10)
    : EVENT_VO_PRIORITY.ROUTINE + 1;

  const audioUrl = getAudioUrl(`/audio/voice/events/${slugifyTitle(title)}.ogg?v=${VO_VERSION}`);
  const fallbackCue = priority >= EVENT_VO_PRIORITY.URGENT ? 'inject_critical' : 'inject_elevated';
  const fallbackUrl = getAudioUrl(`/audio/voice/${fallbackCue}.ogg?v=${VO_VERSION}`);

  voQueue.push({
    type: 'event',
    priority,
    timestamp: Date.now(),
    audioUrl,
    fallbackUrl,
  });

  processQueue();
}

/**
 * Skip current VO and clear queue
 */
export function skipVO(): void {
  if (currentlyPlaying === 'event' && currentEventAudio) {
    currentEventAudio.pause();
    currentEventAudio.currentTime = 0;
    currentEventAudio = null;
  } else if (currentlyPlaying && currentlyPlaying !== 'event') {
    const audio = voAudioElements.get(currentlyPlaying);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
  voQueue = [];
  isVOPlaying = false;
  currentlyPlaying = null;
  restoreBGMVolume();
}

/**
 * Clear pending queue but let current VO finish
 */
export function clearVOQueue(): void {
  voQueue = [];
}

/**
 * Check if VO is currently playing
 */
export function isVOCurrentlyPlaying(): boolean {
  return isVOPlaying;
}

/**
 * Get current queue length
 */
export function getVOQueueLength(): number {
  return voQueue.length;
}

/**
 * Initialize the voice-over system.
 * Call once on app mount.
 */
export function initVO(): void {
  if (typeof window === 'undefined') return;

  loadVOConfig();

  document.addEventListener('click', unlockVO);
  document.addEventListener('touchstart', unlockVO);
  document.addEventListener('keydown', unlockVO);

  Object.entries(VO_FILES).forEach(([type, info]) => {
    const audio = new Audio(getAudioUrl(info.path));
    audio.preload = 'auto';
    audio.volume = voConfig.volume;

    audio.addEventListener('ended', onVOEnded);
    audio.addEventListener('error', onVOEnded);

    voAudioElements.set(type as VOType, audio);
  });
}

/**
 * Cleanup voice-over system
 */
export function cleanupVO(): void {
  skipVO();
  voAudioElements.forEach((audio) => {
    audio.removeEventListener('ended', onVOEnded);
    audio.removeEventListener('error', onVOEnded);
  });
  voAudioElements.clear();
}

/**
 * Map guidance tip IDs to VO types
 */
export function getTipVOType(tipId: string): VOType | null {
  const mapping: Record<string, VOType> = {
    intel_first_visit: 'tip_intel',
    cop_first_visit: 'tip_cop',
    layers_first_visit: 'tip_layers',
    tactical_first_visit: 'tip_tactical',
    team_first_visit: 'tip_team',
    kri_first_visit: 'tip_kri',
    guide_first_visit: 'tip_guide',
    // Also match surface-based tip IDs
    INTEL_FEED: 'tip_intel',
    COP_LAYERS: 'tip_cop',
    TACTICAL: 'tip_tactical',
    TEAM_STAKEHOLDERS: 'tip_team',
    KRI_VALUE: 'tip_kri',
    FIELD_GUIDE: 'tip_guide',
  };

  return mapping[tipId] || null;
}
