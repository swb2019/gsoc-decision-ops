/**
 * GSOC Decision Operations - Core Type Definitions
 *
 * Structured types for first-hour decision-making during
 * vendor compromises and cyber-adjacent disruptions.
 */

/**
 * Decision posture indicating operational stance
 * - CONTINUE: Proceed with normal operations
 * - DEGRADE: Operate with reduced capability/increased monitoring
 * - PAUSE: Halt affected operations until further notice
 */
export type DecisionPosture = 'CONTINUE' | 'DEGRADE' | 'PAUSE';

/**
 * Severity levels for incident classification
 */
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

/**
 * Impact categories for affected business areas
 */
export type ImpactCategory =
  | 'PHYSICAL_SECURITY'
  | 'ACCESS_CONTROL'
  | 'VIDEO_SURVEILLANCE'
  | 'ALARM_MONITORING'
  | 'VISITOR_MANAGEMENT'
  | 'EXECUTIVE_PROTECTION'
  | 'TRAVEL_SECURITY'
  | 'INVESTIGATIONS'
  | 'BUSINESS_CONTINUITY'
  | 'VENDOR_OPERATIONS'
  | 'DATA_INTEGRITY'
  | 'COMMUNICATIONS';

/**
 * Confidence level for facts and assumptions
 */
export type ConfidenceLevel = 'CONFIRMED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';

/**
 * A single fact known about the incident
 */
export interface Fact {
  id: string;
  timestamp: string;
  description: string;
  source: string;
  confidence: ConfidenceLevel;
  verifiedBy?: string;
  verifiedAt?: string;
}

/**
 * An assumption being made due to incomplete information
 */
export interface Assumption {
  id: string;
  timestamp: string;
  description: string;
  basis: string;
  riskIfWrong: string;
  validationPlan?: string;
  validatedAt?: string;
  validationResult?: 'CONFIRMED' | 'INVALIDATED' | 'MODIFIED';
}

/**
 * An unknown that needs to be resolved
 */
export interface Unknown {
  id: string;
  timestamp: string;
  question: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTo?: string;
  targetResolutionTime?: string;
  resolvedAt?: string;
  resolution?: string;
}

/**
 * A stakeholder involved in the incident
 */
export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  contactMethod: string;
  notifiedAt?: string;
  briefingLevel: 'FULL' | 'SUMMARY' | 'NEED_TO_KNOW';
}

/**
 * A single decision made during the incident
 */
export interface Decision {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  posture: DecisionPosture;
  owner: string;
  ownerRole: string;
  rationale: string;
  factsConsidered: string[];
  assumptionsMade: string[];
  unknownsAccepted: string[];
  alternativesConsidered?: string[];
  reviewTrigger?: string;
  reviewTime?: string;
  supersedes?: string;
  rpdPrompts?: RPDPrompts;
  esrmFraming?: ESRMRiskFraming;
}

/**
 * A communication or bridge call record
 */
export interface BridgeRecord {
  id: string;
  scheduledTime: string;
  actualStartTime?: string;
  endTime?: string;
  type: 'INITIAL' | 'SCHEDULED' | 'AD_HOC' | 'EXECUTIVE' | 'VENDOR';
  attendees: string[];
  keyUpdates: string[];
  decisionsReferenced: string[];
  nextBridgeTime?: string;
  notes?: string;
}

/**
 * Action item tracked during incident
 */
export interface ActionItem {
  id: string;
  createdAt: string;
  description: string;
  owner: string;
  dueBy?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  notes?: string;
  blockedBy?: string;
}

/**
 * Vendor information relevant to the incident
 */
export interface VendorContext {
  vendorName: string;
  vendorType: string;
  contractId?: string;
  primaryContact?: string;
  escalationContact?: string;
  servicesAffected: string[];
  slaRequirements?: string;
  alternateVendors?: string[];
  lastKnownGoodState?: string;
}

/**
 * Entity type for cross-inject linking
 */
export type EntityType = 'PERSON' | 'PLACE' | 'ASSET' | 'ORGANIZATION' | 'SYSTEM';

/**
 * A linked entity that appears across multiple injects
 */
export interface LinkedEntity {
  id: string;
  type: EntityType;
  name: string;
  shortName?: string;
  description?: string;
  criticality?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  relatedEntityIds?: string[];
}

/**
 * Intake channel types - how data arrives on the GSOC floor
 * Each channel has distinct metadata, confidence characteristics, and UX treatment
 */
export type IntakeChannel =
  | 'ACS' // Access Control System - badge denies, forced door, anti-passback
  | 'VMS' // Video Management System - motion, analytics, operator call-up
  | 'ALARM' // Alarm/Intrusion - zone alarms, duress, supervisory
  | 'SIEM' // SIEM/Cyber - phishing, identity, endpoint, VPN anomalies
  | 'OSINT' // OSINT/Intel desk - media, dark-web, travel advisories
  | 'TIP' // Tip/hotline/email/chat - incomplete human reports
  | 'RADIO' // Radio/dispatch/officer mobile - status, ETA, on-scene
  | 'FACILITIES' // Facilities/BMS/life safety - elevator, fire, HVAC
  | 'VENDOR' // Vendor notifications and escalations
  | 'EXECUTIVE' // Executive office / leadership requests
  | 'LE'; // Law enforcement communications

/**
 * Confidence level for intake channel data
 */
export type IntakeConfidence =
  'VERIFIED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED' | 'CONFLICTING';

/**
 * Completeness level for intake data
 */
export type IntakeCompleteness = 'COMPLETE' | 'PARTIAL' | 'MINIMAL' | 'FRAGMENT';

/**
 * Inject attachment types (simulated)
 */
export type AttachmentType =
  'STILL' | 'VIDEO_CLIP' | 'MAP_PIN' | 'AUDIO' | 'DOCUMENT' | 'LOG_EXCERPT';

/**
 * Simulated attachment metadata
 */
export interface InjectAttachment {
  type: AttachmentType;
  label: string;
  description?: string;
  timestamp?: string;
  location?: string;
}

/**
 * Channel-specific metadata for realistic intake feel
 */
export interface IntakeMetadata {
  channel: IntakeChannel;
  sourceSystem?: string; // e.g., "Enterprise ACS", "Enterprise VMS", "Enterprise SIEM"
  sourceId?: string; // e.g., "ACS-HQ-001", "CAM-LOBBY-12"
  rawTimestamp?: string; // Original system timestamp
  receivedTimestamp?: string; // When GSOC received
  confidence: IntakeConfidence;
  completeness: IntakeCompleteness;
  attachments?: InjectAttachment[];
  relatedInjectIds?: string[]; // For corrections/updates
  supersedes?: string; // If this inject updates/corrects a prior inject
  isCorrection?: boolean; // Explicit flag for corrections
  isNoise?: boolean; // Low-value inject that should be deprioritized
  noiseReason?: string; // Why this is low-value (for training)
  requiresFollowUp?: boolean; // Incomplete data needing more info
  pendingVerification?: boolean; // Awaiting confirmation
}

/**
 * Scenario inject - new information revealed during exercise
 * Based on tabletop exercise design principles
 */
export interface ScenarioInject {
  id: string;
  sequenceNumber: number;
  revealAtMinute: number;
  title: string;
  content: string;
  source: string;
  decisionPressure: string;
  expectedPostureImpact?: DecisionPosture;
  revealed: boolean;
  revealedAt?: string;
  linkedEntityIds?: string[];
  triagePriority?: 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
  resourcesRequired?: {
    guards?: number;
    analysts?: number;
    responders?: number;
  };
  intake?: IntakeMetadata;
}

/**
 * Learning objective for a training scenario
 */
export interface LearningObjective {
  primary: string;
  secondary?: string[];
  expectedDecisions: string[];
  skillsTrained: string[];
}

/**
 * RPD (Recognition-Primed Decision) prompts for decision capture
 */
export interface RPDPrompts {
  cuesNoticed?: string;
  expectancies?: string;
  mentalSimulation?: string;
}

/**
 * ESRM risk treatment type
 * Maps to postures: ACCEPT→CONTINUE, MITIGATE→DEGRADE, AVOID→PAUSE
 */
export type RiskTreatment = 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID';

/**
 * ESRM risk framing for decisions
 * Asset owner owns the risk; GSOC advises
 */
export interface ESRMRiskFraming {
  assetOwner: string;
  assetOwnerRole: string;
  treatment: RiskTreatment;
  residualRisk: string;
  businessImpact?: string;
}

/**
 * Complete decision log for an incident
 */
export interface DecisionLog {
  id: string;
  version: string;
  createdAt: string;
  lastUpdated: string;

  incident: {
    title: string;
    description: string;
    severity: SeverityLevel;
    impactCategories: ImpactCategory[];
    detectedAt: string;
    reportedBy: string;
    incidentCommander?: string;
    status: 'ACTIVE' | 'MONITORING' | 'RESOLVED' | 'CLOSED';
  };

  vendorContext?: VendorContext;
  learningObjective?: LearningObjective;
  injects: ScenarioInject[];
  linkedEntities?: LinkedEntity[];

  facts: Fact[];
  assumptions: Assumption[];
  unknowns: Unknown[];
  decisions: Decision[];
  stakeholders: Stakeholder[];
  bridgeRecords: BridgeRecord[];
  actionItems: ActionItem[];

  timeline: TimelineEvent[];
  triageQueue?: TriageQueue;
  dispatchState?: DispatchState;
  playbookExecution?: PlaybookExecution;

  metadata: {
    createdBy: string;
    organization: string;
    classification?: string;
    retentionPolicy?: string;
    exerciseMode: boolean;
    syntheticScenario?: boolean;
  };
}

/**
 * Timeline event for incident chronology
 */
export interface TimelineEvent {
  id: string;
  timestamp: string;
  type:
    | 'DETECTION'
    | 'NOTIFICATION'
    | 'DECISION'
    | 'BRIDGE'
    | 'ESCALATION'
    | 'UPDATE'
    | 'RESOLUTION'
    | 'ACTION';
  title: string;
  description: string;
  relatedIds?: string[];
}

/**
 * AAR action item with owner and due date
 */
export interface AARActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
}

/**
 * After-action report structure
 * Based on military/organizational AAR methodology
 */
export interface AfterActionReport {
  id: string;
  generatedAt: string;
  decisionLogId: string;

  executiveSummary: string;

  incidentOverview: {
    title: string;
    duration: string;
    severity: SeverityLevel;
    impactSummary: string;
  };

  learningObjective?: LearningObjective;

  intendedOutcomes: {
    expectedPosture: string;
    expectedDecisions: string[];
    trainingGoals: string[];
  };

  actualOutcomes: {
    finalPosture: string;
    decisionsRecorded: number;
    postureChanges: number;
    injectsRevealed: number;
    injectsTotal: number;
  };

  chronology: TimelineEvent[];

  decisionAnalysis: {
    totalDecisions: number;
    postureBreakdown: Record<DecisionPosture, number>;
    keyDecisions: Decision[];
  };

  informationQuality: {
    factsCount: number;
    assumptionsCount: number;
    unknownsResolved: number;
    unknownsUnresolved: number;
    assumptionsValidated: number;
    assumptionsInvalidated: number;
  };

  sustains: string[];
  improves: string[];
  actionItems: AARActionItem[];

  lessonsLearned: string[];
  recommendations: string[];

  appendices: {
    fullDecisionLog: DecisionLog;
    exportFormat: 'JSON' | 'MARKDOWN' | 'BOTH';
  };
}

/**
 * Playbook phase for structured response
 */
export interface PlaybookPhase {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  objectives: string[];
  keyQuestions: string[];
  checklistItems: ChecklistItem[];
  escalationTriggers?: string[];
}

/**
 * Checklist item within a playbook phase
 */
export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  owner?: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

/**
 * Complete playbook structure
 */
export interface Playbook {
  id: string;
  name: string;
  version: string;
  description: string;
  applicableScenarios: string[];
  totalDurationMinutes: number;
  phases: PlaybookPhase[];
  governanceNotes: string[];
}

/**
 * Execution state for a playbook in progress
 */
export interface PlaybookExecution {
  id: string;
  playbookId: string;
  decisionLogId: string;
  startedAt: string;
  currentPhaseIndex: number;
  phaseStatuses: {
    phaseId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    startedAt?: string;
    completedAt?: string;
    checklistProgress: Record<string, boolean>;
    gateRequirementsMet?: boolean;
    phaseScore?: number;
  }[];
  totalScore: number;
  phaseTransitions: PhaseTransition[];
}

/**
 * Record of a phase transition during playbook execution
 */
export interface PhaseTransition {
  fromPhaseIndex: number;
  toPhaseIndex: number;
  timestamp: string;
  transitionType: 'NATURAL' | 'FORCED' | 'SKIPPED';
  gateStatus: 'ALL_MET' | 'PARTIAL' | 'BYPASSED';
  timeInPreviousPhase: number;
}

/**
 * Phase gate requirements that must be met before advancing
 */
export interface PhaseGate {
  minimumChecklistCompletion: number;
  requiredDecisionCount?: number;
  requiredEntityIdentification?: number;
  requiredAssetOwnerBriefings?: number;
  canBypass: boolean;
  bypassPenalty?: number;
}

/**
 * Triage queue for managing inject priority
 */
export interface TriageQueue {
  pendingInjects: {
    injectId: string;
    priority: 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
    queuedAt: string;
    timeInQueue: number;
    escalated: boolean;
  }[];
  processedCount: number;
  averageResponseTime: number;
  missedUrgentCount: number;
}

/**
 * Dispatch resource state with contention tracking
 */
export interface DispatchState {
  guards: ResourcePool;
  analysts: ResourcePool;
  responders: ResourcePool;
  contentionEvents: ContentionEvent[];
}

/**
 * Resource pool for dispatch tracking
 */
export interface ResourcePool {
  available: number;
  total: number;
  deployed: { injectId: string; count: number; deployedAt: string }[];
  cooldownEndTime?: string;
  contentionLevel: 'NORMAL' | 'STRAINED' | 'CRITICAL';
}

/**
 * Event when resources are contested
 */
export interface ContentionEvent {
  timestamp: string;
  resourceType: 'guards' | 'analysts' | 'responders';
  requestedBy: string;
  granted: boolean;
  alternativeUsed?: string;
  impactOnDecision?: string;
}
