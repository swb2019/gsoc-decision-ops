import { describe, it, expect } from 'vitest';
import {
  ArcScheduler,
  createArcFromLog,
  generateSeedCode,
  parseSeedCode,
  PACING_CONFIGS,
} from '../arc-scheduler.js';
import { createDecisionLog } from '../decision-log.js';
import type { ScenarioInject } from '../types.js';

function createTestInjects(): ScenarioInject[] {
  return [
    {
      id: 'INJ-001',
      sequenceNumber: 1,
      revealAtMinute: 0.25,
      title: 'Initial Alert',
      content: 'Test inject 1',
      source: 'Test Source',
      decisionPressure: 'Test pressure',
      revealed: false,
    },
    {
      id: 'INJ-002',
      sequenceNumber: 2,
      revealAtMinute: 1,
      title: 'Follow-up',
      content: 'Test inject 2',
      source: 'Test Source',
      decisionPressure: 'Test pressure',
      revealed: false,
    },
    {
      id: 'INJ-003',
      sequenceNumber: 3,
      revealAtMinute: 3,
      title: 'Escalation',
      content: 'Test inject 3',
      source: 'Test Source',
      decisionPressure: 'Test pressure',
      revealed: false,
    },
  ];
}

describe('ArcScheduler', () => {
  describe('constructor', () => {
    it('creates scheduler with numeric seed', () => {
      const scheduler = new ArcScheduler(12345, 'OPERATOR', createTestInjects());
      expect(scheduler.getSeed()).toBe(12345);
    });

    it('creates scheduler with string seed', () => {
      const scheduler = new ArcScheduler('my-session', 'OPERATOR', createTestInjects());
      expect(scheduler.getSeed()).toBeGreaterThan(0);
    });

    it('uses OPERATOR difficulty by default', () => {
      const scheduler = new ArcScheduler(42, undefined, createTestInjects());
      const state = scheduler.getState();
      expect(state.difficulty).toBe('OPERATOR');
    });

    it('schedules injects with randomized timing', () => {
      const scheduler = new ArcScheduler(999, 'OPERATOR', createTestInjects());
      const state = scheduler.getState();

      expect(state.scheduledInjects.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getSeed', () => {
    it('returns the seed used for initialization', () => {
      const scheduler = new ArcScheduler(54321, 'OPERATOR', []);
      expect(scheduler.getSeed()).toBe(54321);
    });
  });

  describe('tick', () => {
    it('reveals injects when time reaches their scheduled time', () => {
      const scheduler = new ArcScheduler(123, 'ROOKIE', createTestInjects());
      const state = scheduler.getState();

      const firstInject = state.scheduledInjects[0];
      const revealed = scheduler.tick(firstInject.actualRevealSecond + 1);

      expect(revealed.length).toBeGreaterThanOrEqual(1);
    });

    it('does not reveal same inject twice', () => {
      const scheduler = new ArcScheduler(123, 'ROOKIE', createTestInjects());
      const state = scheduler.getState();

      const firstInject = state.scheduledInjects[0];
      scheduler.tick(firstInject.actualRevealSecond + 1);
      const secondReveal = scheduler.tick(firstInject.actualRevealSecond + 2);

      const alreadyRevealed = secondReveal.find(
        (r) => r.inject.id === firstInject.inject.id
      );
      expect(alreadyRevealed).toBeUndefined();
    });
  });

  describe('recordDecision', () => {
    it('adds decision to log', () => {
      const injects = createTestInjects();
      const scheduler = new ArcScheduler(456, 'OPERATOR', injects);

      scheduler.recordDecision('INJ-001', 'PAUSE', injects[0]);

      const state = scheduler.getState();
      expect(state.decisionsLog.length).toBe(1);
      expect(state.decisionsLog[0].injectId).toBe('INJ-001');
      expect(state.decisionsLog[0].posture).toBe('PAUSE');
    });

    it('returns consequences', () => {
      const injects = createTestInjects();
      const scheduler = new ArcScheduler(789, 'OPERATOR', injects);

      const consequences = scheduler.recordDecision('INJ-001', 'PAUSE', injects[0]);

      expect(consequences.length).toBeGreaterThan(0);
      expect(consequences[0].triggerPosture).toBe('PAUSE');
    });

    it('queues consequences for processing', () => {
      const injects = createTestInjects();
      const scheduler = new ArcScheduler(111, 'OPERATOR', injects);

      scheduler.recordDecision('INJ-001', 'CONTINUE', injects[0]);

      expect(scheduler.hasPendingConsequences()).toBe(true);
    });
  });

  describe('getZoneHeat', () => {
    it('returns initial zone heat levels', () => {
      const scheduler = new ArcScheduler(222, 'OPERATOR', []);
      const heat = scheduler.getZoneHeat();

      expect(heat.executive).toBe(30);
      expect(heat.operations).toBe(40);
      expect(heat.perimeter).toBe(25);
      expect(heat.cyber).toBe(35);
    });
  });

  describe('getTrustLevel', () => {
    it('returns initial trust level', () => {
      const scheduler = new ArcScheduler(333, 'OPERATOR', []);
      expect(scheduler.getTrustLevel()).toBe(75);
    });
  });

  describe('getRevealableInjects', () => {
    it('returns injects scheduled before current time', () => {
      const scheduler = new ArcScheduler(444, 'ROOKIE', createTestInjects());
      const state = scheduler.getState();

      const lastInjectTime =
        state.scheduledInjects[state.scheduledInjects.length - 1].actualRevealSecond;
      const revealable = scheduler.getRevealableInjects(lastInjectTime + 100);

      expect(revealable.length).toBe(state.scheduledInjects.length);
    });
  });

  describe('getUpcomingInjects', () => {
    it('returns injects scheduled within window', () => {
      const scheduler = new ArcScheduler(555, 'ROOKIE', createTestInjects());

      const upcoming = scheduler.getUpcomingInjects(0, 600);

      expect(upcoming.length).toBeGreaterThan(0);
    });
  });

  describe('exportState / importState', () => {
    it('round-trips state correctly', () => {
      const injects = createTestInjects();
      const original = new ArcScheduler(666, 'DIRECTOR', injects);

      original.tick(60);
      original.recordDecision('INJ-001', 'DEGRADE', injects[0]);

      const exported = original.exportState();
      const restored = ArcScheduler.importState(exported, 'DIRECTOR');

      expect(restored.getSeed()).toBe(original.getSeed());
      expect(restored.getState().decisionsLog.length).toBe(1);
    });
  });

  describe('determinism', () => {
    it('produces same schedule for same seed', () => {
      const injects = createTestInjects();
      const scheduler1 = new ArcScheduler(777, 'OPERATOR', injects);
      const scheduler2 = new ArcScheduler(777, 'OPERATOR', injects);

      const state1 = scheduler1.getState();
      const state2 = scheduler2.getState();

      expect(state1.scheduledInjects.map((s) => s.actualRevealSecond)).toEqual(
        state2.scheduledInjects.map((s) => s.actualRevealSecond)
      );
    });

    it('produces different schedules for different seeds', () => {
      const injects = createTestInjects();
      const scheduler1 = new ArcScheduler(888, 'OPERATOR', injects);
      const scheduler2 = new ArcScheduler(999, 'OPERATOR', injects);

      const state1 = scheduler1.getState();
      const state2 = scheduler2.getState();

      const times1 = state1.scheduledInjects.map((s) => s.actualRevealSecond);
      const times2 = state2.scheduledInjects.map((s) => s.actualRevealSecond);

      expect(times1).not.toEqual(times2);
    });
  });
});

describe('createArcFromLog', () => {
  it('creates scheduler from decision log', () => {
    const log = createDecisionLog({
      title: 'Test Scenario',
      description: 'Test description',
      severity: 'HIGH',
      impactCategories: ['PHYSICAL_SECURITY'],
      reportedBy: 'Test',
      createdBy: 'Test',
      organization: 'Test Org',
      exerciseMode: true,
      injects: createTestInjects(),
    });

    const scheduler = createArcFromLog(log, 12345, 'OPERATOR');

    expect(scheduler.getSeed()).toBe(12345);
    expect(scheduler.getState().scheduledInjects.length).toBeGreaterThan(0);
  });
});

describe('Seed Code Functions', () => {
  describe('generateSeedCode', () => {
    it('produces 6-character code', () => {
      const code = generateSeedCode(12345);
      expect(code).toHaveLength(6);
    });

    it('produces deterministic codes', () => {
      const code1 = generateSeedCode(54321);
      const code2 = generateSeedCode(54321);
      expect(code1).toBe(code2);
    });

    it('produces different codes for different seeds', () => {
      const code1 = generateSeedCode(11111);
      const code2 = generateSeedCode(22222);
      expect(code1).not.toBe(code2);
    });
  });

  describe('parseSeedCode', () => {
    it('returns numeric seed from code', () => {
      const seed = parseSeedCode('ABCDEF');
      expect(typeof seed).toBe('number');
      expect(seed).toBeGreaterThan(0);
    });

    it('is case-insensitive', () => {
      const seed1 = parseSeedCode('ABCDEF');
      const seed2 = parseSeedCode('abcdef');
      expect(seed1).toBe(seed2);
    });
  });

  describe('round-trip', () => {
    it('recovers original seed', () => {
      const originalSeed = 98765;
      const code = generateSeedCode(originalSeed);
      const recoveredSeed = parseSeedCode(code);
      expect(recoveredSeed).toBe(originalSeed);
    });
  });
});

describe('PACING_CONFIGS', () => {
  it('has config for all difficulty levels', () => {
    expect(PACING_CONFIGS.ROOKIE).toBeDefined();
    expect(PACING_CONFIGS.OPERATOR).toBeDefined();
    expect(PACING_CONFIGS.DIRECTOR).toBeDefined();
  });

  it('ROOKIE has longer gaps than DIRECTOR', () => {
    expect(PACING_CONFIGS.ROOKIE.minInjectGapSeconds).toBeGreaterThan(
      PACING_CONFIGS.DIRECTOR.minInjectGapSeconds
    );
  });

  it('DIRECTOR has higher timer multiplier than others', () => {
    expect(PACING_CONFIGS.DIRECTOR.timerMultiplier).toBeLessThan(
      PACING_CONFIGS.OPERATOR.timerMultiplier
    );
  });
});
