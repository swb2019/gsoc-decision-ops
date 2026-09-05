'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileText,
  Download,
  Radio,
  X,
  Zap,
  Play,
  Pause,
  Timer,
  Activity,
  Target,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  createScenarioById,
  addFact,
  addAssumption,
  addUnknown,
  recordDecision,
  calculateStats,
  generateAfterActionReport,
  exportToMarkdown,
  exportToJSON,
  revealInject,
  getNextInject,
  getRevealedInjects,
} from '@gsoc-decision-ops/core';
import type { DecisionLog, DecisionPosture, ScenarioInject } from '@gsoc-decision-ops/core';
import Link from 'next/link';

interface ScenarioClientProps {
  scenarioId: string;
}

export default function ScenarioClient({ scenarioId }: ScenarioClientProps): JSX.Element {
  const [log, setLog] = useState<DecisionLog | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showQuickDecision, setShowQuickDecision] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<'facts' | 'assumptions' | 'unknowns' | null>('facts');
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const decisionLog = createScenarioById(scenarioId);
      if (decisionLog) {
        setLog(decisionLog);
      }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [scenarioId]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingMinutes = Math.max(0, 60 - elapsedMinutes);
  const progressPercent = Math.min(100, (elapsedMinutes / 60) * 100);

  const handleAddFact = useCallback(
    (description: string, source: string) => {
      if (log) {
        setLog(addFact(log, description, source, 'UNVERIFIED'));
      }
    },
    [log]
  );

  const handleAddAssumption = useCallback(
    (description: string, basis: string, riskIfWrong: string) => {
      if (log) {
        setLog(addAssumption(log, description, basis, riskIfWrong));
      }
    },
    [log]
  );

  const handleAddUnknown = useCallback(
    (question: string, priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
      if (log) {
        setLog(addUnknown(log, question, priority));
      }
    },
    [log]
  );

  const handleRecordDecision = useCallback(
    (
      title: string,
      description: string,
      posture: DecisionPosture,
      rationale: string,
      assetOwner?: string,
      residualRisk?: string
    ) => {
      if (log) {
        const treatmentMap: Record<DecisionPosture, 'ACCEPT' | 'MITIGATE' | 'AVOID'> = {
          CONTINUE: 'ACCEPT',
          DEGRADE: 'MITIGATE',
          PAUSE: 'AVOID',
        };

        setLog(
          recordDecision(log, {
            title,
            description,
            posture,
            owner: 'GSOC Manager',
            ownerRole: 'Incident Commander',
            rationale,
            esrmFraming:
              assetOwner || residualRisk
                ? {
                    assetOwner: assetOwner || 'Not specified',
                    assetOwnerRole: 'Asset Owner',
                    treatment: treatmentMap[posture],
                    residualRisk: residualRisk || 'Not documented',
                  }
                : undefined,
          })
        );
        setShowQuickDecision(false);
      }
    },
    [log]
  );

  const handleRevealInject = useCallback(
    (injectId: string) => {
      if (log) {
        setLog(revealInject(log, injectId));
      }
    },
    [log]
  );

  const handleExport = useCallback(
    (format: 'markdown' | 'json') => {
      if (!log) return;

      const report = generateAfterActionReport(log, [], []);
      const content = format === 'markdown' ? exportToMarkdown(report) : exportToJSON(report);
      const blob = new Blob([content], {
        type: format === 'markdown' ? 'text/markdown' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `after-action-report.${format === 'markdown' ? 'md' : 'json'}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [log]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ops-dark-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Activity className="w-10 h-10 text-ops-accent-green-500 mx-auto mb-4 animate-pulse" />
          <p className="text-ops-dark-400 text-sm">Initializing simulation...</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-ops-dark-950 flex items-center justify-center">
        <div className="text-center glass-card p-10 max-w-md mx-4 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-ops-accent-amber-500/15 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-ops-accent-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-ops-dark-50 mb-2">Scenario Not Found</h2>
          <p className="text-ops-dark-400 mb-6">The requested scenario could not be loaded.</p>
          <Link href="/" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Scenarios
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats(log);
  const nextInject = getNextInject(log);
  const revealedInjects = getRevealedInjects(log);

  return (
    <div className="min-h-screen bg-ops-dark-950 relative">
      <div className="noise-overlay" aria-hidden="true" />

      {/* Command Center Header */}
      <header className="border-b border-ops-dark-800/60 bg-ops-dark-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-ops-dark-800/60 transition-all"
                aria-label="Exit simulation"
              >
                <ArrowLeft className="w-5 h-5 text-ops-dark-400" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-ops-dark-50 truncate">
                  {log.incident.title}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xs px-1.5 py-0.5 rounded font-bold ${
                      log.incident.severity === 'CRITICAL'
                        ? 'bg-ops-accent-red-500/20 text-ops-accent-red-400'
                        : 'bg-ops-accent-amber-500/20 text-ops-accent-amber-400'
                    }`}
                  >
                    {log.incident.severity}
                  </span>
                  <span className="text-2xs text-ops-dark-500">{log.vendorContext?.vendorType}</span>
                </div>
              </div>
            </div>

            {/* Timer Section */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-ops-dark-800/60 border border-ops-dark-700/50">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`p-1.5 rounded-md transition-all ${
                    isRunning
                      ? 'bg-ops-accent-amber-500/20 text-ops-accent-amber-400'
                      : 'bg-ops-accent-green-500/20 text-ops-accent-green-400'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="text-center">
                  <div className="font-mono text-xl font-bold text-ops-dark-50">{formatTime(elapsedSeconds)}</div>
                  <div className="text-2xs text-ops-dark-500">{remainingMinutes}m remaining</div>
                </div>
                <Timer className={`w-5 h-5 ${remainingMinutes <= 10 ? 'text-ops-accent-red-400 animate-pulse' : 'text-ops-dark-500'}`} />
              </div>
              <button
                onClick={() => setShowExport(true)}
                className="btn btn-secondary text-xs py-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export AAR</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-ops-dark-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                remainingMinutes <= 10 ? 'bg-ops-accent-red-500' : 'bg-ops-accent-green-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column: Injects & Decisions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Learning Objective */}
            {log.learningObjective && (
              <div className="p-4 rounded-xl bg-ops-accent-blue-500/10 border border-ops-accent-blue-500/20">
                <div className="flex items-center gap-2 text-ops-accent-blue-400 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Mission Objective</span>
                </div>
                <p className="text-sm text-ops-dark-200">{log.learningObjective.primary}</p>
              </div>
            )}

            {/* Incident Brief */}
            <div className="card">
              <div className="p-4 border-b border-ops-dark-800/60">
                <h3 className="font-semibold text-ops-dark-50 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-ops-accent-amber-400" />
                  Situation Brief
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-ops-dark-300 leading-relaxed mb-3">{log.incident.description}</p>
                {log.vendorContext && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-ops-dark-800/60 text-ops-dark-300">
                      {log.vendorContext.vendorName}
                    </span>
                    <span className="px-2 py-1 rounded bg-ops-dark-800/60 text-ops-dark-400">
                      {log.vendorContext.servicesAffected.length} services affected
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Inject Feed */}
            <div className="card">
              <div className="p-4 border-b border-ops-dark-800/60 flex items-center justify-between">
                <h3 className="font-semibold text-ops-dark-50 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-ops-accent-amber-400" />
                  Live Intel Feed
                </h3>
                <span className="text-xs text-ops-dark-500">
                  {revealedInjects.length}/{log.injects.length} injects
                </span>
              </div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {revealedInjects.length === 0 && (
                  <div className="text-center py-6 text-ops-dark-500 text-sm">
                    {isRunning ? 'Waiting for intel...' : 'Start the timer to begin receiving intel'}
                  </div>
                )}
                {revealedInjects.map((inject) => (
                  <InjectCard key={inject.id} inject={inject} />
                ))}
                {nextInject && (
                  <button
                    onClick={() => handleRevealInject(nextInject.id)}
                    className="w-full py-3 rounded-lg border-2 border-dashed border-ops-dark-700 hover:border-ops-accent-amber-500/50 hover:bg-ops-accent-amber-500/5 transition-all text-sm text-ops-dark-400 hover:text-ops-accent-amber-400"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      Reveal Next Intel (@ {nextInject.revealAtMinute}min)
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Decision Panel */}
            <div className="card">
              <div className="p-4 border-b border-ops-dark-800/60 flex items-center justify-between">
                <h3 className="font-semibold text-ops-dark-50">Posture Decisions</h3>
                <button
                  onClick={() => setShowQuickDecision(!showQuickDecision)}
                  className="btn btn-primary text-xs py-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Decision
                </button>
              </div>
              <div className="p-4">
                {showQuickDecision && (
                  <QuickDecisionForm
                    onSubmit={handleRecordDecision}
                    onCancel={() => setShowQuickDecision(false)}
                  />
                )}
                {log.decisions.length === 0 && !showQuickDecision ? (
                  <div className="text-center py-6 text-ops-dark-500 text-sm">
                    No decisions recorded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {log.decisions.map((decision) => (
                      <div
                        key={decision.id}
                        className="p-3 rounded-lg bg-ops-dark-800/40 border border-ops-dark-700/30"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-2xs px-2 py-0.5 rounded font-bold ${
                              decision.posture === 'CONTINUE'
                                ? 'bg-ops-accent-green-500/20 text-ops-accent-green-400'
                                : decision.posture === 'DEGRADE'
                                  ? 'bg-ops-accent-amber-500/20 text-ops-accent-amber-400'
                                  : 'bg-ops-accent-red-500/20 text-ops-accent-red-400'
                            }`}
                          >
                            {decision.posture}
                          </span>
                          <span className="font-medium text-ops-dark-100 text-sm">{decision.title}</span>
                        </div>
                        <p className="text-xs text-ops-dark-400">{decision.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: COP (Common Operating Picture) */}
          <div className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Facts" value={stats.totalFacts} color="green" />
              <StatBox label="Assumptions" value={stats.totalAssumptions} color="amber" />
              <StatBox label="Unknowns" value={stats.totalUnknowns} color="red" />
            </div>

            {/* COP Panels */}
            <COPPanel
              title="Facts"
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="green"
              items={log.facts}
              expanded={expandedPanel === 'facts'}
              onToggle={() => setExpandedPanel(expandedPanel === 'facts' ? null : 'facts')}
              onAdd={handleAddFact}
              renderItem={(fact) => (
                <div key={fact.id} className="p-3 rounded-lg bg-ops-dark-800/40 border border-ops-dark-700/30">
                  <p className="text-sm text-ops-dark-200">{fact.description}</p>
                  <p className="text-2xs text-ops-dark-500 mt-1">Source: {fact.source}</p>
                </div>
              )}
            />

            <COPPanel
              title="Assumptions"
              icon={<HelpCircle className="w-4 h-4" />}
              color="amber"
              items={log.assumptions}
              expanded={expandedPanel === 'assumptions'}
              onToggle={() => setExpandedPanel(expandedPanel === 'assumptions' ? null : 'assumptions')}
              onAdd={handleAddAssumption}
              renderItem={(assumption) => (
                <div key={assumption.id} className="p-3 rounded-lg bg-ops-dark-800/40 border border-ops-dark-700/30">
                  <p className="text-sm text-ops-dark-200">{assumption.description}</p>
                  <p className="text-2xs text-ops-accent-red-400/80 mt-1">Risk: {assumption.riskIfWrong}</p>
                </div>
              )}
            />

            <COPPanel
              title="Unknowns"
              icon={<AlertTriangle className="w-4 h-4" />}
              color="red"
              items={log.unknowns}
              expanded={expandedPanel === 'unknowns'}
              onToggle={() => setExpandedPanel(expandedPanel === 'unknowns' ? null : 'unknowns')}
              onAdd={handleAddUnknown}
              renderItem={(unknown) => (
                <div key={unknown.id} className="p-3 rounded-lg bg-ops-dark-800/40 border border-ops-dark-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-2xs px-1.5 py-0.5 rounded font-bold ${
                      unknown.priority === 'CRITICAL' ? 'bg-ops-accent-red-500/20 text-ops-accent-red-400' :
                      unknown.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-ops-dark-700 text-ops-dark-400'
                    }`}>
                      {unknown.priority}
                    </span>
                  </div>
                  <p className="text-sm text-ops-dark-200">{unknown.question}</p>
                </div>
              )}
            />
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {showExport && (
        <ExportModal log={log} onExport={handleExport} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

function InjectCard({ inject }: { inject: ScenarioInject }): JSX.Element {
  return (
    <div className="p-4 rounded-lg bg-ops-accent-amber-500/5 border border-ops-accent-amber-500/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xs font-bold text-ops-accent-amber-400">INJECT {inject.sequenceNumber}</span>
        <span className="text-2xs text-ops-dark-500">@ {inject.revealAtMinute}min</span>
      </div>
      <p className="text-sm font-medium text-ops-dark-100 mb-1">{inject.title}</p>
      <p className="text-sm text-ops-dark-400 leading-relaxed">{inject.content}</p>
      {inject.decisionPressure && (
        <div className="mt-2 p-2 rounded bg-ops-dark-800/60 border border-ops-dark-700/50">
          <p className="text-xs text-ops-accent-amber-400">{inject.decisionPressure}</p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: 'green' | 'amber' | 'red' }): JSX.Element {
  const colorClasses = {
    green: 'text-ops-accent-green-400',
    amber: 'text-ops-accent-amber-400',
    red: 'text-ops-accent-red-400',
  };
  return (
    <div className="p-3 rounded-lg bg-ops-dark-900/60 border border-ops-dark-800/60 text-center">
      <div className={`text-2xl font-bold font-mono ${colorClasses[color]}`}>{value}</div>
      <div className="text-2xs text-ops-dark-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

type AddFactFn = (description: string, source: string) => void;
type AddAssumptionFn = (description: string, basis: string, riskIfWrong: string) => void;
type AddUnknownFn = (question: string, priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => void;

interface COPPanelProps<T> {
  title: string;
  icon: React.ReactNode;
  color: 'green' | 'amber' | 'red';
  items: T[];
  expanded: boolean;
  onToggle: () => void;
  onAdd: AddFactFn | AddAssumptionFn | AddUnknownFn;
  renderItem: (item: T) => React.ReactNode;
}

function COPPanel<T extends { id: string }>({
  title,
  icon,
  color,
  items,
  expanded,
  onToggle,
  onAdd,
  renderItem,
}: COPPanelProps<T>): JSX.Element {
  const [showAdd, setShowAdd] = useState(false);
  const colorClasses = {
    green: 'text-ops-accent-green-400 border-ops-accent-green-500/20',
    amber: 'text-ops-accent-amber-400 border-ops-accent-amber-500/20',
    red: 'text-ops-accent-red-400 border-ops-accent-red-500/20',
  };

  return (
    <div className={`card border ${colorClasses[color].split(' ')[1]}`}>
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-ops-dark-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={colorClasses[color].split(' ')[0]}>{icon}</span>
          <span className="font-semibold text-ops-dark-100 text-sm">{title}</span>
          <span className="text-2xs text-ops-dark-500">({items.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-ops-dark-500" /> : <ChevronDown className="w-4 h-4 text-ops-dark-500" />}
      </button>
      {expanded && (
        <div className="p-3 pt-0 space-y-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-full py-2 rounded border border-dashed border-ops-dark-700 hover:border-ops-dark-500 text-xs text-ops-dark-400 hover:text-ops-dark-300 transition-colors"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Add {title.slice(0, -1)}
          </button>
          {showAdd && (
            <AddItemForm
              type={title.toLowerCase() as 'facts' | 'assumptions' | 'unknowns'}
              onSubmit={onAdd}
              onClose={() => setShowAdd(false)}
            />
          )}
          {items.length === 0 && !showAdd && (
            <p className="text-xs text-ops-dark-500 text-center py-2">No {title.toLowerCase()} recorded</p>
          )}
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

function AddItemForm({
  type,
  onSubmit,
  onClose,
}: {
  type: 'facts' | 'assumptions' | 'unknowns';
  onSubmit: AddFactFn | AddAssumptionFn | AddUnknownFn;
  onClose: () => void;
}): JSX.Element {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [value3, setValue3] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  const handleSubmit = (): void => {
    if (type === 'facts' && value1 && value2) {
      (onSubmit as AddFactFn)(value1, value2);
      onClose();
    } else if (type === 'assumptions' && value1 && value2 && value3) {
      (onSubmit as AddAssumptionFn)(value1, value2, value3);
      onClose();
    } else if (type === 'unknowns' && value1) {
      (onSubmit as AddUnknownFn)(value1, priority);
      onClose();
    }
  };

  return (
    <div className="p-3 rounded-lg bg-ops-dark-800/40 border border-ops-dark-700/30 space-y-2">
      {type === 'facts' && (
        <>
          <input
            type="text"
            placeholder="What do you know?"
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            className="input text-sm py-2"
            autoFocus
          />
          <input
            type="text"
            placeholder="Source"
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            className="input text-sm py-2"
          />
        </>
      )}
      {type === 'assumptions' && (
        <>
          <input
            type="text"
            placeholder="What are you assuming?"
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            className="input text-sm py-2"
            autoFocus
          />
          <input
            type="text"
            placeholder="Basis for assumption"
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            className="input text-sm py-2"
          />
          <input
            type="text"
            placeholder="Risk if wrong"
            value={value3}
            onChange={(e) => setValue3(e.target.value)}
            className="input text-sm py-2"
          />
        </>
      )}
      {type === 'unknowns' && (
        <>
          <input
            type="text"
            placeholder="What do you need to know?"
            value={value1}
            onChange={(e) => setValue1(e.target.value)}
            className="input text-sm py-2"
            autoFocus
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="input text-sm py-2"
          >
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost text-xs py-1.5">Cancel</button>
        <button onClick={handleSubmit} className="btn btn-primary text-xs py-1.5">Add</button>
      </div>
    </div>
  );
}

function QuickDecisionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (
    title: string,
    description: string,
    posture: DecisionPosture,
    rationale: string,
    assetOwner?: string,
    residualRisk?: string
  ) => void;
  onCancel: () => void;
}): JSX.Element {
  const [title, setTitle] = useState('');
  const [posture, setPosture] = useState<DecisionPosture>('CONTINUE');
  const [rationale, setRationale] = useState('');

  return (
    <div className="mb-4 p-4 rounded-lg bg-ops-dark-800/40 border border-ops-dark-700/30 space-y-3">
      <input
        type="text"
        placeholder="Decision title (e.g., 'Badge Operations')"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input text-sm"
        autoFocus
      />
      
      <div className="grid grid-cols-3 gap-2">
        {(['CONTINUE', 'DEGRADE', 'PAUSE'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPosture(p)}
            className={`py-3 rounded-lg border-2 text-sm font-bold transition-all ${
              posture === p
                ? p === 'CONTINUE'
                  ? 'border-ops-accent-green-500/60 bg-ops-accent-green-500/15 text-ops-accent-green-400'
                  : p === 'DEGRADE'
                    ? 'border-ops-accent-amber-500/60 bg-ops-accent-amber-500/15 text-ops-accent-amber-400'
                    : 'border-ops-accent-red-500/60 bg-ops-accent-red-500/15 text-ops-accent-red-400'
                : 'border-ops-dark-700/60 text-ops-dark-400 hover:border-ops-dark-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Why this posture? What's your rationale?"
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        rows={2}
        className="input text-sm resize-none"
      />

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-ghost text-xs py-1.5">Cancel</button>
        <button
          onClick={() => onSubmit(title, title, posture, rationale)}
          disabled={!title || !rationale}
          className="btn btn-primary text-xs py-1.5"
        >
          Record Decision
        </button>
      </div>
    </div>
  );
}

function ExportModal({
  log,
  onExport,
  onClose,
}: {
  log: DecisionLog;
  onExport: (format: 'markdown' | 'json') => void;
  onClose: () => void;
}): JSX.Element {
  const stats = calculateStats(log);
  
  return (
    <div className="fixed inset-0 bg-ops-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ops-dark-50">Export After-Action Report</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ops-dark-800/60 transition-colors">
            <X className="w-5 h-5 text-ops-dark-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-ops-dark-800/40 text-center">
            <div className="text-2xl font-bold text-ops-accent-green-400">{stats.totalDecisions}</div>
            <div className="text-xs text-ops-dark-500">Decisions</div>
          </div>
          <div className="p-3 rounded-lg bg-ops-dark-800/40 text-center">
            <div className="text-2xl font-bold text-ops-accent-blue-400">{log.timeline.length}</div>
            <div className="text-xs text-ops-dark-500">Events</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onExport('markdown');
              onClose();
            }}
            className="btn btn-primary flex-1"
          >
            <FileText className="w-4 h-4" />
            Markdown
          </button>
          <button
            onClick={() => {
              onExport('json');
              onClose();
            }}
            className="btn btn-secondary flex-1"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
        
        <p className="text-2xs text-ops-dark-500 text-center mt-4">
          Export includes training watermark
        </p>
      </div>
    </div>
  );
}
