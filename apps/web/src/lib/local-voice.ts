'use client';

/**
 * Local comms / voice session path for Hourglass Command
 *
 * On-device radio: Whisper Base (STT) + Kokoro-82M (TTS).
 * Models lazy-load only when the operator enables two-way audio (~230MB, one-time).
 * Yields to ElevenLabs scripted VO whenever that path is playing.
 *
 * First enable loads two ONNX stacks on the main thread (voiceWorker is unused).
 * Quantized dtypes, inter-model yield, heap-pressure skip, and throttled progress
 * exist so Chromium does not OOM / lock the tab the way a cold fp32 provision can.
 */

import {
  CDN_SCRIPT_TIMEOUT_MS,
  INTER_MODEL_YIELD_MS,
  PROGRESS_THROTTLE_MS,
  getKokoroDtype,
  getWhisperDtype,
  isHeapUnderPressure,
  isMemoryError,
  pickInferenceDevice,
  shouldReuseInMemoryModels,
  shouldSkipKokoro,
  type HeapMeasurement,
  type InferenceDevice,
} from './local-voice-load-policy';
import { createModelDownloadSession } from './model-download-session';
import { createVoiceEndpoint } from './voice-endpoint';
import {
  WHISPER_TRANSCRIBE_OPTIONS,
  exactTranscript,
  trimSpeechSamples,
} from './whisper-transcript';

// Configuration
const LOCAL_VOICE_STORAGE_KEY = 'hourglass-local-voice-config';
const MODEL_CACHE_KEY = 'hourglass-local-voice-models';

// Model sizes (approximate, for progress display)
const WHISPER_MODEL_SIZE_MB = 145; // whisper-base with hybrid quantization
const KOKORO_MODEL_SIZE_MB = 87; // kokoro-82m

export interface LocalVoiceConfig {
  enabled: boolean;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  ttsVoice: string; // Kokoro voice or Web Speech voice
  ttsRate: number;
  micDeviceId: string | null;
}

export interface ModelLoadProgress {
  stage: 'idle' | 'downloading' | 'loading' | 'ready' | 'error';
  progress: number; // 0-100
  currentModel: 'whisper' | 'kokoro' | null;
  message: string;
  error?: string;
}

export interface TranscriptionResult {
  turnId: number;
  contextId?: string;
  text: string;
  confidence?: number;
  duration?: number;
}

export interface LocalVoiceState {
  isAvailable: boolean;
  isLoading: boolean;
  isListening: boolean;
  isStarting: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  sttReady: boolean;
  ttsReady: boolean;
  webGpuAvailable: boolean;
  fallbackTTS: 'web-speech' | null;
  error: string | null;
}

const DEFAULT_CONFIG: LocalVoiceConfig = {
  enabled: false, // OFF by default - models only load when enabled
  sttEnabled: true,
  ttsEnabled: true,
  ttsVoice: 'af_heart', // Kokoro default voice
  ttsRate: 1.0,
  micDeviceId: null,
};

let config: LocalVoiceConfig = { ...DEFAULT_CONFIG };
let state: LocalVoiceState = {
  isAvailable: false,
  isLoading: false,
  isListening: false,
  isStarting: false,
  isTranscribing: false,
  isSpeaking: false,
  sttReady: false,
  ttsReady: false,
  webGpuAvailable: false,
  fallbackTTS: null,
  error: null,
};

let modelProgress: ModelLoadProgress = {
  stage: 'idle',
  progress: 0,
  currentModel: null,
  message: '',
};

// Worker and model references (worker slot reserved; provision still runs on main)
let voiceWorker: Worker | null = null;
let whisperPipeline: unknown = null;
let kokoroInstance: unknown = null;
let webSpeechSynth: SpeechSynthesis | null = null;
let enableInFlight = false;
let downloadSession: ReturnType<typeof createModelDownloadSession> | null = null;
let initPromise: Promise<void> | null = null;
let transformersLoadPromise: Promise<{
  pipeline: unknown;
  env: { useBrowserCache?: boolean; allowLocalModels?: boolean };
}> | null = null;
let kokoroLoadPromise: Promise<{
  KokoroTTS: {
    from_pretrained: (model: string, options?: object) => Promise<unknown>;
  };
}> | null = null;
let lastProgressNotifyAt = 0;
let pendingProgressTimer: ReturnType<typeof setTimeout> | null = null;

// Audio context and media recorder
let audioContext: AudioContext | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordingGeneration = 0;
let recordingSendGeneration: number | null = null;
let clearRecordingMonitor: (() => void) | null = null;
let recordingHasSpeech: () => boolean = () => false;
let voiceOutputEpoch = 0;
let transcriptionTail: Promise<void> = Promise.resolve();
let micStream: MediaStream | null = null;

// Callbacks
type ProgressCallback = (progress: ModelLoadProgress) => void;
type StateCallback = (state: LocalVoiceState) => void;
type TranscriptionCallback = (result: TranscriptionResult) => void;

let progressCallbacks: ProgressCallback[] = [];
let stateCallbacks: StateCallback[] = [];
let transcriptionCallbacks: TranscriptionCallback[] = [];

// TTS queue (yields to ElevenLabs VO)
interface TTSQueueItem {
  text: string;
  priority: number;
  timestamp: number;
}

let ttsQueue: TTSQueueItem[] = [];
let isProcessingTTS = false;
let currentTTSAudio: HTMLAudioElement | null = null;
let settleCurrentSpeech: (() => void) | null = null;
let conversationActive = false;

export function setVoiceConversationActive(active: boolean): void {
  conversationActive = active;
  updateState({});
}
export function isVoiceConversationActive(): boolean {
  return conversationActive;
}
export function hasLocalVoiceSpeech(): boolean {
  return recordingHasSpeech();
}

// Reference to ElevenLabs VO state checker
let isElevenLabsPlaying: (() => boolean) | null = null;

/**
 * Register callback for when ElevenLabs VO is playing
 */
export function setElevenLabsPlayingChecker(checker: () => boolean): void {
  isElevenLabsPlaying = checker;
}

/**
 * Check if WebGPU is available
 */
async function checkWebGPU(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpu = (navigator as any).gpu;
    if (gpu) {
      const adapter = await gpu.requestAdapter();
      return adapter !== null;
    }
  } catch {
    // WebGPU not available
  }
  return false;
}

/**
 * Load config from localStorage
 */
export function loadLocalVoiceConfig(): LocalVoiceConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  // Don't clobber in-memory enabled=true while a provision is running (storage
  // is only written after success so a remount would otherwise reset the toggle).
  if (enableInFlight || state.isLoading) return config;

  try {
    const stored = localStorage.getItem(LOCAL_VOICE_STORAGE_KEY);
    if (stored) {
      config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    config = { ...DEFAULT_CONFIG };
  }

  return config;
}

/**
 * Save config to localStorage
 */
export function saveLocalVoiceConfig(newConfig: Partial<LocalVoiceConfig>): void {
  patchConfig(newConfig, true);
}

/**
 * Get current config
 */
export function getLocalVoiceConfig(): LocalVoiceConfig {
  return { ...config };
}

/**
 * Get current state
 */
export function getLocalVoiceState(): LocalVoiceState {
  return { ...state };
}

/**
 * Get model loading progress
 */
export function getModelProgress(): ModelLoadProgress {
  return { ...modelProgress };
}

/**
 * Check if local voice is enabled
 */
export function isLocalVoiceEnabled(): boolean {
  return config.enabled;
}

/**
 * Local voice output is ready to speak dynamic lines (injects, decisions, micro-tasks).
 */
export function isLocalTTSReady(): boolean {
  return config.enabled && config.ttsEnabled && state.ttsReady;
}

/**
 * Subscribe to progress updates
 */
export function onProgress(callback: ProgressCallback): () => void {
  progressCallbacks.push(callback);
  return () => {
    progressCallbacks = progressCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Subscribe to state updates
 */
export function onStateChange(callback: StateCallback): () => void {
  stateCallbacks.push(callback);
  return () => {
    stateCallbacks = stateCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Subscribe to transcription results
 */
export function onTranscription(callback: TranscriptionCallback): () => void {
  transcriptionCallbacks.push(callback);
  return () => {
    transcriptionCallbacks = transcriptionCallbacks.filter((cb) => cb !== callback);
  };
}

function notifyProgress(): void {
  progressCallbacks.forEach((cb) => cb(modelProgress));
}

function notifyStateChange(): void {
  stateCallbacks.forEach((cb) => cb(state));
}

function notifyTranscription(result: TranscriptionResult): void {
  transcriptionCallbacks.forEach((cb) => cb(result));
}

function flushProgress(): void {
  lastProgressNotifyAt = Date.now();
  if (pendingProgressTimer !== null) {
    clearTimeout(pendingProgressTimer);
    pendingProgressTimer = null;
  }
  notifyProgress();
}

function scheduleProgressNotify(immediate: boolean): void {
  if (immediate) {
    flushProgress();
    return;
  }
  const elapsed = Date.now() - lastProgressNotifyAt;
  if (elapsed >= PROGRESS_THROTTLE_MS) {
    flushProgress();
    return;
  }
  if (pendingProgressTimer === null) {
    pendingProgressTimer = setTimeout((): void => {
      pendingProgressTimer = null;
      flushProgress();
    }, PROGRESS_THROTTLE_MS - elapsed);
  }
}

function updateProgress(updates: Partial<ModelLoadProgress>): void {
  const stageChanged = updates.stage !== undefined && updates.stage !== modelProgress.stage;
  modelProgress = { ...modelProgress, ...updates };
  scheduleProgressNotify(
    stageChanged || modelProgress.stage === 'ready' || modelProgress.stage === 'error'
  );
}

function updateState(updates: Partial<LocalVoiceState>): void {
  state = { ...state, ...updates };
  notifyStateChange();
}

function persistConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_VOICE_STORAGE_KEY, JSON.stringify(config));
  }
}

function patchConfig(updates: Partial<LocalVoiceConfig>, persist: boolean): void {
  config = { ...config, ...updates };
  if (persist) persistConfig();
  notifyStateChange();
}

function yieldToMain(ms: number = 0): Promise<void> {
  return new Promise((resolve: () => void) => {
    if (ms > 0) {
      setTimeout(resolve, ms);
      return;
    }
    const sched = (globalThis as unknown as { scheduler?: { yield?: () => Promise<void> } })
      .scheduler;
    if (sched?.yield) {
      sched.yield().then(resolve, (): void => {
        setTimeout(resolve, 0);
      });
      return;
    }
    setTimeout(resolve, 0);
  });
}

function readHeap(): HeapMeasurement | undefined {
  if (typeof performance === 'undefined') return undefined;
  const mem = (performance as unknown as { memory?: HeapMeasurement }).memory;
  if (!mem || mem.jsHeapSizeLimit <= 0) return undefined;
  return mem;
}

function readDeviceMemoryGb(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  return typeof deviceMemory === 'number' && deviceMemory > 0 ? deviceMemory : undefined;
}

function inferenceDevice(): InferenceDevice {
  return pickInferenceDevice(state.webGpuAvailable, readDeviceMemoryGb());
}

/** Installed phone voices avoid synthesis delays and a second resident neural model. */
function preferNativeMobileSpeech(): boolean {
  if (typeof navigator === 'undefined' || !webSpeechSynth) return false;
  const mobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return (
    mobile &&
    webSpeechSynth.getVoices().some((voice) => voice.localService && voice.lang.startsWith('en'))
  );
}

function markModelsCached(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MODEL_CACHE_KEY, 'cached');
  } catch {
    /* ignore quota */
  }
}

function restoreReadyFromLoadedModels(): void {
  updateState({
    isLoading: false,
    error: null,
    sttReady: whisperPipeline !== null,
    ttsReady: kokoroInstance !== null || webSpeechSynth !== null,
    fallbackTTS: kokoroInstance ? null : webSpeechSynth ? 'web-speech' : null,
  });
  updateProgress({
    stage: 'ready',
    progress: 100,
    currentModel: null,
    message: kokoroInstance ? 'Two-way audio ready' : 'Two-way audio ready (browser speech)',
  });
}

/**
 * Initialize the local voice system (check availability, don't load models yet)
 */
export async function initLocalVoice(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (initPromise) return initPromise;

  initPromise = (async (): Promise<void> => {
    loadLocalVoiceConfig();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && isLocalVoiceCapturing()) cancelListening();
    });
    window.addEventListener('pagehide', () => {
      if (isLocalVoiceCapturing()) cancelListening();
    });

    const webGpuAvailable = await checkWebGPU();
    updateState({ webGpuAvailable });

    if ('speechSynthesis' in window) {
      webSpeechSynth = window.speechSynthesis;
    }

    updateState({ isAvailable: true });
  })();

  try {
    await initPromise;
  } catch (error) {
    initPromise = null;
    throw error;
  }
}

/**
 * Enable local voice mode - triggers model download
 */
export async function enableLocalVoice(): Promise<boolean> {
  if (enableInFlight) return false;
  enableInFlight = true;

  try {
    await initLocalVoice();

    if (
      shouldReuseInMemoryModels({
        whisperLoaded: whisperPipeline !== null,
        kokoroLoaded: kokoroInstance !== null,
      })
    ) {
      saveLocalVoiceConfig({ enabled: true });
      restoreReadyFromLoadedModels();
      return true;
    }

    updateState({ isLoading: true, error: null });
    patchConfig({ enabled: true }, false);
    updateProgress({
      stage: 'downloading',
      progress: 0,
      currentModel: 'whisper',
      message: `Preparing two-way audio… (~${getEstimatedDownloadSize()} MB, one-time)`,
    });

    downloadSession = createModelDownloadSession(window);
    await loadModels();
    downloadSession.assertActive();

    const ttsReady = kokoroInstance !== null || webSpeechSynth !== null;
    if (!whisperPipeline && !ttsReady) {
      throw new Error('Failed to load voice models');
    }

    saveLocalVoiceConfig({ enabled: true });
    markModelsCached();
    updateState({
      isLoading: false,
      sttReady: whisperPipeline !== null,
      ttsReady,
    });

    return true;
  } catch (error) {
    if (downloadSession?.signal.aborted) {
      patchConfig({ enabled: false }, true);
      updateState({ isLoading: false, sttReady: false, ttsReady: false, error: null });
      updateProgress({
        stage: 'idle',
        progress: 0,
        currentModel: null,
        message: 'Setup cancelled',
      });
      return false;
    }
    const errorMessage = isMemoryError(error)
      ? 'Voice setup ran out of memory. Close other tabs and try again.'
      : error instanceof Error
        ? error.message
        : 'Failed to load voice models';
    patchConfig({ enabled: false }, true);
    updateState({ isLoading: false, error: errorMessage });
    updateProgress({ stage: 'error', error: errorMessage, message: errorMessage });
    return false;
  } finally {
    downloadSession?.restore();
    downloadSession = null;
    enableInFlight = false;
  }
}

/**
 * Disable local voice mode
 */
export function disableLocalVoice(): void {
  const cancelling = downloadSession !== null && enableInFlight;
  downloadSession?.cancel();
  if (cancelling) {
    updateProgress({
      stage: 'loading',
      progress: 0,
      currentModel: null,
      message: 'Cancelling model setup…',
    });
  }
  saveLocalVoiceConfig({ enabled: false });
  cancelListening();
  stopSpeaking();
  updateState({
    isLoading: cancelling,
    sttReady: false,
    ttsReady: false,
    isListening: false,
    isSpeaking: false,
  });
}

/**
 * Toggle local voice mode
 */
export async function toggleLocalVoice(): Promise<boolean> {
  if (config.enabled) {
    disableLocalVoice();
    return false;
  } else {
    return enableLocalVoice();
  }
}

/**
 * Load Whisper and Kokoro models sequentially.
 * Concurrent load would overlap two ONNX heaps; we yield between them so GC can run.
 */
async function loadModels(): Promise<void> {
  downloadSession?.assertActive();
  const totalSize = getEstimatedDownloadSize();

  updateProgress({
    stage: 'downloading',
    progress: 0,
    currentModel: 'whisper',
    message: `Preparing two-way audio… (~${totalSize} MB, one-time)`,
  });

  const whisper = await loadWhisperModel();
  downloadSession?.assertActive();
  updateState({ sttReady: whisperPipeline !== null });

  await yieldToMain(INTER_MODEL_YIELD_MS);
  downloadSession?.assertActive();

  const skipKokoro = shouldSkipKokoro({
    whisperMemoryError: whisper.memoryError,
    heapUnderPressure: isHeapUnderPressure(readHeap()),
    deviceMemoryGb: readDeviceMemoryGb(),
    nativeSpeechAvailable: webSpeechSynth !== null,
    preferNativeSpeech: preferNativeMobileSpeech(),
  });

  if (skipKokoro) {
    applyWebSpeechFallback();
    updateProgress({
      stage: 'ready',
      progress: 100,
      currentModel: null,
      message: 'Two-way audio ready (browser speech)',
    });
    return;
  }

  updateProgress({
    progress: 60,
    currentModel: 'kokoro',
    message: 'Preparing two-way audio…',
  });

  await loadKokoroModel();
  downloadSession?.assertActive();

  updateProgress({
    stage: 'ready',
    progress: 100,
    currentModel: null,
    message: kokoroInstance ? 'Two-way audio ready' : 'Two-way audio ready (browser speech)',
  });
}

function applyWebSpeechFallback(): void {
  kokoroInstance = null;
  if (webSpeechSynth) {
    updateState({ fallbackTTS: 'web-speech' });
  }
}

function loadCdnModule<T>(opts: {
  eventName: string;
  source: string;
  read: () => T | undefined;
  missingError: string;
  loadError: string;
}): Promise<T> {
  const existing = opts.read();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, value?: T): void => {
      if (settled) return;
      settled = true;
      window.removeEventListener(opts.eventName, onEvent);
      window.clearTimeout(timer);
      if (error) reject(error);
      else resolve(value as T);
    };

    const onEvent = (): void => {
      const value = opts.read();
      if (value) finish(undefined, value);
      else finish(new Error(opts.missingError));
    };

    const timer = window.setTimeout(() => finish(new Error(opts.loadError)), CDN_SCRIPT_TIMEOUT_MS);

    window.addEventListener(opts.eventName, onEvent);
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = opts.source;
    script.onerror = (): void => {
      finish(new Error(opts.loadError));
    };
    document.head.appendChild(script);
  });
}

/**
 * Load Transformers.js from CDN at runtime
 * This avoids build-time processing of the library
 */
async function loadTransformersFromCDN(): Promise<{
  pipeline: unknown;
  env: { useBrowserCache?: boolean; allowLocalModels?: boolean };
}> {
  if (!transformersLoadPromise) {
    transformersLoadPromise = loadCdnModule({
      eventName: 'transformers-loaded',
      source: `
      import * as transformers from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';
      window.transformers = transformers;
      window.dispatchEvent(new Event('transformers-loaded'));
    `,
      read: () =>
        (window as unknown as { transformers?: { pipeline: unknown; env: unknown } })
          .transformers as
          | { pipeline: unknown; env: { useBrowserCache?: boolean; allowLocalModels?: boolean } }
          | undefined,
      missingError: 'Transformers.js failed to load',
      loadError: 'Failed to load Transformers.js from CDN',
    });
    transformersLoadPromise = transformersLoadPromise.catch((error: unknown) => {
      transformersLoadPromise = null;
      throw error;
    });
  }
  return transformersLoadPromise;
}

/**
 * Load Whisper Base model via Transformers.js
 * Uses CDN-based loading to avoid build-time issues
 */
async function loadWhisperModel(): Promise<{ memoryError: boolean }> {
  try {
    updateProgress({
      stage: 'downloading',
      currentModel: 'whisper',
      message: 'Preparing two-way audio…',
      progress: 10,
    });

    const { pipeline, env } = await loadTransformersFromCDN();
    await yieldToMain();
    downloadSession?.assertActive();

    if (env) {
      env.useBrowserCache = true;
      env.allowLocalModels = false;
    }

    const device = inferenceDevice();

    updateProgress({
      progress: 20,
      message: `Preparing two-way audio… (${device.toUpperCase()})`,
    });

    const pipelineFn = pipeline as (
      task: string,
      model: string,
      options?: object
    ) => Promise<unknown>;

    whisperPipeline = await pipelineFn(
      'automatic-speech-recognition',
      'onnx-community/whisper-base',
      {
        device,
        dtype: getWhisperDtype(device),
        progress_callback: (progress: { progress?: number; status?: string }) => {
          if (downloadSession?.signal.aborted) return;
          if (progress.progress !== undefined) {
            const pct = Math.min(55, 20 + progress.progress * 0.35);
            updateProgress({ progress: pct });
          }
        },
      }
    );

    updateProgress({ progress: 55, message: 'Preparing two-way audio…' });
    return { memoryError: false };
  } catch (error) {
    console.warn('Failed to load Whisper model:', error);
    downloadSession?.assertActive();
    whisperPipeline = null;
    return { memoryError: isMemoryError(error) };
  }
}

/**
 * Load Kokoro TTS from CDN at runtime
 */
async function loadKokoroFromCDN(): Promise<{
  KokoroTTS: {
    from_pretrained: (model: string, options?: object) => Promise<unknown>;
  };
}> {
  if (!kokoroLoadPromise) {
    kokoroLoadPromise = loadCdnModule({
      eventName: 'kokoro-loaded',
      source: `
      import { KokoroTTS } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm';
      window.KokoroTTS = KokoroTTS;
      window.dispatchEvent(new Event('kokoro-loaded'));
    `,
      read: () => {
        const k = (
          window as unknown as {
            KokoroTTS?: { from_pretrained: (model: string, options?: object) => Promise<unknown> };
          }
        ).KokoroTTS;
        return k ? { KokoroTTS: k } : undefined;
      },
      missingError: 'Kokoro TTS failed to load',
      loadError: 'Failed to load Kokoro from CDN',
    });
    kokoroLoadPromise = kokoroLoadPromise.catch((error: unknown) => {
      kokoroLoadPromise = null;
      throw error;
    });
  }
  return kokoroLoadPromise;
}

/**
 * Load Kokoro TTS model (with Web Speech fallback)
 * Uses CDN-based loading to avoid build-time issues
 */
async function loadKokoroModel(): Promise<void> {
  try {
    updateProgress({
      progress: 60,
      currentModel: 'kokoro',
      message: 'Preparing two-way audio…',
    });

    const { KokoroTTS } = await loadKokoroFromCDN();
    await yieldToMain();
    downloadSession?.assertActive();

    updateProgress({
      progress: 70,
      message: 'Preparing two-way audio…',
    });

    const device = inferenceDevice();
    kokoroInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: getKokoroDtype(),
      device,
    });

    updateProgress({ progress: 95, message: 'Two-way audio ready' });
    updateState({ fallbackTTS: null });
  } catch (error) {
    console.warn('Failed to load Kokoro model, falling back to Web Speech:', error);
    downloadSession?.assertActive();
    applyWebSpeechFallback();
    if (webSpeechSynth) {
      updateProgress({ progress: 95, message: 'Two-way audio ready (browser speech)' });
    } else if (isMemoryError(error)) {
      throw error;
    }
  }
}

/** Stop capture without sending; also invalidates delayed permission and recognition results. */
export function cancelListening(): void {
  recordingGeneration += 1;
  recordingSendGeneration = null;
  recordingHasSpeech = () => false;
  clearRecordingMonitor?.();
  clearRecordingMonitor = null;
  const recorder = mediaRecorder;
  mediaRecorder = null;
  if (recorder?.state === 'recording') recorder.stop();
  micStream?.getTracks().forEach((track) => track.stop());
  micStream = null;
  updateState({ isStarting: false, isListening: false, isTranscribing: false });
}

export function isLocalVoiceCapturing(): boolean {
  return state.isStarting || state.isListening || state.isTranscribing;
}

/** User-initiated microphone capture. A completed spoken turn is sent after a brief pause. */
export async function startListening(contextId?: string, ongoing = false): Promise<boolean> {
  if (conversationActive && !ongoing) return false;
  if (!config.enabled || !config.sttEnabled || !state.sttReady || isLocalVoiceCapturing())
    return false;
  const generation = ++recordingGeneration;
  updateState({ isStarting: true, error: null });
  stopSpeaking();
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        deviceId: config.micDeviceId || undefined,
      },
    });
    if (generation !== recordingGeneration || !config.enabled) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }
    micStream = stream;
    // Keep the capture graph at the device rate. Firefox cannot connect a
    // microphone stream to a context with a different sample rate; recorded
    // audio is resampled to Whisper's 16 kHz only after decoding below.
    if (!audioContext || audioContext.state === 'closed') audioContext = new AudioContext();
    await audioContext.resume();
    if (generation !== recordingGeneration) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }
    if (audioContext.state !== 'running') throw new Error('Audio input could not start.');
    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((type) =>
      MediaRecorder.isTypeSupported(type)
    );
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const endpoint = createVoiceEndpoint(performance.now());
    recordingHasSpeech = endpoint.hasSpeech;
    const hidden = (): void => {
      if (document.hidden) cancelListening();
    };
    const leaving = (): void => cancelListening();
    const interval = setInterval(() => {
      if (generation !== recordingGeneration) return;
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(
        samples.reduce((sum, value) => sum + value * value, 0) / samples.length
      );
      const result = endpoint(performance.now(), rms);
      if (result === 'send') void stopListening();
      else if (result === 'no-speech' || result === 'too-long') {
        cancelListening();
        // Ongoing mode silently rotates idle captures, bounding recorded bytes without another tap.
        if (ongoing && result === 'no-speech') return;
        updateState({
          error:
            result === 'no-speech'
              ? 'No clear speech was heard. Nothing was sent. Tap Speak a response to try again.'
              : 'The response reached one minute without a pause. Nothing was sent. Try a shorter response.',
        });
      }
    }, 50);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', leaving);
    clearRecordingMonitor = (): void => {
      clearInterval(interval);
      source.disconnect();
      analyser.disconnect();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', leaving);
    };
    recorder.ondataavailable = (event): void => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = (): void => {
      if (generation !== recordingGeneration) return;
      cancelListening();
      updateState({ error: 'Audio capture failed. Nothing was sent. You can type your response.' });
    };
    recorder.onstop = (): void => {
      stream!.getTracks().forEach((track) => track.stop());
      if (generation !== recordingGeneration) return;
      if (recordingSendGeneration !== generation) {
        cancelListening();
        updateState({
          error:
            'The microphone stopped before the response finished. Nothing was sent. Try again or type your response.',
        });
        return;
      }
      clearRecordingMonitor?.();
      clearRecordingMonitor = null;
      mediaRecorder = null;
      micStream = null;
      updateState({ isStarting: false, isListening: false, isTranscribing: true });
      void processRecording(chunks, recorder.mimeType, generation, contextId);
    };
    mediaRecorder = recorder;
    recorder.start(100);
    updateState({ isStarting: false, isListening: true });
    return true;
  } catch {
    stream?.getTracks().forEach((track) => track.stop());
    if (generation === recordingGeneration) {
      cancelListening();
      updateState({
        error:
          'Microphone access or audio capture was unavailable. Nothing was sent. You can type your response.',
      });
    }
    return false;
  }
}

/** Explicit finish uses the same one-shot send path as end-of-speech detection. */
export async function stopListening(): Promise<void> {
  const recorder = mediaRecorder;
  if (!recorder || recorder.state !== 'recording') return;
  if (!recordingHasSpeech()) {
    cancelListening();
    updateState({ error: 'No clear speech was heard. Nothing was sent. Try speaking again.' });
    return;
  }
  clearRecordingMonitor?.();
  clearRecordingMonitor = null;
  updateState({ isListening: false, isTranscribing: true });
  recordingSendGeneration = recordingGeneration;
  recorder.stop();
  micStream?.getTracks().forEach((track) => track.stop());
  micStream = null;
}

async function processRecording(
  chunks: Blob[],
  mimeType: string,
  generation: number,
  contextId?: string
): Promise<void> {
  try {
    if (!chunks.length || !whisperPipeline || !audioContext)
      throw new Error('No recorded response.');
    const blob = new Blob(chunks, { type: mimeType });
    const buffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    if (generation !== recordingGeneration) return;
    const audio = trimSpeechSamples(
      resampleAudio(buffer.getChannelData(0), buffer.sampleRate, 16000)
    );
    const startedAt = performance.now();
    const previous = transcriptionTail;
    let release!: () => void;
    transcriptionTail = new Promise<void>((resolve) => {
      release = resolve;
    });
    let text = '';
    try {
      await previous;
      if (generation !== recordingGeneration) return;
      if (audio.length) {
        const result = await (
          whisperPipeline as (audio: Float32Array, options?: object) => Promise<{ text?: string }>
        )(audio, WHISPER_TRANSCRIBE_OPTIONS);
        text = exactTranscript(result?.text);
      }
    } finally {
      release();
    }
    if (generation !== recordingGeneration || !config.enabled) return;
    if (text.length > 2000) {
      updateState({
        error:
          'The spoken response exceeds 2,000 characters. Nothing was sent. Try a shorter response.',
      });
      return;
    }
    if (!text && !conversationActive) {
      updateState({
        error:
          'The response could not be understood. Nothing was sent. Try again or type your response.',
      });
      return;
    }
    notifyTranscription({
      turnId: generation,
      contextId,
      text,
      duration: (performance.now() - startedAt) / 1000,
    });
  } catch {
    if (generation === recordingGeneration) {
      if (conversationActive) {
        notifyTranscription({ turnId: generation, contextId, text: '' });
      } else {
        updateState({
          error:
            'The response could not be understood. Nothing was sent. Try again or type your response.',
        });
      }
    }
  } finally {
    if (generation === recordingGeneration) updateState({ isTranscribing: false });
  }
}

/**
 * Resample audio to target sample rate
 */
function resampleAudio(
  audioData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array {
  if (fromSampleRate === toSampleRate) return audioData;

  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
    const t = srcIndex - srcIndexFloor;
    result[i] = audioData[srcIndexFloor] * (1 - t) + audioData[srcIndexCeil] * t;
  }

  return result;
}

/**
 * Speak text using Kokoro or Web Speech fallback
 */
export async function speak(text: string, priority: number = 5): Promise<void> {
  if (!config.enabled || !config.ttsEnabled || isLocalVoiceCapturing() || conversationActive)
    return;
  if (!state.ttsReady) return;

  // Add to queue
  ttsQueue.push({ text, priority, timestamp: Date.now() });

  // Process queue
  await processTTSQueue();
}

/**
 * Process TTS queue (yields to ElevenLabs VO)
 */
async function processTTSQueue(): Promise<void> {
  if (isProcessingTTS || ttsQueue.length === 0 || isLocalVoiceCapturing()) return;

  // Check if ElevenLabs is playing - yield to it
  if (isElevenLabsPlaying && isElevenLabsPlaying()) {
    // Retry after a delay
    setTimeout(() => processTTSQueue(), 500);
    return;
  }

  isProcessingTTS = true;
  const queueEpoch = voiceOutputEpoch;

  // Sort by priority (higher first), then by timestamp
  ttsQueue.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.timestamp - b.timestamp;
  });

  const item = ttsQueue.shift();
  if (!item) {
    isProcessingTTS = false;
    return;
  }

  try {
    updateState({ isSpeaking: true });

    let yieldedToElevenLabs = false;
    if (kokoroInstance) {
      yieldedToElevenLabs = !(await speakWithKokoro(item.text));
    } else if (webSpeechSynth) {
      yieldedToElevenLabs = !(await speakWithWebSpeech(item.text));
    }

    if (yieldedToElevenLabs) {
      ttsQueue.unshift(item);
    }
  } catch (error) {
    console.error('TTS error:', error);
  } finally {
    if (queueEpoch === voiceOutputEpoch) {
      updateState({ isSpeaking: false });
      isProcessingTTS = false;
      if (ttsQueue.length > 0) setTimeout(() => processTTSQueue(), 100);
    }
  }
}

/**
 * Speak using Kokoro TTS.
 * @returns false when ElevenLabs took the net during synthesis (caller should requeue).
 */
async function speakWithKokoro(text: string): Promise<boolean> {
  if (!kokoroInstance) return true;

  const kokoro = kokoroInstance as {
    generate: (
      text: string,
      options?: { voice?: string }
    ) => Promise<{ toBlob: () => Promise<Blob> }>;
  };

  const epoch = voiceOutputEpoch;
  const result = await kokoro.generate(text, {
    voice: config.ttsVoice,
  });

  // Scripted VO may have started while Kokoro was synthesizing — don't double-talk.
  if (isElevenLabsPlaying?.()) {
    return false;
  }

  const blob = await result.toBlob();
  if (epoch !== voiceOutputEpoch || isLocalVoiceCapturing()) return true;
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    currentTTSAudio = audio;
    audio.playbackRate = config.ttsRate;
    let settled = false;

    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      if (settleCurrentSpeech === cancel) settleCurrentSpeech = null;
      clearYieldWatch();
      audio.pause();
      if (currentTTSAudio === audio) currentTTSAudio = null;
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve();
    };
    const cancel = (): void => finish();
    settleCurrentSpeech = cancel;

    const clearYieldWatch = watchElevenLabsYield((): void => {
      audio.src = '';
      finish();
    });

    audio.onended = (): void => {
      finish();
    };
    audio.onerror = (): void => {
      finish(new Error('Audio playback failed'));
    };
    audio
      .play()
      .catch((err) => finish(err instanceof Error ? err : new Error('Audio playback failed')));
  });

  return true;
}

/**
 * Speak using Web Speech API (fallback).
 * @returns false when ElevenLabs took the net before utterance start.
 */
async function speakWithWebSpeech(text: string): Promise<boolean> {
  if (!webSpeechSynth) return true;

  if (isElevenLabsPlaying?.()) {
    return false;
  }

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.ttsRate;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Try to find an English voice
    const voices = webSpeechSynth!.getVoices();
    const englishVoice =
      voices.find(
        (v) => v.localService && v.lang.startsWith('en') && v.lang === navigator.language
      ) ??
      voices.find((v) => v.localService && v.lang.startsWith('en-')) ??
      voices.find((v) => v.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    let settled = false;
    const finish = (error?: SpeechSynthesisErrorEvent): void => {
      if (settled) return;
      settled = true;
      if (settleCurrentSpeech === cancel) settleCurrentSpeech = null;
      clearYieldWatch();
      if (error) reject(error);
      else resolve();
    };
    const cancel = (): void => finish();
    settleCurrentSpeech = cancel;

    const clearYieldWatch = watchElevenLabsYield((): void => {
      webSpeechSynth?.cancel();
      finish();
    });

    utterance.onend = (): void => {
      finish();
    };
    utterance.onerror = (e): void => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        finish();
        return;
      }
      finish(e);
    };

    webSpeechSynth!.speak(utterance);
  });

  return true;
}

/**
 * Stop speaking
 */
export function stopSpeaking(): void {
  voiceOutputEpoch += 1;
  ttsQueue = [];
  isProcessingTTS = false;
  settleCurrentSpeech?.();
  settleCurrentSpeech = null;

  if (currentTTSAudio) {
    currentTTSAudio.pause();
    currentTTSAudio.src = '';
    currentTTSAudio = null;
  }

  if (webSpeechSynth) {
    webSpeechSynth.cancel();
  }

  updateState({ isSpeaking: false });
}

/** A conversational reply resolves only after playback finishes or is explicitly stopped. */
export async function speakConversation(text: string): Promise<void> {
  if (!config.enabled || !config.ttsEnabled || !state.ttsReady)
    throw new Error('Spoken playback is unavailable.');
  stopSpeaking();
  const epoch = voiceOutputEpoch;
  updateState({ isSpeaking: true });
  try {
    if (kokoroInstance) await speakWithKokoro(text);
    else if (webSpeechSynth) await speakWithWebSpeech(text);
    else throw new Error('Spoken playback is unavailable.');
  } finally {
    if (epoch === voiceOutputEpoch) updateState({ isSpeaking: false });
  }
}

function watchElevenLabsYield(onYield: () => void): () => void {
  if (!isElevenLabsPlaying) return (): void => undefined;
  const id = window.setInterval((): void => {
    if (isElevenLabsPlaying?.()) {
      window.clearInterval(id);
      onYield();
    }
  }, 200);
  return (): void => {
    window.clearInterval(id);
  };
}

/**
 * Read aloud an inject summary
 */
export async function readInjectSummary(title: string, description: string): Promise<void> {
  const text = `${title}. ${description}`;
  await speak(text, 7);
}

/**
 * Read aloud a decision prompt
 */
export async function readDecisionPrompt(prompt: string): Promise<void> {
  await speak(prompt, 8);
}

/**
 * Read aloud AAR bullet points
 */
export async function readAARBullets(bullets: string[]): Promise<void> {
  const text = bullets.join('. ');
  await speak(text, 5);
}

/**
 * Get estimated download size for models
 */
export function getEstimatedDownloadSize(): number {
  const nativeSpeech = shouldSkipKokoro({
    whisperMemoryError: false,
    heapUnderPressure: false,
    deviceMemoryGb: readDeviceMemoryGb(),
    nativeSpeechAvailable: webSpeechSynth !== null,
    preferNativeSpeech: preferNativeMobileSpeech(),
  });
  return WHISPER_MODEL_SIZE_MB + (nativeSpeech ? 0 : KOKORO_MODEL_SIZE_MB);
}

/**
 * Check if models are cached
 */
export async function areModelsCached(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // Check IndexedDB for cached models
    const cacheStatus = localStorage.getItem(MODEL_CACHE_KEY);
    return cacheStatus === 'cached';
  } catch {
    return false;
  }
}

/**
 * Cleanup resources
 */
export function cleanupLocalVoice(): void {
  cancelListening();
  stopSpeaking();

  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  if (voiceWorker) {
    voiceWorker.terminate();
    voiceWorker = null;
  }

  whisperPipeline = null;
  kokoroInstance = null;

  updateState({
    isListening: false,
    isSpeaking: false,
    sttReady: false,
    ttsReady: false,
  });
}

/**
 * Available Kokoro voices
 */
export const KOKORO_VOICES = [
  { id: 'af_heart', name: 'Heart (Female)', lang: 'en-US' },
  { id: 'af_bella', name: 'Bella (Female)', lang: 'en-US' },
  { id: 'af_nicole', name: 'Nicole (Female)', lang: 'en-US' },
  { id: 'af_sarah', name: 'Sarah (Female)', lang: 'en-US' },
  { id: 'af_sky', name: 'Sky (Female)', lang: 'en-US' },
  { id: 'am_adam', name: 'Adam (Male)', lang: 'en-US' },
  { id: 'am_michael', name: 'Michael (Male)', lang: 'en-US' },
  { id: 'bf_emma', name: 'Emma (Female, British)', lang: 'en-GB' },
  { id: 'bf_isabella', name: 'Isabella (Female, British)', lang: 'en-GB' },
  { id: 'bm_george', name: 'George (Male, British)', lang: 'en-GB' },
  { id: 'bm_lewis', name: 'Lewis (Male, British)', lang: 'en-GB' },
];
