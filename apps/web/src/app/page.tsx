import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  Clock,
  FileText,
  CheckCircle,
  Brain,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Target,
} from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();

  return (
    <div className="min-h-screen bg-ops-dark-950 relative overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ops-accent-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ops-accent-blue-500/5 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-ops-dark-800/60 bg-ops-dark-900/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ops-accent-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-ops-accent-green-500/20 transition-transform duration-300 group-hover:scale-105">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-ops-dark-50 text-lg tracking-tight">
                GSOC Decision Ops
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-ops-accent-amber-500/10 border border-ops-accent-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-ops-accent-amber-400" />
            <span className="text-xs font-semibold text-ops-accent-amber-400 uppercase tracking-wider">
              Portfolio Demo
            </span>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12 animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ops-dark-800/60 border border-ops-dark-700/50 text-xs font-medium text-ops-dark-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-ops-accent-green-500 animate-pulse" />
            Built on Resolver-class + ESRM Principles
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-ops-dark-50 mb-5 tracking-tight text-balance">
            First-Hour Decision
            <span className="text-gradient-green"> Training</span>
          </h1>
          <p className="text-xl text-ops-dark-400 max-w-2xl mx-auto leading-relaxed text-balance">
            Practice structured decision-making under incomplete information. Separate facts from
            assumptions. Advise asset owners on residual risk.
          </p>
        </div>

        {/* Honesty strip */}
        <div className="governance-banner mb-12 animate-in-delay-1">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Training Tool — Not Production Software</p>
              <p className="text-xs text-ops-accent-amber-400/80">
                All scenarios are synthetic. This tool trains first-hour judgment beside
                Resolver-class platforms — it does not replace enterprise incident management or
                ESRM programs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            {
              icon: Brain,
              label: 'Select Scenario',
              desc: 'Synthetic vendor incidents',
              color: 'green',
              delay: '1',
            },
            {
              icon: CheckCircle,
              label: 'Log Decisions',
              desc: 'Facts, assumptions, posture',
              color: 'blue',
              delay: '2',
            },
            {
              icon: Clock,
              label: 'Follow Playbook',
              desc: '60-minute framework',
              color: 'amber',
              delay: '3',
            },
            {
              icon: FileText,
              label: 'Export Report',
              desc: 'After-action in 2 min',
              color: 'green',
              delay: '4' as const,
            },
          ].map((step, i) => (
            <div
              key={step.label}
              className={`text-center p-6 rounded-2xl bg-ops-dark-900/40 border border-ops-dark-800/50 backdrop-blur-sm hover:bg-ops-dark-900/60 hover:border-ops-dark-700/50 transition-all duration-300 animate-in-delay-${Math.min(i + 1, 3) as 1 | 2 | 3}`}
            >
              <div className={`icon-box icon-box-${step.color} mx-auto mb-4`}>
                <step.icon className="w-6 h-6" />
              </div>
              <div className="font-semibold text-ops-dark-100 mb-1">{step.label}</div>
              <div className="text-sm text-ops-dark-500">{step.desc}</div>
            </div>
          ))}
        </div>

        <div className="mb-16 animate-in-delay-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-ops-dark-50 tracking-tight">
              Training Scenarios
            </h2>
            <div className="text-sm text-ops-dark-500">{scenarios.length} available</div>
          </div>
          <div className="space-y-4">
            {scenarios.map((scenario, index) => (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="scenario-card group flex items-center gap-5 p-5 rounded-2xl"
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div
                  className={`icon-box flex-shrink-0 ${
                    scenario.severity === 'CRITICAL' ? 'icon-box-red' : 'icon-box-amber'
                  }`}
                >
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <span className="font-semibold text-ops-dark-50 text-lg">{scenario.name}</span>
                    <span
                      className={`text-2xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        scenario.severity === 'CRITICAL'
                          ? 'bg-ops-accent-red-500/15 text-ops-accent-red-400 border border-ops-accent-red-500/20'
                          : 'bg-ops-accent-amber-500/15 text-ops-accent-amber-400 border border-ops-accent-amber-500/20'
                      }`}
                    >
                      {scenario.severity}
                    </span>
                  </div>
                  <p className="text-sm text-ops-dark-400 line-clamp-1">{scenario.description}</p>
                </div>
                <div className="flex-shrink-0 p-2 rounded-xl bg-ops-dark-800/0 group-hover:bg-ops-dark-800/60 transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-ops-dark-600 group-hover:text-ops-accent-green-400 group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Decision Postures with ESRM mapping */}
        <div className="glass-card p-8 mb-8 animate-in-delay-3">
          <h3 className="text-xl font-semibold text-ops-dark-50 mb-2 tracking-tight">
            Decision Postures
          </h3>
          <p className="text-sm text-ops-dark-500 mb-6">
            Mapped to ESRM risk treatment: Accept → Mitigate → Avoid
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-ops-accent-green-500/8 border border-ops-accent-green-500/20 hover:border-ops-accent-green-500/35 transition-colors duration-300">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-ops-accent-green-500 shadow-sm shadow-ops-accent-green-500/50" />
                <div className="font-bold text-ops-accent-green-400 uppercase tracking-wider text-sm">
                  Continue
                </div>
              </div>
              <div className="text-2xs text-ops-dark-500 uppercase tracking-wider mb-2">
                Treatment: Accept
              </div>
              <div className="text-sm text-ops-dark-400 leading-relaxed">
                Risk within tolerance. Proceed with monitoring.
              </div>
            </div>
            <div className="p-5 rounded-xl bg-ops-accent-amber-500/8 border border-ops-accent-amber-500/20 hover:border-ops-accent-amber-500/35 transition-colors duration-300">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-ops-accent-amber-500 shadow-sm shadow-ops-accent-amber-500/50" />
                <div className="font-bold text-ops-accent-amber-400 uppercase tracking-wider text-sm">
                  Degrade
                </div>
              </div>
              <div className="text-2xs text-ops-dark-500 uppercase tracking-wider mb-2">
                Treatment: Mitigate
              </div>
              <div className="text-sm text-ops-dark-400 leading-relaxed">
                Reduce exposure via compensating controls.
              </div>
            </div>
            <div className="p-5 rounded-xl bg-ops-accent-red-500/8 border border-ops-accent-red-500/20 hover:border-ops-accent-red-500/35 transition-colors duration-300">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-ops-accent-red-500 shadow-sm shadow-ops-accent-red-500/50" />
                <div className="font-bold text-ops-accent-red-400 uppercase tracking-wider text-sm">
                  Pause
                </div>
              </div>
              <div className="text-2xs text-ops-dark-500 uppercase tracking-wider mb-2">
                Treatment: Avoid
              </div>
              <div className="text-sm text-ops-dark-400 leading-relaxed">
                Halt operations to eliminate exposure.
              </div>
            </div>
          </div>
        </div>

        {/* How This Trains You (F15) */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6 animate-in-delay-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box icon-box-green">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-ops-dark-50">How This Trains You</h3>
            </div>
            <ul className="space-y-3 text-sm text-ops-dark-400">
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-ops-accent-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-ops-dark-300">Tabletop exercise design</strong> — Single
                  learning objective, escalating injects, forced decisions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-ops-accent-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-ops-dark-300">Klein RPD model</strong> — Cue recognition,
                  mental simulation, satisficing first workable posture
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-ops-accent-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-ops-dark-300">Military AAR</strong> — Intended vs actual,
                  sustains, improves, action items with owner
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-ops-accent-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-ops-dark-300">ESRM principles</strong> — Asset owner owns
                  risk; GSOC advises on residual risk
                </span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-6 animate-in-delay-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box icon-box-red">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-ops-dark-50">What This Is NOT</h3>
            </div>
            <ul className="space-y-3 text-sm text-ops-dark-400">
              <li className="flex items-start gap-2">
                <span className="text-ops-accent-red-400 mt-0.5">✕</span>
                <span>
                  <strong className="text-ops-dark-300">Not a Resolver replacement</strong> — Trains
                  beside Resolver-class tools, does not replicate case management
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ops-accent-red-400 mt-0.5">✕</span>
                <span>
                  <strong className="text-ops-dark-300">Not a full ESRM suite</strong> — Teaches
                  principles; no assessments, integrations, or compliance reporting
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ops-accent-red-400 mt-0.5">✕</span>
                <span>
                  <strong className="text-ops-dark-300">Not production software</strong> — Training
                  scenarios only; not a system of record
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ops-accent-red-400 mt-0.5">✕</span>
                <span>
                  <strong className="text-ops-dark-300">Not SIEM/detection</strong> — No log
                  ingestion or threat detection capabilities
                </span>
              </li>
            </ul>
          </div>
        </div>

        <footer className="text-center border-t border-ops-dark-800/50 pt-8">
          <p className="text-sm text-ops-dark-500 mb-3 max-w-lg mx-auto">
            <span className="text-ops-dark-300 font-medium">Portfolio Demonstration</span> — All
            scenarios are synthetic. Trains first-hour judgment beside enterprise platforms.
          </p>
          <p className="text-xs text-ops-dark-600">
            Shannon Brown · GSOC Manager · Harvard ALM/ALB · CompTIA CySA+
          </p>
        </footer>
      </main>
    </div>
  );
}
