'use client';

import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Headphones,
  Settings,
  X,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { useLocalVoice } from '../lib/hooks/useLocalVoice';
import { KOKORO_VOICES } from '../lib/local-voice';

interface LocalVoicePanelProps {
  reducedMotion?: boolean;
  elevenLabsPlayingChecker?: () => boolean;
  onClose?: () => void;
}

export default function LocalVoicePanel({
  reducedMotion = false,
  elevenLabsPlayingChecker,
  onClose,
}: LocalVoicePanelProps): JSX.Element {
  const {
    state,
    config,
    progress,
    isEnabled,
    isReady,
    isDownloading,
    downloadProgress,
    estimatedDownloadMB,
    enable,
    disable,
    setTTSEnabled,
    setSTTEnabled,
    setTTSVoice,
    setTTSRate,
  } = useLocalVoice(elevenLabsPlayingChecker);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggle = useCallback(async () => {
    if (isEnabled) {
      disable();
    } else {
      await enable();
    }
  }, [isEnabled, enable, disable]);

  const getStatusColor = () => {
    if (state.error) return 'red';
    if (isDownloading) return 'amber';
    if (isReady) return 'emerald';
    return 'gray';
  };

  const getStatusText = () => {
    if (state.error) return state.error;
    if (isDownloading) return progress.message || 'Provisioning headset models…';
    if (isReady) return 'Headset online';
    if (!isEnabled) return 'Headset stowed';
    return 'Headset not loaded';
  };

  return (
    <div className="p-5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isEnabled && isReady && !isDownloading
                ? 'bg-gradient-to-br from-violet-500/30 to-violet-600/30 border border-violet-500/40'
                : 'bg-gray-800/60 border border-gray-700/50'
            )}
          >
            <Headphones
              className={clsx(
                'w-5 h-5',
                isEnabled && isReady && !isDownloading ? 'text-violet-400' : 'text-gray-500'
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
              Local Comms
              <span className="text-2xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-medium">
                Beta
              </span>
            </h3>
            <p className="text-xs text-gray-500">Operator headset — on-device mic and earpiece</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Main Toggle */}
      <div className="mb-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-300">Enable headset</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {!isEnabled
                ? `Provisions ~${estimatedDownloadMB} MB on first enable (one-time)`
                : getStatusText()}
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={isDownloading}
            className={clsx(
              'relative w-12 h-7 rounded-full transition-all duration-200',
              isEnabled ? 'bg-violet-500' : 'bg-gray-700',
              isDownloading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div
              className={clsx(
                'absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200',
                isEnabled ? 'left-6' : 'left-1'
              )}
            />
          </button>
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {progress.message}
              </span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-300',
                  !reducedMotion && 'animate-pulse'
                )}
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {isEnabled && !isDownloading && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                getStatusColor() === 'emerald' && 'bg-emerald-400',
                getStatusColor() === 'amber' && 'bg-amber-400',
                getStatusColor() === 'red' && 'bg-red-400',
                getStatusColor() === 'gray' && 'bg-gray-500'
              )}
            />
            <span
              className={clsx(
                'text-xs',
                getStatusColor() === 'emerald' && 'text-emerald-400',
                getStatusColor() === 'amber' && 'text-amber-400',
                getStatusColor() === 'red' && 'text-red-400',
                getStatusColor() === 'gray' && 'text-gray-500'
              )}
            >
              {getStatusText()}
            </span>
            {state.webGpuAvailable && (
              <span className="text-2xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" />
                WebGPU
              </span>
            )}
            {state.fallbackTTS === 'web-speech' && (
              <span className="text-2xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                Browser TTS
              </span>
            )}
          </div>
        )}
      </div>

      {/* Feature Toggles */}
      {isEnabled && (
        <div className="space-y-3">
          {/* Speech-to-Text */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 border border-gray-800/30">
            <div className="flex items-center gap-2">
              {config.sttEnabled ? (
                <Mic className="w-4 h-4 text-emerald-400" />
              ) : (
                <MicOff className="w-4 h-4 text-gray-500" />
              )}
              <div>
                <div className="text-sm text-gray-300">Push-to-talk</div>
                <div className="text-2xs text-gray-500">Brief rationale into the decision log</div>
              </div>
            </div>
            <button
              onClick={() => setSTTEnabled(!config.sttEnabled)}
              className={clsx(
                'w-10 h-6 rounded-full transition-colors',
                config.sttEnabled ? 'bg-emerald-500' : 'bg-gray-700'
              )}
            >
              <div
                className={clsx(
                  'w-4 h-4 rounded-full bg-white shadow-sm transition-all',
                  config.sttEnabled ? 'ml-5' : 'ml-1'
                )}
              />
            </button>
          </div>

          {/* Text-to-Speech */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 border border-gray-800/30">
            <div className="flex items-center gap-2">
              {config.ttsEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
              <div>
                <div className="text-sm text-gray-300">Headset earpiece</div>
                <div className="text-2xs text-gray-500">
                  Hear injects and decision prompts in-headset
                </div>
              </div>
            </div>
            <button
              onClick={() => setTTSEnabled(!config.ttsEnabled)}
              className={clsx(
                'w-10 h-6 rounded-full transition-colors',
                config.ttsEnabled ? 'bg-emerald-500' : 'bg-gray-700'
              )}
            >
              <div
                className={clsx(
                  'w-4 h-4 rounded-full bg-white shadow-sm transition-all',
                  config.ttsEnabled ? 'ml-5' : 'ml-1'
                )}
              />
            </button>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 transition-colors"
          >
            <span className="text-xs flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Advanced settings
            </span>
            <span className="text-xs">{showAdvanced ? '−' : '+'}</span>
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-3 p-3 rounded-xl bg-gray-900/20 border border-gray-800/30">
              {/* Voice Selection (TTS) */}
              {config.ttsEnabled && !state.fallbackTTS && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Kokoro Voice</label>
                  <select
                    value={config.ttsVoice}
                    onChange={(e) => setTTSVoice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-sm text-gray-200 focus:outline-none focus:border-violet-500/50"
                  >
                    {KOKORO_VOICES.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speech Rate */}
              {config.ttsEnabled && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Speech Rate: {config.ttsRate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.ttsRate}
                    onChange={(e) => setTTSRate(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-2xs text-gray-600 mt-1">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-violet-200">
              <strong>Net discipline:</strong> Processing stays on this device. Scripted dispatch VO
              still has the net — local comms yield when that path is live.
            </p>
            <p className="text-2xs text-violet-300/70 mt-1">
              Models cache after first provision. English only. Opt-in; nothing downloads until you
              enable headset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact toggle button for header bar
 */
export function LocalVoiceToggle({
  onClick,
  isEnabled,
  isReady,
  isLoading,
  className,
}: {
  onClick: () => void;
  isEnabled: boolean;
  isReady: boolean;
  isLoading: boolean;
  className?: string;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={clsx(
        'p-2 rounded-xl transition-all flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px]',
        isLoading
          ? 'text-amber-400 bg-amber-500/20'
          : isEnabled && isReady
            ? 'text-violet-400 bg-violet-500/20 hover:bg-violet-500/30'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
        className
      )}
      aria-label={isEnabled ? 'Local comms headset settings' : 'Enable local comms headset'}
      title={
        isLoading
          ? 'Provisioning headset models…'
          : isEnabled && isReady
            ? 'Headset online — local comms'
            : 'Enable headset (local comms)'
      }
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
      ) : (
        <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  );
}

/**
 * Push-to-talk microphone button
 */
export function PushToTalkButton({
  isListening,
  isEnabled,
  onStart,
  onStop,
  className,
}: {
  isListening: boolean;
  isEnabled: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}): JSX.Element | null {
  if (!isEnabled) return null;

  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      onTouchStart={(e) => {
        e.preventDefault();
        onStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onStop();
      }}
      className={clsx(
        'p-3 rounded-xl transition-all flex items-center justify-center gap-2',
        isListening
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
          : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30',
        className
      )}
      title={isListening ? 'Release to log' : 'Push to talk'}
    >
      {isListening ? (
        <>
          <Mic className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">On net…</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5" />
          <span className="text-sm font-medium">Push to talk</span>
        </>
      )}
    </button>
  );
}

/**
 * Read aloud button for content
 */
export function ReadAloudButton({
  onClick,
  isSpeaking,
  isEnabled,
  label,
  className,
}: {
  onClick: () => void;
  isSpeaking: boolean;
  isEnabled: boolean;
  label?: string;
  className?: string;
}): JSX.Element | null {
  if (!isEnabled) return null;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-2 rounded-lg transition-all flex items-center gap-1.5',
        isSpeaking
          ? 'bg-violet-500/30 text-violet-300'
          : 'text-gray-400 hover:text-violet-400 hover:bg-violet-500/10',
        className
      )}
      title={isSpeaking ? 'On net…' : 'Hear inject'}
    >
      {isSpeaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
      {label && <span className="text-xs">{label}</span>}
    </button>
  );
}
