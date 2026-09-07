import type { Control, Observation, Session } from './types.js';

export const GLASSHOUSE_VERSIONS = {
  scenario: 'glasshouse-1.0.0',
  rubric: 'observable-1.0.1',
  rules: 'kernel-1.1.0',
  assets: 'campus-audio-1.1.0',
} as const;
/** Historical records are replayed under their original interpretation, never silently regraded. */
export const GLASSHOUSE_SUPPORTED_RUBRICS = [
  'observable-1.0.0',
  GLASSHOUSE_VERSIONS.rubric,
] as const;
export const GLASSHOUSE_SUPPORTED_RULES = ['kernel-1.0.0', GLASSHOUSE_VERSIONS.rules] as const;
export const GLASSHOUSE_SUPPORTED_ASSETS = ['campus-1.0.0', GLASSHOUSE_VERSIONS.assets] as const;
export const GLASSHOUSE_HANDOVER =
  '06:10 · Mara Chen, duty analyst: You are the watch commander for Glasshouse, a fictional research and distribution campus. Protect people, preserve essential operations, and hand over a controlled situation. Two badge readers disagree; the vendor connector reports errors. A shipment must leave by 06:40. An image from the service entrance is unverified. You may assign our guard and analyst, or run a 12-minute manual access control. Connector isolation and dispatch suspension require asset-owner approval. A credible immediate safety concern permits a documented, temporary emergency pause. Notification is never approval. Simulated time advances only when you choose it; action lead times are shown. We need a bounded first step, not an answer to every question.';

export const GLASSHOUSE_CONTROLS: Control[] = [
  {
    id: 'verify-entrance',
    label: 'Verify the service entrance',
    scope: 'entrance',
    owner: 'analyst',
    resources: ['guard'],
    leadTime: 4,
    costCents: 12000,
    needsApproval: false,
    description: 'Send the mobile guard for a direct, timestamped observation.',
    impact: 'Mobile patrol coverage is unavailable for 4 minutes.',
    reversal: 'Cancel before completion; dispatched labor cost remains.',
  },
  {
    id: 'investigate-connector',
    label: 'Establish connector scope',
    scope: 'connector',
    owner: 'cyber',
    resources: ['analyst'],
    leadTime: 6,
    costCents: 18000,
    needsApproval: false,
    description: 'Compare local reader logs with the vendor identity connector.',
    impact: 'The duty analyst cannot investigate other reports for 6 minutes.',
    reversal: 'Cancel before completion; investigation cost remains.',
  },
  {
    id: 'manual-access',
    label: 'Activate manual verification',
    scope: 'entrance',
    owner: 'analyst',
    resources: ['guard'],
    leadTime: 2,
    duration: 12,
    costCents: 30000,
    needsApproval: false,
    description: 'Use the delegated 12-minute manual identity-check procedure.',
    impact: 'Commits the guard. Constrained capacity can delay the shift-change queue.',
    reversal: 'Cancel to release the guard; expires after 12 minutes and must be reassessed.',
  },
  {
    id: 'isolate-connector',
    label: 'Isolate the vendor connector',
    scope: 'connector',
    owner: 'cyber',
    resources: ['responder'],
    leadTime: 4,
    costCents: 60000,
    needsApproval: true,
    description: 'Request asset-owner approval to disconnect the affected integration.',
    impact: 'Local cached badges work; new vendor identities require manual verification.',
    reversal: 'Restore only after scoped verification; isolation alone is not recovery.',
  },
  {
    id: 'pause-dispatch',
    label: 'Pause the affected shipment',
    scope: 'dispatch',
    owner: 'owner',
    resources: [],
    leadTime: 1,
    duration: 10,
    costCents: 40000,
    needsApproval: true,
    description: 'Request a bounded 10-minute hold on the time-sensitive shipment.',
    impact: 'A hold at the dispatch deadline delays an essential delivery.',
    reversal: 'Cancel or let the hold expire, after reviewing the entrance evidence.',
  },
  {
    id: 'monitor',
    label: 'Continue with a review commitment',
    scope: 'dispatch',
    owner: 'commander',
    resources: [],
    leadTime: 1,
    costCents: 0,
    needsApproval: false,
    description: 'Keep dispatch operating and record the evidence that would change the plan.',
    impact: 'Preserves service; does not reduce connector exposure by itself.',
    reversal: 'Revise the plan when a stated trigger is met.',
  },
  {
    id: 'restore-connector',
    label: 'Validate and restore service',
    scope: 'connector',
    owner: 'cyber',
    resources: ['responder'],
    leadTime: 5,
    costCents: 25000,
    needsApproval: false,
    description: 'Validate the vendor repair and restore an isolated integration.',
    impact: 'Requires an isolation, completed scope investigation, and a received repair notice.',
    reversal: 'The connector remains isolated if validation fails.',
  },
];

function observation(
  id: string,
  receivedAt: number,
  claim: string,
  source: string,
  asset: Observation['asset'],
  limitation: string,
  extra: Partial<Observation> = {}
): Observation {
  return {
    id,
    claim,
    source,
    observedAt: Math.max(0, receivedAt - 1),
    receivedAt,
    asset,
    provenance: 'Authored synthetic Glasshouse case; no real incident data.',
    limitation,
    status: 'reported',
    knownBy: ['commander', 'analyst'],
    corroborates: [],
    contradicts: [],
    ...extra,
  };
}

export function glasshouseEvidence(state: Session, id: string): Observation {
  const all: Record<string, Observation> = {
    'reader-alert': observation(
      'reader-alert',
      0,
      'Two service-entrance badge readers disagree on six access attempts. No entry breach is confirmed.',
      'Mara Chen · duty analyst',
      'entrance',
      'Reader disagreement does not establish an unauthorized person.',
      { knownBy: ['commander', 'analyst', 'cyber'] }
    ),
    'vendor-alert': observation(
      'vendor-alert',
      0,
      'The vendor identity connector is returning intermittent errors. Local cached badges still work.',
      'Elias Reed · cyber lead',
      'connector',
      'Fault and compromise remain viable explanations.',
      { knownBy: ['commander', 'analyst', 'cyber'] }
    ),
    shipment: observation(
      'shipment',
      0,
      'A temperature-controlled research shipment is due to leave at 06:40. Its receiving window cannot absorb a long hold.',
      'Jordan Vale · asset owner',
      'dispatch',
      'A late dispatch has a modeled service consequence, not a real financial forecast.',
      { knownBy: ['commander', 'analyst', 'owner'], status: 'confirmed' }
    ),
    image: observation(
      'image',
      3,
      'A forwarded image appears to show a crowd beside the service entrance. Its capture time is missing.',
      'Duty inbox · forwarded image description',
      'entrance',
      'Unverified provenance; the image may be stale.',
      { contradicts: ['guard-check'] }
    ),
    queue: observation(
      'queue',
      8,
      state.world.capacity === 'constrained'
        ? 'Shift-change arrivals exceed the available manual-check capacity. A guard at the entrance cannot also cover the patrol route.'
        : 'Manual checks can handle current arrivals, provided the guard remains assigned at the entrance.',
      'Mara Chen · capacity update',
      'entrance',
      'Capacity is specific to this shift and can change.',
      { status: 'assessed' }
    ),
    'image-correction': observation(
      'image-correction',
      12,
      state.world.image === 'stale'
        ? 'The original uploader confirms yesterday’s drill as the image source. The forwarded report is corrected; it is not evidence of a current crowd.'
        : 'The image was taken this morning, but the apparent crowd is the scheduled shift-change queue. It does not confirm hostile intent.',
      'Mara Chen · source check',
      'entrance',
      'A corrected image does not resolve connector integrity.',
      { status: 'confirmed', corrects: 'image', contradicts: ['image'] }
    ),
    'owner-status': observation(
      'owner-status',
      18,
      state.world.owner === 'delayed'
        ? 'Jordan is in a continuity call. Approval requests will receive a response in 6 simulated minutes. Delegated manual verification remains available.'
        : 'Jordan is available. Scoped approval requests will receive a response in 2 simulated minutes.',
      'Jordan Vale · asset owner',
      'dispatch',
      'An acknowledgment or notification is not authorization.',
      { knownBy: ['commander', 'analyst', 'owner'], status: 'confirmed' }
    ),
    'vendor-repair': observation(
      'vendor-repair',
      24,
      'The vendor reports that its connector repair is ready. Validate the affected identity path before restoring an isolated integration.',
      'Elias Reed · vendor liaison',
      'connector',
      'A vendor statement alone is not local proof of recovery.',
      { knownBy: ['commander', 'analyst', 'cyber'] }
    ),
    relief: observation(
      'relief',
      38,
      'The relief commander is ready for a handoff: current controls, accountable owner, unresolved questions, and next review condition.',
      'Relief desk',
      'dispatch',
      'Handoff records continuity; it does not certify competence.',
      { status: 'confirmed' }
    ),
    'hour-end': observation(
      'hour-end',
      55,
      'Five simulated minutes remain in this exercise hour. Open requests and expiring controls need an explicit owner in the handoff.',
      'Relief desk',
      'dispatch',
      'Unresolved technical questions may remain at a controlled handoff.',
      { status: 'confirmed' }
    ),
  };
  const found = all[id];
  if (!found) throw new Error(`Unknown authored evidence: ${id}`);
  return found;
}

export const GLASSHOUSE_RELEASES = [
  ['image', 3],
  ['queue', 8],
  ['image-correction', 12],
  ['owner-status', 18],
  ['vendor-repair', 24],
  ['relief', 38],
  ['hour-end', 55],
] as const;
