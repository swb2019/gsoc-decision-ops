/**
 * KRI (Key Risk Indicators) Dashboard
 *
 * Glanceable, traffic-light + trend indicators for ESRM/ops practice.
 * Per Musk 5-step: only metrics that change judgment.
 *
 * KRI Categories:
 * - Leading indicators (predictive)
 * - Lagging indicators (outcomes)
 *
 * Aligned to ESRM/ops practice:
 * - MTTA/MTTR-ish first-hour proxies
 * - Open critical risks above tolerance
 * - Residual risk explicitness rate
 * - Asset-owner briefing rate
 * - Dispatch contention
 * - Escalation level
 * - Channel noise ratio
 * - Treatment mix
 */

import type { DecisionLog, ScenarioInject } from './types.js';

/**
 * Traffic light status for KRI visualization
 */
export type TrafficLightStatus = 'GREEN' | 'AMBER' | 'RED';

/**
 * Trend direction for KRI
 */
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DEGRADING';

/**
 * KRI category classification
 */
export type KRICategory = 'LEADING' | 'LAGGING';

/**
 * Single KRI measurement
 */
export interface KRIMeasurement {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: KRICategory;
  value: number;
  unit: string;
  threshold: {
    green: number;
    amber: number;
    red: number;
    direction: 'LOWER_BETTER' | 'HIGHER_BETTER';
  };
  status: TrafficLightStatus;
  trend: TrendDirection;
  trendValue: number;
  lastUpdated: string;
}

/**
 * Complete KRI dashboard state
 */
export interface KRIDashboard {
  timestamp: string;
  indicators: KRIMeasurement[];
  overallHealth: TrafficLightStatus;
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  compositeScore: number;
}

/**
 * KRI history entry for trend calculation
 */
export interface KRIHistoryEntry {
  timestamp: string;
  value: number;
}

/**
 * Calculate traffic light status from value and thresholds
 */
function calculateStatus(
  value: number,
  threshold: KRIMeasurement['threshold']
): TrafficLightStatus {
  if (threshold.direction === 'LOWER_BETTER') {
    if (value <= threshold.green) return 'GREEN';
    if (value <= threshold.amber) return 'AMBER';
    return 'RED';
  } else {
    if (value >= threshold.green) return 'GREEN';
    if (value >= threshold.amber) return 'AMBER';
    return 'RED';
  }
}

/**
 * Calculate trend from current and previous values
 */
function calculateTrend(
  current: number,
  previous: number,
  direction: 'LOWER_BETTER' | 'HIGHER_BETTER'
): TrendDirection {
  const delta = current - previous;
  const threshold = Math.abs(previous) * 0.1 || 1;

  if (Math.abs(delta) < threshold) return 'STABLE';

  if (direction === 'LOWER_BETTER') {
    return delta < 0 ? 'IMPROVING' : 'DEGRADING';
  } else {
    return delta > 0 ? 'IMPROVING' : 'DEGRADING';
  }
}

/**
 * Mean Time To Acknowledge (first-hour proxy)
 * Measures time from inject reveal to first decision
 */
export function calculateMTTA(
  log: DecisionLog,
  revealedInjects: ScenarioInject[],
  elapsedSeconds: number
): number {
  if (log.decisions.length === 0) return elapsedSeconds;

  const handledInjects = revealedInjects.filter((inject) =>
    log.decisions.some((d) => d.title === inject.title)
  );

  if (handledInjects.length === 0) return elapsedSeconds;

  let totalAcknowledgeTime = 0;
  for (const inject of handledInjects) {
    const decision = log.decisions.find((d) => d.title === inject.title);
    if (decision && inject.revealedAt) {
      const injectTime = new Date(inject.revealedAt).getTime();
      const decisionTime = new Date(decision.timestamp).getTime();
      totalAcknowledgeTime += (decisionTime - injectTime) / 1000;
    }
  }

  return Math.round(totalAcknowledgeTime / handledInjects.length);
}

/**
 * Mean Time To Resolve (first-hour proxy)
 * In simulation: time from first inject to posture stability
 */
export function calculateMTTR(
  log: DecisionLog,
  elapsedSeconds: number
): number {
  if (log.decisions.length < 2) return elapsedSeconds;

  const lastDecision = log.decisions[log.decisions.length - 1];
  const firstDecision = log.decisions[0];
  
  const firstTime = new Date(firstDecision.timestamp).getTime();
  const lastTime = new Date(lastDecision.timestamp).getTime();

  return Math.round((lastTime - firstTime) / 1000);
}

/**
 * Open critical risks above tolerance
 */
export function calculateOpenCriticalRisks(
  revealedInjects: ScenarioInject[],
  log: DecisionLog
): number {
  const unhandledInjects = revealedInjects.filter(
    (inject) => !log.decisions.some((d) => d.title === inject.title)
  );

  const criticalUnhandled = unhandledInjects.filter((inject) => {
    const priority = (inject as unknown as { triagePriority?: string }).triagePriority;
    return priority === 'IMMEDIATE';
  });

  return criticalUnhandled.length;
}

/**
 * Residual risk explicitness rate
 */
export function calculateResidualRiskExplicitnessRate(log: DecisionLog): number {
  if (log.decisions.length === 0) return 0;

  const withExplicitResidual = log.decisions.filter(
    (d) => d.esrmFraming?.residualRisk && d.esrmFraming.residualRisk.length > 10
  ).length;

  return Math.round((withExplicitResidual / log.decisions.length) * 100);
}

/**
 * Asset-owner briefing rate
 */
export function calculateAssetOwnerBriefingRate(
  log: DecisionLog,
  assetOwnersBriefed: number
): number {
  if (log.decisions.length === 0) return 0;
  return Math.round((assetOwnersBriefed / log.decisions.length) * 100);
}

/**
 * Dispatch contention score
 * Higher = more resource strain
 */
export function calculateDispatchContention(
  resources: {
    guards: { available: number; total: number; contentionLevel: string };
    analysts: { available: number; total: number; contentionLevel: string };
    responders: { available: number; total: number; contentionLevel: string };
  }
): number {
  const guardRatio = resources.guards.available / resources.guards.total;
  const analystRatio = resources.analysts.available / resources.analysts.total;
  const responderRatio = resources.responders.available / resources.responders.total;

  const avgAvailability = (guardRatio + analystRatio + responderRatio) / 3;
  return Math.round((1 - avgAvailability) * 100);
}

/**
 * Channel noise ratio
 * Measures signal-to-noise in information flow
 */
export function calculateChannelNoiseRatio(log: DecisionLog): number {
  const facts = log.facts.length;
  const assumptions = log.assumptions.length;
  const unknowns = log.unknowns.length;

  if (facts === 0 && assumptions === 0) return 50;

  const signal = facts * 2 + assumptions;
  const noise = unknowns + assumptions * 0.5;

  const ratio = signal / (signal + noise);
  return Math.round(ratio * 100);
}

/**
 * Treatment mix diversity
 * Measures balanced use of all treatment options
 */
export function calculateTreatmentMix(log: DecisionLog): {
  accept: number;
  mitigate: number;
  transfer: number;
  avoid: number;
  diversityScore: number;
} {
  const total = log.decisions.length;
  if (total === 0) {
    return { accept: 0, mitigate: 0, transfer: 0, avoid: 0, diversityScore: 0 };
  }

  const accept = log.decisions.filter((d) => d.posture === 'CONTINUE').length;
  const mitigate = log.decisions.filter(
    (d) => d.posture === 'DEGRADE' && d.esrmFraming?.treatment !== 'TRANSFER'
  ).length;
  const transfer = log.decisions.filter(
    (d) => d.esrmFraming?.treatment === 'TRANSFER'
  ).length;
  const avoid = log.decisions.filter((d) => d.posture === 'PAUSE').length;

  const treatments = [accept, mitigate, transfer, avoid];
  const nonZeroTreatments = treatments.filter((t) => t > 0).length;
  const diversityScore = Math.round((nonZeroTreatments / 4) * 100);

  return {
    accept: Math.round((accept / total) * 100),
    mitigate: Math.round((mitigate / total) * 100),
    transfer: Math.round((transfer / total) * 100),
    avoid: Math.round((avoid / total) * 100),
    diversityScore,
  };
}

/**
 * Escalation level indicator
 */
export function calculateEscalationIndicator(
  escalationLevel: 'ACTIVITY' | 'INCIDENT' | 'INVESTIGATION'
): { level: number; status: TrafficLightStatus } {
  switch (escalationLevel) {
    case 'ACTIVITY':
      return { level: 1, status: 'GREEN' };
    case 'INCIDENT':
      return { level: 2, status: 'AMBER' };
    case 'INVESTIGATION':
      return { level: 3, status: 'RED' };
  }
}

/**
 * Create full KRI dashboard
 */
export function createKRIDashboard(
  log: DecisionLog,
  revealedInjects: ScenarioInject[],
  elapsedSeconds: number,
  assetOwnersBriefed: number,
  escalationLevel: 'ACTIVITY' | 'INCIDENT' | 'INVESTIGATION',
  resources: {
    guards: { available: number; total: number; contentionLevel: string };
    analysts: { available: number; total: number; contentionLevel: string };
    responders: { available: number; total: number; contentionLevel: string };
  },
  previousDashboard?: KRIDashboard
): KRIDashboard {
  const timestamp = new Date().toISOString();

  const mtta = calculateMTTA(log, revealedInjects, elapsedSeconds);
  const mttr = calculateMTTR(log, elapsedSeconds);
  const openCritical = calculateOpenCriticalRisks(revealedInjects, log);
  const residualRate = calculateResidualRiskExplicitnessRate(log);
  const ownerBriefingRate = calculateAssetOwnerBriefingRate(log, assetOwnersBriefed);
  const dispatchContention = calculateDispatchContention(resources);
  const channelNoise = calculateChannelNoiseRatio(log);
  const treatmentMix = calculateTreatmentMix(log);
  const escalation = calculateEscalationIndicator(escalationLevel);

  const getPreviousValue = (id: string): number => {
    if (!previousDashboard) return 0;
    const prev = previousDashboard.indicators.find((i) => i.id === id);
    return prev?.value ?? 0;
  };

  const indicators: KRIMeasurement[] = [
    {
      id: 'mtta',
      name: 'Mean Time To Acknowledge',
      shortName: 'MTTA',
      description: 'Average seconds from inject reveal to first decision action',
      category: 'LEADING',
      value: mtta,
      unit: 's',
      threshold: { green: 30, amber: 60, red: 120, direction: 'LOWER_BETTER' },
      status: calculateStatus(mtta, { green: 30, amber: 60, red: 120, direction: 'LOWER_BETTER' }),
      trend: calculateTrend(mtta, getPreviousValue('mtta'), 'LOWER_BETTER'),
      trendValue: mtta - getPreviousValue('mtta'),
      lastUpdated: timestamp,
    },
    {
      id: 'mttr',
      name: 'Mean Time To Resolve',
      shortName: 'MTTR',
      description: 'Seconds from first inject to posture stability',
      category: 'LAGGING',
      value: mttr,
      unit: 's',
      threshold: { green: 300, amber: 600, red: 900, direction: 'LOWER_BETTER' },
      status: calculateStatus(mttr, { green: 300, amber: 600, red: 900, direction: 'LOWER_BETTER' }),
      trend: calculateTrend(mttr, getPreviousValue('mttr'), 'LOWER_BETTER'),
      trendValue: mttr - getPreviousValue('mttr'),
      lastUpdated: timestamp,
    },
    {
      id: 'open-critical',
      name: 'Open Critical Risks',
      shortName: 'Critical',
      description: 'Unhandled IMMEDIATE priority injects',
      category: 'LEADING',
      value: openCritical,
      unit: '',
      threshold: { green: 0, amber: 1, red: 3, direction: 'LOWER_BETTER' },
      status: calculateStatus(openCritical, { green: 0, amber: 1, red: 3, direction: 'LOWER_BETTER' }),
      trend: calculateTrend(openCritical, getPreviousValue('open-critical'), 'LOWER_BETTER'),
      trendValue: openCritical - getPreviousValue('open-critical'),
      lastUpdated: timestamp,
    },
    {
      id: 'residual-rate',
      name: 'Residual Risk Explicitness',
      shortName: 'Residual',
      description: 'Percentage of decisions with explicit residual risk documentation',
      category: 'LAGGING',
      value: residualRate,
      unit: '%',
      threshold: { green: 80, amber: 50, red: 30, direction: 'HIGHER_BETTER' },
      status: calculateStatus(residualRate, { green: 80, amber: 50, red: 30, direction: 'HIGHER_BETTER' }),
      trend: calculateTrend(residualRate, getPreviousValue('residual-rate'), 'HIGHER_BETTER'),
      trendValue: residualRate - getPreviousValue('residual-rate'),
      lastUpdated: timestamp,
    },
    {
      id: 'owner-briefing',
      name: 'Asset Owner Briefing Rate',
      shortName: 'Briefing',
      description: 'Percentage of decisions with asset owner briefing',
      category: 'LAGGING',
      value: ownerBriefingRate,
      unit: '%',
      threshold: { green: 80, amber: 50, red: 30, direction: 'HIGHER_BETTER' },
      status: calculateStatus(ownerBriefingRate, { green: 80, amber: 50, red: 30, direction: 'HIGHER_BETTER' }),
      trend: calculateTrend(ownerBriefingRate, getPreviousValue('owner-briefing'), 'HIGHER_BETTER'),
      trendValue: ownerBriefingRate - getPreviousValue('owner-briefing'),
      lastUpdated: timestamp,
    },
    {
      id: 'dispatch-contention',
      name: 'Dispatch Contention',
      shortName: 'Dispatch',
      description: 'Resource strain level across guards, analysts, responders',
      category: 'LEADING',
      value: dispatchContention,
      unit: '%',
      threshold: { green: 25, amber: 50, red: 75, direction: 'LOWER_BETTER' },
      status: calculateStatus(dispatchContention, { green: 25, amber: 50, red: 75, direction: 'LOWER_BETTER' }),
      trend: calculateTrend(dispatchContention, getPreviousValue('dispatch-contention'), 'LOWER_BETTER'),
      trendValue: dispatchContention - getPreviousValue('dispatch-contention'),
      lastUpdated: timestamp,
    },
    {
      id: 'escalation-level',
      name: 'Escalation Level',
      shortName: 'Escalation',
      description: 'Current incident severity: Activity (1) → Incident (2) → Investigation (3)',
      category: 'LEADING',
      value: escalation.level,
      unit: '',
      threshold: { green: 1, amber: 2, red: 3, direction: 'LOWER_BETTER' },
      status: escalation.status,
      trend: calculateTrend(escalation.level, getPreviousValue('escalation-level'), 'LOWER_BETTER'),
      trendValue: escalation.level - getPreviousValue('escalation-level'),
      lastUpdated: timestamp,
    },
    {
      id: 'channel-noise',
      name: 'Channel Signal Quality',
      shortName: 'Signal',
      description: 'Ratio of verified facts to assumptions/unknowns',
      category: 'LEADING',
      value: channelNoise,
      unit: '%',
      threshold: { green: 70, amber: 50, red: 30, direction: 'HIGHER_BETTER' },
      status: calculateStatus(channelNoise, { green: 70, amber: 50, red: 30, direction: 'HIGHER_BETTER' }),
      trend: calculateTrend(channelNoise, getPreviousValue('channel-noise'), 'HIGHER_BETTER'),
      trendValue: channelNoise - getPreviousValue('channel-noise'),
      lastUpdated: timestamp,
    },
    {
      id: 'treatment-diversity',
      name: 'Treatment Mix Diversity',
      shortName: 'Treatment',
      description: 'Use of multiple risk treatment options (accept/mitigate/transfer/avoid)',
      category: 'LAGGING',
      value: treatmentMix.diversityScore,
      unit: '%',
      threshold: { green: 50, amber: 25, red: 0, direction: 'HIGHER_BETTER' },
      status: calculateStatus(treatmentMix.diversityScore, { green: 50, amber: 25, red: 0, direction: 'HIGHER_BETTER' }),
      trend: calculateTrend(treatmentMix.diversityScore, getPreviousValue('treatment-diversity'), 'HIGHER_BETTER'),
      trendValue: treatmentMix.diversityScore - getPreviousValue('treatment-diversity'),
      lastUpdated: timestamp,
    },
  ];

  const criticalCount = indicators.filter((i) => i.status === 'RED').length;
  const warningCount = indicators.filter((i) => i.status === 'AMBER').length;
  const healthyCount = indicators.filter((i) => i.status === 'GREEN').length;

  const overallHealth: TrafficLightStatus =
    criticalCount >= 3 ? 'RED' : criticalCount >= 1 || warningCount >= 4 ? 'AMBER' : 'GREEN';

  const compositeScore = Math.round(
    (healthyCount * 100 + warningCount * 50 + criticalCount * 0) / indicators.length
  );

  return {
    timestamp,
    indicators,
    overallHealth,
    criticalCount,
    warningCount,
    healthyCount,
    compositeScore,
  };
}

/**
 * KRI Field Guide definitions for glossary
 */
export const KRI_DEFINITIONS: Record<string, { name: string; definition: string; formula: string; bestPractice: string }> = {
  mtta: {
    name: 'Mean Time To Acknowledge (MTTA)',
    definition: 'The average time from when an inject is revealed to when the first decision action is taken. A leading indicator of response readiness.',
    formula: 'Sum of (decision timestamp - inject reveal timestamp) / number of handled injects',
    bestPractice: 'Target under 30 seconds. High MTTA indicates decision paralysis or information overload.',
  },
  mttr: {
    name: 'Mean Time To Resolve (MTTR)',
    definition: 'The time from first inject to achieving posture stability. A lagging indicator of incident resolution efficiency.',
    formula: 'Last decision timestamp - first decision timestamp',
    bestPractice: 'Target under 5 minutes for first-hour scenarios. Monitor for decision clustering.',
  },
  'open-critical': {
    name: 'Open Critical Risks',
    definition: 'Count of IMMEDIATE priority injects that have not yet received a posture decision. A leading indicator of unaddressed high-severity threats.',
    formula: 'Count of revealed injects with triagePriority=IMMEDIATE that have no matching decision',
    bestPractice: 'Target zero. Any open critical risk should trigger immediate attention.',
  },
  'residual-rate': {
    name: 'Residual Risk Explicitness Rate',
    definition: 'Percentage of decisions that include explicit residual risk documentation per ESRM discipline.',
    formula: '(Decisions with residualRisk > 10 chars / total decisions) × 100',
    bestPractice: 'Target above 80%. Implicit residual risk is an audit and governance gap.',
  },
  'owner-briefing': {
    name: 'Asset Owner Briefing Rate',
    definition: 'Percentage of decisions where the asset owner was briefed before or during the decision. Core ESRM governance metric.',
    formula: '(Decisions with assetOwner briefing / total decisions) × 100',
    bestPractice: 'Target above 80%. ESRM requires owner engagement for accountability.',
  },
  'dispatch-contention': {
    name: 'Dispatch Contention',
    definition: 'Measures resource strain across guards, analysts, and responders. Higher values indicate resource shortage risk.',
    formula: '(1 - average(available/total for each resource type)) × 100',
    bestPractice: 'Target under 25%. Contention above 50% degrades response capability.',
  },
  'escalation-level': {
    name: 'Escalation Level',
    definition: 'Current incident severity classification: Activity (1), Incident (2), or Investigation (3). Affects cascade multipliers.',
    formula: 'Based on urgent inject count and decision count thresholds',
    bestPractice: 'Match escalation to threat severity. Premature escalation wastes resources; delayed escalation increases risk.',
  },
  'channel-noise': {
    name: 'Channel Signal Quality',
    definition: 'Ratio of verified facts to assumptions and unknowns. Indicates information quality for decision-making.',
    formula: '(facts × 2 + assumptions) / (facts × 2 + assumptions + unknowns + assumptions × 0.5) × 100',
    bestPractice: 'Target above 70%. Low signal quality requires more assumptions and increases decision risk.',
  },
  'treatment-diversity': {
    name: 'Treatment Mix Diversity',
    definition: 'Measures use of multiple ESRM risk treatment options. Single-treatment responses may indicate assessment gaps.',
    formula: '(Count of treatment types used / 4) × 100',
    bestPractice: 'Target above 50%. Real incidents typically require multiple treatment types.',
  },
};
