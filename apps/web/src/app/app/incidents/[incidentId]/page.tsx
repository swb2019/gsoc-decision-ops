import { DEMO_INCIDENTS } from '@/lib/demo-data';
import IncidentDetailClient from './IncidentDetailClient';

export function generateStaticParams(): { incidentId: string }[] {
  return DEMO_INCIDENTS.map((incident) => ({
    incidentId: incident.id,
  }));
}

interface IncidentDetailPageProps {
  params: { incidentId: string };
}

export default function IncidentDetailPage({ params }: IncidentDetailPageProps): JSX.Element {
  return <IncidentDetailClient incidentId={params.incidentId} />;
}
