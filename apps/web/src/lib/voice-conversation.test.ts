import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VoiceConversation,
  type ConversationPort,
  type ConversationAudioState,
} from './voice-conversation';

function harness() {
  let visible = true,
    hasSpeech = false;
  const audio: ConversationAudioState = {
    isStarting: false,
    isListening: false,
    isTranscribing: false,
    isSpeaking: false,
    error: null,
  };
  const contexts: string[] = [];
  const port: ConversationPort = {
    ready: () => true,
    visible: () => visible,
    state: () => audio,
    hasSpeech: () => hasSpeech,
    claim: vi.fn(),
    context: () => 'mission:a',
    listen: vi.fn(async (context) => {
      contexts.push(context);
      audio.isListening = true;
      return true;
    }),
    cancel: vi.fn(() => {
      audio.isStarting = false;
      audio.isListening = false;
      audio.isTranscribing = false;
      loop.audioChanged();
    }),
    speak: vi.fn(async () => {}),
    stopSpeech: vi.fn(),
    respond: vi.fn(async (text) => ({ reply: `Recorded ${text}` })),
  };
  const loop = new VoiceConversation(port, () => {});
  return {
    loop,
    port,
    audio,
    contexts,
    setVisible: (value: boolean) => {
      visible = value;
      loop.visibilityChanged();
    },
    setSpeech: (value: boolean) => {
      hasSpeech = value;
    },
  };
}
describe('ongoing voice turn ownership', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it('one activation handles successive decisions and automatically listens after each reply', async () => {
    const h = harness();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    await h.loop.transcribed({ turnId: 1, contextId: h.contexts[0], text: 'first decision' });
    await vi.advanceTimersByTimeAsync(250);
    expect(h.port.listen).toHaveBeenCalledTimes(2);
    await h.loop.transcribed({ turnId: 2, contextId: h.contexts[1], text: 'second decision' });
    await vi.advanceTimersByTimeAsync(250);
    expect(h.port.listen).toHaveBeenCalledTimes(3);
    expect(h.port.respond).toHaveBeenCalledTimes(2);
    expect(h.port.speak).toHaveBeenCalledWith('Recorded second decision');
    h.loop.stop();
  });
  it('never resumes capture until a spoken reply finishes', async () => {
    const h = harness();
    let finish!: () => void;
    h.port.speak = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    const turn = h.loop.transcribed({ turnId: 1, contextId: h.contexts[0], text: 'decision' });
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.port.listen).toHaveBeenCalledTimes(1);
    finish();
    await turn;
    await vi.advanceTimersByTimeAsync(250);
    expect(h.port.listen).toHaveBeenCalledTimes(2);
    h.loop.stop();
  });
  it('spoken stop ends the loop and late or duplicate results cannot execute', async () => {
    const h = harness();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    const contextId = h.contexts[0];
    await h.loop.transcribed({ turnId: 1, contextId, text: 'Stop listening.' });
    await h.loop.transcribed({ turnId: 2, contextId, text: 'late decision' });
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.port.respond).not.toHaveBeenCalled();
    expect(h.port.listen).toHaveBeenCalledTimes(1);
    expect(h.loop.state.active).toBe(false);
  });
  it('reopens after quiet capture rotation without a tap or a spoken no-speech error', async () => {
    const h = harness();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    h.audio.isListening = false;
    h.loop.audioChanged();
    await vi.advanceTimersByTimeAsync(250);
    expect(h.port.listen).toHaveBeenCalledTimes(2);
    expect(h.port.speak).not.toHaveBeenCalled();
    h.loop.stop();
  });
  it('pauses offscreen and invalidates the previous capture before resuming', async () => {
    const h = harness();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    const old = h.contexts[0];
    h.setVisible(false);
    await h.loop.transcribed({ turnId: 1, contextId: old, text: 'hidden decision' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.port.respond).not.toHaveBeenCalled();
    expect(h.loop.state.phase).toBe('paused');
    h.setVisible(true);
    await vi.advanceTimersByTimeAsync(250);
    expect(h.port.listen).toHaveBeenCalledTimes(2);
    await h.loop.transcribed({ turnId: 2, contextId: old, text: 'stale decision' });
    expect(h.port.respond).not.toHaveBeenCalled();
    h.loop.stop();
  });
  it('defers incoming announcements while a user is speaking', async () => {
    const h = harness();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    h.setSpeech(true);
    const cancels = vi.mocked(h.port.cancel).mock.calls.length;
    h.loop.announce('New report received.');
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.port.cancel).toHaveBeenCalledTimes(cancels);
    expect(h.port.speak).not.toHaveBeenCalled();
    await h.loop.transcribed({ turnId: 1, contextId: h.contexts[0], text: 'decision' });
    h.setSpeech(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(h.port.speak).toHaveBeenCalledWith('New report received.');
    h.loop.stop();
  });
  it('does not execute a duplicate result or accept a previous activation result', async () => {
    const h = harness();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    const result = { turnId: 1, contextId: h.contexts[0], text: 'decision' };
    await h.loop.transcribed(result);
    await h.loop.transcribed(result);
    h.loop.stop();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    await h.loop.transcribed({ ...result, turnId: 2 });
    expect(h.port.respond).toHaveBeenCalledTimes(1);
    h.loop.stop();
  });
  it('stops and releases ownership when capture fails or models are disabled', async () => {
    const h = harness();
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    h.audio.error = 'Microphone disconnected';
    h.loop.audioChanged();
    expect(h.loop.state.active).toBe(false);
    expect(h.port.claim).toHaveBeenLastCalledWith(false);
    h.audio.error = null;
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    h.port.ready = () => false;
    h.loop.audioChanged();
    expect(h.loop.state.active).toBe(false);
    expect(h.port.claim).toHaveBeenLastCalledWith(false);
  });
  it('delivers an action receipt after visibility resumes without executing it twice', async () => {
    const h = harness();
    let finish!: (value: { reply: string }) => void;
    h.port.respond = vi.fn(
      () =>
        new Promise<{ reply: string }>((resolve) => {
          finish = resolve;
        })
    );
    h.loop.start();
    await vi.advanceTimersByTimeAsync(50);
    const turn = h.loop.transcribed({ turnId: 1, contextId: h.contexts[0], text: 'decision' });
    h.setVisible(false);
    finish({ reply: 'Decision recorded' });
    await turn;
    expect(h.port.speak).not.toHaveBeenCalled();
    h.setVisible(true);
    await vi.advanceTimersByTimeAsync(500);
    expect(h.port.speak).toHaveBeenCalledWith('Decision recorded');
    expect(h.port.respond).toHaveBeenCalledTimes(1);
    h.loop.stop();
  });
});
