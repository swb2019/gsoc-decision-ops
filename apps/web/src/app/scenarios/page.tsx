'use client';

import { Shield, AlertTriangle, ArrowLeft, ChevronRight } from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';
import Link from 'next/link';

export default function ScenariosPage(): JSX.Element {
  const scenarios = getAvailableScenarios();

  return (
    <div className="min-h-screen bg-ops-dark-950">
      {/* Header */}
      <header className="border-b border-ops-dark-800 bg-ops-dark-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-ops-dark-800 transition-colors">
              <ArrowLeft className="w-5 h-5 text-ops-dark-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ops-accent-green/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-ops-accent-green" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-ops-dark-50">Training Scenarios</h1>
                <p className="text-xs text-ops-dark-400 font-mono">Select a scenario to begin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-ops-dark-50 mb-2">Available Scenarios</h2>
          <p className="text-ops-dark-400">
            These synthetic scenarios simulate first-hour vendor disruptions. Each scenario provides
            a realistic context for practicing structured decision-making.
          </p>
        </div>

        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/scenarios/${scenario.id}`}
              className="card block group hover:border-ops-accent-green/50 transition-all duration-300"
            >
              <div className="p-6 flex items-center gap-6">
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    scenario.severity === 'CRITICAL'
                      ? 'bg-ops-accent-red/20'
                      : 'bg-ops-accent-amber/20'
                  }`}
                >
                  <AlertTriangle
                    className={`w-8 h-8 ${
                      scenario.severity === 'CRITICAL'
                        ? 'text-ops-accent-red'
                        : 'text-ops-accent-amber'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-ops-dark-100">{scenario.name}</h3>
                    <span
                      className={`status-badge ${
                        scenario.severity === 'CRITICAL' ? 'severity-critical' : 'severity-high'
                      }`}
                    >
                      {scenario.severity}
                    </span>
                  </div>
                  <p className="text-sm text-ops-dark-400 mb-2">{scenario.description}</p>
                  <div className="text-xs text-ops-dark-500 font-mono">
                    Vendor Type: {scenario.vendorType}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-ops-dark-600 group-hover:text-ops-accent-green group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 governance-banner">
          <p className="text-sm">
            <strong>Training Notice:</strong> All scenarios are synthetic and designed for
            educational purposes. Vendor names are fictional. Practice structured decision-making
            without real-world consequences.
          </p>
        </div>
      </main>
    </div>
  );
}
