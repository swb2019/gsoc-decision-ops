import Link from 'next/link';
import { Shield, ArrowRight, Clock, FileText, CheckCircle, Brain } from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();

  return (
    <div className="min-h-screen bg-ops-dark-950">
      {/* Simple Header */}
      <header className="border-b border-ops-dark-800 bg-ops-dark-900/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ops-accent-green to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-ops-dark-50 text-lg">GSOC Decision Ops</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ops-accent-amber/10 border border-ops-accent-amber/20">
            <span className="text-xs font-medium text-ops-accent-amber">Portfolio Demo</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Value Proposition - 30 seconds */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ops-dark-50 mb-4">First-Hour Decision Training</h1>
          <p className="text-xl text-ops-dark-400 max-w-2xl mx-auto">
            Practice structured decision-making under incomplete information. Separate facts from
            assumptions. Make defensible choices.
          </p>
        </div>

        {/* Core Loop Explanation */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-lg bg-ops-accent-green/20 flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-ops-accent-green" />
            </div>
            <div className="font-medium text-ops-dark-200 mb-1">Select Scenario</div>
            <div className="text-sm text-ops-dark-500">Synthetic vendor incidents</div>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-lg bg-ops-accent-blue/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-ops-accent-blue" />
            </div>
            <div className="font-medium text-ops-dark-200 mb-1">Log Decisions</div>
            <div className="text-sm text-ops-dark-500">Facts, assumptions, posture</div>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-lg bg-ops-accent-amber/20 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-ops-accent-amber" />
            </div>
            <div className="font-medium text-ops-dark-200 mb-1">Follow Playbook</div>
            <div className="text-sm text-ops-dark-500">60-minute framework</div>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-lg bg-purple-400/20 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div className="font-medium text-ops-dark-200 mb-1">Export Report</div>
            <div className="text-sm text-ops-dark-500">After-action in 2 min</div>
          </div>
        </div>

        {/* Scenarios - Direct Entry */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-ops-dark-100 mb-4">Training Scenarios</h2>
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-ops-dark-900 border border-ops-dark-800 hover:border-ops-accent-green/50 transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    scenario.severity === 'CRITICAL'
                      ? 'bg-ops-accent-red/20'
                      : 'bg-ops-accent-amber/20'
                  }`}
                >
                  <Shield
                    className={`w-6 h-6 ${
                      scenario.severity === 'CRITICAL'
                        ? 'text-ops-accent-red'
                        : 'text-ops-accent-amber'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-ops-dark-100">{scenario.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        scenario.severity === 'CRITICAL'
                          ? 'bg-ops-accent-red/20 text-ops-accent-red'
                          : 'bg-ops-accent-amber/20 text-ops-accent-amber'
                      }`}
                    >
                      {scenario.severity}
                    </span>
                  </div>
                  <p className="text-sm text-ops-dark-400">{scenario.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-ops-dark-600 group-hover:text-ops-accent-green group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Decision Postures Explainer */}
        <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6 mb-12">
          <h3 className="text-lg font-semibold text-ops-dark-100 mb-4">Decision Postures</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-ops-accent-green/10 border border-ops-accent-green/20">
              <div className="font-semibold text-ops-accent-green mb-1">CONTINUE</div>
              <div className="text-sm text-ops-dark-400">
                Proceed with normal operations. No immediate impact identified.
              </div>
            </div>
            <div className="p-4 rounded-lg bg-ops-accent-amber/10 border border-ops-accent-amber/20">
              <div className="font-semibold text-ops-accent-amber mb-1">DEGRADE</div>
              <div className="text-sm text-ops-dark-400">
                Operate with reduced capability. Compensating controls in place.
              </div>
            </div>
            <div className="p-4 rounded-lg bg-ops-accent-red/10 border border-ops-accent-red/20">
              <div className="font-semibold text-ops-accent-red mb-1">PAUSE</div>
              <div className="text-sm text-ops-dark-400">
                Halt affected operations. Critical impact, unacceptable risk.
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Notice */}
        <div className="text-center text-sm text-ops-dark-500">
          <p className="mb-2">
            <strong className="text-ops-dark-400">Portfolio Demonstration</strong> — All scenarios
            are synthetic. Built to demonstrate structured operational decision-making methodology.
          </p>
          <p>Created by Shannon Brown • GSOC Manager • Harvard ALM/ALB • CompTIA CySA+</p>
        </div>
      </main>
    </div>
  );
}
