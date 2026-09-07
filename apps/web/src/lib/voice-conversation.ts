export interface ConversationAudioState {
  isStarting: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  error: string | null;
}
export interface ConversationState {
  active: boolean;
  phase: 'off' | 'opening' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'error';
  heard: string;
  reply: string;
  error: string;
}
export interface ConversationPort {
  ready(): boolean;
  visible(): boolean;
  state(): ConversationAudioState;
  hasSpeech(): boolean;
  claim(active: boolean): void;
  listen(context: string): Promise<boolean>;
  cancel(): void;
  speak(text: string): Promise<void>;
  stopSpeech(): void;
  context(): string;
  respond(text: string, context: string): Promise<{ reply: string; stop?: boolean }>;
}

/** One explicit activation owns the whole listen → act → reply → listen loop. */
export class VoiceConversation {
  state: ConversationState = { active: false, phase: 'off', heard: '', reply: '', error: '' };
  private epoch = 0;
  private activation = 0;
  private busy = false;
  private context = '';
  private turn = -1;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private messages: string[] = [];
  private previousError: string | null = null;
  constructor(
    private port: ConversationPort,
    private changed: (state: ConversationState) => void
  ) {}
  private update(patch: Partial<ConversationState>): void {
    this.state = { ...this.state, ...patch };
    this.changed(this.state);
  }
  start(): void {
    if (this.state.active) return;
    if (!this.port.ready()) {
      this.update({
        phase: 'error',
        error: 'Enable both hearing and speech input, then finish local voice setup.',
      });
      return;
    }
    this.epoch++;
    this.activation++;
    this.busy = false;
    this.previousError = null;
    this.port.cancel();
    this.port.stopSpeech();
    this.port.claim(true);
    this.update({ active: true, phase: 'opening', error: '', heard: '', reply: '' });
    this.schedule();
  }
  stop(error = ''): void {
    this.epoch++;
    this.activation++;
    clearTimeout(this.timer);
    this.messages = [];
    this.busy = false;
    this.update({ active: false, phase: error ? 'error' : 'off', error });
    this.port.claim(false);
    this.port.cancel();
    this.port.stopSpeech();
  }
  visibilityChanged(): void {
    if (!this.state.active) return;
    this.epoch++;
    this.busy = false;
    if (!this.port.visible()) {
      clearTimeout(this.timer);
      if (this.state.phase === 'speaking' && this.state.reply)
        this.messages.unshift(this.state.reply);
      this.update({ phase: 'paused' });
      this.port.cancel();
      this.port.stopSpeech();
    } else {
      this.update({ phase: 'opening' });
      this.schedule();
    }
  }
  audioChanged(): void {
    if (!this.state.active || !this.port.visible()) return;
    if (!this.port.ready()) {
      this.stop('Two-way voice stopped because input or playback was disabled.');
      return;
    }
    const audio = this.port.state();
    if (!audio.error) this.previousError = null;
    if (audio.error && audio.error !== this.previousError && !this.busy) {
      this.previousError = audio.error;
      if (/microphone|capture/i.test(audio.error)) {
        this.stop(audio.error);
        return;
      }
      this.messages.push(audio.error);
    }
    if (!this.busy)
      this.update({
        phase: audio.isTranscribing
          ? 'thinking'
          : audio.isListening
            ? 'listening'
            : this.state.phase,
      });
    this.schedule();
  }
  announce(text: string): void {
    if (!this.state.active || !text.trim()) return;
    this.messages.push(text);
    // Never interrupt a user's active spoken turn to announce an update.
    if (this.port.state().isListening && !this.port.hasSpeech()) this.port.cancel();
    this.schedule();
  }
  async transcribed(result: { turnId: number; contextId?: string; text: string }): Promise<void> {
    if (
      !this.state.active ||
      !this.port.visible() ||
      result.contextId !== this.context ||
      result.turnId <= this.turn
    )
      return;
    this.turn = result.turnId;
    const epoch = this.epoch;
    const activation = this.activation;
    this.busy = true;
    this.update({ phase: 'thinking', heard: result.text, error: '' });
    this.port.cancel();
    try {
      if (
        /^(?:please )?(?:stop listening|end (?:the )?(?:voice|conversation)|turn off (?:two way )?voice)[.!?]*$/i.test(
          result.text.trim()
        )
      ) {
        this.stop();
        return;
      }
      const reply = await this.port.respond(
        result.text,
        this.context.slice(this.context.indexOf('|') + 1)
      );
      if (!this.state.active) return;
      if (epoch !== this.epoch) {
        if (activation === this.activation) this.messages.push(reply.reply);
        return;
      }
      this.update({ reply: reply.reply, phase: 'speaking' });
      await this.port.speak(reply.reply);
      if (epoch !== this.epoch) return;
      if (reply.stop) {
        this.stop();
        return;
      }
    } catch (error) {
      if (epoch === this.epoch)
        this.stop(
          error instanceof Error
            ? error.message
            : 'Voice could not continue. Your recorded decisions are preserved.'
        );
    } finally {
      if (epoch === this.epoch) {
        this.busy = false;
        this.schedule(200);
      }
    }
  }
  private schedule(delay = 30): void {
    clearTimeout(this.timer);
    if (!this.state.active || !this.port.visible() || this.busy) return;
    this.timer = setTimeout(() => void this.pump(), delay);
  }
  private async pump(): Promise<void> {
    if (!this.state.active || this.busy || !this.port.visible()) return;
    const audio = this.port.state();
    if (audio.isStarting || audio.isListening || audio.isTranscribing || audio.isSpeaking) return;
    const epoch = this.epoch;
    this.busy = true;
    try {
      const message = this.messages.shift();
      if (message) {
        this.update({ phase: 'speaking', reply: message });
        await this.port.speak(message);
      } else {
        this.context = `conversation:${this.epoch}|${this.port.context()}`;
        this.update({ phase: 'opening' });
        const started = await this.port.listen(this.context);
        if (epoch !== this.epoch) return;
        if (!started) {
          this.stop(this.port.state().error || 'The microphone could not start.');
          return;
        }
        this.update({ phase: 'listening' });
      }
    } catch (error) {
      if (epoch === this.epoch)
        this.stop(error instanceof Error ? error.message : 'Voice could not continue.');
    } finally {
      if (epoch === this.epoch) {
        this.busy = false;
        this.schedule(200);
      }
    }
  }
}
