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

  const playbook = getVendorCompromisePlaybook();

  useEffect(() => {
    const decisionLog = createScenarioById(scenarioId);
    if (decisionLog) {
      setLog(decisionLog);
    }
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
    (title: string, description: string, posture: DecisionPosture, rationale: string) => {
      if (log) {
        setLog(
          recordDecision(log, {
            title,
            description,
            posture,
            owner: 'GSOC Manager',
            ownerRole: 'Incident Commander',
            rationale,
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

  if (!log) {
    return (
      <div className="min-h-screen bg-ops-dark-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-ops-accent-amber mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ops-dark-100 mb-2">Scenario Not Found</h2>
          <p className="text-ops-dark-400 mb-4">The requested scenario could not be loaded.</p>
          <Link href="/" className="btn btn-primary">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats(log);

  return (
    <div className="min-h-screen bg-ops-dark-950">
      {/* Header */}
      <header className="border-b border-ops-dark-800 bg-ops-dark-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-ops-dark-800 transition-colors"
                title="Back to scenarios"
              >
                <ArrowLeft className="w-5 h-5 text-ops-dark-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ops-accent-green/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-ops-accent-green" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-ops-dark-50">{log.incident.title}</h1>
                  <p className="text-xs text-ops-dark-400 font-mono">Training Scenario</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-ops-dark-400">Elapsed</div>
                <div className="font-mono text-ops-accent-green">{elapsedMinutes}m</div>
              </div>
              <span
                className={`status-badge ${
                  log.incident.severity === 'CRITICAL' ? 'severity-critical' : 'severity-high'
                }`}
              >
                {log.incident.severity}
              </span>
              <span className="status-badge status-active">
                <span className="w-1.5 h-1.5 rounded-full bg-ops-accent-green animate-pulse" />
                {log.incident.status}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {(['overview', 'decisions', 'playbook', 'export'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-ops-dark-800 text-ops-dark-50 border-t border-l border-r border-ops-dark-700'
                    : 'text-ops-dark-400 hover:text-ops-dark-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Governance Banner */}
        <div className="governance-banner mb-6 flex items-center gap-3">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            <strong>Training Mode:</strong> This is a synthetic scenario. All decisions are for
            practice only. Human judgment remains essential in actual incidents.
          </p>
        </div>

        {activeTab === 'overview' && (
          <OverviewTab
            log={log}
            stats={stats}
            onAddFact={handleAddFact}
            onAddAssumption={handleAddAssumption}
            onAddUnknown={handleAddUnknown}
            onAddAction={handleAddAction}
            onToggleActionComplete={handleToggleActionComplete}
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
      </main>
    </div>
  );
}

// Overview Tab Component
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
}

function OverviewTab({
  log,
  stats,
  onAddFact,
  onAddAssumption,
  onAddUnknown,
  onAddAction,
  onToggleActionComplete,
}: OverviewTabProps): JSX.Element {
  const [showAddFact, setShowAddFact] = useState(false);
  const [showAddAssumption, setShowAddAssumption] = useState(false);
  const [showAddUnknown, setShowAddUnknown] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Incident Info & Metrics */}
      <div className="space-y-6">
        {/* Incident Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-100">Incident Summary</h3>
          </div>
          <div className="card-body space-y-4">
            <p className="text-sm text-ops-dark-300">{log.incident.description}</p>
            {log.vendorContext && (
              <div className="bg-ops-dark-800/50 rounded-lg p-3 space-y-2">
                <div className="text-xs text-ops-dark-500 uppercase tracking-wider">
                  Vendor Context
                </div>
                <div className="text-sm text-ops-dark-200">{log.vendorContext.vendorName}</div>
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

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="metric-card">
            <div className="metric-value text-ops-accent-green">{stats.totalFacts}</div>
            <div className="metric-label">Facts</div>
          </div>
          <div className="metric-card">
            <div className="metric-value text-ops-accent-amber">{stats.totalAssumptions}</div>
            <div className="metric-label">Assumptions</div>
          </div>
          <div className="metric-card">
            <div className="metric-value text-ops-accent-red">{stats.totalUnknowns}</div>
            <div className="metric-label">Unknowns</div>
          </div>
          <div className="metric-card">
            <div className="metric-value text-ops-accent-blue">{stats.totalDecisions}</div>
            <div className="metric-label">Decisions</div>
          </div>
        </div>
      </div>

      {/* Middle Column - Facts, Assumptions, Unknowns */}
      <div className="space-y-6">
        {/* Facts */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-accent-green">Facts</h3>
            <button
              onClick={() => setShowAddFact(!showAddFact)}
              className="p-1 rounded hover:bg-ops-dark-700 transition-colors"
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
              <p className="text-sm text-ops-dark-500">No facts recorded yet.</p>
            ) : (
              log.facts.map((fact) => (
                <div key={fact.id} className="bg-ops-dark-800/50 rounded-lg p-3">
                  <p className="text-sm text-ops-dark-200">{fact.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-ops-dark-500">
                    <span className="uppercase">[{fact.confidence}]</span>
                    <span>Source: {fact.source}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assumptions */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-accent-amber">Assumptions</h3>
            <button
              onClick={() => setShowAddAssumption(!showAddAssumption)}
              className="p-1 rounded hover:bg-ops-dark-700 transition-colors"
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
              <p className="text-sm text-ops-dark-500">No assumptions recorded yet.</p>
            ) : (
              log.assumptions.map((assumption) => (
                <div key={assumption.id} className="bg-ops-dark-800/50 rounded-lg p-3">
                  <p className="text-sm text-ops-dark-200">{assumption.description}</p>
                  <div className="mt-2 text-xs text-ops-dark-500">
                    <div>Basis: {assumption.basis}</div>
                    <div className="text-ops-accent-red/80">
                      Risk if wrong: {assumption.riskIfWrong}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unknowns */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-accent-red">Unknowns</h3>
            <button
              onClick={() => setShowAddUnknown(!showAddUnknown)}
              className="p-1 rounded hover:bg-ops-dark-700 transition-colors"
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
              <p className="text-sm text-ops-dark-500">No unknowns recorded yet.</p>
            ) : (
              log.unknowns.map((unknown) => (
                <div key={unknown.id} className="bg-ops-dark-800/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`status-badge text-xs ${
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
                  <p className="text-sm text-ops-dark-200 mt-2">{unknown.question}</p>
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

      {/* Right Column - Actions */}
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-100">Action Items</h3>
            <button
              onClick={() => setShowAddAction(!showAddAction)}
              className="p-1 rounded hover:bg-ops-dark-700 transition-colors"
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
              <p className="text-sm text-ops-dark-500">No action items yet.</p>
            ) : (
              log.actionItems.map((action) => (
                <div
                  key={action.id}
                  className="checklist-item"
                  onClick={() => onToggleActionComplete(action.id, action.status)}
                >
                  <div
                    className={`checklist-checkbox ${
                      action.status === 'COMPLETED' ? 'checked' : ''
                    }`}
                  >
                    {action.status === 'COMPLETED' && (
                      <CheckCircle2 className="w-4 h-4 text-ops-dark-950" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        action.status === 'COMPLETED'
                          ? 'text-ops-dark-500 line-through'
                          : 'text-ops-dark-200'
                      }`}
                    >
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-ops-dark-500">{action.owner}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          action.priority === 'CRITICAL'
                            ? 'bg-ops-accent-red/20 text-ops-accent-red'
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

        {/* Timeline */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-100">Timeline</h3>
            <Clock className="w-4 h-4 text-ops-dark-400" />
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {log.timeline
                .slice(-5)
                .reverse()
                .map((event) => (
                  <div key={event.id} className="relative pl-6">
                    <div
                      className={`timeline-dot ${
                        event.type === 'DECISION'
                          ? 'bg-ops-accent-blue'
                          : event.type === 'DETECTION'
                            ? 'bg-ops-accent-red'
                            : 'bg-ops-dark-600'
                      }`}
                    />
                    <div className="text-xs text-ops-dark-500 mb-0.5">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-ops-dark-200">{event.title}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Decisions Tab Component
interface DecisionsTabProps {
  log: DecisionLog;
  stats: ReturnType<typeof calculateStats>;
  onRecordDecision: (
    title: string,
    description: string,
    posture: DecisionPosture,
    rationale: string
  ) => void;
}

function DecisionsTab({ log, stats, onRecordDecision }: DecisionsTabProps): JSX.Element {
  const [showAddDecision, setShowAddDecision] = useState(false);

  return (
    <div className="space-y-6">
      {/* Posture Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card posture-continue">
          <div className="card-body text-center">
            <div className="text-4xl font-bold mb-2">{stats.postureBreakdown.CONTINUE}</div>
            <div className="text-sm uppercase tracking-wider">Continue</div>
          </div>
        </div>
        <div className="card posture-degrade">
          <div className="card-body text-center">
            <div className="text-4xl font-bold mb-2">{stats.postureBreakdown.DEGRADE}</div>
            <div className="text-sm uppercase tracking-wider">Degrade</div>
          </div>
        </div>
        <div className="card posture-pause">
          <div className="card-body text-center">
            <div className="text-4xl font-bold mb-2">{stats.postureBreakdown.PAUSE}</div>
            <div className="text-sm uppercase tracking-wider">Pause</div>
          </div>
        </div>
      </div>

      {/* Add Decision Button */}
      <div className="flex justify-end">
        <button onClick={() => setShowAddDecision(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Record Decision
        </button>
      </div>

      {/* Add Decision Form */}
      {showAddDecision && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-100">Record New Decision</h3>
          </div>
          <div className="card-body">
            <AddDecisionForm
              onSubmit={(title, desc, posture, rationale) => {
                onRecordDecision(title, desc, posture, rationale);
                setShowAddDecision(false);
              }}
              onCancel={() => setShowAddDecision(false)}
            />
          </div>
        </div>
      )}

      {/* Decisions List */}
      <div className="space-y-4">
        {log.decisions.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <Radio className="w-12 h-12 text-ops-dark-600 mx-auto mb-4" />
              <p className="text-ops-dark-400">No decisions recorded yet.</p>
              <p className="text-sm text-ops-dark-500 mt-1">
                Record decisions as you progress through the incident response.
              </p>
            </div>
          </div>
        ) : (
          log.decisions.map((decision) => (
            <div key={decision.id} className="card">
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
                  <h4 className="font-semibold text-ops-dark-100">{decision.title}</h4>
                </div>
                <div className="text-xs text-ops-dark-500 font-mono">
                  {new Date(decision.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="card-body">
                <p className="text-sm text-ops-dark-300 mb-4">{decision.description}</p>
                <div className="bg-ops-dark-800/50 rounded-lg p-3">
                  <div className="text-xs text-ops-dark-500 uppercase tracking-wider mb-1">
                    Rationale
                  </div>
                  <p className="text-sm text-ops-dark-200">{decision.rationale}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-ops-dark-500">
                  <div className="flex items-center gap-1">
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

// Playbook Tab Component
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
      {/* Playbook Header */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-xl font-semibold text-ops-dark-100 mb-2">{playbook.name}</h3>
          <p className="text-sm text-ops-dark-400 mb-4">{playbook.description}</p>
          <div className="flex items-center gap-6 text-sm">
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

      {/* Phase List */}
      <div className="space-y-4">
        {playbook.phases.map((phase, index) => {
          const isExpanded = expandedPhase === phase.id;
          const completedCount = phase.checklistItems.filter((item) =>
            completedChecklist.has(item.id)
          ).length;
          const totalCount = phase.checklistItems.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={phase.id} className="card">
              <button
                className="card-header w-full text-left"
                onClick={() => onPhaseToggle(isExpanded ? null : phase.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`phase-dot ${
                      progress === 100 ? 'completed' : progress > 0 ? 'active' : 'pending'
                    }`}
                  />
                  <div>
                    <div className="text-sm text-ops-dark-500">
                      Phase {index + 1} • {phase.durationMinutes} min
                    </div>
                    <h4 className="font-semibold text-ops-dark-100">{phase.name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-ops-dark-500">Progress</div>
                    <div className="text-sm font-mono text-ops-dark-300">
                      {completedCount}/{totalCount}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-ops-dark-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ops-dark-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="card-body border-t border-ops-dark-800">
                  <p className="text-sm text-ops-dark-400 mb-4">{phase.description}</p>

                  {/* Objectives */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-ops-dark-200 mb-2">Objectives</h5>
                    <ul className="space-y-1">
                      {phase.objectives.map((obj, i) => (
                        <li key={i} className="text-sm text-ops-dark-400 flex items-start gap-2">
                          <Circle className="w-3 h-3 mt-1.5 text-ops-accent-green" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Questions */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-ops-dark-200 mb-2">Key Questions</h5>
                    <ul className="space-y-1">
                      {phase.keyQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-ops-dark-400">
                          • {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Checklist */}
                  <div>
                    <h5 className="text-sm font-semibold text-ops-dark-200 mb-3">Checklist</h5>
                    <div className="space-y-1">
                      {phase.checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="checklist-item"
                          onClick={() => onChecklistToggle(item.id)}
                        >
                          <div
                            className={`checklist-checkbox ${
                              completedChecklist.has(item.id) ? 'checked' : ''
                            }`}
                          >
                            {completedChecklist.has(item.id) && (
                              <CheckCircle2 className="w-4 h-4 text-ops-dark-950" />
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
                            <span className="text-xs text-ops-accent-red">Required</span>
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

      {/* Governance Notes */}
      <div className="card">
        <div className="card-header">
          <h4 className="font-semibold text-ops-dark-100">Governance Notes</h4>
        </div>
        <div className="card-body">
          <ul className="space-y-3">
            {playbook.governanceNotes.map((note, i) => (
              <li key={i} className="text-sm text-ops-dark-400 flex items-start gap-3">
                <Lock className="w-4 h-4 mt-0.5 text-ops-accent-amber flex-shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Export Tab Component
interface ExportTabProps {
  log: DecisionLog;
  onExport: (format: 'markdown' | 'json') => void;
}

function ExportTab({ log, onExport }: ExportTabProps): JSX.Element {
  const stats = calculateStats(log);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <div className="card-body text-center py-8">
          <FileText className="w-16 h-16 text-ops-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ops-dark-100 mb-2">
            Export After-Action Report
          </h3>
          <p className="text-sm text-ops-dark-400 mb-6">
            Generate a comprehensive after-action report documenting all decisions, facts,
            assumptions, and timeline events from this training exercise.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-ops-dark-800/50 rounded-lg p-4 text-left">
              <div className="text-3xl font-bold text-ops-accent-green mb-1">
                {stats.totalDecisions}
              </div>
              <div className="text-sm text-ops-dark-400">Decisions Recorded</div>
            </div>
            <div className="bg-ops-dark-800/50 rounded-lg p-4 text-left">
              <div className="text-3xl font-bold text-ops-accent-blue mb-1">
                {log.timeline.length}
              </div>
              <div className="text-sm text-ops-dark-400">Timeline Events</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
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
        <p className="text-sm">
          Exported reports include a training/exercise watermark. These are for learning purposes
          and should not be used as actual incident documentation.
        </p>
      </div>
    </div>
  );
}

// Form Components
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
    <div className="bg-ops-dark-800/50 rounded-lg p-3 space-y-3">
      <input
        type="text"
        placeholder="Fact description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm"
      />
      <input
        type="text"
        placeholder="Source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="input text-sm"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-secondary text-xs py-1">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(description, source)}
          disabled={!description || !source}
          className="btn btn-primary text-xs py-1 disabled:opacity-50"
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
    <div className="bg-ops-dark-800/50 rounded-lg p-3 space-y-3">
      <input
        type="text"
        placeholder="Assumption..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm"
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
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-secondary text-xs py-1">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(description, basis, riskIfWrong)}
          disabled={!description || !basis || !riskIfWrong}
          className="btn btn-primary text-xs py-1 disabled:opacity-50"
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
    <div className="bg-ops-dark-800/50 rounded-lg p-3 space-y-3">
      <input
        type="text"
        placeholder="What do we need to know?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
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
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-secondary text-xs py-1">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(question, priority)}
          disabled={!question}
          className="btn btn-primary text-xs py-1 disabled:opacity-50"
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
    <div className="bg-ops-dark-800/50 rounded-lg p-3 space-y-3">
      <input
        type="text"
        placeholder="Action description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm"
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
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-secondary text-xs py-1">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(description, owner, priority)}
          disabled={!description || !owner}
          className="btn btn-primary text-xs py-1 disabled:opacity-50"
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
    rationale: string
  ) => void;
  onCancel: () => void;
}): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posture, setPosture] = useState<DecisionPosture>('CONTINUE');
  const [rationale, setRationale] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Decision Title</label>
        <input
          type="text"
          placeholder="Brief title for the decision..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Posture</label>
        <div className="grid grid-cols-3 gap-3">
          {(['CONTINUE', 'DEGRADE', 'PAUSE'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPosture(p)}
              className={`py-3 rounded-lg border text-sm font-medium transition-colors ${
                posture === p
                  ? p === 'CONTINUE'
                    ? 'posture-continue'
                    : p === 'DEGRADE'
                      ? 'posture-degrade'
                      : 'posture-pause'
                  : 'border-ops-dark-700 text-ops-dark-400 hover:border-ops-dark-600'
              }`}
            >
              {p}
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
          rows={3}
          className="input resize-none"
        />
      </div>
      <div>
        <label className="label">Rationale</label>
        <textarea
          placeholder="Why this decision is being made at this time..."
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          className="input resize-none"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(title, description, posture, rationale)}
          disabled={!title || !description || !rationale}
          className="btn btn-primary disabled:opacity-50"
        >
          Record Decision
        </button>
      </div>
    </div>
  );
}
