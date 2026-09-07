import { describe, expect, it } from 'vitest';
import { createVoiceEndpoint } from './voice-endpoint';

describe('end-of-speech response boundary', () => {
  it('sends once after speech followed by a 1.25-second pause', () => {
    const sample = createVoiceEndpoint(0);
    for (let t = 50; t <= 500; t += 50) expect(sample(t, 0.08)).toBe('listening');
    expect(sample(1500, 0)).toBe('listening');
    expect(sample(1750, 0)).toBe('send');
    expect(sample(3000, 0)).toBe('listening');
  });
  it('does not send during a short pause or while speech continues', () => {
    const sample = createVoiceEndpoint(0);
    for (let t = 50; t <= 500; t += 50) sample(t, 0.05);
    expect(sample(1400, 0)).toBe('listening');
    expect(sample(1450, 0.05)).toBe('listening');
    expect(sample(2000, 0)).toBe('listening');
    expect(sample(2700, 0)).toBe('send');
  });
  it('rejects silence and brief clicks instead of transcribing them', () => {
    const silence = createVoiceEndpoint(0);
    expect(silence(12000, 0)).toBe('no-speech');
    const click = createVoiceEndpoint(0);
    click(50, 0.5);
    expect(click(1400, 0)).toBe('listening');
    expect(click(12000, 0)).toBe('no-speech');
  });
  it('does not interpret continuous noise or a stalled tab as a completed response', () => {
    const sample = createVoiceEndpoint(0);
    for (let t = 50; t < 60000; t += 50) expect(sample(t, 0.04)).toBe('listening');
    expect(sample(60000, 0.04)).toBe('too-long');
    const stalled = createVoiceEndpoint(0);
    expect(stalled(15000, 0.08)).toBe('no-speech');
  });
});
