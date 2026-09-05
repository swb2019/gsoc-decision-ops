import { getAvailableScenarios } from '@gsoc-decision-ops/core';
import ScenarioClient from './ScenarioClient';

export function generateStaticParams(): { scenarioId: string }[] {
  const scenarios = getAvailableScenarios();
  return scenarios.map((scenario) => ({
    scenarioId: scenario.id,
  }));
}

interface ScenarioPageProps {
  params: { scenarioId: string };
}

export default function ScenarioPage({ params }: ScenarioPageProps): JSX.Element {
  return <ScenarioClient scenarioId={params.scenarioId} />;
}
