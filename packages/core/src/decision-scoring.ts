/**
 * ESRM Decision Scoring Engine
 *
 * Mathematically sound scoring that rewards good GSOC decisions
 * and clearly penalizes poor ones. Aligned with ESRM value rigor.
 *
 * Core principle: Wrong decisions must NOT receive high points.
 * A bad play should score significantly less than a good play.
 */

import type { DecisionPosture } from './types.js';
import type { RiskTreatmentOption, AssetCriticality } from './esrm.js';

/**
 * Scoring configuration - all values documented for transparency.
 * These are the building blocks of the scoring formula.
 */
export const SCORING_CONFIG = {
  /**
   * Base points by decision correctness.
   * Correct = full base, Wrong = heavy penalty, Timeout = worst.
   */
  BASE_POINTS: {
    CORRECT: 100, // Full base for correct posture
    WRONG: 15, // Minimal points - wrong answer documented but penalized
    TIMEOUT: 0, // No points for timeout - failure to decide
    SKIP: 5, // Tiny points for explicit skip (at least acknowledged)
  } as const,

  /**
   * Treatment alignment multipliers.
   * How well did the chosen treatment match the situation?
   * Applied to base points.
   */
  TREATMENT_ALIGNMENT: {
    PERFECT: 1.5, // Exact treatment match (e.g., AVOID for CRITICAL)
    GOOD: 1.2, // Reasonable treatment (e.g., MITIGATE for HIGH)
    ACCEPTABLE: 1.0, // Not ideal but defensible
    POOR: 0.5, // Wrong treatment direction
    TERRIBLE: 0.2, // Dangerous mismatch (e.g., ACCEPT for CRITICAL)
  } as const,

  /**
   * ESRM documentation bonuses.
   * Rewards proper governance and audit trail.
   */
  ESRM_BONUSES: {
    OWNER_BRIEFED: 30, // Asset owner was briefed per ESRM
    RESIDUAL_EXPLICIT: 25, // Residual risk explicitly selected
    TREATMENT_SELECTED: 15, // Treatment category explicitly chosen
    RATIONALE_PROVIDED: 10, // Decision rationale documented
  } as const,

  /**
   * Time-based scoring.
   * Rewards timely decisions, penalizes reckless speed or dawdling.
   */
  TIME_SCORING: {
    OPTIMAL_WINDOW_START: 15, // Don't reward decisions faster than 15s (reckless)
    OPTIMAL_WINDOW_END: 45, // Ideal decision window ends at 45s
    MAX_BONUS: 40, // Maximum time bonus points
    PENALTY_PER_SECOND_OVER: 1, // Points lost per second over optimal
  } as const,

  /**
   * Streak multipliers - capped to prevent inflation.
   */
  STREAK: {
    MULTIPLIER_PER_CORRECT: 0.08, // 8% bonus per streak
    MAX_MULTIPLIER: 1.5, // Cap at 1.5x (was 2.5x - too inflating)
    BREAK_ON_WRONG: true, // Streak resets on wrong answer
  } as const,

  /**
   * Penalty factors for bad behaviors.
   */
  PENALTIES: {
    ACCEPT_WHEN_CRITICAL: -50, // Accepting critical risk without mitigation
    TRANSFER_THEATER: -30, // Using Transfer inappropriately
    IGNORED_HIGH_CONFIDENCE: -40, // Ignoring verified high-priority inject
    RESOURCE_CONTENTION: -20, // Proceeding despite resource shortage
    RAPID_FIRE_SPAM: -25, // Decisions faster than 5s (not reading)
  } as const,

  /**
   * Difficulty multipliers (applied after all other calculations).
   */
  DIFFICULTY: {
    ROOKIE: 0.8, // Easier = less points
    OPERATOR: 1.0, // Standard
    DIRECTOR: 1.3, // Harder = more points
  } as const,
} as const;

/**
 * Input parameters for scoring a decision.
 */
export interface DecisionScoringInput {
  // Core decision
  chosenPosture: DecisionPosture;
  expectedPosture: DecisionPosture | null;
  chosenTreatment: RiskTreatmentOption | null;
  expectedTreatment: RiskTreatmentOption | null;

  // Asset context
  assetCriticality: AssetCriticality;

  // ESRM governance
  ownerBriefed: boolean;
  residualRiskSelected: boolean;
  treatmentCategorySelected: boolean;
  rationaleProvided: boolean;

  // Timing
  decisionTimeSeconds: number;
  timerLimitSeconds: number;
  wasTimeout: boolean;
  wasSkip: boolean;

  // Context
  injectConfidence: 'VERIFIED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';
  resourceContentionOccurred: boolean;
  currentStreak: number;

  // Difficulty
  difficulty: 'ROOKIE' | 'OPERATOR' | 'DIRECTOR';
}

/**
 * Detailed scoring result with breakdown.
 */
export interface DecisionScoringResult {
  totalPoints: number;
  breakdown: {
    basePoints: number;
    treatmentAlignmentMultiplier: number;
    esrmBonuses: {
      ownerBriefed: number;
      residualExplicit: number;
      treatmentSelected: number;
      rationaleProvided: number;
      total: number;
    };
    timeBonus: number;
    penalties: {
      acceptCritical: number;
      transferTheater: number;
      ignoredHighConfidence: number;
      resourceContention: number;
      rapidFireSpam: number;
      total: number;
    };
    streakMultiplier: number;
    difficultyMultiplier: number;
  };
  isCorrect: boolean;
  newStreak: number;
  feedback: string;
  detailedReason: string;
}

/**
 * Determine treatment alignment quality.
 */
function getTreatmentAlignment(
  chosen: RiskTreatmentOption | null,
  expected: RiskTreatmentOption | null,
  assetCriticality: AssetCriticality,
  chosenPosture: DecisionPosture,
  expectedPosture: DecisionPosture | null
): keyof typeof SCORING_CONFIG.TREATMENT_ALIGNMENT {
  // No expected treatment - use posture correctness
  if (!expected) {
    if (!expectedPosture) return 'ACCEPTABLE';
    return chosenPosture === expectedPosture ? 'GOOD' : 'POOR';
  }

  // Exact match
  if (chosen === expected) return 'PERFECT';

  // Check for dangerous mismatches
  if (assetCriticality === 'CRITICAL') {
    if (chosen === 'ACCEPT') return 'TERRIBLE'; // Never accept critical risk
  }

  // Accept when should mitigate/avoid
  if ((expected === 'AVOID' || expected === 'MITIGATE') && chosen === 'ACCEPT') {
    return 'POOR';
  }

  // Mitigate when should avoid (less severe)
  if (expected === 'AVOID' && chosen === 'MITIGATE') {
    return 'ACCEPTABLE';
  }

  // Transfer when inappropriate (theater)
  if (chosen === 'TRANSFER' && expected !== 'TRANSFER') {
    if (assetCriticality === 'CRITICAL' || assetCriticality === 'HIGH') {
      return 'POOR'; // Can't just transfer critical/high risk
    }
    return 'ACCEPTABLE';
  }

  // Over-responding (avoid when accept was fine)
  if (expected === 'ACCEPT' && chosen === 'AVOID') {
    return 'ACCEPTABLE'; // Cautious, not wrong
  }

  return 'ACCEPTABLE';
}

/**
 * Calculate time-based bonus.
 * Rewards thoughtful decisions in optimal window.
 * Penalizes both reckless speed and excessive delay.
 */
function calculateTimeBonus(decisionTimeSeconds: number, _timerLimitSeconds: number): number {
  const { OPTIMAL_WINDOW_START, OPTIMAL_WINDOW_END, MAX_BONUS, PENALTY_PER_SECOND_OVER } =
    SCORING_CONFIG.TIME_SCORING;

  // Too fast = reckless (didn't read/think)
  if (decisionTimeSeconds < OPTIMAL_WINDOW_START) {
    return 0; // No bonus for snap decisions
  }

  // Optimal window
  if (decisionTimeSeconds <= OPTIMAL_WINDOW_END) {
    // Linear bonus within optimal window
    const windowProgress =
      (decisionTimeSeconds - OPTIMAL_WINDOW_START) / (OPTIMAL_WINDOW_END - OPTIMAL_WINDOW_START);
    return Math.round(MAX_BONUS * (1 - windowProgress * 0.3)); // 70-100% of max in optimal
  }

  // Beyond optimal - gradual penalty
  const secondsOver = decisionTimeSeconds - OPTIMAL_WINDOW_END;
  const penalty = secondsOver * PENALTY_PER_SECOND_OVER;
  return Math.max(0, MAX_BONUS * 0.5 - penalty); // Start at 50% max, decrease
}

/**
 * Calculate penalties for bad behaviors.
 */
function calculatePenalties(
  input: DecisionScoringInput
): DecisionScoringResult['breakdown']['penalties'] {
  const penalties = {
    acceptCritical: 0,
    transferTheater: 0,
    ignoredHighConfidence: 0,
    resourceContention: 0,
    rapidFireSpam: 0,
    total: 0,
  };

  // Accept critical risk without proper treatment
  if (
    input.assetCriticality === 'CRITICAL' &&
    input.chosenTreatment === 'ACCEPT' &&
    input.expectedTreatment !== 'ACCEPT'
  ) {
    penalties.acceptCritical = SCORING_CONFIG.PENALTIES.ACCEPT_WHEN_CRITICAL;
  }

  // Transfer theater - using transfer inappropriately
  if (
    input.chosenTreatment === 'TRANSFER' &&
    input.expectedTreatment !== 'TRANSFER' &&
    (input.assetCriticality === 'CRITICAL' || input.assetCriticality === 'HIGH')
  ) {
    penalties.transferTheater = SCORING_CONFIG.PENALTIES.TRANSFER_THEATER;
  }

  // Ignored high-confidence inject with wrong answer
  if (
    (input.injectConfidence === 'VERIFIED' || input.injectConfidence === 'HIGH') &&
    input.expectedPosture &&
    input.chosenPosture !== input.expectedPosture
  ) {
    penalties.ignoredHighConfidence = SCORING_CONFIG.PENALTIES.IGNORED_HIGH_CONFIDENCE;
  }

  // Resource contention
  if (input.resourceContentionOccurred) {
    penalties.resourceContention = SCORING_CONFIG.PENALTIES.RESOURCE_CONTENTION;
  }

  // Rapid-fire spam (less than 5 seconds)
  if (input.decisionTimeSeconds < 5 && !input.wasTimeout && !input.wasSkip) {
    penalties.rapidFireSpam = SCORING_CONFIG.PENALTIES.RAPID_FIRE_SPAM;
  }

  penalties.total =
    penalties.acceptCritical +
    penalties.transferTheater +
    penalties.ignoredHighConfidence +
    penalties.resourceContention +
    penalties.rapidFireSpam;

  return penalties;
}

/**
 * Main scoring function.
 * Calculates points for a decision with full breakdown.
 *
 * @param input - All decision context
 * @returns Detailed scoring result
 */
export function scoreDecision(input: DecisionScoringInput): DecisionScoringResult {
  // Determine base points
  let basePoints: number;
  let isCorrect = false;

  if (input.wasTimeout) {
    basePoints = SCORING_CONFIG.BASE_POINTS.TIMEOUT;
  } else if (input.wasSkip) {
    basePoints = SCORING_CONFIG.BASE_POINTS.SKIP;
  } else if (input.expectedPosture && input.chosenPosture === input.expectedPosture) {
    basePoints = SCORING_CONFIG.BASE_POINTS.CORRECT;
    isCorrect = true;
  } else if (input.expectedPosture) {
    basePoints = SCORING_CONFIG.BASE_POINTS.WRONG;
  } else {
    // No expected posture - give moderate points for documented decision
    basePoints = SCORING_CONFIG.BASE_POINTS.CORRECT * 0.6;
    isCorrect = true; // No wrong answer if no expected
  }

  // Treatment alignment multiplier
  const alignmentKey = getTreatmentAlignment(
    input.chosenTreatment,
    input.expectedTreatment,
    input.assetCriticality,
    input.chosenPosture,
    input.expectedPosture
  );
  const treatmentAlignmentMultiplier = SCORING_CONFIG.TREATMENT_ALIGNMENT[alignmentKey];

  // ESRM bonuses (only apply if decision was made, not timeout/skip)
  const esrmBonuses = {
    ownerBriefed:
      !input.wasTimeout && !input.wasSkip && input.ownerBriefed
        ? SCORING_CONFIG.ESRM_BONUSES.OWNER_BRIEFED
        : 0,
    residualExplicit:
      !input.wasTimeout && !input.wasSkip && input.residualRiskSelected
        ? SCORING_CONFIG.ESRM_BONUSES.RESIDUAL_EXPLICIT
        : 0,
    treatmentSelected:
      !input.wasTimeout && !input.wasSkip && input.treatmentCategorySelected
        ? SCORING_CONFIG.ESRM_BONUSES.TREATMENT_SELECTED
        : 0,
    rationaleProvided:
      !input.wasTimeout && !input.wasSkip && input.rationaleProvided
        ? SCORING_CONFIG.ESRM_BONUSES.RATIONALE_PROVIDED
        : 0,
    total: 0,
  };
  esrmBonuses.total =
    esrmBonuses.ownerBriefed +
    esrmBonuses.residualExplicit +
    esrmBonuses.treatmentSelected +
    esrmBonuses.rationaleProvided;

  // Time bonus
  const timeBonus =
    input.wasTimeout || input.wasSkip
      ? 0
      : calculateTimeBonus(input.decisionTimeSeconds, input.timerLimitSeconds);

  // Penalties
  const penalties = calculatePenalties(input);

  // Streak multiplier (only on correct answers)
  const newStreak = isCorrect ? input.currentStreak + 1 : 0;
  const streakMultiplier = isCorrect
    ? Math.min(
        1 + newStreak * SCORING_CONFIG.STREAK.MULTIPLIER_PER_CORRECT,
        SCORING_CONFIG.STREAK.MAX_MULTIPLIER
      )
    : 1;

  // Difficulty multiplier
  const difficultyMultiplier = SCORING_CONFIG.DIFFICULTY[input.difficulty];

  // Calculate total
  // Formula: ((base × treatment) + esrm + time + penalties) × streak × difficulty
  const preStreakPoints =
    basePoints * treatmentAlignmentMultiplier + esrmBonuses.total + timeBonus + penalties.total;
  const totalPoints = Math.max(
    0,
    Math.round(preStreakPoints * streakMultiplier * difficultyMultiplier)
  );

  // Generate feedback
  let feedback: string;
  let detailedReason: string;

  if (input.wasTimeout) {
    feedback = 'Timeout - no decision made';
    detailedReason = 'Decision timer expired. No points awarded for undecided situations.';
  } else if (input.wasSkip) {
    feedback = 'Skipped';
    detailedReason = 'Decision explicitly skipped. Minimal points for acknowledgment.';
  } else if (isCorrect) {
    if (treatmentAlignmentMultiplier >= 1.5) {
      feedback = 'Excellent - perfect treatment match!';
      detailedReason = `Correct posture (${input.chosenPosture}) with optimal treatment alignment.`;
    } else if (treatmentAlignmentMultiplier >= 1.2) {
      feedback = 'Good call!';
      detailedReason = `Correct posture (${input.chosenPosture}) with appropriate treatment.`;
    } else {
      feedback = 'Correct';
      detailedReason = `Correct posture (${input.chosenPosture}). Treatment could be refined.`;
    }
  } else {
    if (treatmentAlignmentMultiplier <= 0.2) {
      feedback = 'Critical error';
      detailedReason = `Wrong posture (${input.chosenPosture}, expected ${input.expectedPosture}). Dangerous treatment mismatch.`;
    } else if (treatmentAlignmentMultiplier <= 0.5) {
      feedback = 'Poor decision';
      detailedReason = `Wrong posture (${input.chosenPosture}, expected ${input.expectedPosture}). Treatment does not address the risk.`;
    } else {
      feedback = 'Suboptimal';
      detailedReason = `Wrong posture (${input.chosenPosture}, expected ${input.expectedPosture}). Decision documented but not ideal.`;
    }
  }

  // Add penalty explanations
  if (penalties.total < 0) {
    const penaltyReasons: string[] = [];
    if (penalties.acceptCritical < 0) penaltyReasons.push('accepting critical risk');
    if (penalties.transferTheater < 0) penaltyReasons.push('inappropriate transfer');
    if (penalties.ignoredHighConfidence < 0) penaltyReasons.push('ignoring verified intel');
    if (penalties.resourceContention < 0) penaltyReasons.push('resource contention');
    if (penalties.rapidFireSpam < 0) penaltyReasons.push('too fast (not reading)');
    detailedReason += ` Penalties applied: ${penaltyReasons.join(', ')}.`;
  }

  return {
    totalPoints,
    breakdown: {
      basePoints,
      treatmentAlignmentMultiplier,
      esrmBonuses,
      timeBonus,
      penalties,
      streakMultiplier,
      difficultyMultiplier,
    },
    isCorrect,
    newStreak,
    feedback,
    detailedReason,
  };
}

/**
 * Format scoring breakdown for display.
 */
export function formatScoringBreakdown(result: DecisionScoringResult): string {
  const b = result.breakdown;
  const lines: string[] = [
    `📊 Score Breakdown: ${result.totalPoints} pts`,
    `────────────────────────────`,
    `Base: ${b.basePoints} × ${b.treatmentAlignmentMultiplier.toFixed(1)} (treatment) = ${Math.round(b.basePoints * b.treatmentAlignmentMultiplier)}`,
  ];

  if (b.esrmBonuses.total > 0) {
    const bonusParts: string[] = [];
    if (b.esrmBonuses.ownerBriefed > 0) bonusParts.push(`owner +${b.esrmBonuses.ownerBriefed}`);
    if (b.esrmBonuses.residualExplicit > 0)
      bonusParts.push(`residual +${b.esrmBonuses.residualExplicit}`);
    if (b.esrmBonuses.treatmentSelected > 0)
      bonusParts.push(`treatment +${b.esrmBonuses.treatmentSelected}`);
    lines.push(`ESRM: +${b.esrmBonuses.total} (${bonusParts.join(', ')})`);
  }

  if (b.timeBonus > 0) {
    lines.push(`Time: +${b.timeBonus}`);
  }

  if (b.penalties.total < 0) {
    lines.push(`Penalties: ${b.penalties.total}`);
  }

  if (b.streakMultiplier > 1) {
    lines.push(`Streak: ×${b.streakMultiplier.toFixed(2)}`);
  }

  if (b.difficultyMultiplier !== 1) {
    lines.push(`Difficulty: ×${b.difficultyMultiplier}`);
  }

  lines.push(`────────────────────────────`);
  lines.push(`${result.feedback}`);

  return lines.join('\n');
}

/**
 * Validate that scoring is mathematically sound.
 * Returns true if bad play < good play for same context.
 */
export function validateScoringFairness(
  assetCriticality: AssetCriticality,
  expectedPosture: DecisionPosture,
  difficulty: 'ROOKIE' | 'OPERATOR' | 'DIRECTOR'
): { isValid: boolean; goodScore: number; badScore: number; ratio: number } {
  const baseInput: Omit<DecisionScoringInput, 'chosenPosture' | 'chosenTreatment'> = {
    expectedPosture,
    expectedTreatment:
      expectedPosture === 'PAUSE' ? 'AVOID' : expectedPosture === 'DEGRADE' ? 'MITIGATE' : 'ACCEPT',
    assetCriticality,
    ownerBriefed: true,
    residualRiskSelected: true,
    treatmentCategorySelected: true,
    rationaleProvided: true,
    decisionTimeSeconds: 30,
    timerLimitSeconds: 75,
    wasTimeout: false,
    wasSkip: false,
    injectConfidence: 'HIGH',
    resourceContentionOccurred: false,
    currentStreak: 0,
    difficulty,
  };

  // Good play: correct posture and treatment
  const goodResult = scoreDecision({
    ...baseInput,
    chosenPosture: expectedPosture,
    chosenTreatment: baseInput.expectedTreatment,
  });

  // Bad play: wrong posture (opposite direction)
  const badPosture: DecisionPosture = expectedPosture === 'PAUSE' ? 'CONTINUE' : 'PAUSE';
  const badTreatment: RiskTreatmentOption = expectedPosture === 'PAUSE' ? 'ACCEPT' : 'AVOID';
  const badResult = scoreDecision({
    ...baseInput,
    chosenPosture: badPosture,
    chosenTreatment: badTreatment,
  });

  const ratio = goodResult.totalPoints / Math.max(1, badResult.totalPoints);

  return {
    isValid: goodResult.totalPoints > badResult.totalPoints * 2, // Good should be at least 2x bad
    goodScore: goodResult.totalPoints,
    badScore: badResult.totalPoints,
    ratio,
  };
}
