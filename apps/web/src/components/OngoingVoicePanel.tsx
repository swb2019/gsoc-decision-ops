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
}

export default function OngoingVoicePanel(props: OngoingVoiceProps): JSX.Element {
  const local = useLocalVoice();
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
  const [setup, setSetup] = useState(false);
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
  return (
    <section className="ongoing-voice" aria-label="Ongoing two-way voice">
      {conversation.active &&
        createPortal(
          <button className="ongoing-voice-stop" onClick={() => manager.current?.stop()}>
            Stop voice
          </button>,
          document.body
        )}
      <div className="ongoing-voice-heading">
        <div>
          <strong>Two-way voice</strong>
          <p>Hear updates and speak decisions. Listening resumes after each reply.</p>
        </div>
        {conversation.active ? (
          <button onClick={() => manager.current?.stop()}>Stop conversation</button>
        ) : (
          <button
            disabled={!local.canListen || !local.canSpeak}
            onClick={() => {
              latest.current.onStart?.();
              manager.current?.start();
              manager.current?.announce(
                latest.current.announcement?.text ||
                  'I am listening. Tell me your decision, ask for an update, or say help.'
              );
            }}
          >
            Start conversation
          </button>
        )}
        <button onClick={() => setSetup(!setup)} aria-expanded={setup}>
          Voice setup
        </button>
      </div>
      {!local.canListen || !local.canSpeak ? (
        <p>
          Enable hearing and speech input in Voice setup. Models load on this device before the
          conversation starts.
        </p>
      ) : null}
      {setup && <LocalVoicePanel onClose={() => setSetup(false)} />}
      <p role="status">
        {conversation.active
          ? {
              opening: 'Opening microphone…',
              listening: 'Listening — speak naturally',
              thinking: 'Understanding your decision…',
              speaking: 'Speaking — listening resumes afterward',
              paused: 'Voice paused while this tab is hidden',
              off: '',
              error: '',
            }[conversation.phase]
          : conversation.error || 'Conversation off'}
      </p>
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
  );
}
