/**
 * Arc Scheduler for Hourglass Command
 *
 * Manages the one-hour gameplay arc with:
 * - Seeded randomization for reproducible yet fresh runs
 * - Coherent causality (decisions cascade into consequences)
 * - Difficulty-based pacing adjustments
 * - Dense inject scheduling (no dead air)
 * - Allen/Loyear cycle faithfulness where applicable
 */

import { SeededRandom, createSessionSeed } from './seeded-rng.js';
import type { ScenarioInject, DecisionPosture, DecisionLog } from './types.js';

/**
 * Difficulty levels affecting arc pacing
 */
export type ArcDifficulty = 'ROOKIE' | 'OPERATOR' | 'DIRECTOR';

/**
 * Pacing configuration per difficulty
 */
export interface PacingConfig {
  minInjectGapSeconds: number;
  maxInjectGapSeconds: number;
  urgentInjectChance: number;
  noiseInjectChance: number;
  consequenceDelaySeconds: number;
  timerMultiplier: number;
}

/**
 * Difficulty-specific pacing configurations
 */
export const PACING_CONFIGS: Record<ArcDifficulty, PacingConfig> = {
  ROOKIE: {
    minInjectGapSeconds: 45,
    maxInjectGapSeconds: 90,
    urgentInjectChance: 0.2,
    noiseInjectChance: 0.15,
    consequenceDelaySeconds: 30,
    timerMultiplier: 1.5,
  },
  OPERATOR: {
    minInjectGapSeconds: 30,
    maxInjectGapSeconds: 60,
    urgentInjectChance: 0.35,
    noiseInjectChance: 0.25,
    consequenceDelaySeconds: 20,
    timerMultiplier: 1.0,
  },
  DIRECTOR: {
    minInjectGapSeconds: 15,
    maxInjectGapSeconds: 45,
    urgentInjectChance: 0.5,
    noiseInjectChance: 0.35,
    consequenceDelaySeconds: 10,
    timerMultiplier: 0.7,
  },
};

/**
 * Consequence type triggered by a decision
 */
export interface DecisionConsequence {
  triggerPosture: DecisionPosture;
  type: 'ESCALATE' | 'RIPPLE' | 'STAKEHOLDER' | 'RESOURCE' | 'INTEL';
  description: string;
  kriImpact?: { id: string; delta: number }[];
  trustImpact?: number;
  zoneHeatImpact?: { zone: string; delta: number }[];
  followUpInjectDelay?: number;
  followUpInjectId?: string;
}

/**
 * Scheduled inject with computed reveal time
 */
export interface ScheduledInject {
  inject: ScenarioInject;
  scheduledMinute: number;
  actualRevealSecond: number;
  isConsequence: boolean;
  triggeredBy?: string;
  priority: 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
}

/**
 * Arc state tracking decisions and consequences
 */
export interface ArcState {
  seed: number;
  difficulty: ArcDifficulty;
  elapsedSeconds: number;
  scheduledInjects: ScheduledInject[];
  revealedInjectIds: Set<string>;
  decisionsLog: {
    injectId: string;
    posture: DecisionPosture;
    timestamp: number;
  }[];
  consequenceQueue: {
    consequence: DecisionConsequence;
    triggerTime: number;
    sourceInjectId: string;
  }[];
  activeZoneHeat: Record<string, number>;
  currentTrust: number;
}

/**
 * Arc scheduler class for managing the one-hour gameplay arc
 */
export class ArcScheduler {
  private rng: SeededRandom;
  private state: ArcState;
  private pacingConfig: PacingConfig;

  constructor(
    seed?: number | string,
    difficulty: ArcDifficulty = 'OPERATOR',
    initialInjects: ScenarioInject[] = []
  ) {
    const numericSeed = createSessionSeed(seed);
    this.rng = new SeededRandom(numericSeed);
    this.pacingConfig = PACING_CONFIGS[difficulty];

    this.state = {
      seed: numericSeed,
      difficulty,
      elapsedSeconds: 0,
      scheduledInjects: [],
      revealedInjectIds: new Set(),
      decisionsLog: [],
      consequenceQueue: [],
      activeZoneHeat: {
        executive: 30,
        operations: 40,
        perimeter: 25,
        cyber: 35,
      },
      currentTrust: 75,
    };

    this.scheduleInitialInjects(initialInjects);
  }

  /**
   * Get the seed for this arc (for reproducibility)
   */
  getSeed(): number {
    return this.state.seed;
  }

  /**
   * Get current arc state (for persistence/debugging)
   */
  getState(): Readonly<ArcState> {
    return this.state;
  }

  /**
   * Schedule initial injects with randomized timing
   */
  private scheduleInitialInjects(injects: ScenarioInject[]): void {
    const shuffled = this.rng.shuffle([...injects]);

    const coreInjects = shuffled.filter(
      (i) => !(i as unknown as { intake?: { isNoise?: boolean } }).intake?.isNoise
    );
    const noiseInjects = shuffled.filter(
      (i) => (i as unknown as { intake?: { isNoise?: boolean } }).intake?.isNoise
    );

    let currentSecond = this.rng.int(5, 15);

    for (const inject of coreInjects) {
      const priority = this.determinePriority(inject);
      const jitter = this.rng.int(-10, 10);

      const originalMinute = inject.revealAtMinute;
      const baseSecond = originalMinute * 60;
      const adjustedSecond = Math.max(
        currentSecond,
        baseSecond + jitter
      );

      this.state.scheduledInjects.push({
        inject: { ...inject, revealAtMinute: adjustedSecond / 60 },
        scheduledMinute: adjustedSecond / 60,
        actualRevealSecond: adjustedSecond,
        isConsequence: false,
        priority,
      });

      const gap = this.rng.int(
        this.pacingConfig.minInjectGapSeconds,
        this.pacingConfig.maxInjectGapSeconds
      );
      currentSecond = adjustedSecond + gap;
    }

    this.interleavenNoiseInjects(noiseInjects);

    this.state.scheduledInjects.sort((a, b) => a.actualRevealSecond - b.actualRevealSecond);
  }

  /**
   * Interleave noise injects between core injects
   */
  private interleavenNoiseInjects(noiseInjects: ScenarioInject[]): void {
    if (noiseInjects.length === 0) return;

    const coreInjects = this.state.scheduledInjects.filter((s) => !s.isConsequence);
    if (coreInjects.length < 2) return;

    const noiseToPlace = this.rng.pickMultiple(
      noiseInjects,
      Math.min(noiseInjects.length, Math.floor(coreInjects.length * 0.3))
    );

    for (const noise of noiseToPlace) {
      if (!this.rng.chance(this.pacingConfig.noiseInjectChance)) continue;

      const insertIdx = this.rng.int(0, coreInjects.length - 2);
      const beforeTime = coreInjects[insertIdx].actualRevealSecond;
      const afterTime = coreInjects[insertIdx + 1].actualRevealSecond;

      const noiseTime = this.rng.int(
        Math.floor(beforeTime + 10),
        Math.floor(afterTime - 10)
      );

      if (noiseTime > beforeTime && noiseTime < afterTime) {
        this.state.scheduledInjects.push({
          inject: { ...noise, revealAtMinute: noiseTime / 60 },
          scheduledMinute: noiseTime / 60,
          actualRevealSecond: noiseTime,
          isConsequence: false,
          priority: 'ROUTINE',
        });
      }
    }
  }

  /**
   * Determine priority based on inject properties
   */
  private determinePriority(inject: ScenarioInject): 'IMMEDIATE' | 'URGENT' | 'ROUTINE' {
    const triagePriority = (inject as unknown as { triagePriority?: string }).triagePriority;
    if (triagePriority) {
      return triagePriority as 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
    }

    const urgencyLevel = (inject as unknown as { urgencyLevel?: string }).urgencyLevel;
    if (urgencyLevel === 'IMMEDIATE') return 'IMMEDIATE';
    if (urgencyLevel === 'URGENT') return 'URGENT';
    return 'ROUTINE';
  }

  /**
   * Update arc state with elapsed time
   */
  tick(elapsedSeconds: number): ScheduledInject[] {
    const prevSeconds = this.state.elapsedSeconds;
    this.state.elapsedSeconds = elapsedSeconds;

    const newlyRevealed: ScheduledInject[] = [];

    for (const scheduled of this.state.scheduledInjects) {
      if (
        scheduled.actualRevealSecond > prevSeconds &&
        scheduled.actualRevealSecond <= elapsedSeconds &&
        !this.state.revealedInjectIds.has(scheduled.inject.id)
      ) {
        this.state.revealedInjectIds.add(scheduled.inject.id);
        newlyRevealed.push(scheduled);
      }
    }

    this.processConsequenceQueue(elapsedSeconds);

    return newlyRevealed;
  }

  /**
   * Process pending consequences
   */
  private processConsequenceQueue(currentTime: number): void {
    const triggeredConsequences = this.state.consequenceQueue.filter(
      (c) => c.triggerTime <= currentTime
    );

    for (const triggered of triggeredConsequences) {
      this.applyConsequence(triggered.consequence, triggered.sourceInjectId);
    }

    this.state.consequenceQueue = this.state.consequenceQueue.filter(
      (c) => c.triggerTime > currentTime
    );
  }

  /**
   * Apply a consequence to arc state
   */
  private applyConsequence(consequence: DecisionConsequence, _sourceInjectId: string): void {
    if (consequence.trustImpact) {
      this.state.currentTrust = Math.max(
        0,
        Math.min(100, this.state.currentTrust + consequence.trustImpact)
      );
    }

    if (consequence.zoneHeatImpact) {
      for (const { zone, delta } of consequence.zoneHeatImpact) {
        if (this.state.activeZoneHeat[zone] !== undefined) {
          this.state.activeZoneHeat[zone] = Math.max(
            0,
            Math.min(100, this.state.activeZoneHeat[zone] + delta)
          );
        }
      }
    }
  }

  /**
   * Record a decision and compute consequences
   */
  recordDecision(
    injectId: string,
    posture: DecisionPosture,
    inject: ScenarioInject
  ): DecisionConsequence[] {
    this.state.decisionsLog.push({
      injectId,
      posture,
      timestamp: this.state.elapsedSeconds,
    });

    const consequences = this.computeConsequences(inject, posture);

    for (const consequence of consequences) {
      const triggerTime =
        this.state.elapsedSeconds +
        (consequence.followUpInjectDelay || this.pacingConfig.consequenceDelaySeconds);

      this.state.consequenceQueue.push({
        consequence,
        triggerTime,
        sourceInjectId: injectId,
      });
    }

    return consequences;
  }

  /**
   * Compute consequences based on decision posture
   */
  private computeConsequences(
    inject: ScenarioInject,
    posture: DecisionPosture
  ): DecisionConsequence[] {
    const consequences: DecisionConsequence[] = [];
    const expectedPosture = (inject as unknown as { expectedPostureImpact?: DecisionPosture })
      .expectedPostureImpact;

    const isCorrect = !expectedPosture || posture === expectedPosture;

    if (posture === 'PAUSE') {
      consequences.push({
        triggerPosture: 'PAUSE',
        type: 'ESCALATE',
        description: 'Operational halt triggers executive attention',
        trustImpact: isCorrect ? 5 : -10,
        kriImpact: [
          { id: 'response-time', delta: isCorrect ? -5 : 15 },
        ],
        zoneHeatImpact: [
          { zone: 'operations', delta: isCorrect ? -15 : 20 },
        ],
      });
    } else if (posture === 'DEGRADE') {
      consequences.push({
        triggerPosture: 'DEGRADE',
        type: 'RIPPLE',
        description: 'Reduced operations affect adjacent systems',
        trustImpact: isCorrect ? 3 : -5,
        kriImpact: [
          { id: 'coverage', delta: isCorrect ? -3 : 10 },
        ],
        zoneHeatImpact: [
          { zone: 'operations', delta: isCorrect ? -5 : 10 },
        ],
      });
    } else {
      consequences.push({
        triggerPosture: 'CONTINUE',
        type: 'STAKEHOLDER',
        description: 'Business continuity maintained',
        trustImpact: isCorrect ? 2 : -15,
        kriImpact: [
          { id: 'availability', delta: isCorrect ? -2 : 20 },
        ],
        zoneHeatImpact: [
          { zone: 'operations', delta: isCorrect ? 0 : 25 },
        ],
      });
    }

    if (!isCorrect && this.rng.chance(0.4)) {
      consequences.push({
        triggerPosture: posture,
        type: 'INTEL',
        description: 'Incorrect assessment leads to delayed intelligence',
        trustImpact: -3,
        followUpInjectDelay: this.rng.int(20, 40),
      });
    }

    return consequences;
  }

  /**
   * Get injects that should be revealed by current time
   */
  getRevealableInjects(currentSeconds: number): ScheduledInject[] {
    return this.state.scheduledInjects.filter(
      (s) =>
        s.actualRevealSecond <= currentSeconds &&
        !this.state.revealedInjectIds.has(s.inject.id)
    );
  }

  /**
   * Get upcoming injects (for pacing preview)
   */
  getUpcomingInjects(currentSeconds: number, windowSeconds: number = 120): ScheduledInject[] {
    return this.state.scheduledInjects.filter(
      (s) =>
        s.actualRevealSecond > currentSeconds &&
        s.actualRevealSecond <= currentSeconds + windowSeconds &&
        !this.state.revealedInjectIds.has(s.inject.id)
    );
  }

  /**
   * Get current zone heat levels
   */
  getZoneHeat(): Record<string, number> {
    return { ...this.state.activeZoneHeat };
  }

  /**
   * Get current trust level
   */
  getTrustLevel(): number {
    return this.state.currentTrust;
  }

  /**
   * Check if there are pending consequences
   */
  hasPendingConsequences(): boolean {
    return this.state.consequenceQueue.length > 0;
  }

  /**
   * Get pending consequence count
   */
  getPendingConsequenceCount(): number {
    return this.state.consequenceQueue.length;
  }

  /**
   * Export arc state for persistence
   */
  exportState(): string {
    return JSON.stringify({
      ...this.state,
      revealedInjectIds: Array.from(this.state.revealedInjectIds),
    });
  }

  /**
   * Import arc state from persistence
   */
  static importState(serialized: string, difficulty: ArcDifficulty): ArcScheduler {
    const data = JSON.parse(serialized);
    const scheduler = new ArcScheduler(data.seed, difficulty, []);

    scheduler.state = {
      ...data,
      revealedInjectIds: new Set(data.revealedInjectIds),
    };

    return scheduler;
  }
}

/**
 * Create an arc scheduler from a decision log
 */
export function createArcFromLog(
  log: DecisionLog,
  seed?: number | string,
  difficulty: ArcDifficulty = 'OPERATOR'
): ArcScheduler {
  return new ArcScheduler(seed, difficulty, log.injects);
}

/**
 * Generate a shareable seed code (for reproducible runs)
 */
export function generateSeedCode(seed: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let value = seed;
  for (let i = 0; i < 6; i++) {
    code += chars[value % chars.length];
    value = Math.floor(value / chars.length);
  }
  return code;
}

/**
 * Parse a seed code back to numeric seed
 */
export function parseSeedCode(code: string): number {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = 0;
  let multiplier = 1;
  for (const char of code.toUpperCase()) {
    const idx = chars.indexOf(char);
    if (idx >= 0) {
      value += idx * multiplier;
      multiplier *= chars.length;
    }
  }
  return value || 1;
}
