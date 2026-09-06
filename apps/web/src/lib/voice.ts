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
let isVOPlaying = false;
let voUnlocked = false;
let pendingUnlockQueue: VOQueueItem[] = [];
let playAttemptCount = 0;
const MAX_PLAY_ATTEMPTS = 3;

// Single reusable Audio element for event VO - avoids autoplay-block on fresh Audio()
let eventAudioElement: HTMLAudioElement | null = null;

// Track spoken event IDs to prevent re-reading the same item (Bug fix: re-read on tab switch)
// Stores inject IDs or slugified titles that have been spoken this session
const spokenEventIds: Set<string> = new Set();

// Mutex to prevent concurrent processQueue execution
let isProcessingQueue = false;

// Reference to BGM element for ducking (set externally)
let bgmElement: HTMLAudioElement | null = null;
let bgmOriginalVolume = 0.12;
const BGM_DUCK_VOLUME = 0.04;
const BGM_DUCK_DURATION = 150;

/**
 * Initialize the reusable event Audio element.
 * Called during initVO() to create it early.
 */
function initEventAudioElement(): void {
  if (typeof window === 'undefined') return;
  if (eventAudioElement) return;

  eventAudioElement = new Audio();
  eventAudioElement.preload = 'auto';
  eventAudioElement.volume = voConfig.volume;

  eventAudioElement.addEventListener('ended', onVOEnded);
  eventAudioElement.addEventListener('error', () => {
    onEventAudioError();
  });
}

/**
 * Unlock audio playback after first user gesture.
 * Browsers block autoplay until user interacts with the page.
 * This function:
 * 1. Marks VO as unlocked
 * 2. Warms up ALL audio elements (preloaded + event) with silent play
 * 3. Resets any stuck isVOPlaying state
 * 4. Flushes pending queue items that may have been blocked
 */
function unlockVO(): void {
  if (voUnlocked) return;
  voUnlocked = true;

  document.removeEventListener('click', unlockVO);
  document.removeEventListener('touchstart', unlockVO);
  document.removeEventListener('keydown', unlockVO);

  // Warm up ALL preloaded audio elements with silent play
  voAudioElements.forEach((audio) => {
    const originalVolume = audio.volume;
    audio.volume = 0;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = originalVolume;
      })
      .catch(() => {
        audio.volume = originalVolume;
      });
  });

  // Warm up the event audio element - this is critical for mobile/Safari
  if (eventAudioElement) {
    const originalVolume = eventAudioElement.volume;
    eventAudioElement.volume = 0;
    // Use a data URI for silent audio to avoid network request
    const silentDataUri =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    eventAudioElement.src = silentDataUri;
    eventAudioElement
      .play()
      .then(() => {
        eventAudioElement!.pause();
        eventAudioElement!.currentTime = 0;
        eventAudioElement!.volume = originalVolume;
        eventAudioElement!.src = '';
      })
      .catch(() => {
        eventAudioElement!.volume = originalVolume;
        eventAudioElement!.src = '';
      });
  }

  // Reset stuck state
  if (isVOPlaying && !eventAudioElement?.src && !currentlyPlaying) {
    isVOPlaying = false;
  }

  // Flush pending queue
  if (pendingUnlockQueue.length > 0) {
    voQueue = [...pendingUnlockQueue, ...voQueue];
    pendingUnlockQueue = [];
    playAttemptCount = 0;
  }

  setTimeout(() => {
    if (!isVOPlaying && voQueue.length > 0) {
      processQueue();
    }
  }, 100);
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
    if (currentlyPlaying === 'event' && eventAudioElement) {
      eventAudioElement.pause();
      eventAudioElement.currentTime = 0;
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
  playAttemptCount = 0;
  restoreBGMVolume();

  setTimeout(processQueue, 100);
}

// Track current event URL for error handling fallback
let currentEventUrl: string | null = null;
let currentEventFallbackUrl: string | null = null;

function onEventAudioError(): void {
  // Try fallback if available
  if (currentEventFallbackUrl && currentEventUrl !== currentEventFallbackUrl && eventAudioElement) {
    currentEventUrl = currentEventFallbackUrl;
    currentEventFallbackUrl = null;
    eventAudioElement.src = currentEventUrl;
    eventAudioElement.play().catch(() => {
      handlePlayFailure();
    });
  } else {
    handlePlayFailure();
  }
}

/**
 * Handle play failure - queue for retry or move to next item
 */
function handlePlayFailure(item?: VOQueueItem): void {
  isVOPlaying = false;
  currentlyPlaying = null;
  currentEventUrl = null;
  currentEventFallbackUrl = null;
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
  // Mutex: prevent concurrent queue processing
  if (isProcessingQueue) {
    return;
  }

  // Don't process if already playing, queue empty, or voice disabled
  if (isVOPlaying || voQueue.length === 0 || !voConfig.voiceEnabled) {
    return;
  }

  isProcessingQueue = true;

  try {
    // Stuck state recovery: if isVOPlaying is true but nothing is actually playing,
    // reset the state (handles edge cases where ended event didn't fire)
    if (isVOPlaying) {
      const eventPlaying = eventAudioElement && !eventAudioElement.paused;
      const cueAudio = currentlyPlaying ? voAudioElements.get(currentlyPlaying as VOType) : null;
      const cuePlaying = cueAudio && !cueAudio.paused;
      if (!eventPlaying && !cuePlaying) {
        isVOPlaying = false;
        currentlyPlaying = null;
      } else {
        // Something is actually playing, don't process
        return;
      }
    }

    // Sort by priority (higher first), then by timestamp (earlier first)
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
  } finally {
    isProcessingQueue = false;
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

/**
 * Play event VO using the reusable Audio element.
 * This avoids autoplay-block issues that occur with fresh new Audio() elements.
 * The eventAudioElement is warmed up during unlock to ensure it can play.
 */
function playEventVOImmediate(
  audioUrl: string,
  fallbackUrl?: string,
  queueItem?: VOQueueItem
): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') {
    handlePlayFailure(queueItem);
    return;
  }

  // Ensure event audio element exists
  if (!eventAudioElement) {
    initEventAudioElement();
  }

  if (!eventAudioElement) {
    handlePlayFailure(queueItem);
    return;
  }

  isVOPlaying = true;
  currentlyPlaying = 'event';

  // Store for error handling fallback
  currentEventUrl = audioUrl;
  currentEventFallbackUrl = fallbackUrl || null;

  duckBGM();

  // Reuse the single element - just change src
  eventAudioElement.volume = voConfig.volume;
  eventAudioElement.src = audioUrl;
  eventAudioElement.currentTime = 0;

  eventAudioElement.play().catch((err) => {
    if (err.name === 'NotAllowedError' && !voUnlocked && queueItem) {
      // Not unlocked yet - queue for later
      isVOPlaying = false;
      currentlyPlaying = null;
      currentEventUrl = null;
      currentEventFallbackUrl = null;
      restoreBGMVolume();
      pendingUnlockQueue.push(queueItem);
      return;
    }
    // Try fallback
    onEventAudioError();
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
 * Each inject is spoken at most once per session (tracked by slug).
 * Re-opening an already-spoken inject is silent.
 *
 * @param title - The inject title (will be slugified to find audio file)
 * @param triagePriority - Optional triage priority for queue priority and fallback selection
 * @param injectId - Optional inject ID for tracking (uses slug if not provided)
 */
export function playEventVO(
  title: string,
  triagePriority?: 'IMMEDIATE' | 'URGENT' | 'ROUTINE',
  injectId?: string
): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') return;

  const slug = slugifyTitle(title);
  const trackingId = injectId || slug;

  // Skip if this inject has already been spoken this session
  if (spokenEventIds.has(trackingId)) {
    return;
  }

  // Mark as spoken immediately to prevent duplicates from rapid calls
  spokenEventIds.add(trackingId);

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
 * Each inject is spoken at most once per session. If already spoken,
 * this is a silent no-op (user can still see the item, just no re-read).
 *
 * @param title - The inject title
 * @param triagePriority - Optional triage priority for fallback selection
 * @param injectId - Optional inject ID for tracking (uses slug if not provided)
 */
export function playEventVOOnSelect(
  title: string,
  triagePriority?: 'IMMEDIATE' | 'URGENT' | 'ROUTINE',
  injectId?: string
): void {
  if (!voConfig.voiceEnabled || typeof window === 'undefined') return;

  const slug = slugifyTitle(title);
  const trackingId = injectId || slug;

  // Skip if this inject has already been spoken this session
  if (spokenEventIds.has(trackingId)) {
    return;
  }

  // Mark as spoken immediately to prevent duplicates from rapid calls
  spokenEventIds.add(trackingId);

  const priority = triagePriority
    ? Math.min(EVENT_VO_PRIORITY[triagePriority] + 1, 10)
    : EVENT_VO_PRIORITY.ROUTINE + 1;

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
 * Skip current VO and clear queue
 */
export function skipVO(): void {
  if (currentlyPlaying === 'event' && eventAudioElement) {
    eventAudioElement.pause();
    eventAudioElement.currentTime = 0;
    currentEventUrl = null;
    currentEventFallbackUrl = null;
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
 * Check if an inject/event has been spoken this session.
 * Uses inject ID or slugified title for tracking.
 */
export function hasEventBeenSpoken(titleOrId: string): boolean {
  return spokenEventIds.has(titleOrId) || spokenEventIds.has(slugifyTitle(titleOrId));
}

/**
 * Mark an event as spoken (for external use, e.g., when skipping VO).
 */
export function markEventAsSpoken(titleOrId: string): void {
  spokenEventIds.add(titleOrId);
}

/**
 * Clear the spoken events set (for new game/session).
 * Called automatically by cleanupVO.
 */
export function clearSpokenEvents(): void {
  spokenEventIds.clear();
}

/**
 * Get the count of spoken events this session.
 */
export function getSpokenEventCount(): number {
  return spokenEventIds.size;
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

  // Initialize reusable event Audio element early
  initEventAudioElement();

  // Preload cue VO files
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

  // Clear spoken events tracking for new session
  spokenEventIds.clear();

  // Clean up cue audio elements
  voAudioElements.forEach((audio) => {
    audio.removeEventListener('ended', onVOEnded);
    audio.removeEventListener('error', onVOEnded);
  });
  voAudioElements.clear();

  // Clean up event audio element
  if (eventAudioElement) {
    eventAudioElement.removeEventListener('ended', onVOEnded);
    eventAudioElement.pause();
    eventAudioElement = null;
  }
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
