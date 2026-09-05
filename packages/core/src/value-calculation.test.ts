/**
 * Unit Tests for ESRM Value Calculation Engine
 *
 * Tests determinism and correctness of all value calculations.
 * Same inputs MUST produce same outputs.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTVI,
  calculateALE,
  calculateTreatmentROI,
  calculateDecisionQuality,
  calculateDecisionValue,
  calculateSessionValue,
  postureToTreatmentCalc,
  VALUE_ASSUMPTIONS,
} from './value-calculation.js';

describe('VALUE_ASSUMPTIONS', () => {
  it('should have documented assumptions for all criticality levels', () => {
    expect(VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY.CRITICAL).toBe(500000);
    expect(VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY.HIGH).toBe(200000);
    expect(VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY.MEDIUM).toBe(50000);
    expect(VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY.LOW).toBe(10000);
  });

  it('should have treatment costs for all treatment types', () => {
    expect(VALUE_ASSUMPTIONS.TREATMENT_COSTS.ACCEPT.implementation).toBe(0);
    expect(VALUE_ASSUMPTIONS.TREATMENT_COSTS.MITIGATE.implementation).toBe(15000);
    expect(VALUE_ASSUMPTIONS.TREATMENT_COSTS.TRANSFER.ongoing).toBe(10000);
    expect(VALUE_ASSUMPTIONS.TREATMENT_COSTS.AVOID.implementation).toBe(25000);
  });

  it('should have reduction factors between 0 and 1', () => {
    expect(VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION.ACCEPT).toBe(0);
    expect(VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION.MITIGATE).toBe(0.6);
    expect(VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION.TRANSFER).toBe(0.7);
    expect(VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION.AVOID).toBe(0.95);
  });
});

describe('calculateTVI', () => {
  it('should be deterministic - same inputs produce same outputs', () => {
    const result1 = calculateTVI('LIKELY', 'HIGH', 'MAJOR');
    const result2 = calculateTVI('LIKELY', 'HIGH', 'MAJOR');
    expect(result1.score).toBe(result2.score);
    expect(result1.trail.length).toBe(result2.trail.length);
  });

  it('should calculate higher scores for higher risk combinations', () => {
    const highRisk = calculateTVI('ALMOST_CERTAIN', 'HIGH', 'CATASTROPHIC');
    const lowRisk = calculateTVI('RARE', 'LOW', 'INSIGNIFICANT');
    expect(highRisk.score).toBeGreaterThan(lowRisk.score);
  });

  it('should produce scores in 0-100 range', () => {
    const result = calculateTVI('LIKELY', 'MEDIUM', 'MODERATE');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should include 4 calculation steps', () => {
    const result = calculateTVI('POSSIBLE', 'LOW', 'MINOR');
    expect(result.trail.length).toBe(4);
    expect(result.trail[0].operation).toContain('Threat Likelihood');
    expect(result.trail[3].operation).toContain('T×V×I');
  });

  it('should use correct probability lookups', () => {
    const result = calculateTVI('ALMOST_CERTAIN', 'HIGH', 'CATASTROPHIC');
    const step1 = result.trail[0];
    expect(step1.result).toBe(0.9); // ALMOST_CERTAIN = 90%
  });
});

describe('calculateALE', () => {
  it('should be deterministic', () => {
    const result1 = calculateALE('HIGH', 'LIKELY', 'MAJOR');
    const result2 = calculateALE('HIGH', 'LIKELY', 'MAJOR');
    expect(result1.ale).toBe(result2.ale);
  });

  it('should scale with criticality', () => {
    const critical = calculateALE('CRITICAL', 'POSSIBLE', 'MODERATE');
    const low = calculateALE('LOW', 'POSSIBLE', 'MODERATE');
    expect(critical.ale).toBeGreaterThan(low.ale);
  });

  it('should calculate ALE = ARO × SLE', () => {
    const result = calculateALE('CRITICAL', 'LIKELY', 'MAJOR');
    const ARO = VALUE_ASSUMPTIONS.LIKELIHOOD_PROBABILITY.LIKELY; // 0.7
    const baseALE = VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY.CRITICAL; // 500000
    const impactMult = VALUE_ASSUMPTIONS.IMPACT_MULTIPLIER.MAJOR; // 0.6
    const expectedSLE = baseALE * impactMult; // 300000
    const expectedALE = Math.round(ARO * expectedSLE); // 210000
    expect(result.ale).toBe(expectedALE);
  });

  it('should include 4 calculation steps', () => {
    const result = calculateALE('MEDIUM', 'UNLIKELY', 'MINOR');
    expect(result.trail.length).toBe(4);
    expect(result.trail[0].operation).toContain('Base ALE');
    expect(result.trail[3].operation).toContain('Annualized Loss Expectancy');
  });
});

describe('calculateTreatmentROI', () => {
  it('should be deterministic', () => {
    const result1 = calculateTreatmentROI(100000, 'MITIGATE');
    const result2 = calculateTreatmentROI(100000, 'MITIGATE');
    expect(result1.roi).toBe(result2.roi);
    expect(result1.netValue).toBe(result2.netValue);
  });

  it('should show zero avoided loss for ACCEPT', () => {
    const result = calculateTreatmentROI(100000, 'ACCEPT');
    expect(result.avoidedLoss).toBe(0);
    expect(result.treatmentCost).toBe(0);
    expect(result.residualALE).toBe(100000);
  });

  it('should calculate correct reduction for MITIGATE', () => {
    const result = calculateTreatmentROI(100000, 'MITIGATE');
    const expectedResidual = Math.round(100000 * (1 - 0.6)); // 40000
    expect(result.residualALE).toBe(expectedResidual);
    expect(result.avoidedLoss).toBe(100000 - expectedResidual);
  });

  it('should calculate correct reduction for AVOID', () => {
    const result = calculateTreatmentROI(100000, 'AVOID');
    const expectedResidual = Math.round(100000 * (1 - 0.95)); // 5000
    expect(result.residualALE).toBe(expectedResidual);
  });

  it('should calculate ROI correctly', () => {
    const result = calculateTreatmentROI(100000, 'MITIGATE');
    const expectedAvoidedLoss = 60000; // 100000 * 0.6
    const expectedCost = 15000 + 5000; // implementation + ongoing
    const expectedNetValue = expectedAvoidedLoss - expectedCost;
    const expectedROI = Math.round((expectedNetValue / expectedCost) * 100);
    expect(result.netValue).toBe(expectedNetValue);
    expect(result.roi).toBe(expectedROI);
  });
});

describe('calculateDecisionQuality', () => {
  it('should be deterministic', () => {
    const result1 = calculateDecisionQuality(30, true, 'MITIGATE', 'HIGH');
    const result2 = calculateDecisionQuality(30, true, 'MITIGATE', 'HIGH');
    expect(result1.score).toBe(result2.score);
  });

  it('should reward faster decisions', () => {
    const fast = calculateDecisionQuality(10, true, 'MITIGATE', 'HIGH');
    const slow = calculateDecisionQuality(300, true, 'MITIGATE', 'HIGH');
    expect(fast.breakdown.timeScore).toBeGreaterThan(slow.breakdown.timeScore);
  });

  it('should reward ESRM documentation', () => {
    const documented = calculateDecisionQuality(60, true, 'MITIGATE', 'HIGH');
    const undocumented = calculateDecisionQuality(60, false, 'MITIGATE', 'HIGH');
    expect(documented.breakdown.esrmScore).toBe(100);
    expect(undocumented.breakdown.esrmScore).toBe(40);
  });

  it('should reward appropriate treatment for risk level', () => {
    const criticalAvoid = calculateDecisionQuality(60, true, 'AVOID', 'CRITICAL');
    const criticalAccept = calculateDecisionQuality(60, true, 'ACCEPT', 'CRITICAL');
    expect(criticalAvoid.breakdown.alignmentScore).toBeGreaterThan(
      criticalAccept.breakdown.alignmentScore
    );
  });

  it('should reward ACCEPT for LOW risk', () => {
    const lowAccept = calculateDecisionQuality(60, true, 'ACCEPT', 'LOW');
    const lowAvoid = calculateDecisionQuality(60, true, 'AVOID', 'LOW');
    expect(lowAccept.breakdown.alignmentScore).toBeGreaterThan(lowAvoid.breakdown.alignmentScore);
  });
});

describe('calculateDecisionValue', () => {
  const baseParams = {
    assetCriticality: 'HIGH' as const,
    threatLikelihood: 'LIKELY' as const,
    impactSeverity: 'MAJOR' as const,
    treatment: 'MITIGATE' as const,
    decisionTimeSeconds: 45,
    esrmDocumented: true,
  };

  it('should be deterministic - identical inputs produce identical outputs', () => {
    const result1 = calculateDecisionValue(baseParams);
    const result2 = calculateDecisionValue(baseParams);

    expect(result1.finalResult.inherentRisk).toBe(result2.finalResult.inherentRisk);
    expect(result1.finalResult.residualRisk).toBe(result2.finalResult.residualRisk);
    expect(result1.finalResult.avoidedLoss).toBe(result2.finalResult.avoidedLoss);
    expect(result1.finalResult.netValue).toBe(result2.finalResult.netValue);
    expect(result1.finalResult.roi).toBe(result2.finalResult.roi);
    expect(result1.steps.length).toBe(result2.steps.length);
  });

  it('should generate a complete calc trail', () => {
    const result = calculateDecisionValue(baseParams);

    expect(result.calculationId).toBeTruthy();
    expect(result.calculatedAt).toBeTruthy();
    expect(result.inputSummary).toEqual(baseParams);
    expect(result.steps.length).toBeGreaterThan(10);
    expect(result.assumptions).toBe(VALUE_ASSUMPTIONS);
  });

  it('should have sequential step numbers', () => {
    const result = calculateDecisionValue(baseParams);
    for (let i = 0; i < result.steps.length; i++) {
      expect(result.steps[i].stepNumber).toBe(i + 1);
    }
  });

  it('should apply first-hour premium for sub-hour decisions', () => {
    const subHour = calculateDecisionValue({ ...baseParams, decisionTimeSeconds: 45 });
    const overHour = calculateDecisionValue({ ...baseParams, decisionTimeSeconds: 4000 });

    // Both have same base calculations, but sub-hour gets 1.5x multiplier
    expect(subHour.finalResult.netValue).toBeGreaterThan(overHour.finalResult.netValue);
  });

  it('should apply governance multiplier for documented decisions', () => {
    const documented = calculateDecisionValue({ ...baseParams, esrmDocumented: true });
    const undocumented = calculateDecisionValue({ ...baseParams, esrmDocumented: false });

    expect(documented.finalResult.netValue).toBeGreaterThan(undocumented.finalResult.netValue);
  });

  it('should include assumptions in trail for reproducibility', () => {
    const result = calculateDecisionValue(baseParams);
    expect(result.assumptions.ANNUAL_LOSS_EXPECTANCY).toBeDefined();
    expect(result.assumptions.TREATMENT_COSTS).toBeDefined();
    expect(result.assumptions.RESIDUAL_REDUCTION).toBeDefined();
  });
});

describe('calculateSessionValue', () => {
  it('should aggregate multiple decisions correctly', () => {
    const decisions = [
      {
        criticality: 'CRITICAL' as const,
        likelihood: 'LIKELY' as const,
        impact: 'MAJOR' as const,
        treatment: 'AVOID' as const,
        timeSeconds: 30,
        esrmDocumented: true,
      },
      {
        criticality: 'MEDIUM' as const,
        likelihood: 'POSSIBLE' as const,
        impact: 'MODERATE' as const,
        treatment: 'ACCEPT' as const,
        timeSeconds: 45,
        esrmDocumented: true,
      },
    ];

    const result = calculateSessionValue(decisions);

    expect(result.trails.length).toBe(2);
    expect(result.totalInherentRisk).toBe(
      result.trails[0].finalResult.inherentRisk + result.trails[1].finalResult.inherentRisk
    );
    expect(result.totalResidualRisk).toBe(
      result.trails[0].finalResult.residualRisk + result.trails[1].finalResult.residualRisk
    );
    expect(result.totalAvoidedLoss).toBe(
      result.trails[0].finalResult.avoidedLoss + result.trails[1].finalResult.avoidedLoss
    );
  });

  it('should calculate average ROI', () => {
    const decisions = [
      {
        criticality: 'HIGH' as const,
        likelihood: 'LIKELY' as const,
        impact: 'MAJOR' as const,
        treatment: 'MITIGATE' as const,
        timeSeconds: 30,
        esrmDocumented: true,
      },
      {
        criticality: 'HIGH' as const,
        likelihood: 'LIKELY' as const,
        impact: 'MAJOR' as const,
        treatment: 'MITIGATE' as const,
        timeSeconds: 30,
        esrmDocumented: true,
      },
    ];

    const result = calculateSessionValue(decisions);
    const expectedAvgROI = Math.round(
      (result.trails[0].finalResult.roi + result.trails[1].finalResult.roi) / 2
    );
    expect(result.averageROI).toBe(expectedAvgROI);
  });

  it('should return zeros for empty session', () => {
    const result = calculateSessionValue([]);
    expect(result.totalInherentRisk).toBe(0);
    expect(result.totalResidualRisk).toBe(0);
    expect(result.totalAvoidedLoss).toBe(0);
    expect(result.averageROI).toBe(0);
    expect(result.trails.length).toBe(0);
  });
});

describe('postureToTreatmentCalc', () => {
  it('should map CONTINUE to ACCEPT', () => {
    expect(postureToTreatmentCalc('CONTINUE')).toBe('ACCEPT');
  });

  it('should map DEGRADE to MITIGATE', () => {
    expect(postureToTreatmentCalc('DEGRADE')).toBe('MITIGATE');
  });

  it('should map PAUSE to AVOID', () => {
    expect(postureToTreatmentCalc('PAUSE')).toBe('AVOID');
  });

  it('should use explicit treatment when provided', () => {
    expect(postureToTreatmentCalc('DEGRADE', 'TRANSFER')).toBe('TRANSFER');
    expect(postureToTreatmentCalc('CONTINUE', 'MITIGATE')).toBe('MITIGATE');
  });
});

describe('Calculation reproducibility', () => {
  it('should allow hand-verification of intermediate steps', () => {
    const result = calculateDecisionValue({
      assetCriticality: 'HIGH',
      threatLikelihood: 'LIKELY',
      impactSeverity: 'MAJOR',
      treatment: 'MITIGATE',
      decisionTimeSeconds: 60,
      esrmDocumented: true,
    });

    // Verify ALE calculation step by step
    const baseALE = VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY.HIGH; // 200000
    const ARO = VALUE_ASSUMPTIONS.LIKELIHOOD_PROBABILITY.LIKELY; // 0.7
    const impactMult = VALUE_ASSUMPTIONS.IMPACT_MULTIPLIER.MAJOR; // 0.6
    const SLE = baseALE * impactMult; // 120000
    const expectedInherentALE = Math.round(ARO * SLE); // 84000

    expect(result.finalResult.inherentRisk).toBe(expectedInherentALE);

    // Verify residual calculation
    const reduction = VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION.MITIGATE; // 0.6
    const expectedResidual = Math.round(expectedInherentALE * (1 - reduction)); // 33600
    expect(result.finalResult.residualRisk).toBe(expectedResidual);

    // Verify avoided loss
    expect(result.finalResult.avoidedLoss).toBe(expectedInherentALE - expectedResidual);
  });
});
