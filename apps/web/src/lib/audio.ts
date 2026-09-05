'use client';

type SFXType =
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
  enabled: false,
  volume: 0.3,
};

let audioContext: AudioContext | null = null;
let config: AudioConfig = DEFAULT_CONFIG;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    } catch {
      console.warn('Web Audio API not supported');
      return null;
    }
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
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

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  attack = 0.01,
  decay = 0.1
): void {
  const ctx = getAudioContext();
  if (!ctx || !config.enabled) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  const volume = config.volume;
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + attack + decay);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine'): void {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration - i * 0.05, type), i * 50);
  });
}

export function playSFX(sfxType: SFXType): void {
  if (!config.enabled) return;

  switch (sfxType) {
    case 'injectArrive':
      playTone(880, 0.15, 'sine');
      setTimeout(() => playTone(1100, 0.1, 'sine'), 100);
      break;

    case 'correctDecision':
      playChord([523, 659, 784], 0.3, 'sine');
      break;

    case 'wrongDecision':
      playTone(200, 0.2, 'square', 0.01, 0.05);
      setTimeout(() => playTone(150, 0.3, 'square', 0.01, 0.05), 150);
      break;

    case 'tacticalDeploy':
      playTone(440, 0.08, 'triangle');
      setTimeout(() => playTone(550, 0.08, 'triangle'), 80);
      setTimeout(() => playTone(660, 0.12, 'triangle'), 160);
      break;

    case 'microTask':
      playTone(1200, 0.05, 'sine', 0.005, 0.02);
      break;

    case 'warning':
      playTone(400, 0.15, 'sawtooth', 0.01, 0.05);
      setTimeout(() => playTone(400, 0.15, 'sawtooth', 0.01, 0.05), 200);
      break;

    case 'error':
      playTone(150, 0.4, 'square', 0.01, 0.1);
      break;

    case 'scoreUp':
      playTone(800, 0.08, 'sine');
      setTimeout(() => playTone(1000, 0.1, 'sine'), 60);
      break;

    case 'streakBonus':
      playChord([523, 659, 784, 1047], 0.4, 'sine');
      break;

    case 'timerTick':
      playTone(600, 0.03, 'sine', 0.005, 0.01);
      break;

    case 'timerUrgent':
      playTone(800, 0.05, 'square', 0.005, 0.02);
      break;
  }
}

export function initAudio(): void {
  loadAudioConfig();
  getAudioContext();
}
