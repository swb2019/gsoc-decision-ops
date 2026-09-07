import { describe, expect, it } from 'vitest';
import {
  createGlasshouseSession,
  transitionGlasshouse,
  canonicalGlasshouseState,
  serializeGlasshouseSession,
  forkGlasshouse,
  type GlasshouseSession as Session,
  type GlasshouseCommand as Command,
  type GlasshousePlan as Plan,
} from '@gsoc-decision-ops/core';
import {
  compareGlasshousePractice,
  getGlasshousePracticeReport,
  projectGlasshousePractice,
} from './glasshouse-practice';

const verification: Plan = {
  control: 'verify-entrance',
  scope: 'entrance',
  posture: 'CONTINUE',
  treatments: ['MITIGATE'],
  authority: 'delegated',
  evidenceIds: ['reader-alert'],
  rationale: 'A current direct check could change the plan.',
  assumption: '',
  hypothesis: '',
  likelihood: 'unknown',
  confidence: 'low',
  alternative: '',
  reviewTrigger: 'When the guard reports',
  uncertainty: 'unverified',
  notify: false,
};
function command(state: Session, payload: Omit<Command, 'commandId' | 'actor'>): Session {
  const result = transitionGlasshouse(state, {
    ...payload,
    actor: 'commander',
    commandId: `practice-${state.commands.length + 1}`,
  } as Command);
  expect(result.error).toBeUndefined();
  return result.state;
}
function advance(state: Session, target: number): Session {
  while (state.tick < target && state.lifecycle === 'active')
    state = command(state, {
      type: 'advance',
      to: Math.min(target, state.queue[0]?.at ?? target),
    } as Omit<Command, 'commandId' | 'actor'>);
  return state;
}

describe('local practice evidence without competence claims', () => {
  it('elapsed time and a far-later save never establish observed behavior or retention', () => {
    const initial = createGlasshouseSession(3, 'guided', 'history-idle');
    const afterTime = advance(initial, 60);
    const summary = projectGlasshousePractice(afterTime, Date.UTC(2026, 10, 2), 3600);
    expect(summary.statusLabel).toContain('Partial');
    expect(summary.caseProgress).toBe('introduced');
    expect(summary.observations.every((item) => item.status === 'not-observed')).toBe(true);
    expect(summary.retention).toBe('not-established');
    expect(summary.transfer).toBe('unavailable-until-g3');
  });

  it('distinguishes recommendation, pending verification and a genuinely completed check', () => {
    const initial = createGlasshouseSession(3, 'guided', 'history-check');
    const recommended = command(initial, {
      type: 'plan',
      plan: { ...verification, authority: 'recommendation' },
    } as Omit<Command, 'commandId' | 'actor'>);
    expect(projectGlasshousePractice(recommended).observations[1].count).toBe(0);
    const pending = command(initial, { type: 'plan', plan: verification } as Omit<
      Command,
      'commandId' | 'actor'
    >);
    expect(projectGlasshousePractice(pending).observations[0].count).toBe(1);
    expect(projectGlasshousePractice(pending).observations[1].count).toBe(0);
    const completed = advance(pending, 4);
    const observed = projectGlasshousePractice(completed);
    expect(observed.observations[1].count).toBe(1);
    expect(observed.observations[1].eventIds).toEqual(
      completed.events
        .filter((event) => event.type === 'action.completed')
        .map((event) => event.eventId)
    );
    expect(observed.caseProgress).toBe('recorded-in-this-case');
    expect(observed.retention).toBe('not-established');
  });

  it('retains incomplete handoff and local improvement details without a completion or mastery promotion', () => {
    let state = createGlasshouseSession(11, 'guided', 'history-handoff');
    state = command(state, {
      type: 'improvement',
      improvement: {
        action: 'Check a contradictory source before briefing.',
        owner: 'Private practice label',
        targetDate: '2026-09-28',
        retest: 'Use a different case when available.',
      },
    } as Omit<Command, 'commandId' | 'actor'>);
    state = command(state, {
      type: 'handoff',
      summary: 'Uncertainty remains.',
      owner: 'Relief commander',
      reviewTrigger: 'Direct update',
    } as Omit<Command, 'commandId' | 'actor'>);
    const before = canonicalGlasshouseState(state);
    const summary = projectGlasshousePractice(state);
    expect(summary.lifecycle).toBe('incomplete');
    expect(summary.statusLabel).toContain('Partial');
    expect(summary.observations[2].status).toBe('recorded-in-this-case');
    expect(summary.observations[2].detail).toContain('partial or incomplete');
    expect(summary.improvement).toEqual(state.improvement);
    expect(summary.retention).toBe('not-established');
    expect(canonicalGlasshouseState(state)).toBe(before);
  });

  it('labels immediate forks as same-case exploration even when save timestamps are 28 days apart', () => {
    const state = command(createGlasshouseSession(5, 'guided', 'history-fork'), {
      type: 'plan',
      plan: verification,
    } as Omit<Command, 'commandId' | 'actor'>);
    const fork = forkGlasshouse(state, state.decisions[0].id, 'practice-alternative');
    const first = projectGlasshousePractice(state, Date.UTC(2026, 8, 6));
    const second = projectGlasshousePractice(fork, Date.UTC(2026, 9, 4));
    const comparison = compareGlasshousePractice(first, second);
    expect(second.parentSessionId).toBe(state.sessionId);
    expect(second.practiceNote).toContain('immediate replay');
    expect(second.retention).toBe('not-established');
    expect(comparison.lastSaveGapMs).toBe(28 * 86_400_000);
    expect(comparison.intervalNote).toContain('not a verified interval');
    expect(comparison.conclusion).toContain('do not establish retention');
  });

  it('allows only compatible context and exposes differences in mode, assistance, versions and opportunity exposure', () => {
    const one = projectGlasshousePractice(createGlasshouseSession(6, 'guided', 'history-one'));
    const two = projectGlasshousePractice(createGlasshouseSession(6, 'guided', 'history-two'));
    expect(compareGlasshousePractice(one, two).compatible).toBe(true);
    const changed = {
      ...two,
      mode: 'independent' as const,
      assistance: ['extra briefing help'],
      simulatedMinutes: 8,
      versions: { ...two.versions, rubric: 'later-rubric' },
      exposureKey: 'different-observations',
    };
    const comparison = compareGlasshousePractice(one, changed);
    expect(comparison.compatible).toBe(false);
    expect(comparison.reasons).toHaveLength(5);
    expect(comparison.label).toContain('Context only');
    expect(comparison.conclusion).toContain('No ranking');
    expect(compareGlasshousePractice(one, one).reasons).toContain(
      'These are the same saved session.'
    );
  });

  it('creates a frozen saved report without writing or changing the session, and explains missing active time', () => {
    const session = createGlasshouseSession(1, 'guided', 'history-report');
    const before = canonicalGlasshouseState(session);
    const report = getGlasshousePracticeReport({
      sessionId: session.sessionId,
      lastSavedAt: null,
      activePlaySeconds: null,
      isCurrentCheckpoint: false,
      originalText: serializeGlasshouseSession(session),
      validation: 'valid',
      session,
    });
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.events)).toBe(true);
    expect(report.lifecycle).toBe('active');
    expect(
      report.limitations.some((limitation) => limitation.includes('not a measured duration'))
    ).toBe(true);
    expect(canonicalGlasshouseState(session)).toBe(before);
  });
});
