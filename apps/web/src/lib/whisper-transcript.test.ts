import { describe, expect, it } from 'vitest';
import {
  WHISPER_TRANSCRIBE_OPTIONS,
  exactTranscript,
  trimSpeechSamples,
} from './whisper-transcript';

describe('Whisper command transcription helpers', () => {
  it('pins English transcribe settings that avoid long hallucinated tails', () => {
    expect(WHISPER_TRANSCRIBE_OPTIONS).toMatchObject({
      language: 'en',
      task: 'transcribe',
      return_timestamps: false,
      temperature: 0,
    });
    expect(WHISPER_TRANSCRIBE_OPTIONS.max_new_tokens).toBeLessThanOrEqual(128);
  });

  it('keeps the exact recognized string, including empty and punctuation-only results', () => {
    expect(exactTranscript('  Continue.  ')).toBe('Continue.');
    expect(exactTranscript('')).toBe('');
    expect(exactTranscript('   ')).toBe('');
    expect(exactTranscript(undefined)).toBe('');
    expect(exactTranscript('.')).toBe('.');
  });

  it('trims hush around speech and returns empty when nothing was above the floor', () => {
    const rate = 16000;
    const samples = new Float32Array(rate);
    for (let i = 8000; i < 9000; i++) samples[i] = 0.2;
    const trimmed = trimSpeechSamples(samples, rate);
    expect(trimmed.length).toBeGreaterThan(1000);
    expect(trimmed.length).toBeLessThan(samples.length);
    expect(trimSpeechSamples(new Float32Array(rate), rate).length).toBe(0);
  });
});
