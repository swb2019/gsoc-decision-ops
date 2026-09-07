import {
  getGlasshouseReport,
  type GlasshouseSession as Session,
  type GlasshouseReport as Report,
} from '@gsoc-decision-ops/core';
import type { GlasshousePracticeRecord } from './glasshouse-storage';

export interface GlasshousePracticeObservation {
  objective: string;
  status: 'recorded-in-this-case' | 'not-observed';
  count: number;
  detail: string;
  eventIds: string[];
  boundary: string;
}

export interface GlasshousePracticeSummary {
  sessionId: string;
  parentSessionId?: string;
  caseLabel: string;
  lifecycle: Session['lifecycle'];
  statusLabel: string;
  mode: Session['mode'];
  initialMode: Session['initialMode'];
  assistance: string[];
  versions: { scenario: string; rubric: string; rules: string; assets: string };
  seed: number;
  simulatedMinutes: number;
  lastSavedAt: number | null;
  activePlaySeconds: number | null;
  exposureKey: string;
  observations: GlasshousePracticeObservation[];
  caseProgress: 'introduced' | 'recorded-in-this-case';
  retention: 'not-established';
  transfer: 'unavailable-until-g3';
  practiceNote: string;
  improvement?: Session['improvement'];
}

/** Observed records describe this authored case. They are never converted into learner competence. */
export function projectGlasshousePractice(
  session: Session,
  lastSavedAt: number | null = null,
  activePlaySeconds: number | null = null
): GlasshousePracticeSummary {
  const cited = session.decisions.filter(
    (decision) =>
      decision.evidenceIds.length > 0 &&
      decision.evidenceIds.every((id) => decision.knownEvidenceIds.includes(id))
  );
  const verification = session.events.filter(
    (event) =>
      event.type === 'action.completed' &&
      ['verify-entrance', 'investigate-connector', 'restore-connector'].includes(
        String(event.payload.control)
      )
  );
  const handoffs = session.events.filter((event) => event.type === 'handoff.recorded');
  const observations: GlasshousePracticeObservation[] = [
    {
      objective: 'Evidence references',
      status: cited.length ? 'recorded-in-this-case' : 'not-observed',
      count: cited.length,
      detail: `${cited.length} decision${cited.length === 1 ? '' : 's'} cite observations available at commitment.`,
      eventIds: cited.map((decision) => decision.eventId),
      boundary:
        'A valid reference records source use. It does not establish that the evidence was interpreted well; corrected-source handling remains visible in the full review.',
    },
    {
      objective: 'Completed verification',
      status: verification.length ? 'recorded-in-this-case' : 'not-observed',
      count: verification.length,
      detail: `${verification.length} verification action${verification.length === 1 ? '' : 's'} reached recorded completion.`,
      eventIds: verification.map((event) => event.eventId),
      boundary:
        'A recommendation, request or pending action does not count as completed verification. The value and proportionality of the check still require review.',
    },
    {
      objective: 'Handoff and follow-through',
      status: handoffs.length ? 'recorded-in-this-case' : 'not-observed',
      count: handoffs.length,
      detail: handoffs.length
        ? `A handoff was recorded; the saved session is ${session.lifecycle === 'completed' ? 'complete under the authored conditions' : 'partial or incomplete'}.`
        : 'No handoff is present in this checkpoint.',
      eventIds: handoffs.map((event) => event.eventId),
      boundary:
        'Meeting a fictional handoff condition does not establish readiness, retained skill or independently demonstrated learning.',
    },
  ];
  const exposure = session.observations
    .filter(
      (observation) =>
        observation.receivedAt <= session.tick && observation.knownBy.includes('commander')
    )
    .map((observation) => [
      observation.id,
      observation.receivedAt,
      observation.claim,
      observation.status,
      observation.corrects ?? '',
    ])
    .sort((left, right) => String(left[0]).localeCompare(String(right[0])));
  return {
    sessionId: session.sessionId,
    ...(session.parentSessionId ? { parentSessionId: session.parentSessionId } : {}),
    caseLabel: 'Glasshouse / 06:10',
    lifecycle: session.lifecycle,
    statusLabel:
      session.lifecycle === 'completed'
        ? 'Completed · authored handoff conditions'
        : session.lifecycle === 'abandoned'
          ? 'Abandoned · practice ended voluntarily'
          : session.lifecycle === 'incomplete'
            ? 'Partial · incomplete handoff or horizon'
            : 'Partial · saved in progress',
    mode: session.mode,
    initialMode: session.initialMode,
    assistance: [...session.assistance],
    versions: {
      scenario: session.scenarioVersion,
      rubric: session.rubricVersion,
      rules: session.rulesVersion,
      assets: session.assetsVersion,
    },
    seed: session.seed,
    simulatedMinutes: session.tick,
    lastSavedAt,
    activePlaySeconds,
    exposureKey: JSON.stringify(exposure),
    observations,
    caseProgress: observations.some((item) => item.count > 0)
      ? 'recorded-in-this-case'
      : 'introduced',
    retention: 'not-established',
    transfer: 'unavailable-until-g3',
    practiceNote: session.parentSessionId
      ? 'This is a counterfactual branch of the same case. An immediate replay can test another approach; it does not establish retention.'
      : 'These are records from one authored case. Independent calibration and learning validation remain pending; unfamiliar-case delayed demonstration is unavailable until G3.',
    ...(session.improvement ? { improvement: structuredClone(session.improvement) } : {}),
  };
}

export interface GlasshousePracticeComparison {
  compatible: boolean;
  label: string;
  reasons: string[];
  lastSaveGapMs: number | null;
  intervalNote: string;
  conclusion: string;
  rows: Array<{ label: string; left: string; right: string }>;
}

/** Compatibility permits a contextual inspection only; it never creates a ranking or retention state. */
export function compareGlasshousePractice(
  left: GlasshousePracticeSummary,
  right: GlasshousePracticeSummary
): GlasshousePracticeComparison {
  const reasons: string[] = [];
  if (left.sessionId === right.sessionId) reasons.push('These are the same saved session.');
  if (left.versions.scenario !== right.versions.scenario) reasons.push('Scenario versions differ.');
  if (
    left.versions.rules !== right.versions.rules ||
    left.versions.rubric !== right.versions.rubric ||
    left.versions.assets !== right.versions.assets
  )
    reasons.push('Rules, rubric or asset versions differ.');
  if (left.mode !== right.mode || left.initialMode !== right.initialMode)
    reasons.push('Practice modes differ.');
  if (JSON.stringify([...left.assistance].sort()) !== JSON.stringify([...right.assistance].sort()))
    reasons.push('Recorded assistance differs.');
  if (left.seed !== right.seed) reasons.push('Initial scenario conditions differ.');
  if (left.simulatedMinutes !== right.simulatedMinutes)
    reasons.push('The checkpoints cover different simulated horizons.');
  if (left.exposureKey !== right.exposureKey)
    reasons.push('The available evidence exposure differs.');
  const gap =
    left.lastSavedAt === null || right.lastSavedAt === null
      ? null
      : Math.abs(left.lastSavedAt - right.lastSavedAt);
  return {
    compatible: reasons.length === 0,
    label: reasons.length ? 'Context only · conditions differ' : 'Compatible same-case context',
    reasons,
    lastSaveGapMs: gap,
    intervalNote:
      gap === null
        ? 'A last-save interval is unavailable. No delayed practice interval is inferred.'
        : `Last-save timestamps are ${gap < 86_400_000 ? 'less than one day' : `${Math.floor(gap / 86_400_000)} day(s)`} apart. This is not a verified interval between practice exposures.`,
    conclusion:
      'No ranking is produced. Same-case records and immediate forks do not establish retention, mastery or independent learning. Unfamiliar-case delayed demonstration remains unavailable until G3.',
    rows: [
      { label: 'Saved lifecycle', left: left.statusLabel, right: right.statusLabel },
      { label: 'Mode', left: left.mode, right: right.mode },
      {
        label: 'Simulated horizon',
        left: `${left.simulatedMinutes} min`,
        right: `${right.simulatedMinutes} min`,
      },
      {
        label: 'Assistance',
        left: left.assistance.join('; ') || 'None recorded',
        right: right.assistance.join('; ') || 'None recorded',
      },
      ...left.observations.map((item, index) => ({
        label: item.objective,
        left: item.detail,
        right: right.observations[index].detail,
      })),
    ],
  };
}

function freezeReport<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const item of Object.values(value)) freezeReport(item);
  }
  return value;
}

export function getGlasshousePracticeReport(
  record: Extract<GlasshousePracticeRecord, { validation: 'valid' }>
): Report {
  const report = getGlasshouseReport(record.session, record.activePlaySeconds ?? 0);
  if (record.activePlaySeconds !== null) return report;
  return freezeReport({
    ...report,
    limitations: [
      ...report.limitations,
      'Active-play duration was not retained with this saved checkpoint. The zero in that numeric field is a placeholder, not a measured duration.',
    ],
  });
}
