'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LocalVoicePanel from './LocalVoicePanel';
import { useLocalVoice } from '@/lib/hooks/useLocalVoice';
import { VoiceConversation, type ConversationState } from '@/lib/voice-conversation';
import {
  cancelListening,
  getLocalVoiceConfig,
  getLocalVoiceState,
  hasLocalVoiceSpeech,
  onStateChange,
  onTranscription,
  setVoiceConversationActive,
  speakConversation,
  startListening,
  stopSpeaking,
} from '@/lib/local-voice';

export interface OngoingVoiceProps {
  context: string;
  announcement?: { id: string; text: string };
  onTurn(text: string, context: string): Promise<{ reply: string; stop?: boolean }>;
  onStart?(): void;
  settingsOpen: boolean;
  onSettingsClose(): void;
  reducedMotion?: boolean;
  elevenLabsPlayingChecker?: () => boolean;
}

function conversationStatus(conversation: ConversationState): string {
  if (!conversation.active) return conversation.error || 'Conversation off';
  return (
    {
      opening: 'Opening microphone…',
      listening: 'Listening — speak naturally',
      thinking: 'Understanding your decision…',
      speaking: 'Speaking — listening resumes afterward',
      paused: 'Voice paused while this tab is hidden',
      off: '',
      error: '',
    }[conversation.phase] ?? ''
  );
}

export default function OngoingVoicePanel(props: OngoingVoiceProps): JSX.Element {
  const local = useLocalVoice(props.elevenLabsPlayingChecker);
  const latest = useRef(props);
  latest.current = props;
  const manager = useRef<VoiceConversation>();
  const [conversation, setConversation] = useState<ConversationState>({
    active: false,
    phase: 'off',
    heard: '',
    reply: '',
    error: '',
  });
  useEffect(() => {
    const loop = new VoiceConversation(
      {
        ready: () => {
          const config = getLocalVoiceConfig(),
            state = getLocalVoiceState();
          return (
            config.enabled &&
            config.sttEnabled &&
            config.ttsEnabled &&
            state.sttReady &&
            state.ttsReady
          );
        },
        visible: () => !document.hidden,
        state: getLocalVoiceState,
        hasSpeech: hasLocalVoiceSpeech,
        claim: setVoiceConversationActive,
        listen: (context) => startListening(context, true),
        cancel: cancelListening,
        speak: speakConversation,
        stopSpeech: stopSpeaking,
        context: () => latest.current.context,
        respond: (text, context) => latest.current.onTurn(text, context),
      },
      setConversation
    );
    manager.current = loop;
    const unsubscribeState = onStateChange(() => loop.audioChanged());
    const unsubscribeText = onTranscription((result) => {
      void loop.transcribed(result);
    });
    const visibility = (): void => loop.visibilityChanged();
    const leaving = (): void => loop.stop();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', leaving);
    return () => {
      unsubscribeState();
      unsubscribeText();
      loop.stop();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', leaving);
    };
  }, []);
  useEffect(() => {
    if (props.announcement) manager.current?.announce(props.announcement.text);
  }, [props.announcement?.id]);

  const statusText = conversationStatus(conversation);
  const startConversation = (): void => {
    latest.current.onStart?.();
    manager.current?.start();
    manager.current?.announce(
      latest.current.announcement?.text ||
        'I am listening. Tell me your decision, ask for an update, or say help.'
    );
  };

  const chrome = (
    <>
      <LocalVoicePanel
        reducedMotion={props.reducedMotion}
        elevenLabsPlayingChecker={props.elevenLabsPlayingChecker}
        onClose={props.onSettingsClose}
      />
      <section className="ongoing-voice" aria-label="Ongoing two-way voice">
        <div className="ongoing-voice-heading">
          <div>
            <strong>Conversation</strong>
            <p>Optional. Start when you want to hear updates and speak decisions.</p>
          </div>
          {conversation.active ? (
            <button onClick={() => manager.current?.stop()}>Stop conversation</button>
          ) : (
            <button disabled={!local.canListen || !local.canSpeak} onClick={startConversation}>
              Start conversation
            </button>
          )}
        </div>
        {!local.canListen || !local.canSpeak ? (
          <p>
            Enable hearing and speech input above. Models load on this device before the
            conversation starts.
          </p>
        ) : null}
        <p role="status">{statusText}</p>
        {conversation.active && (
          <p className="ongoing-voice-hint">
            Say “stop listening” to end voice. You can pause between turns without touching the
            screen.
          </p>
        )}
        {(conversation.heard || conversation.reply) && (
          <details>
            <summary>Latest voice exchange</summary>
            <p>
              <strong>You:</strong> {conversation.heard || '—'}
            </p>
            <p>
              <strong>Game:</strong> {conversation.reply || '—'}
            </p>
          </details>
        )}
      </section>
    </>
  );

  return (
    <>
      {conversation.active &&
        typeof document !== 'undefined' &&
        createPortal(
          <button className="ongoing-voice-stop" onClick={() => manager.current?.stop()}>
            Stop voice
          </button>,
          document.body
        )}
      {props.settingsOpen && typeof document !== 'undefined' ? (
        createPortal(
          <div
            className="hc-voice-dialog fixed inset-0 bg-black/90 backdrop-blur-xl z-[90] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Two-way audio settings"
            onClick={(event) => {
              if (event.target === event.currentTarget) props.onSettingsClose();
            }}
          >
            <div className="w-full max-w-md animate-scale-in overflow-y-auto">{chrome}</div>
          </div>,
          document.body
        )
      ) : (
        <section className="ongoing-voice-stowed" aria-label="Ongoing two-way voice">
          <p role="status">{statusText}</p>
        </section>
      )}
    </>
  );
}
