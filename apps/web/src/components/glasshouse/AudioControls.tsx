'use client';

import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { clockLabel } from './PlanComposer';
import type { AudioChannel, GlasshouseAudio } from './useGlasshouseAudio';

const channels: { id: AudioChannel; label: string; description: string }[] = [
  {
    id: 'voice',
    label: 'Voice',
    description:
      'Local handover playback only. Changing its level stops the current line; use Listen to restart.',
  },
  {
    id: 'effects',
    label: 'Effects',
    description:
      'Short cues for received evidence and action receipts. One cue per update, with no repeated alarms.',
  },
  {
    id: 'ambience',
    label: 'Ambience',
    description: 'Quiet original room tone. It conveys no facts, urgency or hidden scenario state.',
  },
];

export function AudioControls({ audio }: { audio: GlasshouseAudio }) {
  const enabled = Object.values(audio.preferences).some((channel) => channel.enabled);
  return (
    <section className="gh-audio-controls" aria-labelledby="gh-audio-title">
      <div className="gh-panel-heading">
        <h3 id="gh-audio-title">
          <Volume2 size={17} />
          Sound, on your terms
        </h3>
        <span className="gh-pill">
          {!enabled ? 'All channels off' : audio.paused ? 'Paused' : 'Optional audio enabled'}
        </span>
      </div>
      <p className="gh-helper">
        Each channel starts off. Voice has priority: effects fall silent and room tone becomes
        quieter during a line. No microphone, audio download or service is used.
      </p>
      <div className="gh-audio-channels">
        {channels.map((channel) => (
          <fieldset className="gh-audio-channel" key={channel.id}>
            <legend>{channel.label}</legend>
            <label className="gh-checkbox">
              <input
                type="checkbox"
                checked={audio.preferences[channel.id].enabled}
                onChange={(event) => void audio.setEnabled(channel.id, event.target.checked)}
              />
              Enable {channel.label.toLowerCase()}
            </label>
            <label className="gh-field">
              {channel.label} level{' '}
              <span>{Math.round(audio.preferences[channel.id].volume * 100)}%</span>
              <input
                aria-label={`${channel.label} level`}
                aria-valuetext={`${Math.round(audio.preferences[channel.id].volume * 100)} percent`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(audio.preferences[channel.id].volume * 100)}
                onChange={(event) => audio.setVolume(channel.id, Number(event.target.value) / 100)}
              />
            </label>
            <p className="gh-helper">{channel.description}</p>
          </fieldset>
        ))}
      </div>
      <div className="gh-button-row">
        <button
          className="gh-button"
          disabled={!enabled}
          onClick={audio.paused ? () => void audio.resume() : audio.pause}
        >
          {audio.paused ? <Play size={15} /> : <Pause size={15} />}
          {audio.paused ? 'Resume audio' : 'Pause audio'}
        </button>
        <button
          className="gh-button"
          disabled={!enabled && audio.voiceState === 'stopped'}
          onClick={audio.stop}
        >
          <Square size={15} />
          Stop all audio
        </button>
      </div>
      <p className="gh-helper">
        Leaving the command view or hiding this tab pauses sound and stops voice. Returning never
        plays a backlog of missed cues. All evidence and receipts remain available in text.
      </p>
      {audio.error && (
        <p className="gh-audio-error" role="status">
          {audio.error}
        </p>
      )}
    </section>
  );
}

export function AudioStatus({ audio }: { audio: GlasshouseAudio }) {
  const enabled = Object.values(audio.preferences).some((channel) => channel.enabled);
  if (!enabled && !audio.error) return null;
  return (
    <aside className="gh-audio-status" aria-label="Optional audio status">
      <div>
        <Volume2 size={16} />
        <span>
          {audio.error
            ? 'Audio fallback'
            : audio.paused
              ? 'Audio paused'
              : audio.voiceState === 'playing'
                ? 'Handover voice · other channels quiet'
                : 'Optional sound enabled'}
        </span>
        {enabled && (
          <div className="gh-button-row">
            <button
              className="gh-text-button"
              onClick={audio.paused ? () => void audio.resume() : audio.pause}
            >
              {audio.paused ? 'Resume audio' : 'Pause audio'}
            </button>
            <button className="gh-text-button" onClick={audio.stop}>
              Stop all audio
            </button>
          </div>
        )}
      </div>
      {audio.error && <p role="status">{audio.error}</p>}
      {audio.lastReceipt && !audio.error && (
        <p className="gh-audio-receipt">
          Last cue: {audio.lastReceipt.label} · {clockLabel(audio.lastReceipt.at)}. The cue
          indicates an update, not success or safety.
        </p>
      )}
      {audio.quietReceipts.length > 0 && (
        <details>
          <summary>Receipts kept quiet during voice</summary>
          <ul>
            {audio.quietReceipts.map((receipt) => (
              <li key={receipt.eventId}>
                {clockLabel(receipt.at)} · {receipt.label}
              </li>
            ))}
          </ul>
          <p>
            The latest summaries are shown here. Every original receipt remains in the journal;
            missed cues are not replayed.
          </p>
        </details>
      )}
    </aside>
  );
}
