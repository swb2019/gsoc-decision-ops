export type Mode = 'preview' | 'guided' | 'independent';
export type AssetId = 'entrance' | 'connector' | 'dispatch';
export type ActorId = 'commander' | 'analyst' | 'cyber' | 'owner';
export type Treatment = 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID';
export type Posture = 'CONTINUE' | 'DEGRADE' | 'PAUSE';
export type Authority = 'delegated' | 'approval' | 'recommendation' | 'emergency';
export type ControlId =
  | 'verify-entrance'
  | 'investigate-connector'
  | 'manual-access'
  | 'isolate-connector'
  | 'pause-dispatch'
  | 'monitor'
  | 'restore-connector';
export interface Observation {
  id: string;
  claim: string;
  source: string;
  observedAt: number;
  receivedAt: number;
  asset: AssetId;
  provenance: string;
  limitation: string;
  status: 'reported' | 'assessed' | 'confirmed';
  knownBy: ActorId[];
  corroborates: string[];
  contradicts: string[];
  corrects?: string;
}
export interface DomainEvent {
  eventId: string;
  sessionId: string;
  sequence: number;
  simulatedAt: number;
  type: string;
  actorId: ActorId;
  payload: Record<string, unknown>;
  causalParentIds: string[];
  schemaVersion: 1;
}
export interface Plan {
  control: ControlId;
  scope: AssetId;
  posture: Posture;
  treatments: Treatment[];
  authority: Authority;
  evidenceIds: string[];
  rationale: string;
  assumption: string;
  hypothesis: string;
  likelihood: 'unknown' | 'unlikely' | 'plausible' | 'likely';
  confidence: 'low' | 'moderate' | 'high';
  alternative: string;
  reviewTrigger: string;
  uncertainty: 'unverified' | 'conflicting' | 'bounded';
  notify: boolean;
}
export interface Decision extends Plan {
  id: string;
  eventId: string;
  at: number;
  evidenceSnapshotId: string;
  knownEvidenceIds: string[];
  actionId: string;
  revisionOf?: string;
}
export interface Action {
  id: string;
  decisionId: string;
  control: ControlId;
  scope: AssetId;
  owner: ActorId;
  status:
    | 'requested'
    | 'approved'
    | 'started'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'expired'
    | 'declined';
  resources: string[];
  expectedUpdate: number;
  expiresAt?: number;
  startedAt?: number;
  result?: string;
  eventId: string;
  costCents: number;
}
export interface ScheduledEvent {
  id: string;
  at: number;
  priority: number;
  order: number;
  kind: 'evidence' | 'complete' | 'expire' | 'approval' | 'deadline';
  ref: string;
  parentIds: string[];
}
export interface Ledger {
  exposureId: string;
  currency: 'USD';
  horizon: 'first simulated hour';
  baselineLossCents: number;
  residualLossCents: number;
  treatmentCostCents: number;
  avoidedLossCents: number;
  netBenefitCents: number;
  roiPercent: number | null;
  assumptions: string[];
}
export interface Improvement {
  action: string;
  owner: string;
  targetDate: string;
  retest: string;
}
export type Command = {
  commandId: string;
  actor: 'commander';
} & (
  | { type: 'plan'; plan: Plan; revisionOf?: string }
  | { type: 'advance'; to: number }
  | { type: 'pause'; paused: boolean }
  | { type: 'cancel'; actionId: string }
  | {
      type: 'brief';
      recommendation: string;
      scope: AssetId;
      evidenceIds: string[];
      uncertainty: string;
      alternative: string;
      consequence: string;
      reviewTrigger: string;
    }
  | { type: 'handoff'; summary: string; owner: string; reviewTrigger: string }
  | { type: 'help'; topic: string }
  | { type: 'continue' }
  | { type: 'improvement'; improvement: Improvement }
  | { type: 'dispute'; findingId: string; reason: string }
);
export interface Session {
  schemaVersion: 1;
  sessionId: string;
  parentSessionId?: string;
  forkAt?: number;
  scenarioVersion: string;
  rubricVersion: string;
  rulesVersion: string;
  assetsVersion: string;
  seed: number;
  initialMode: Mode;
  mode: Mode;
  tick: number;
  paused: boolean;
  lifecycle: 'active' | 'completed' | 'incomplete';
  terminalReason?: string;
  world: {
    connector: 'fault' | 'compromise';
    image: 'stale' | 'current';
    capacity: 'adequate' | 'constrained';
    owner: 'available' | 'delayed';
  };
  observations: Observation[];
  actorKnowledge: Record<ActorId, string[]>;
  decisions: Decision[];
  actions: Action[];
  events: DomainEvent[];
  queue: ScheduledEvent[];
  resources: Record<string, string | null>;
  commands: Command[];
  assistance: string[];
  ledger: Ledger;
  improvement?: Improvement;
  disputes: { findingId: string; reason: string; eventId: string }[];
  handoff?: { summary: string; owner: string; reviewTrigger: string; at: number };
}
export interface Control {
  id: ControlId;
  label: string;
  scope: AssetId;
  owner: ActorId;
  resources: string[];
  leadTime: number;
  duration?: number;
  costCents: number;
  needsApproval: boolean;
  description: string;
  impact: string;
  reversal: string;
}
export interface Finding {
  id: string;
  dimension: string;
  score: 0 | 1 | 2 | null;
  result: string;
  explanation: string;
  eventIds: string[];
  evidenceSnapshotIds: string[];
  evaluatorType: 'structured-rule' | 'human-review';
  ruleVersion: string;
  boundary: string;
}
export interface Report {
  reportVersion: 1;
  executiveBrief: {
    objective: string;
    pivotalDecisions: string[];
    observedBehavior: string[];
    nextPractice: string;
  };
  sessionId: string;
  scenario: string;
  versions: Record<string, string>;
  mode: Mode;
  assistance: string[];
  simulatedMinutes: number;
  activePlaySeconds: number;
  lifecycle: Session['lifecycle'];
  terminalReason?: string;
  decisions: Decision[];
  observations: Observation[];
  events: DomainEvent[];
  actions: Action[];
  findings: Finding[];
  ledger: Ledger;
  unresolved: string[];
  improvement?: Improvement;
  handoff?: Session['handoff'];
  disputes: Session['disputes'];
  limitations: string[];
  redacted: boolean;
  canonicalDigest: string;
}
