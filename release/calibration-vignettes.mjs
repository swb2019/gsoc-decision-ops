/** Synthetic engineering fixtures. These are proposed review opportunities, never agreed anchors. */
export const CALIBRATION_VERSIONS = Object.freeze({
  scenario: 'glasshouse-1.0.0',
  rubric: 'observable-1.0.1',
  rules: 'kernel-1.1.0',
  assets: 'campus-audio-1.1.0',
});

export const CALIBRATION_DIMENSIONS = [
  {
    id: 'gh-1',
    name: 'Evidence and source handling',
    reason:
      'Inspect the selected sources against what was available at commitment, including corrections.',
    eventTypes: [
      'decision.committed',
      'observation.received',
      'observation.corrected',
      'action.rejected',
    ],
  },
  {
    id: 'gh-2',
    name: 'Uncertainty and alternatives',
    reason:
      'Interpret the recorded assumption, alternative, likelihood and confidence in context; field completion is not quality.',
    eventTypes: ['decision.committed', 'brief.sent'],
  },
  {
    id: 'gh-3',
    name: 'Proportionality and reversibility',
    reason:
      'Compare committed scope, reversibility, competing options and known-then risk; no posture has an automatic quality score.',
    eventTypes: [
      'decision.committed',
      'action.started',
      'action.completed',
      'action.cancelled',
      'action.expired',
      'action.rejected',
    ],
  },
  {
    id: 'gh-4',
    name: 'Asset and business impact',
    reason:
      'Inspect resource displacement, service continuity, commitment costs and the shipment window alongside the stated consequence.',
    eventTypes: [
      'decision.committed',
      'brief.sent',
      'action.started',
      'action.completed',
      'deadline.dispatch',
    ],
  },
  {
    id: 'gh-5',
    name: 'Authority and escalation',
    reason:
      'Distinguish delegation, request, notification, recommendation, approval and execution using their separate events.',
    eventTypes: [
      'decision.committed',
      'action.rejected',
      'owner.notified',
      'approval.requested',
      'approval.granted',
      'approval.declined',
      'recommendation.recorded',
      'brief.acknowledged',
      'action.started',
    ],
  },
  {
    id: 'gh-6',
    name: 'Concise communication',
    reason:
      'Review an actual stakeholder brief and its relevance to the recipient. Authored acknowledgments are not independent judgments.',
    eventTypes: ['brief.sent', 'brief.acknowledged'],
  },
  {
    id: 'gh-7',
    name: 'Verification and monitoring',
    reason:
      'Distinguish proposed, pending and completed checks; inspect the meaning of review conditions and delayed updates.',
    eventTypes: [
      'decision.committed',
      'action.started',
      'action.completed',
      'action.failed',
      'observation.received',
      'observation.corrected',
    ],
  },
  {
    id: 'gh-8',
    name: 'Recovery and follow-through',
    reason:
      'Review an actual restoration or handoff opportunity, retained uncertainty, accountable owner and review condition; authored completion is not competence.',
    eventTypes: ['handoff.recorded', 'action.failed', 'action.completed', 'improvement.recorded'],
  },
];

export const CALIBRATION_CRITICAL_TASKS = [
  {
    id: 'authority-boundary',
    prompt:
      'Did the trace respect delegated scope and distinguish notification/request from approval and execution?',
    eventTypes: [
      'action.rejected',
      'decision.committed',
      'owner.notified',
      'approval.requested',
      'approval.granted',
      'approval.declined',
      'action.started',
      'recommendation.recorded',
    ],
  },
  {
    id: 'source-correction',
    prompt:
      'Was material source uncertainty or a received correction handled and shared appropriately?',
    eventTypes: [
      'observation.received',
      'observation.corrected',
      'decision.committed',
      'brief.sent',
    ],
  },
  {
    id: 'resource-commitment',
    prompt:
      'Were unavailable resources, displaced coverage and active commitments recognized before relying on them?',
    eventTypes: [
      'action.rejected',
      'action.started',
      'action.completed',
      'action.cancelled',
      'action.expired',
    ],
  },
  {
    id: 'safety-proportionality',
    prompt:
      'Was the safety basis for scope and temporary emergency action supportable from known-then evidence?',
    eventTypes: [
      'decision.committed',
      'action.rejected',
      'observation.received',
      'observation.corrected',
      'action.cancelled',
    ],
  },
  {
    id: 'pending-followup',
    prompt:
      'Were lead times, pending approvals and unresolved checks distinguished from completed effects?',
    eventTypes: [
      'approval.requested',
      'approval.granted',
      'approval.declined',
      'action.started',
      'action.completed',
      'brief.sent',
      'handoff.recorded',
    ],
  },
  {
    id: 'restoration-validation',
    prompt:
      'Was local restoration validation required, its result respected, and isolation retained when validation failed?',
    eventTypes: [
      'decision.committed',
      'action.started',
      'action.completed',
      'action.failed',
      'brief.sent',
      'handoff.recorded',
    ],
  },
  {
    id: 'handoff-accountability',
    prompt:
      'Did the handoff retain current controls, unresolved work, accountable ownership and a usable review condition?',
    eventTypes: [
      'handoff.recorded',
      'brief.sent',
      'action.started',
      'action.expired',
      'action.failed',
    ],
  },
];

const scopes = {
  'verify-entrance': 'entrance',
  'investigate-connector': 'connector',
  'manual-access': 'entrance',
  'isolate-connector': 'connector',
  'pause-dispatch': 'dispatch',
  monitor: 'dispatch',
  'restore-connector': 'connector',
};
const advance = (to) => ({ type: 'advanceTo', to });
const plan = (control, options = {}, extra = {}) => ({
  type: 'plan',
  plan: {
    control,
    scope: scopes[control],
    posture: 'CONTINUE',
    treatments: ['MITIGATE'],
    authority: 'delegated',
    evidenceIds: ['reader-alert', 'vendor-alert'],
    rationale: 'Limit the first action to the affected path while establishing what is known.',
    assumption:
      'The current reports may describe a local fault; they do not establish campus-wide compromise.',
    hypothesis: 'A bounded check can separate the reported fault from a scoped compromise.',
    likelihood: 'plausible',
    confidence: 'low',
    alternative:
      'Request a wider intervention if direct evidence justifies its additional disruption.',
    reviewTrigger: 'Review at the next completed check or new source correction.',
    uncertainty: 'unverified',
    notify: false,
    ...options,
  },
  ...extra,
});
const brief = (options = {}) => ({
  type: 'brief',
  scope: 'connector',
  evidenceIds: ['vendor-alert'],
  recommendation:
    'Keep the response limited to the affected connector and retain essential dispatch.',
  uncertainty: 'The available interval does not establish the condition of every campus system.',
  alternative: 'Use delegated checks while a wider action is considered by the owner.',
  consequence: 'The 06:40 receiving window and displaced guard coverage constrain a broad hold.',
  reviewTrigger: 'Review on a new direct observation, owner response or control expiry.',
  ...options,
});
const handoff = (options = {}) => ({
  type: 'handoff',
  summary:
    'Dispatch status, completed checks and unresolved connector questions are transferred to relief. Retain scoped monitoring and the recorded control status.',
  owner: 'Relief commander; cyber lead for the connector path',
  reviewTrigger:
    'Reopen on a fresh reader mismatch, local validation failure or a new source correction.',
  ...options,
});
const investigate = (options = {}) =>
  plan('investigate-connector', {
    evidenceIds: ['vendor-alert'],
    rationale:
      'Ask cyber to compare the affected connector interval before choosing a broader control.',
    ...options,
  });
const verify = (options = {}) =>
  plan('verify-entrance', {
    evidenceIds: ['reader-alert'],
    rationale:
      'Obtain a direct entrance observation; accept four minutes of displaced mobile patrol coverage.',
    ...options,
  });
const isolate = (evidenceIds, options = {}) =>
  plan('isolate-connector', {
    authority: 'approval',
    posture: 'DEGRADE',
    evidenceIds,
    rationale:
      'Request isolation of the vendor connector only. Preserve cached local badges and assign a manual path for new identities.',
    reviewTrigger:
      'Review after scoped local validation and the vendor repair notice; do not equate notification with approval.',
    ...options,
  });
const manual = (evidenceIds, options = {}) =>
  plan('manual-access', {
    posture: 'DEGRADE',
    evidenceIds,
    rationale:
      'Use the delegated twelve-minute manual control while preserving dispatch; track queue demand and displaced patrol coverage.',
    reviewTrigger: 'Review at the capacity update and before this bounded control expires.',
    ...options,
  });
const monitor = (evidenceIds, options = {}) =>
  plan('monitor', {
    treatments: ['ACCEPT'],
    evidenceIds,
    rationale:
      'Continue dispatch with a bounded monitoring commitment; this is not a claim that monitoring establishes connector integrity.',
    ...options,
  });
const restore = (evidenceIds) =>
  plan('restore-connector', {
    evidenceIds,
    rationale:
      'Ask cyber to validate the isolated connector locally against the repair notice; restore only if the validation succeeds.',
    assumption:
      'The vendor repair notice may be incomplete; the local identity path still needs a check.',
    alternative: 'Retain isolation and the manual route if validation remains inconsistent.',
    reviewTrigger: 'At the local validation result, retain isolation on failure and brief relief.',
    uncertainty: 'bounded',
    confidence: 'moderate',
  });
const dims = (...numbers) => numbers.map((n) => `gh-${n}`);
const entry = (id, seed, engineeringIntent, focus, dimensionIds, criticalTaskIds, steps) => ({
  id,
  seed,
  mode: 'independent',
  engineeringIntent,
  focus,
  proposedDimensionIds: dimensionIds,
  proposedCriticalTaskIds: criticalTaskIds,
  steps,
  status: 'synthetic-engineering-proposal-unreviewed',
  humanAnchorAgreement: false,
  researchAssessmentQualified: false,
});

export const DEVELOPMENT_VIGNETTES = [
  entry(
    'D01',
    9,
    'Proposed defensible narrow fault response using investigation and monitoring.',
    'Bounded fault evidence supports a limited conclusion; monitoring does not itself verify integrity.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['source-correction', 'authority-boundary', 'pending-followup'],
    [
      investigate(),
      advance(6),
      monitor(['scope-check-a1', 'shipment'], {
        rationale:
          'The reviewed connector interval shows a clock fault and unaffected cached readers. Continue the shipment while watching for a fresh mismatch.',
        hypothesis: 'A local clock fault explains the observed errors in the reviewed interval.',
        likelihood: 'unlikely',
        confidence: 'moderate',
        uncertainty: 'bounded',
        reviewTrigger:
          'Reopen on a new token-use finding or fresh badge mismatch; review with cyber after repair.',
      }),
      brief({
        evidenceIds: ['scope-check-a1', 'shipment'],
        recommendation:
          'Continue dispatch with narrow monitoring; the reviewed interval supports a local connector fault, not a campus-wide all-clear.',
      }),
      advance(8),
    ]
  ),
  entry(
    'D02',
    16,
    'Proposed defensible manual access alternative on a bounded fault trace.',
    'Manual checks and monitoring can both be supportable; resources and cost remain reviewable.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['resource-commitment', 'pending-followup', 'source-correction'],
    [
      investigate(),
      verify(),
      advance(6),
      manual(['scope-check-a1', 'guard-check-a2', 'shipment']),
      advance(8),
      brief({
        scope: 'entrance',
        evidenceIds: ['scope-check-a1', 'guard-check-a2', 'queue'],
        recommendation:
          'Retain the short manual path until its scheduled expiry; present arrivals fit capacity. The guard is unavailable for patrol during this commitment.',
        alternative:
          'Release the guard and monitor the bounded clock fault if new identities can wait.',
      }),
      advance(20),
    ]
  ),
  entry(
    'D03',
    2,
    'Proposed scoped compromise response with explicit owner approval.',
    'Investigation, approval, execution and manual fallback have separate timestamps.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['authority-boundary', 'pending-followup', 'resource-commitment'],
    [
      investigate(),
      advance(6),
      isolate(['scope-check-a1', 'shipment']),
      manual(['scope-check-a1', 'reader-alert']),
      advance(12),
      brief({
        evidenceIds: ['scope-check-a1', 'image-correction', 'shipment'],
        recommendation:
          'The approved vendor connector isolation is complete. Cached badges remain usable; keep the manual route bounded and preserve dispatch.',
        uncertainty:
          'The connector token finding is scoped; the corrected queue image does not establish hostile entry.',
      }),
      advance(20),
    ]
  ),
  entry(
    'D04',
    11,
    'Constrained guard: rejected overlapping assignment followed by a revised bounded commitment.',
    'A guard cannot verify the entrance and simultaneously run manual access; the capacity update matters.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['resource-commitment', 'pending-followup'],
    [verify(), manual(['reader-alert'])]
  ),
  entry(
    'D05',
    5,
    'Delayed owner response with a delegated fallback and explicit pending status.',
    'An acknowledgment is not authorization; delay should not itself lower a human rating.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['authority-boundary', 'pending-followup', 'resource-commitment'],
    [
      investigate(),
      advance(6),
      isolate(['scope-check-a1', 'shipment']),
      manual(['scope-check-a1', 'reader-alert']),
      advance(8),
      brief({
        evidenceIds: ['scope-check-a1', 'queue', 'shipment'],
        recommendation:
          'Isolation is requested and remains unapproved. Manual entrance verification is active as the delegated fallback.',
        uncertainty:
          'Owner response is expected at minute 12; no connector isolation has executed.',
      }),
      advance(16),
    ]
  ),
  entry(
    'D06',
    4,
    'Stale image corrected in a revised decision and stakeholder brief.',
    'Preserve the original image report while explicitly updating the recipient after provenance changes.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['source-correction', 'safety-proportionality', 'pending-followup'],
    [
      advance(3),
      verify({
        evidenceIds: ['image', 'reader-alert'],
        rationale:
          'Check the unverified image directly before treating it as a current safety event.',
      }),
      brief({
        scope: 'entrance',
        evidenceIds: ['image'],
        recommendation:
          'A direct check is in progress; the forwarded image is unverified and is not yet a basis for a wider hold.',
      }),
      advance(12),
      plan(
        'monitor',
        {
          evidenceIds: ['image-correction', 'guard-check-a1', 'shipment'],
          treatments: ['ACCEPT'],
          rationale:
            'The source confirms yesterday’s drill and the guard found a clear entrance. Revise the earlier concern, retain connector uncertainty and continue dispatch.',
          hypothesis: 'The image does not describe a current crowd.',
          confidence: 'moderate',
          uncertainty: 'bounded',
        },
        { revisionOf: 'd1' }
      ),
      brief({
        scope: 'entrance',
        evidenceIds: ['image-correction', 'guard-check-a1'],
        recommendation:
          'Correction to my earlier image brief: it was yesterday’s drill. The direct entrance check is clear at its observation time. Connector integrity remains separate.',
      }),
      advance(13),
    ]
  ),
  entry(
    'D07',
    4,
    'Unsupported emergency request after the image correction; rejection and a revised option remain visible.',
    'A rejected attempt is evidence for review even when accepted actions pass the mechanical authority guard.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['authority-boundary', 'source-correction', 'safety-proportionality'],
    [
      advance(12),
      plan(
        'pause-dispatch',
        {
          authority: 'emergency',
          posture: 'PAUSE',
          evidenceIds: ['image'],
          rationale:
            'The forwarded crowd image requires an emergency dispatch hold despite the received correction.',
        },
        { expectError: 'Emergency authority permits only' }
      ),
      monitor(['image-correction', 'shipment'], {
        rationale:
          'Use the corrected source in revising the rejected plan; the old image does not support a current emergency hold.',
      }),
      brief({
        evidenceIds: ['image-correction', 'shipment'],
        recommendation:
          'The emergency hold did not execute. The corrected source removes that stated basis; dispatch continues while connector scope remains open.',
      }),
      advance(13),
    ]
  ),
  entry(
    'D08',
    10,
    'Owner unavailable within the vignette window, with a pending request rather than invented approval.',
    'This kernel models a six-minute delayed response, not permanent owner unavailability; the trace stops before that response.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['authority-boundary', 'pending-followup', 'resource-commitment'],
    [
      advance(18),
      isolate(['vendor-alert', 'owner-status', 'shipment'], {
        confidence: 'low',
        rationale:
          'Request a bounded connector isolation while the owner is in the continuity call; make no claim that the request has taken effect.',
      }),
      manual(['reader-alert', 'queue']),
      advance(20),
      brief({
        evidenceIds: ['owner-status', 'queue', 'vendor-alert'],
        recommendation:
          'Approval remains pending until minute 24. The delegated manual path is active, but demand exceeds its capacity.',
        alternative:
          'If the queue cannot be managed safely, revise the delegated assignment and escalate rather than presuming owner approval.',
      }),
    ]
  ),
  entry(
    'D09',
    9,
    'Favorable dispatch outcome despite unsupported confident monitoring.',
    'Outcome luck must not establish evidence quality or individual confidence calibration; hidden fault is facilitator-only.',
    dims(1, 2, 3, 4, 5, 7),
    ['source-correction', 'pending-followup'],
    [
      monitor([], {
        rationale: 'It is obviously a harmless fault; there is no need to check.',
        assumption: '',
        hypothesis: 'Nothing is wrong.',
        likelihood: 'unlikely',
        confidence: 'high',
        alternative: '',
        reviewTrigger: '',
        uncertainty: 'bounded',
      }),
      advance(30),
    ]
  ),
  entry(
    'D10',
    21,
    'Adverse local restoration result following an otherwise supportable verification process.',
    'An unsuccessful restoration check leaves the connector isolated; a bad outcome does not alone establish bad judgment.',
    dims(1, 2, 3, 4, 5, 6, 7, 8),
    ['authority-boundary', 'restoration-validation', 'handoff-accountability', 'pending-followup'],
    [
      investigate(),
      advance(6),
      isolate(['scope-check-a1', 'shipment']),
      advance(12),
      manual(['scope-check-a1', 'reader-alert']),
      advance(24),
      restore(['scope-check-a1', 'vendor-repair']),
      advance(29),
      brief({
        evidenceIds: ['scope-check-a1', 'vendor-repair'],
        recommendation:
          'Local validation did not pass. Keep the connector isolated; do not call the vendor notice proof of restoration.',
        consequence:
          'Cached local badges remain usable. New vendor identities need a reassessed manual route; preserve the shipment window.',
      }),
      monitor(['scope-check-a1', 'shipment'], {
        reviewTrigger:
          'Cyber to report a new local identity-path validation before restoration is attempted again.',
      }),
      advance(30),
      handoff({
        summary:
          'Shipment dispatched. Vendor connector remains isolated after failed local validation. The earlier manual control expired; new vendor identities require a newly planned delegated route. Do not state that restoration succeeded.',
      }),
    ]
  ),
  entry(
    'D11',
    9,
    'Early handoff while a check remains pending.',
    'A populated handoff form is not proof of settled operations; early terminal status is an authored condition only.',
    dims(1, 2, 3, 4, 5, 7, 8),
    ['pending-followup', 'resource-commitment', 'handoff-accountability'],
    [
      investigate(),
      manual(['reader-alert', 'shipment']),
      advance(2),
      handoff({
        summary:
          'Transfer the current shift. Manual access has just become active; the connector investigation remains pending with its expected minute-6 update.',
        reviewTrigger:
          'Relief must inspect cyber’s minute-6 update and the manual-control expiry; no connector conclusion is established yet.',
      }),
    ]
  ),
  entry(
    'D12',
    16,
    'Controlled handoff after narrow fault verification, bounded monitoring and a stakeholder brief.',
    'This is a proposed broad review opportunity, not a validated eight-dimension assessment or readiness certificate.',
    dims(1, 2, 3, 4, 5, 6, 7, 8),
    ['source-correction', 'authority-boundary', 'pending-followup', 'handoff-accountability'],
    [
      investigate(),
      verify(),
      advance(6),
      monitor(['scope-check-a1', 'guard-check-a2', 'shipment'], {
        confidence: 'moderate',
        uncertainty: 'bounded',
        rationale:
          'The scoped logs show a clock fault and the entrance check is clear. Continue the shipment and retain a concrete new-mismatch trigger.',
      }),
      brief({
        evidenceIds: ['scope-check-a1', 'guard-check-a2', 'shipment'],
        recommendation:
          'Continue dispatch with bounded monitoring. Completed checks support a narrow clock fault; they do not prove campus-wide safety.',
      }),
      advance(30),
      handoff(),
    ]
  ),
];

// Explicitly finish the resource-conflict vignette while retaining its rejected second command.
DEVELOPMENT_VIGNETTES[3].steps[1].expectError = 'The guard is committed';
DEVELOPMENT_VIGNETTES[3].steps.push(
  advance(4),
  manual(['guard-check-a1', 'reader-alert']),
  advance(8),
  { type: 'cancel', actionId: 'a2' },
  brief({
    scope: 'entrance',
    evidenceIds: ['guard-check-a1', 'queue'],
    recommendation:
      'Cancel the manual commitment after the capacity update. The single guard cannot cover the growing queue and mobile patrol at once.',
    alternative:
      'Request additional capacity from the owner; retain a direct observation and keep the dispatch impact visible.',
  })
);

export const HELDOUT_CANDIDATES = [
  entry(
    'H01',
    26,
    'Candidate alternative fault response with reordered checks and temporary manual access.',
    'Engineering touched this trace; it is a candidate for future freeze after anchor agreement, not independent held-out evidence.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['resource-commitment', 'source-correction', 'pending-followup'],
    [
      verify(),
      investigate(),
      advance(6),
      manual(['guard-check-a1', 'scope-check-a2']),
      advance(8),
      brief({
        scope: 'entrance',
        evidenceIds: ['guard-check-a1', 'scope-check-a2', 'queue'],
        recommendation:
          'Use the temporary manual path while the bounded clock fault is repaired. Present demand fits its capacity; release the guard at expiry.',
      }),
      advance(20),
    ]
  ),
  entry(
    'H02',
    13,
    'Candidate compromise isolation with constrained manual capacity and a revised plan.',
    'Compromise evidence does not remove a separate resource-capacity constraint.',
    dims(1, 2, 3, 4, 5, 6, 7, 8),
    ['resource-commitment', 'authority-boundary', 'pending-followup', 'handoff-accountability'],
    [
      investigate(),
      advance(6),
      isolate(['scope-check-a1', 'shipment']),
      manual(['scope-check-a1', 'reader-alert']),
      advance(8),
      { type: 'cancel', actionId: 'a3' },
      brief({
        evidenceIds: ['scope-check-a1', 'queue', 'shipment'],
        recommendation:
          'Approval has been granted and isolation is still in progress. The manual queue exceeded capacity; its guard commitment has been cancelled.',
        alternative:
          'Request additional capacity for new identities rather than assuming the one-guard route scales.',
      }),
      advance(12),
      monitor(['scope-check-a1', 'shipment']),
      advance(30),
      handoff({
        summary:
          'Approved connector isolation is complete and the shipment has departed. Cached badges work; new vendor identities have no active manual route after its capacity-driven cancellation. Relief owns the capacity request and the next local verification.',
      }),
    ]
  ),
  entry(
    'H03',
    1,
    'Candidate recommendation followed later by an actual owner request.',
    'A completed recommendation record is not a completed operational isolation.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['authority-boundary', 'pending-followup'],
    [
      investigate(),
      advance(6),
      isolate(['scope-check-a1', 'shipment'], {
        authority: 'recommendation',
        rationale:
          'Recommend scoped isolation for owner consideration; this recommendation does not execute a control.',
      }),
      brief({
        evidenceIds: ['scope-check-a1', 'shipment'],
        recommendation:
          'My isolation recommendation is recorded, but the connector remains connected. Please consider the service impact and a scoped approval request.',
      }),
      monitor(['scope-check-a1', 'shipment']),
      advance(18),
      isolate(['scope-check-a1', 'owner-status', 'shipment']),
      advance(28),
    ]
  ),
  entry(
    'H04',
    15,
    'Candidate failure to incorporate and share a received image correction.',
    'Keep the old report and the correction visible without supplying a rating in the reviewer packet.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['source-correction', 'safety-proportionality', 'pending-followup'],
    [
      advance(3),
      verify({ evidenceIds: ['image'] }),
      brief({
        scope: 'entrance',
        evidenceIds: ['image'],
        recommendation: 'A crowd may be present; the guard check is pending.',
      }),
      advance(12),
      monitor(['image', 'shipment'], {
        rationale: 'The crowd in the image remains the basis for my current posture.',
        confidence: 'high',
        uncertainty: 'bounded',
      }),
      advance(13),
    ]
  ),
  entry(
    'H05',
    17,
    'Candidate temporary emergency pause accepted by the kernel but requiring human proportionality review.',
    'An unresolved image passes a mechanical guard, not an independent judgment of a credible immediate safety concern.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['safety-proportionality', 'authority-boundary', 'source-correction', 'resource-commitment'],
    [
      advance(3),
      plan('pause-dispatch', {
        authority: 'emergency',
        posture: 'PAUSE',
        evidenceIds: ['image', 'shipment'],
        rationale:
          'Use a brief dispatch hold while a direct guard check tests the unverified entrance crowd report.',
        reviewTrigger:
          'Cancel the hold when the direct check does not support an immediate safety concern; reassess before the delivery window.',
      }),
      verify({ evidenceIds: ['image', 'reader-alert'] }),
      advance(7),
      { type: 'cancel', actionId: 'a1' },
      investigate(),
      advance(13),
      brief({
        evidenceIds: ['guard-check-a2', 'image-correction', 'scope-check-a3'],
        recommendation:
          'The short dispatch hold has been cancelled. The direct entrance check found an orderly queue; separately, cyber found scoped unauthorized token use.',
        alternative:
          'Consider a scoped owner-approved connector isolation without treating the entrance image as hostile intent.',
      }),
    ]
  ),
  entry(
    'H06',
    2,
    'Candidate declined approval request followed by investigation and a grounded request.',
    'The decline is actual authored behavior, not a fabricated permanently unavailable owner.',
    dims(1, 2, 3, 4, 5, 6, 7),
    ['authority-boundary', 'pending-followup', 'source-correction'],
    [
      isolate([], { rationale: 'Isolate now.', reviewTrigger: '' }),
      advance(2),
      investigate(),
      advance(8),
      brief({
        evidenceIds: ['scope-check-a2', 'shipment'],
        recommendation:
          'The first request was declined. Scoped log evidence is now available; request the affected connector only with a local validation review condition.',
      }),
      isolate(['scope-check-a2', 'shipment']),
      advance(14),
    ]
  ),
  entry(
    'H07',
    9,
    'Candidate repeated unsupported monitoring followed by incomplete handoff despite favorable dispatch.',
    'Repeated activity and a good dispatch outcome are not verification or retained learning.',
    dims(1, 2, 3, 4, 5, 7, 8),
    ['pending-followup', 'handoff-accountability', 'source-correction'],
    [
      monitor([], {
        rationale: 'I am confident the alerts are harmless.',
        assumption: '',
        alternative: '',
        reviewTrigger: '',
        confidence: 'high',
      }),
      advance(1),
      monitor([], {
        rationale: 'Continue again; no news proves the decision was right.',
        assumption: '',
        alternative: '',
        reviewTrigger: '',
        confidence: 'high',
      }),
      advance(30),
      handoff({
        summary: 'Shipment departed on time, so I consider the identity issue resolved.',
        owner: 'Relief commander',
        reviewTrigger: 'Continue as normal.',
      }),
    ]
  ),
  entry(
    'H08',
    23,
    'Candidate failed restoration and bounded handoff with a delayed owner sequence.',
    'Keep adverse recovery results separate from process evidence; this case has not been independently reviewed.',
    dims(1, 2, 3, 4, 5, 6, 7, 8),
    ['restoration-validation', 'authority-boundary', 'pending-followup', 'handoff-accountability'],
    [
      investigate(),
      advance(6),
      isolate(['scope-check-a1', 'shipment']),
      advance(16),
      manual(['scope-check-a1', 'reader-alert']),
      advance(24),
      restore(['scope-check-a1', 'vendor-repair']),
      advance(29),
      brief({
        evidenceIds: ['scope-check-a1', 'vendor-repair', 'shipment'],
        recommendation:
          'Local restoration validation failed. Retain connector isolation; the manual control will expire at minute 30, so relief needs a renewed capacity decision.',
      }),
      monitor(['scope-check-a1', 'shipment']),
      advance(30),
      handoff({
        summary:
          'The isolated connector has not passed local restoration validation. The manual control has expired; cached badges remain available and new identities need a fresh delegated plan. Cyber owns the next validation; relief owns access capacity.',
      }),
    ]
  ),
];

// These check kernel facts and intended opportunities, not human judgment or agreed answers.
const expectedFacts = {
  D01: {
    world: { connector: 'fault' },
    tick: 8,
    actionStatuses: { a1: 'completed', a2: 'completed' },
  },
  D02: {
    world: { connector: 'fault', capacity: 'adequate' },
    tick: 20,
    actionStatuses: { a3: 'expired' },
  },
  D03: {
    world: { connector: 'compromise', owner: 'available' },
    actionStatuses: { a2: 'completed', a3: 'expired' },
    requiredEvents: [
      { type: 'approval.granted', at: 8 },
      { type: 'action.completed', at: 12, control: 'isolate-connector' },
    ],
  },
  D04: {
    world: { capacity: 'constrained' },
    rejectedCount: 1,
    actionStatuses: { a2: 'cancelled' },
  },
  D05: {
    world: { owner: 'delayed' },
    tick: 16,
    requiredEvents: [
      { type: 'approval.granted', at: 12 },
      { type: 'action.completed', at: 16, control: 'isolate-connector' },
    ],
  },
  D06: { world: { image: 'stale' }, ownerKnows: ['image', 'image-correction'], revisionCount: 1 },
  D07: {
    rejectedCount: 1,
    absentActionControls: ['pause-dispatch'],
    requiredEvents: [{ type: 'action.rejected', at: 12, control: 'pause-dispatch' }],
  },
  D08: {
    world: { owner: 'delayed', capacity: 'constrained' },
    tick: 20,
    actionStatuses: { a1: 'requested', a2: 'completed' },
    actionExpectedUpdates: { a1: 24 },
    absentEventTypes: ['approval.granted'],
  },
  D09: {
    world: { connector: 'fault' },
    tick: 30,
    allDecisionsWithoutEvidence: true,
    absentActionControls: ['investigate-connector', 'verify-entrance'],
    requiredEvents: [{ type: 'deadline.dispatch', exposed: false, held: false }],
  },
  D10: {
    world: { connector: 'compromise' },
    lifecycle: 'completed',
    actionStatuses: { a4: 'failed' },
    requiredEvents: [{ type: 'action.failed', control: 'restore-connector', at: 29 }],
    noCompletedRestoration: true,
  },
  D11: { tick: 2, lifecycle: 'incomplete', actionStatuses: { a1: 'started', a2: 'completed' } },
  D12: { tick: 30, lifecycle: 'completed', world: { connector: 'fault' } },
  H01: {
    world: { connector: 'fault', image: 'stale', capacity: 'adequate' },
    actionStatuses: { a3: 'expired' },
  },
  H02: {
    world: { connector: 'compromise', capacity: 'constrained' },
    lifecycle: 'completed',
    actionStatuses: { a2: 'completed', a3: 'cancelled' },
  },
  H03: {
    actionStatuses: { a2: 'completed', a4: 'completed' },
    requiredEvents: [
      { type: 'recommendation.recorded', at: 6 },
      { type: 'action.completed', at: 28, control: 'isolate-connector' },
    ],
  },
  H04: {
    world: { image: 'stale' },
    ownerKnows: ['image'],
    ownerDoesNotKnow: ['image-correction'],
    hasUncorrectedCitationAfterCorrection: true,
  },
  H05: {
    rejectedCount: 0,
    actionStatuses: { a1: 'cancelled', a2: 'completed', a3: 'completed' },
    requiredEvents: [
      { type: 'action.completed', at: 4, control: 'pause-dispatch' },
      { type: 'action.cancelled', at: 7 },
    ],
  },
  H06: {
    actionStatuses: { a1: 'declined', a3: 'completed' },
    requiredEvents: [
      { type: 'approval.declined', at: 2 },
      { type: 'action.completed', at: 14, control: 'isolate-connector' },
    ],
  },
  H07: {
    tick: 30,
    lifecycle: 'incomplete',
    allDecisionsWithoutEvidence: true,
    absentActionControls: ['investigate-connector', 'verify-entrance'],
    requiredEvents: [{ type: 'deadline.dispatch', exposed: false, held: false }],
  },
  H08: {
    world: { connector: 'compromise', owner: 'delayed' },
    lifecycle: 'completed',
    actionStatuses: { a3: 'expired', a4: 'failed' },
    noCompletedRestoration: true,
  },
};
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
for (const definition of [...DEVELOPMENT_VIGNETTES, ...HELDOUT_CANDIDATES])
  definition.engineeringAssertions = expectedFacts[definition.id];
freeze(DEVELOPMENT_VIGNETTES);
freeze(HELDOUT_CANDIDATES);
freeze(CALIBRATION_DIMENSIONS);
freeze(CALIBRATION_CRITICAL_TASKS);
