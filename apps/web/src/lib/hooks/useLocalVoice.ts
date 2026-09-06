'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initLocalVoice,
  enableLocalVoice,
  disableLocalVoice,
  loadLocalVoiceConfig,
  saveLocalVoiceConfig,
  getLocalVoiceState,
  getLocalVoiceConfig,
  getModelProgress,
  onProgress,
  onStateChange,
  onTranscription,
  startListening,
  stopListening,
  speak,
  stopSpeaking,
  readInjectSummary,
  readDecisionPrompt,
  readAARBullets,
  setElevenLabsPlayingChecker,
  getEstimatedDownloadSize,
  type LocalVoiceState,
  type LocalVoiceConfig,
  type ModelLoadProgress,
  type TranscriptionResult,
} from '../local-voice';

interface UseLocalVoiceReturn {
  // State
  state: LocalVoiceState;
  config: LocalVoiceConfig;
  progress: ModelLoadProgress;
  isEnabled: boolean;
  isReady: boolean;
  isListening: boolean;
  isSpeaking: boolean;

  // Model info
  estimatedDownloadMB: number;
  isDownloading: boolean;
  downloadProgress: number;

  // Actions
  enable: () => Promise<boolean>;
  disable: () => void;
  toggle: () => Promise<boolean>;

  // STT
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;

  // TTS
  speakText: (text: string, priority?: number) => Promise<void>;
  stopSpeech: () => void;
  readInject: (title: string, description: string) => Promise<void>;
  readDecision: (prompt: string) => Promise<void>;
  readAAR: (bullets: string[]) => Promise<void>;

  // Config
  setTTSEnabled: (enabled: boolean) => void;
  setSTTEnabled: (enabled: boolean) => void;
  setTTSVoice: (voice: string) => void;
  setTTSRate: (rate: number) => void;

  // Last transcription
  lastTranscription: string | null;
  clearTranscription: () => void;

  // Headset readiness (enabled + model ready + feature toggle)
  canSpeak: boolean;
  canListen: boolean;
}

export function useLocalVoice(
  elevenLabsPlayingChecker?: () => boolean,
  options?: { trackProgress?: boolean }
): UseLocalVoiceReturn {
  const trackProgress = options?.trackProgress !== false;
  const [state, setState] = useState<LocalVoiceState>(getLocalVoiceState());
  const [config, setConfig] = useState<LocalVoiceConfig>(getLocalVoiceConfig());
  const [progress, setProgress] = useState<ModelLoadProgress>(getModelProgress());
  const [lastTranscription, setLastTranscription] = useState<string | null>(null);
  const initialized = useRef(false);

  // Initialize on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadLocalVoiceConfig();
    initLocalVoice().catch(console.error);

    // Set up ElevenLabs checker if provided
    if (elevenLabsPlayingChecker) {
      setElevenLabsPlayingChecker(elevenLabsPlayingChecker);
    }

    // Do not unload models on unmount — CommandCenter and the settings panel both
    // subscribe; tearing down here would drop a live headset when the panel closes.
  }, [elevenLabsPlayingChecker]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubState = onStateChange((s: LocalVoiceState) => setState(s));
    const unsubTranscription = onTranscription((result: TranscriptionResult) => {
      setLastTranscription(result.text);
    });
    const unsubProgress = trackProgress
      ? onProgress((p: ModelLoadProgress) => setProgress(p))
      : (): void => undefined;

    return () => {
      unsubProgress();
      unsubState();
      unsubTranscription();
    };
  }, [trackProgress]);

  // Update config state when it changes
  useEffect(() => {
    setConfig(getLocalVoiceConfig());
  }, [state]);

  const enable = useCallback(async (): Promise<boolean> => {
    const success = await enableLocalVoice();
    setConfig(getLocalVoiceConfig());
    return success;
  }, []);

  const disable = useCallback(() => {
    disableLocalVoice();
    setConfig(getLocalVoiceConfig());
  }, []);

  const toggle = useCallback(async (): Promise<boolean> => {
    if (config.enabled) {
      disable();
      return false;
    } else {
      return enable();
    }
  }, [config.enabled, enable, disable]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setLastTranscription(null);
    return startListening();
  }, []);

  const stopRecording = useCallback(async (): Promise<void> => {
    await stopListening();
  }, []);

  const speakText = useCallback(async (text: string, priority = 5): Promise<void> => {
    await speak(text, priority);
  }, []);

  const stopSpeech = useCallback(() => {
    stopSpeaking();
  }, []);

  const readInject = useCallback(async (title: string, description: string): Promise<void> => {
    await readInjectSummary(title, description);
  }, []);

  const readDecision = useCallback(async (prompt: string): Promise<void> => {
    await readDecisionPrompt(prompt);
  }, []);

  const readAAR = useCallback(async (bullets: string[]): Promise<void> => {
    await readAARBullets(bullets);
  }, []);

  const setTTSEnabled = useCallback((enabled: boolean) => {
    saveLocalVoiceConfig({ ttsEnabled: enabled });
    setConfig(getLocalVoiceConfig());
  }, []);

  const setSTTEnabled = useCallback((enabled: boolean) => {
    saveLocalVoiceConfig({ sttEnabled: enabled });
    setConfig(getLocalVoiceConfig());
  }, []);

  const setTTSVoice = useCallback((voice: string) => {
    saveLocalVoiceConfig({ ttsVoice: voice });
    setConfig(getLocalVoiceConfig());
  }, []);

  const setTTSRate = useCallback((rate: number) => {
    saveLocalVoiceConfig({ ttsRate: Math.max(0.5, Math.min(2, rate)) });
    setConfig(getLocalVoiceConfig());
  }, []);

  const clearTranscription = useCallback(() => {
    setLastTranscription(null);
  }, []);

  return {
    // State
    state,
    config,
    progress,
    isEnabled: config.enabled,
    // OR of STT|TTS — status chrome only. Speak/Hear/Replay must use canSpeak (ttsReady).
    isReady: state.sttReady || state.ttsReady,
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,

    // Model info
    estimatedDownloadMB: getEstimatedDownloadSize(),
    isDownloading: trackProgress
      ? progress.stage === 'downloading' || progress.stage === 'loading'
      : state.isLoading,
    downloadProgress: progress.progress,

    // Actions
    enable,
    disable,
    toggle,

    // STT
    startRecording,
    stopRecording,

    // TTS
    speakText,
    stopSpeech,
    readInject,
    readDecision,
    readAAR,

    // Config
    setTTSEnabled,
    setSTTEnabled,
    setTTSVoice,
    setTTSRate,

    // Last transcription
    lastTranscription,
    clearTranscription,

    canSpeak: config.enabled && config.ttsEnabled && state.ttsReady,
    canListen: config.enabled && config.sttEnabled && state.sttReady,
  };
}
