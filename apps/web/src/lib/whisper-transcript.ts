/** Whisper pipeline options for short operator commands. */
export const WHISPER_TRANSCRIBE_OPTIONS = {
  language: 'en',
  task: 'transcribe',
  return_timestamps: false,
  temperature: 0,
  max_new_tokens: 128,
};

const SILENCE_RMS = 0.006;

/** Drop leading/trailing hush so Whisper is less likely to hallucinate on padded audio. */
export function trimSpeechSamples(samples: Float32Array, sampleRate = 16000): Float32Array {
  const window = Math.max(1, Math.round(sampleRate * 0.02));
  let first = -1;
  let last = -1;
  for (let i = 0; i + window <= samples.length; i += window) {
    let sum = 0;
    for (let j = 0; j < window; j++) sum += samples[i + j] * samples[i + j];
    if (Math.sqrt(sum / window) >= SILENCE_RMS) {
      if (first < 0) first = i;
      last = i + window;
    }
  }
  if (first < 0) return new Float32Array(0);
  const pad = Math.round(sampleRate * 0.1);
  return samples.slice(Math.max(0, first - pad), Math.min(samples.length, last + pad));
}

export function exactTranscript(text: unknown): string {
  return typeof text === 'string' ? text.trim() : '';
}
