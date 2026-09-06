'use client';

/**
 * Local comms / headset path for Hourglass Command
 *
 * On-device radio: Whisper Base (STT) + Kokoro-82M (TTS).
 * Models lazy-load only when the operator enables headset (~230MB, one-time).
 * Yields to ElevenLabs scripted VO whenever that path is playing.
 */

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
  text: string;
  confidence?: number;
  duration?: number;
}

export interface LocalVoiceState {
  isAvailable: boolean;
  isLoading: boolean;
  isListening: boolean;
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

// Worker and model references
let voiceWorker: Worker | null = null;
let whisperPipeline: unknown = null;
let kokoroInstance: unknown = null;
let webSpeechSynth: SpeechSynthesis | null = null;

// Audio context and media recorder
let audioContext: AudioContext | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
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
  config = { ...config, ...newConfig };
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_VOICE_STORAGE_KEY, JSON.stringify(config));
  }
  notifyStateChange();
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
 * Headset earpiece is ready to speak dynamic lines (injects, decisions, micro-tasks).
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

function updateProgress(updates: Partial<ModelLoadProgress>): void {
  modelProgress = { ...modelProgress, ...updates };
  notifyProgress();
}

function updateState(updates: Partial<LocalVoiceState>): void {
  state = { ...state, ...updates };
  notifyStateChange();
}

/**
 * Initialize the local voice system (check availability, don't load models yet)
 */
export async function initLocalVoice(): Promise<void> {
  if (typeof window === 'undefined') return;

  loadLocalVoiceConfig();

  // Check WebGPU availability
  const webGpuAvailable = await checkWebGPU();
  updateState({ webGpuAvailable });

  // Check Web Speech API availability (fallback TTS)
  if ('speechSynthesis' in window) {
    webSpeechSynth = window.speechSynthesis;
  }

  // System is available (models load on-demand when enabled)
  updateState({ isAvailable: true });
}

/**
 * Enable local voice mode - triggers model download
 */
export async function enableLocalVoice(): Promise<boolean> {
  if (!state.isAvailable || state.isLoading) return false;

  updateState({ isLoading: true, error: null });
  saveLocalVoiceConfig({ enabled: true });

  try {
    // Load models
    await loadModels();

    updateState({
      isLoading: false,
      sttReady: whisperPipeline !== null,
      ttsReady: kokoroInstance !== null || webSpeechSynth !== null,
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load voice models';
    updateState({ isLoading: false, error: errorMessage });
    updateProgress({ stage: 'error', error: errorMessage });
    return false;
  }
}

/**
 * Disable local voice mode
 */
export function disableLocalVoice(): void {
  saveLocalVoiceConfig({ enabled: false });
  stopListening();
  stopSpeaking();
  updateState({
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
 * Load Whisper and Kokoro models
 */
async function loadModels(): Promise<void> {
  const totalSize = WHISPER_MODEL_SIZE_MB + KOKORO_MODEL_SIZE_MB;

  updateProgress({
    stage: 'downloading',
    progress: 0,
    currentModel: 'whisper',
    message: `Provisioning headset models… (~${totalSize} MB, one-time)`,
  });

  // Load Whisper Base for STT
  await loadWhisperModel();

  updateProgress({
    progress: 60,
    currentModel: 'kokoro',
    message: 'Provisioning headset models…',
  });

  // Load Kokoro for TTS (with fallback)
  await loadKokoroModel();

  updateProgress({
    stage: 'ready',
    progress: 100,
    currentModel: null,
    message: 'Headset online',
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
  // Load script from CDN
  return new Promise((resolve, reject) => {
    if ((window as unknown as { transformers?: unknown }).transformers) {
      resolve(
        (window as unknown as { transformers: { pipeline: unknown; env: unknown } })
          .transformers as {
          pipeline: unknown;
          env: { useBrowserCache?: boolean; allowLocalModels?: boolean };
        }
      );
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import * as transformers from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';
      window.transformers = transformers;
      window.dispatchEvent(new Event('transformers-loaded'));
    `;

    const handleLoad = (): void => {
      window.removeEventListener('transformers-loaded', handleLoad);
      const t = (window as unknown as { transformers?: { pipeline: unknown; env: unknown } })
        .transformers;
      if (t) {
        resolve(
          t as { pipeline: unknown; env: { useBrowserCache?: boolean; allowLocalModels?: boolean } }
        );
      } else {
        reject(new Error('Transformers.js failed to load'));
      }
    };

    window.addEventListener('transformers-loaded', handleLoad);
    script.onerror = () => reject(new Error('Failed to load Transformers.js from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Load Whisper Base model via Transformers.js
 * Uses CDN-based loading to avoid build-time issues
 */
async function loadWhisperModel(): Promise<void> {
  try {
    updateProgress({
      stage: 'downloading',
      currentModel: 'whisper',
      message: 'Provisioning headset models…',
      progress: 10,
    });

    const { pipeline, env } = await loadTransformersFromCDN();

    // Configure for browser use with caching
    if (env) {
      env.useBrowserCache = true;
      env.allowLocalModels = false;
    }

    // Prefer WebGPU, fall back to WASM
    const device = state.webGpuAvailable ? 'webgpu' : 'wasm';

    updateProgress({
      progress: 20,
      message: `Provisioning headset models… (${device.toUpperCase()})`,
    });

    // Load Whisper Base with hybrid quantization for better performance
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
        dtype: {
          encoder_model: 'fp32',
          decoder_model_merged: 'q4', // Quantized decoder for speed
        },
        progress_callback: (progress: { progress?: number; status?: string }) => {
          if (progress.progress !== undefined) {
            const pct = Math.min(55, 20 + progress.progress * 0.35);
            updateProgress({ progress: pct });
          }
        },
      }
    );

    updateProgress({ progress: 55, message: 'Provisioning headset models…' });
  } catch (error) {
    console.warn('Failed to load Whisper model:', error);
    whisperPipeline = null;
    // Don't throw - STT is optional, user can still use TTS
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
  return new Promise((resolve, reject) => {
    if ((window as unknown as { KokoroTTS?: unknown }).KokoroTTS) {
      resolve({
        KokoroTTS: (
          window as unknown as {
            KokoroTTS: { from_pretrained: (model: string, options?: object) => Promise<unknown> };
          }
        ).KokoroTTS,
      });
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { KokoroTTS } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm';
      window.KokoroTTS = KokoroTTS;
      window.dispatchEvent(new Event('kokoro-loaded'));
    `;

    const handleLoad = (): void => {
      window.removeEventListener('kokoro-loaded', handleLoad);
      const k = (
        window as unknown as {
          KokoroTTS?: { from_pretrained: (model: string, options?: object) => Promise<unknown> };
        }
      ).KokoroTTS;
      if (k) {
        resolve({ KokoroTTS: k });
      } else {
        reject(new Error('Kokoro TTS failed to load'));
      }
    };

    window.addEventListener('kokoro-loaded', handleLoad);
    script.onerror = () => reject(new Error('Failed to load Kokoro from CDN'));
    document.head.appendChild(script);
  });
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
      message: 'Provisioning headset models…',
    });

    const { KokoroTTS } = await loadKokoroFromCDN();

    updateProgress({
      progress: 70,
      message: 'Provisioning headset models…',
    });

    // Initialize Kokoro with WebGPU if available
    kokoroInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: state.webGpuAvailable ? 'fp32' : 'q8',
      device: state.webGpuAvailable ? 'webgpu' : 'wasm',
    });

    updateProgress({ progress: 95, message: 'Headset online' });
    updateState({ fallbackTTS: null });
  } catch (error) {
    console.warn('Failed to load Kokoro model, falling back to Web Speech:', error);
    kokoroInstance = null;

    // Set up Web Speech fallback
    if (webSpeechSynth) {
      updateState({ fallbackTTS: 'web-speech' });
      updateProgress({ progress: 95, message: 'Headset online (browser speech)' });
    } else {
      console.warn('Web Speech API not available');
    }
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        deviceId: config.micDeviceId || undefined,
      },
    });

    micStream = stream;

    // Initialize audio context
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 16000 });
    }

    return true;
  } catch (error) {
    console.warn('Microphone permission denied:', error);
    updateState({ error: 'Microphone access denied' });
    return false;
  }
}

/**
 * Start listening (push-to-talk)
 */
export async function startListening(): Promise<boolean> {
  if (!state.sttReady || state.isListening) return false;

  // Request mic if not already granted
  if (!micStream) {
    const granted = await requestMicrophonePermission();
    if (!granted) return false;
  }

  try {
    audioChunks = [];

    mediaRecorder = new MediaRecorder(micStream!, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      await processRecording();
    };

    mediaRecorder.start(100); // Collect data every 100ms
    updateState({ isListening: true });
    return true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    updateState({ error: 'Failed to start recording' });
    return false;
  }
}

/**
 * Stop listening and transcribe
 */
export async function stopListening(): Promise<void> {
  if (!mediaRecorder || !state.isListening) return;

  mediaRecorder.stop();
  updateState({ isListening: false });
}

/**
 * Process recorded audio and transcribe
 */
async function processRecording(): Promise<void> {
  if (audioChunks.length === 0 || !whisperPipeline) return;

  try {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

    // Convert to AudioBuffer for Whisper
    const arrayBuffer = await audioBlob.arrayBuffer();

    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 16000 });
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get mono audio data (Whisper expects mono)
    const audioData = audioBuffer.getChannelData(0);

    // Convert to Float32Array at 16kHz
    const audio = resampleAudio(audioData, audioBuffer.sampleRate, 16000);

    // Run Whisper inference
    const startTime = performance.now();
    const result = await (
      whisperPipeline as (audio: Float32Array, options?: object) => Promise<{ text: string }>
    )(audio, {
      language: 'en',
      task: 'transcribe',
      return_timestamps: false,
    });

    const duration = performance.now() - startTime;

    if (result && result.text && result.text.trim()) {
      notifyTranscription({
        text: result.text.trim(),
        duration: duration / 1000,
      });
    }
  } catch (error) {
    console.error('Transcription error:', error);
    updateState({ error: 'Transcription failed' });
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
  if (!config.enabled || !config.ttsEnabled) return;
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
  if (isProcessingTTS || ttsQueue.length === 0) return;

  // Check if ElevenLabs is playing - yield to it
  if (isElevenLabsPlaying && isElevenLabsPlaying()) {
    // Retry after a delay
    setTimeout(() => processTTSQueue(), 500);
    return;
  }

  isProcessingTTS = true;

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

    if (kokoroInstance) {
      await speakWithKokoro(item.text);
    } else if (webSpeechSynth) {
      await speakWithWebSpeech(item.text);
    }
  } catch (error) {
    console.error('TTS error:', error);
  } finally {
    updateState({ isSpeaking: false });
    isProcessingTTS = false;

    // Process next item
    if (ttsQueue.length > 0) {
      setTimeout(() => processTTSQueue(), 100);
    }
  }
}

/**
 * Speak using Kokoro TTS
 */
async function speakWithKokoro(text: string): Promise<void> {
  if (!kokoroInstance) return;

  const kokoro = kokoroInstance as {
    generate: (
      text: string,
      options?: { voice?: string }
    ) => Promise<{ toBlob: () => Promise<Blob> }>;
  };

  const result = await kokoro.generate(text, {
    voice: config.ttsVoice,
  });

  const blob = await result.toBlob();
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    currentTTSAudio = audio;
    audio.playbackRate = config.ttsRate;
    let settled = false;

    const finish = (error?: Error): void => {
      if (settled) return;
      settled = true;
      clearYieldWatch();
      audio.pause();
      if (currentTTSAudio === audio) currentTTSAudio = null;
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve();
    };

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
}

/**
 * Speak using Web Speech API (fallback)
 */
async function speakWithWebSpeech(text: string): Promise<void> {
  if (!webSpeechSynth) return;

  return new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.ttsRate;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Try to find an English voice
    const voices = webSpeechSynth!.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    let settled = false;
    const finish = (error?: SpeechSynthesisErrorEvent): void => {
      if (settled) return;
      settled = true;
      clearYieldWatch();
      if (error) reject(error);
      else resolve();
    };

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
}

/**
 * Stop speaking
 */
export function stopSpeaking(): void {
  ttsQueue = [];
  isProcessingTTS = false;

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
  return WHISPER_MODEL_SIZE_MB + KOKORO_MODEL_SIZE_MB;
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
  stopListening();
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
