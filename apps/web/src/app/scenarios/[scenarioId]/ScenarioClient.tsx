'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Plus,
  FileText,
  Download,
  Users,
  Radio,
  ChevronDown,
  ChevronUp,
  Lock,
  Home,
  Loader2,
  X,
  Target,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  createScenarioById,
  addFact,
  addAssumption,
  addUnknown,
  recordDecision,
  addActionItem,
  updateActionItemStatus,
  calculateStats,
  getVendorCompromisePlaybook,
  generateAfterActionReport,
  exportToMarkdown,
  exportToJSON,
  revealInject,
  getNextInject,
  getRevealedInjects,
} from '@gsoc-decision-ops/core';
import type { DecisionLog, DecisionPosture } from '@gsoc-decision-ops/core';
import Link from 'next/link';

interface ScenarioClientProps {
  scenarioId: string;
}

export default function ScenarioClient({ scenarioId }: ScenarioClientProps): JSX.Element {
  const [log, setLog] = useState<DecisionLog | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'playbook' | 'export'>(
    'overview'
  );
  const [expandedPhase, setExpandedPhase] = useState<string | null>('PHASE_1_ASSESSMENT');
  const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(new Set());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const playbook = getVendorCompromisePlaybook();

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
    const interval = setInterval(() => {
      setElapsedMinutes((m) => m + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
      }
    },
    [log]
  );

  const handleAddAction = useCallback(
    (description: string, owner: string, priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
      if (log) {
        setLog(addActionItem(log, description, owner, priority));
      }
    },
    [log]
  );

  const handleToggleActionComplete = useCallback(
    (actionId: string, currentStatus: string) => {
      if (log) {
        const newStatus = currentStatus === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
        setLog(updateActionItemStatus(log, actionId, newStatus as 'OPEN' | 'COMPLETED'));
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

  const handleChecklistToggle = useCallback((itemId: string) => {
    setCompletedChecklist((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

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
          <Loader2 className="w-10 h-10 text-ops-accent-green-500 mx-auto mb-4 animate-spin" />
          <p className="text-ops-dark-400 text-sm">Loading scenario...</p>
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
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats(log);
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Target },
    { id: 'decisions' as const, label: 'Decisions', icon: Zap },
    { id: 'playbook' as const, label: 'Playbook', icon: FileText },
    { id: 'export' as const, label: 'Export', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-ops-dark-950 relative">
      <div className="noise-overlay" aria-hidden="true" />

      <header className="border-b border-ops-dark-800/60 bg-ops-dark-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link
                href="/"
                className="p-2.5 rounded-xl hover:bg-ops-dark-800/60 transition-all duration-200 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-ops-accent-green-500/50"
                aria-label="Back to scenarios"
              >
                <ArrowLeft className="w-5 h-5 text-ops-dark-400 hover:text-ops-dark-200 transition-colors" />
              </Link>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ops-accent-green-500/25 to-ops-accent-green-600/15 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-ops-accent-green-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-ops-dark-50 truncate">
                    {log.incident.title}
                  </h1>
                  <p className="text-xs text-ops-dark-500 font-medium">Training Scenario</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="hidden sm:block text-right">
                <div className="text-xs text-ops-dark-500 uppercase tracking-wider">Elapsed</div>
                <div className="font-mono text-ops-accent-green-400 font-semibold">
                  {elapsedMinutes}m
                </div>
              </div>
              <span
                className={`status-badge ${
                  log.incident.severity === 'CRITICAL' ? 'severity-critical' : 'severity-high'
                }`}
              >
                {log.incident.severity}
              </span>
              <span className="status-badge status-active">
                <span className="w-1.5 h-1.5 rounded-full bg-ops-accent-green-400 animate-pulse" />
                <span className="hidden sm:inline">{log.incident.status}</span>
              </span>
            </div>
          </div>

          <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-thin" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`tab-button flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'tab-button-active' : 'tab-button-inactive'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="governance-banner mb-6 flex items-start sm:items-center gap-3 animate-fade-in">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm">
            <strong className="font-semibold">Training Mode:</strong> This is a synthetic scenario.
            All decisions are for practice only. Human judgment remains essential in actual
            incidents.
          </p>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'overview' && (
            <OverviewTab
              log={log}
              stats={stats}
              onAddFact={handleAddFact}
              onAddAssumption={handleAddAssumption}
              onAddUnknown={handleAddUnknown}
              onAddAction={handleAddAction}
              onToggleActionComplete={handleToggleActionComplete}
              onRevealInject={handleRevealInject}
            />
          )}

          {activeTab === 'decisions' && (
            <DecisionsTab log={log} stats={stats} onRecordDecision={handleRecordDecision} />
          )}

          {activeTab === 'playbook' && (
            <PlaybookTab
              playbook={playbook}
              expandedPhase={expandedPhase}
              completedChecklist={completedChecklist}
              onPhaseToggle={setExpandedPhase}
              onChecklistToggle={handleChecklistToggle}
            />
          )}

          {activeTab === 'export' && <ExportTab log={log} onExport={handleExport} />}
        </div>
      </main>
    </div>
  );
}

interface OverviewTabProps {
  log: DecisionLog;
  stats: ReturnType<typeof calculateStats>;
  onAddFact: (description: string, source: string) => void;
  onAddAssumption: (description: string, basis: string, riskIfWrong: string) => void;
  onAddUnknown: (question: string, priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => void;
  onAddAction: (
    description: string,
    owner: string,
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  ) => void;
  onToggleActionComplete: (actionId: string, currentStatus: string) => void;
  onRevealInject: (injectId: string) => void;
}

function OverviewTab({
  log,
  stats,
  onAddFact,
  onAddAssumption,
  onAddUnknown,
  onAddAction,
  onToggleActionComplete,
  onRevealInject,
}: OverviewTabProps): JSX.Element {
  const [showAddFact, setShowAddFact] = useState(false);
  const [showAddAssumption, setShowAddAssumption] = useState(false);
  const [showAddUnknown, setShowAddUnknown] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);

  const nextInject = getNextInject(log);
  const revealedInjects = getRevealedInjects(log);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        {/* Learning Objective */}
        {log.learningObjective && (
          <div className="card border-ops-accent-blue-500/30">
            <div className="card-header bg-ops-accent-blue-500/5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-ops-accent-blue-400" />
                <h3 className="font-semibold text-ops-accent-blue-400">Learning Objective</h3>
              </div>
            </div>
            <div className="card-body">
              <p className="text-sm text-ops-dark-200 leading-relaxed mb-3">
                {log.learningObjective.primary}
              </p>
              {log.learningObjective.skillsTrained && (
                <div className="flex flex-wrap gap-1.5">
                  {log.learningObjective.skillsTrained.map((skill, i) => (
                    <span
                      key={i}
                      className="text-2xs px-2 py-0.5 rounded bg-ops-dark-800 text-ops-dark-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inject Timeline */}
        {log.injects.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-ops-accent-amber-400" />
                <h3 className="font-semibold text-ops-dark-50">Scenario Injects</h3>
              </div>
              <span className="text-xs text-ops-dark-500">
                {revealedInjects.length}/{log.injects.length}
              </span>
            </div>
            <div className="card-body space-y-3">
              {revealedInjects.map((inject) => (
                <div
                  key={inject.id}
                  className="bg-ops-dark-800/40 rounded-xl p-4 border border-ops-accent-amber-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xs text-ops-accent-amber-400 font-semibold">
                      INJECT {inject.sequenceNumber}
                    </span>
                    <span className="text-2xs text-ops-dark-500">@ {inject.revealAtMinute}min</span>
                  </div>
                  <div className="text-sm text-ops-dark-100 font-medium mb-1">{inject.title}</div>
                  <p className="text-sm text-ops-dark-400 leading-relaxed mb-2">{inject.content}</p>
                  <div className="text-xs text-ops-dark-500">Source: {inject.source}</div>
                  {inject.decisionPressure && (
                    <div className="mt-2 p-2 rounded bg-ops-accent-amber-500/10 border border-ops-accent-amber-500/20">
                      <div className="text-2xs text-ops-accent-amber-400 font-semibold mb-1">
                        DECISION PRESSURE
                      </div>
                      <p className="text-xs text-ops-dark-300">{inject.decisionPressure}</p>
                    </div>
                  )}
                </div>
              ))}
              {nextInject && (
                <button
                  onClick={() => onRevealInject(nextInject.id)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-ops-dark-700 hover:border-ops-accent-amber-500/50 hover:bg-ops-accent-amber-500/5 transition-all duration-200 text-sm text-ops-dark-400 hover:text-ops-accent-amber-400"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Reveal Inject {nextInject.sequenceNumber} (@ {nextInject.revealAtMinute}min)
                  </span>
                </button>
              )}
              {!nextInject && log.injects.length > 0 && (
                <div className="text-center py-2 text-xs text-ops-dark-500">
                  All injects revealed
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-50">Incident Summary</h3>
          </div>
          <div className="card-body space-y-4">
            <p className="text-sm text-ops-dark-300 leading-relaxed">{log.incident.description}</p>
            {log.vendorContext && (
              <div className="bg-ops-dark-800/40 rounded-xl p-4 space-y-2.5 border border-ops-dark-700/30">
                <div className="text-2xs text-ops-dark-500 uppercase tracking-wider font-semibold">
                  Vendor Context
                </div>
                <div className="text-sm text-ops-dark-100 font-medium">
                  {log.vendorContext.vendorName}
                </div>
                <div className="text-xs text-ops-dark-400">
                  Type: {log.vendorContext.vendorType}
                </div>
                <div className="text-xs text-ops-dark-400">
                  Affected: {log.vendorContext.servicesAffected.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="metric-card">
            <div className="metric-value text-ops-accent-green-400">{stats.totalFacts}</div>
            <div className="metric-label">Facts</div>
          </div>
          <div className="metric-card">
            <div className="metric-value text-ops-accent-amber-400">{stats.totalAssumptions}</div>
            <div className="metric-label">Assumptions</div>
          </div>
          <div className="metric-card">
            <div className="metric-value text-ops-accent-red-400">{stats.totalUnknowns}</div>
            <div className="metric-label">Unknowns</div>
          </div>
          <div className="metric-card">
            <div className="metric-value text-ops-accent-blue-400">{stats.totalDecisions}</div>
            <div className="metric-label">Decisions</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-accent-green-400">Facts</h3>
            <button
              onClick={() => setShowAddFact(!showAddFact)}
              className="p-1.5 rounded-lg hover:bg-ops-dark-700/60 transition-colors"
              aria-label="Add fact"
            >
              <Plus className="w-4 h-4 text-ops-dark-400" />
            </button>
          </div>
          <div className="card-body space-y-3">
            {showAddFact && (
              <AddFactForm
                onSubmit={(desc, src) => {
                  onAddFact(desc, src);
                  setShowAddFact(false);
                }}
                onCancel={() => setShowAddFact(false)}
              />
            )}
            {log.facts.length === 0 ? (
              <EmptyState message="No facts recorded yet." />
            ) : (
              log.facts.map((fact) => (
                <div
                  key={fact.id}
                  className="bg-ops-dark-800/40 rounded-xl p-4 border border-ops-dark-700/30"
                >
                  <p className="text-sm text-ops-dark-200 leading-relaxed">{fact.description}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-ops-dark-500">
                    <span className="uppercase font-semibold px-1.5 py-0.5 rounded bg-ops-dark-700/50">
                      {fact.confidence}
                    </span>
                    <span>Source: {fact.source}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-accent-amber-400">Assumptions</h3>
            <button
              onClick={() => setShowAddAssumption(!showAddAssumption)}
              className="p-1.5 rounded-lg hover:bg-ops-dark-700/60 transition-colors"
              aria-label="Add assumption"
            >
              <Plus className="w-4 h-4 text-ops-dark-400" />
            </button>
          </div>
          <div className="card-body space-y-3">
            {showAddAssumption && (
              <AddAssumptionForm
                onSubmit={(desc, basis, risk) => {
                  onAddAssumption(desc, basis, risk);
                  setShowAddAssumption(false);
                }}
                onCancel={() => setShowAddAssumption(false)}
              />
            )}
            {log.assumptions.length === 0 ? (
              <EmptyState message="No assumptions recorded yet." />
            ) : (
              log.assumptions.map((assumption) => (
                <div
                  key={assumption.id}
                  className="bg-ops-dark-800/40 rounded-xl p-4 border border-ops-dark-700/30"
                >
                  <p className="text-sm text-ops-dark-200 leading-relaxed">
                    {assumption.description}
                  </p>
                  <div className="mt-3 text-xs text-ops-dark-500 space-y-1">
                    <div>Basis: {assumption.basis}</div>
                    <div className="text-ops-accent-red-400/80 font-medium">
                      Risk if wrong: {assumption.riskIfWrong}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-accent-red-400">Unknowns</h3>
            <button
              onClick={() => setShowAddUnknown(!showAddUnknown)}
              className="p-1.5 rounded-lg hover:bg-ops-dark-700/60 transition-colors"
              aria-label="Add unknown"
            >
              <Plus className="w-4 h-4 text-ops-dark-400" />
            </button>
          </div>
          <div className="card-body space-y-3">
            {showAddUnknown && (
              <AddUnknownForm
                onSubmit={(q, p) => {
                  onAddUnknown(q, p);
                  setShowAddUnknown(false);
                }}
                onCancel={() => setShowAddUnknown(false)}
              />
            )}
            {log.unknowns.length === 0 ? (
              <EmptyState message="No unknowns recorded yet." />
            ) : (
              log.unknowns.map((unknown) => (
                <div
                  key={unknown.id}
                  className="bg-ops-dark-800/40 rounded-xl p-4 border border-ops-dark-700/30"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className={`status-badge text-2xs ${
                        unknown.priority === 'CRITICAL'
                          ? 'severity-critical'
                          : unknown.priority === 'HIGH'
                            ? 'severity-high'
                            : 'severity-medium'
                      }`}
                    >
                      {unknown.priority}
                    </span>
                  </div>
                  <p className="text-sm text-ops-dark-200 leading-relaxed">{unknown.question}</p>
                  {unknown.assignedTo && (
                    <div className="text-xs text-ops-dark-500 mt-2">
                      Assigned: {unknown.assignedTo}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-50">Action Items</h3>
            <button
              onClick={() => setShowAddAction(!showAddAction)}
              className="p-1.5 rounded-lg hover:bg-ops-dark-700/60 transition-colors"
              aria-label="Add action"
            >
              <Plus className="w-4 h-4 text-ops-dark-400" />
            </button>
          </div>
          <div className="card-body space-y-2">
            {showAddAction && (
              <AddActionForm
                onSubmit={(desc, owner, priority) => {
                  onAddAction(desc, owner, priority);
                  setShowAddAction(false);
                }}
                onCancel={() => setShowAddAction(false)}
              />
            )}
            {log.actionItems.length === 0 ? (
              <EmptyState message="No action items yet." />
            ) : (
              log.actionItems.map((action) => (
                <div
                  key={action.id}
                  className="checklist-item group"
                  onClick={() => onToggleActionComplete(action.id, action.status)}
                  role="checkbox"
                  aria-checked={action.status === 'COMPLETED'}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleActionComplete(action.id, action.status);
                    }
                  }}
                >
                  <div
                    className={`checklist-checkbox ${
                      action.status === 'COMPLETED' ? 'checked' : ''
                    }`}
                  >
                    {action.status === 'COMPLETED' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${
                        action.status === 'COMPLETED'
                          ? 'text-ops-dark-500 line-through'
                          : 'text-ops-dark-200'
                      }`}
                    >
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-ops-dark-500">{action.owner}</span>
                      <span
                        className={`text-2xs px-1.5 py-0.5 rounded font-semibold ${
                          action.priority === 'CRITICAL'
                            ? 'bg-ops-accent-red-500/20 text-ops-accent-red-400'
                            : action.priority === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-ops-dark-700 text-ops-dark-400'
                        }`}
                      >
                        {action.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-50">Timeline</h3>
            <Clock className="w-4 h-4 text-ops-dark-500" />
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {log.timeline.length === 0 ? (
                <EmptyState message="No timeline events yet." />
              ) : (
                log.timeline
                  .slice(-5)
                  .reverse()
                  .map((event) => (
                    <div key={event.id} className="relative pl-6">
                      <div
                        className={`timeline-dot ${
                          event.type === 'DECISION'
                            ? 'bg-ops-accent-blue-500'
                            : event.type === 'DETECTION'
                              ? 'bg-ops-accent-red-500'
                              : 'bg-ops-dark-600'
                        }`}
                      />
                      <div className="text-xs text-ops-dark-500 mb-0.5 font-medium">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-ops-dark-200">{event.title}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DecisionsTabProps {
  log: DecisionLog;
  stats: ReturnType<typeof calculateStats>;
  onRecordDecision: (
    title: string,
    description: string,
    posture: DecisionPosture,
    rationale: string,
    assetOwner?: string,
    residualRisk?: string
  ) => void;
}

function DecisionsTab({ log, stats, onRecordDecision }: DecisionsTabProps): JSX.Element {
  const [showAddDecision, setShowAddDecision] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card posture-continue">
          <div className="card-body text-center py-6">
            <div className="text-4xl font-bold mb-1">{stats.postureBreakdown.CONTINUE}</div>
            <div className="text-sm uppercase tracking-wider font-semibold opacity-80">
              Continue
            </div>
          </div>
        </div>
        <div className="card posture-degrade">
          <div className="card-body text-center py-6">
            <div className="text-4xl font-bold mb-1">{stats.postureBreakdown.DEGRADE}</div>
            <div className="text-sm uppercase tracking-wider font-semibold opacity-80">Degrade</div>
          </div>
        </div>
        <div className="card posture-pause">
          <div className="card-body text-center py-6">
            <div className="text-4xl font-bold mb-1">{stats.postureBreakdown.PAUSE}</div>
            <div className="text-sm uppercase tracking-wider font-semibold opacity-80">Pause</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowAddDecision(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Record Decision
        </button>
      </div>

      {showAddDecision && (
        <div className="card animate-scale-in">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-50">Record New Decision</h3>
            <button
              onClick={() => setShowAddDecision(false)}
              className="p-1.5 rounded-lg hover:bg-ops-dark-700/60 transition-colors"
              aria-label="Close form"
            >
              <X className="w-4 h-4 text-ops-dark-400" />
            </button>
          </div>
          <div className="card-body">
            <AddDecisionForm
              onSubmit={(title, desc, posture, rationale, assetOwner, residualRisk) => {
                onRecordDecision(title, desc, posture, rationale, assetOwner, residualRisk);
                setShowAddDecision(false);
              }}
              onCancel={() => setShowAddDecision(false)}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {log.decisions.length === 0 ? (
          <div className="card">
            <div className="card-body empty-state">
              <Radio className="empty-state-icon" />
              <p className="empty-state-title">No decisions recorded yet</p>
              <p className="empty-state-description">
                Record decisions as you progress through the incident response.
              </p>
            </div>
          </div>
        ) : (
          log.decisions.map((decision) => (
            <div key={decision.id} className="card animate-fade-in-up">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <span
                    className={`status-badge ${
                      decision.posture === 'CONTINUE'
                        ? 'posture-continue'
                        : decision.posture === 'DEGRADE'
                          ? 'posture-degrade'
                          : 'posture-pause'
                    }`}
                  >
                    {decision.posture}
                  </span>
                  <h4 className="font-semibold text-ops-dark-50">{decision.title}</h4>
                </div>
                <div className="text-xs text-ops-dark-500 font-mono">
                  {new Date(decision.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="card-body">
                <p className="text-sm text-ops-dark-300 mb-4 leading-relaxed">
                  {decision.description}
                </p>
                <div className="bg-ops-dark-800/40 rounded-xl p-4 border border-ops-dark-700/30 mb-4">
                  <div className="text-2xs text-ops-dark-500 uppercase tracking-wider mb-1.5 font-semibold">
                    Rationale
                  </div>
                  <p className="text-sm text-ops-dark-200 leading-relaxed">{decision.rationale}</p>
                </div>
                {decision.esrmFraming && (
                  <div className="bg-ops-accent-blue-500/5 rounded-xl p-4 border border-ops-accent-blue-500/20 mb-4">
                    <div className="text-2xs text-ops-accent-blue-400 uppercase tracking-wider mb-2 font-semibold">
                      ESRM Risk Framing
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-2xs text-ops-dark-500 mb-0.5">Asset Owner</div>
                        <div className="text-ops-dark-200">{decision.esrmFraming.assetOwner}</div>
                      </div>
                      <div>
                        <div className="text-2xs text-ops-dark-500 mb-0.5">Treatment</div>
                        <div className="text-ops-dark-200">{decision.esrmFraming.treatment}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-2xs text-ops-dark-500 mb-0.5">Residual Risk</div>
                        <div className="text-ops-dark-300 text-xs leading-relaxed">
                          {decision.esrmFraming.residualRisk}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-ops-dark-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {decision.owner} ({decision.ownerRole})
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface PlaybookTabProps {
  playbook: ReturnType<typeof getVendorCompromisePlaybook>;
  expandedPhase: string | null;
  completedChecklist: Set<string>;
  onPhaseToggle: (phaseId: string | null) => void;
  onChecklistToggle: (itemId: string) => void;
}

function PlaybookTab({
  playbook,
  expandedPhase,
  completedChecklist,
  onPhaseToggle,
  onChecklistToggle,
}: PlaybookTabProps): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <h3 className="text-xl font-semibold text-ops-dark-50 mb-2">{playbook.name}</h3>
          <p className="text-sm text-ops-dark-400 mb-5 leading-relaxed">{playbook.description}</p>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-ops-dark-500" />
              <span className="text-ops-dark-300">
                {playbook.totalDurationMinutes} minutes total
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-ops-dark-500" />
              <span className="text-ops-dark-300">{playbook.phases.length} phases</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {playbook.phases.map((phase, index) => {
          const isExpanded = expandedPhase === phase.id;
          const completedCount = phase.checklistItems.filter((item) =>
            completedChecklist.has(item.id)
          ).length;
          const totalCount = phase.checklistItems.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={phase.id} className="card overflow-hidden">
              <button
                className="card-header w-full text-left focus-visible:ring-inset"
                onClick={() => onPhaseToggle(isExpanded ? null : phase.id)}
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`phase-dot ${
                      progress === 100 ? 'completed' : progress > 0 ? 'active' : 'pending'
                    }`}
                  />
                  <div>
                    <div className="text-xs text-ops-dark-500 font-medium">
                      Phase {index + 1} · {phase.durationMinutes} min
                    </div>
                    <h4 className="font-semibold text-ops-dark-50">{phase.name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xs text-ops-dark-500 uppercase tracking-wider">
                      Progress
                    </div>
                    <div className="text-sm font-mono text-ops-dark-300">
                      {completedCount}/{totalCount}
                    </div>
                  </div>
                  <div className="p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-ops-dark-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-ops-dark-500" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="card-body border-t border-ops-dark-800/60 animate-fade-in-down">
                  <p className="text-sm text-ops-dark-400 mb-6 leading-relaxed">
                    {phase.description}
                  </p>

                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-ops-dark-200 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-ops-accent-green-500" />
                      Objectives
                    </h5>
                    <ul className="space-y-2">
                      {phase.objectives.map((obj, i) => (
                        <li key={i} className="text-sm text-ops-dark-400 flex items-start gap-2.5">
                          <Circle className="w-2 h-2 mt-2 text-ops-accent-green-500 fill-current" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-ops-dark-200 mb-3 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-ops-accent-blue-500" />
                      Key Questions
                    </h5>
                    <ul className="space-y-2">
                      {phase.keyQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-ops-dark-400 flex items-start gap-2.5">
                          <span className="text-ops-dark-600">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-ops-dark-200 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-ops-accent-amber-500" />
                      Checklist
                    </h5>
                    <div className="space-y-1">
                      {phase.checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="checklist-item group"
                          onClick={() => onChecklistToggle(item.id)}
                          role="checkbox"
                          aria-checked={completedChecklist.has(item.id)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onChecklistToggle(item.id);
                            }
                          }}
                        >
                          <div
                            className={`checklist-checkbox ${
                              completedChecklist.has(item.id) ? 'checked' : ''
                            }`}
                          >
                            {completedChecklist.has(item.id) && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm ${
                                completedChecklist.has(item.id)
                                  ? 'text-ops-dark-500 line-through'
                                  : 'text-ops-dark-200'
                              }`}
                            >
                              {item.description}
                            </p>
                            {item.owner && (
                              <span className="text-xs text-ops-dark-500">Owner: {item.owner}</span>
                            )}
                          </div>
                          {item.required && (
                            <span className="text-2xs text-ops-accent-red-400 font-semibold uppercase">
                              Required
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="font-semibold text-ops-dark-50">Governance Notes</h4>
        </div>
        <div className="card-body">
          <ul className="space-y-3">
            {playbook.governanceNotes.map((note, i) => (
              <li key={i} className="text-sm text-ops-dark-400 flex items-start gap-3">
                <Lock className="w-4 h-4 mt-0.5 text-ops-accent-amber-500 flex-shrink-0" />
                <span className="leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface ExportTabProps {
  log: DecisionLog;
  onExport: (format: 'markdown' | 'json') => void;
}

function ExportTab({ log, onExport }: ExportTabProps): JSX.Element {
  const stats = calculateStats(log);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <div className="card-body text-center py-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ops-dark-700/50 to-ops-dark-800/50 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-ops-dark-500" />
          </div>
          <h3 className="text-2xl font-semibold text-ops-dark-50 mb-2">
            Export After-Action Report
          </h3>
          <p className="text-sm text-ops-dark-400 mb-8 max-w-md mx-auto leading-relaxed">
            Generate a comprehensive after-action report documenting all decisions, facts,
            assumptions, and timeline events from this training exercise.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-ops-dark-800/40 rounded-xl p-5 text-left border border-ops-dark-700/30">
              <div className="text-3xl font-bold text-ops-accent-green-400 mb-1">
                {stats.totalDecisions}
              </div>
              <div className="text-sm text-ops-dark-400">Decisions Recorded</div>
            </div>
            <div className="bg-ops-dark-800/40 rounded-xl p-5 text-left border border-ops-dark-700/30">
              <div className="text-3xl font-bold text-ops-accent-blue-400 mb-1">
                {log.timeline.length}
              </div>
              <div className="text-sm text-ops-dark-400">Timeline Events</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => onExport('markdown')} className="btn btn-primary">
              <Download className="w-4 h-4" />
              Download Markdown
            </button>
            <button onClick={() => onExport('json')} className="btn btn-secondary">
              <Download className="w-4 h-4" />
              Download JSON
            </button>
          </div>
        </div>
      </div>

      <div className="governance-banner text-center">
        <p className="text-sm leading-relaxed">
          Exported reports include a training/exercise watermark. These are for learning purposes
          and should not be used as actual incident documentation.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }): JSX.Element {
  return <p className="text-sm text-ops-dark-500 text-center py-4">{message}</p>;
}

function AddFactForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (description: string, source: string) => void;
  onCancel: () => void;
}): JSX.Element {
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');

  return (
    <div className="bg-ops-dark-800/40 rounded-xl p-4 space-y-3 border border-ops-dark-700/30 animate-scale-in">
      <input
        type="text"
        placeholder="Fact description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm"
        autoFocus
      />
      <input
        type="text"
        placeholder="Source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="input text-sm"
      />
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="btn btn-ghost text-xs py-2">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(description, source)}
          disabled={!description || !source}
          className="btn btn-primary text-xs py-2"
        >
          Add Fact
        </button>
      </div>
    </div>
  );
}

function AddAssumptionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (description: string, basis: string, riskIfWrong: string) => void;
  onCancel: () => void;
}): JSX.Element {
  const [description, setDescription] = useState('');
  const [basis, setBasis] = useState('');
  const [riskIfWrong, setRiskIfWrong] = useState('');

  return (
    <div className="bg-ops-dark-800/40 rounded-xl p-4 space-y-3 border border-ops-dark-700/30 animate-scale-in">
      <input
        type="text"
        placeholder="Assumption..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm"
        autoFocus
      />
      <input
        type="text"
        placeholder="Basis for assumption..."
        value={basis}
        onChange={(e) => setBasis(e.target.value)}
        className="input text-sm"
      />
      <input
        type="text"
        placeholder="Risk if wrong..."
        value={riskIfWrong}
        onChange={(e) => setRiskIfWrong(e.target.value)}
        className="input text-sm"
      />
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="btn btn-ghost text-xs py-2">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(description, basis, riskIfWrong)}
          disabled={!description || !basis || !riskIfWrong}
          className="btn btn-primary text-xs py-2"
        >
          Add Assumption
        </button>
      </div>
    </div>
  );
}

function AddUnknownForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (question: string, priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => void;
  onCancel: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState('');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  return (
    <div className="bg-ops-dark-800/40 rounded-xl p-4 space-y-3 border border-ops-dark-700/30 animate-scale-in">
      <input
        type="text"
        placeholder="What do we need to know?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="input text-sm"
        autoFocus
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as typeof priority)}
        className="input text-sm"
      >
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="btn btn-ghost text-xs py-2">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(question, priority)}
          disabled={!question}
          className="btn btn-primary text-xs py-2"
        >
          Add Unknown
        </button>
      </div>
    </div>
  );
}

function AddActionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (
    description: string,
    owner: string,
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  ) => void;
  onCancel: () => void;
}): JSX.Element {
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  return (
    <div className="bg-ops-dark-800/40 rounded-xl p-4 space-y-3 border border-ops-dark-700/30 animate-scale-in">
      <input
        type="text"
        placeholder="Action description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm"
        autoFocus
      />
      <input
        type="text"
        placeholder="Owner..."
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        className="input text-sm"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as typeof priority)}
        className="input text-sm"
      >
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="btn btn-ghost text-xs py-2">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(description, owner, priority)}
          disabled={!description || !owner}
          className="btn btn-primary text-xs py-2"
        >
          Add Action
        </button>
      </div>
    </div>
  );
}

function AddDecisionForm({
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
  const [description, setDescription] = useState('');
  const [posture, setPosture] = useState<DecisionPosture>('CONTINUE');
  const [rationale, setRationale] = useState('');
  const [assetOwner, setAssetOwner] = useState('');
  const [residualRisk, setResidualRisk] = useState('');

  const treatmentMap: Record<DecisionPosture, string> = {
    CONTINUE: 'Accept',
    DEGRADE: 'Mitigate',
    PAUSE: 'Avoid',
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Decision Title</label>
        <input
          type="text"
          placeholder="Brief title for the decision..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          autoFocus
        />
      </div>
      <div>
        <label className="label">Posture (ESRM Treatment)</label>
        <div className="grid grid-cols-3 gap-3">
          {(['CONTINUE', 'DEGRADE', 'PAUSE'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPosture(p)}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-1 ${
                posture === p
                  ? p === 'CONTINUE'
                    ? 'border-ops-accent-green-500/60 bg-ops-accent-green-500/15 text-ops-accent-green-400 shadow-glow-green'
                    : p === 'DEGRADE'
                      ? 'border-ops-accent-amber-500/60 bg-ops-accent-amber-500/15 text-ops-accent-amber-400 shadow-glow-amber'
                      : 'border-ops-accent-red-500/60 bg-ops-accent-red-500/15 text-ops-accent-red-400 shadow-glow-red'
                  : 'border-ops-dark-700/60 text-ops-dark-400 hover:border-ops-dark-600 hover:text-ops-dark-300'
              }`}
            >
              <span>{p}</span>
              <span className="text-2xs opacity-70">{treatmentMap[p]}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          placeholder="What is being decided and what operations are affected..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="input resize-none"
        />
      </div>
      <div>
        <label className="label">Rationale</label>
        <textarea
          placeholder="Why this decision is being made at this time..."
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          className="input resize-none"
        />
      </div>
      <div className="bg-ops-dark-800/40 rounded-xl p-4 border border-ops-dark-700/30 space-y-4">
        <div className="text-2xs text-ops-dark-500 uppercase tracking-wider font-semibold">
          ESRM Risk Framing (Optional)
        </div>
        <div>
          <label className="label text-ops-dark-400">Asset Owner</label>
          <input
            type="text"
            placeholder="Who owns the risk? (e.g., Facilities Director, Site Manager)"
            value={assetOwner}
            onChange={(e) => setAssetOwner(e.target.value)}
            className="input text-sm"
          />
          <p className="text-2xs text-ops-dark-500 mt-1">
            GSOC advises; asset owner approves posture changes affecting their operations
          </p>
        </div>
        <div>
          <label className="label text-ops-dark-400">Residual Risk</label>
          <textarea
            placeholder="What risk remains after this treatment? What gaps exist?"
            value={residualRisk}
            onChange={(e) => setResidualRisk(e.target.value)}
            rows={2}
            className="input resize-none text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(title, description, posture, rationale, assetOwner, residualRisk)}
          disabled={!title || !description || !rationale}
          className="btn btn-primary"
        >
          Record Decision
        </button>
      </div>
    </div>
  );
}
