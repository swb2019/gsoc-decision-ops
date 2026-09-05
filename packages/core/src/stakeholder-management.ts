/**
 * Stakeholder Management Module
 *
 * Operationalizes GSOC stakeholder management for leadership training.
 * Covers stakeholder mapping, influence strategies, executive briefings,
 * escalation frameworks, crisis governance, and continuous improvement.
 *
 * This is role-strength/leadership training for practicing Global CMIC/GSOC
 * leadership competencies.
 */

/**
 * Stakeholder categories in corporate security operations
 */
export type StakeholderCategory =
  | 'EXECUTIVE'
  | 'CLIENT_SECURITY'
  | 'BUSINESS_UNIT'
  | 'FACILITIES'
  | 'CYBER'
  | 'LEGAL'
  | 'HR'
  | 'COMMUNICATIONS'
  | 'EXTERNAL_PARTNER'
  | 'VENDOR'
  | 'REGULATOR';

/**
 * Stakeholder influence level in decision-making
 */
export type InfluenceLevel = 'DECISION_MAKER' | 'KEY_INFLUENCER' | 'CONTRIBUTOR' | 'INFORMED';

/**
 * Stakeholder interest/engagement level
 */
export type InterestLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Communication frequency preference
 */
export type CommFrequency = 'REAL_TIME' | 'HOURLY' | 'SHIFT_END' | 'DAILY' | 'AS_NEEDED';

/**
 * Individual stakeholder in the stakeholder map
 */
export interface MappedStakeholder {
  id: string;
  name: string;
  title: string;
  organization: string;
  category: StakeholderCategory;
  influence: InfluenceLevel;
  interest: InterestLevel;
  communicationPreference: {
    method: 'PHONE' | 'EMAIL' | 'BRIDGE' | 'IN_PERSON' | 'CHAT' | 'DASHBOARD';
    frequency: CommFrequency;
    escalationThreshold: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ALL';
  };
  relationship: {
    strength: 'STRONG' | 'DEVELOPING' | 'WEAK' | 'NEW';
    lastInteraction?: string;
    preferredStyle: 'DATA_DRIVEN' | 'NARRATIVE' | 'ACTION_ORIENTED' | 'CONSENSUS_BUILDING';
  };
  concerns: string[];
  expectations: string[];
  decisionAuthority: string[];
  delegatesTo?: string;
}

/**
 * Stakeholder influence quadrant (Power/Interest matrix)
 */
export interface StakeholderQuadrant {
  highPowerHighInterest: string[];
  highPowerLowInterest: string[];
  lowPowerHighInterest: string[];
  lowPowerLowInterest: string[];
}

/**
 * Complete stakeholder map for a scenario
 */
export interface StakeholderMap {
  id: string;
  scenarioId: string;
  stakeholders: MappedStakeholder[];
  quadrant: StakeholderQuadrant;
  criticalRelationships: {
    stakeholderId: string;
    importance: string;
    riskIfNeglected: string;
  }[];
  communicationPlan: CommunicationPlan;
}

/**
 * Communication plan for stakeholder engagement
 */
export interface CommunicationPlan {
  id: string;
  scheduledBriefings: ScheduledBriefing[];
  escalationMatrix: EscalationLevel[];
  messageTemplates: MessageTemplate[];
}

/**
 * Scheduled briefing for stakeholders
 */
export interface ScheduledBriefing {
  id: string;
  stakeholderIds: string[];
  timing: string;
  format: 'ONE_ON_ONE' | 'GROUP_CALL' | 'WRITTEN_UPDATE' | 'DASHBOARD_REVIEW';
  agenda: string[];
  keyMessages: string[];
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'RESCHEDULED';
}

/**
 * Escalation level in the framework
 */
export interface EscalationLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  criteria: string[];
  notifyRoles: string[];
  authorityRequired: string;
  responseTimeMinutes: number;
  wakeUpAuthorized: boolean;
  externalNotification: boolean;
}

/**
 * Default escalation framework
 */
export const DEFAULT_ESCALATION_FRAMEWORK: EscalationLevel[] = [
  {
    level: 1,
    name: 'Watch Desk Handling',
    criteria: ['Routine incident', 'Single location', 'No injuries', 'Standard procedures apply'],
    notifyRoles: ['Watch Commander'],
    authorityRequired: 'Watch Commander',
    responseTimeMinutes: 60,
    wakeUpAuthorized: false,
    externalNotification: false,
  },
  {
    level: 2,
    name: 'Team Lead Escalation',
    criteria: [
      'Multiple systems affected',
      'Minor business impact',
      'Media potential',
      'VIP adjacent',
    ],
    notifyRoles: ['Watch Commander', 'Regional Lead', 'On-Call Manager'],
    authorityRequired: 'Regional Lead',
    responseTimeMinutes: 30,
    wakeUpAuthorized: false,
    externalNotification: false,
  },
  {
    level: 3,
    name: 'Management Notification',
    criteria: [
      'Significant business impact',
      'Regulatory implications',
      'Injury reported',
      'Executive involved',
    ],
    notifyRoles: ['Director of Security Operations', 'CSO Staff', 'Legal On-Call'],
    authorityRequired: 'Director',
    responseTimeMinutes: 15,
    wakeUpAuthorized: true,
    externalNotification: false,
  },
  {
    level: 4,
    name: 'Executive Mobilization',
    criteria: [
      'Major business disruption',
      'Life safety threat',
      'Active threat',
      'Significant financial exposure',
    ],
    notifyRoles: ['CSO', 'General Counsel', 'CEO/COO Office', 'Communications'],
    authorityRequired: 'CSO',
    responseTimeMinutes: 10,
    wakeUpAuthorized: true,
    externalNotification: true,
  },
  {
    level: 5,
    name: 'Crisis Management Team',
    criteria: [
      'Enterprise-wide impact',
      'Existential threat',
      'Active casualties',
      'Regulatory investigation',
    ],
    notifyRoles: ['CEO', 'Board Chair', 'Full CMT', 'External Counsel', 'PR Agency'],
    authorityRequired: 'CEO',
    responseTimeMinutes: 5,
    wakeUpAuthorized: true,
    externalNotification: true,
  },
];

/**
 * Message template for stakeholder communications
 */
export interface MessageTemplate {
  id: string;
  name: string;
  audience: StakeholderCategory[];
  format: 'EMAIL' | 'SMS' | 'VERBAL' | 'WRITTEN_BRIEF';
  structure: string[];
  tone: 'FORMAL' | 'DIRECT' | 'REASSURING' | 'URGENT';
}

/**
 * Executive briefing record
 */
export interface ExecutiveBriefing {
  id: string;
  timestamp: string;
  recipientId: string;
  recipientName: string;
  recipientTitle: string;
  briefingType: 'SITUATION' | 'DECISION_REQUIRED' | 'STATUS_UPDATE' | 'RISK_ADVISORY' | 'CLOSE_OUT';
  deliveryMethod: 'PHONE' | 'IN_PERSON' | 'BRIDGE' | 'WRITTEN';
  content: {
    situation: string;
    background?: string;
    assessment: string;
    recommendation?: string;
    options?: BriefingOption[];
    timeline?: string;
    resourcesRequired?: string;
  };
  executivePresenceScore?: number;
  questionsFaced: string[];
  responsesGiven: string[];
  outcome: 'DECISION_MADE' | 'DEFERRED' | 'ESCALATED' | 'ACKNOWLEDGED';
  decisionMade?: string;
  followUpRequired: string[];
}

/**
 * Option presented in a briefing
 */
export interface BriefingOption {
  id: string;
  description: string;
  pros: string[];
  cons: string[];
  cost: 'HIGH' | 'MEDIUM' | 'LOW';
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  recommended: boolean;
}

/**
 * Crisis governance structure
 */
export interface CrisisGovernance {
  activationCriteria: string[];
  cmt: {
    chair: string;
    members: { role: string; name: string; backupName: string }[];
    meetingCadence: string;
    decisionAuthority: string[];
  };
  commandStructure: {
    incidentCommander: string;
    operationsChief: string;
    planningChief: string;
    logisticsChief: string;
    financeChief: string;
  };
  externalLiaison: {
    lawEnforcement: string;
    regulators: string;
    media: string;
    vendors: string;
  };
}

/**
 * Maturity level for security program assessment
 */
export type MaturityLevel = 'INITIAL' | 'DEVELOPING' | 'DEFINED' | 'MANAGED' | 'OPTIMIZING';

/**
 * Program maturity assessment domain
 */
export interface MaturityDomain {
  id: string;
  name: string;
  description: string;
  currentLevel: MaturityLevel;
  targetLevel: MaturityLevel;
  gaps: string[];
  initiatives: MaturityInitiative[];
}

/**
 * Initiative to improve maturity
 */
export interface MaturityInitiative {
  id: string;
  name: string;
  description: string;
  effort: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
  owner: string;
  targetDate?: string;
}

/**
 * Continuous improvement conversation with stakeholder
 */
export interface ImprovementConversation {
  id: string;
  timestamp: string;
  stakeholderId: string;
  stakeholderName: string;
  topic:
    | 'MATURITY_REVIEW'
    | 'CAPABILITY_GAP'
    | 'PROCESS_IMPROVEMENT'
    | 'RESOURCE_REQUEST'
    | 'STRATEGIC_ALIGNMENT';
  currentState: string;
  desiredState: string;
  proposedActions: string[];
  stakeholderFeedback?: string;
  commitments: string[];
  nextSteps: string[];
  outcome: 'ALIGNED' | 'NEEDS_FOLLOW_UP' | 'DISAGREEMENT' | 'DEFERRED';
}

/**
 * NPC stakeholder for simulation interactions
 */
export interface StakeholderNPC {
  id: string;
  stakeholder: MappedStakeholder;
  personality: {
    decisionStyle: 'ANALYTICAL' | 'DIRECTIVE' | 'COLLABORATIVE' | 'CONCEPTUAL';
    riskTolerance: 'RISK_AVERSE' | 'RISK_NEUTRAL' | 'RISK_TOLERANT';
    communicationStyle: 'DETAILED' | 'EXECUTIVE_SUMMARY' | 'ACTION_FOCUSED';
    underPressure: 'CALM' | 'DEMANDING' | 'SUPPORTIVE' | 'ABSENT';
  };
  currentMood: 'SATISFIED' | 'NEUTRAL' | 'CONCERNED' | 'FRUSTRATED' | 'ANGRY';
  recentInteractions: string[];
  pendingExpectations: string[];
  triggerPhrases: { phrase: string; reaction: string }[];
}

/**
 * Create default stakeholder map for simulations
 */
export function createDefaultStakeholderMap(scenarioId: string): StakeholderMap {
  const stakeholders: MappedStakeholder[] = [
    {
      id: 'sh-cso',
      name: 'Victoria Sterling',
      title: 'Chief Security Officer',
      organization: 'Corporate Security',
      category: 'EXECUTIVE',
      influence: 'DECISION_MAKER',
      interest: 'HIGH',
      communicationPreference: {
        method: 'PHONE',
        frequency: 'REAL_TIME',
        escalationThreshold: 'HIGH',
      },
      relationship: {
        strength: 'STRONG',
        preferredStyle: 'ACTION_ORIENTED',
      },
      concerns: ['Reputation risk', 'Regulatory compliance', 'Executive safety'],
      expectations: ['Proactive threat intelligence', 'Clear escalation decisions', 'No surprises'],
      decisionAuthority: ['Crisis activation', 'External notification', 'Resource surge'],
    },
    {
      id: 'sh-ciso',
      name: 'Marcus Chen',
      title: 'Chief Information Security Officer',
      organization: 'Information Security',
      category: 'CYBER',
      influence: 'KEY_INFLUENCER',
      interest: 'HIGH',
      communicationPreference: {
        method: 'BRIDGE',
        frequency: 'HOURLY',
        escalationThreshold: 'HIGH',
      },
      relationship: {
        strength: 'DEVELOPING',
        preferredStyle: 'DATA_DRIVEN',
      },
      concerns: ['Data breach', 'Cyber-physical convergence', 'Vendor security'],
      expectations: ['Technical accuracy', 'Timely IOC sharing', 'Joint response coordination'],
      decisionAuthority: ['Network isolation', 'Incident classification', 'Forensic holds'],
    },
    {
      id: 'sh-gc',
      name: 'Sarah Whitmore',
      title: 'General Counsel',
      organization: 'Legal',
      category: 'LEGAL',
      influence: 'DECISION_MAKER',
      interest: 'MEDIUM',
      communicationPreference: {
        method: 'EMAIL',
        frequency: 'AS_NEEDED',
        escalationThreshold: 'CRITICAL',
      },
      relationship: {
        strength: 'DEVELOPING',
        preferredStyle: 'DATA_DRIVEN',
      },
      concerns: ['Litigation exposure', 'Regulatory notification', 'Evidence preservation'],
      expectations: ['Early notification', 'Clear documentation', 'Privilege protection'],
      decisionAuthority: ['Law enforcement engagement', 'Disclosure decisions', 'Hold orders'],
    },
    {
      id: 'sh-facilities',
      name: 'Robert Martinez',
      title: 'VP Global Facilities',
      organization: 'Corporate Services',
      category: 'FACILITIES',
      influence: 'CONTRIBUTOR',
      interest: 'HIGH',
      communicationPreference: {
        method: 'PHONE',
        frequency: 'HOURLY',
        escalationThreshold: 'MEDIUM',
      },
      relationship: {
        strength: 'STRONG',
        preferredStyle: 'ACTION_ORIENTED',
      },
      concerns: ['Building safety', 'Access control', 'Life safety systems'],
      expectations: ['Quick response', 'Clear building status', 'Vendor coordination'],
      decisionAuthority: ['Building lockdown', 'Evacuation', 'Vendor emergency access'],
    },
    {
      id: 'sh-comms',
      name: 'Jennifer Park',
      title: 'VP Communications',
      organization: 'Corporate Communications',
      category: 'COMMUNICATIONS',
      influence: 'KEY_INFLUENCER',
      interest: 'MEDIUM',
      communicationPreference: {
        method: 'CHAT',
        frequency: 'REAL_TIME',
        escalationThreshold: 'HIGH',
      },
      relationship: {
        strength: 'DEVELOPING',
        preferredStyle: 'NARRATIVE',
      },
      concerns: ['Media inquiries', 'Employee communications', 'Brand protection'],
      expectations: ['Early warning', 'Talking points', 'Coordinated messaging'],
      decisionAuthority: ['Press statements', 'Employee alerts', 'Social media response'],
    },
    {
      id: 'sh-bu-head',
      name: 'David Thompson',
      title: 'President, North America',
      organization: 'Business Operations',
      category: 'BUSINESS_UNIT',
      influence: 'DECISION_MAKER',
      interest: 'MEDIUM',
      communicationPreference: {
        method: 'PHONE',
        frequency: 'SHIFT_END',
        escalationThreshold: 'HIGH',
      },
      relationship: {
        strength: 'WEAK',
        preferredStyle: 'ACTION_ORIENTED',
      },
      concerns: ['Revenue impact', 'Customer confidence', 'Operational continuity'],
      expectations: ['Business impact clarity', 'Recovery timeline', 'Customer comms'],
      decisionAuthority: [
        'Business continuity activation',
        'Customer notification',
        'Resource allocation',
      ],
      delegatesTo: 'sh-coo-delegate',
    },
    {
      id: 'sh-hr',
      name: 'Amanda Lewis',
      title: 'CHRO',
      organization: 'Human Resources',
      category: 'HR',
      influence: 'CONTRIBUTOR',
      interest: 'MEDIUM',
      communicationPreference: {
        method: 'EMAIL',
        frequency: 'DAILY',
        escalationThreshold: 'HIGH',
      },
      relationship: {
        strength: 'DEVELOPING',
        preferredStyle: 'CONSENSUS_BUILDING',
      },
      concerns: ['Employee safety', 'Workplace violence', 'Privacy'],
      expectations: ['Employee impact assessment', 'Support resources', 'Policy adherence'],
      decisionAuthority: ['Employee actions', 'EAP activation', 'Return-to-work decisions'],
    },
  ];

  return {
    id: `sm-${scenarioId}`,
    scenarioId,
    stakeholders,
    quadrant: categorizeStakeholders(stakeholders),
    criticalRelationships: [
      {
        stakeholderId: 'sh-cso',
        importance: 'Primary executive sponsor and escalation point',
        riskIfNeglected: 'Loss of executive support, delayed decisions',
      },
      {
        stakeholderId: 'sh-ciso',
        importance: 'Cross-functional partner for cyber-physical incidents',
        riskIfNeglected: 'Siloed response, missed indicators',
      },
      {
        stakeholderId: 'sh-gc',
        importance: 'Legal guidance and regulatory compliance',
        riskIfNeglected: 'Legal exposure, notification failures',
      },
    ],
    communicationPlan: {
      id: `cp-${scenarioId}`,
      scheduledBriefings: [],
      escalationMatrix: DEFAULT_ESCALATION_FRAMEWORK,
      messageTemplates: [],
    },
  };
}

/**
 * Categorize stakeholders into power/interest quadrants
 */
export function categorizeStakeholders(stakeholders: MappedStakeholder[]): StakeholderQuadrant {
  const quadrant: StakeholderQuadrant = {
    highPowerHighInterest: [],
    highPowerLowInterest: [],
    lowPowerHighInterest: [],
    lowPowerLowInterest: [],
  };

  for (const s of stakeholders) {
    const highPower = s.influence === 'DECISION_MAKER' || s.influence === 'KEY_INFLUENCER';
    const highInterest = s.interest === 'HIGH';

    if (highPower && highInterest) {
      quadrant.highPowerHighInterest.push(s.id);
    } else if (highPower && !highInterest) {
      quadrant.highPowerLowInterest.push(s.id);
    } else if (!highPower && highInterest) {
      quadrant.lowPowerHighInterest.push(s.id);
    } else {
      quadrant.lowPowerLowInterest.push(s.id);
    }
  }

  return quadrant;
}

/**
 * Determine escalation level based on incident criteria
 */
export function determineEscalationLevel(
  criteria: {
    businessImpact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    lifeSafety: boolean;
    executiveInvolved: boolean;
    regulatoryImplication: boolean;
    mediaExposure: boolean;
    activeThread: boolean;
  },
  framework: EscalationLevel[] = DEFAULT_ESCALATION_FRAMEWORK
): EscalationLevel {
  if (criteria.lifeSafety || criteria.activeThread) {
    return framework.find((l) => l.level === 5) || framework[framework.length - 1];
  }

  if (criteria.businessImpact === 'CRITICAL' || criteria.executiveInvolved) {
    return framework.find((l) => l.level === 4) || framework[3];
  }

  if (
    criteria.regulatoryImplication ||
    criteria.mediaExposure ||
    criteria.businessImpact === 'HIGH'
  ) {
    return framework.find((l) => l.level === 3) || framework[2];
  }

  if (criteria.businessImpact === 'MEDIUM') {
    return framework.find((l) => l.level === 2) || framework[1];
  }

  return framework.find((l) => l.level === 1) || framework[0];
}

/**
 * Calculate executive presence score for a briefing
 */
export function calculateExecutivePresenceScore(briefing: ExecutiveBriefing): number {
  let score = 0;

  if (briefing.content.situation.length > 50) score += 20;
  if (briefing.content.assessment.length > 50) score += 20;
  if (briefing.content.recommendation) score += 15;
  if (briefing.content.options && briefing.content.options.length > 1) score += 15;
  if (briefing.responsesGiven.length >= briefing.questionsFaced.length) score += 15;
  if (briefing.outcome === 'DECISION_MADE' || briefing.outcome === 'ACKNOWLEDGED') score += 15;

  return Math.min(100, score);
}

/**
 * Create stakeholder NPCs for simulation
 */
export function createStakeholderNPCs(map: StakeholderMap): StakeholderNPC[] {
  return map.stakeholders.map((s) => ({
    id: `npc-${s.id}`,
    stakeholder: s,
    personality: {
      decisionStyle:
        s.relationship.preferredStyle === 'DATA_DRIVEN'
          ? ('ANALYTICAL' as const)
          : s.relationship.preferredStyle === 'ACTION_ORIENTED'
            ? ('DIRECTIVE' as const)
            : s.relationship.preferredStyle === 'CONSENSUS_BUILDING'
              ? ('COLLABORATIVE' as const)
              : ('CONCEPTUAL' as const),
      riskTolerance:
        s.category === 'LEGAL'
          ? ('RISK_AVERSE' as const)
          : s.category === 'BUSINESS_UNIT'
            ? ('RISK_TOLERANT' as const)
            : ('RISK_NEUTRAL' as const),
      communicationStyle:
        s.influence === 'DECISION_MAKER' ? ('EXECUTIVE_SUMMARY' as const) : ('DETAILED' as const),
      underPressure: s.category === 'EXECUTIVE' ? ('DEMANDING' as const) : ('CALM' as const),
    },
    currentMood: 'NEUTRAL' as const,
    recentInteractions: [],
    pendingExpectations: s.expectations,
    triggerPhrases: [],
  }));
}
