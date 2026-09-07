'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  HelpCircle,
  Clock3,
  Download,
  FileText,
  Flag,
  GitBranch,
  Hourglass,
  Inbox,
  Layers3,
  MapPin,
  Pause,
  Play,
  Radio,
  Settings2,
  Shield,
  Square,
  Upload,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import {
  forkGlasshouse,
  compareGlasshouseNextCheckpoint,
  getGlasshouseObservations,
  getGlasshouseReport,
  GLASSHOUSE_CONTROLS,
  GLASSHOUSE_HANDOVER,
  type GlasshouseSession as Session,
  type GlasshouseReport as Report,
  type GlasshouseMode as Mode,
  type GlasshouseAssetId as AssetId,
  type GlasshouseActorId as ActorId,
  type GlasshouseDecision as Decision,
  type GlasshouseObservation as Observation,
} from '@gsoc-decision-ops/core';
import { downloadSession, importSession } from '@/lib/glasshouse-export';
import PlanComposer, {
  actorLabels,
  assetLabels,
  clockLabel,
  type ComposerDraft,
} from './PlanComposer';
import Review from './Review';
import { useGlasshouse } from './useGlasshouse';
import OfflinePanel from './OfflinePanel';
import PracticeHistory from './PracticeHistory';
import {
  activateGlasshouseOfflinePack,
  getGlasshouseOfflineStatus,
} from '@/lib/glasshouse-offline';

function SceneLoadFailure({ onFallback }: { onFallback: () => void }) {
  useEffect(() => onFallback(), [onFallback]);
  return null;
}

const CampusScene = dynamic<{
  state?: Session;
  selected: AssetId;
  onSelect: (asset: AssetId) => void;
  motion: boolean;
  onFallback: () => void;
}>(() => import('./CampusScene').catch(() => ({ default: SceneLoadFailure })), {
  ssr: false,
  loading: () => (
    <div className="gh-scene gh-scene-loading">
      Loading optional architecture… The schematic below remains usable.
    </div>
  ),
});
const INITIAL_UNKNOWNS = [
  'Whether the entrance image is current.',
  'Whether the connector failure is a fault or compromise.',
  'How long manual verification can sustain operations.',
];

function Schematic({
  selected,
  onSelect,
  observations,
  state,
}: {
  selected: AssetId;
  onSelect: (asset: AssetId) => void;
  observations: Observation[];
  state: Session;
}) {
  return (
    <div className="gh-schematic">
      <svg viewBox="0 0 360 260" role="img" aria-labelledby="campus-title campus-desc">
        <title id="campus-title">Glasshouse campus dependencies</title>
        <desc id="campus-desc">
          Service entrance and dispatch both depend on the identity connector. A manual access
          control can provide a bounded alternative. Select an asset using the buttons below.
        </desc>
        <defs>
          <pattern id="gh-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#b6bcae" strokeWidth=".4" opacity=".2" />
          </pattern>
        </defs>
        <rect width="360" height="260" fill="url(#gh-grid)" />
        <path d="M23 220H337M180 30V220" stroke="#68716b" strokeWidth="13" />
        <path d="M23 220H337" stroke="#c1ac79" strokeWidth="1" strokeDasharray="7 8" />
        <path
          d="M77 172V105H181M181 105H285V159"
          fill="none"
          stroke="#d5b275"
          strokeDasharray="4 5"
        />
        <text x="21" y="29" fill="#b2b5a9" fontSize="9" letterSpacing="2">
          N ↑
        </text>
        <text x="227" y="244" fill="#9ba398" fontSize="8" letterSpacing="1.4">
          SERVICE ROAD
        </text>
        <g>
          <rect
            x="116"
            y="51"
            width="130"
            height="70"
            rx="2"
            fill={selected === 'connector' ? '#846e42' : '#424b40'}
            stroke={selected === 'connector' ? '#efd096' : '#7e8d7a'}
          />
          <rect x="129" y="63" width="104" height="12" fill="#283e39" />
          <path
            d="M145 63V75M161 63V75M177 63V75M193 63V75M209 63V75"
            stroke="#92a092"
            strokeWidth="2"
          />
          <text x="181" y="94" textAnchor="middle" fill="#f0e7d4" fontSize="11">
            RESEARCH / IDENTITY
          </text>
          <text x="181" y="109" textAnchor="middle" fill="#cccfbe" fontSize="8">
            CONNECTOR DEPENDENCY
          </text>
        </g>
        <g>
          <rect
            x="26"
            y="146"
            width="101"
            height="54"
            rx="2"
            fill={selected === 'entrance' ? '#846e42' : '#424b40'}
            stroke={selected === 'entrance' ? '#efd096' : '#7e8d7a'}
          />
          <rect x="30" y="155" width="16" height="37" fill="#2c3930" />
          <text x="83" y="170" textAnchor="middle" fill="#f0e7d4" fontSize="10">
            SERVICE
          </text>
          <text x="83" y="184" textAnchor="middle" fill="#f0e7d4" fontSize="10">
            ENTRANCE
          </text>
        </g>
        <g>
          <rect
            x="232"
            y="139"
            width="105"
            height="61"
            rx="2"
            fill={selected === 'dispatch' ? '#846e42' : '#424b40'}
            stroke={selected === 'dispatch' ? '#efd096' : '#7e8d7a'}
          />
          <path d="M245 190H262M270 190H287M295 190H312" stroke="#b4b7a7" strokeWidth="9" />
          <text x="285" y="164" textAnchor="middle" fill="#f0e7d4" fontSize="11">
            DISPATCH
          </text>
          <text x="285" y="178" textAnchor="middle" fill="#cccfbe" fontSize="8">
            ESSENTIAL SHIPMENT
          </text>
        </g>
        {[27, 47, 67, 284, 308, 331].map((x, index) => (
          <circle key={x} cx={x} cy={60 + (index % 3) * 19} r={7} fill="#687959" opacity=".65" />
        ))}
      </svg>
      <div className="gh-map-key">
        <span>
          <i />
          Shared identity dependency
        </span>
        <span>Observed state only</span>
      </div>
      <div className="gh-asset-buttons">
        {(Object.keys(assetLabels) as AssetId[]).map((asset) => {
          const count = observations.filter((observation) => observation.asset === asset).length;
          const pending = state.actions.filter(
            (action) =>
              action.scope === asset && ['requested', 'approved', 'started'].includes(action.status)
          ).length;
          return (
            <button
              key={asset}
              aria-pressed={selected === asset}
              className={selected === asset ? 'is-selected' : ''}
              onClick={() => onSelect(asset)}
            >
              <MapPin size={15} />
              <span>
                {assetLabels[asset]}
                <small>
                  {count} known reports{pending ? ` · ${pending} pending` : ''}
                </small>
              </span>
              <ChevronRight size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ObservationCard({
  observation,
  selected,
  onSelect,
  knownIds,
  relationship,
}: {
  observation: Observation;
  selected: boolean;
  onSelect: () => void;
  knownIds: Set<string>;
  relationship?: string;
}) {
  return (
    <article
      className={`gh-observation ${selected ? 'is-selected' : ''} ${relationship ? 'has-relationship' : ''}`}
    >
      <button className="gh-observation-select" onClick={onSelect} aria-expanded={selected}>
        <div className="gh-observation-top">
          <span>{observation.source}</span>
          <time>{clockLabel(observation.receivedAt)}</time>
        </div>
        <p>{observation.claim}</p>
        <div className="gh-observation-bottom">
          <span
            className={`gh-evidence-status ${observation.status === 'confirmed' ? 'is-confirmed' : ''}`}
          >
            {observation.status === 'confirmed'
              ? 'Confirmed in exercise'
              : observation.status === 'assessed'
                ? 'Assessed'
                : 'Reported'}
          </span>
          <span>{assetLabels[observation.asset]}</span>
        </div>
        {relationship && (
          <span className="gh-relationship">{relationship} the selected report</span>
        )}
      </button>
      {selected && (
        <div className="gh-observation-details">
          <dl>
            <div>
              <dt>Observed</dt>
              <dd>{clockLabel(observation.observedAt)}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{clockLabel(observation.receivedAt)}</dd>
            </div>
            <div>
              <dt>Provenance</dt>
              <dd>{observation.provenance}</dd>
            </div>
            <div>
              <dt>Limitation</dt>
              <dd>{observation.limitation}</dd>
            </div>
            <div>
              <dt>Known by</dt>
              <dd>{observation.knownBy.map((actor) => actorLabels[actor]).join(', ')}</dd>
            </div>
          </dl>
          {observation.corrects && knownIds.has(observation.corrects) && (
            <p className="gh-evidence-link">
              Corrects {observation.corrects}. The earlier claim is preserved.
            </p>
          )}
          {observation.corroborates.some((id) => knownIds.has(id)) && (
            <p className="gh-evidence-link">
              Corroborates {observation.corroborates.filter((id) => knownIds.has(id)).join(', ')}
            </p>
          )}
          {observation.contradicts.some((id) => knownIds.has(id)) && (
            <p className="gh-evidence-link">
              Contradicts {observation.contradicts.filter((id) => knownIds.has(id)).join(', ')}
            </p>
          )}
          <small className="gh-mono">{observation.id}</small>
        </div>
      )}
    </article>
  );
}

function Launch({
  ready,
  onStart,
  onImport,
}: {
  ready: boolean;
  onStart: (mode: Mode, seed: number) => void;
  onImport: () => void;
}) {
  const [seed, setSeed] = useState('610');
  const validSeed =
    /^\d+$/.test(seed) &&
    Number.isSafeInteger(Number(seed)) &&
    Number(seed) >= 0 &&
    Number(seed) <= 4294967295;
  return (
    <div className="gh-launch">
      <div className="gh-launch-story">
        <span className="gh-eyebrow">One campus. A changing picture.</span>
        <div className="gh-case-title">
          <h1 id="gh-page-title" tabIndex={-1}>
            Glasshouse<span>/ 06:10</span>
          </h1>
          <span className="gh-outline-stamp">
            WATCH
            <br />
            COMMANDER
          </span>
        </div>
        <p className="gh-lede">
          The next shift is arriving.
          <br />
          The reports do not agree.
        </p>
        <p>
          A fictional research and distribution campus. Inconsistent badge readers. A failing
          identity connector. A time-sensitive shipment. And an entrance image no one has verified.
        </p>
        <div className="gh-launch-objective">
          <Shield size={25} />
          <div>
            <span className="gh-eyebrow">Your objective</span>
            <p>
              Protect people, maintain essential operations, establish scope, and hand over a
              controlled situation.
            </p>
          </div>
        </div>
        <div className="gh-launch-facts">
          <span>
            <Clock3 size={16} />
            One simulated hour
          </span>
          <span>
            <Users size={16} />
            Three recurring roles
          </span>
          <span>
            <FileText size={16} />
            Evidence-backed review
          </span>
        </div>
        <div className="gh-launch-art" aria-hidden="true">
          <span className="gh-art-time">06:10</span>
          <div className="gh-art-building gh-art-building-one" />
          <div className="gh-art-building gh-art-building-two" />
          <div className="gh-art-building gh-art-building-three" />
          <div className="gh-art-road" />
          <span className="gh-art-caption">GLASSHOUSE CAMPUS / MORNING WATCH</span>
        </div>
      </div>
      <section className="gh-launch-modes">
        <span className="gh-eyebrow">Choose how to practice</span>
        <h2>Take the watch.</h2>
        <p>Start with an actionable handover. No account, microphone or cloud model is needed.</p>
        <div className="gh-mode-options">
          {(
            [
              {
                mode: 'preview',
                title: 'Preview',
                time: 'One choice & consequence',
                text: 'Meet the case, make a bounded decision and inspect its consequence. Continue the same run when you are ready.',
              },
              {
                mode: 'guided',
                title: 'Guided practice',
                time: 'Context help available',
                text: 'The complete mission with optional help. Take the time you need to read, consider and coordinate.',
              },
              {
                mode: 'independent',
                title: 'Independent practice',
                time: 'Your own judgment',
                text: 'The same case without substantive coaching. Pause, transcripts and all accessibility controls remain available.',
              },
            ] as const
          ).map((option) => (
            <button
              className={`gh-mode-card ${option.mode === 'guided' ? 'gh-mode-recommended' : ''}`}
              key={option.mode}
              disabled={!ready || !validSeed}
              onClick={() => onStart(option.mode, Number(seed))}
            >
              <div>
                <h3>{option.title}</h3>
                <span>{option.time}</span>
              </div>
              <p>{option.text}</p>
              <ArrowUpRight size={21} />
            </button>
          ))}
        </div>
        <details className="gh-seed">
          <summary>Reproducible scenario seed</summary>
          <label className="gh-field">
            Seed (0–4,294,967,295)
            <input
              inputMode="numeric"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              aria-invalid={!validSeed}
            />
          </label>
          {!validSeed && <p className="gh-error-text">Enter a whole number in the stated range.</p>}
          <p>
            The same seed uses the same authored conditions. It does not rank difficulty or
            competence.
          </p>
        </details>
        <button className="gh-text-button" onClick={onImport}>
          <Upload size={15} />
          Restore a downloaded Glasshouse session
        </button>
        <p className="gh-launch-disclaimer">
          Synthetic learning exercise. Local by default. Intended learning benefits have not yet
          been validated.
        </p>
      </section>
    </div>
  );
}

export default function Glasshouse() {
  const [view, setView] = useState<'command' | 'review'>('command');
  const [settings, setSettings] = useState(false);
  const [starting, setStarting] = useState(false);
  const engine = useGlasshouse(view === 'command' && !settings);
  const { state, send } = engine;
  const focusContext = useRef(`${view}:${state?.sessionId ?? 'launch'}`);
  useEffect(() => {
    const nextContext = `${view}:${state?.sessionId ?? 'launch'}`;
    if (focusContext.current !== nextContext) {
      document.getElementById('gh-page-title')?.focus({ preventScroll: true });
      focusContext.current = nextContext;
    }
  }, [view, state?.sessionId]);
  const [mobileArea, setMobileArea] = useState<'evidence' | 'decision' | 'situation'>('evidence');
  const [selectedAsset, setSelectedAsset] = useState<AssetId>('entrance');
  const [filter, setFilter] = useState<'all' | AssetId>('all');
  const [selectedEvidence, setSelectedEvidence] = useState('');
  const [motion, setMotion] = useState(false);
  const [architecture, setArchitecture] = useState(false);
  const [quickReplay, setQuickReplay] = useState<{ source: Session; decisionId: string } | null>(
    null
  );
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [actor, setActor] = useState<ActorId>('analyst');
  const [revision, setRevision] = useState<Decision>();
  // Uncommitted composition stays in memory, separate from the canonical simulation journal.
  const composerDrafts = useRef(new Map<string, ComposerDraft>());
  const composerKey = `${state?.sessionId ?? 'launch'}:${revision?.id ?? 'new'}`;
  useEffect(() => {
    composerDrafts.current.clear();
    setRevision(undefined);
    setBrief({
      recommendation: '',
      uncertainty: '',
      alternative: '',
      consequence: '',
      reviewTrigger: '',
    });
    setHandoff({ summary: '', owner: '', reviewTrigger: '' });
    setBriefOpen(false);
    setHandoffOpen(false);
    setSelectedEvidence('');
  }, [state?.sessionId]);
  const [briefOpen, setBriefOpen] = useState(false);
  const [brief, setBrief] = useState({
    recommendation: '',
    uncertainty: '',
    alternative: '',
    consequence: '',
    reviewTrigger: '',
  });
  const [handoff, setHandoff] = useState({ summary: '', owner: '', reviewTrigger: '' });
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [comparison, setComparison] = useState<Report | null>(null);
  const [comparisonNote, setComparisonNote] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);
  const observations = useMemo(() => (state ? getGlasshouseObservations(state) : []), [state]);
  const selectedObservation = observations.find((item) => item.id === selectedEvidence);
  const report = useMemo(
    () => (state ? getGlasshouseReport(state, engine.activeSeconds) : null),
    [state, engine.activeSeconds]
  );
  const readOnly = engine.readOnly;
  const inactive = !state || state.lifecycle !== 'active' || readOnly;
  const stopSpeech = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  useEffect(() => {
    const stop = () => {
      if (document.hidden && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
    };
    document.addEventListener('visibilitychange', stop);
    return () => {
      document.removeEventListener('visibilitychange', stop);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);
  function playHandover() {
    if (!('speechSynthesis' in window)) {
      engine.setError(
        'This browser has no speech playback. The complete handover transcript is available below.'
      );
      return;
    }
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.localService && item.lang.startsWith('en'));
    if (!voice) {
      engine.setError(
        'No local English voice is available in this browser. Read the complete handover transcript below.'
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(GLASSHOUSE_HANDOVER);
    utterance.voice = voice;
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }
  function openReview() {
    stopSpeech();
    setView('review');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function step(delta?: number) {
    if (!state) return;
    const next = [...state.queue]
      .sort((a, b) => a.at - b.at || a.priority - b.priority || a.order - b.order)
      .find((event) => event.at >= state.tick)?.at;
    const to =
      delta === undefined
        ? (next ?? Math.min(60, state.tick + 1))
        : Math.min(state.tick + delta, next ?? 60);
    if (send({ type: 'advance', to })) setSelectedEvidence('');
  }
  async function handleImport(file?: File) {
    if (!file) return;
    try {
      const imported = await importSession(file);
      if (state) downloadSession(state);
      engine.replace(imported, true);
      setView('command');
      setComparison(null);
    } catch (cause) {
      engine.setError(
        cause instanceof Error ? cause.message : 'The session could not be restored.'
      );
    } finally {
      if (inputFile.current) inputFile.current.value = '';
    }
  }
  async function startSession(mode: Mode, seed: number) {
    setStarting(true);
    let offlineError = '';
    try {
      const offline = await getGlasshouseOfflineStatus();
      if (offline.ready && !offline.active) await activateGlasshouseOfflinePack(offline.version);
    } catch (cause) {
      offlineError =
        cause instanceof Error
          ? cause.message
          : 'Offline activation was unavailable. Online play remains available.';
    }
    engine.start(mode, seed);
    setView('command');
    setStarting(false);
    if (offlineError) engine.setError(offlineError);
  }
  function fork(decisionId: string) {
    if (!state || !report) return;
    try {
      const next = forkGlasshouse(state, decisionId, crypto.randomUUID());
      downloadSession(state);
      setComparison(report);
      setComparisonNote(
        'The original complete checkpoint is preserved. Commit one alternative to inspect a bounded, modeled comparison.'
      );
      setQuickReplay({ source: state, decisionId });
      engine.replace(next);
      setView('command');
      setRevision(undefined);
      setMobileArea('decision');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (cause) {
      engine.setError(cause instanceof Error ? cause.message : 'The branch could not be created.');
    }
  }
  function compareNextConsequence() {
    if (!state || !quickReplay) return;
    try {
      const result = compareGlasshouseNextCheckpoint(
        quickReplay.source,
        quickReplay.decisionId,
        state,
        crypto.randomUUID()
      );
      engine.replace(result.branch);
      setComparison(getGlasshouseReport(result.original));
      setComparisonNote(result.reason);
      setQuickReplay(null);
      openReview();
    } catch (cause) {
      engine.setError(
        cause instanceof Error
          ? cause.message
          : 'The checkpoint comparison could not be reconstructed.'
      );
    }
  }
  return (
    <main className={`gh-app ${motion ? '' : 'gh-motion-off'}`}>
      <a href="#gh-workspace" className="gh-skip">
        Skip to exercise
      </a>
      <header className="gh-header">
        <Link href="/" className="gh-brand" aria-label="Hourglass Command home">
          <span className="gh-brand-icon">
            <Hourglass size={25} strokeWidth={1.5} />
          </span>
          <span>
            HOURGLASS<span>COMMAND</span>
          </span>
        </Link>
        <div className="gh-header-center">
          <span className="gh-status-dot" />
          Synthetic exercise<span className="gh-header-divider">/</span>Local by default
        </div>
        <div className="gh-header-actions">
          {state && (
            <button
              className={`gh-top-link ${view === 'review' ? 'is-active' : ''}`}
              onClick={view === 'review' ? () => setView('command') : openReview}
            >
              <FileText size={16} />
              <span>{view === 'review' ? 'Command' : 'Review'}</span>
            </button>
          )}
          <button
            className="gh-icon-button"
            aria-label="Open display and local data settings"
            aria-expanded={settings}
            onClick={() => setSettings((value) => !value)}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>
      <input
        ref={inputFile}
        type="file"
        accept=".json,application/json"
        className="gh-visually-hidden"
        aria-label="Import Glasshouse JSON session"
        tabIndex={-1}
        onChange={(event) => void handleImport(event.target.files?.[0])}
      />
      {(engine.unsaved || readOnly) && (
        <aside className="gh-unsaved" role="status">
          <div>
            <strong>
              {readOnly
                ? 'Another tab owns this journal.'
                : 'Changes are not saved on this device.'}
            </strong>
            <p>
              {engine.saveStatus}{' '}
              {readOnly
                ? 'Take over explicitly to continue here.'
                : 'You may continue in memory. Download a backup before leaving; unsaved changes can be lost.'}
            </p>
          </div>
          <div className="gh-button-row">
            {state && (
              <button className="gh-button" onClick={() => downloadSession(state)}>
                <Download size={15} />
                Backup
              </button>
            )}
            <button className="gh-button" onClick={() => void engine.takeover()}>
              {readOnly ? 'Take over here' : 'Retry local saving'}
            </button>
            {engine.recoveryText && (
              <button
                className="gh-button"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([engine.recoveryText], { type: 'application/json' })
                  );
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'hourglass-quarantined-recovery.json';
                  link.click();
                  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Download preserved recovery copy
              </button>
            )}
          </div>
        </aside>
      )}
      {engine.error && (
        <aside className="gh-error" role="alert">
          <span>{engine.error}</span>
          <button
            className="gh-icon-button"
            aria-label="Dismiss message"
            onClick={() => engine.setError('')}
          >
            <X size={18} />
          </button>
        </aside>
      )}
      {settings && (
        <section className="gh-settings gh-panel" aria-labelledby="settings-title">
          <div className="gh-panel-heading">
            <h2 id="settings-title">Display & local data</h2>
            <button
              className="gh-icon-button"
              aria-label="Close settings"
              onClick={() => setSettings(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="gh-settings-grid">
            <div>
              <label className="gh-checkbox">
                <input
                  type="checkbox"
                  checked={motion}
                  onChange={(event) => setMotion(event.target.checked)}
                />
                Enable optional motion
              </label>
              <p className="gh-helper">
                Motion starts off. System reduced-motion settings are respected. The schematic
                provides every essential action.
              </p>
              <p className="gh-helper">
                Audio starts off. Handover playback uses an available local browser voice. No
                microphone or voice model download is requested.
              </p>
            </div>
            <div>
              <p className="gh-save-state">
                <span className="gh-status-dot" />
                {engine.saveStatus}
              </p>
              <div className="gh-button-row">
                {state && (
                  <button className="gh-button" onClick={() => downloadSession(state)}>
                    <ArrowDownToLine size={16} />
                    Backup session
                  </button>
                )}
                <button className="gh-button" onClick={() => inputFile.current?.click()}>
                  <Upload size={16} />
                  Import backup
                </button>
              </div>
              <p className="gh-helper">
                Import accepts validated Glasshouse JSON up to 5 MB. An existing run is downloaded
                before it is replaced.
              </p>
              <button
                className="gh-text-button"
                onClick={() => {
                  if (state) downloadSession(state);
                  void engine.showLaunch();
                  setSettings(false);
                  setView('command');
                  setComparison(null);
                }}
              >
                Start a new mission · preserve this backup
              </button>
              <button
                className="gh-text-button gh-danger"
                onClick={() => setDeleteConfirm((value) => !value)}
              >
                Delete local Glasshouse journal
              </button>
              {deleteConfirm && (
                <div className="gh-notice">
                  <p>
                    This deletes this application’s Glasshouse journal on this device. Downloaded
                    backups and legacy scenario records are unaffected.
                  </p>
                  <div className="gh-button-row">
                    <button
                      className="gh-button"
                      onClick={() => {
                        void engine.deleteLocal();
                        setDeleteConfirm(false);
                        setSettings(false);
                        setView('command');
                      }}
                    >
                      Delete Glasshouse data
                    </button>
                    <button className="gh-text-button" onClick={() => setDeleteConfirm(false)}>
                      Keep data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <OfflinePanel hasSession={Boolean(state)} onError={engine.setError} />
          <PracticeHistory />
        </section>
      )}
      <div id="gh-workspace" tabIndex={-1}>
        {!state ? (
          <Launch
            ready={engine.ready && !starting}
            onStart={(mode, seed) => void startSession(mode, seed)}
            onImport={() => inputFile.current?.click()}
          />
        ) : view === 'review' && report ? (
          <Review
            report={report}
            state={state}
            onBack={() => setView('command')}
            onFork={fork}
            comparison={comparison}
            comparisonNote={comparisonNote}
            onError={engine.setError}
            onImprove={(improvement) => send({ type: 'improvement', improvement })}
            onDispute={(findingId, reason) => send({ type: 'dispute', findingId, reason })}
          />
        ) : (
          <>
            <div className="gh-command-heading">
              <div>
                <div className="gh-eyebrow">
                  <span className="gh-live-dot" />
                  {state.mode === 'preview'
                    ? 'Preview'
                    : state.mode === 'guided'
                      ? 'Guided practice'
                      : 'Independent practice'}
                  <span>/</span>
                  {state.lifecycle === 'active' ? 'Morning watch' : state.lifecycle}
                </div>
                <h1 id="gh-page-title" tabIndex={-1}>
                  Glasshouse <span>/ {clockLabel(state.tick)}</span>
                </h1>
                <p>Protect people. Keep essential operations viable. Establish what is known.</p>
              </div>
              <div className="gh-clock">
                <span className="gh-eyebrow">Simulated time</span>
                <div>
                  <span>{clockLabel(state.tick)}</span>
                  <span className="gh-clock-offset">+{state.tick} min</span>
                </div>
                <span className="gh-clock-label">
                  {state.paused
                    ? 'Paused · deliberate steps still available'
                    : 'Deliberate pace · time advances only on your step'}
                </span>
              </div>
            </div>
            <div className="gh-command-toolbar">
              <div className="gh-button-row">
                <button className="gh-button gh-primary" disabled={inactive} onClick={() => step()}>
                  Next significant update
                  <ArrowRight size={17} />
                </button>
                <button
                  className="gh-button gh-compact"
                  disabled={inactive}
                  onClick={() => step(1)}
                >
                  +1 min
                </button>
                <button
                  className="gh-button gh-compact"
                  disabled={inactive}
                  onClick={() => send({ type: 'pause', paused: !state.paused })}
                >
                  {state.paused ? <Play size={15} /> : <Pause size={15} />}
                  {state.paused ? 'Resume' : 'Pause'}
                </button>
              </div>
              <div className="gh-toolbar-notes">
                <span>
                  <Clock3 size={14} />
                  Stops at authored events
                </span>
                {state.mode !== 'independent' && (
                  <button
                    className="gh-text-button"
                    onClick={() => {
                      if (!helpOpen) send({ type: 'help', topic: 'bounded-plan-context' });
                      setHelpOpen((value) => !value);
                    }}
                  >
                    <HelpCircle size={15} />
                    Context help
                  </button>
                )}
                <button className="gh-text-button" onClick={openReview}>
                  Review checkpoint
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
            {helpOpen && state.mode !== 'independent' && (
              <aside className="gh-help">
                <HelpCircle size={20} />
                <div>
                  <h2>A bounded first step</h2>
                  <p>
                    Choose verification or a reversible control that answers a material uncertainty.
                    Inspect its resources and lead time. Posture describes service operation;
                    treatment describes your risk strategy; authority determines whether this is a
                    recommendation, a request or an execution.
                  </p>
                  <p>
                    Use “Next significant update” to see a consequence. The clock stops at the next
                    authored event so you can reassess.
                  </p>
                </div>
                <button
                  className="gh-icon-button"
                  aria-label="Close context help"
                  onClick={() => setHelpOpen(false)}
                >
                  <X size={18} />
                </button>
              </aside>
            )}
            {state.parentSessionId && (
              <aside className="gh-branch-banner">
                <GitBranch size={18} />
                <span>
                  Alternative branch from +{state.forkAt} min. Original conditions preserved.
                  {comparison && ` Compare at +${comparison.simulatedMinutes} min.`}
                </span>
                {quickReplay && quickReplay.source.sessionId === state.parentSessionId && (
                  <button
                    className="gh-button"
                    disabled={inactive}
                    onClick={compareNextConsequence}
                  >
                    See next consequence & compare
                  </button>
                )}
                <button className="gh-text-button" onClick={openReview}>
                  Inspect comparison
                </button>
              </aside>
            )}
            {state.lifecycle !== 'active' && (
              <aside className="gh-terminal">
                <Flag size={22} />
                <div>
                  <h2>
                    {state.lifecycle === 'completed'
                      ? 'The watch is handed over.'
                      : 'The scenario ended with unresolved work.'}
                  </h2>
                  <p>{state.terminalReason}</p>
                </div>
                <button className="gh-button" onClick={openReview}>
                  Open causal debrief
                  <ArrowUpRight size={17} />
                </button>
              </aside>
            )}
            {state.mode === 'preview' &&
              state.actions.some((action) => ['completed', 'failed'].includes(action.status)) && (
                <aside className="gh-preview-complete">
                  <div>
                    <h2>Your first choice has a consequence.</h2>
                    <p>
                      Inspect the evidence and commitment below. Continue the same mission, with
                      your decision preserved.
                    </p>
                  </div>
                  <div className="gh-button-row">
                    <button className="gh-button" onClick={openReview}>
                      Review this checkpoint
                    </button>
                    <button
                      className="gh-button gh-primary"
                      onClick={() => send({ type: 'continue' })}
                    >
                      Continue mission
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </aside>
              )}
            <section className="gh-handover">
              <div>
                <button
                  className="gh-handover-toggle"
                  onClick={() => setHandoverOpen((value) => !value)}
                  aria-expanded={handoverOpen}
                >
                  <Radio size={19} />
                  <span>06:10 / Outgoing watch handover · transcript</span>
                  <ChevronRight size={17} className={handoverOpen ? 'is-rotated' : ''} />
                </button>
                <div className="gh-handover-audio">
                  {speaking ? (
                    <button className="gh-text-button" onClick={stopSpeech}>
                      <Square size={14} />
                      Stop playback
                    </button>
                  ) : (
                    <button className="gh-text-button" onClick={playHandover}>
                      <Volume2 size={16} />
                      Listen locally
                    </button>
                  )}
                </div>
              </div>
              {handoverOpen && <p>{GLASSHOUSE_HANDOVER}</p>}
            </section>
            <nav className="gh-mobile-tabs" aria-label="Workspace areas">
              {(
                [
                  { id: 'evidence', label: 'Evidence', Icon: Inbox },
                  { id: 'decision', label: 'Decide', Icon: Shield },
                  { id: 'situation', label: 'Situation', Icon: MapPin },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  aria-current={mobileArea === tab.id ? 'page' : undefined}
                  className={mobileArea === tab.id ? 'is-selected' : ''}
                  onClick={() => setMobileArea(tab.id)}
                >
                  <tab.Icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="gh-workspace-grid">
              <div
                className={`gh-workspace-area gh-evidence-area ${mobileArea === 'evidence' ? 'gh-mobile-active' : ''}`}
              >
                <section className="gh-panel gh-inbox">
                  <div className="gh-panel-heading">
                    <div>
                      <span className="gh-eyebrow">01 / Incoming evidence</span>
                      <h2>
                        The picture so far{' '}
                        <span className="gh-count-badge">{observations.length}</span>
                      </h2>
                    </div>
                    <Inbox size={22} />
                  </div>
                  <label className="gh-field gh-filter">
                    Show reports
                    <select
                      value={filter}
                      onChange={(event) => setFilter(event.target.value as 'all' | AssetId)}
                    >
                      <option value="all">All campus assets</option>
                      {Object.entries(assetLabels).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="gh-inbox-list" aria-live="polite" aria-relevant="additions">
                    {[...observations]
                      .filter((item) => filter === 'all' || item.asset === filter)
                      .reverse()
                      .map((observation) => (
                        <ObservationCard
                          key={observation.id}
                          observation={observation}
                          relationship={
                            selectedObservation && selectedObservation.id !== observation.id
                              ? selectedObservation.corrects === observation.id ||
                                observation.corrects === selectedObservation.id
                                ? 'Correction linked to'
                                : selectedObservation.contradicts.includes(observation.id) ||
                                    observation.contradicts.includes(selectedObservation.id)
                                  ? 'Contradicts'
                                  : selectedObservation.corroborates.includes(observation.id) ||
                                      observation.corroborates.includes(selectedObservation.id)
                                    ? 'Corroborates'
                                    : undefined
                              : undefined
                          }
                          knownIds={new Set(observations.map((item) => item.id))}
                          selected={selectedEvidence === observation.id}
                          onSelect={() =>
                            setSelectedEvidence((value) =>
                              value === observation.id ? '' : observation.id
                            )
                          }
                        />
                      ))}
                    {!observations.some((item) => filter === 'all' || item.asset === filter) && (
                      <div className="gh-empty">
                        <Inbox size={24} />
                        <p>No reports for this asset yet.</p>
                        <button className="gh-text-button" onClick={() => setFilter('all')}>
                          Show all evidence
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="gh-helper">
                    Select a report to inspect its provenance, limitations and links. Earlier claims
                    remain available after corrections.
                  </p>
                </section>
                <section className="gh-panel gh-assessment">
                  <span className="gh-eyebrow">Working assessment</span>
                  <h2>{state.decisions.at(-1)?.hypothesis || 'Scope remains unestablished.'}</h2>
                  <p>
                    {state.decisions.at(-1)
                      ? `Last recorded likelihood: ${state.decisions.at(-1)!.likelihood}. Assessment confidence: ${state.decisions.at(-1)!.confidence}.`
                      : 'A reported image and a technical failure may have different explanations. Neither establishes the other.'}
                  </p>
                  <details open>
                    <summary>Material unknowns</summary>
                    <ul>
                      {INITIAL_UNKNOWNS.map((unknown, index) => (
                        <li key={index}>{unknown}</li>
                      ))}
                    </ul>
                    <p className="gh-helper">
                      Opening questions to revisit against incoming evidence; these are not
                      hidden-world findings.
                    </p>
                  </details>
                </section>
              </div>
              <div
                className={`gh-workspace-area gh-decision-area ${mobileArea === 'decision' ? 'gh-mobile-active' : ''}`}
              >
                <PlanComposer
                  key={composerKey}
                  observations={observations}
                  revision={revision}
                  initialDraft={composerDrafts.current.get(composerKey)}
                  onDraftChange={(draft) => composerDrafts.current.set(composerKey, draft)}
                  onCancelRevision={() => {
                    composerDrafts.current.delete(composerKey);
                    setRevision(undefined);
                  }}
                  disabled={inactive}
                  onCommit={(plan, revisionOf) => {
                    const ok = send({ type: 'plan', plan, ...(revisionOf ? { revisionOf } : {}) });
                    if (ok) {
                      composerDrafts.current.clear();
                      setRevision(undefined);
                    }
                    return ok;
                  }}
                />
                <section className="gh-panel gh-commitments">
                  <div className="gh-panel-heading">
                    <div>
                      <span className="gh-eyebrow">Execution is a lifecycle</span>
                      <h2>
                        Commitments <span className="gh-count-badge">{state.actions.length}</span>
                      </h2>
                    </div>
                  </div>
                  {!state.actions.length ? (
                    <div className="gh-empty">
                      <Shield size={26} />
                      <p>No resources committed yet.</p>
                      <small>
                        Your first plan will create a visible receipt with an owner and expected
                        update.
                      </small>
                    </div>
                  ) : (
                    [...state.actions].reverse().map((action) => {
                      const control = GLASSHOUSE_CONTROLS.find(
                        (item) => item.id === action.control
                      )!;
                      const decision = state.decisions.find(
                        (item) => item.id === action.decisionId
                      );
                      const receipt = state.events
                        .filter(
                          (event) =>
                            event.payload.actionId === action.id &&
                            typeof event.payload.result === 'string'
                        )
                        .at(-1);
                      const result = action.result || String(receipt?.payload.result ?? '');
                      return (
                        <article className="gh-commitment" key={action.id}>
                          <div>
                            <h3>{control.label}</h3>
                            <span
                              className={`gh-pill ${action.status === 'completed' ? 'gh-pill-green' : ''}`}
                            >
                              {action.status}
                            </span>
                          </div>
                          <p>
                            {actorLabels[action.owner]} · {assetLabels[action.scope]}
                          </p>
                          <dl>
                            <div>
                              <dt>Expected update</dt>
                              <dd>{clockLabel(action.expectedUpdate)}</dd>
                            </div>
                            <div>
                              <dt>Resources</dt>
                              <dd>
                                {action.resources.join(', ').replaceAll('-', ' ') ||
                                  'None exclusive'}
                              </dd>
                            </div>
                            {action.expiresAt !== undefined && (
                              <div>
                                <dt>Authority expires</dt>
                                <dd>{clockLabel(action.expiresAt)}</dd>
                              </div>
                            )}
                          </dl>
                          {result && <p className="gh-commitment-result">{result}</p>}
                          {decision && (
                            <p className="gh-helper">
                              {decision.posture} · {decision.treatments.join(' + ')} ·{' '}
                              {decision.authority}
                              {decision.notify ? ' · owner notified' : ''}
                            </p>
                          )}
                          <div className="gh-button-row">
                            {(['requested', 'approved', 'started'].includes(action.status) ||
                              (action.status === 'completed' &&
                                action.expiresAt !== undefined &&
                                action.expiresAt > state.tick)) && (
                              <button
                                className="gh-text-button"
                                disabled={inactive}
                                onClick={() => send({ type: 'cancel', actionId: action.id })}
                              >
                                Cancel commitment
                              </button>
                            )}
                            {decision && (
                              <button
                                className="gh-text-button"
                                disabled={inactive}
                                onClick={() => setRevision(decision)}
                              >
                                Revise plan
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>
              </div>
              <div
                className={`gh-workspace-area gh-situation-area ${mobileArea === 'situation' ? 'gh-mobile-active' : ''}`}
              >
                <section className="gh-panel gh-campus-panel">
                  <div className="gh-panel-heading">
                    <div>
                      <span className="gh-eyebrow">03 / Common operating picture</span>
                      <h2>One connected campus</h2>
                    </div>
                    <Layers3 size={22} />
                  </div>
                  <div className="gh-map-switch">
                    <button
                      className={!architecture ? 'is-selected' : ''}
                      aria-pressed={!architecture}
                      onClick={() => setArchitecture(false)}
                    >
                      Schematic
                    </button>
                    <button
                      className={architecture ? 'is-selected' : ''}
                      aria-pressed={architecture}
                      onClick={() => setArchitecture(true)}
                    >
                      Architecture · optional
                    </button>
                  </div>
                  {architecture && (
                    <CampusScene
                      state={state}
                      selected={selectedAsset}
                      onSelect={setSelectedAsset}
                      motion={motion}
                      onFallback={() => {
                        setArchitecture(false);
                        engine.setError(
                          'The optional architectural view stopped. Your session and complete schematic are preserved.'
                        );
                      }}
                    />
                  )}
                  <Schematic
                    selected={selectedAsset}
                    onSelect={(asset) => {
                      setSelectedAsset(asset);
                      setFilter(asset);
                    }}
                    observations={observations}
                    state={state}
                  />
                  <div className="gh-selected-asset">
                    <span className="gh-eyebrow">Selected asset</span>
                    <h3>{assetLabels[selectedAsset]}</h3>
                    <p>
                      {selectedAsset === 'entrance'
                        ? 'People entering the campus rely on valid credentials or a bounded manual verification process.'
                        : selectedAsset === 'connector'
                          ? 'The shared identity dependency connects badge-reader behavior and dispatch access. Its technical cause must be established.'
                          : 'An essential shipment depends on safe authorized access. Service continuity and cyber containment can create competing constraints.'}
                    </p>
                    <button
                      className="gh-text-button"
                      onClick={() => {
                        setFilter(selectedAsset);
                        setMobileArea('evidence');
                      }}
                    >
                      Inspect related evidence
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
                <section className="gh-panel gh-team">
                  <div className="gh-panel-heading">
                    <div>
                      <span className="gh-eyebrow">People & capacity</span>
                      <h2>Your watch team</h2>
                    </div>
                    <Users size={21} />
                  </div>
                  {(['analyst', 'cyber', 'owner'] as const).map((id) => (
                    <button
                      key={id}
                      className={`gh-actor ${actor === id ? 'is-selected' : ''}`}
                      aria-pressed={actor === id}
                      onClick={() => setActor(id)}
                    >
                      <span className="gh-avatar">
                        {id === 'analyst' ? 'DA' : id === 'cyber' ? 'CL' : 'BO'}
                      </span>
                      <span>
                        <b>{actorLabels[id]}</b>
                        <small>
                          {id === 'analyst'
                            ? 'Establish scope; preserve provenance'
                            : id === 'cyber'
                              ? 'Contain carefully; verify recovery'
                              : 'owner' === id
                                ? 'Keep essential operations viable'
                                : ''}
                        </small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                  <details className="gh-actor-knowledge">
                    <summary>What {actorLabels[actor].toLowerCase()} knows now</summary>
                    {getGlasshouseObservations(state, actor).map((item) => (
                      <p key={item.id}>
                        <b>{clockLabel(item.receivedAt)}</b> {item.claim}
                      </p>
                    ))}
                    {!getGlasshouseObservations(state, actor).length && (
                      <p>No observation has been delivered to this actor.</p>
                    )}
                  </details>
                  <details>
                    <summary>Resource assignments</summary>
                    <dl className="gh-resource-list">
                      {Object.entries(state.resources).map(([resource, actionId]) => (
                        <div key={resource}>
                          <dt>{resource.replaceAll('-', ' ')}</dt>
                          <dd>
                            {actionId
                              ? state.actions
                                  .find((action) => action.id === actionId)
                                  ?.control.replaceAll('-', ' ') || 'Committed'
                              : 'Available'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  <button
                    className="gh-button gh-full"
                    disabled={inactive}
                    onClick={() => setBriefOpen((value) => !value)}
                  >
                    <Radio size={16} />
                    Brief the business owner
                  </button>
                  {state.events
                    .filter((event) => event.type === 'brief.acknowledged')
                    .slice(-2)
                    .map((event) => (
                      <p className="gh-team-receipt" key={event.eventId}>
                        <b>{clockLabel(event.simulatedAt)} · Jordan Vale</b>
                        {String(event.payload.result ?? '')}
                      </p>
                    ))}
                  {briefOpen && (
                    <form
                      className="gh-brief-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (
                          send({
                            type: 'brief',
                            ...brief,
                            scope: selectedAsset,
                            evidenceIds: state.decisions.at(-1)?.evidenceIds ?? [],
                          })
                        )
                          setBriefOpen(false);
                      }}
                    >
                      <p className="gh-helper">
                        Scope: {assetLabels[selectedAsset]}. Uses evidence cited by your latest
                        plan. A brief updates the recipient; it does not execute a control.
                      </p>
                      {(
                        [
                          'recommendation',
                          'uncertainty',
                          'alternative',
                          'consequence',
                          'reviewTrigger',
                        ] as const
                      ).map((field) => (
                        <label className="gh-field" key={field}>
                          {field === 'reviewTrigger'
                            ? 'Review trigger'
                            : field === 'consequence'
                              ? 'Business consequence'
                              : field.charAt(0).toUpperCase() + field.slice(1)}
                          <textarea
                            rows={2}
                            required
                            maxLength={1000}
                            value={brief[field]}
                            onChange={(event) =>
                              setBrief((value) => ({ ...value, [field]: event.target.value }))
                            }
                          />
                        </label>
                      ))}
                      <button className="gh-button gh-primary gh-full" type="submit">
                        Send structured brief
                        <ArrowUpRight size={16} />
                      </button>
                    </form>
                  )}
                </section>
                <section className="gh-panel gh-operational-updates">
                  <span className="gh-eyebrow">Event-linked consequences</span>
                  <h2>Operational updates</h2>
                  {state.events
                    .filter(
                      (event) =>
                        [
                          'deadline.dispatch',
                          'approval.granted',
                          'approval.declined',
                          'brief.acknowledged',
                        ].includes(event.type) && typeof event.payload.result === 'string'
                    )
                    .reverse()
                    .slice(0, 5)
                    .map((event) => (
                      <article className="gh-operation-update" key={event.eventId}>
                        <span className="gh-eyebrow">
                          {clockLabel(event.simulatedAt)} · {actorLabels[event.actorId]}
                        </span>
                        <p>{String(event.payload.result)}</p>
                        <small className="gh-mono">{event.eventId}</small>
                      </article>
                    ))}
                  {!state.events.some((event) =>
                    [
                      'deadline.dispatch',
                      'approval.granted',
                      'approval.declined',
                      'brief.acknowledged',
                    ].includes(event.type)
                  ) && (
                    <p className="gh-helper">
                      Owner responses and dispatch consequences will appear here as their authored
                      events occur.
                    </p>
                  )}
                </section>
                <section className="gh-panel gh-handoff-panel">
                  <Flag size={22} />
                  <h2>Hand over a controlled situation.</h2>
                  <p>
                    Record what is known, who owns the next steps, and the condition for review. The
                    scenario checks unresolved obligations before completing.
                  </p>
                  <button
                    className="gh-button gh-full"
                    disabled={inactive}
                    onClick={() => setHandoffOpen((value) => !value)}
                  >
                    Prepare handoff
                    <ArrowRight size={15} />
                  </button>
                  {handoffOpen && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (send({ type: 'handoff', ...handoff })) setHandoffOpen(false);
                      }}
                    >
                      <p className="gh-notice">
                        Recording a handoff ends this run. Before 06:40, with fewer than three
                        decisions, no completed verification, or pending actions, the outcome is
                        recorded as incomplete.
                      </p>
                      <label className="gh-field">
                        Situation & outstanding work
                        <textarea
                          rows={4}
                          required
                          maxLength={1000}
                          value={handoff.summary}
                          onChange={(event) =>
                            setHandoff((value) => ({ ...value, summary: event.target.value }))
                          }
                        />
                      </label>
                      <label className="gh-field">
                        Receiving owner
                        <input
                          required
                          maxLength={100}
                          placeholder="Fictional duty role"
                          value={handoff.owner}
                          onChange={(event) =>
                            setHandoff((value) => ({ ...value, owner: event.target.value }))
                          }
                        />
                      </label>
                      <label className="gh-field">
                        Review trigger
                        <input
                          required
                          maxLength={1000}
                          value={handoff.reviewTrigger}
                          onChange={(event) =>
                            setHandoff((value) => ({ ...value, reviewTrigger: event.target.value }))
                          }
                        />
                      </label>
                      <button className="gh-button gh-primary gh-full" type="submit">
                        Record handoff
                        <Check size={16} />
                      </button>
                    </form>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
      <footer className="gh-footer">
        <span>
          <Hourglass size={15} />
          HOURGLASS COMMAND
        </span>
        <p>Synthetic decisions. Observable consequences. No competence claim.</p>
        <nav aria-label="Supporting pages">
          <Link href="/legacy">Legacy exercises</Link>
          <Link href="/evidence">Evidence & limitations</Link>
        </nav>
        <span>
          {state ? `${state.scenarioVersion} · seed ${state.seed}` : 'Glasshouse / 06:10'}
        </span>
      </footer>
    </main>
  );
}
