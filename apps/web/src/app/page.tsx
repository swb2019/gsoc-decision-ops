'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Clock, FileText, ChevronRight, Radio, Lock } from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';
import Link from 'next/link';

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-ops-dark-950">
      {/* Header */}
      <header className="border-b border-ops-dark-800 bg-ops-dark-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ops-accent-green/20 flex items-center justify-center glow-green">
              <Shield className="w-5 h-5 text-ops-accent-green" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ops-dark-50">GSOC Decision Ops</h1>
              <p className="text-xs text-ops-dark-400 font-mono">v1.0.0 | Training Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="status-badge status-active">
              <span className="w-1.5 h-1.5 rounded-full bg-ops-accent-green animate-pulse" />
              System Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ops-dark-800 text-ops-dark-300 text-sm mb-6">
            <Radio className="w-4 h-4 text-ops-accent-green" />
            Training & Exercise Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-ops-dark-50 mb-4">
            First-Hour Decision Quality
          </h2>
          <p className="text-xl text-ops-dark-400 max-w-2xl mx-auto mb-8">
            When a critical vendor or cyber-adjacent disruption hits your GSOC, structured
            decision-making separates managed response from chaos.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/scenarios" className="btn btn-primary">
              <Clock className="w-4 h-4" />
              Start Training Scenario
            </Link>
            <Link href="/playbook" className="btn btn-secondary">
              <FileText className="w-4 h-4" />
              View Playbook
            </Link>
          </div>
        </section>

        {/* Governance Banner */}
        <section className="governance-banner mb-12 flex items-start gap-4">
          <Lock className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Human-in-the-Loop Governance</h3>
            <p className="text-sm opacity-80">
              This toolkit supports structured decision-making but does not replace human judgment.
              All scenarios are synthetic training exercises. Actual incident response must follow
              your organization&apos;s established procedures, authority levels, and policies.
            </p>
          </div>
        </section>

        {/* Scenario Cards */}
        <section className="mb-16">
          <h3 className="text-2xl font-semibold text-ops-dark-50 mb-6">Training Scenarios</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="card group cursor-pointer transition-all duration-300 hover:border-ops-accent-green/50 hover:glow-green"
                onMouseEnter={() => setHoveredScenario(scenario.id)}
                onMouseLeave={() => setHoveredScenario(null)}
              >
                <div className="card-header">
                  <span
                    className={`status-badge ${
                      scenario.severity === 'CRITICAL' ? 'severity-critical' : 'severity-high'
                    }`}
                  >
                    {scenario.severity}
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 text-ops-dark-500 transition-transform duration-300 ${
                      hoveredScenario === scenario.id ? 'translate-x-1 text-ops-accent-green' : ''
                    }`}
                  />
                </div>
                <div className="card-body">
                  <h4 className="text-lg font-semibold text-ops-dark-100 mb-2">{scenario.name}</h4>
                  <p className="text-sm text-ops-dark-400 mb-4">{scenario.description}</p>
                  <div className="flex items-center gap-2 text-xs text-ops-dark-500">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {scenario.vendorType}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Key Concepts */}
        <section className="mb-16">
          <h3 className="text-2xl font-semibold text-ops-dark-50 mb-6">Decision Framework</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-ops-accent-green/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-ops-accent-green">C</span>
                </div>
                <h4 className="text-lg font-semibold text-ops-dark-100 mb-2">CONTINUE</h4>
                <p className="text-sm text-ops-dark-400">
                  Proceed with normal operations. Risk is understood and acceptable. Enhanced
                  monitoring may be warranted.
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-ops-accent-amber/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-ops-accent-amber">D</span>
                </div>
                <h4 className="text-lg font-semibold text-ops-dark-100 mb-2">DEGRADE</h4>
                <p className="text-sm text-ops-dark-400">
                  Operate with reduced capability or increased controls. Accept temporary
                  limitations to manage risk.
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-ops-accent-red/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-ops-accent-red">P</span>
                </div>
                <h4 className="text-lg font-semibold text-ops-dark-100 mb-2">PAUSE</h4>
                <p className="text-sm text-ops-dark-400">
                  Halt affected operations until further notice. Risk is unacceptable or unknown is
                  too critical.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Information Quality */}
        <section>
          <h3 className="text-2xl font-semibold text-ops-dark-50 mb-6">
            Information Quality Under Pressure
          </h3>
          <div className="card">
            <div className="card-body">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-ops-accent-green mb-3">FACTS</h4>
                  <p className="text-sm text-ops-dark-400 mb-3">
                    What we know with confidence. Verified information from trusted sources.
                  </p>
                  <ul className="text-sm text-ops-dark-500 space-y-1.5 font-mono">
                    <li>• Source-attributed</li>
                    <li>• Verification tracked</li>
                    <li>• Confidence level noted</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-ops-accent-amber mb-3">ASSUMPTIONS</h4>
                  <p className="text-sm text-ops-dark-400 mb-3">
                    Working hypotheses we&apos;re operating on. Must be validated.
                  </p>
                  <ul className="text-sm text-ops-dark-500 space-y-1.5 font-mono">
                    <li>• Basis documented</li>
                    <li>• Risk if wrong stated</li>
                    <li>• Validation plan set</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-ops-accent-red mb-3">UNKNOWNS</h4>
                  <p className="text-sm text-ops-dark-400 mb-3">
                    Critical gaps in our knowledge. Prioritized for resolution.
                  </p>
                  <ul className="text-sm text-ops-dark-500 space-y-1.5 font-mono">
                    <li>• Priority assigned</li>
                    <li>• Owner designated</li>
                    <li>• Target time set</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ops-dark-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-ops-dark-500">
              GSOC Decision Ops Toolkit | Training & Exercise Platform
            </div>
            <div className="text-sm text-ops-dark-600 font-mono">
              Synthetic scenarios only. Not for production incident response.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
