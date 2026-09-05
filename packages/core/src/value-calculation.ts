/**
 * ESRM Value Calculation Engine
 *
 * Grounded, reproducible value calculations for GSOC/ESRM training.
 * All formulas follow textbook ESRM principles (ASIS International):
 * - Asset criticality × vulnerability × threat (T×V×I / C×V×T)
 * - Treatment cost vs. residual risk reduction
 * - Avoided loss = inherent risk - residual risk
 *
 * TRAINING-SYNTHETIC: All dollar values are illustrative benchmarks.
 * Method matches how real ESRM programs argue value to leadership.
 */

import type { RiskLevel, AssetCriticality, RiskLikelihood, RiskImpact } from './esrm.js';
import { RISK_MATRIX } from './esrm.js';
import type { Decision, DecisionPosture } from './types.js';

/**
 * Documented assumptions for value calculations.
 * These are training benchmarks - real programs customize per organization.
 */
export const VALUE_ASSUMPTIONS = {
  /**
   * Annual Loss Expectancy (ALE) benchmarks by asset criticality.
   * Formula: ALE = ARO × SLE (Annualized Rate × Single Loss Expectancy)
   * Training values based on industry benchmarks for corporate assets.
   */
  ANNUAL_LOSS_EXPECTANCY: {
    CRITICAL: 500000, // $500K - C-suite/life safety
    HIGH: 200000, // $200K - Core infrastructure
    MEDIUM: 50000, // $50K - Standard operations
    LOW: 10000, // $10K - Non-essential systems
  } as const,

  /**
   * Hourly impact cost by asset criticality.
   * Used for: avoided downtime × hourly impact calculations.
   * Based on: industry downtime cost surveys (Gartner, Ponemon).
   */
  HOURLY_IMPACT: {
    CRITICAL: 10000, // $10K/hr - executive time, legal exposure
    HIGH: 5000, // $5K/hr - core operations
    MEDIUM: 1000, // $1K/hr - standard productivity
    LOW: 200, // $200/hr - minimal impact
  } as const,

  /**
   * Treatment cost bands by treatment type.
   * One-time implementation cost + ongoing operational cost.
   * Training benchmarks - real costs vary by control type.
   */
  TREATMENT_COSTS: {
    ACCEPT: { implementation: 0, ongoing: 0 }, // No control cost
    MITIGATE: { implementation: 15000, ongoing: 5000 }, // Controls cost
    TRANSFER: { implementation: 5000, ongoing: 10000 }, // Insurance/contract
    AVOID: { implementation: 25000, ongoing: 2000 }, // Process redesign
  } as const,

  /**
   * Residual risk reduction factors by treatment type.
   * Expressed as percentage of inherent risk eliminated.
   * Industry benchmarks for control effectiveness.
   */
  RESIDUAL_REDUCTION: {
    ACCEPT: 0.0, // 0% - risk accepted as-is
    MITIGATE: 0.6, // 60% - controls reduce exposure
    TRANSFER: 0.7, // 70% - risk shifted to third party
    AVOID: 0.95, // 95% - risk source eliminated
  } as const,

  /**
   * Likelihood → Probability conversion for ARO calculation.
   * Maps qualitative likelihood to quantitative probability.
   * Based on NIST/FAIR methodology.
   */
  LIKELIHOOD_PROBABILITY: {
    ALMOST_CERTAIN: 0.9, // 90% per year
    LIKELY: 0.7, // 70% per year
    POSSIBLE: 0.5, // 50% per year
    UNLIKELY: 0.2, // 20% per year
    RARE: 0.05, // 5% per year
  } as const,

  /**
   * Impact → SLE multiplier for loss calculation.
   * Percentage of asset value at risk per incident.
   * Based on FAIR taxonomy.
   */
  IMPACT_MULTIPLIER: {
    CATASTROPHIC: 1.0, // 100% of asset value
    MAJOR: 0.6, // 60% of asset value
    MODERATE: 0.3, // 30% of asset value
    MINOR: 0.1, // 10% of asset value
    INSIGNIFICANT: 0.02, // 2% of asset value
  } as const,

  /**
   * First-hour decision premium.
   * Multiplier for value of quick decisions during golden hour.
   * Based on incident response time-to-detection research.
   */
  FIRST_HOUR_PREMIUM: 1.5, // 50% premium for sub-hour decisions

  /**
   * ESRM governance value multiplier.
   * Value of documented, defensible decisions for compliance.
   */
  GOVERNANCE_MULTIPLIER: 1.2, // 20% premium for proper documentation
} as const;

/**
 * A single step in the calculation trail.
 * Enables hand-verification of all computed values.
 */
export interface CalcStep {
  stepNumber: number;
  operation: string;
  formula: string;
  inputs: Record<string, number | string | boolean>;
  result: number;
  unit: string;
  note?: string;
}

/**
 * Complete calculation trail for audit/AAR export.
 */
export interface CalcTrail {
  calculationId: string;
  calculatedAt: string;
  inputSummary: {
    assetCriticality: AssetCriticality;
    threatLikelihood: RiskLikelihood;
    impactSeverity: RiskImpact;
    treatment: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID';
    decisionTimeSeconds: number;
    esrmDocumented: boolean;
  };
  steps: CalcStep[];
  finalResult: {
    inherentRisk: number;
    residualRisk: number;
    avoidedLoss: number;
    treatmentCost: number;
    netValue: number;
    roi: number;
  };
  assumptions: typeof VALUE_ASSUMPTIONS;
}

/**
 * Risk score using T×V×I methodology.
 * Formula: Risk = Threat × Vulnerability × Impact
 *
 * @param likelihood - Qualitative threat likelihood
 * @param vulnerability - Asset vulnerability level (derived from criticality)
 * @param impact - Qualitative impact severity
 * @returns Numeric risk score (0-100 scale)
 */
export function calculateTVI(
  likelihood: RiskLikelihood,
  vulnerability: 'HIGH' | 'MEDIUM' | 'LOW',
  impact: RiskImpact
): { score: number; trail: CalcStep[] } {
  const steps: CalcStep[] = [];

  const T = VALUE_ASSUMPTIONS.LIKELIHOOD_PROBABILITY[likelihood];
  const V: Record<string, number> = { HIGH: 0.9, MEDIUM: 0.5, LOW: 0.2 };
  const I = VALUE_ASSUMPTIONS.IMPACT_MULTIPLIER[impact];

  steps.push({
    stepNumber: 1,
    operation: 'Convert Threat Likelihood to Probability',
    formula: 'T = LIKELIHOOD_PROBABILITY[likelihood]',
    inputs: { likelihood, lookupTable: 'VALUE_ASSUMPTIONS.LIKELIHOOD_PROBABILITY' },
    result: T,
    unit: 'probability',
    note: `${likelihood} → ${(T * 100).toFixed(0)}% annual probability`,
  });

  steps.push({
    stepNumber: 2,
    operation: 'Map Vulnerability Level to Factor',
    formula: 'V = { HIGH: 0.9, MEDIUM: 0.5, LOW: 0.2 }[vulnerability]',
    inputs: { vulnerability },
    result: V[vulnerability],
    unit: 'factor',
  });

  steps.push({
    stepNumber: 3,
    operation: 'Convert Impact to Multiplier',
    formula: 'I = IMPACT_MULTIPLIER[impact]',
    inputs: { impact, lookupTable: 'VALUE_ASSUMPTIONS.IMPACT_MULTIPLIER' },
    result: I,
    unit: 'multiplier',
    note: `${impact} → ${(I * 100).toFixed(0)}% of asset value at risk`,
  });

  const rawScore = T * V[vulnerability] * I;
  const normalizedScore = Math.round(rawScore * 100);

  steps.push({
    stepNumber: 4,
    operation: 'Calculate T×V×I Risk Score',
    formula: 'Score = T × V × I × 100',
    inputs: { T, V: V[vulnerability], I },
    result: normalizedScore,
    unit: 'risk score (0-100)',
    note: `${T} × ${V[vulnerability]} × ${I} × 100 = ${normalizedScore}`,
  });

  return { score: normalizedScore, trail: steps };
}

/**
 * Annualized Loss Expectancy (ALE) calculation.
 * Formula: ALE = ARO × SLE
 * Where: ARO = Annualized Rate of Occurrence
 *        SLE = Single Loss Expectancy
 *
 * @param criticality - Asset criticality level
 * @param likelihood - Threat likelihood
 * @param impact - Impact severity
 * @returns ALE in dollars with calculation trail
 */
export function calculateALE(
  criticality: AssetCriticality,
  likelihood: RiskLikelihood,
  impact: RiskImpact
): { ale: number; trail: CalcStep[] } {
  const steps: CalcStep[] = [];

  const baseALE = VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY[criticality];
  const ARO = VALUE_ASSUMPTIONS.LIKELIHOOD_PROBABILITY[likelihood];
  const impactMult = VALUE_ASSUMPTIONS.IMPACT_MULTIPLIER[impact];

  steps.push({
    stepNumber: 1,
    operation: 'Look up Base ALE by Asset Criticality',
    formula: 'baseALE = ANNUAL_LOSS_EXPECTANCY[criticality]',
    inputs: { criticality, lookupTable: 'VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY' },
    result: baseALE,
    unit: '$/year',
    note: `${criticality} assets: $${baseALE.toLocaleString()}/year benchmark`,
  });

  const SLE = baseALE * impactMult;
  steps.push({
    stepNumber: 2,
    operation: 'Calculate Single Loss Expectancy (SLE)',
    formula: 'SLE = baseALE × impactMultiplier',
    inputs: { baseALE, impact, impactMultiplier: impactMult },
    result: SLE,
    unit: '$/incident',
    note: `$${baseALE.toLocaleString()} × ${impactMult} = $${SLE.toLocaleString()}`,
  });

  steps.push({
    stepNumber: 3,
    operation: 'Get Annualized Rate of Occurrence (ARO)',
    formula: 'ARO = LIKELIHOOD_PROBABILITY[likelihood]',
    inputs: { likelihood },
    result: ARO,
    unit: 'incidents/year',
    note: `${likelihood} → ${ARO} expected incidents per year`,
  });

  const ale = Math.round(ARO * SLE);
  steps.push({
    stepNumber: 4,
    operation: 'Calculate Annualized Loss Expectancy (ALE)',
    formula: 'ALE = ARO × SLE',
    inputs: { ARO, SLE },
    result: ale,
    unit: '$/year',
    note: `${ARO} × $${SLE.toLocaleString()} = $${ale.toLocaleString()}/year`,
  });

  return { ale, trail: steps };
}

/**
 * Calculate treatment ROI (Return on Investment).
 * Formula: ROI = (Avoided Loss - Treatment Cost) / Treatment Cost × 100
 *
 * @param inherentALE - ALE before treatment
 * @param treatment - Selected treatment option
 * @returns ROI percentage and breakdown
 */
export function calculateTreatmentROI(
  inherentALE: number,
  treatment: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID'
): {
  residualALE: number;
  avoidedLoss: number;
  treatmentCost: number;
  netValue: number;
  roi: number;
  trail: CalcStep[];
} {
  const steps: CalcStep[] = [];
  const costs = VALUE_ASSUMPTIONS.TREATMENT_COSTS[treatment];
  const reduction = VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION[treatment];

  const residualALE = Math.round(inherentALE * (1 - reduction));
  steps.push({
    stepNumber: 1,
    operation: 'Calculate Residual ALE After Treatment',
    formula: 'residualALE = inherentALE × (1 - reductionFactor)',
    inputs: {
      inherentALE,
      treatment,
      reductionFactor: reduction,
    },
    result: residualALE,
    unit: '$/year',
    note: `${treatment} reduces risk by ${(reduction * 100).toFixed(0)}%`,
  });

  const avoidedLoss = inherentALE - residualALE;
  steps.push({
    stepNumber: 2,
    operation: 'Calculate Avoided Loss (Risk Reduction)',
    formula: 'avoidedLoss = inherentALE - residualALE',
    inputs: { inherentALE, residualALE },
    result: avoidedLoss,
    unit: '$/year',
    note: `$${inherentALE.toLocaleString()} - $${residualALE.toLocaleString()} = $${avoidedLoss.toLocaleString()}`,
  });

  const treatmentCost = costs.implementation + costs.ongoing;
  steps.push({
    stepNumber: 3,
    operation: 'Calculate Total Treatment Cost (Year 1)',
    formula: 'treatmentCost = implementationCost + ongoingCost',
    inputs: {
      implementationCost: costs.implementation,
      ongoingCost: costs.ongoing,
    },
    result: treatmentCost,
    unit: '$',
    note: `One-time: $${costs.implementation.toLocaleString()}, Ongoing: $${costs.ongoing.toLocaleString()}/yr`,
  });

  const netValue = avoidedLoss - treatmentCost;
  steps.push({
    stepNumber: 4,
    operation: 'Calculate Net Value Created',
    formula: 'netValue = avoidedLoss - treatmentCost',
    inputs: { avoidedLoss, treatmentCost },
    result: netValue,
    unit: '$/year',
    note: netValue >= 0 ? 'Positive ROI - treatment justified' : 'Negative ROI - accept risk?',
  });

  const roi = treatmentCost > 0 ? Math.round((netValue / treatmentCost) * 100) : 0;
  steps.push({
    stepNumber: 5,
    operation: 'Calculate Return on Investment',
    formula: 'ROI = (netValue / treatmentCost) × 100',
    inputs: { netValue, treatmentCost },
    result: roi,
    unit: '%',
    note: roi >= 100 ? 'Strong ROI (≥100%)' : roi >= 0 ? 'Marginal ROI' : 'Negative ROI',
  });

  return { residualALE, avoidedLoss, treatmentCost, netValue, roi, trail: steps };
}

/**
 * Calculate decision quality score.
 * Factors: time-to-decision, ESRM documentation, treatment alignment.
 */
export function calculateDecisionQuality(
  decisionTimeSeconds: number,
  esrmDocumented: boolean,
  treatment: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID',
  inherentRiskLevel: RiskLevel
): { score: number; breakdown: Record<string, number>; trail: CalcStep[] } {
  const steps: CalcStep[] = [];

  const timeScore = Math.max(0, Math.min(100, 100 - (decisionTimeSeconds / 60) * 10));
  steps.push({
    stepNumber: 1,
    operation: 'Calculate Time Score',
    formula: 'timeScore = max(0, min(100, 100 - (seconds/60) × 10))',
    inputs: { decisionTimeSeconds, minutesPenalty: 10 },
    result: Math.round(timeScore),
    unit: 'points',
    note: `${decisionTimeSeconds}s → ${Math.round(timeScore)} points (faster = better)`,
  });

  const esrmScore = esrmDocumented ? 100 : 40;
  steps.push({
    stepNumber: 2,
    operation: 'Calculate ESRM Documentation Score',
    formula: 'esrmScore = esrmDocumented ? 100 : 40',
    inputs: { esrmDocumented },
    result: esrmScore,
    unit: 'points',
    note: esrmDocumented ? 'Full ESRM framing captured' : 'Minimal documentation',
  });

  const alignmentMatrix: Record<RiskLevel, Record<string, number>> = {
    CRITICAL: { AVOID: 100, MITIGATE: 70, TRANSFER: 60, ACCEPT: 20 },
    HIGH: { AVOID: 90, MITIGATE: 100, TRANSFER: 80, ACCEPT: 30 },
    MEDIUM: { AVOID: 70, MITIGATE: 90, TRANSFER: 90, ACCEPT: 70 },
    LOW: { AVOID: 50, MITIGATE: 70, TRANSFER: 60, ACCEPT: 100 },
  };
  const alignmentScore = alignmentMatrix[inherentRiskLevel][treatment];
  steps.push({
    stepNumber: 3,
    operation: 'Calculate Treatment Alignment Score',
    formula: 'alignmentScore = ALIGNMENT_MATRIX[riskLevel][treatment]',
    inputs: { inherentRiskLevel, treatment },
    result: alignmentScore,
    unit: 'points',
    note: `${treatment} for ${inherentRiskLevel} risk → ${alignmentScore}`,
  });

  const totalScore = Math.round(timeScore * 0.3 + esrmScore * 0.3 + alignmentScore * 0.4);
  steps.push({
    stepNumber: 4,
    operation: 'Calculate Weighted Decision Quality Score',
    formula: 'total = (time × 0.3) + (esrm × 0.3) + (alignment × 0.4)',
    inputs: {
      timeScore: Math.round(timeScore),
      esrmScore,
      alignmentScore,
      weights: '30% / 30% / 40%',
    },
    result: totalScore,
    unit: 'points (0-100)',
  });

  return {
    score: totalScore,
    breakdown: {
      timeScore: Math.round(timeScore),
      esrmScore,
      alignmentScore,
    },
    trail: steps,
  };
}

/**
 * Complete value calculation for a decision.
 * Combines all calculations into a single audit-ready trail.
 */
export function calculateDecisionValue(params: {
  assetCriticality: AssetCriticality;
  threatLikelihood: RiskLikelihood;
  impactSeverity: RiskImpact;
  treatment: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID';
  decisionTimeSeconds: number;
  esrmDocumented: boolean;
}): CalcTrail {
  const calculationId = `calc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const calculatedAt = new Date().toISOString();
  const allSteps: CalcStep[] = [];
  let stepOffset = 0;

  const vulnerability =
    params.assetCriticality === 'CRITICAL' || params.assetCriticality === 'HIGH'
      ? 'HIGH'
      : params.assetCriticality === 'MEDIUM'
        ? 'MEDIUM'
        : 'LOW';

  allSteps.push({
    stepNumber: 1,
    operation: 'Derive Vulnerability from Asset Criticality',
    formula:
      'vulnerability = criticality ∈ {CRITICAL, HIGH} ? HIGH : criticality = MEDIUM ? MEDIUM : LOW',
    inputs: { assetCriticality: params.assetCriticality },
    result: vulnerability === 'HIGH' ? 0.9 : vulnerability === 'MEDIUM' ? 0.5 : 0.2,
    unit: 'vulnerability factor',
    note: `${params.assetCriticality} → ${vulnerability} vulnerability`,
  });
  stepOffset = 1;

  const { trail: tviTrail } = calculateTVI(
    params.threatLikelihood,
    vulnerability,
    params.impactSeverity
  );
  allSteps.push(...tviTrail.map((s) => ({ ...s, stepNumber: s.stepNumber + stepOffset })));
  stepOffset += tviTrail.length;

  const { ale: inherentALE, trail: aleTrail } = calculateALE(
    params.assetCriticality,
    params.threatLikelihood,
    params.impactSeverity
  );
  allSteps.push(...aleTrail.map((s) => ({ ...s, stepNumber: s.stepNumber + stepOffset })));
  stepOffset += aleTrail.length;

  const {
    residualALE,
    avoidedLoss,
    treatmentCost,
    netValue,
    roi,
    trail: roiTrail,
  } = calculateTreatmentROI(inherentALE, params.treatment);
  allSteps.push(...roiTrail.map((s) => ({ ...s, stepNumber: s.stepNumber + stepOffset })));
  stepOffset += roiTrail.length;

  const inherentRiskLevel = RISK_MATRIX[params.threatLikelihood][params.impactSeverity];
  const { trail: qualityTrail } = calculateDecisionQuality(
    params.decisionTimeSeconds,
    params.esrmDocumented,
    params.treatment,
    inherentRiskLevel
  );
  allSteps.push(...qualityTrail.map((s) => ({ ...s, stepNumber: s.stepNumber + stepOffset })));
  stepOffset += qualityTrail.length;

  const firstHourBonus =
    params.decisionTimeSeconds <= 3600 ? VALUE_ASSUMPTIONS.FIRST_HOUR_PREMIUM : 1;
  const governanceBonus = params.esrmDocumented ? VALUE_ASSUMPTIONS.GOVERNANCE_MULTIPLIER : 1;
  const adjustedNetValue = Math.round(netValue * firstHourBonus * governanceBonus);

  allSteps.push({
    stepNumber: stepOffset + 1,
    operation: 'Apply First-Hour & Governance Multipliers',
    formula: 'adjustedValue = netValue × firstHourPremium × governanceMultiplier',
    inputs: {
      netValue,
      firstHourPremium: firstHourBonus,
      governanceMultiplier: governanceBonus,
      decisionTimeSeconds: params.decisionTimeSeconds,
      esrmDocumented: params.esrmDocumented,
    },
    result: adjustedNetValue,
    unit: '$/year',
    note: `Bonuses: first-hour ×${firstHourBonus}, governance ×${governanceBonus}`,
  });

  return {
    calculationId,
    calculatedAt,
    inputSummary: {
      assetCriticality: params.assetCriticality,
      threatLikelihood: params.threatLikelihood,
      impactSeverity: params.impactSeverity,
      treatment: params.treatment,
      decisionTimeSeconds: params.decisionTimeSeconds,
      esrmDocumented: params.esrmDocumented,
    },
    steps: allSteps,
    finalResult: {
      inherentRisk: inherentALE,
      residualRisk: residualALE,
      avoidedLoss,
      treatmentCost,
      netValue: adjustedNetValue,
      roi,
    },
    assumptions: VALUE_ASSUMPTIONS,
  };
}

/**
 * Format a calc trail for display (condensed view).
 */
export function formatCalcTrailSummary(trail: CalcTrail): string {
  const r = trail.finalResult;
  return [
    `📊 Value Calculation Summary`,
    `────────────────────────────`,
    `Asset: ${trail.inputSummary.assetCriticality} criticality`,
    `Risk: ${trail.inputSummary.threatLikelihood} × ${trail.inputSummary.impactSeverity}`,
    `Treatment: ${trail.inputSummary.treatment}`,
    ``,
    `💰 Financial Impact:`,
    `  Inherent Risk: $${r.inherentRisk.toLocaleString()}/yr`,
    `  Residual Risk: $${r.residualRisk.toLocaleString()}/yr`,
    `  Avoided Loss:  $${r.avoidedLoss.toLocaleString()}/yr`,
    `  Treatment Cost: $${r.treatmentCost.toLocaleString()}`,
    `  Net Value:     $${r.netValue.toLocaleString()}/yr`,
    `  ROI:           ${r.roi}%`,
    ``,
    `⏱️ Decision: ${trail.inputSummary.decisionTimeSeconds}s | ESRM: ${trail.inputSummary.esrmDocumented ? '✓' : '✗'}`,
    `📋 ${trail.steps.length} calculation steps in trail`,
  ].join('\n');
}

/**
 * Calculate aggregate value from multiple decisions.
 */
export function calculateSessionValue(
  decisions: {
    criticality: AssetCriticality;
    likelihood: RiskLikelihood;
    impact: RiskImpact;
    treatment: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID';
    timeSeconds: number;
    esrmDocumented: boolean;
  }[]
): {
  totalInherentRisk: number;
  totalResidualRisk: number;
  totalAvoidedLoss: number;
  totalTreatmentCost: number;
  totalNetValue: number;
  averageROI: number;
  trails: CalcTrail[];
} {
  const trails = decisions.map((d) =>
    calculateDecisionValue({
      assetCriticality: d.criticality,
      threatLikelihood: d.likelihood,
      impactSeverity: d.impact,
      treatment: d.treatment,
      decisionTimeSeconds: d.timeSeconds,
      esrmDocumented: d.esrmDocumented,
    })
  );

  const totals = trails.reduce(
    (acc, t) => ({
      totalInherentRisk: acc.totalInherentRisk + t.finalResult.inherentRisk,
      totalResidualRisk: acc.totalResidualRisk + t.finalResult.residualRisk,
      totalAvoidedLoss: acc.totalAvoidedLoss + t.finalResult.avoidedLoss,
      totalTreatmentCost: acc.totalTreatmentCost + t.finalResult.treatmentCost,
      totalNetValue: acc.totalNetValue + t.finalResult.netValue,
      roiSum: acc.roiSum + t.finalResult.roi,
    }),
    {
      totalInherentRisk: 0,
      totalResidualRisk: 0,
      totalAvoidedLoss: 0,
      totalTreatmentCost: 0,
      totalNetValue: 0,
      roiSum: 0,
    }
  );

  return {
    totalInherentRisk: totals.totalInherentRisk,
    totalResidualRisk: totals.totalResidualRisk,
    totalAvoidedLoss: totals.totalAvoidedLoss,
    totalTreatmentCost: totals.totalTreatmentCost,
    totalNetValue: totals.totalNetValue,
    averageROI: decisions.length > 0 ? Math.round(totals.roiSum / decisions.length) : 0,
    trails,
  };
}

/**
 * Map posture to treatment for calculations.
 */
export function postureToTreatmentCalc(
  posture: DecisionPosture,
  explicitTreatment?: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID'
): 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID' {
  if (explicitTreatment) return explicitTreatment;
  switch (posture) {
    case 'CONTINUE':
      return 'ACCEPT';
    case 'DEGRADE':
      return 'MITIGATE';
    case 'PAUSE':
      return 'AVOID';
  }
}

/**
 * Get risk level from decision context.
 */
export function getDecisionRiskLevel(decision: Decision): RiskLevel {
  const treatment = decision.esrmFraming?.treatment;
  if (decision.posture === 'PAUSE') return 'CRITICAL';
  if (decision.posture === 'DEGRADE' && treatment === 'TRANSFER') return 'HIGH';
  if (decision.posture === 'DEGRADE') return 'MEDIUM';
  return 'LOW';
}
