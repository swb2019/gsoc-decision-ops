/**
 * ESRM Value Metrics - Business Value Visibility
 *
 * Tracks security's underlying business value created during incidents.
 * Per Musk 5-step: only metrics that change judgment.
 *
 * Value categories:
 * - Protected mission continuity
 * - Residual risk reduced vs accepted
 * - Owner-affirmed decisions
 * - Avoided loss proxies
 * - Advisor effectiveness
 */

import type { DecisionLog } from './types.js';
import type { RiskLevel, ProtectedAsset } from './esrm.js';

/**
 * Mission continuity state
 */
export type MissionContinuityState = 'OPERATIONAL' | 'DEGRADED' | 'DISRUPTED' | 'HALTED';

/**
 * Value created through protected mission continuity
 */
export interface MissionContinuityValue {
  state: MissionContinuityState;
  assetsProtected: number;
  assetsCriticalProtected: number;
  continuityScore: number;
  degradationMinutes: number;
  avoidedDowntimeMinutes: number;
  businessProcessesActive: number;
}

/**
 * Value from explicit residual risk handling
 */
export interface ResidualRiskValue {
  risksIdentified: number;
  risksWithExplicitResidual: number;
  residualRiskExplicitnessRate: number;
  risksAccepted: number;
  risksMitigated: number;
  risksTransferred: number;
  risksAvoided: number;
  totalRiskReduction: number;
  averageResidualLevel: RiskLevel | null;
}

/**
 * Value from owner-affirmed decisions (ESRM governance)
 */
export interface OwnerAffirmationValue {
  decisionsTotal: number;
  decisionsWithOwnerBriefing: number;
  ownerBriefingRate: number;
  affirmationsReceived: number;
  affirmationRate: number;
  escalationsRequired: number;
  escalationsCompleted: number;
  governanceComplianceScore: number;
}

/**
 * Avoided loss proxy calculations
 */
export interface AvoidedLossProxy {
  category: string;
  description: string;
  estimatedAvoidance: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceLevel: 'CONFIRMED' | 'ESTIMATED' | 'SPECULATIVE';
  contributingDecisions: string[];
}

/**
 * Avoided loss value aggregation
 */
export interface AvoidedLossValue {
  proxies: AvoidedLossProxy[];
  totalHighAvoidance: number;
  totalMediumAvoidance: number;
  totalLowAvoidance: number;
  safetyIncidentsAvoided: number;
  dataBreachesAvoided: number;
  operationalDisruptionsAvoided: number;
}

/**
 * Advisor effectiveness metrics
 */
export interface AdvisorEffectivenessValue {
  recommendationsProvided: number;
  recommendationsAccepted: number;
  acceptanceRate: number;
  timeToFirstRecommendation: number;
  averageDecisionTime: number;
  crossDomainCorrelations: number;
  stakeholderBriefings: number;
  informationQualityScore: number;
}

/**
 * Complete ESRM value created snapshot
 */
export interface ESRMValueCreated {
  timestamp: string;
  elapsedMinutes: number;
  missionContinuity: MissionContinuityValue;
  residualRisk: ResidualRiskValue;
  ownerAffirmation: OwnerAffirmationValue;
  avoidedLoss: AvoidedLossValue;
  advisorEffectiveness: AdvisorEffectivenessValue;
  compositeValueScore: number;
  valueNarrative: string;
}

/**
 * Calculate mission continuity value from log state
 */
export function calculateMissionContinuityValue(
  log: DecisionLog,
  assets: ProtectedAsset[],
  elapsedMinutes: number
): MissionContinuityValue {
  const pauseDecisions = log.decisions.filter((d) => d.posture === 'PAUSE');
  const degradeDecisions = log.decisions.filter((d) => d.posture === 'DEGRADE');
  const continueDecisions = log.decisions.filter((d) => d.posture === 'CONTINUE');

  const state: MissionContinuityState =
    pauseDecisions.length > 2
      ? 'HALTED'
      : pauseDecisions.length > 0
        ? 'DISRUPTED'
        : degradeDecisions.length > 0
          ? 'DEGRADED'
          : 'OPERATIONAL';

  const assetsProtected = assets.length;
  const assetsCriticalProtected = assets.filter((a) => a.criticality === 'CRITICAL').length;

  const degradationMinutes = degradeDecisions.length * 5 + pauseDecisions.length * 15;
  const avoidedDowntimeMinutes = Math.max(0, elapsedMinutes - degradationMinutes);

  const continuityScore = Math.round(
    ((continueDecisions.length * 3 + degradeDecisions.length * 1) /
      Math.max(1, log.decisions.length)) *
      100
  );

  return {
    state,
    assetsProtected,
    assetsCriticalProtected,
    continuityScore,
    degradationMinutes,
    avoidedDowntimeMinutes,
    businessProcessesActive: state === 'OPERATIONAL' ? 5 : state === 'DEGRADED' ? 3 : 1,
  };
}

/**
 * Calculate residual risk value from decisions
 */
export function calculateResidualRiskValue(log: DecisionLog): ResidualRiskValue {
  const decisions = log.decisions;
  const risksIdentified = decisions.length;

  const risksWithExplicitResidual = decisions.filter(
    (d) => d.esrmFraming?.residualRisk && d.esrmFraming.residualRisk.length > 10
  ).length;

  const residualRiskExplicitnessRate =
    risksIdentified > 0 ? Math.round((risksWithExplicitResidual / risksIdentified) * 100) : 0;

  const risksAccepted = decisions.filter((d) => d.posture === 'CONTINUE').length;
  const risksMitigated = decisions.filter(
    (d) => d.posture === 'DEGRADE' && d.esrmFraming?.treatment === 'MITIGATE'
  ).length;
  const risksTransferred = decisions.filter((d) => d.esrmFraming?.treatment === 'TRANSFER').length;
  const risksAvoided = decisions.filter((d) => d.posture === 'PAUSE').length;

  const totalRiskReduction =
    risksAvoided * 4 + risksMitigated * 2 + risksTransferred * 2 + risksAccepted * 0;

  return {
    risksIdentified,
    risksWithExplicitResidual,
    residualRiskExplicitnessRate,
    risksAccepted,
    risksMitigated,
    risksTransferred,
    risksAvoided,
    totalRiskReduction,
    averageResidualLevel: risksIdentified > 0 ? 'MEDIUM' : null,
  };
}

/**
 * Calculate owner affirmation value
 */
export function calculateOwnerAffirmationValue(
  log: DecisionLog,
  assetOwnersBriefed: number
): OwnerAffirmationValue {
  const decisionsTotal = log.decisions.length;
  const decisionsWithOwnerBriefing = log.decisions.filter(
    (d) => d.esrmFraming?.assetOwner && d.esrmFraming.assetOwnerRole
  ).length;

  const ownerBriefingRate =
    decisionsTotal > 0 ? Math.round((assetOwnersBriefed / decisionsTotal) * 100) : 0;

  const affirmationsReceived = Math.floor(assetOwnersBriefed * 0.8);
  const affirmationRate = assetOwnersBriefed > 0 
    ? Math.round((affirmationsReceived / assetOwnersBriefed) * 100) 
    : 0;

  const escalationsRequired = log.decisions.filter((d) => d.posture === 'PAUSE').length;
  const escalationsCompleted = Math.floor(escalationsRequired * 0.9);

  const governanceComplianceScore = Math.round(
    (ownerBriefingRate * 0.4 + affirmationRate * 0.3 + (escalationsCompleted / Math.max(1, escalationsRequired)) * 100 * 0.3)
  );

  return {
    decisionsTotal,
    decisionsWithOwnerBriefing,
    ownerBriefingRate,
    affirmationsReceived,
    affirmationRate,
    escalationsRequired,
    escalationsCompleted,
    governanceComplianceScore,
  };
}

/**
 * Calculate avoided loss proxies
 */
export function calculateAvoidedLossValue(
  log: DecisionLog,
  assets: ProtectedAsset[]
): AvoidedLossValue {
  const proxies: AvoidedLossProxy[] = [];

  const pauseDecisions = log.decisions.filter((d) => d.posture === 'PAUSE');
  const degradeDecisions = log.decisions.filter((d) => d.posture === 'DEGRADE');

  if (pauseDecisions.length > 0) {
    proxies.push({
      category: 'Operations',
      description: 'Halted operations before potential compromise spread',
      estimatedAvoidance: 'HIGH',
      confidenceLevel: 'ESTIMATED',
      contributingDecisions: pauseDecisions.map((d) => d.id),
    });
  }

  if (degradeDecisions.length > 0) {
    proxies.push({
      category: 'Security',
      description: 'Implemented compensating controls reducing exposure window',
      estimatedAvoidance: 'MEDIUM',
      confidenceLevel: 'ESTIMATED',
      contributingDecisions: degradeDecisions.map((d) => d.id),
    });
  }

  const criticalAssets = assets.filter((a) => a.criticality === 'CRITICAL');
  if (criticalAssets.length > 0) {
    proxies.push({
      category: 'Assets',
      description: `Protected ${criticalAssets.length} critical asset(s) during incident`,
      estimatedAvoidance: 'HIGH',
      confidenceLevel: 'CONFIRMED',
      contributingDecisions: log.decisions.map((d) => d.id),
    });
  }

  const totalHighAvoidance = proxies.filter((p) => p.estimatedAvoidance === 'HIGH').length;
  const totalMediumAvoidance = proxies.filter((p) => p.estimatedAvoidance === 'MEDIUM').length;
  const totalLowAvoidance = proxies.filter((p) => p.estimatedAvoidance === 'LOW').length;

  const safetyIncidentsAvoided = pauseDecisions.length > 0 ? 1 : 0;
  const dataBreachesAvoided = degradeDecisions.length > 1 ? 1 : 0;
  const operationalDisruptionsAvoided = log.decisions.length > 3 ? 1 : 0;

  return {
    proxies,
    totalHighAvoidance,
    totalMediumAvoidance,
    totalLowAvoidance,
    safetyIncidentsAvoided,
    dataBreachesAvoided,
    operationalDisruptionsAvoided,
  };
}

/**
 * Calculate advisor effectiveness metrics
 */
export function calculateAdvisorEffectivenessValue(
  log: DecisionLog,
  elapsedSeconds: number,
  crossDomainCount: number
): AdvisorEffectivenessValue {
  const decisions = log.decisions;
  const recommendationsProvided = decisions.length;
  const recommendationsAccepted = decisions.filter(
    (d) => d.esrmFraming?.assetOwner
  ).length;

  const acceptanceRate =
    recommendationsProvided > 0
      ? Math.round((recommendationsAccepted / recommendationsProvided) * 100)
      : 0;

  const firstDecisionTime =
    decisions.length > 0
      ? Math.round(
          (new Date(decisions[0].timestamp).getTime() -
            new Date(log.createdAt).getTime()) /
            1000 /
            60
        )
      : elapsedSeconds / 60;

  const averageDecisionTime =
    decisions.length > 0 ? Math.round(elapsedSeconds / 60 / decisions.length) : 0;

  const factsCount = log.facts.length;
  const assumptionsCount = log.assumptions.length;
  const informationQualityScore =
    factsCount + assumptionsCount > 0
      ? Math.round((factsCount / (factsCount + assumptionsCount)) * 100)
      : 50;

  return {
    recommendationsProvided,
    recommendationsAccepted,
    acceptanceRate,
    timeToFirstRecommendation: Math.max(0, firstDecisionTime),
    averageDecisionTime,
    crossDomainCorrelations: crossDomainCount,
    stakeholderBriefings: log.bridgeRecords.length,
    informationQualityScore,
  };
}

/**
 * Generate value narrative summary
 */
function generateValueNarrative(
  mission: MissionContinuityValue,
  residual: ResidualRiskValue,
  owner: OwnerAffirmationValue,
  avoided: AvoidedLossValue,
  _advisor: AdvisorEffectivenessValue
): string {
  const parts: string[] = [];

  if (mission.state === 'OPERATIONAL') {
    parts.push('Mission continuity maintained');
  } else if (mission.state === 'DEGRADED') {
    parts.push('Operations degraded with controls');
  } else {
    parts.push('Critical intervention executed');
  }

  if (residual.residualRiskExplicitnessRate >= 80) {
    parts.push('residual risk fully documented');
  } else if (residual.residualRiskExplicitnessRate >= 50) {
    parts.push('majority of residual risk documented');
  }

  if (owner.ownerBriefingRate >= 80) {
    parts.push('asset owners engaged per ESRM');
  }

  if (avoided.totalHighAvoidance > 0) {
    parts.push(`${avoided.totalHighAvoidance} high-impact loss(es) avoided`);
  }

  return parts.join('; ') + '.';
}

/**
 * Calculate complete ESRM value created
 */
export function calculateESRMValueCreated(
  log: DecisionLog,
  assets: ProtectedAsset[],
  elapsedSeconds: number,
  assetOwnersBriefed: number,
  crossDomainCount: number
): ESRMValueCreated {
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  const missionContinuity = calculateMissionContinuityValue(log, assets, elapsedMinutes);
  const residualRisk = calculateResidualRiskValue(log);
  const ownerAffirmation = calculateOwnerAffirmationValue(log, assetOwnersBriefed);
  const avoidedLoss = calculateAvoidedLossValue(log, assets);
  const advisorEffectiveness = calculateAdvisorEffectivenessValue(
    log,
    elapsedSeconds,
    crossDomainCount
  );

  const compositeValueScore = Math.round(
    missionContinuity.continuityScore * 0.25 +
      residualRisk.residualRiskExplicitnessRate * 0.2 +
      ownerAffirmation.governanceComplianceScore * 0.2 +
      (avoidedLoss.totalHighAvoidance * 30 + avoidedLoss.totalMediumAvoidance * 15) * 0.15 +
      advisorEffectiveness.acceptanceRate * 0.2
  );

  const valueNarrative = generateValueNarrative(
    missionContinuity,
    residualRisk,
    ownerAffirmation,
    avoidedLoss,
    advisorEffectiveness
  );

  return {
    timestamp: new Date().toISOString(),
    elapsedMinutes,
    missionContinuity,
    residualRisk,
    ownerAffirmation,
    avoidedLoss,
    advisorEffectiveness,
    compositeValueScore,
    valueNarrative,
  };
}
