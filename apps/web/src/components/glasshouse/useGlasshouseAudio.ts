'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getGlasshouseObservations,
  type GlasshouseSession as Session,
} from '@gsoc-decision-ops/core';

export type AudioChannel = 'voice' | 'effects' | 'ambience';
type Preferences = Record<AudioChannel, { enabled: boolean; volume: number }>;
type CueKind = 'receipt' | 'complete' | 'attention';
export interface AudioReceipt {
  eventId: string;
  label: string;
  at: number;
}
type Cue = AudioReceipt & { kind: CueKind; priority: number };
const initialPreferences = (): Preferences => ({
  voice: { enabled: false, volume: 0.8 },
  effects: { enabled: false, volume: 0.45 },
  ambience: { enabled: false, volume: 0.2 },
});

function cueFor(event: Session['events'][number]): Cue | null {
  const recipe: Record<string, [CueKind, number, string]> = {
    'observation.received': ['receipt', 1, 'New evidence received'],
    'observation.corrected': ['attention', 3, 'Evidence correction received'],
    'action.started': ['receipt', 1, 'Assignment started'],
    'action.completed': ['complete', 2, 'Assignment update received'],
    'action.failed': ['attention', 3, 'Assignment needs review'],
    'action.cancelled': ['receipt', 1, 'Cancellation recorded'],
    'action.rejected': ['attention', 3, 'Request needs review'],
    'approval.requested': ['receipt', 1, 'Approval request acknowledged'],
    'approval.granted': ['complete', 2, 'Scoped approval received'],
    'approval.declined': ['attention', 3, 'Approval response needs review'],
    'deadline.dispatch': ['attention', 3, 'Dispatch update available'],
    'handoff.recorded': ['complete', 2, 'Handoff recorded'],
  };
  const found = recipe[event.type];
  return found
    ? {
        eventId: event.eventId,
        at: event.simulatedAt,
        kind: found[0],
        priority: found[1],
        label: found[2],
      }
    : null;
}

/**
 * Original procedural sound, authored for this project under its MIT license.
 * Cues are short sine envelopes; room tone is a quiet three-part low-frequency hum.
 * There are no samples, downloads, random draws, timers into the domain, or microphones.
 */
class GlasshouseAudioOutput {
  private context: AudioContext | null = null;
  private effects: GainNode | null = null;
  private ambience: GainNode | null = null;
  private ambienceSources: OscillatorNode[] = [];
  private cues = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();

  async unlock() {
    if (!this.context || this.context.state === 'closed') {
      const Audio =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) throw new Error('This browser has no WebAudio output.');
      this.context = new Audio({ latencyHint: 'interactive' });
      this.effects = this.context.createGain();
      this.ambience = this.context.createGain();
      this.effects.gain.value = 0;
      this.ambience.gain.value = 0;
      this.effects.connect(this.context.destination);
      this.ambience.connect(this.context.destination);
    }
    await this.context.resume();
    if (this.context.state !== 'running')
      throw new Error('The browser could not activate audio output.');
  }

  private setGain(node: GainNode | null, value: number) {
    if (!node || !this.context || this.context.state === 'closed') return;
    node.gain.cancelScheduledValues(this.context.currentTime);
    node.gain.setValueAtTime(value, this.context.currentTime);
  }

  private clearCues() {
    for (const cue of this.cues) {
      try {
        cue.gain.gain.cancelScheduledValues(0);
        cue.gain.gain.value = 0;
        cue.oscillator.stop();
      } catch {
        /* Already ended. */
      }
      cue.oscillator.disconnect();
      cue.gain.disconnect();
    }
    this.cues.clear();
  }

  private stopAmbience() {
    for (const source of this.ambienceSources) {
      try {
        source.stop();
      } catch {
        /* Already ended. */
      }
      source.disconnect();
    }
    this.ambienceSources = [];
  }

  configure(preferences: Preferences, active: boolean, paused: boolean, voicePlaying: boolean) {
    const audible = active && !paused;
    if (!audible || !preferences.effects.enabled || !preferences.effects.volume || voicePlaying)
      this.clearCues();
    this.setGain(
      this.effects,
      audible && preferences.effects.enabled && !voicePlaying
        ? preferences.effects.volume * 0.35
        : 0
    );
    this.setGain(
      this.ambience,
      audible && preferences.ambience.enabled
        ? preferences.ambience.volume * 0.018 * (voicePlaying ? 0.1 : 1)
        : 0
    );
    if (!audible || !preferences.ambience.enabled || !preferences.ambience.volume)
      this.stopAmbience();
    else if (!this.ambienceSources.length && this.context?.state === 'running' && this.ambience) {
      for (const frequency of [73.42, 110.13, 146.84]) {
        const oscillator = this.context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(this.ambience);
        oscillator.start();
        this.ambienceSources.push(oscillator);
      }
    }
  }

  receipt(kind: CueKind): boolean {
    if (!this.context || !this.effects || this.context.state === 'suspended') return false;
    if (this.context.state === 'closed') throw new Error('Audio output was interrupted.');
    this.clearCues();
    const frequencies =
      kind === 'attention' ? [440, 349.23] : kind === 'complete' ? [523.25, 659.25] : [392];
    frequencies.forEach((frequency, index) => {
      const context = this.context!;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = context.currentTime + index * 0.105;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.12, at + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.085);
      gain.gain.setValueAtTime(0, at + 0.095);
      oscillator.connect(gain);
      gain.connect(this.effects!);
      const cue = { oscillator, gain };
      this.cues.add(cue);
      oscillator.onended = () => {
        this.cues.delete(cue);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(at);
      oscillator.stop(at + 0.1);
    });
    return true;
  }

  pause() {
    this.setGain(this.effects, 0);
    this.setGain(this.ambience, 0);
    this.clearCues();
    this.stopAmbience();
    if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined);
  }

  close() {
    this.pause();
    if (this.context && this.context.state !== 'closed')
      void this.context.close().catch(() => undefined);
    this.context = null;
    this.effects = null;
    this.ambience = null;
  }
}

export function useGlasshouseAudio(state: Session | null, active: boolean) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const preferencesRef = useRef(preferences);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [voiceState, setVoiceState] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const voiceRef = useRef<'stopped' | 'playing' | 'paused'>('stopped');
  const [error, setError] = useState('');
  const [lastReceipt, setLastReceipt] = useState<AudioReceipt | null>(null);
  const [quietReceipts, setQuietReceipts] = useState<AudioReceipt[]>([]);
  const output = useRef<GlasshouseAudioOutput | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const activation = useRef(0);
  const speechEpoch = useRef(0);
  const seen = useRef<{ sessionId: string; sequence: number } | null>(null);

  const sync = useCallback(
    () =>
      output.current?.configure(
        preferencesRef.current,
        activeRef.current && !document.hidden,
        pausedRef.current,
        voiceRef.current === 'playing'
      ),
    []
  );
  const changePreferences = useCallback(
    (next: Preferences) => {
      preferencesRef.current = next;
      setPreferences(next);
      sync();
    },
    [sync]
  );
  const stopVoice = useCallback(() => {
    speechEpoch.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    voiceRef.current = 'stopped';
    setVoiceState('stopped');
    sync();
  }, [sync]);
  const failOutput = useCallback(() => {
    output.current?.close();
    output.current = null;
    changePreferences({
      ...preferencesRef.current,
      effects: { ...preferencesRef.current.effects, enabled: false },
      ambience: { ...preferencesRef.current.ambience, enabled: false },
    });
    setError(
      'Optional sound is unavailable in this browser. Effects and ambience are off; every observation, receipt and command remains available as text.'
    );
  }, [changePreferences]);

  const setEnabled = useCallback(
    async (channel: AudioChannel, enabled: boolean) => {
      const attempt = ++activation.current;
      changePreferences({
        ...preferencesRef.current,
        [channel]: { ...preferencesRef.current[channel], enabled },
      });
      if (channel === 'voice') {
        if (!enabled) stopVoice();
        return;
      }
      if (!enabled) {
        sync();
        return;
      }
      if (!activeRef.current || document.hidden) {
        pausedRef.current = true;
        setPaused(true);
        return;
      }
      try {
        output.current ??= new GlasshouseAudioOutput();
        await output.current.unlock();
        if (activation.current !== attempt) {
          sync();
          return;
        }
        pausedRef.current = false;
        setPaused(false);
        setError('');
        sync();
      } catch {
        failOutput();
      }
    },
    [changePreferences, failOutput, stopVoice, sync]
  );

  const setVolume = useCallback(
    (channel: AudioChannel, volume: number) => {
      if (channel === 'voice' && voiceRef.current !== 'stopped') stopVoice();
      changePreferences({
        ...preferencesRef.current,
        [channel]: { ...preferencesRef.current[channel], volume: Math.max(0, Math.min(1, volume)) },
      });
    },
    [changePreferences, stopVoice]
  );

  const pause = useCallback(() => {
    activation.current += 1;
    pausedRef.current = true;
    setPaused(true);
    output.current?.pause();
    if (voiceRef.current === 'playing' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      voiceRef.current = 'paused';
      setVoiceState('paused');
    }
  }, []);

  const stopForNavigation = useCallback(() => {
    pause();
    stopVoice();
  }, [pause, stopVoice]);
  const stop = useCallback(() => {
    pause();
    stopVoice();
    const next = initialPreferences();
    for (const channel of ['voice', 'effects', 'ambience'] as const)
      next[channel].volume = preferencesRef.current[channel].volume;
    changePreferences(next);
    pausedRef.current = false;
    setPaused(false);
    setQuietReceipts([]);
  }, [changePreferences, pause, stopVoice]);

  const resume = useCallback(async () => {
    if (!activeRef.current || document.hidden) return;
    const attempt = ++activation.current;
    try {
      if (preferencesRef.current.effects.enabled || preferencesRef.current.ambience.enabled) {
        output.current ??= new GlasshouseAudioOutput();
        await output.current.unlock();
      }
      if (attempt !== activation.current) return;
      pausedRef.current = false;
      setPaused(false);
      if (
        voiceRef.current === 'paused' &&
        preferencesRef.current.voice.enabled &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.resume();
        voiceRef.current = 'playing';
        setVoiceState('playing');
      }
      sync();
    } catch {
      failOutput();
    }
  }, [failOutput, sync]);

  const playVoice = useCallback(
    (transcript: string) => {
      if (!activeRef.current || document.hidden) return;
      if (!('speechSynthesis' in window)) {
        setError(
          'Voice playback is unavailable. The complete handover transcript remains readable.'
        );
        return;
      }
      const localVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.localService && voice.lang.startsWith('en'));
      if (!localVoice) {
        setError(
          'No local English voice is available. Read the complete handover transcript; no remote voice or model will be requested.'
        );
        return;
      }
      stopVoice();
      changePreferences({
        ...preferencesRef.current,
        voice: { ...preferencesRef.current.voice, enabled: true },
      });
      pausedRef.current = false;
      setPaused(false);
      setError('');
      setQuietReceipts([]);
      const epoch = ++speechEpoch.current;
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.voice = localVoice;
      utterance.rate = 1;
      utterance.volume = preferencesRef.current.voice.volume;
      utterance.onend = () => {
        if (epoch === speechEpoch.current) {
          voiceRef.current = 'stopped';
          setVoiceState('stopped');
          sync();
        }
      };
      utterance.onerror = (event) => {
        if (epoch === speechEpoch.current) {
          stopVoice();
          if (!['canceled', 'interrupted'].includes(event.error))
            setError('Voice playback stopped. Continue with the complete handover transcript.');
        }
      };
      voiceRef.current = 'playing';
      setVoiceState('playing');
      sync();
      try {
        window.speechSynthesis.speak(utterance);
        if (preferencesRef.current.effects.enabled || preferencesRef.current.ambience.enabled)
          void resume();
      } catch {
        stopVoice();
        setError('Voice playback stopped. Continue with the complete handover transcript.');
      }
    },
    [changePreferences, resume, stopVoice, sync]
  );

  useEffect(() => {
    if (!active) stopForNavigation();
  }, [active, stopForNavigation]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stopForNavigation();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      speechEpoch.current += 1;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      output.current?.close();
    };
  }, [stopForNavigation]);
  useEffect(() => {
    if (!state) {
      seen.current = null;
      return;
    }
    const sequence = state.events.at(-1)?.sequence ?? 0;
    if (seen.current?.sessionId !== state.sessionId) {
      seen.current = { sessionId: state.sessionId, sequence };
      setLastReceipt(null);
      setQuietReceipts([]);
      stopVoice();
      return;
    }
    const incoming = state.events.filter((event) => event.sequence > seen.current!.sequence);
    seen.current.sequence = sequence;
    if (
      !active ||
      document.hidden ||
      pausedRef.current ||
      !preferencesRef.current.effects.enabled ||
      !preferencesRef.current.effects.volume
    )
      return;
    const visibleEvidence = new Set(getGlasshouseObservations(state).map((item) => item.id));
    const cue = incoming
      .filter(
        (event) =>
          !event.type.startsWith('observation.') ||
          visibleEvidence.has(String(event.payload.observationId))
      )
      .map(cueFor)
      .filter((item): item is Cue => Boolean(item))
      .reduce<Cue | null>(
        (chosen, item) => (!chosen || item.priority >= chosen.priority ? item : chosen),
        null
      );
    if (!cue) return;
    if (voiceRef.current === 'playing') {
      setQuietReceipts((current) => [...current, cue].slice(-3));
      return;
    }
    try {
      if (output.current?.receipt(cue.kind)) setLastReceipt(cue);
    } catch {
      failOutput();
    }
  }, [state, active, failOutput, stopVoice]);

  return {
    preferences,
    paused,
    voiceState,
    error,
    lastReceipt,
    quietReceipts,
    setEnabled,
    setVolume,
    playVoice,
    pause,
    resume,
    stop,
    stopVoice,
    stopForNavigation,
  };
}

export type GlasshouseAudio = ReturnType<typeof useGlasshouseAudio>;
