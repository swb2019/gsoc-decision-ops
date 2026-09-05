'use client';

import { useState } from 'react';
import {
  Shield,
  ArrowLeft,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { getVendorCompromisePlaybook } from '@gsoc-decision-ops/core';
import Link from 'next/link';

export default function PlaybookPage(): JSX.Element {
  const playbook = getVendorCompromisePlaybook();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhase = (phaseId: string): void => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const expandAll = (): void => {
    setExpandedPhases(new Set(playbook.phases.map((p) => p.id)));
  };

  const collapseAll = (): void => {
    setExpandedPhases(new Set());
  };

  return (
    <div className="min-h-screen bg-ops-dark-950">
      {/* Header */}
      <header className="border-b border-ops-dark-800 bg-ops-dark-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-ops-dark-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-ops-dark-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ops-accent-green/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-ops-accent-green" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-ops-dark-50">Response Playbook</h1>
                <p className="text-xs text-ops-dark-400 font-mono">
                  Vendor Compromise First-Hour Framework
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="btn btn-secondary text-xs">
              Expand All
            </button>
            <button onClick={collapseAll} className="btn btn-secondary text-xs">
              Collapse All
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Playbook Overview */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ops-dark-50 mb-2">{playbook.name}</h2>
                <p className="text-ops-dark-400 max-w-2xl">{playbook.description}</p>
              </div>
              <span className="status-badge bg-ops-dark-800 text-ops-dark-300 border-ops-dark-700">
                v{playbook.version}
              </span>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-ops-dark-800/50 rounded-lg p-4 text-center">
                <Clock className="w-6 h-6 text-ops-accent-green mx-auto mb-2" />
                <div className="text-2xl font-bold text-ops-dark-100">
                  {playbook.totalDurationMinutes}
                </div>
                <div className="text-xs text-ops-dark-500">Minutes Total</div>
              </div>
              <div className="bg-ops-dark-800/50 rounded-lg p-4 text-center">
                <FileText className="w-6 h-6 text-ops-accent-blue mx-auto mb-2" />
                <div className="text-2xl font-bold text-ops-dark-100">{playbook.phases.length}</div>
                <div className="text-xs text-ops-dark-500">Response Phases</div>
              </div>
              <div className="bg-ops-dark-800/50 rounded-lg p-4 text-center">
                <AlertTriangle className="w-6 h-6 text-ops-accent-amber mx-auto mb-2" />
                <div className="text-2xl font-bold text-ops-dark-100">
                  {playbook.phases.reduce((sum, p) => sum + p.checklistItems.length, 0)}
                </div>
                <div className="text-xs text-ops-dark-500">Checklist Items</div>
              </div>
              <div className="bg-ops-dark-800/50 rounded-lg p-4 text-center">
                <Lock className="w-6 h-6 text-ops-accent-red mx-auto mb-2" />
                <div className="text-2xl font-bold text-ops-dark-100">
                  {playbook.governanceNotes.length}
                </div>
                <div className="text-xs text-ops-dark-500">Governance Notes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Applicable Scenarios */}
        <div className="card mb-8">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-100">Applicable Scenarios</h3>
          </div>
          <div className="card-body">
            <div className="grid md:grid-cols-2 gap-3">
              {playbook.applicableScenarios.map((scenario, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-ops-dark-800/50 rounded-lg px-4 py-3"
                >
                  <AlertTriangle className="w-4 h-4 text-ops-accent-amber flex-shrink-0" />
                  <span className="text-sm text-ops-dark-300">{scenario}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Overview */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-ops-dark-100 mb-4">Phase Timeline</h3>
          <div className="flex gap-1 mb-6">
            {playbook.phases.map((phase, i) => {
              const widthPercent = (phase.durationMinutes / playbook.totalDurationMinutes) * 100;
              const colors = [
                'bg-ops-accent-red',
                'bg-ops-accent-amber',
                'bg-ops-accent-green',
                'bg-ops-accent-blue',
                'bg-ops-accent-cyan',
              ];
              return (
                <div
                  key={phase.id}
                  className={`${colors[i % colors.length]} rounded h-8 flex items-center justify-center`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <span className="text-xs font-medium text-ops-dark-950">
                    {phase.durationMinutes}m
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-ops-dark-500 font-mono">
            <span>0:00</span>
            <span>0:10</span>
            <span>0:20</span>
            <span>0:35</span>
            <span>0:50</span>
            <span>1:00</span>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4 mb-8">
          {playbook.phases.map((phase, index) => {
            const isExpanded = expandedPhases.has(phase.id);
            const colors = [
              {
                bg: 'bg-ops-accent-red/20',
                border: 'border-ops-accent-red/40',
                text: 'text-ops-accent-red',
              },
              {
                bg: 'bg-ops-accent-amber/20',
                border: 'border-ops-accent-amber/40',
                text: 'text-ops-accent-amber',
              },
              {
                bg: 'bg-ops-accent-green/20',
                border: 'border-ops-accent-green/40',
                text: 'text-ops-accent-green',
              },
              {
                bg: 'bg-ops-accent-blue/20',
                border: 'border-ops-accent-blue/40',
                text: 'text-ops-accent-blue',
              },
              {
                bg: 'bg-ops-accent-cyan/20',
                border: 'border-ops-accent-cyan/40',
                text: 'text-ops-accent-cyan',
              },
            ];
            const color = colors[index % colors.length];

            return (
              <div key={phase.id} className="card">
                <button
                  className="card-header w-full text-left"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg ${color.bg} ${color.border} border flex items-center justify-center`}
                    >
                      <span className={`text-lg font-bold ${color.text}`}>{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-ops-dark-100">{phase.name}</h4>
                        <span className="text-xs text-ops-dark-500 font-mono">
                          {phase.durationMinutes} min
                        </span>
                      </div>
                      <p className="text-sm text-ops-dark-400 mt-0.5 line-clamp-1">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-ops-dark-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-ops-dark-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="card-body border-t border-ops-dark-800 space-y-6">
                    {/* Description */}
                    <p className="text-sm text-ops-dark-300">{phase.description}</p>

                    {/* Objectives */}
                    <div>
                      <h5 className="text-sm font-semibold text-ops-dark-200 mb-3 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                        Objectives
                      </h5>
                      <ul className="space-y-2 pl-4">
                        {phase.objectives.map((obj, i) => (
                          <li key={i} className="text-sm text-ops-dark-400 list-disc list-inside">
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Questions */}
                    <div>
                      <h5 className="text-sm font-semibold text-ops-dark-200 mb-3 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                        Key Questions
                      </h5>
                      <div className="grid md:grid-cols-2 gap-2">
                        {phase.keyQuestions.map((q, i) => (
                          <div
                            key={i}
                            className="text-sm text-ops-dark-400 bg-ops-dark-800/30 rounded-lg p-3"
                          >
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checklist */}
                    <div>
                      <h5 className="text-sm font-semibold text-ops-dark-200 mb-3 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                        Checklist ({phase.checklistItems.length} items)
                      </h5>
                      <div className="grid md:grid-cols-2 gap-2">
                        {phase.checklistItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 bg-ops-dark-800/30 rounded-lg p-3"
                          >
                            <div className="w-4 h-4 rounded border border-ops-dark-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ops-dark-300">{item.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {item.owner && (
                                  <span className="text-xs text-ops-dark-500">{item.owner}</span>
                                )}
                                {item.required && (
                                  <span className="text-xs text-ops-accent-red">Required</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Escalation Triggers */}
                    {phase.escalationTriggers && phase.escalationTriggers.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-ops-accent-red mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Escalation Triggers
                        </h5>
                        <ul className="space-y-2">
                          {phase.escalationTriggers.map((trigger, i) => (
                            <li
                              key={i}
                              className="text-sm text-ops-dark-400 bg-ops-accent-red/10 border border-ops-accent-red/20 rounded-lg px-4 py-2"
                            >
                              {trigger}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Governance Notes */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ops-dark-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-ops-accent-amber" />
              Governance Notes
            </h3>
          </div>
          <div className="card-body">
            <ul className="space-y-4">
              {playbook.governanceNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-ops-accent-amber/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-ops-accent-amber">{i + 1}</span>
                  </div>
                  <p className="text-sm text-ops-dark-300">{note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ops-dark-800 mt-12 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-ops-dark-500">
          This playbook is a training framework. Actual incidents should follow your
          organization&apos;s established procedures.
        </div>
      </footer>
    </div>
  );
}
