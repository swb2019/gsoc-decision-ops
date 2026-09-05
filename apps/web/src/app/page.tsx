import Link from 'next/link';
import { Shield, ArrowRight, Clock, FileText, CheckCircle, Brain, Sparkles } from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();

  return (
    <div className="min-h-screen bg-ops-dark-950 relative overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />
      
      <div 
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
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
              <span className="font-semibold text-ops-dark-50 text-lg tracking-tight">GSOC Decision Ops</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-ops-accent-amber-500/10 border border-ops-accent-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-ops-accent-amber-400" />
            <span className="text-xs font-semibold text-ops-accent-amber-400 uppercase tracking-wider">Demo</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16 animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ops-dark-800/60 border border-ops-dark-700/50 text-xs font-medium text-ops-dark-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-ops-accent-green-500 animate-pulse" />
            First-Principles Design
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-ops-dark-50 mb-5 tracking-tight text-balance">
            First-Hour Decision
            <span className="text-gradient-green"> Training</span>
          </h1>
          <p className="text-xl text-ops-dark-400 max-w-2xl mx-auto leading-relaxed text-balance">
            Practice structured decision-making under incomplete information. 
            Separate facts from assumptions. Make defensible choices.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Brain, label: 'Select Scenario', desc: 'Synthetic vendor incidents', color: 'green', delay: '1' },
            { icon: CheckCircle, label: 'Log Decisions', desc: 'Facts, assumptions, posture', color: 'blue', delay: '2' },
            { icon: Clock, label: 'Follow Playbook', desc: '60-minute framework', color: 'amber', delay: '3' },
            { icon: FileText, label: 'Export Report', desc: 'After-action in 2 min', color: 'green', delay: '4' as const },
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
            <h2 className="text-2xl font-semibold text-ops-dark-50 tracking-tight">Training Scenarios</h2>
            <div className="text-sm text-ops-dark-500">
              {scenarios.length} available
            </div>
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
                    scenario.severity === 'CRITICAL'
                      ? 'icon-box-red'
                      : 'icon-box-amber'
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

        <div className="glass-card p-8 mb-16 animate-in-delay-3">
          <h3 className="text-xl font-semibold text-ops-dark-50 mb-6 tracking-tight">Decision Postures</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-ops-accent-green-500/8 border border-ops-accent-green-500/20 hover:border-ops-accent-green-500/35 transition-colors duration-300">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-ops-accent-green-500 shadow-sm shadow-ops-accent-green-500/50" />
                <div className="font-bold text-ops-accent-green-400 uppercase tracking-wider text-sm">Continue</div>
              </div>
              <div className="text-sm text-ops-dark-400 leading-relaxed">
                Proceed with normal operations. No immediate impact identified.
              </div>
            </div>
            <div className="p-5 rounded-xl bg-ops-accent-amber-500/8 border border-ops-accent-amber-500/20 hover:border-ops-accent-amber-500/35 transition-colors duration-300">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-ops-accent-amber-500 shadow-sm shadow-ops-accent-amber-500/50" />
                <div className="font-bold text-ops-accent-amber-400 uppercase tracking-wider text-sm">Degrade</div>
              </div>
              <div className="text-sm text-ops-dark-400 leading-relaxed">
                Operate with reduced capability. Compensating controls in place.
              </div>
            </div>
            <div className="p-5 rounded-xl bg-ops-accent-red-500/8 border border-ops-accent-red-500/20 hover:border-ops-accent-red-500/35 transition-colors duration-300">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-ops-accent-red-500 shadow-sm shadow-ops-accent-red-500/50" />
                <div className="font-bold text-ops-accent-red-400 uppercase tracking-wider text-sm">Pause</div>
              </div>
              <div className="text-sm text-ops-dark-400 leading-relaxed">
                Halt affected operations. Critical impact, unacceptable risk.
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center border-t border-ops-dark-800/50 pt-8">
          <p className="text-sm text-ops-dark-500 mb-3 max-w-lg mx-auto">
            <span className="text-ops-dark-300 font-medium">Portfolio Demonstration</span> — All scenarios
            are synthetic. Built to demonstrate structured operational decision-making methodology.
          </p>
          <p className="text-xs text-ops-dark-600">
            Created by Shannon Brown · GSOC Manager · Harvard ALM/ALB · CompTIA CySA+
          </p>
        </footer>
      </main>
    </div>
  );
}
