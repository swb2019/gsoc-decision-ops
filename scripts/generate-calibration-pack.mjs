import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {
  createGlasshouseSession,
  transitionGlasshouse,
  serializeGlasshouseSession,
  restoreGlasshouseSession,
  canonicalGlasshouseState,
  getGlasshouseReport,
  GLASSHOUSE_VERSIONS,
  GLASSHOUSE_CONTROLS,
  GLASSHOUSE_HANDOVER,
} from '../packages/core/dist/index.js';
import {
  CALIBRATION_VERSIONS,
  CALIBRATION_DIMENSIONS,
  CALIBRATION_CRITICAL_TASKS,
  DEVELOPMENT_VIGNETTES,
  HELDOUT_CANDIDATES,
} from '../release/calibration-vignettes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'qa-output', 'calibration');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const pretty = (value) => `${JSON.stringify(value, null, 2)}\n`;
const markdown = (value) => String(value ?? '').replace(/[\\`*_{}\[\]<>#|]/g, '\\$&');
const json = async (file, value) => writeFile(file, pretty(value), 'utf8');
const numbered = (value) => String(value).padStart(3, '0');
const versions = { ...GLASSHOUSE_VERSIONS };
assert.deepEqual(
  versions,
  CALIBRATION_VERSIONS,
  'Core versions changed: revise and explicitly re-freeze engineering definitions before regeneration.'
);
assert.equal(DEVELOPMENT_VIGNETTES.length, 12);
assert.equal(HELDOUT_CANDIDATES.length, 8);
assert.equal(
  new Set(
    [...DEVELOPMENT_VIGNETTES, ...HELDOUT_CANDIDATES].map((definition) =>
      JSON.stringify(definition.steps)
    )
  ).size,
  20,
  'Each vignette must have a distinct authored command sequence.'
);

function assertEngineeringFacts(definition, session) {
  const facts = definition.engineeringAssertions;
  const check = (actual, expected, label) =>
    assert.deepEqual(actual, expected, `${definition.id}: ${label}`);
  for (const [key, value] of Object.entries(facts.world ?? {}))
    check(session.world[key], value, `scenario ${key}`);
  for (const key of ['tick', 'lifecycle'])
    if (facts[key] !== undefined) check(session[key], facts[key], key);
  for (const [id, status] of Object.entries(facts.actionStatuses ?? {}))
    check(
      session.actions.find((action) => action.id === id)?.status,
      status,
      `action ${id} status`
    );
  for (const [id, minute] of Object.entries(facts.actionExpectedUpdates ?? {}))
    check(
      session.actions.find((action) => action.id === id)?.expectedUpdate,
      minute,
      `action ${id} expected update`
    );
  if (facts.rejectedCount !== undefined)
    check(
      session.events.filter((event) => event.type === 'action.rejected').length,
      facts.rejectedCount,
      'rejected attempt count'
    );
  if (facts.revisionCount !== undefined)
    check(
      session.decisions.filter((decision) => decision.revisionOf).length,
      facts.revisionCount,
      'decision revision count'
    );
  for (const id of facts.ownerKnows ?? [])
    assert.ok(session.actorKnowledge.owner.includes(id), `${definition.id}: owner must know ${id}`);
  for (const id of facts.ownerDoesNotKnow ?? [])
    assert.ok(
      !session.actorKnowledge.owner.includes(id),
      `${definition.id}: correction must remain unshared: ${id}`
    );
  for (const control of facts.absentActionControls ?? [])
    assert.ok(
      !session.actions.some((action) => action.control === control),
      `${definition.id}: unexpected ${control} action`
    );
  for (const type of facts.absentEventTypes ?? [])
    assert.ok(
      !session.events.some((event) => event.type === type),
      `${definition.id}: unexpected ${type} event`
    );
  for (const expected of facts.requiredEvents ?? [])
    assert.ok(
      session.events.some((event) =>
        Object.entries(expected).every(
          ([key, value]) =>
            (key === 'type'
              ? event.type
              : key === 'at'
                ? event.simulatedAt
                : event.payload[key]) === value
        )
      ),
      `${definition.id}: missing required event ${JSON.stringify(expected)}`
    );
  if (facts.allDecisionsWithoutEvidence)
    assert.ok(
      session.decisions.every((decision) => decision.evidenceIds.length === 0),
      `${definition.id}: unsupported monitoring fixture unexpectedly cites evidence`
    );
  if (facts.noCompletedRestoration)
    assert.ok(
      !session.events.some(
        (event) =>
          event.type === 'action.completed' && event.payload.control === 'restore-connector'
      ),
      `${definition.id}: failed restoration was marked complete`
    );
  if (facts.hasUncorrectedCitationAfterCorrection)
    assert.ok(
      session.decisions.some(
        (decision) =>
          decision.at >= 12 &&
          decision.evidenceIds.includes('image') &&
          !decision.evidenceIds.includes('image-correction')
      ),
      `${definition.id}: stale citation opportunity is absent`
    );
}

function generate(definition, setName) {
  let session = createGlasshouseSession(
    definition.seed,
    definition.mode,
    `calibration-${setName === 'development' ? 'dev' : 'candidate'}-${definition.id}`
  );
  const commandLog = [];
  const run = (input, expectError) => {
    const command = {
      ...input,
      commandId: `${definition.id}-${numbered(commandLog.length + 1)}`,
      actor: 'commander',
    };
    const before = session;
    const result = transitionGlasshouse(session, command);
    if (expectError) {
      assert.ok(
        result.error?.includes(expectError),
        `${definition.id}: expected rejection ${expectError}; got ${result.error}`
      );
      assert.ok(
        result.state.commands.some((item) => item.commandId === command.commandId),
        `${definition.id}: expected rejected attempt was not journaled`
      );
    } else
      assert.equal(
        result.error,
        undefined,
        `${definition.id}: command failed: ${JSON.stringify(command)}`
      );
    assert.notEqual(
      result.state,
      before,
      `${definition.id}: command did not produce an immutable successor`
    );
    session = result.state;
    commandLog.push({
      commandId: command.commandId,
      eventIds: result.events.map((event) => event.eventId),
      ...(result.error ? { expectedKernelRejection: result.error } : {}),
    });
  };
  for (const step of definition.steps) {
    if (step.type === 'advanceTo') {
      assert.ok(step.to >= session.tick && step.to <= 60);
      let count = 0;
      while (session.tick < step.to) {
        if (++count > 100) throw new Error(`${definition.id}: clock bound exceeded`);
        run({ type: 'advance', to: Math.min(step.to, session.queue[0]?.at ?? step.to) });
      }
    } else {
      const { expectError, ...command } = step;
      run(command, expectError);
    }
  }
  const serialized = serializeGlasshouseSession(session);
  assertEngineeringFacts(definition, session);
  assert.equal(
    canonicalGlasshouseState(restoreGlasshouseSession(serialized)),
    canonicalGlasshouseState(session)
  );
  const report = getGlasshouseReport(session, 0);
  assert.equal(report.activePlaySeconds, 0);
  assert.ok(Object.isFrozen(report));
  for (const decision of session.decisions)
    for (const id of decision.evidenceIds)
      assert.ok(
        decision.knownEvidenceIds.includes(id),
        `${definition.id}: cited evidence was not known at commitment`
      );
  return { session, report, serialized, commandLog };
}

function evidenceAtEvent(session, target) {
  const ids = new Set(
    session.events
      .filter(
        (event) =>
          event.sequence <= target.sequence &&
          ['observation.received', 'observation.corrected'].includes(event.type)
      )
      .map((event) => event.payload.observationId)
  );
  return session.observations
    .filter((observation) => ids.has(observation.id) && observation.knownBy.includes('commander'))
    .map((observation) => observation.id);
}

function reviewerProjection(session, definition, setName) {
  const events = session.events
    .filter((event) => !['finding.disputed', 'session.incomplete'].includes(event.type))
    .map((original) => {
      const event = structuredClone(original);
      if (event.type === 'session.started') event.payload = { mode: session.mode, versions };
      // Outcome receipts remain, but remove the engine's quality assertions and hidden-state flags.
      if (event.type === 'deadline.dispatch') event.payload = { result: event.payload.result };
      if (event.type === 'brief.acknowledged')
        event.payload = {
          acknowledgment: 'Authored acknowledgment received. An acknowledgment is not approval.',
        };
      if (event.type === 'handoff.recorded') delete event.payload.lifecycle;
      if (event.type === 'action.failed' && typeof event.payload.result === 'string')
        event.payload.result = event.payload.result.replace(
          '; a sound recovery check prevented premature restoration.',
          '.'
        );
      return event;
    });
  const attempts = session.events
    .filter((event) => event.type === 'action.rejected')
    .map((event) => {
      const command = session.commands.find((item) => item.commandId === event.payload.commandId);
      assert.equal(command?.type, 'plan');
      return {
        eventId: event.eventId,
        at: event.simulatedAt,
        commandId: command.commandId,
        plan: command.plan,
        knownEvidenceIds: evidenceAtEvent(session, event),
        rejectionReason: event.payload.reason,
      };
    });
  return {
    packetVersion: 1,
    vignetteId: definition.id,
    set: setName,
    status:
      'Synthetic trace for proposed rubric review. No human rating or anchor agreement exists.',
    provenance:
      setName === 'development'
        ? 'Engineering-authored development material.'
        : 'Engineering-authored held-out candidate; not independent or frozen for assessment.',
    versions,
    handover: GLASSHOUSE_HANDOVER,
    availableControls: GLASSHOUSE_CONTROLS,
    mode: session.mode,
    assistance: session.assistance,
    traceEndMinute: session.tick,
    elapsedHumanTime: null,
    observations: session.observations.filter((observation) =>
      observation.knownBy.includes('commander')
    ),
    decisions: session.decisions,
    rejectedAttempts: attempts,
    events,
    ...(session.handoff ? { handoff: session.handoff } : {}),
    renderingBoundary: [
      'Only observations received by the commander are shown. Judge each decision against its knownEvidenceIds, not a later result.',
      'Seed, hidden world state, future queued events, automated findings, executive brief, completion judgments and proposed answer context are excluded.',
      'Authored operational receipts are not independent ratings. Quality assertions in brief acknowledgments and the restoration-failure receipt are suppressed; the full original trace remains in the facilitator archive.',
      'Costs and times are synthetic scenario properties. No participant played these traces; elapsed human time is unavailable.',
    ],
  };
}

function ratingForm(trace) {
  return {
    formVersion: 1,
    vignetteId: trace.vignetteId,
    versions,
    reviewerLabel: '',
    reviewRole: '',
    reviewDate: null,
    anchorVersionUsed: null,
    independentReviewComplete: null,
    materialScenarioDefect: null,
    materialAuthorityOrSafetyDispute: null,
    overallNotes: '',
    instructions: [
      'All answers are intentionally blank. Complete independently before seeing facilitator context or other ratings.',
      'First decide whether an observable opportunity exists. Use not-observed when the trace cannot support a dimension; absence of opportunity is not a score of zero.',
      'After human anchors are agreed, allowed dimension ratings are 0, 1, 2, or not-observed. Preserve the original independent rating and rationale before adjudication.',
      'Critical flags use met, partly-met, missed, or not-observed only after reviewers agree their definitions. A material authority or safety dispute must remain visible.',
      'Cite actual event IDs and evidence/decision snapshot IDs. Judge known-then process separately from operational luck or the engine response.',
      'Do not total these dimensions into a research score. None of these cases is independently qualified to expose all eight opportunities.',
    ],
    dimensions: CALIBRATION_DIMENSIONS.map((dimension) => ({
      dimensionId: dimension.id,
      dimension: dimension.name,
      opportunityObserved: null,
      rating: null,
      eventReferences: [],
      evidenceReferences: [],
      evidenceSnapshotReferences: [],
      reason: '',
      anchorAmbiguity: '',
    })),
    criticalTaskFlags: CALIBRATION_CRITICAL_TASKS.map((task) => ({
      taskId: task.id,
      prompt: task.prompt,
      opportunityObserved: null,
      flag: null,
      materialSafetyOrAuthorityConcern: null,
      eventReferences: [],
      reason: '',
    })),
    eventReferenceIndex: trace.events.map((event) => ({
      eventId: event.eventId,
      minute: event.simulatedAt,
      type: event.type,
    })),
  };
}

function containsReviewerEntries(form) {
  const filled = (value) =>
    value !== null &&
    value !== undefined &&
    value !== '' &&
    (!Array.isArray(value) || value.length > 0);
  const responseKeys = [
    'reviewerLabel',
    'reviewRole',
    'reviewDate',
    'anchorVersionUsed',
    'independentReviewComplete',
    'materialScenarioDefect',
    'materialAuthorityOrSafetyDispute',
    'overallNotes',
  ];
  if (responseKeys.some((key) => filled(form[key]))) return true;
  if (!Array.isArray(form.dimensions) || !Array.isArray(form.criticalTaskFlags)) return true;
  return (
    form.dimensions.some((item) =>
      [
        'opportunityObserved',
        'rating',
        'eventReferences',
        'evidenceReferences',
        'evidenceSnapshotReferences',
        'reason',
        'anchorAmbiguity',
      ].some((key) => filled(item[key]))
    ) ||
    form.criticalTaskFlags.some((item) =>
      [
        'opportunityObserved',
        'flag',
        'materialSafetyOrAuthorityConcern',
        'eventReferences',
        'reason',
      ].some((key) => filled(item[key]))
    )
  );
}

function planLines(plan, knownEvidenceIds, snapshotId) {
  return [
    `- Scope and control: ${markdown(plan.scope)} / ${markdown(plan.control)}. Posture: ${markdown(plan.posture)}. Treatments: ${markdown(plan.treatments.join(' + '))}.`,
    `- Declared authority: ${markdown(plan.authority)}. Owner notification selected: ${plan.notify ? 'yes' : 'no'}.`,
    `- Selected sources: ${markdown(plan.evidenceIds.join(', ') || '(none)')}.`,
    `- Sources available then: ${markdown(knownEvidenceIds.join(', ') || '(none)')}.`,
    ...(snapshotId ? [`- Evidence snapshot: ${markdown(snapshotId)}.`] : []),
    `- Rationale: ${markdown(plan.rationale || '(blank)')}`,
    `- Assumption: ${markdown(plan.assumption || '(blank)')}`,
    `- Hypothesis: ${markdown(plan.hypothesis || '(blank)')}`,
    `- Likelihood: ${markdown(plan.likelihood)}. Confidence: ${markdown(plan.confidence)}. Uncertainty label: ${markdown(plan.uncertainty)}.`,
    `- Alternative: ${markdown(plan.alternative || '(blank)')}`,
    `- Review condition: ${markdown(plan.reviewTrigger || '(blank)')}`,
  ];
}

function handout(trace) {
  const lines = [
    `# Glasshouse trace ${trace.vignetteId}`,
    '',
    'Synthetic, engineering-authored material for independent human review of proposed anchors. No person has been scored. The candidate set is not yet a frozen or independent held-out assessment.',
    '',
    `Mode: ${trace.mode}. Coaching used: ${trace.assistance.length ? trace.assistance.join(', ') : 'none'}. Trace ends at simulated minute ${trace.traceEndMinute}. Human play time: unavailable.`,
    '',
    `Scenario ${versions.scenario}; rules ${versions.rules}; rubric ${versions.rubric}; assets ${versions.assets}.`,
    '',
    'Read the timeline in order. At each choice, judge only the evidence available then. Later corrections and outcomes cannot be used as earlier knowledge. A successful outcome, populated field, accepted action, or authored acknowledgment is not a human quality rating.',
    '',
    'Use the adjacent blank rating-form.json. Decide whether an opportunity is observable before assigning an agreed rating. Leave unsupported dimensions not observed. Do not compute a research total; these cases are not qualified assessment forms. Record reasons and exact event references before discussion.',
    '',
    '## Handover',
    '',
    markdown(trace.handover),
    '',
    '## Available control terms',
    '',
    '| Control / scope | Authority | Resource commitment | Lead time / duration | Committed cost |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const control of trace.availableControls)
    lines.push(
      `| ${markdown(control.label)} / ${control.scope} | ${control.needsApproval ? (control.id === 'pause-dispatch' ? 'Owner approval; temporary emergency exception only on the handover terms' : 'Owner approval; notification is not approval') : 'Delegated, subject to prerequisites and resource availability'} | ${markdown(control.resources.join(', ') || 'No exclusive responder resource')} | ${control.leadTime} min${control.duration ? ` / ${control.duration} min bounded control` : ''} | USD ${(control.costCents / 100).toFixed(2)} synthetic |`
    );
  lines.push(
    '',
    'Committed cost remains after cancellation. Local restoration requires established scope, completed isolation and the vendor repair notice, followed by a local check. A control name or recommendation is not evidence of completion.',
    '',
    '## Chronological record'
  );
  for (const event of trace.events) {
    lines.push(
      '',
      `### Minute ${event.simulatedAt} · ${markdown(event.type)}`,
      '',
      `Event ${markdown(event.eventId)} · actor ${markdown(event.actorId)}${event.causalParentIds.length ? ` · causal parents ${markdown(event.causalParentIds.join(', '))}` : ''}`,
      ''
    );
    const observation = trace.observations.find((item) => item.id === event.payload.observationId);
    const decision = trace.decisions.find((item) => item.eventId === event.eventId);
    const attempt = trace.rejectedAttempts.find((item) => item.eventId === event.eventId);
    if (observation) {
      lines.push(
        markdown(observation.claim),
        '',
        `Source ${markdown(observation.source)}. Observation ${markdown(observation.id)}. Observed at minute ${observation.observedAt}; received at minute ${observation.receivedAt}. Status: ${observation.status}.`,
        '',
        `Provenance: ${markdown(observation.provenance)}`,
        '',
        `Limitation: ${markdown(observation.limitation)}`
      );
      if (observation.corrects)
        lines.push(
          '',
          `Corrects observation ${markdown(observation.corrects)}; the earlier observation remains in this record.`
        );
    } else if (decision) {
      lines.push(
        `Decision ${decision.id}${decision.revisionOf ? ` revises ${decision.revisionOf}` : ''}. Action reference ${decision.actionId}.`,
        '',
        ...planLines(decision, decision.knownEvidenceIds, decision.evidenceSnapshotId)
      );
    } else if (attempt) {
      lines.push(
        'Recorded attempted action; this command was rejected and no control was executed by this attempt.',
        '',
        ...planLines(attempt.plan, attempt.knownEvidenceIds),
        '',
        `Operational refusal: ${markdown(attempt.rejectionReason)}`
      );
    } else {
      for (const [key, value] of Object.entries(event.payload))
        lines.push(
          `- ${markdown(key)}: ${markdown(typeof value === 'object' ? JSON.stringify(value) : value)}`
        );
    }
  }
  lines.push(
    '',
    '## Review boundary',
    '',
    ...trace.renderingBoundary.map((item) => `- ${item}`),
    ''
  );
  return `${lines.join('\n')}\n`;
}

function resolvedContext(definition, generated) {
  const { session, report, commandLog } = generated;
  const observedIds = new Set(session.observations.map((item) => item.id));
  const mapOpportunity = (item) => {
    const selectedEvents = session.events.filter((event) => item.eventTypes.includes(event.type));
    return {
      ...item,
      status: 'proposed-opportunity-unreviewed',
      eventIds: selectedEvents.map((event) => event.eventId),
      evidenceIds: [
        ...new Set([
          ...selectedEvents
            .map((event) => event.payload.observationId)
            .filter((id) => observedIds.has(id)),
          ...session.decisions
            .filter((decision) =>
              selectedEvents.some((event) => event.eventId === decision.eventId)
            )
            .flatMap((decision) => decision.evidenceIds),
        ]),
      ],
      evidenceSnapshotIds: session.decisions
        .filter((decision) => selectedEvents.some((event) => event.eventId === decision.eventId))
        .map((decision) => decision.evidenceSnapshotId),
      caseReason: definition.focus,
      humanAgreedAnchor: null,
      humanExpectedRating: null,
    };
  };
  const dimensionOpportunities = CALIBRATION_DIMENSIONS.filter((dimension) =>
    definition.proposedDimensionIds.includes(dimension.id)
  ).map(mapOpportunity);
  const criticalTaskOpportunities = CALIBRATION_CRITICAL_TASKS.filter((task) =>
    definition.proposedCriticalTaskIds.includes(task.id)
  ).map(mapOpportunity);
  for (const item of [...dimensionOpportunities, ...criticalTaskOpportunities])
    assert.ok(
      item.eventIds.length,
      `${definition.id}: proposed opportunity ${item.id} lacks an actual event reference`
    );
  return {
    vignetteId: definition.id,
    status: definition.status,
    versions,
    engineeringIntent: definition.engineeringIntent,
    focus: definition.focus,
    sourceDefinition: definition,
    hiddenScenarioContext: session.world,
    seed: session.seed,
    terminalStatus: session.lifecycle,
    modeledTerminalReason: session.terminalReason ?? null,
    generatedCommandJournal: commandLog,
    dimensionOpportunities,
    dimensionsWithoutAnAuthoredOpportunityClaim: CALIBRATION_DIMENSIONS.filter(
      (dimension) => !definition.proposedDimensionIds.includes(dimension.id)
    ).map((dimension) => dimension.id),
    criticalTaskOpportunities,
    automatedFindingsStatus:
      'Full report contains uncalibrated structured-rule observations and human-review placeholders. They are not human anchors or results and must not be given to blinded reviewers.',
    humanReviewers: [],
    humanAnchorAgreement: false,
    humanRatings: [],
    researchAssessmentQualified: false,
    measuredActivePlaySeconds: null,
    reportTimePlaceholderExplanation:
      'Full report uses 0 activePlaySeconds because no person played the generated commands. This is not a measured completion time.',
    canonicalDigest: report.canonicalDigest,
    serializedSessionSha256: hash(generated.serialized),
  };
}

const manifest = {
  schemaVersion: 1,
  generator: 'scripts/generate-calibration-pack.mjs',
  sourceDefinitions: 'release/calibration-vignettes.mjs',
  sourceDefinitionsSha256: hash(
    await readFile(path.join(root, 'release', 'calibration-vignettes.mjs'))
  ),
  generatorSha256: hash(await readFile(fileURLToPath(import.meta.url))),
  versions,
  status: 'synthetic-proposed-unreviewed',
  generationDeterminism:
    'Fixed seeds, explicit command identifiers and checkpoint-by-checkpoint clock commands; every result is regenerated twice and replay-restored before output.',
  humanReviewers: [],
  humanRatings: [],
  gatesPassed: [],
  limitations: [
    'Twelve development traces and eight separate held-out candidates were authored by engineering. Candidate traces are not genuinely independent held-out evidence.',
    'Independent reviewers must agree opportunity definitions and anchors, then approve/freeze an appropriate second set before scoring. This generator is not that approval.',
    'No ICC, critical-task agreement percentage, formative-user result, retention estimate or efficacy result is calculated from synthetic traces.',
    'Not all traces expose all eight dimensions. A complete research score requires separately qualified assessment cases and an appropriate rater design.',
    'Neither synthetic elapsed time nor artifact hashes establish human performance, authorship, independence or certification.',
  ],
  sets: [],
};
// Refuse regeneration before writing anything if someone has filled a generated form in place.
// Review submissions normally belong outside this generated tree, but accidental edits remain safe.
for (const [setName, definitions] of [
  ['development', DEVELOPMENT_VIGNETTES],
  ['heldout-candidates', HELDOUT_CANDIDATES],
]) {
  for (const definition of definitions) {
    const formPath = path.join(output, setName, 'reviewer', definition.id, 'rating-form.json');
    try {
      const existing = JSON.parse(await readFile(formPath, 'utf8'));
      if (containsReviewerEntries(existing))
        throw new Error(
          `Preserved existing reviewer entries at ${formPath}. Archive submissions separately before regenerating the blank packet.`
        );
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}
await mkdir(output, { recursive: true });
for (const [setName, definitions] of [
  ['development', DEVELOPMENT_VIGNETTES],
  ['heldout-candidates', HELDOUT_CANDIDATES],
]) {
  const setPath = path.join(output, setName);
  const reviewerPath = path.join(setPath, 'reviewer');
  const facilitatorPath = path.join(setPath, 'facilitator');
  await mkdir(reviewerPath, { recursive: true });
  await mkdir(facilitatorPath, { recursive: true });
  const index = [];
  const cases = [];
  for (const definition of definitions) {
    const generated = generate(definition, setName);
    const repeated = generate(definition, setName);
    assert.equal(
      generated.serialized,
      repeated.serialized,
      `${definition.id}: generation is not deterministic`
    );
    assert.deepEqual(generated.report, repeated.report);
    const trace = reviewerProjection(generated.session, definition, setName);
    const rating = ratingForm(trace);
    assert.equal(containsReviewerEntries(rating), false);
    assert.equal(
      containsReviewerEntries({ ...rating, reviewerLabel: 'synthetic-validation-only' }),
      true
    );
    assert.equal(
      containsReviewerEntries({ ...rating, dimensions: [{ ...rating.dimensions[0], rating: 0 }] }),
      true
    );
    const context = resolvedContext(definition, generated);
    const reviewerDir = path.join(reviewerPath, definition.id);
    const facilitatorDir = path.join(facilitatorPath, definition.id);
    await mkdir(reviewerDir, { recursive: true });
    await mkdir(facilitatorDir, { recursive: true });
    const rendered = handout(trace);
    const blindText = `${pretty(trace)}${pretty(rating)}${rendered}`;
    for (const prohibited of [
      '"findings"',
      '"executiveBrief"',
      '"world"',
      '"seed"',
      '"engineeringIntent"',
      '"score":',
    ])
      assert.ok(
        !blindText.includes(prohibited),
        `${definition.id}: reviewer packet leaked ${prohibited}`
      );
    for (const dimension of rating.dimensions) assert.equal(dimension.rating, null);
    for (const flag of rating.criticalTaskFlags) assert.equal(flag.flag, null);
    const files = {
      [`${setName}/reviewer/${definition.id}/trace.json`]: pretty(trace),
      [`${setName}/reviewer/${definition.id}/rating-form.json`]: pretty(rating),
      [`${setName}/reviewer/${definition.id}/handout.md`]: rendered,
      [`${setName}/facilitator/${definition.id}/session.json`]: generated.serialized,
      [`${setName}/facilitator/${definition.id}/full-report.json`]: pretty(generated.report),
      [`${setName}/facilitator/${definition.id}/context.json`]: pretty(context),
    };
    for (const [relative, contents] of Object.entries(files))
      await writeFile(path.join(output, relative), contents, 'utf8');
    index.push({
      vignetteId: definition.id,
      engineeringIntent: definition.engineeringIntent,
      proposedDimensions: definition.proposedDimensionIds,
      proposedCriticalTasks: definition.proposedCriticalTaskIds,
      minute: generated.session.tick,
      decisions: generated.session.decisions.length,
      events: generated.session.events.length,
      kernelLifecycle: generated.session.lifecycle,
      expectedRejections: generated.commandLog.filter((item) => item.expectedKernelRejection)
        .length,
      humanReviewStatus: 'unreviewed',
      context: `${definition.id}/context.json`,
      fullReport: `${definition.id}/full-report.json`,
      serializedSession: `${definition.id}/session.json`,
    });
    cases.push({
      vignetteId: definition.id,
      files: Object.fromEntries(
        Object.entries(files).map(([relative, contents]) => [
          relative,
          { sha256: hash(contents), bytes: Buffer.byteLength(contents) },
        ])
      ),
      replayValidated: true,
      repeatedGenerationIdentical: true,
    });
  }
  await json(path.join(facilitatorPath, 'index.json'), {
    status: 'Synthetic proposed context; not agreed answers or ratings.',
    versions,
    cases: index,
  });
  await json(path.join(facilitatorPath, 'source-definitions.json'), {
    versions,
    definitions,
    dimensionDefinitions: CALIBRATION_DIMENSIONS,
    criticalTaskDefinitions: CALIBRATION_CRITICAL_TASKS,
  });
  await writeFile(
    path.join(facilitatorPath, 'index.md'),
    [
      `# ${setName === 'development' ? 'Development' : 'Held-out candidate'} facilitator context`,
      '',
      'Synthetic engineering proposals, unreviewed. Do not distribute this directory with the independent reviewer packet. Full reports contain automated observations and original receipts; they are not answer keys or agreed anchors.',
      '',
      ...(setName === 'heldout-candidates'
        ? [
            'Engineering authored and inspected every candidate. These are separate traces, but no true independence or approved freeze is claimed. Human reviewers must agree development anchors, approve or replace the candidates, and freeze content before independent scoring.',
            '',
          ]
        : []),
      '| ID | Proposed discussion focus | Minutes / decisions | Proposed dimensions | Human status |',
      '| --- | --- | --- | --- | --- |',
      ...index.map(
        (item) =>
          `| [${item.vignetteId}](${item.context}) | ${markdown(item.engineeringIntent)} | ${item.minute} / ${item.decisions} | ${item.proposedDimensions.join(', ')} | Unreviewed |`
      ),
      '',
      'See each context.json for exact event IDs, evidence IDs, known-then snapshot IDs and reasons for the proposed opportunities. Each full-report.json is generated from the corresponding replay-validated session.json. Do not sum dimensions where opportunities are absent. Even traces proposed for all eight dimensions require human qualification before research use.',
      '',
      'No human scores, independent reviewers, agreement statistics, user timing, study participants or release-gate passes have been invented.',
      '',
    ].join('\n'),
    'utf8'
  );
  await writeFile(
    path.join(reviewerPath, 'README.md'),
    [
      '# Independent reviewer packet',
      '',
      'These are synthetic, engineering-authored Glasshouse command traces for proposed anchor review. No participant performed them, and no human ratings exist.',
      '',
      'Use each neutral-ID handout and its adjacent blank rating form. Read chronologically and cite event IDs. Assess whether an opportunity exists before assigning an agreed rating. Keep each reviewer’s original independent form separate and unchanged when later adjudicating disagreements.',
      '',
      'Automated findings, hidden scenario context and proposed interpretations are excluded. Authored operational receipts do not establish quality. The material is not an employment or readiness assessment, and these cases are not qualified to support research totals.',
      '',
      ...(setName === 'heldout-candidates'
        ? [
            'This second set is only a held-out candidate. Engineering has authored and inspected it. Do not call it independent or frozen; release for scoring requires human anchor agreement and an approved freeze or replacement.',
            '',
          ]
        : []),
      ...definitions.map(
        (definition) =>
          `- [Trace ${definition.id}](${definition.id}/handout.md) · [Blank form](${definition.id}/rating-form.json)`
      ),
      '',
    ].join('\n'),
    'utf8'
  );
  manifest.sets.push({
    name: setName,
    count: definitions.length,
    reviewerDirectory: `${setName}/reviewer`,
    facilitatorDirectory: `${setName}/facilitator`,
    humanAnchorAgreement: false,
    approvedFreeze: false,
    cases,
  });
}
await json(path.join(output, 'generation-manifest.json'), manifest);
await writeFile(
  path.join(output, 'README.md'),
  [
    '# Calibration preparation artifacts',
    '',
    'Generated from the current version-pinned Glasshouse kernel: 12 development traces and 8 separate engineering-authored held-out candidates. Every session has been regenerated identically and validated through full command replay.',
    '',
    '- Development reviewer handouts and blank forms: [development/reviewer](development/reviewer/README.md).',
    '- Development facilitator context and complete session/report archives: [development/facilitator](development/facilitator/index.md).',
    '- Candidate reviewer handouts and blank forms: [heldout-candidates/reviewer](heldout-candidates/reviewer/README.md).',
    '- Candidate facilitator context and complete archives: [heldout-candidates/facilitator](heldout-candidates/facilitator/index.md).',
    '- Artifact hashes and technical checks: [generation-manifest.json](generation-manifest.json).',
    '',
    'Only distribute a reviewer directory to independent raters. Facilitator directories and source definitions expose engineering intent, hidden scenario values and automated findings.',
    '',
    'All content remains synthetic, proposed and unreviewed. Engineering inspected the candidate set, so it is not genuinely independent held-out evidence. Freeze or replace it only after human anchor agreement. No reviewers have been recruited, no human data has been collected, and no calibration, usability, learning or publication gate has passed.',
    '',
    'Human play time is unavailable; 0 in the complete report is an unmeasured export placeholder. Not every trace exposes all eight dimensions. No research sum, reliability statistic, critical-task agreement percentage or retention result is produced.',
    '',
    'Regenerate from the repository root with `node scripts/generate-calibration-pack.mjs` after building the core. Version mismatch stops generation. Re-running writes only this generator’s named artifacts; it never deletes unrelated files and refuses to overwrite a rating form containing reviewer responses. Preserve human submissions outside the generated tree.',
    '',
  ].join('\n'),
  'utf8'
);
process.stdout.write(
  `Generated ${manifest.sets.reduce((sum, set) => sum + set.count, 0)} replay-validated synthetic traces in ${output}\n`
);
