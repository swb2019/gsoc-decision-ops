'use client';

import Link from 'next/link';
import { Shield, ArrowRight, Play, CheckCircle } from 'lucide-react';

export function Hero(): JSX.Element {
  return (
    <div className="relative overflow-hidden bg-ops-dark-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-ops-accent-green/5 via-transparent to-ops-accent-blue/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-ops-accent-green/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ops-accent-blue/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ops-dark-800/50 border border-ops-dark-700 mb-8">
            <span className="w-2 h-2 rounded-full bg-ops-accent-green animate-pulse" />
            <span className="text-sm text-ops-dark-300">Portfolio Demo — Training Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ops-dark-50 tracking-tight mb-6">
            First-Hour Decision Quality
            <br />
            <span className="bg-gradient-to-r from-ops-accent-green to-emerald-400 bg-clip-text text-transparent">
              for Security Operations
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-ops-dark-300 mb-8">
            Structured decision-making toolkit for corporate GSOC leaders facing vendor compromises
            and cyber-adjacent disruptions. Train your team with synthetic scenarios.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-ops-accent-green text-ops-dark-950 font-semibold hover:bg-ops-accent-green/90 transition-colors"
            >
              Try Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-ops-dark-700 text-ops-dark-100 font-semibold hover:bg-ops-dark-800 transition-colors"
            >
              <Play className="w-5 h-5" />
              View Pricing
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-ops-dark-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-ops-accent-green" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-ops-accent-green" />
              Synthetic training data
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-ops-accent-green" />
              ESRM methodology
            </div>
          </div>
        </div>

        {/* Hero Image/Screenshot */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-ops-dark-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-xl border border-ops-dark-800 bg-ops-dark-900/50 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-ops-dark-800 bg-ops-dark-900">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-ops-dark-500 font-mono">
                  app.gsoc-decision-ops.cloud
                </span>
              </div>
            </div>
            <div className="aspect-[16/9] bg-ops-dark-900 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-ops-accent-green to-emerald-600 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-ops-dark-100 mb-2">Decision Ops Cloud</h3>
                <p className="text-ops-dark-400 text-sm max-w-md">
                  Interactive demo showcasing incident decision logging, playbook execution, and
                  after-action report generation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
