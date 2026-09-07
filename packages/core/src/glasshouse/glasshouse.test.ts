import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GLASSHOUSE_CONTROLS } from './content.js';
import {
  createGlasshouseSession,
  forkGlasshouse,
  getGlasshouseObservations,
  glasshouseRandom,
  transitionGlasshouse,
} from './kernel.js';
import {
  canonicalGlasshouseState,
  getGlasshouseReport,
  restoreGlasshouseSession,
  serializeGlasshouseSession,
} from './record.js';
import type { Command, Plan, Session } from './types.js';

function plan(control: Plan['control'], overrides: Partial<Plan> = {}): Plan {
  const def = GLASSHOUSE_CONTROLS.find((c) => c.id === control)!;
  return {
    control,
    scope: def.scope,
    posture: 'CONTINUE',
    treatments: ['MITIGATE'],
    authority: def.needsApproval ? 'approval' : 'delegated',
    evidenceIds: ['reader-alert', 'vendor-alert'],
    rationale: '',
    assumption: '',
    hypothesis: '',
    likelihood: 'unknown',
    confidence: 'low',
    alternative: '',
    reviewTrigger: 'Review when the direct check arrives.',
    uncertainty: 'unverified',
    notify: false,
    ...overrides,
  };
}
function commit(s: Session, input: Omit<Command, 'commandId' | 'actor'>): Session {
  const result = transitionGlasshouse(s, {
    ...input,
    commandId: `c${s.commands.length + 1}`,
    actor: 'commander',
  } as Command);
  expect(result.error).toBeUndefined();
  return result.state;
}
function choose(s: Session, control: Plan['control'], overrides: Partial<Plan> = {}): Session {
  return commit(s, { type: 'plan', plan: plan(control, overrides) } as Omit<
    Command,
    'commandId' | 'actor'
  >);
}
function advance(s: Session, until: number): Session {
  while (s.tick < until && s.lifecycle === 'active')
    s = commit(s, { type: 'advance', to: Math.min(until, s.queue[0]?.at ?? until) } as Omit<
      Command,
      'commandId' | 'actor'
    >);
  return s;
}
function finish(s: Session): Session {
  return commit(s, {
    type: 'handoff',
    summary: 'Current controls and remaining connector uncertainty handed over.',
    owner: 'Relief commander',
    reviewTrigger: 'Review the next vendor and guard update.',
  } as Omit<Command, 'commandId' | 'actor'>);
}

describe('Glasshouse independent semantic contracts', () => {
  it('keeps world conditions independent of chosen posture and preserves TRANSFER exactly', () => {
    const base = createGlasshouseSession(0xffffffff, 'guided');
    const result = choose(base, 'monitor', {
      posture: 'DEGRADE',
      treatments: ['TRANSFER', 'ACCEPT'],
    });
    expect(base.decisions).toEqual([]);
    expect(result.world).toEqual(base.world);
    expect(result.decisions[0].treatments).toEqual(['TRANSFER', 'ACCEPT']);
    expect(getGlasshouseReport(result).decisions[0].treatments).toEqual(['TRANSFER', 'ACCEPT']);
    expect(
      restoreGlasshouseSession(serializeGlasshouseSession(result)).decisions[0].treatments
    ).toEqual(['TRANSFER', 'ACCEPT']);
  });
  it('opening a partial review is immutable and never advances or completes the run', () => {
    const state = choose(createGlasshouseSession(1, 'guided'), 'verify-entrance');
    const before = canonicalGlasshouseState(state);
    const report = getGlasshouseReport(state);
    expect(report.lifecycle).toBe('active');
    expect(report.findings[7].score).toBeNull();
    expect(Object.isFrozen(report.decisions)).toBe(true);
    expect(canonicalGlasshouseState(state)).toBe(before);
  });
  it('validates a full seed and uses stable independent causal random identities', () => {
    for (const seed of [0, 1, 0x7fffffff, 0x80000000, 0xffffffff]) {
      const state = createGlasshouseSession(seed, 'guided');
      expect(restoreGlasshouseSession(serializeGlasshouseSession(state)).seed).toBe(seed);
      const first = glasshouseRandom(seed, 'consequence');
      glasshouseRandom(seed, 'cosmetic');
      expect(glasshouseRandom(seed, 'consequence')).toBe(first);
    }
    expect(() => createGlasshouseSession(-1, 'guided')).toThrow();
    expect(() => createGlasshouseSession(2 ** 32, 'guided')).toThrow();
  });
  it('blocks unauthorized scope, double assignment, unavailable evidence and ID reuse', () => {
    let state = createGlasshouseSession(4, 'guided');
    const run = (p: Plan, commandId = 'x'): ReturnType<typeof transitionGlasshouse> =>
      transitionGlasshouse(state, { commandId, actor: 'commander', type: 'plan', plan: p });
    expect(run(plan('isolate-connector', { authority: 'delegated' })).error).toMatch(
      /delegated authority/
    );
    expect(run(plan('monitor', { evidenceIds: ['image-correction'] })).error).toMatch(
      /before this decision/
    );
    expect(run(plan('monitor', { scope: 'entrance' })).error).toMatch(/scope/);
    const command: Command = {
      commandId: 'guard',
      actor: 'commander',
      type: 'plan',
      plan: plan('verify-entrance'),
    };
    state = transitionGlasshouse(state, command).state;
    expect(transitionGlasshouse(state, command).state).toBe(state);
    expect(run(plan('manual-access')).error).toMatch(/guard is committed/);
    expect(run(plan('monitor'), 'guard').error).toMatch(/different action/);
  });
  it('acknowledges a delayed approval without executing and leaves a delegated fallback', () => {
    const seed = Array.from({ length: 100 }, (_, i) => i).find(
      (i) => createGlasshouseSession(i, 'guided').world.owner === 'delayed'
    )!;
    let state = choose(createGlasshouseSession(seed, 'guided'), 'isolate-connector');
    expect(state.actions[0].status).toBe('requested');
    expect(state.actions[0].expectedUpdate).toBe(6);
    expect(state.resources.responder).toBeNull();
    state = choose(state, 'manual-access');
    state = advance(state, 6);
    expect(state.events.some((e) => e.type === 'approval.granted')).toBe(true);
    expect(state.actions[0].status).toBe('started');
  });
  it('preserves an operational rejection as a replayable receipt without executing it', () => {
    const initial = createGlasshouseSession(6, 'guided');
    const command: Command = {
      commandId: 'rejected',
      actor: 'commander',
      type: 'plan',
      plan: plan('isolate-connector', { authority: 'delegated' }),
    };
    const rejected = transitionGlasshouse(initial, command);
    expect(rejected.error).toMatch(/delegated authority/);
    expect(rejected.state.actions).toHaveLength(0);
    expect(rejected.events).toHaveLength(1);
    expect(rejected.events[0].type).toBe('action.rejected');
    expect(transitionGlasshouse(rejected.state, command).events).toHaveLength(0);
    expect(
      canonicalGlasshouseState(restoreGlasshouseSession(serializeGlasshouseSession(rejected.state)))
    ).toBe(canonicalGlasshouseState(rejected.state));
    const accepted = choose(advance(rejected.state, 3), 'verify-entrance');
    const fork = forkGlasshouse(accepted, 'd1', 'after-rejected-fork');
    expect(fork.tick).toBe(3);
    expect(fork.events.some((e) => e.type === 'action.rejected')).toBe(true);
    expect(fork.decisions).toHaveLength(0);
  });
  it('does not penalize the same approval process because an owner response is delayed', () => {
    const availableSeed = Array.from({ length: 100 }, (_, i) => i).find(
      (i) => createGlasshouseSession(i, 'guided').world.owner === 'available'
    )!;
    const delayedSeed = Array.from({ length: 100 }, (_, i) => i).find(
      (i) => createGlasshouseSession(i, 'guided').world.owner === 'delayed'
    )!;
    const available = advance(
      choose(createGlasshouseSession(availableSeed, 'guided'), 'isolate-connector'),
      3
    );
    const delayed = advance(
      choose(createGlasshouseSession(delayedSeed, 'guided'), 'isolate-connector'),
      3
    );
    expect(getGlasshouseReport(available).findings[4].score).toBe(
      getGlasshouseReport(delayed).findings[4].score
    );
  });
  it('notifications and recommendations do not approve or change the world', () => {
    let state = choose(createGlasshouseSession(3, 'guided'), 'isolate-connector', {
      authority: 'recommendation',
      notify: true,
    });
    expect(state.actions[0].costCents).toBe(0);
    expect(state.resources.responder).toBeNull();
    expect(state.events.some((e) => e.type === 'approval.granted')).toBe(false);
    state = advance(state, 10);
    expect(state.ledger.avoidedLossCents).toBe(0);
  });
  it('recommendations never satisfy execution prerequisites or verification terminal conditions', () => {
    let state = createGlasshouseSession(9, 'guided');
    state = choose(state, 'isolate-connector', { authority: 'recommendation' });
    state = choose(state, 'investigate-connector', { authority: 'recommendation' });
    state = choose(state, 'verify-entrance', { authority: 'recommendation' });
    state = advance(state, 30);
    const result = transitionGlasshouse(state, {
      commandId: 'restore',
      actor: 'commander',
      type: 'plan',
      plan: plan('restore-connector'),
    });
    expect(result.error).toMatch(/First establish/);
    expect(finish(state).lifecycle).toBe('incomplete');
  });
  it('rejects unknown nested fields before they can bypass redaction', () => {
    const state = createGlasshouseSession(3, 'guided');
    const result = transitionGlasshouse(state, {
      commandId: 'extra',
      actor: 'commander',
      type: 'plan',
      plan: { ...plan('monitor'), unknownExtra: 'PRIVATE-SECRET' },
    } as Command);
    expect(result.error).toMatch(/unsupported field/);
    expect(result.state).toBe(state);
    const improvement = transitionGlasshouse(state, {
      commandId: 'extra-improvement',
      actor: 'commander',
      type: 'improvement',
      improvement: {
        action: 'Retest',
        owner: 'Relief',
        targetDate: '2026-10-01',
        retest: 'New case',
        unexpected: 'PRIVATE',
      },
    } as Command);
    expect(improvement.error).toMatch(/unsupported field/);
  });
  it('reports a weak approval request as declined with no cost or resource reservation', () => {
    let state = choose(createGlasshouseSession(9, 'guided'), 'isolate-connector', {
      evidenceIds: [],
      reviewTrigger: '',
    });
    state = advance(state, 6);
    expect(state.actions[0].status).toBe('declined');
    expect(state.ledger.treatmentCostCents).toBe(0);
    expect(state.resources.responder).toBeNull();
  });
  it('cancellation releases resources once and preserves committed labor cost', () => {
    let state = choose(createGlasshouseSession(1, 'guided'), 'verify-entrance');
    state = commit(state, { type: 'cancel', actionId: 'a1' } as Omit<
      Command,
      'commandId' | 'actor'
    >);
    expect(state.resources.guard).toBeNull();
    expect(state.ledger.treatmentCostCents).toBe(12000);
    state = advance(state, 5);
    expect(state.observations.some((o) => o.id.startsWith('guard-check'))).toBe(false);
    expect(state.events.filter((e) => e.type === 'action.cancelled')).toHaveLength(1);
  });
  it('expiring manual control reveals constrained capacity and releases its guard', () => {
    const seed = Array.from({ length: 100 }, (_, i) => i).find(
      (i) => createGlasshouseSession(i, 'guided').world.capacity === 'constrained'
    )!;
    let state = choose(createGlasshouseSession(seed, 'guided'), 'manual-access');
    state = advance(state, 2);
    expect(state.actions[0].result).toMatch(/exceeds capacity/);
    expect(state.resources.guard).toBe('a1');
    state = advance(state, 14);
    expect(state.actions[0].status).toBe('expired');
    expect(state.resources.guard).toBeNull();
  });
  it('holds all deadline boundaries and clock state is not driven by wall time', () => {
    const state = createGlasshouseSession(1, 'independent');
    expect(
      transitionGlasshouse(state, {
        commandId: 'jump',
        actor: 'commander',
        type: 'advance',
        to: 60,
      }).error
    ).toMatch(/next significant/);
    expect(state.tick).toBe(0);
    expect(state.paused).toBe(true);
    const stepped = advance(state, 3);
    expect(stepped.tick).toBe(3);
    expect(stepped.mode).toBe('independent');
    expect(
      transitionGlasshouse(stepped, {
        commandId: 'back',
        actor: 'commander',
        type: 'advance',
        to: 2,
      }).error
    ).toBeDefined();
  });
  it('limits actor knowledge and replays known-then corrections without hindsight', () => {
    let state = createGlasshouseSession(1, 'guided');
    expect(getGlasshouseObservations(state, 'owner').map((o) => o.id)).toEqual(['shipment']);
    state = advance(state, 3);
    state = choose(state, 'monitor', { evidenceIds: ['image'], notify: true });
    const snapshot = [...state.decisions[0].knownEvidenceIds];
    state = advance(state, 12);
    expect(getGlasshouseObservations(state, 'owner', 2).some((o) => o.id === 'image')).toBe(false);
    expect(getGlasshouseObservations(state, 'owner', 3).some((o) => o.id === 'image')).toBe(true);
    expect(getGlasshouseObservations(state, 'owner').some((o) => o.id === 'image-correction')).toBe(
      false
    );
    expect(state.decisions[0].knownEvidenceIds).toEqual(snapshot);
    expect(snapshot).not.toContain('image-correction');
    expect(getGlasshouseReport(state).unresolved.join(' ')).toMatch(/send an updated brief/);
    state = choose(state, 'monitor', { evidenceIds: ['image'] });
    expect(getGlasshouseReport(state).findings[0].score).toBe(0);
  });
  it('tracks a correction obligation after a brief and settles it only when the correction is shared', () => {
    let state = advance(createGlasshouseSession(610, 'guided'), 3);
    state = choose(state, 'monitor', { evidenceIds: ['image'], notify: false });
    const brief = (
      evidenceIds: string[]
    ): Omit<Extract<Command, { type: 'brief' }>, 'commandId' | 'actor'> => ({
      type: 'brief',
      scope: 'dispatch',
      evidenceIds,
      recommendation: 'Continue bounded observation.',
      uncertainty: 'Source unverified.',
      alternative: 'Direct check.',
      consequence: 'Dispatch continues.',
      reviewTrigger: 'Review source correction.',
    });
    state = commit(state, brief(['image']));
    expect(state.events.some((event) => event.type === 'owner.notified')).toBe(false);
    state = advance(state, 12);
    const before = getGlasshouseReport(state);
    expect(getGlasshouseObservations(state, 'owner').map((item) => item.id)).toContain('image');
    expect(getGlasshouseObservations(state, 'owner').map((item) => item.id)).not.toContain(
      'image-correction'
    );
    expect(before.unresolved.join(' ')).toMatch(/owner received image.*send an updated brief/);
    state = commit(state, brief(['image']));
    expect(getGlasshouseReport(state).unresolved.join(' ')).toMatch(/send an updated brief/);
    state = commit(state, brief(['image-correction']));
    expect(getGlasshouseReport(state).unresolved.join(' ')).not.toMatch(/send an updated brief/);
    expect(getGlasshouseObservations(state, 'owner', 11).map((item) => item.id)).not.toContain(
      'image-correction'
    );
    expect(before.unresolved.join(' ')).toMatch(/send an updated brief/);
  });
  it('restores a pre-patch record with its exact original assessment and preserves the rubric in forks', () => {
    const text = readFileSync(
      new URL('./fixtures/observable-1.0.0-session.json', import.meta.url),
      'utf8'
    );
    const originalReport = JSON.parse(
      readFileSync(new URL('./fixtures/observable-1.0.0-report.json', import.meta.url), 'utf8')
    );
    const restored = restoreGlasshouseSession(text);
    expect(restored.rubricVersion).toBe('observable-1.0.0');
    expect(canonicalGlasshouseState(restored)).toBe(
      canonicalGlasshouseState(JSON.parse(text).state)
    );
    const report = getGlasshouseReport(restored);
    expect(report.limitations.join(' ')).toMatch(
      /Historical rubric observable-1.0.0.*has not been regraded/
    );
    expect({
      ...report,
      limitations: report.limitations.filter((note) => !note.startsWith('Historical ')),
    }).toEqual(originalReport);
    expect(restoreGlasshouseSession(serializeGlasshouseSession(restored))).toEqual(restored);
    const branch = forkGlasshouse(restored, 'd1');
    expect(branch.rubricVersion).toBe('observable-1.0.0');
    expect(branch.rulesVersion).toBe('kernel-1.0.0');
    expect(branch.assetsVersion).toBe('campus-1.0.0');
    expect(branch.events[0].payload.versions).toEqual(restored.events[0].payload.versions);
    expect(restoreGlasshouseSession(serializeGlasshouseSession(branch))).toEqual(branch);
    expect(createGlasshouseSession(610, 'guided', 'fresh-current').rubricVersion).toBe(
      'observable-1.0.1'
    );
    expect(() =>
      createGlasshouseSession(610, 'guided', 'unknown-rubric', 'observable-0.9.0')
    ).toThrow(/Unsupported rubric/);
    expect(() =>
      createGlasshouseSession(610, 'guided', 'unknown-rules', 'observable-1.0.1', 'kernel-unknown')
    ).toThrow(/Unsupported rules/);
    expect(() =>
      createGlasshouseSession(
        610,
        'guided',
        'unknown-assets',
        'observable-1.0.1',
        'kernel-1.1.0',
        'campus-unknown'
      )
    ).toThrow(/Unsupported assets/);
    expect(
      transitionGlasshouse(restored, {
        actor: 'commander',
        commandId: 'historical-abandon',
        type: 'abandon',
        reason: 'Stop here.',
      }).error
    ).toMatch(/historical rules version/);
  });
  it('records voluntary abandonment without changing unfinished world state or granting completion', () => {
    const before = advance(choose(createGlasshouseSession(610, 'guided'), 'verify-entrance'), 3);
    const reason = 'Private abandonment note: return to this objective in another session.';
    const abandoned = commit(before, { type: 'abandon', reason } as Omit<
      Command,
      'actor' | 'commandId'
    >);
    expect(abandoned.lifecycle).toBe('abandoned');
    expect(abandoned.abandonment).toEqual({ reason, at: 3 });
    for (const field of [
      'tick',
      'queue',
      'actions',
      'ledger',
      'observations',
      'decisions',
      'world',
      'actorKnowledge',
      'resources',
    ] as const)
      expect(abandoned[field]).toEqual(before[field]);
    expect(abandoned.events.slice(0, -1)).toEqual(before.events);
    expect(abandoned.events.at(-1)?.type).toBe('session.abandoned');
    expect(abandoned.handoff).toBeUndefined();
    const report = getGlasshouseReport(abandoned);
    expect(report.lifecycle).toBe('abandoned');
    expect(report.findings.find((finding) => finding.id === 'gh-8')?.score).toBeNull();
    expect(report.abandonment?.reason).toBe(reason);
    expect(JSON.stringify(getGlasshouseReport(abandoned, 0, true))).not.toContain(reason);
    expect(restoreGlasshouseSession(serializeGlasshouseSession(abandoned))).toEqual(abandoned);
    expect(transitionGlasshouse(abandoned, abandoned.commands.at(-1)!).state).toBe(abandoned);
    expect(
      transitionGlasshouse(abandoned, {
        actor: 'commander',
        commandId: 'after-end',
        type: 'advance',
        to: 4,
      }).error
    ).toMatch(/ended/);
    expect(
      transitionGlasshouse(abandoned, {
        actor: 'commander',
        commandId: 'after-end-plan',
        type: 'plan',
        plan: plan('monitor'),
      }).error
    ).toMatch(/ended/);
    expect(before.lifecycle).toBe('active');
  });
  it('bounds an abandonment reason and refuses malformed termination without changing the run', () => {
    const state = createGlasshouseSession(610, 'guided');
    for (const reason of ['', '   ', 'x'.repeat(1001)]) {
      const result = transitionGlasshouse(state, {
        actor: 'commander',
        commandId: 'invalid-end',
        type: 'abandon',
        reason,
      });
      expect(result.error).toMatch(/reason.*1,000/);
      expect(result.state).toBe(state);
    }
    const atLimit = transitionGlasshouse(state, {
      actor: 'commander',
      commandId: 'at-limit',
      type: 'abandon',
      reason: 'x'.repeat(1000),
    });
    expect(atLimit.error).toBeUndefined();
    expect(atLimit.state.abandonment?.reason).toHaveLength(1000);
  });
  it('preview continues the same choice/evidence without a reset', () => {
    let state = choose(createGlasshouseSession(1, 'preview'), 'verify-entrance');
    state = advance(state, 4);
    expect(
      transitionGlasshouse(state, {
        commandId: 'later',
        actor: 'commander',
        type: 'advance',
        to: 8,
      }).error
    ).toMatch(/continue/);
    const first = structuredClone(state.decisions[0]);
    state = commit(state, { type: 'continue' });
    expect(state.mode).toBe('guided');
    expect(state.initialMode).toBe('preview');
    expect(state.decisions[0]).toEqual(first);
  });
  it('reconciles overlapping controls by marginal exposure, not summed savings', () => {
    let state = choose(createGlasshouseSession(1, 'guided'), 'manual-access');
    state = choose(state, 'isolate-connector');
    state = advance(state, 10);
    const baseline = state.ledger.baselineLossCents;
    expect(state.ledger.avoidedLossCents).toBeLessThan(baseline);
    expect(state.ledger.netBenefitCents).toBe(
      state.ledger.avoidedLossCents - state.ledger.treatmentCostCents
    );
    const savings = state.ledger.avoidedLossCents;
    state = choose(state, 'monitor');
    expect(state.ledger.avoidedLossCents).toBe(savings);
    const free = advance(choose(createGlasshouseSession(2, 'guided'), 'monitor'), 1);
    expect(free.ledger.roiPercent).toBeNull();
  });
  it('keeps process feedback independent of lucky and unlucky hidden outcomes', () => {
    let first = choose(createGlasshouseSession(1, 'guided'), 'monitor', {
      evidenceIds: [],
      reviewTrigger: '',
    });
    first = advance(first, 30);
    let second = choose(createGlasshouseSession(10, 'guided'), 'monitor', {
      evidenceIds: [],
      reviewTrigger: '',
    });
    second = advance(second, 30);
    const scores = (s: Session): (number | null)[] =>
      getGlasshouseReport(s).findings.map((f) => f.score);
    expect(scores(first)).toEqual(scores(second));
    expect(scores(first)[0]).toBe(0);
    const prose = choose(createGlasshouseSession(1, 'guided'), 'monitor', {
      rationale: 'excellent '.repeat(100),
      alternative: 'defensible '.repeat(50),
    });
    expect(getGlasshouseReport(prose).findings[1].evaluatorType).toBe('human-review');
    expect(getGlasshouseReport(prose).findings[1].score).toBeNull();
  });
  it('retains a recommendation correction as a new decision', () => {
    let state = choose(createGlasshouseSession(4, 'guided'), 'monitor');
    state = advance(state, 1);
    const first = structuredClone(state.decisions[0]);
    state = commit(state, {
      type: 'plan',
      plan: plan('monitor', { treatments: ['TRANSFER'] }),
      revisionOf: 'd1',
    } as Omit<Command, 'commandId' | 'actor'>);
    expect(state.decisions[0]).toEqual(first);
    expect(state.decisions[1].revisionOf).toBe('d1');
  });
  it('rejects corrupt, executable, oversize and unauthorized replay imports without changing the source', () => {
    const state = choose(createGlasshouseSession(1, 'guided'), 'verify-entrance');
    const text = serializeGlasshouseSession(state);
    const parsed = JSON.parse(text);
    parsed.state.tick = 30;
    expect(() => restoreGlasshouseSession(JSON.stringify(parsed))).toThrow(/disagree/);
    expect(() => restoreGlasshouseSession('{"x":"<script>bad</script>"}')).toThrow(/Executable/);
    expect(() => restoreGlasshouseSession(' '.repeat(5 * 1024 * 1024 + 1))).toThrow(/5 MB/);
    expect(() => restoreGlasshouseSession('{"__proto__":{}}')).toThrow(/Unsafe/);
    expect(() => restoreGlasshouseSession('{')).toThrow(/valid JSON/);
    expect(serializeGlasshouseSession(state)).toBe(text);
  });
  it('redacts every free-text path including event payloads and personal labels', () => {
    let state = choose(createGlasshouseSession(2, 'guided'), 'monitor', {
      rationale: 'PRIVATE-SECRET',
      assumption: 'PRIVATE-SECRET',
      hypothesis: 'PRIVATE-SECRET',
      alternative: 'PRIVATE-SECRET',
      reviewTrigger: 'PRIVATE-SECRET',
    });
    state = commit(state, {
      type: 'improvement',
      improvement: {
        action: 'PRIVATE-SECRET',
        owner: 'PRIVATE-SECRET',
        targetDate: '2026-09-30',
        retest: 'PRIVATE-SECRET',
      },
    } as Omit<Command, 'commandId' | 'actor'>);
    expect(JSON.stringify(getGlasshouseReport(state, 10, true))).not.toContain('PRIVATE-SECRET');
    expect(JSON.stringify(getGlasshouseReport(state, 10, false))).toContain('PRIVATE-SECRET');
  });
  it('supports at least 100 complete decision records with no excerpt in the report', () => {
    let state = createGlasshouseSession(3, 'guided');
    for (let i = 0; i < 100; i++)
      state = choose(state, 'monitor', {
        authority: 'recommendation',
        treatments: ['TRANSFER'],
        rationale: `Decision ${i}`,
      });
    const report = getGlasshouseReport(state);
    expect(report.decisions).toHaveLength(100);
    expect(report.decisions[99].rationale).toBe('Decision 99');
    expect(restoreGlasshouseSession(serializeGlasshouseSession(state)).decisions).toHaveLength(100);
  });
  it('drains a 20-event burst once in stable priority/sequence order', () => {
    const state = createGlasshouseSession(3, 'guided');
    for (let i = 0; i < 20; i++) {
      state.actions.push({
        id: `test-a${i}`,
        decisionId: 'fixture',
        control: 'manual-access',
        scope: 'entrance',
        owner: 'analyst',
        status: 'completed',
        resources: [],
        expectedUpdate: 1,
        expiresAt: 1,
        eventId: state.events[0].eventId,
        costCents: 0,
      });
      state.queue.push({
        id: `test-e${i}`,
        at: 1,
        priority: 4,
        order: i,
        kind: 'expire',
        ref: `test-a${i}`,
        parentIds: [state.events[0].eventId],
      });
    }
    state.queue.sort((a, b) => a.at - b.at || a.priority - b.priority || a.order - b.order);
    const after = advance(state, 1);
    const expired = after.events.filter((e) => e.type === 'action.expired');
    expect(expired).toHaveLength(20);
    expect(expired.map((e) => e.payload.actionId)).toEqual(
      Array.from({ length: 20 }, (_, i) => `test-a${i}`)
    );
    expect(advance(after, 3).events.filter((e) => e.type === 'action.expired')).toHaveLength(20);
  });
  it('permits three different feasible strategies and an explicit poor incomplete handoff', () => {
    for (const strategy of ['verify', 'isolate', 'bounded'] as const) {
      let state = createGlasshouseSession(9, 'guided');
      state = choose(state, 'investigate-connector');
      state = choose(state, 'verify-entrance');
      state = advance(state, 8);
      state = choose(
        state,
        strategy === 'isolate'
          ? 'isolate-connector'
          : strategy === 'bounded'
            ? 'manual-access'
            : 'monitor'
      );
      state = advance(state, 38);
      state = finish(state);
      expect(state.lifecycle).toBe('completed');
    }
    expect(finish(createGlasshouseSession(0, 'guided')).lifecycle).toBe('incomplete');
  });
  it('preserves a faithful future across every command boundary and a separate counterfactual', () => {
    let state = createGlasshouseSession(47, 'guided');
    const boundaries = [state];
    state = choose(state, 'investigate-connector');
    boundaries.push(state);
    state = choose(state, 'verify-entrance');
    boundaries.push(state);
    while (state.tick < 8) {
      state = advance(state, Math.min(8, state.queue[0].at));
      boundaries.push(state);
    }
    state = choose(state, 'isolate-connector');
    boundaries.push(state);
    state = advance(state, 38);
    state = finish(state);
    for (const checkpoint of boundaries) {
      let restored = restoreGlasshouseSession(serializeGlasshouseSession(checkpoint));
      for (const command of state.commands.slice(checkpoint.commands.length)) {
        const result = transitionGlasshouse(restored, command);
        expect(result.error).toBeUndefined();
        restored = result.state;
      }
      expect(canonicalGlasshouseState(restored)).toBe(canonicalGlasshouseState(state));
    }
    const original = canonicalGlasshouseState(state);
    let fork = forkGlasshouse(state, 'd3', 'first-alternative');
    const secondFork = forkGlasshouse(state, 'd3', 'second-alternative');
    expect(secondFork.sessionId).not.toBe(fork.sessionId);
    expect(secondFork.observations).toEqual(fork.observations);
    expect(secondFork.world).toEqual(fork.world);
    expect(secondFork.queue).toEqual(fork.queue);
    expect(() => forkGlasshouse(state, 'd3', state.sessionId)).toThrow('own session identifier');
    expect(fork.tick).toBe(state.decisions[2].at);
    expect(fork.decisions).toHaveLength(2);
    expect(fork.parentSessionId).toBe(state.sessionId);
    expect(getGlasshouseObservations(fork).map((o) => o.id)).toEqual(
      state.decisions[2].knownEvidenceIds
    );
    fork = choose(fork, 'manual-access');
    fork = advance(fork, 38);
    expect(fork.ledger).not.toEqual(state.ledger);
    expect(canonicalGlasshouseState(state)).toBe(original);
    expect(
      canonicalGlasshouseState(restoreGlasshouseSession(serializeGlasshouseSession(fork)))
    ).toBe(canonicalGlasshouseState(fork));
  });
  it('all 1,000 authored seeds permit a verified controlled handoff without a soft lock', () => {
    for (let seed = 0; seed < 1000; seed++) {
      let state = createGlasshouseSession(seed, 'guided');
      state = choose(state, 'investigate-connector');
      state = choose(state, 'verify-entrance');
      state = advance(state, 8);
      state = choose(state, 'manual-access');
      state = advance(state, 38);
      state = finish(state);
      expect(state.lifecycle, `seed ${seed}`).toBe('completed');
      const sequences = state.events.map((e) => e.sequence);
      expect(new Set(sequences).size).toBe(sequences.length);
      for (const event of state.events)
        for (const parent of event.causalParentIds)
          expect(state.events.find((e) => e.eventId === parent)!.sequence).toBeLessThan(
            event.sequence
          );
      expect(state.ledger.netBenefitCents).toBe(
        state.ledger.avoidedLossCents - state.ledger.treatmentCostCents
      );
    }
  }, 60000);
});
