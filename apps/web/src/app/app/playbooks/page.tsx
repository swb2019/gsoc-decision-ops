'use client';

import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, ArrowRight, Plus, Lock } from 'lucide-react';
import { getVendorCompromisePlaybook } from '@gsoc-decision-ops/core';

export default function PlaybooksPage(): JSX.Element {
  const playbook = getVendorCompromisePlaybook();

  const playbooks = [
    {
      id: playbook.id,
      name: playbook.name,
      description: playbook.description,
      phases: playbook.phases.length,
      duration: playbook.totalDurationMinutes,
      status: 'available' as const,
    },
    {
      id: 'pb_data_breach',
      name: 'Data Breach Response',
      description:
        'Structured response for potential data exposure incidents affecting physical security data.',
      phases: 6,
      duration: 90,
      status: 'coming_soon' as const,
    },
    {
      id: 'pb_insider_threat',
      name: 'Insider Threat Response',
      description:
        'First-hour protocol for suspected insider threat involving physical security systems.',
      phases: 5,
      duration: 60,
      status: 'coming_soon' as const,
    },
    {
      id: 'pb_natural_disaster',
      name: 'Natural Disaster Impact',
      description:
        'Rapid assessment playbook for vendor service disruption due to natural disasters.',
      phases: 4,
      duration: 45,
      status: 'coming_soon' as const,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ops-dark-50 mb-1">Playbooks</h1>
          <p className="text-ops-dark-400">
            Structured response frameworks for security operations scenarios.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ops-dark-800 text-ops-dark-500 font-medium cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Create Custom
        </button>
      </div>

      {/* Playbook Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {playbooks.map((pb) => (
          <div
            key={pb.id}
            className={`rounded-xl border ${
              pb.status === 'available'
                ? 'bg-ops-dark-900 border-ops-dark-800 hover:border-ops-dark-700'
                : 'bg-ops-dark-900/50 border-ops-dark-800/50'
            } transition-colors overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    pb.status === 'available' ? 'bg-ops-accent-green/10' : 'bg-ops-dark-800'
                  }`}
                >
                  <BookOpen
                    className={`w-6 h-6 ${
                      pb.status === 'available' ? 'text-ops-accent-green' : 'text-ops-dark-500'
                    }`}
                  />
                </div>
                {pb.status === 'coming_soon' && (
                  <span className="text-xs px-2 py-1 rounded bg-ops-dark-700 text-ops-dark-400">
                    Coming Soon
                  </span>
                )}
              </div>

              <h3
                className={`text-lg font-semibold mb-2 ${
                  pb.status === 'available' ? 'text-ops-dark-100' : 'text-ops-dark-400'
                }`}
              >
                {pb.name}
              </h3>
              <p
                className={`text-sm mb-4 ${
                  pb.status === 'available' ? 'text-ops-dark-400' : 'text-ops-dark-500'
                }`}
              >
                {pb.description}
              </p>

              <div className="flex items-center gap-4 text-sm">
                <span
                  className={`flex items-center gap-1.5 ${
                    pb.status === 'available' ? 'text-ops-dark-300' : 'text-ops-dark-500'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {pb.phases} phases
                </span>
                <span
                  className={`flex items-center gap-1.5 ${
                    pb.status === 'available' ? 'text-ops-dark-300' : 'text-ops-dark-500'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {pb.duration} min
                </span>
              </div>
            </div>

            {pb.status === 'available' ? (
              <Link
                href="/playbook"
                className="flex items-center justify-between px-6 py-3 bg-ops-dark-800/50 border-t border-ops-dark-800 hover:bg-ops-dark-800 transition-colors group"
              >
                <span className="text-sm font-medium text-ops-dark-200 group-hover:text-ops-accent-green transition-colors">
                  View Playbook
                </span>
                <ArrowRight className="w-4 h-4 text-ops-dark-500 group-hover:text-ops-accent-green group-hover:translate-x-1 transition-all" />
              </Link>
            ) : (
              <div className="flex items-center justify-between px-6 py-3 bg-ops-dark-800/30 border-t border-ops-dark-800/50">
                <span className="text-sm text-ops-dark-500 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Enterprise Plan
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Playbook Info */}
      <div className="mt-8 p-6 rounded-xl bg-ops-dark-900/50 border border-dashed border-ops-dark-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-ops-dark-200 mb-1">Custom Playbook Builder</h3>
            <p className="text-sm text-ops-dark-500 mb-3">
              Create organization-specific playbooks tailored to your vendor relationships and
              operational requirements. Available on Enterprise plans.
            </p>
            <span className="text-xs text-ops-dark-600">Contact sales for Enterprise features</span>
          </div>
        </div>
      </div>
    </div>
  );
}
