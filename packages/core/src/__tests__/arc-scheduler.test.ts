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
      const due = scheduler.tick(firstInject.actualRevealSecond + 1);
      scheduler.acknowledgeInjects(due.map((item) => item.inject.id));
      const secondReveal = scheduler.tick(firstInject.actualRevealSecond + 2);

      const alreadyRevealed = secondReveal.find((r) => r.inject.id === firstInject.inject.id);
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
    it('produces 7-character codes that can represent all 32 seed bits', () => {
      const code = generateSeedCode(12345);
      expect(code).toHaveLength(7);
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

describe('G0 causal scheduler regressions', () => {
  it('applies a clock-jump consequence burst in causal time order before clamping', () => {
    const original = new ArcScheduler(1, 'OPERATOR', []);
    const snapshot = JSON.parse(original.exportState());
    snapshot.currentTrust = 99;
    snapshot.consequenceQueue = [
      {
        triggerTime: 20,
        sourceInjectId: 'later',
        consequence: {
          triggerPosture: 'CONTINUE',
          type: 'STAKEHOLDER',
          description: 'Later recovery',
          trustImpact: 5,
        },
      },
      {
        triggerTime: 10,
        sourceInjectId: 'earlier',
        consequence: {
          triggerPosture: 'CONTINUE',
          type: 'STAKEHOLDER',
          description: 'Earlier loss',
          trustImpact: -15,
        },
      },
    ];
    const restored = ArcScheduler.importState(JSON.stringify(snapshot), 'OPERATOR');
    restored.tick(30);
    expect(restored.getTrustLevel()).toBe(89);
    restored.tick(30);
    expect(restored.getTrustLevel()).toBe(89);
  });

  it('preserves the authored core sequence and immutable reveal facts across 1,000 seeds', () => {
    const injects = createTestInjects();
    for (let seed = 0; seed < 1_000; seed++) {
      const scheduler = new ArcScheduler(seed, 'DIRECTOR', [...injects].reverse());
      const schedule = scheduler.getState().scheduledInjects;
      expect(schedule.map((item) => item.inject.id)).toEqual(injects.map((item) => item.id));
      expect(schedule.map((item) => item.inject.revealAtMinute)).toEqual(
        injects.map((item) => item.revealAtMinute)
      );
      for (const item of schedule) {
        expect(item.actualRevealSecond).toBeGreaterThanOrEqual(item.inject.revealAtMinute * 60);
      }
    }
  });

  it('keeps twenty due events pending through a slow frame until journal acknowledgment', () => {
    const injects = Array.from({ length: 20 }, (_, index) => ({
      ...createTestInjects()[0],
      id: `BURST-${index}`,
      sequenceNumber: index + 1,
      revealAtMinute: 0,
    }));
    const scheduler = new ArcScheduler(42, 'OPERATOR', injects);
    const due = scheduler.tick(3_600);
    expect(due.map((item) => item.inject.id)).toEqual(injects.map((item) => item.id));
    scheduler.acknowledgeInjects([due[0].inject.id]);
    const remaining = scheduler.tick(3_600);
    expect(remaining.map((item) => item.inject.id)).toEqual(
      injects.slice(1).map((item) => item.id)
    );
    scheduler.acknowledgeInjects(remaining.map((item) => item.inject.id));
    expect(scheduler.tick(3_600)).toEqual([]);
    expect(scheduler.getState().revealedInjectIds.size).toBe(20);
  });

  it('rejects invalid clock movements without changing the saved state', () => {
    const scheduler = new ArcScheduler(1, 'OPERATOR', createTestInjects());
    scheduler.tick(60);
    const before = scheduler.exportState();
    for (const time of [59, -1, NaN, Infinity]) {
      expect(() => scheduler.tick(time)).toThrow();
      expect(scheduler.exportState()).toBe(before);
    }
  });

  it('continues identical random consequences after save and restore', () => {
    const injects = createTestInjects().map((inject) => ({
      ...inject,
      expectedPostureImpact: 'PAUSE' as const,
    }));
    const original = new ArcScheduler(0xffffffff, 'DIRECTOR', injects);
    original.tick(60);
    original.recordDecision(injects[0].id, 'CONTINUE', injects[0]);
    const restored = ArcScheduler.importState(original.exportState(), 'DIRECTOR');
    for (let index = 0; index < 20; index++) {
      expect(restored.recordDecision(`future-${index}`, 'CONTINUE', injects[1])).toEqual(
        original.recordDecision(`future-${index}`, 'CONTINUE', injects[1])
      );
    }
    expect(restored.exportState()).toBe(original.exportState());
  });
});

describe('G0 seed serialization', () => {
  it.each([0, 1, 0x3fffffff, 0x40000000, 0x7fffffff, 0x80000000, 0xfffffffe, 0xffffffff])(
    'round-trips unsigned 32-bit boundary seed %i',
    (seed) => expect(parseSeedCode(generateSeedCode(seed))).toBe(seed)
  );

  it('reads existing six-character codes without changing their meaning', () => {
    expect(parseSeedCode('BAAAAA')).toBe(1);
    expect(parseSeedCode('AAAAAA')).toBe(0);
  });

  it.each(['', 'ABC!EF', 'ABCDEF!!', 'ZZZZZZZ', 'AAAAAAA0'])(
    'rejects malformed code %s',
    (code) => {
      expect(() => parseSeedCode(code)).toThrow();
    }
  );
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
