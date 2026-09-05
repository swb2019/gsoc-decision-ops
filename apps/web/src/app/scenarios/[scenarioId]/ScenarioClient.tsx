'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { createScenarioById, getAvailableScenarios } from '@gsoc-decision-ops/core';
import type { DecisionLog, ScenarioESRMConfig } from '@gsoc-decision-ops/core';
import Link from 'next/link';
import CommandCenter from '../../../components/CommandCenter';

interface ScenarioClientProps {
  scenarioId: string;
}

export default function ScenarioClient({ scenarioId }: ScenarioClientProps): JSX.Element {
  const [log, setLog] = useState<DecisionLog | null>(null);
  const [esrmConfig, setEsrmConfig] = useState<ScenarioESRMConfig | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const decisionLog = createScenarioById(scenarioId);
      const scenarios = getAvailableScenarios();
      const scenarioInfo = scenarios.find((s) => s.id === scenarioId);

      if (decisionLog) {
        setLog(decisionLog);
        setEsrmConfig(scenarioInfo?.esrmConfig);
      }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [scenarioId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
            <Activity className="absolute inset-0 m-auto w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Initializing Command Center</p>
          <p className="text-gray-600 text-xs mt-2">Loading mission parameters...</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md mx-4 p-8 rounded-2xl bg-[#12121a] border border-gray-800">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Mission Not Found</h2>
          <p className="text-gray-400 mb-6">The requested scenario could not be loaded.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/15 text-emerald-400 font-medium hover:bg-emerald-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            Return to Mission Select
          </Link>
        </div>
      </div>
    );
  }

  return <CommandCenter initialLog={log} esrmConfig={esrmConfig} scenarioId={scenarioId} />;
}
