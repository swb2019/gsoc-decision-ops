import { getAvailableScenarios } from '@gsoc-decision-ops/core';
import ScenarioClient from './ScenarioClient';

export function generateStaticParams(): { scenarioId: string }[] {
  const scenarios = getAvailableScenarios();
  return scenarios.map((scenario) => ({
    scenarioId: scenario.id,
  }));
}

interface ScenarioPageProps {
  params: Promise<{ scenarioId: string }>;
}

export default async function ScenarioPage({ params }: ScenarioPageProps): Promise<JSX.Element> {
  const { scenarioId } = await params;
  return <ScenarioClient scenarioId={scenarioId} />;
}
