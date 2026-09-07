import {
  GLASSHOUSE_CONTROLS,
  GLASSHOUSE_SUPPORTED_RUBRICS,
  GLASSHOUSE_SUPPORTED_RULES,
  GLASSHOUSE_SUPPORTED_ASSETS,
  GLASSHOUSE_VERSIONS,
} from './content.js';
import {
  createGlasshouseSession,
  getGlasshouseObservations,
  transitionGlasshouse,
} from './kernel.js';
import type { Command, Finding, Report, Session } from './types.js';

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export function canonicalGlasshouseState(state: Session): string {
  return stable(state);
}
export function glasshouseDigest(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
export function serializeGlasshouseSession(state: Session): string {
  return JSON.stringify({
    format: 'hourglass-session',
    version: 1,
    state,
    digest: glasshouseDigest(canonicalGlasshouseState(state)),
  });
}
function inspectData(value: unknown, depth = 0): void {
  if (depth > 24) throw new Error('Practice file exceeds the maximum nesting depth.');
  if (
    typeof value === 'string' &&
    /<\s*(script|iframe|object|embed)|\bon(?:load|error)\s*=|javascript\s*:/i.test(value)
  )
    throw new Error('Executable markup is not accepted in practice files.');
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key))
        throw new Error('Unsafe object key in practice file.');
      inspectData(item, depth + 1);
    }
  }
}
const commandKeys: Record<Command['type'], string[]> = {
  plan: ['plan', 'revisionOf'],
  advance: ['to'],
  pause: ['paused'],
  cancel: ['actionId'],
  brief: [
    'recommendation',
    'scope',
    'evidenceIds',
    'uncertainty',
    'alternative',
    'consequence',
    'reviewTrigger',
  ],
  handoff: ['summary', 'owner', 'reviewTrigger'],
  abandon: ['reason'],
  help: ['topic'],
  continue: [],
  improvement: ['improvement'],
  dispute: ['findingId', 'reason'],
};
export function restoreGlasshouseSession(text: string): Session {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 5 * 1024 * 1024)
    throw new Error('Practice imports are limited to 5 MB.');
  let parsed: { format?: string; version?: number; state?: Session; digest?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON. The existing run has not been changed.');
  }
  inspectData(parsed);
  if (!parsed || parsed.format !== 'hourglass-session' || parsed.version !== 1 || !parsed.state)
    throw new Error(
      'Unsupported practice file. Legacy records remain read-only; begin a fresh versioned run.'
    );
  const saved = parsed.state;
  if (
    saved.schemaVersion !== 1 ||
    saved.scenarioVersion !== GLASSHOUSE_VERSIONS.scenario ||
    !GLASSHOUSE_SUPPORTED_RUBRICS.some((version) => version === saved.rubricVersion) ||
    !GLASSHOUSE_SUPPORTED_RULES.some((version) => version === saved.rulesVersion) ||
    !GLASSHOUSE_SUPPORTED_ASSETS.some((version) => version === saved.assetsVersion)
  )
    throw new Error(
      'This session needs its original content and rule versions. It cannot be silently migrated.'
    );
  if (!Array.isArray(saved.commands) || saved.commands.length > 10000)
    throw new Error('Invalid command journal.');
  let replay = createGlasshouseSession(
    saved.seed,
    saved.initialMode,
    saved.sessionId,
    saved.rubricVersion,
    saved.rulesVersion,
    saved.assetsVersion
  );
  for (const command of saved.commands) {
    if (
      !command ||
      typeof command !== 'object' ||
      !Object.hasOwn(commandKeys, command.type) ||
      Object.keys(command).some(
        (key) => !['commandId', 'actor', 'type', ...commandKeys[command.type]].includes(key)
      )
    )
      throw new Error('Unknown or malformed command in the practice journal.');
    if (replay.commands.some((c) => c.commandId === command.commandId))
      throw new Error('A command occurs more than once in this journal.');
    let result: ReturnType<typeof transitionGlasshouse>;
    try {
      result = transitionGlasshouse(replay, command);
    } catch {
      throw new Error('Invalid command data. The existing run has not been changed.');
    }
    if (result.error && !result.state.commands.some((c) => c.commandId === command.commandId))
      throw new Error(`Practice journal cannot be replayed: ${result.error}`);
    replay = result.state;
  }
  if (saved.parentSessionId !== undefined) {
    if (
      !/^[a-zA-Z0-9_-]{1,100}$/.test(saved.parentSessionId) ||
      !Number.isInteger(saved.forkAt) ||
      saved.forkAt! < 0 ||
      saved.forkAt! > replay.tick
    )
      throw new Error('Invalid branch metadata.');
    replay.parentSessionId = saved.parentSessionId;
    replay.forkAt = saved.forkAt;
  }
  const canonical = canonicalGlasshouseState(replay);
  if (
    canonical !== canonicalGlasshouseState(saved) ||
    parsed.digest !== glasshouseDigest(canonical)
  )
    throw new Error(
      'The checkpoint and replayed commands disagree. Preserve this file as a recovery copy; it has not replaced the current run.'
    );
  return replay;
}

function findings(state: Session): Finding[] {
  const decisions = state.decisions;
  const base = (
    index: number,
    dimension: string,
    score: Finding['score'],
    explanation: string,
    eventIds: string[],
    boundary: string,
    human = false
  ): Finding => ({
    id: `gh-${index}`,
    dimension,
    score,
    result: human
      ? 'Not assessed automatically'
      : score === null
        ? 'Not observed'
        : score === 0
          ? 'Observed omission'
          : score === 1
            ? 'Partly observed'
            : 'Target behavior observed',
    explanation,
    eventIds,
    evidenceSnapshotIds: decisions
      .filter((d) => eventIds.includes(d.eventId))
      .map((d) => d.evidenceSnapshotId),
    evaluatorType: human ? 'human-review' : 'structured-rule',
    ruleVersion: `${state.rubricVersion}/gh-${index}`,
    boundary,
  });
  const evidence = decisions.filter((d) => d.evidenceIds.length > 0);
  const stale = decisions.filter(
    (d) =>
      d.evidenceIds.some((id) =>
        state.observations.some((o) => o.corrects === id && o.receivedAt <= d.at)
      ) && !d.evidenceIds.includes('image-correction')
  );
  const pending = state.actions.filter((a) =>
    ['requested', 'started', 'approved'].includes(a.status)
  );
  const approvals = state.events.filter((e) =>
    ['approval.granted', 'approval.declined'].includes(e.type)
  );
  const monitored = decisions.filter((d) => d.reviewTrigger.trim());
  const verified = state.events.filter(
    (e) =>
      e.type === 'action.completed' &&
      ['verify-entrance', 'investigate-connector', 'restore-connector'].includes(
        String(e.payload.control)
      )
  );
  const allIds = decisions.map((d) => d.eventId);
  const briefs = state.events.filter((e) => e.type === 'brief.sent');
  return [
    base(
      1,
      'Evidence and source handling',
      !decisions.length
        ? null
        : stale.length
          ? 0
          : evidence.length === decisions.length
            ? 2
            : evidence.length
              ? 1
              : 0,
      stale.length
        ? 'A decision cited a report already corrected without citing its correction. Inspect what was known then.'
        : `${evidence.length} of ${decisions.length} decisions reference actual observations available at commitment.`,
      allIds,
      'Checks reference availability and corrections only; citing evidence does not establish a sound interpretation.'
    ),
    base(
      2,
      'Uncertainty and alternatives',
      null,
      `${decisions.filter((d) => d.alternative.trim()).length} alternatives and ${decisions.filter((d) => d.assumption.trim()).length} assumptions are preserved for reflection. Likelihood and confidence are distinct.`,
      allIds,
      'The meaning and quality of free text require human review; length, keywords and a favorable outcome receive no quality credit.',
      true
    ),
    base(
      3,
      'Proportionality and reversibility',
      null,
      `${decisions.filter((d) => ['manual-access', 'pause-dispatch'].includes(d.control)).length} bounded-control choices are available for review against known-then conditions.`,
      allIds,
      'Multiple strategies can be defensible. The model does not infer proportionality from posture labels.',
      true
    ),
    base(
      4,
      'Asset and business impact',
      null,
      'Compare the recorded scope, displaced coverage, dispatch deadline and synthetic ledger with the stated business consequence.',
      [
        ...allIds,
        ...state.events.filter((e) => e.type === 'deadline.dispatch').map((e) => e.eventId),
      ],
      'Operational outcomes and synthetic money are separate from judgment. Business reasoning requires human interpretation.',
      true
    ),
    base(
      5,
      'Authority and escalation',
      !decisions.length ? null : 2,
      pending.some((a) => a.status === 'requested')
        ? 'Approval remains pending and has correctly not been treated as execution. A delayed owner response does not reduce process feedback.'
        : 'Committed actions passed the scenario’s delegated, approval, recommendation or emergency authority checks. Notifications do not count as approval.',
      [
        ...allIds,
        ...approvals.map((e) => e.eventId),
        ...state.events.filter((e) => e.type === 'action.rejected').map((e) => e.eventId),
      ],
      'Observes procedural authorization of accepted actions only. Rejected attempts remain in the trace. An emergency declaration still requires human review of proportionality.'
    ),
    base(
      6,
      'Concise communication',
      null,
      briefs.length
        ? `${briefs.length} structured brief(s) retain recommendation, scope, evidence, uncertainty, alternative, consequence and review condition.`
        : 'No structured stakeholder brief was recorded. This is a missing observation, not a diagnosis of ability.',
      briefs.map((e) => e.eventId),
      'Completing fields does not establish communication quality. Authored acknowledgments are not independent assessment.',
      true
    ),
    base(
      7,
      'Verification and monitoring',
      !decisions.length
        ? null
        : verified.length && monitored.length
          ? 2
          : verified.length || monitored.length
            ? 1
            : 0,
      `${verified.length} completed verification actions and ${monitored.length} recorded review commitments. ${pending.length} actions remain pending.`,
      [...allIds, ...verified.map((e) => e.eventId)],
      'Observes completed checks and recorded triggers only. Whether a trigger is meaningful or a check was worth its cost requires human review.'
    ),
    base(
      8,
      'Recovery and follow-through',
      !state.handoff ? null : state.lifecycle === 'completed' ? 2 : 1,
      state.handoff
        ? `An accountable handoff was recorded at minute ${state.handoff.at}. ${state.terminalReason}`
        : 'A handoff has not been observed. Opening this review does not complete the exercise.',
      state.events.filter((e) => e.type === 'handoff.recorded').map((e) => e.eventId),
      'Completion means the authored handoff conditions were met; it is not professional readiness or retained skill.'
    ),
  ];
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
export function getGlasshouseReport(
  state: Session,
  activePlaySeconds = 0,
  redacted = false
): Report {
  const report: Report = {
    reportVersion: 1,
    executiveBrief: {
      objective:
        'Protect people, preserve essential operations, establish scope and hand over a controlled Glasshouse campus situation.',
      pivotalDecisions: [
        state.decisions[0],
        ...(state.decisions.length > 1 ? [state.decisions.at(-1)!] : []),
      ]
        .filter(Boolean)
        .map(
          (d) =>
            `Minute ${d.at}: ${GLASSHOUSE_CONTROLS.find((c) => c.id === d.control)?.label}. ${d.posture}; treatments ${d.treatments.join(' + ')}; ${d.authority}. Evidence: ${d.eventId}.`
        ),
      observedBehavior: findings(state)
        .filter((f) => f.score === 2)
        .map((f) => `${f.dimension}: ${f.explanation} (${f.ruleVersion})`),
      nextPractice:
        state.improvement?.action ||
        'Choose one action to repeat and one assumption or follow-through condition to revisit in another approach.',
    },
    sessionId: state.sessionId,
    scenario: 'Glasshouse / 06:10',
    versions: {
      scenario: state.scenarioVersion,
      rubric: state.rubricVersion,
      rules: state.rulesVersion,
      assets: state.assetsVersion,
    },
    mode: state.mode,
    assistance: [...state.assistance],
    simulatedMinutes: state.tick,
    activePlaySeconds: Math.max(0, Math.floor(activePlaySeconds)),
    lifecycle: state.lifecycle,
    terminalReason: state.terminalReason,
    decisions: structuredClone(state.decisions),
    observations: getGlasshouseObservations(state),
    events: structuredClone(state.events),
    actions: structuredClone(state.actions),
    findings: findings(state),
    ledger: structuredClone(state.ledger),
    unresolved: [
      ...state.actions
        .filter((a) => ['requested', 'started', 'approved'].includes(a.status))
        .map(
          (a) =>
            `${a.id}: ${a.control} ${a.status}; ${a.owner} expected update at minute ${a.expectedUpdate}.`
        ),
      ...state.actions
        .filter(
          (a) => a.status === 'completed' && a.expiresAt !== undefined && a.expiresAt > state.tick
        )
        .map(
          (a) =>
            `${a.id}: bounded control expires at minute ${a.expiresAt}; handoff must retain its review condition.`
        ),
      ...(!state.observations.some((o) => o.id.startsWith('scope-check-'))
        ? ['Connector scope has not been independently investigated.']
        : []),
      ...(!state.observations.some((o) => o.id.startsWith('guard-check-'))
        ? ['No direct entrance verification has been received.']
        : []),
      ...(!state.handoff ? ['An accountable handoff remains outstanding.'] : []),
      ...state.observations
        .filter(
          (o) =>
            o.corrects &&
            state.events.some(
              (e) =>
                (state.rubricVersion === 'observable-1.0.0'
                  ? e.type === 'owner.notified'
                  : ['owner.notified', 'brief.sent'].includes(e.type)) &&
                e.simulatedAt < o.receivedAt &&
                (e.payload.evidenceIds as string[] | undefined)?.includes(o.corrects!)
            ) &&
            !state.actorKnowledge.owner.includes(o.id)
        )
        .map(
          (o) =>
            `The owner received ${o.corrects} before correction ${o.id}; send an updated brief.`
        ),
    ],
    ...(state.improvement ? { improvement: structuredClone(state.improvement) } : {}),
    ...(state.handoff ? { handoff: structuredClone(state.handoff) } : {}),
    ...(state.abandonment ? { abandonment: structuredClone(state.abandonment) } : {}),
    disputes: structuredClone(state.disputes),
    limitations: [
      ...(state.rulesVersion === 'kernel-1.0.0'
        ? [
            'Historical rules kernel-1.0.0: original lifecycle and commands are preserved for read-only review. This version did not distinguish voluntarily ended practice. A fresh run under kernel-1.1.0 supports an explicit abandoned state.',
          ]
        : []),
      ...(state.assetsVersion !== GLASSHOUSE_VERSIONS.assets
        ? [
            `Historical assets ${state.assetsVersion}: the original presentation version remains pinned to this record; current optional audio has not changed its assessment.`,
          ]
        : []),
      ...(state.rubricVersion === 'observable-1.0.0'
        ? [
            'Historical rubric observable-1.0.0: original assessment preserved for read-only review. This version omitted an owner correction reminder when the original report was shared only through a structured brief. The observable-1.0.1 correction applies to fresh runs; this record has not been regraded.',
          ]
        : []),
      'Synthetic educational practice. Independent content/rubric calibration and formative user studies remain pending; no efficacy, certification, employer endorsement or real-world readiness is claimed.',
      'Structured rules observe a limited set of recorded behaviors. Interpretive reasoning is not automatically assessed; outcomes can include luck.',
      'The client-side world and unsigned records are inspectable and editable. The digest detects accidental changes, not authorship or tamper resistance.',
      'The ledger is a modeled common first-hour exposure, not actual loss savings, a forecast or professional financial advice.',
      'Active play time is descriptive local metadata. It is separate from simulated time and export time.',
      'HTML is the canonical accessible report. Text PDF is not claimed to meet tagged-PDF accessibility requirements.',
    ],
    redacted,
    canonicalDigest: glasshouseDigest(canonicalGlasshouseState(state)),
  };
  if (redacted) {
    if (state.improvement) report.executiveBrief.nextPractice = '[removed for sharing]';
    for (const decision of report.decisions)
      for (const key of [
        'rationale',
        'assumption',
        'hypothesis',
        'alternative',
        'reviewTrigger',
      ] as const)
        decision[key] = '[removed for sharing]';
    report.assistance = report.assistance.map(() => '[help used]');
    if (report.improvement)
      report.improvement = {
        action: '[removed for sharing]',
        owner: '[removed for sharing]',
        targetDate: report.improvement.targetDate,
        retest: '[removed for sharing]',
      };
    if (report.handoff)
      report.handoff = {
        summary: '[removed for sharing]',
        owner: '[removed for sharing]',
        reviewTrigger: '[removed for sharing]',
        at: report.handoff.at,
      };
    for (const dispute of report.disputes) dispute.reason = '[removed for sharing]';
    if (report.abandonment)
      report.abandonment = { reason: '[removed for sharing]', at: report.abandonment.at };
    const safeKeys = new Set([
      'seed',
      'mode',
      'decisionId',
      'actionId',
      'control',
      'treatments',
      'posture',
      'authority',
      'scope',
      'evidenceIds',
      'observationId',
      'expectedUpdate',
      'expiresAt',
      'to',
      'paused',
      'approval',
      'lifecycle',
      'pendingActionIds',
    ]);
    report.events = report.events.map((event) => ({
      ...event,
      payload: Object.fromEntries(
        Object.entries(event.payload).filter(([key]) => safeKeys.has(key))
      ),
    }));
  }
  return deepFreeze(report);
}
