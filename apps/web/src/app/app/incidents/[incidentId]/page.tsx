'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_INCIDENTS } from '@/lib/demo-data';

interface IncidentDetailPageProps {
  params: { incidentId: string };
}

export default function IncidentDetailPage({
  params,
}: IncidentDetailPageProps): JSX.Element {
  const router = useRouter();
  const incident = DEMO_INCIDENTS.find((i) => i.id === params.incidentId);

  useEffect(() => {
    if (incident?.isTrainingScenario) {
      const scenarioMapping: Record<string, string> = {
        inc_training_1: 'access-control-ransomware',
        inc_training_2: 'video-system-compromise',
        inc_training_3: 'alarm-monitoring-outage',
        inc_training_4: 'access-control-ransomware',
      };

      const scenarioId = scenarioMapping[incident.id];
      if (scenarioId) {
        router.push(`/scenarios/${scenarioId}`);
      }
    }
  }, [incident, router]);

  if (!incident) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-ops-dark-100 mb-2">
            Incident Not Found
          </h1>
          <p className="text-ops-dark-400">
            The requested incident could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center py-12">
        <div className="w-12 h-12 border-2 border-ops-accent-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ops-dark-400">Loading training scenario...</p>
      </div>
    </div>
  );
}
