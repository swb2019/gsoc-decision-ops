/**
 * GSOC Decision Operations - Decision Log Management
 *
 * Functions for creating, updating, and analyzing decision logs
 * during incident response.
 */

import type {
  DecisionLog,
  Decision,
  Fact,
  Assumption,
  Unknown,
  Stakeholder,
  BridgeRecord,
  ActionItem,
  SeverityLevel,
  ImpactCategory,
  DecisionPosture,
  ConfidenceLevel,
  VendorContext,
  LearningObjective,
  ScenarioInject,
  RPDPrompts,
  ESRMRiskFraming,
  LinkedEntity,
} from './types.js';
import { generateId, now, countWhere } from './utils.js';

/**
 * Configuration for creating a new decision log
 */
export interface CreateDecisionLogConfig {
  title: string;
  description: string;
  severity: SeverityLevel;
  impactCategories: ImpactCategory[];
  reportedBy: string;
  createdBy: string;
  organization: string;
  exerciseMode?: boolean;
  syntheticScenario?: boolean;
  vendorContext?: VendorContext;
  learningObjective?: LearningObjective;
  injects?: ScenarioInject[];
  linkedEntities?: LinkedEntity[];
}

/**
 * Create a new decision log for an incident
 */
export function createDecisionLog(config: CreateDecisionLogConfig): DecisionLog {
  const id = generateId('DL');
  const timestamp = now();

  return {
    id,
    version: '1.0.0',
    createdAt: timestamp,
    lastUpdated: timestamp,

    incident: {
      title: config.title,
      description: config.description,
      severity: config.severity,
      impactCategories: config.impactCategories,
      detectedAt: timestamp,
      reportedBy: config.reportedBy,
      status: 'ACTIVE',
    },

    vendorContext: config.vendorContext,
    learningObjective: config.learningObjective,
    injects: config.injects ?? [],
    linkedEntities: config.linkedEntities,

    facts: [],
    assumptions: [],
    unknowns: [],
    decisions: [],
    stakeholders: [],
    bridgeRecords: [],
    actionItems: [],

    timeline: [
      {
        id: generateId('TL'),
        timestamp,
        type: 'DETECTION',
        title: 'Incident Detected',
        description: config.description,
      },
    ],

    metadata: {
      createdBy: config.createdBy,
      organization: config.organization,
      exerciseMode: config.exerciseMode ?? false,
      syntheticScenario: config.syntheticScenario ?? false,
    },
  };
}

/**
 * Add a fact to the decision log
 */
export function addFact(
  log: DecisionLog,
  description: string,
  source: string,
  confidence: ConfidenceLevel = 'UNVERIFIED'
): DecisionLog {
  const fact: Fact = {
    id: generateId('FACT'),
    timestamp: now(),
    description,
    source,
    confidence,
  };

  return {
    ...log,
    lastUpdated: now(),
    facts: [...log.facts, fact],
    timeline: [
      ...log.timeline,
      {
        id: generateId('TL'),
        timestamp: fact.timestamp,
        type: 'UPDATE',
        title: 'Fact Recorded',
        description: `New fact: ${description}`,
        relatedIds: [fact.id],
      },
    ],
  };
}

/**
 * Add an assumption to the decision log
 */
export function addAssumption(
  log: DecisionLog,
  description: string,
  basis: string,
  riskIfWrong: string,
  validationPlan?: string
): DecisionLog {
  const assumption: Assumption = {
    id: generateId('ASSM'),
    timestamp: now(),
    description,
    basis,
    riskIfWrong,
    validationPlan,
  };

  return {
    ...log,
    lastUpdated: now(),
    assumptions: [...log.assumptions, assumption],
  };
}

/**
 * Add an unknown to the decision log
 */
export function addUnknown(
  log: DecisionLog,
  question: string,
  priority: Unknown['priority'],
  assignedTo?: string,
  targetResolutionTime?: string
): DecisionLog {
  const unknown: Unknown = {
    id: generateId('UNK'),
    timestamp: now(),
    question,
    priority,
    assignedTo,
    targetResolutionTime,
  };

  return {
    ...log,
    lastUpdated: now(),
    unknowns: [...log.unknowns, unknown],
  };
}

/**
 * Record a decision in the decision log
 */
export interface RecordDecisionConfig {
  title: string;
  description: string;
  posture: DecisionPosture;
  owner: string;
  ownerRole: string;
  rationale: string;
  factsConsidered?: string[];
  assumptionsMade?: string[];
  unknownsAccepted?: string[];
  alternativesConsidered?: string[];
  reviewTrigger?: string;
  reviewTime?: string;
  rpdPrompts?: RPDPrompts;
  esrmFraming?: ESRMRiskFraming;
}

export function recordDecision(log: DecisionLog, config: RecordDecisionConfig): DecisionLog {
  const decision: Decision = {
    id: generateId('DEC'),
    timestamp: now(),
    title: config.title,
    description: config.description,
    posture: config.posture,
    owner: config.owner,
    ownerRole: config.ownerRole,
    rationale: config.rationale,
    factsConsidered: config.factsConsidered ?? [],
    assumptionsMade: config.assumptionsMade ?? [],
    unknownsAccepted: config.unknownsAccepted ?? [],
    alternativesConsidered: config.alternativesConsidered,
    reviewTrigger: config.reviewTrigger,
    reviewTime: config.reviewTime,
    rpdPrompts: config.rpdPrompts,
    esrmFraming: config.esrmFraming,
  };

  return {
    ...log,
    lastUpdated: now(),
    decisions: [...log.decisions, decision],
    timeline: [
      ...log.timeline,
      {
        id: generateId('TL'),
        timestamp: decision.timestamp,
        type: 'DECISION',
        title: `Decision: ${config.title}`,
        description: `${config.posture} - ${config.description}`,
        relatedIds: [decision.id],
      },
    ],
  };
}

/**
 * Add a stakeholder to the decision log
 */
export function addStakeholder(
  log: DecisionLog,
  name: string,
  role: string,
  organization: string,
  contactMethod: string,
  briefingLevel: Stakeholder['briefingLevel'] = 'NEED_TO_KNOW'
): DecisionLog {
  const stakeholder: Stakeholder = {
    id: generateId('STK'),
    name,
    role,
    organization,
    contactMethod,
    briefingLevel,
  };

  return {
    ...log,
    lastUpdated: now(),
    stakeholders: [...log.stakeholders, stakeholder],
  };
}

/**
 * Record a bridge call
 */
export interface RecordBridgeConfig {
  scheduledTime: string;
  type: BridgeRecord['type'];
  attendees: string[];
  keyUpdates: string[];
  decisionsReferenced?: string[];
  nextBridgeTime?: string;
  notes?: string;
}

export function recordBridge(log: DecisionLog, config: RecordBridgeConfig): DecisionLog {
  const bridge: BridgeRecord = {
    id: generateId('BRG'),
    scheduledTime: config.scheduledTime,
    actualStartTime: now(),
    type: config.type,
    attendees: config.attendees,
    keyUpdates: config.keyUpdates,
    decisionsReferenced: config.decisionsReferenced ?? [],
    nextBridgeTime: config.nextBridgeTime,
    notes: config.notes,
  };

  return {
    ...log,
    lastUpdated: now(),
    bridgeRecords: [...log.bridgeRecords, bridge],
    timeline: [
      ...log.timeline,
      {
        id: generateId('TL'),
        timestamp: bridge.actualStartTime!,
        type: 'BRIDGE',
        title: `${config.type} Bridge Call`,
        description: `Attendees: ${config.attendees.length}. Updates: ${config.keyUpdates.length}`,
        relatedIds: [bridge.id],
      },
    ],
  };
}

/**
 * Add an action item
 */
export function addActionItem(
  log: DecisionLog,
  description: string,
  owner: string,
  priority: ActionItem['priority'],
  dueBy?: string
): DecisionLog {
  const actionItem: ActionItem = {
    id: generateId('ACT'),
    createdAt: now(),
    description,
    owner,
    priority,
    status: 'OPEN',
    dueBy,
  };

  return {
    ...log,
    lastUpdated: now(),
    actionItems: [...log.actionItems, actionItem],
    timeline: [
      ...log.timeline,
      {
        id: generateId('TL'),
        timestamp: actionItem.createdAt,
        type: 'ACTION',
        title: `Action Item Created`,
        description: `${description} (Owner: ${owner})`,
        relatedIds: [actionItem.id],
      },
    ],
  };
}

/**
 * Update action item status
 */
export function updateActionItemStatus(
  log: DecisionLog,
  actionItemId: string,
  status: ActionItem['status'],
  notes?: string
): DecisionLog {
  const updatedActionItems = log.actionItems.map((item) => {
    if (item.id === actionItemId) {
      return {
        ...item,
        status,
        completedAt: status === 'COMPLETED' ? now() : item.completedAt,
        notes: notes ?? item.notes,
      };
    }
    return item;
  });

  return {
    ...log,
    lastUpdated: now(),
    actionItems: updatedActionItems,
  };
}

/**
 * Resolve an unknown
 */
export function resolveUnknown(
  log: DecisionLog,
  unknownId: string,
  resolution: string
): DecisionLog {
  const updatedUnknowns = log.unknowns.map((unk) => {
    if (unk.id === unknownId) {
      return {
        ...unk,
        resolvedAt: now(),
        resolution,
      };
    }
    return unk;
  });

  return {
    ...log,
    lastUpdated: now(),
    unknowns: updatedUnknowns,
  };
}

/**
 * Validate an assumption
 */
export function validateAssumption(
  log: DecisionLog,
  assumptionId: string,
  result: Assumption['validationResult']
): DecisionLog {
  const updatedAssumptions = log.assumptions.map((assm) => {
    if (assm.id === assumptionId) {
      return {
        ...assm,
        validatedAt: now(),
        validationResult: result,
      };
    }
    return assm;
  });

  return {
    ...log,
    lastUpdated: now(),
    assumptions: updatedAssumptions,
  };
}

/**
 * Update incident status
 */
export function updateIncidentStatus(
  log: DecisionLog,
  status: DecisionLog['incident']['status'],
  incidentCommander?: string
): DecisionLog {
  return {
    ...log,
    lastUpdated: now(),
    incident: {
      ...log.incident,
      status,
      incidentCommander: incidentCommander ?? log.incident.incidentCommander,
    },
    timeline: [
      ...log.timeline,
      {
        id: generateId('TL'),
        timestamp: now(),
        type: status === 'RESOLVED' ? 'RESOLUTION' : 'UPDATE',
        title: `Status Changed: ${status}`,
        description: `Incident status updated to ${status}`,
      },
    ],
  };
}

/**
 * Reveal an inject in the scenario
 */
export function revealInject(log: DecisionLog, injectId: string): DecisionLog {
  const inject = log.injects.find((i) => i.id === injectId);
  if (!inject || inject.revealed) {
    return log;
  }

  const updatedInjects = log.injects.map((i) => {
    if (i.id === injectId) {
      return { ...i, revealed: true, revealedAt: now() };
    }
    return i;
  });

  return {
    ...log,
    lastUpdated: now(),
    injects: updatedInjects,
    timeline: [
      ...log.timeline,
      {
        id: generateId('TL'),
        timestamp: now(),
        type: 'UPDATE',
        title: `Inject: ${inject.title}`,
        description: inject.content,
        relatedIds: [inject.id],
      },
    ],
  };
}

/**
 * Get next unrevealed inject
 */
export function getNextInject(log: DecisionLog): ScenarioInject | undefined {
  return log.injects
    .filter((i) => !i.revealed)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)[0];
}

/**
 * Get all revealed injects
 */
export function getRevealedInjects(log: DecisionLog): ScenarioInject[] {
  return log.injects.filter((i) => i.revealed).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

/**
 * Calculate decision log statistics
 */
export interface DecisionLogStats {
  totalFacts: number;
  confirmedFacts: number;
  totalAssumptions: number;
  validatedAssumptions: number;
  invalidatedAssumptions: number;
  totalUnknowns: number;
  resolvedUnknowns: number;
  criticalUnknowns: number;
  totalDecisions: number;
  postureBreakdown: Record<DecisionPosture, number>;
  totalActionItems: number;
  completedActionItems: number;
  blockedActionItems: number;
  totalBridges: number;
}

export function calculateStats(log: DecisionLog): DecisionLogStats {
  return {
    totalFacts: log.facts.length,
    confirmedFacts: countWhere(log.facts, (f) => f.confidence === 'CONFIRMED'),
    totalAssumptions: log.assumptions.length,
    validatedAssumptions: countWhere(log.assumptions, (a) => a.validationResult === 'CONFIRMED'),
    invalidatedAssumptions: countWhere(
      log.assumptions,
      (a) => a.validationResult === 'INVALIDATED'
    ),
    totalUnknowns: log.unknowns.length,
    resolvedUnknowns: countWhere(log.unknowns, (u) => u.resolution !== undefined),
    criticalUnknowns: countWhere(log.unknowns, (u) => u.priority === 'CRITICAL' && !u.resolution),
    totalDecisions: log.decisions.length,
    postureBreakdown: {
      CONTINUE: countWhere(log.decisions, (d) => d.posture === 'CONTINUE'),
      DEGRADE: countWhere(log.decisions, (d) => d.posture === 'DEGRADE'),
      PAUSE: countWhere(log.decisions, (d) => d.posture === 'PAUSE'),
    },
    totalActionItems: log.actionItems.length,
    completedActionItems: countWhere(log.actionItems, (a) => a.status === 'COMPLETED'),
    blockedActionItems: countWhere(log.actionItems, (a) => a.status === 'BLOCKED'),
    totalBridges: log.bridgeRecords.length,
  };
}
