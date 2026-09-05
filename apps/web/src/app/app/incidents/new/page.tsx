'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Shield, Video, Bell } from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';

export default function NewIncidentPage(): JSX.Element {
  const scenarios = getAvailableScenarios();

  const scenarioIcons: Record<string, typeof AlertTriangle> = {
    'access-control-ransomware': Shield,
    'video-system-compromise': Video,
    'alarm-monitoring-outage': Bell,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ops-dark-50 mb-1">Start Training Scenario</h1>
        <p className="text-ops-dark-400">
          Select a synthetic scenario to practice structured decision-making.
        </p>
      </div>

      {/* Training Notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-ops-accent-blue/10 border border-ops-accent-blue/20 mb-8 max-w-2xl">
        <AlertTriangle className="w-5 h-5 text-ops-accent-blue flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-medium text-ops-accent-blue">Training Scenarios Only</span>
          <p className="text-xs text-ops-dark-400 mt-0.5">
            All scenarios are synthetic and designed for educational purposes. Vendor names are
            fictional. Do not use for actual incident documentation.
          </p>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {scenarios.map((scenario) => {
          const Icon = scenarioIcons[scenario.id] || AlertTriangle;
          return (
            <Link
              key={scenario.id}
              href={`/scenarios/${scenario.id}`}
              className="group p-6 rounded-xl bg-ops-dark-900 border border-ops-dark-800 hover:border-ops-dark-700 transition-all"
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  scenario.severity === 'CRITICAL'
                    ? 'bg-ops-accent-red/20'
                    : 'bg-ops-accent-amber/20'
                }`}
              >
                <Icon
                  className={`w-7 h-7 ${
                    scenario.severity === 'CRITICAL'
                      ? 'text-ops-accent-red'
                      : 'text-ops-accent-amber'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-ops-dark-100 group-hover:text-ops-accent-green transition-colors">
                  {scenario.name}
                </h3>
              </div>
              <p className="text-sm text-ops-dark-400 mb-4 line-clamp-2">{scenario.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      scenario.severity === 'CRITICAL'
                        ? 'bg-ops-accent-red/20 text-ops-accent-red'
                        : 'bg-ops-accent-amber/20 text-ops-accent-amber'
                    }`}
                  >
                    {scenario.severity}
                  </span>
                  <span className="text-xs text-ops-dark-500">{scenario.vendorType}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-ops-dark-500 group-hover:text-ops-accent-green group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Custom Scenario (Coming Soon) */}
      <div className="mt-8 max-w-5xl">
        <div className="p-6 rounded-xl bg-ops-dark-900/50 border border-dashed border-ops-dark-700">
          <div className="text-center">
            <h3 className="font-semibold text-ops-dark-300 mb-1">Custom Scenario</h3>
            <p className="text-sm text-ops-dark-500">
              Create your own training scenario with custom parameters. Coming soon in a future
              release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
