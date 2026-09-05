/**
 * Unit Tests for ESRM Decision Scoring Engine
 *
 * Tests that scoring is mathematically sound:
 * - Same inputs → same outputs (deterministic)
 * - Bad play ≪ good play (clear penalties)
 * - Bonuses and penalties apply correctly
 */

import { describe, it, expect } from 'vitest';
import {
  scoreDecision,
  validateScoringFairness,
  SCORING_CONFIG,
  type DecisionScoringInput,
} from './decision-scoring.js';

const createBaseInput = (overrides: Partial<DecisionScoringInput> = {}): DecisionScoringInput => ({
  chosenPosture: 'CONTINUE',
  expectedPosture: 'CONTINUE',
  chosenTreatment: 'ACCEPT',
  expectedTreatment: 'ACCEPT',
  assetCriticality: 'MEDIUM',
  ownerBriefed: false,
  residualRiskSelected: false,
  treatmentCategorySelected: false,
  rationaleProvided: false,
  decisionTimeSeconds: 30,
  timerLimitSeconds: 75,
  wasTimeout: false,
  wasSkip: false,
  injectConfidence: 'MEDIUM',
  resourceContentionOccurred: false,
  currentStreak: 0,
  difficulty: 'OPERATOR',
  ...overrides,
});

describe('SCORING_CONFIG', () => {
  it('should have base points where CORRECT > WRONG > SKIP > TIMEOUT', () => {
    expect(SCORING_CONFIG.BASE_POINTS.CORRECT).toBeGreaterThan(SCORING_CONFIG.BASE_POINTS.WRONG);
    expect(SCORING_CONFIG.BASE_POINTS.WRONG).toBeGreaterThan(SCORING_CONFIG.BASE_POINTS.SKIP);
    expect(SCORING_CONFIG.BASE_POINTS.SKIP).toBeGreaterThan(SCORING_CONFIG.BASE_POINTS.TIMEOUT);
  });

  it('should have treatment alignment multipliers in correct order', () => {
    expect(SCORING_CONFIG.TREATMENT_ALIGNMENT.PERFECT).toBeGreaterThan(
      SCORING_CONFIG.TREATMENT_ALIGNMENT.GOOD
    );
    expect(SCORING_CONFIG.TREATMENT_ALIGNMENT.GOOD).toBeGreaterThan(
      SCORING_CONFIG.TREATMENT_ALIGNMENT.ACCEPTABLE
    );
    expect(SCORING_CONFIG.TREATMENT_ALIGNMENT.ACCEPTABLE).toBeGreaterThan(
      SCORING_CONFIG.TREATMENT_ALIGNMENT.POOR
    );
    expect(SCORING_CONFIG.TREATMENT_ALIGNMENT.POOR).toBeGreaterThan(
      SCORING_CONFIG.TREATMENT_ALIGNMENT.TERRIBLE
    );
  });

  it('should have all penalties as negative values', () => {
    expect(SCORING_CONFIG.PENALTIES.ACCEPT_WHEN_CRITICAL).toBeLessThan(0);
    expect(SCORING_CONFIG.PENALTIES.TRANSFER_THEATER).toBeLessThan(0);
    expect(SCORING_CONFIG.PENALTIES.IGNORED_HIGH_CONFIDENCE).toBeLessThan(0);
    expect(SCORING_CONFIG.PENALTIES.RESOURCE_CONTENTION).toBeLessThan(0);
    expect(SCORING_CONFIG.PENALTIES.RAPID_FIRE_SPAM).toBeLessThan(0);
  });
});

describe('scoreDecision - Determinism', () => {
  it('should be deterministic - same inputs produce same outputs', () => {
    const input = createBaseInput({
      chosenPosture: 'DEGRADE',
      expectedPosture: 'DEGRADE',
      chosenTreatment: 'MITIGATE',
      expectedTreatment: 'MITIGATE',
      ownerBriefed: true,
      residualRiskSelected: true,
    });

    const result1 = scoreDecision(input);
    const result2 = scoreDecision(input);

    expect(result1.totalPoints).toBe(result2.totalPoints);
    expect(result1.breakdown).toEqual(result2.breakdown);
    expect(result1.isCorrect).toBe(result2.isCorrect);
    expect(result1.newStreak).toBe(result2.newStreak);
  });

  it('should produce consistent results across multiple runs', () => {
    const input = createBaseInput();
    const results = Array.from({ length: 10 }, () => scoreDecision(input));
    const firstResult = results[0].totalPoints;
    expect(results.every((r) => r.totalPoints === firstResult)).toBe(true);
  });
});

describe('scoreDecision - Correct vs Wrong', () => {
  it('should give significantly more points for correct answer', () => {
    const correctInput = createBaseInput({
      chosenPosture: 'PAUSE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'AVOID',
      expectedTreatment: 'AVOID',
    });

    const wrongInput = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'ACCEPT',
      expectedTreatment: 'AVOID',
    });

    const correctResult = scoreDecision(correctInput);
    const wrongResult = scoreDecision(wrongInput);

    expect(correctResult.totalPoints).toBeGreaterThan(wrongResult.totalPoints);
    expect(correctResult.totalPoints).toBeGreaterThan(wrongResult.totalPoints * 2);
    expect(correctResult.isCorrect).toBe(true);
    expect(wrongResult.isCorrect).toBe(false);
  });

  it('should give zero points for timeout', () => {
    const timeoutInput = createBaseInput({
      wasTimeout: true,
      expectedPosture: 'PAUSE',
    });

    const result = scoreDecision(timeoutInput);
    expect(result.totalPoints).toBe(0);
    expect(result.breakdown.basePoints).toBe(0);
  });

  it('should give minimal points for skip', () => {
    const skipInput = createBaseInput({
      wasSkip: true,
      expectedPosture: 'PAUSE',
    });

    const result = scoreDecision(skipInput);
    expect(result.totalPoints).toBeLessThan(20);
    expect(result.breakdown.basePoints).toBe(SCORING_CONFIG.BASE_POINTS.SKIP);
  });

  it('should penalize wrong answer heavily even with ESRM bonuses', () => {
    const wrongWithBonuses = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'ACCEPT',
      expectedTreatment: 'AVOID',
      ownerBriefed: true,
      residualRiskSelected: true,
      treatmentCategorySelected: true,
      rationaleProvided: true,
    });

    const correctNoBonuses = createBaseInput({
      chosenPosture: 'PAUSE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'AVOID',
      expectedTreatment: 'AVOID',
      ownerBriefed: false,
      residualRiskSelected: false,
    });

    const wrongResult = scoreDecision(wrongWithBonuses);
    const correctResult = scoreDecision(correctNoBonuses);

    // Correct with no bonuses should still beat wrong with all bonuses
    expect(correctResult.totalPoints).toBeGreaterThan(wrongResult.totalPoints);
  });
});

describe('scoreDecision - Treatment Alignment', () => {
  it('should reward perfect treatment match', () => {
    const perfectMatch = createBaseInput({
      chosenPosture: 'PAUSE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'AVOID',
      expectedTreatment: 'AVOID',
      assetCriticality: 'CRITICAL',
    });

    const result = scoreDecision(perfectMatch);
    expect(result.breakdown.treatmentAlignmentMultiplier).toBe(
      SCORING_CONFIG.TREATMENT_ALIGNMENT.PERFECT
    );
  });

  it('should heavily penalize ACCEPT for CRITICAL asset when AVOID expected', () => {
    const terribleChoice = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'ACCEPT',
      expectedTreatment: 'AVOID',
      assetCriticality: 'CRITICAL',
    });

    const result = scoreDecision(terribleChoice);
    expect(result.breakdown.treatmentAlignmentMultiplier).toBeLessThanOrEqual(
      SCORING_CONFIG.TREATMENT_ALIGNMENT.TERRIBLE
    );
    expect(result.breakdown.penalties.acceptCritical).toBeLessThan(0);
  });

  it('should penalize Transfer theater on critical assets', () => {
    const transferTheater = createBaseInput({
      chosenPosture: 'DEGRADE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'TRANSFER',
      expectedTreatment: 'AVOID',
      assetCriticality: 'CRITICAL',
    });

    const result = scoreDecision(transferTheater);
    expect(result.breakdown.penalties.transferTheater).toBeLessThan(0);
  });
});

describe('scoreDecision - ESRM Bonuses', () => {
  it('should add bonus for owner briefing', () => {
    const withBriefing = createBaseInput({ ownerBriefed: true });
    const withoutBriefing = createBaseInput({ ownerBriefed: false });

    const withResult = scoreDecision(withBriefing);
    const withoutResult = scoreDecision(withoutBriefing);

    expect(withResult.breakdown.esrmBonuses.ownerBriefed).toBe(
      SCORING_CONFIG.ESRM_BONUSES.OWNER_BRIEFED
    );
    expect(withoutResult.breakdown.esrmBonuses.ownerBriefed).toBe(0);
    expect(withResult.totalPoints).toBeGreaterThan(withoutResult.totalPoints);
  });

  it('should add bonus for residual risk selection', () => {
    const withResidual = createBaseInput({ residualRiskSelected: true });
    const withoutResidual = createBaseInput({ residualRiskSelected: false });

    const withResult = scoreDecision(withResidual);
    const withoutResult = scoreDecision(withoutResidual);

    expect(withResult.breakdown.esrmBonuses.residualExplicit).toBe(
      SCORING_CONFIG.ESRM_BONUSES.RESIDUAL_EXPLICIT
    );
    expect(withResult.totalPoints).toBeGreaterThan(withoutResult.totalPoints);
  });

  it('should not give ESRM bonuses on timeout', () => {
    const timeoutWithBonuses = createBaseInput({
      wasTimeout: true,
      ownerBriefed: true,
      residualRiskSelected: true,
      treatmentCategorySelected: true,
    });

    const result = scoreDecision(timeoutWithBonuses);
    expect(result.breakdown.esrmBonuses.total).toBe(0);
  });
});

describe('scoreDecision - Time Bonus', () => {
  it('should give no time bonus for very fast decisions (< 5s)', () => {
    const tooFast = createBaseInput({ decisionTimeSeconds: 3 });
    const result = scoreDecision(tooFast);
    expect(result.breakdown.timeBonus).toBe(0);
    expect(result.breakdown.penalties.rapidFireSpam).toBeLessThan(0);
  });

  it('should give time bonus for optimal window decisions', () => {
    const optimal = createBaseInput({ decisionTimeSeconds: 25 });
    const result = scoreDecision(optimal);
    expect(result.breakdown.timeBonus).toBeGreaterThan(0);
  });

  it('should reduce time bonus for slow decisions', () => {
    const fast = createBaseInput({ decisionTimeSeconds: 20 });
    const slow = createBaseInput({ decisionTimeSeconds: 60 });

    const fastResult = scoreDecision(fast);
    const slowResult = scoreDecision(slow);

    expect(fastResult.breakdown.timeBonus).toBeGreaterThan(slowResult.breakdown.timeBonus);
  });
});

describe('scoreDecision - Streak Multiplier', () => {
  it('should increase multiplier with correct streak', () => {
    const streak0 = createBaseInput({ currentStreak: 0 });
    const streak5 = createBaseInput({ currentStreak: 5 });

    const result0 = scoreDecision(streak0);
    const result5 = scoreDecision(streak5);

    expect(result5.breakdown.streakMultiplier).toBeGreaterThan(result0.breakdown.streakMultiplier);
    expect(result5.totalPoints).toBeGreaterThan(result0.totalPoints);
  });

  it('should cap streak multiplier', () => {
    const hugeStreak = createBaseInput({ currentStreak: 100 });
    const result = scoreDecision(hugeStreak);
    expect(result.breakdown.streakMultiplier).toBeLessThanOrEqual(
      SCORING_CONFIG.STREAK.MAX_MULTIPLIER
    );
  });

  it('should reset streak on wrong answer', () => {
    const wrongWithStreak = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
      currentStreak: 5,
    });

    const result = scoreDecision(wrongWithStreak);
    expect(result.newStreak).toBe(0);
    expect(result.breakdown.streakMultiplier).toBe(1);
  });
});

describe('scoreDecision - Penalties', () => {
  it('should apply penalty for ignoring high-confidence intel', () => {
    const ignoredVerified = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
      injectConfidence: 'VERIFIED',
    });

    const result = scoreDecision(ignoredVerified);
    expect(result.breakdown.penalties.ignoredHighConfidence).toBeLessThan(0);
  });

  it('should apply penalty for resource contention', () => {
    const withContention = createBaseInput({
      resourceContentionOccurred: true,
    });

    const result = scoreDecision(withContention);
    expect(result.breakdown.penalties.resourceContention).toBeLessThan(0);
  });

  it('should not go negative total points', () => {
    const worstCase = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'ACCEPT',
      expectedTreatment: 'AVOID',
      assetCriticality: 'CRITICAL',
      injectConfidence: 'VERIFIED',
      resourceContentionOccurred: true,
      decisionTimeSeconds: 2,
    });

    const result = scoreDecision(worstCase);
    expect(result.totalPoints).toBeGreaterThanOrEqual(0);
  });
});

describe('scoreDecision - Difficulty Multiplier', () => {
  it('should scale points with difficulty', () => {
    const rookie = createBaseInput({ difficulty: 'ROOKIE' });
    const operator = createBaseInput({ difficulty: 'OPERATOR' });
    const director = createBaseInput({ difficulty: 'DIRECTOR' });

    const rookieResult = scoreDecision(rookie);
    const operatorResult = scoreDecision(operator);
    const directorResult = scoreDecision(director);

    expect(directorResult.totalPoints).toBeGreaterThan(operatorResult.totalPoints);
    expect(operatorResult.totalPoints).toBeGreaterThan(rookieResult.totalPoints);
  });
});

describe('scoreDecision - Feedback Messages', () => {
  it('should provide appropriate feedback for correct decisions', () => {
    const correct = createBaseInput({
      chosenPosture: 'PAUSE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'AVOID',
      expectedTreatment: 'AVOID',
    });

    const result = scoreDecision(correct);
    expect(result.feedback).toContain('Excellent');
    expect(result.detailedReason).toContain('Correct');
  });

  it('should provide appropriate feedback for wrong decisions', () => {
    const wrong = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
    });

    const result = scoreDecision(wrong);
    expect(result.feedback).not.toContain('Excellent');
    expect(result.detailedReason).toContain('Wrong');
  });

  it('should explain penalties in detailed reason', () => {
    const penalized = createBaseInput({
      chosenPosture: 'CONTINUE',
      expectedPosture: 'PAUSE',
      chosenTreatment: 'ACCEPT',
      expectedTreatment: 'AVOID',
      assetCriticality: 'CRITICAL',
      injectConfidence: 'VERIFIED',
    });

    const result = scoreDecision(penalized);
    expect(result.detailedReason).toContain('Penalties');
  });
});

describe('validateScoringFairness', () => {
  it('should confirm good play beats bad play for CRITICAL assets', () => {
    const result = validateScoringFairness('CRITICAL', 'PAUSE', 'OPERATOR');
    expect(result.isValid).toBe(true);
    expect(result.goodScore).toBeGreaterThan(result.badScore * 2);
    expect(result.ratio).toBeGreaterThan(2);
  });

  it('should confirm good play beats bad play for all difficulties', () => {
    const difficulties = ['ROOKIE', 'OPERATOR', 'DIRECTOR'] as const;
    for (const diff of difficulties) {
      const result = validateScoringFairness('HIGH', 'DEGRADE', diff);
      expect(result.isValid).toBe(true);
      expect(result.ratio).toBeGreaterThan(2);
    }
  });

  it('should confirm good play beats bad play for all criticalities', () => {
    const criticalities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
    for (const crit of criticalities) {
      const result = validateScoringFairness(crit, 'PAUSE', 'OPERATOR');
      expect(result.isValid).toBe(true);
    }
  });
});

describe('Scoring Invariants', () => {
  it('INVARIANT: correct answer always scores higher than wrong answer same context', () => {
    const contexts = [
      { posture: 'PAUSE' as const, treatment: 'AVOID' as const, crit: 'CRITICAL' as const },
      { posture: 'DEGRADE' as const, treatment: 'MITIGATE' as const, crit: 'HIGH' as const },
      { posture: 'CONTINUE' as const, treatment: 'ACCEPT' as const, crit: 'LOW' as const },
    ];

    for (const ctx of contexts) {
      const correct = scoreDecision(
        createBaseInput({
          chosenPosture: ctx.posture,
          expectedPosture: ctx.posture,
          chosenTreatment: ctx.treatment,
          expectedTreatment: ctx.treatment,
          assetCriticality: ctx.crit,
        })
      );

      const wrong = scoreDecision(
        createBaseInput({
          chosenPosture: ctx.posture === 'PAUSE' ? 'CONTINUE' : 'PAUSE',
          expectedPosture: ctx.posture,
          chosenTreatment: ctx.treatment === 'AVOID' ? 'ACCEPT' : 'AVOID',
          expectedTreatment: ctx.treatment,
          assetCriticality: ctx.crit,
        })
      );

      expect(correct.totalPoints).toBeGreaterThan(wrong.totalPoints);
    }
  });

  it('INVARIANT: timeout always scores 0', () => {
    const timeouts = [
      createBaseInput({ wasTimeout: true, expectedPosture: 'PAUSE' }),
      createBaseInput({ wasTimeout: true, expectedPosture: 'CONTINUE' }),
      createBaseInput({ wasTimeout: true, ownerBriefed: true, currentStreak: 10 }),
    ];

    for (const input of timeouts) {
      const result = scoreDecision(input);
      expect(result.totalPoints).toBe(0);
    }
  });

  it('INVARIANT: ESRM bonuses only apply to actual decisions', () => {
    const timeout = scoreDecision(
      createBaseInput({
        wasTimeout: true,
        ownerBriefed: true,
        residualRiskSelected: true,
      })
    );

    const skip = scoreDecision(
      createBaseInput({
        wasSkip: true,
        ownerBriefed: true,
        residualRiskSelected: true,
      })
    );

    expect(timeout.breakdown.esrmBonuses.total).toBe(0);
    expect(skip.breakdown.esrmBonuses.total).toBe(0);
  });
});
