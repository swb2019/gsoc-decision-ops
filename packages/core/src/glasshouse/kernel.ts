import {
  GLASSHOUSE_CONTROLS,
  GLASSHOUSE_RELEASES,
  GLASSHOUSE_VERSIONS,
  glasshouseEvidence,
} from './content.js';
import type {
  Action,
  ActorId,
  Command,
  DomainEvent,
  Mode,
  Observation,
  Plan,
  ScheduledEvent,
  Session,
} from './types.js';

/** FNV-1a keyed draws are stable per causal identity; cosmetic/random callers cannot advance them. */
export function glasshouseRandom(seed: number, eventKey: string, occurrence = 0): number {
  let hash = (2166136261 ^ seed) >>> 0;
  for (const char of `${eventKey}:${occurrence}`)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 4294967296;
}
function emit(
  state: Session,
  type: string,
  payload: Record<string, unknown>,
  actorId: ActorId = 'commander',
  causalParentIds: string[] = []
): DomainEvent {
  const sequence = state.events.length + 1;
  const event: DomainEvent = {
    eventId: `${state.sessionId}:e${sequence}`,
    sessionId: state.sessionId,
    sequence,
    simulatedAt: state.tick,
    type,
    actorId,
    payload,
    causalParentIds,
    schemaVersion: 1,
  };
  state.events.push(event);
  return event;
}
function schedule(state: Session, item: Omit<ScheduledEvent, 'order'>): void {
  state.queue.push({ ...item, order: state.events.length + state.queue.length });
  state.queue.sort(
    (a, b) =>
      a.at - b.at || a.priority - b.priority || a.order - b.order || a.id.localeCompare(b.id)
  );
}
function reveal(state: Session, observation: Observation, parents: string[] = []): void {
  if (state.observations.some((item) => item.id === observation.id)) return;
  state.observations.push(observation);
  for (const actor of observation.knownBy) state.actorKnowledge[actor].push(observation.id);
  emit(
    state,
    observation.corrects ? 'observation.corrected' : 'observation.received',
    { observationId: observation.id, claim: observation.claim },
    observation.source.includes('Elias') ? 'cyber' : 'analyst',
    parents
  );
}
export function createGlasshouseSession(
  seed: number,
  mode: Mode,
  sessionId = `glasshouse-${seed.toString(16)}-${mode}`
): Session {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error('Seed must be a full unsigned 32-bit integer.');
  if (!['preview', 'guided', 'independent'].includes(mode))
    throw new Error('Unknown practice mode.');
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(sessionId)) throw new Error('Invalid session identifier.');
  const state: Session = {
    schemaVersion: 1,
    sessionId,
    seed,
    initialMode: mode,
    mode,
    scenarioVersion: GLASSHOUSE_VERSIONS.scenario,
    rubricVersion: GLASSHOUSE_VERSIONS.rubric,
    rulesVersion: GLASSHOUSE_VERSIONS.rules,
    assetsVersion: GLASSHOUSE_VERSIONS.assets,
    tick: 0,
    paused: true,
    lifecycle: 'active',
    world: {
      connector: glasshouseRandom(seed, 'initial-connector') < 0.5 ? 'fault' : 'compromise',
      image: glasshouseRandom(seed, 'initial-image') < 0.5 ? 'stale' : 'current',
      capacity: glasshouseRandom(seed, 'initial-capacity') < 0.5 ? 'adequate' : 'constrained',
      owner: glasshouseRandom(seed, 'initial-owner') < 0.5 ? 'available' : 'delayed',
    },
    observations: [],
    actorKnowledge: { commander: [], analyst: [], cyber: [], owner: [] },
    decisions: [],
    actions: [],
    events: [],
    queue: [],
    resources: { guard: null, analyst: null, responder: null },
    commands: [],
    assistance: [],
    disputes: [],
    ledger: {
      exposureId: 'glasshouse-access-hour-1',
      currency: 'USD',
      horizon: 'first simulated hour',
      baselineLossCents: 12000000,
      residualLossCents: 12000000,
      treatmentCostCents: 0,
      avoidedLossCents: 0,
      netBenefitCents: 0,
      roiPercent: null,
      assumptions: [
        'Synthetic common one-hour exposure: USD 120,000 expected loss without a control; illustrative range USD 60,000–180,000.',
        'Completed control periods reduce only the same exposure; reductions use the strongest applicable control per minute, never their sum.',
        'Guard labor, investigation and committed control costs remain after cancellation. No activity, speed or documentation multipliers.',
        'Life safety and authority are separate constraints and cannot be exchanged for modeled money.',
      ],
    },
  };
  emit(state, 'session.started', { seed, mode, versions: GLASSHOUSE_VERSIONS });
  for (const id of ['reader-alert', 'vendor-alert', 'shipment'])
    reveal(state, glasshouseEvidence(state, id));
  for (const [id, at] of GLASSHOUSE_RELEASES)
    schedule(state, {
      id: `release-${id}`,
      at,
      priority: 10,
      kind: 'evidence',
      ref: id,
      parentIds: [],
    });
  schedule(state, {
    id: 'dispatch-deadline',
    at: 30,
    priority: 20,
    kind: 'deadline',
    ref: 'dispatch',
    parentIds: [],
  });
  schedule(state, {
    id: 'session-horizon',
    at: 60,
    priority: 30,
    kind: 'deadline',
    ref: 'horizon',
    parentIds: [],
  });
  return state;
}

export function getGlasshouseObservations(
  state: Session,
  actor: ActorId = 'commander',
  at = state.tick
): Observation[] {
  const shared =
    actor === 'owner'
      ? state.events
          .filter((e) => e.simulatedAt <= at && ['owner.notified', 'brief.sent'].includes(e.type))
          .flatMap((e) => (e.payload.evidenceIds as string[] | undefined) || [])
      : [];
  return state.observations
    .filter(
      (item) => item.receivedAt <= at && (item.knownBy.includes(actor) || shared.includes(item.id))
    )
    .map((item) => structuredClone(item));
}
const activeAction = (a: Action): boolean =>
  ['requested', 'approved', 'started'].includes(a.status);
function hasFinished(state: Session, control: Action['control']): boolean {
  return state.actions.some(
    (a) =>
      a.control === control &&
      a.status === 'completed' &&
      a.startedAt !== undefined &&
      state.events.some((e) => e.type === 'action.completed' && e.payload.actionId === a.id)
  );
}
function known(state: Session, id: string): boolean {
  return state.actorKnowledge.commander.includes(id);
}
function releaseResources(state: Session, action: Action): void {
  for (const resource of action.resources)
    if (state.resources[resource] === action.id) state.resources[resource] = null;
}
function evidenceValid(state: Session, ids: string[]): boolean {
  return (
    Array.isArray(ids) &&
    ids.every((id) => typeof id === 'string' && known(state, id)) &&
    new Set(ids).size === ids.length
  );
}
function validatePlan(state: Session, plan: Plan): string | undefined {
  const keys = [
    'control',
    'scope',
    'posture',
    'treatments',
    'authority',
    'evidenceIds',
    'rationale',
    'assumption',
    'hypothesis',
    'likelihood',
    'confidence',
    'alternative',
    'reviewTrigger',
    'uncertainty',
    'notify',
  ];
  if (Object.keys(plan).some((key) => !keys.includes(key)))
    return 'The plan contains an unsupported field.';
  const control = GLASSHOUSE_CONTROLS.find((item) => item.id === plan.control);
  if (!control) return 'Choose an available control.';
  if (plan.scope !== control.scope)
    return `This control applies to ${control.scope}. Choose that scope.`;
  if (!['CONTINUE', 'DEGRADE', 'PAUSE'].includes(plan.posture))
    return 'Choose an operational posture.';
  if (
    !Array.isArray(plan.treatments) ||
    !plan.treatments.length ||
    new Set(plan.treatments).size !== plan.treatments.length ||
    plan.treatments.some((t) => !['MITIGATE', 'ACCEPT', 'TRANSFER', 'AVOID'].includes(t))
  )
    return 'Choose at least one explicit risk treatment.';
  if (!['delegated', 'approval', 'recommendation', 'emergency'].includes(plan.authority))
    return 'Declare the authority for this action.';
  if (!evidenceValid(state, plan.evidenceIds))
    return 'Evidence must reference distinct observations received before this decision.';
  if (
    !['unknown', 'unlikely', 'plausible', 'likely'].includes(plan.likelihood) ||
    !['low', 'moderate', 'high'].includes(plan.confidence) ||
    !['unverified', 'conflicting', 'bounded'].includes(plan.uncertainty)
  )
    return 'Record likelihood, confidence and uncertainty separately.';
  if (typeof plan.notify !== 'boolean') return 'Choose whether to notify the owner.';
  for (const field of [
    'rationale',
    'assumption',
    'hypothesis',
    'alternative',
    'reviewTrigger',
  ] as const) {
    if (
      typeof plan[field] !== 'string' ||
      plan[field].length > (field === 'rationale' ? 2000 : 1000)
    )
      return `${field} exceeds the supported text limit.`;
  }
  return undefined;
}
function validateExecution(state: Session, plan: Plan): string | undefined {
  const control = GLASSHOUSE_CONTROLS.find((item) => item.id === plan.control)!;
  if (control.needsApproval && plan.authority === 'delegated')
    return 'This scope exceeds delegated authority. Request approval, recommend it, or choose manual verification as a delegated fallback.';
  if (
    plan.authority === 'emergency' &&
    (plan.control !== 'pause-dispatch' ||
      !plan.rationale.trim() ||
      !plan.evidenceIds.includes('image') ||
      known(state, 'image-correction'))
  )
    return 'Emergency authority permits only a temporary dispatch pause with a recorded basis in the unresolved entrance image. Otherwise request owner approval.';
  if (
    plan.control === 'restore-connector' &&
    (!hasFinished(state, 'isolate-connector') ||
      !hasFinished(state, 'investigate-connector') ||
      !known(state, 'vendor-repair'))
  )
    return 'First establish connector scope, isolate it, and receive the vendor repair notice. The cyber lead can then validate restoration.';
  if (
    state.actions.some(
      (a) =>
        a.control === plan.control &&
        (activeAction(a) ||
          (a.status === 'completed' && a.expiresAt !== undefined && a.expiresAt > state.tick))
    )
  )
    return 'This control is already pending or active. Inspect or cancel the existing commitment before replacing it.';
  if (plan.authority !== 'recommendation' && plan.authority !== 'approval') {
    const busy = control.resources.find((resource) => state.resources[resource]);
    if (busy)
      return `The ${busy} is committed. Wait for its update or cancel that assignment first.`;
  }
  return undefined;
}
function startAction(state: Session, action: Action): void {
  const control = GLASSHOUSE_CONTROLS.find((item) => item.id === action.control)!;
  const busy = action.resources.find(
    (resource) => state.resources[resource] && state.resources[resource] !== action.id
  );
  if (busy) {
    action.status = 'failed';
    action.result = `Approval received, but the ${busy} is now committed. Re-plan or release that resource.`;
    emit(state, 'action.failed', { actionId: action.id, result: action.result }, action.owner, [
      action.eventId,
    ]);
    return;
  }
  action.status = 'started';
  action.startedAt = state.tick;
  action.expectedUpdate = state.tick + control.leadTime;
  action.costCents = control.costCents;
  for (const resource of action.resources) state.resources[resource] = action.id;
  const event = emit(
    state,
    'action.started',
    { actionId: action.id, expectedUpdate: action.expectedUpdate, impact: control.impact },
    action.owner,
    [action.eventId]
  );
  schedule(state, {
    id: `complete-${action.id}`,
    at: action.expectedUpdate,
    priority: 5,
    kind: 'complete',
    ref: action.id,
    parentIds: [event.eventId],
  });
}
function completeAction(state: Session, action: Action, parents: string[]): void {
  if (action.status !== 'started') return;
  const control = GLASSHOUSE_CONTROLS.find((item) => item.id === action.control)!;
  action.status = 'completed';
  const restoreOccurrence =
    state.actions.filter(
      (a) =>
        a.control === 'restore-connector' &&
        state.actions.indexOf(a) <= state.actions.indexOf(action)
    ).length - 1;
  const failure =
    action.control === 'restore-connector' &&
    glasshouseRandom(state.seed, `restore:${action.scope}`, restoreOccurrence) < 0.15;
  if (failure) {
    action.status = 'failed';
    action.result =
      'Validation still finds an inconsistent identity path. The connector remains isolated; a sound recovery check prevented premature restoration.';
  } else
    action.result = {
      'verify-entrance': 'Direct entrance check received. Mobile patrol coverage is restored.',
      'investigate-connector':
        'Connector scope investigation received. The analyst is available again.',
      'manual-access':
        state.world.capacity === 'constrained'
          ? 'Manual verification is active, but arrival demand exceeds capacity. The queue grows while the guard stays committed.'
          : 'Manual verification is active. Current arrivals fit the available capacity.',
      'isolate-connector':
        'Vendor connector isolated. Cached badges remain usable; new vendor identities need manual checks.',
      'pause-dispatch':
        'Affected dispatch held temporarily. Monitor the receiving deadline and reversal condition.',
      monitor: 'Dispatch continues. Monitoring does not itself establish connector integrity.',
      'restore-connector':
        'Local validation succeeded. Connector service is restored; continue monitoring the affected identity path.',
    }[action.control];
  const event = emit(
    state,
    `action.${action.status}`,
    { actionId: action.id, control: action.control, result: action.result },
    action.owner,
    parents
  );
  if (control.duration && !failure) {
    action.expiresAt = state.tick + control.duration;
    schedule(state, {
      id: `expire-${action.id}`,
      at: action.expiresAt,
      priority: 4,
      kind: 'expire',
      ref: action.id,
      parentIds: [event.eventId],
    });
  } else releaseResources(state, action);
  if (action.control === 'verify-entrance')
    reveal(
      state,
      {
        id: `guard-check-${action.id}`,
        claim:
          state.world.image === 'stale'
            ? 'The guard reports a clear service entrance. No crowd or forced entry is observed at this time.'
            : 'The guard reports an orderly shift-change queue. No forced entry is observed at this time.',
        source: 'Mobile guard · direct observation',
        observedAt: state.tick,
        receivedAt: state.tick,
        asset: 'entrance',
        provenance: 'Dispatched guard check in this synthetic exercise.',
        limitation: 'A clear entrance does not prove connector integrity or future safety.',
        status: 'confirmed',
        knownBy: ['commander', 'analyst'],
        corroborates: ['reader-alert'],
        contradicts: known(state, 'image') ? ['image'] : [],
      },
      [event.eventId]
    );
  if (action.control === 'investigate-connector')
    reveal(
      state,
      {
        id: `scope-check-${action.id}`,
        claim:
          state.world.connector === 'compromise'
            ? 'Log comparison finds an unauthorized connector token used against the vendor identity path. Evidence supports a scoped compromise; cached local readers are unaffected.'
            : 'Log comparison finds a connector clock fault. No unauthorized token use is observed in the reviewed interval; cached local readers are unaffected.',
        source: 'Elias Reed · scoped log comparison',
        observedAt: state.tick,
        receivedAt: state.tick,
        asset: 'connector',
        provenance: 'Authored bounded investigation result.',
        limitation:
          'The reviewed interval and connector scope do not prove the entire campus is clear.',
        status: 'confirmed',
        knownBy: ['commander', 'analyst', 'cyber'],
        corroborates: ['vendor-alert'],
        contradicts: [],
      },
      [event.eventId]
    );
}
function processDue(state: Session): void {
  let count = 0;
  while (state.queue.length && state.queue[0].at <= state.tick) {
    if (++count > 10000) throw new Error('Scenario queue exceeded its validated bound.');
    const task = state.queue.shift()!;
    if (task.parentIds.some((id) => !state.events.some((event) => event.eventId === id)))
      throw new Error('A scheduled effect is missing its causal prerequisite.');
    if (task.kind === 'evidence')
      reveal(state, glasshouseEvidence(state, task.ref), task.parentIds);
    else if (task.kind === 'deadline') {
      if (task.ref === 'dispatch') {
        const held = state.actions.some(
          (a) =>
            a.control === 'pause-dispatch' &&
            a.status === 'completed' &&
            (a.expiresAt || 0) > state.tick
        );
        const exposed =
          state.world.connector === 'compromise' &&
          !hasFinished(state, 'isolate-connector') &&
          !hasFinished(state, 'manual-access');
        emit(
          state,
          'deadline.dispatch',
          {
            result: held
              ? 'The dispatch hold overlaps the receiving deadline. The delivery is delayed.'
              : exposed
                ? 'Dispatch proceeds with connector exposure unresolved. The shipment leaves, but identity assurance remains an open risk.'
                : 'The shipment is dispatched within the receiving window. Remaining identity questions still require a handoff.',
            held,
            exposed,
          },
          'owner'
        );
      } else {
        state.lifecycle = 'incomplete';
        state.terminalReason = 'The exercise hour ended without a recorded controlled handoff.';
        emit(state, 'session.incomplete', { reason: state.terminalReason });
      }
    } else {
      const action = state.actions.find((a) => a.id === task.ref);
      if (!action) throw new Error('Scheduled action is missing.');
      if (task.kind === 'complete') completeAction(state, action, task.parentIds);
      if (task.kind === 'expire' && action.status === 'completed') {
        action.status = 'expired';
        action.result =
          'The bounded control expired. Its resource is released; reassess before recommitting.';
        releaseResources(state, action);
        emit(
          state,
          'action.expired',
          { actionId: action.id, result: action.result },
          action.owner,
          task.parentIds
        );
      }
      if (task.kind === 'approval' && action.status === 'requested') {
        const decision = state.decisions.find((d) => d.id === action.decisionId)!;
        const grounded =
          decision.evidenceIds.some((id) => state.actorKnowledge.owner.includes(id)) &&
          decision.reviewTrigger.trim().length > 0;
        if (!grounded) {
          action.status = 'declined';
          action.result =
            'Jordan: I need a shared evidence reference and a review condition for this scope. You can revise the request or use delegated manual verification.';
          emit(
            state,
            'approval.declined',
            { actionId: action.id, result: action.result },
            'owner',
            task.parentIds
          );
        } else {
          action.status = 'approved';
          emit(
            state,
            'approval.granted',
            {
              actionId: action.id,
              scope: action.scope,
              expiresAt: state.tick + 10,
              result:
                'Jordan: Approved for this bounded scope. Keep the service impact and review condition visible.',
            },
            'owner',
            task.parentIds
          );
          startAction(state, action);
        }
      }
    }
  }
}

/** Independent exposure slices prevent repeat recommendations and overlapping controls from counting savings twice. */
export function reconcileGlasshouseLedger(state: Session): void {
  let protectedMinuteUnits = 0;
  for (let minute = 0; minute < 60; minute++) {
    let strongest = 0;
    for (const action of state.actions) {
      const completion = state.events.find(
        (e) => e.type === 'action.completed' && e.payload.actionId === action.id
      );
      if (!completion || completion.simulatedAt > minute) continue;
      const end = state.events.find(
        (e) =>
          ['action.cancelled', 'action.expired'].includes(e.type) &&
          e.payload.actionId === action.id
      );
      if (
        (end && end.simulatedAt <= minute) ||
        (action.expiresAt !== undefined && action.expiresAt <= minute)
      )
        continue;
      if (action.control === 'isolate-connector') {
        const restored = state.events.some(
          (e) =>
            e.type === 'action.completed' &&
            e.payload.control === 'restore-connector' &&
            e.simulatedAt <= minute &&
            e.simulatedAt >= completion.simulatedAt
        );
        if (!restored) strongest = Math.max(strongest, 0.75);
      }
      if (action.control === 'manual-access')
        strongest = Math.max(strongest, state.world.capacity === 'adequate' ? 0.45 : 0.2);
      if (action.control === 'pause-dispatch') strongest = Math.max(strongest, 0.35);
    }
    protectedMinuteUnits += strongest;
  }
  const ledger = state.ledger;
  ledger.treatmentCostCents = state.actions.reduce((sum, a) => sum + a.costCents, 0);
  ledger.avoidedLossCents = Math.round((ledger.baselineLossCents * protectedMinuteUnits) / 60);
  ledger.residualLossCents = ledger.baselineLossCents - ledger.avoidedLossCents;
  ledger.netBenefitCents = ledger.avoidedLossCents - ledger.treatmentCostCents;
  ledger.roiPercent =
    ledger.treatmentCostCents === 0
      ? null
      : (ledger.netBenefitCents / ledger.treatmentCostCents) * 100;
}

export function transitionGlasshouse(
  original: Session,
  command: Command
): { state: Session; events: DomainEvent[]; error?: string } {
  const fail = (error: string): { state: Session; events: DomainEvent[]; error: string } => ({
    state: original,
    events: [],
    error,
  });
  if (
    !command ||
    typeof command !== 'object' ||
    typeof command.commandId !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(command.commandId) ||
    command.actor !== 'commander'
  )
    return fail('A valid commander command and unique command ID are required.');
  let commandText: string;
  try {
    commandText = JSON.stringify(command);
  } catch {
    return fail('Commands must contain ordinary serializable practice data.');
  }
  if (/<\s*(script|iframe|object|embed)|\bon(?:load|error)\s*=|javascript\s*:/i.test(commandText))
    return fail('Executable markup is not accepted. Record this as ordinary practice text.');
  const duplicate = original.commands.find((c) => c.commandId === command.commandId);
  if (duplicate)
    return JSON.stringify(duplicate) === JSON.stringify(command)
      ? { state: original, events: [] }
      : fail('This command ID already belongs to a different action.');
  if (original.commands.length >= 10000)
    return fail(
      'This session reached its command limit. Export the record and begin a fresh session.'
    );
  if (original.lifecycle !== 'active' && !['improvement', 'dispute', 'help'].includes(command.type))
    return fail('This run has ended. Inspect its review or fork a separate approach.');
  const state = structuredClone(original);
  const before = state.events.length;
  if (command.type === 'plan') {
    if (!command.plan || typeof command.plan !== 'object')
      return fail('A complete plan is required.');
    const error = validatePlan(state, command.plan);
    if (error) return fail(error);
    if (command.revisionOf && !state.decisions.some((d) => d.id === command.revisionOf))
      return fail('The original decision for this correction is missing.');
    const refusal = validateExecution(state, command.plan);
    if (refusal) {
      emit(state, 'action.rejected', {
        commandId: command.commandId,
        control: command.plan.control,
        scope: command.plan.scope,
        authority: command.plan.authority,
        reason: refusal,
      });
      state.commands.push(structuredClone(command));
      return { state, events: state.events.slice(before), error: refusal };
    }
    const control = GLASSHOUSE_CONTROLS.find((c) => c.id === command.plan.control)!;
    const id = `d${state.decisions.length + 1}`;
    const actionId = `a${state.actions.length + 1}`;
    const event = emit(state, 'decision.committed', {
      decisionId: id,
      actionId,
      control: command.plan.control,
      treatments: command.plan.treatments,
      posture: command.plan.posture,
      authority: command.plan.authority,
      ...(command.revisionOf ? { revisionOf: command.revisionOf } : {}),
    });
    state.decisions.push({
      ...structuredClone(command.plan),
      id,
      actionId,
      eventId: event.eventId,
      at: state.tick,
      evidenceSnapshotId: `${state.sessionId}:snapshot:${event.sequence}`,
      knownEvidenceIds: [...state.actorKnowledge.commander],
      ...(command.revisionOf ? { revisionOf: command.revisionOf } : {}),
    });
    const request =
      command.plan.authority === 'approval' || command.plan.authority === 'recommendation';
    const action: Action = {
      id: actionId,
      decisionId: id,
      control: control.id,
      scope: control.scope,
      owner: control.owner,
      resources: [...control.resources],
      status: 'requested',
      expectedUpdate: state.tick + (state.world.owner === 'delayed' ? 6 : 2),
      costCents: 0,
      eventId: event.eventId,
    };
    state.actions.push(action);
    if (command.plan.notify || request) {
      for (const evidenceId of command.plan.evidenceIds)
        if (!state.actorKnowledge.owner.includes(evidenceId))
          state.actorKnowledge.owner.push(evidenceId);
      emit(
        state,
        'owner.notified',
        { decisionId: id, evidenceIds: command.plan.evidenceIds, approval: false },
        'commander',
        [event.eventId]
      );
    }
    if (command.plan.authority === 'recommendation') {
      action.status = 'completed';
      action.result =
        'Recommendation recorded and shared; no operational control was executed and no approval is implied.';
      emit(state, 'recommendation.recorded', { actionId, result: action.result }, 'commander', [
        event.eventId,
      ]);
    } else if (request) {
      const requestEvent = emit(
        state,
        'approval.requested',
        {
          actionId,
          expectedUpdate: action.expectedUpdate,
          result:
            state.world.owner === 'delayed'
              ? 'Jordan: In a continuity call. Request acknowledged; a response follows in 6 simulated minutes.'
              : 'Jordan: Request received. I will respond in 2 simulated minutes.',
        },
        'owner',
        [event.eventId]
      );
      schedule(state, {
        id: `approve-${actionId}`,
        at: action.expectedUpdate,
        priority: 3,
        kind: 'approval',
        ref: actionId,
        parentIds: [requestEvent.eventId],
      });
    } else startAction(state, action);
  } else if (command.type === 'advance') {
    if (!Number.isInteger(command.to) || command.to <= state.tick || command.to > 60)
      return fail('Advance to an integer minute later in this exercise hour.');
    if (
      state.mode === 'preview' &&
      state.actions.some((a) => ['completed', 'failed'].includes(a.status))
    )
      return fail(
        'Your first choice has a consequence. Open the partial review or continue the same mission.'
      );
    if (state.queue[0] && command.to > state.queue[0].at)
      return fail(
        `The next significant update is at minute ${state.queue[0].at}. Inspect it before advancing further.`
      );
    state.tick = command.to;
    emit(state, 'clock.advanced', { to: command.to });
    processDue(state);
  } else if (command.type === 'pause') {
    if (typeof command.paused !== 'boolean') return fail('Pause must be true or false.');
    state.paused = command.paused;
    emit(state, 'clock.pause-changed', { paused: command.paused });
  } else if (command.type === 'cancel') {
    const action = state.actions.find((a) => a.id === command.actionId);
    if (
      !action ||
      (!activeAction(action) &&
        !(action.status === 'completed' && action.expiresAt && action.expiresAt > state.tick))
    )
      return fail('Only a pending assignment or active bounded control can be cancelled.');
    action.status = 'cancelled';
    action.result = 'Cancelled. Resources released; already committed costs remain in the ledger.';
    releaseResources(state, action);
    state.queue = state.queue.filter((task) => task.ref !== action.id);
    emit(state, 'action.cancelled', { actionId: action.id, result: action.result }, 'commander', [
      action.eventId,
    ]);
  } else if (command.type === 'brief') {
    for (const field of [
      'recommendation',
      'uncertainty',
      'alternative',
      'consequence',
      'reviewTrigger',
    ] as const)
      if (typeof command[field] !== 'string' || command[field].length > 1000)
        return fail('Brief fields must be text of at most 1,000 characters.');
    if (
      !['entrance', 'connector', 'dispatch'].includes(command.scope) ||
      !evidenceValid(state, command.evidenceIds)
    )
      return fail('Brief scope or evidence is invalid.');
    for (const id of command.evidenceIds)
      if (!state.actorKnowledge.owner.includes(id)) state.actorKnowledge.owner.push(id);
    const missing = (
      ['recommendation', 'uncertainty', 'alternative', 'consequence', 'reviewTrigger'] as const
    ).filter((field) => !command[field].trim());
    const event = emit(state, 'brief.sent', {
      recommendation: command.recommendation,
      scope: command.scope,
      evidenceIds: command.evidenceIds,
      uncertainty: command.uncertainty,
      alternative: command.alternative,
      consequence: command.consequence,
      reviewTrigger: command.reviewTrigger,
      missing,
      approval: false,
    });
    emit(
      state,
      'brief.acknowledged',
      {
        result: missing.length
          ? `Jordan: Please add ${missing.join(', ')} so I can understand the proposal. This acknowledgment is not approval.`
          : 'Jordan: The proposal, uncertainty and business consequence are clear in the record. Submit an approval request for a control beyond your delegation; this acknowledgment does not authorize it.',
      },
      'owner',
      [event.eventId]
    );
  } else if (command.type === 'handoff') {
    for (const field of ['summary', 'owner', 'reviewTrigger'] as const)
      if (
        typeof command[field] !== 'string' ||
        !command[field].trim() ||
        command[field].length > 1000
      )
        return fail(
          'Handoff requires a summary, accountable owner and review condition, each within 1,000 characters.'
        );
    state.handoff = {
      summary: command.summary,
      owner: command.owner,
      reviewTrigger: command.reviewTrigger,
      at: state.tick,
    };
    const pending = state.actions.filter(activeAction);
    const controlled =
      state.tick >= 30 &&
      state.decisions.length >= 3 &&
      (hasFinished(state, 'verify-entrance') || hasFinished(state, 'investigate-connector')) &&
      pending.length === 0;
    state.lifecycle = controlled ? 'completed' : 'incomplete';
    state.paused = true;
    state.terminalReason = controlled
      ? 'Controlled handoff recorded after dispatch, with evidence verification and no unacknowledged pending action. Unresolved questions remain in the review.'
      : 'Early or unresolved handoff recorded. At least 30 simulated minutes, three consequential decisions, completed verification, and settled pending actions are needed for the authored terminal.';
    emit(state, 'handoff.recorded', {
      ...state.handoff,
      lifecycle: state.lifecycle,
      pendingActionIds: pending.map((a) => a.id),
    });
  } else if (command.type === 'help') {
    if (typeof command.topic !== 'string' || command.topic.length > 1000)
      return fail('Help topic exceeds the supported limit.');
    if (state.mode === 'independent')
      return fail(
        'Substantive coaching is disabled in Independent Practice. Accessibility and the handover remain available.'
      );
    state.assistance.push(command.topic);
    emit(state, 'help.used', { topic: command.topic });
  } else if (command.type === 'continue') {
    if (state.mode !== 'preview') return fail('Only a preview needs continuation.');
    state.mode = 'guided';
    emit(state, 'preview.continued', { mode: 'guided' });
  } else if (command.type === 'improvement') {
    if (!command.improvement || typeof command.improvement !== 'object')
      return fail('An improvement action is required.');
    if (
      Object.keys(command.improvement).some(
        (key) => !['action', 'owner', 'targetDate', 'retest'].includes(key)
      )
    )
      return fail('The improvement contains an unsupported field.');
    for (const field of ['action', 'owner', 'targetDate', 'retest'] as const)
      if (
        typeof command.improvement[field] !== 'string' ||
        command.improvement[field].length > 1000
      )
        return fail('Improvement fields must be text of at most 1,000 characters.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.improvement.targetDate))
      return fail('Choose a target date in YYYY-MM-DD format.');
    state.improvement = structuredClone(command.improvement);
    emit(state, 'improvement.recorded', { ...command.improvement });
  } else if (command.type === 'dispute') {
    if (
      typeof command.findingId !== 'string' ||
      !/^gh-[1-8]$/.test(command.findingId) ||
      typeof command.reason !== 'string' ||
      !command.reason.trim() ||
      command.reason.length > 1000
    )
      return fail('Select a real finding and record a reason within 1,000 characters.');
    const event = emit(state, 'finding.disputed', {
      findingId: command.findingId,
      reason: command.reason,
    });
    state.disputes.push({
      findingId: command.findingId,
      reason: command.reason,
      eventId: event.eventId,
    });
  } else return fail('Unknown command type.');
  state.commands.push(structuredClone(command));
  reconcileGlasshouseLedger(state);
  return { state, events: state.events.slice(before) };
}

/** Read-only checkpoint reconstruction. The original run and its future remain untouched. */
export function forkGlasshouse(source: Session, decisionId: string, branchId: string): Session {
  const target = source.decisions.find((d) => d.id === decisionId);
  if (!target) throw new Error('Select a recorded decision to explore an alternative.');
  if (branchId === source.sessionId)
    throw new Error('An alternative needs its own session identifier.');
  let branch = createGlasshouseSession(source.seed, source.initialMode, branchId);
  const targetIndex = source.decisions.indexOf(target);
  for (const command of source.commands) {
    const result = transitionGlasshouse(branch, command);
    if (result.error && !result.state.commands.some((c) => c.commandId === command.commandId))
      throw new Error(`Checkpoint replay failed: ${result.error}`);
    if (result.state.decisions.length > targetIndex) break;
    branch = result.state;
  }
  branch.parentSessionId = source.sessionId;
  branch.forkAt = target.at;
  return branch;
}
