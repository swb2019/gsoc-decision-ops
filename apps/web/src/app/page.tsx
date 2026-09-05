import Link from 'next/link';
import { Shield, Clock, Play, AlertCircle } from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();

  return (
    <div className="min-h-screen bg-ops-dark-950 relative overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ops-accent-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ops-accent-red-500/5 rounded-full blur-3xl" />
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
          <div className="flex items-center gap-2 text-xs text-ops-dark-500">
            <Clock className="w-3.5 h-3.5" />
            <span>60-min scenarios</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10 animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ops-accent-green-500/15 border border-ops-accent-green-500/30 text-xs font-medium text-ops-accent-green-400 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-ops-accent-green-500 animate-pulse" />
            SIMULATION READY
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-ops-dark-50 mb-4 tracking-tight text-balance">
            First-Hour Decision
            <span className="text-gradient-green"> Simulation</span>
          </h1>
          <p className="text-lg text-ops-dark-400 max-w-xl mx-auto leading-relaxed text-balance">
            You're the GSOC leader. A vendor incident just hit. Make the calls. Document the
            rationale. Own the outcome.
          </p>
        </div>

        <div className="mb-10 animate-in-delay-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ops-dark-200 tracking-tight">
              Select Scenario
            </h2>
          </div>
          <div className="space-y-3">
            {scenarios.map((scenario, index) => (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="group block"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="scenario-card flex items-center gap-4 p-4 sm:p-5 rounded-xl">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      scenario.severity === 'CRITICAL'
                        ? 'bg-ops-accent-red-500/15 text-ops-accent-red-400'
                        : 'bg-ops-accent-amber-500/15 text-ops-accent-amber-400'
                    }`}
                  >
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-ops-dark-50">{scenario.name}</span>
                      <span
                        className={`text-2xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          scenario.severity === 'CRITICAL'
                            ? 'bg-ops-accent-red-500/20 text-ops-accent-red-400'
                            : 'bg-ops-accent-amber-500/20 text-ops-accent-amber-400'
                        }`}
                      >
                        {scenario.severity}
                      </span>
                    </div>
                    <p className="text-sm text-ops-dark-400 line-clamp-1">{scenario.description}</p>
                    <p className="text-xs text-ops-dark-500 mt-1">{scenario.vendorType}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="hidden sm:inline text-sm font-medium text-ops-dark-500 group-hover:text-ops-accent-green-400 transition-colors">
                      Enter Sim
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-ops-dark-800/60 group-hover:bg-ops-accent-green-500/20 flex items-center justify-center transition-all">
                      <Play className="w-4 h-4 text-ops-dark-400 group-hover:text-ops-accent-green-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 mb-10 animate-in-delay-2">
          <h3 className="text-sm font-semibold text-ops-dark-300 mb-4 uppercase tracking-wider">
            Decision Postures
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-ops-accent-green-500/8 border border-ops-accent-green-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-ops-accent-green-500" />
                <span className="font-bold text-ops-accent-green-400 text-sm">CONTINUE</span>
              </div>
              <p className="text-xs text-ops-dark-400">
                Risk within tolerance. Proceed with monitoring.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-ops-accent-amber-500/8 border border-ops-accent-amber-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-ops-accent-amber-500" />
                <span className="font-bold text-ops-accent-amber-400 text-sm">DEGRADE</span>
              </div>
              <p className="text-xs text-ops-dark-400">
                Reduce exposure via compensating controls.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-ops-accent-red-500/8 border border-ops-accent-red-500/20">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-ops-accent-red-500" />
                <span className="font-bold text-ops-accent-red-400 text-sm">PAUSE</span>
              </div>
              <p className="text-xs text-ops-dark-400">Halt operations to eliminate exposure.</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 animate-in-delay-3">
          <h3 className="text-sm font-semibold text-ops-dark-300 mb-3 uppercase tracking-wider">
            How It Works
          </h3>
          <div className="grid sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-ops-accent-green-400 mb-1">1</div>
              <p className="text-xs text-ops-dark-400">Briefing & initial intel</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-ops-accent-amber-400 mb-1">2</div>
              <p className="text-xs text-ops-dark-400">Live injects arrive</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-ops-accent-blue-400 mb-1">3</div>
              <p className="text-xs text-ops-dark-400">Make posture calls</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-ops-dark-400 mb-1">4</div>
              <p className="text-xs text-ops-dark-400">Debrief & export AAR</p>
            </div>
          </div>
        </div>

        <footer className="text-center mt-10 pt-6 border-t border-ops-dark-800/30">
          <p className="text-xs text-ops-dark-600">
            Training Simulation · Built on ESRM principles
          </p>
        </footer>
      </main>
    </div>
  );
}
