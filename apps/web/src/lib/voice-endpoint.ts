/** Audio input timing only; this never advances the simulation clock. */
export function createVoiceEndpoint(startedAt: number) {
  let previous = startedAt;
  let speechMs = 0;
  let lastSpeech: number | null = null;
  let finished = false;
  const sample = (now: number, rms: number): 'listening' | 'send' | 'no-speech' | 'too-long' => {
    if (finished) return 'listening';
    const elapsed = Math.max(0, Math.min(100, now - previous));
    previous = now;
    if (Number.isFinite(rms) && rms >= 0.012) {
      speechMs += elapsed;
      lastSpeech = now;
    }
    let result: 'listening' | 'send' | 'no-speech' | 'too-long' = 'listening';
    if (now - startedAt >= 60_000) result = 'too-long';
    else if (speechMs >= 250 && lastSpeech !== null && now - lastSpeech >= 1_250) result = 'send';
    else if (speechMs < 250 && now - startedAt >= 12_000) result = 'no-speech';
    if (result !== 'listening') finished = true;
    return result;
  };
  return Object.assign(sample, { hasSpeech: (): boolean => speechMs >= 250 });
}
