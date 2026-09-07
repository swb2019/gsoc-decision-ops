import { describe, expect, it } from 'vitest';
import { createGlasshouseSession, forkGlasshouse, transitionGlasshouse } from './kernel.js';
import {
  canonicalGlasshouseState,
  restoreGlasshouseSession,
  serializeGlasshouseSession,
} from './record.js';
import { compareGlasshouseNextCheckpoint } from './counterfactual.js';
import type { Command, Plan, Session } from './types.js';

function plan(control: Plan['control']): Plan {
  return {
    control,
    scope: control === 'monitor' ? 'dispatch' : 'entrance',
    posture: 'CONTINUE',
    treatments: ['MITIGATE'],
    authority: 'delegated',
    evidenceIds: ['reader-alert'],
    rationale: '',
    assumption: '',
    hypothesis: '',
    likelihood: 'unknown',
    confidence: 'low',
    alternative: '',
    reviewTrigger: 'Inspect the next direct update.',
    uncertainty: 'unverified',
    notify: false,
  };
}
function apply(state: Session, command: Omit<Command, 'commandId' | 'actor'>): Session {
  const result = transitionGlasshouse(state, {
    ...command,
    commandId: `test-${state.commands.length + 1}`,
    actor: 'commander',
  } as Command);
  expect(result.error).toBeUndefined();
  return result.state;
}
function choose(state: Session, control: Plan['control']): Session {
  return apply(state, { type: 'plan', plan: plan(control) } as Omit<
    Command,
    'commandId' | 'actor'
  >);
}
function advance(state: Session, horizon: number): Session {
  while (state.tick < horizon)
    state = apply(state, {
      type: 'advance',
      to: Math.min(horizon, state.queue[0]?.at ?? horizon),
    } as Omit<Command, 'commandId' | 'actor'>);
  return state;
}

describe('bounded next-checkpoint counterfactual', () => {
  it('uses different action lead times, equal horizons and no invented original choice', () => {
    const source = advance(
      choose(createGlasshouseSession(31, 'guided', 'quick-source'), 'verify-entrance'),
      4
    );
    const branch = choose(
      forkGlasshouse(source, source.decisions[0].id, 'quick-branch'),
      'manual-access'
    );
    const beforeSource = canonicalGlasshouseState(source),
      beforeBranch = canonicalGlasshouseState(branch);
    const result = compareGlasshouseNextCheckpoint(
      source,
      source.decisions[0].id,
      branch,
      'quick-step'
    );
    expect(result.branch.tick).toBe(2);
    expect(result.original.tick).toBe(2);
    expect(result.branch.actions[0].status).toBe('completed');
    expect(result.original.actions[0].status).toBe('started');
    expect(result.reason).toContain('clock is interpolated');
    expect(result.original.decisions).toHaveLength(1);
    expect(result.branch.commands).toHaveLength(branch.commands.length + 1);
    expect(canonicalGlasshouseState(source)).toBe(beforeSource);
    expect(canonicalGlasshouseState(branch)).toBe(beforeBranch);
    expect(restoreGlasshouseSession(serializeGlasshouseSession(result.branch))).toEqual(
      result.branch
    );
    expect(
      compareGlasshouseNextCheckpoint(source, source.decisions[0].id, branch, 'quick-step')
    ).toEqual(result);
  });

  it('includes actual subsequent original commands without applying those choices to the branch', () => {
    let source = choose(
      createGlasshouseSession(44, 'guided', 'quick-later-source'),
      'verify-entrance'
    );
    source = choose(source, 'monitor');
    source = advance(source, 4);
    const branch = choose(
      forkGlasshouse(source, source.decisions[0].id, 'quick-later-branch'),
      'manual-access'
    );
    const result = compareGlasshouseNextCheckpoint(
      source,
      source.decisions[0].id,
      branch,
      'quick-later-step'
    );
    expect(result.original.decisions.map((decision) => decision.control)).toEqual([
      'verify-entrance',
      'monitor',
    ]);
    expect(result.original.actions.find((action) => action.control === 'monitor')?.status).toBe(
      'completed'
    );
    expect(result.branch.decisions.map((decision) => decision.control)).toEqual(['manual-access']);
    expect(result.branch.queue[0].at).toBeGreaterThan(result.branch.tick);
    expect(result.branch.tick).toBe(2);
  });

  it('rejects no alternative, mismatched ancestry and a horizon past the original rather than manufacturing a future', () => {
    const short = choose(createGlasshouseSession(1, 'guided', 'quick-short'), 'verify-entrance');
    const checkpoint = forkGlasshouse(short, short.decisions[0].id, 'quick-short-branch');
    expect(() =>
      compareGlasshouseNextCheckpoint(short, short.decisions[0].id, checkpoint, 'step')
    ).toThrow(/exactly one alternative/);
    const branch = choose(checkpoint, 'manual-access');
    expect(() =>
      compareGlasshouseNextCheckpoint(short, short.decisions[0].id, branch, 'step')
    ).toThrow(/beyond the original/);
    const forged = { ...branch, parentSessionId: 'unrelated-original' };
    expect(() =>
      compareGlasshouseNextCheckpoint(advance(short, 4), short.decisions[0].id, forged, 'step')
    ).toThrow(/not linked/);
  });

  it('stops at the next evidence release when it precedes the alternative action completion', () => {
    const source = advance(
      choose(createGlasshouseSession(9, 'guided', 'quick-evidence-source'), 'monitor'),
      4
    );
    const branch = choose(
      forkGlasshouse(source, source.decisions[0].id, 'quick-evidence-branch'),
      'verify-entrance'
    );
    const nextTime = branch.queue[0].at;
    expect(nextTime).toBeLessThan(branch.actions[0].expectedUpdate);
    const result = compareGlasshouseNextCheckpoint(
      source,
      source.decisions[0].id,
      branch,
      'quick-evidence-step'
    );
    expect(result.branch.tick).toBe(nextTime);
    expect(result.original.tick).toBe(nextTime);
    expect(result.branch.actions[0].status).toBe('started');
    expect(result.branch.observations.some((item) => item.receivedAt === nextTime)).toBe(true);
    expect(result.reason).toContain('requires your next decision');
    expect(() =>
      compareGlasshouseNextCheckpoint(source, source.decisions[0].id, result.branch, 'step-again')
    ).toThrow(/already advanced/);
  });
});
