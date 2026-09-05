/**
 * Leadership Scenarios Module
 *
 * Training scenarios focused on GSOC/CMIC leadership competencies:
 * - Team management during high-pressure situations
 * - Stakeholder management and executive briefings
 * - Crisis coordination across multiple domains
 * - Program excellence and strategic decision-making
 *
 * Scenario types: geopolitical, civil unrest, severe weather, natural disaster,
 * tech outages, operational disruption, and emerging risk injects.
 */

import type {
  DecisionLog,
  VendorContext,
  LearningObjective,
  ScenarioInject,
  LinkedEntity,
} from '../types.js';
import { createDecisionLog } from '../decision-log.js';
import { generateId } from '../utils.js';
import type { ScenarioESRMConfig, ProtectedAsset } from '../esrm.js';
import type { SecurityDomain, FusedInject } from './fused-gsoc.js';

/**
 * Leadership scenario category
 */
export type LeadershipScenarioType =
  | 'CIVIL_UNREST'
  | 'SEVERE_WEATHER'
  | 'NATURAL_DISASTER'
  | 'TECH_OUTAGE'
  | 'PERSONNEL_THREAT'
  | 'GEOPOLITICAL'
  | 'OPERATIONAL_DISRUPTION'
  | 'EMERGING_RISK';

/**
 * Leadership challenge type for scoring
 */
export type LeadershipChallengeType =
  | 'TEAM_COORDINATION'
  | 'STAKEHOLDER_BRIEFING'
  | 'RESOURCE_ALLOCATION'
  | 'SHIFT_HANDOFF'
  | 'CRISIS_GOVERNANCE'
  | 'EXECUTIVE_PRESENCE'
  | 'SOP_ENFORCEMENT'
  | 'CONTINUOUS_IMPROVEMENT';

/**
 * Leadership inject extending fused inject with leadership challenges
 */
export interface LeadershipInject extends FusedInject {
  leadershipChallenge?: LeadershipChallengeType;
  teamImpact?: {
    regionsAffected: ('AMERICAS' | 'EMEA' | 'APAC')[];
    resourceDemand: 'HIGH' | 'MEDIUM' | 'LOW';
    shiftHandoffRequired: boolean;
    loadBalanceNeeded: boolean;
  };
  stakeholderImpact?: {
    notifyRequired: string[];
    briefingType: 'SITUATION' | 'DECISION_REQUIRED' | 'STATUS_UPDATE' | 'RISK_ADVISORY';
    escalationLevel: 1 | 2 | 3 | 4 | 5;
    executivePresenceRequired: boolean;
  };
  programImpact?: {
    sopGapIdentified: boolean;
    metricsAffected: string[];
    processImprovementOpportunity: boolean;
  };
}

/**
 * Entity definitions for Civil Unrest scenario
 */
const CIVIL_UNREST_ENTITIES: LinkedEntity[] = [
  {
    id: 'ENT-DOWNTOWN-HQ',
    type: 'PLACE',
    name: 'Downtown Headquarters',
    shortName: 'Downtown HQ',
    description: 'Main corporate campus near protest route',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-EMPLOYEE-POP', 'ENT-DC-FACILITY'],
  },
  {
    id: 'ENT-EMPLOYEE-POP',
    type: 'PERSON',
    name: 'Downtown Employee Population',
    shortName: 'DT Employees',
    description: '2,400 employees at downtown location',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-DOWNTOWN-HQ'],
  },
  {
    id: 'ENT-DC-FACILITY',
    type: 'PLACE',
    name: 'Data Center Facility',
    shortName: 'DC',
    description: 'Primary data center 3 miles from downtown',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-DOWNTOWN-HQ'],
  },
  {
    id: 'ENT-REGIONAL-LEAD-AMER',
    type: 'PERSON',
    name: 'Americas Regional Lead',
    shortName: 'AMER Lead',
    description: 'Regional team lead managing local response',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-DOWNTOWN-HQ'],
  },
  {
    id: 'ENT-EXEC-SUITE',
    type: 'PLACE',
    name: 'Executive Floor',
    shortName: 'Exec Floor',
    description: 'C-suite offices on floors 18-20',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-DOWNTOWN-HQ', 'ENT-CSO'],
  },
  {
    id: 'ENT-CSO',
    type: 'PERSON',
    name: 'Chief Security Officer',
    shortName: 'CSO',
    description: 'Primary executive stakeholder for security decisions',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-EXEC-SUITE'],
  },
];

/**
 * Protected assets for Civil Unrest scenario
 */
const CIVIL_UNREST_ASSETS: ProtectedAsset[] = [
  {
    id: 'asset-employee-safety',
    name: 'Employee Safety',
    description: 'Physical safety of 2,400 downtown employees',
    criticality: 'CRITICAL',
    businessFunction: 'Human Resources',
    owner: {
      name: 'CHRO',
      title: 'Chief Human Resources Officer',
      organization: 'Human Resources',
      contactMethod: 'Emergency line',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Potential exposure to civil unrest near office',
  },
  {
    id: 'asset-facility-ops',
    name: 'Facility Operations',
    description: 'Downtown HQ building access and operations',
    criticality: 'HIGH',
    businessFunction: 'Facilities',
    owner: {
      name: 'VP Facilities',
      title: 'Vice President, Global Facilities',
      organization: 'Corporate Services',
      contactMethod: 'Bridge / Mobile',
      riskTolerance: 'MODERATE',
      notified: false,
    },
    currentExposure: 'Building perimeter exposure to protest activity',
  },
  {
    id: 'asset-business-continuity',
    name: 'Business Continuity',
    description: 'Ability to maintain critical operations',
    criticality: 'HIGH',
    businessFunction: 'Operations',
    owner: {
      name: 'COO',
      title: 'Chief Operating Officer',
      organization: 'Operations',
      contactMethod: 'EA / Direct',
      riskTolerance: 'MODERATE',
      notified: false,
    },
    currentExposure: 'Potential work-from-home surge, access disruption',
  },
];

/**
 * Scenario: Civil Unrest - Downtown Protests
 *
 * Tests leadership competencies in managing team across regions during
 * civil unrest, stakeholder communication, and crisis governance.
 */
export function createCivilUnrestScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'Metropolitan Security Services',
    vendorType: 'Contract Security & Executive Protection',
    servicesAffected: ['Lobby security', 'Parking enforcement', 'Perimeter patrol'],
    slaRequirements: '24/7 coverage, 15-minute response',
    alternateVendors: ['Off-duty law enforcement', 'Emergency surge contractor'],
    lastKnownGoodState: 'Normal operations',
  };

  const learningObjective: LearningObjective = {
    primary:
      'Coordinate multi-regional team response while managing executive stakeholder expectations during civil unrest',
    secondary: [
      'Practice shift handoffs during extended incident',
      'Execute stakeholder communication plan',
      'Balance employee safety with business continuity',
      'Apply escalation framework appropriately',
    ],
    expectedDecisions: [
      'Building posture (shelter/dismiss/remote)',
      'Staff augmentation decision',
      'Executive communication timing',
      'Regional team coordination',
    ],
    skillsTrained: [
      'Follow-the-sun team coordination',
      'Stakeholder management under pressure',
      'Crisis governance execution',
      'Resource allocation decisions',
    ],
  };

  const injects: LeadershipInject[] = [
    {
      id: generateId('INJ'),
      sequenceNumber: 1,
      revealAtMinute: 0.25,
      title: 'INTEL: Planned Downtown Protests',
      content:
        'Threat intel reports permitted protests planned for downtown area Saturday through Monday. ' +
        'Route passes within 2 blocks of HQ. Similar events in other cities saw escalation. ' +
        'Your EMEA and APAC leads are asking for guidance to share with their stakeholders.',
      source: 'Threat Intelligence',
      decisionPressure: 'How to brief your regional leads? What pre-positioning needed?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'OSINT',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-DOWNTOWN-HQ', 'ENT-REGIONAL-LEAD-AMER'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      leadershipChallenge: 'TEAM_COORDINATION',
      teamImpact: {
        regionsAffected: ['AMERICAS', 'EMEA', 'APAC'],
        resourceDemand: 'MEDIUM',
        shiftHandoffRequired: false,
        loadBalanceNeeded: true,
      },
      stakeholderImpact: {
        notifyRequired: ['CSO', 'VP Facilities', 'CHRO'],
        briefingType: 'RISK_ADVISORY',
        escalationLevel: 2,
        executivePresenceRequired: false,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 0.75,
      title: 'SITE: Protest Crowd Growing',
      content:
        'Security officer: Crowd size increasing rapidly—estimated 800+ now, growing. ' +
        'Signs indicate planned march toward financial district (our direction). ' +
        'Lobby visitors asking about situation. Your AMER team lead requests guidance.',
      source: 'Site Security',
      decisionPressure: 'Building posture decision needed. What to tell employees?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'SITE_SECURITY',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-DOWNTOWN-HQ', 'ENT-EMPLOYEE-POP', 'ENT-REGIONAL-LEAD-AMER'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 2 },
      leadershipChallenge: 'RESOURCE_ALLOCATION',
      teamImpact: {
        regionsAffected: ['AMERICAS'],
        resourceDemand: 'HIGH',
        shiftHandoffRequired: false,
        loadBalanceNeeded: false,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 1.5,
      title: 'EXEC: CSO Wants Status',
      content:
        'CSO calling in 5 minutes for briefing. Wants to know: (1) Current situation, ' +
        '(2) Employee risk level, (3) Building recommendation, (4) Your team posture across regions. ' +
        'Prep your briefing—executive presence matters here.',
      source: 'Executive Office',
      decisionPressure: 'Executive briefing incoming. What is your recommendation?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-CSO', 'ENT-DOWNTOWN-HQ'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: {},
      leadershipChallenge: 'EXECUTIVE_PRESENCE',
      stakeholderImpact: {
        notifyRequired: ['CSO'],
        briefingType: 'DECISION_REQUIRED',
        escalationLevel: 3,
        executivePresenceRequired: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
      revealAtMinute: 2.5,
      title: 'HR: Employee Concerns Escalating',
      content:
        'CHRO reports: HR receiving concerned calls from employees about safety. ' +
        'Some asking to leave early, others asking if WFH approved. Manager guidance needed. ' +
        'Communications team asking for talking points.',
      source: 'HR Business Partner',
      decisionPressure: 'Coordinate HR/Comms response. What guidance for managers?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-EMPLOYEE-POP'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      leadershipChallenge: 'STAKEHOLDER_BRIEFING',
      stakeholderImpact: {
        notifyRequired: ['CHRO', 'VP Communications'],
        briefingType: 'STATUS_UPDATE',
        escalationLevel: 2,
        executivePresenceRequired: false,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 5,
      revealAtMinute: 3.5,
      title: 'CRITICAL: Property Damage Nearby',
      content:
        'BREAKING: Windows broken at building 2 blocks away. Crowd splintering—some heading ' +
        'our direction. PD advising shelter-in-place for businesses on Main Street. ' +
        'Your EMEA lead (starting shift in 90 min) asking for handoff prep.',
      source: 'Law Enforcement Liaison',
      decisionPressure: 'Escalation—shelter-in-place? EMEA handoff coordination needed.',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'LE',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-DOWNTOWN-HQ', 'ENT-EMPLOYEE-POP'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 3, responders: 2 },
      leadershipChallenge: 'SHIFT_HANDOFF',
      teamImpact: {
        regionsAffected: ['AMERICAS', 'EMEA'],
        resourceDemand: 'HIGH',
        shiftHandoffRequired: true,
        loadBalanceNeeded: true,
      },
      stakeholderImpact: {
        notifyRequired: ['CSO', 'COO', 'CHRO', 'General Counsel'],
        briefingType: 'DECISION_REQUIRED',
        escalationLevel: 4,
        executivePresenceRequired: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 6,
      revealAtMinute: 5,
      title: 'TEAM: Analyst Performance Issue',
      content:
        'Your AMER team lead flags: Junior analyst Alex overwhelmed, made triage error, ' +
        'sent non-urgent update to CSO instead of you first. Analyst stressed, near tears. ' +
        'High-pressure coaching moment while incident continues.',
      source: 'AMER Regional Lead',
      decisionPressure: 'Coaching moment mid-crisis. How to handle without losing focus?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-REGIONAL-LEAD-AMER'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      leadershipChallenge: 'TEAM_COORDINATION',
      teamImpact: {
        regionsAffected: ['AMERICAS'],
        resourceDemand: 'LOW',
        shiftHandoffRequired: false,
        loadBalanceNeeded: false,
      },
      programImpact: {
        sopGapIdentified: true,
        metricsAffected: ['Triage accuracy', 'Escalation compliance'],
        processImprovementOpportunity: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
      revealAtMinute: 6.5,
      title: 'SHIFT: EMEA Lead Online',
      content:
        'Sophie from EMEA coming online. Needs handoff: current situation, open decisions, ' +
        'stakeholder status, resource state. Quality handoff critical—she will carry this ' +
        'through next 12 hours while AMER team rests.',
      source: 'EMEA Regional Lead',
      decisionPressure: 'Execute quality handoff. What must EMEA know?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-REGIONAL-LEAD-AMER'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: {},
      leadershipChallenge: 'SHIFT_HANDOFF',
      teamImpact: {
        regionsAffected: ['AMERICAS', 'EMEA'],
        resourceDemand: 'MEDIUM',
        shiftHandoffRequired: true,
        loadBalanceNeeded: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
      revealAtMinute: 8,
      title: 'VENDOR: Contract Security Stretched',
      content:
        'Security vendor: "We\'re at 140% capacity citywide. Cannot guarantee reinforcements ' +
        'for your site. Recommend you authorize overtime for proprietary guards or mutual aid."',
      source: 'Contract Security Manager',
      decisionPressure: 'Resource gap—authorize spend or accept risk?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'VENDOR',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-DOWNTOWN-HQ'],
      triagePriority: 'URGENT',
      resourcesRequired: { guards: 2 },
      leadershipChallenge: 'RESOURCE_ALLOCATION',
      teamImpact: {
        regionsAffected: ['AMERICAS'],
        resourceDemand: 'HIGH',
        shiftHandoffRequired: false,
        loadBalanceNeeded: false,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
      revealAtMinute: 10,
      title: 'DEBRIEF: CMT Wants Lessons Learned',
      content:
        'Crisis Management Team scheduling debrief for tomorrow. Requesting initial ' +
        'observations: what worked, what gaps were identified, process improvement recs. ' +
        'Your maturity conversation with stakeholders starts here.',
      source: 'CMT Coordinator',
      decisionPressure: 'Frame continuous improvement narrative. What did we learn?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: ['ENT-CSO'],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      leadershipChallenge: 'CONTINUOUS_IMPROVEMENT',
      programImpact: {
        sopGapIdentified: true,
        metricsAffected: ['Response time', 'Handoff quality', 'Stakeholder satisfaction'],
        processImprovementOpportunity: true,
      },
    },
  ];

  const log = createDecisionLog({
    title: 'Civil Unrest - Downtown Protests',
    description:
      'Large-scale civil unrest developing near corporate headquarters requires coordinated ' +
      'response across regional teams, stakeholder management at multiple levels, and real-time ' +
      'decision-making under pressure. Tests follow-the-sun coordination, executive briefing skills, ' +
      'and crisis governance execution.',
    severity: 'HIGH',
    impactCategories: ['PHYSICAL_SECURITY', 'BUSINESS_CONTINUITY', 'COMMUNICATIONS'],
    reportedBy: 'Threat Intelligence',
    createdBy: 'GSOC Watch Commander',
    organization: 'Hourglass Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
    linkedEntities: CIVIL_UNREST_ENTITIES,
  });

  return log;
}

/**
 * Entity definitions for Tech Outage scenario
 */
const TECH_OUTAGE_ENTITIES: LinkedEntity[] = [
  {
    id: 'ENT-CORE-APP',
    type: 'SYSTEM',
    name: 'Core Security Platform',
    shortName: 'Core Platform',
    description: 'Primary security operations platform (PSIM/incident management)',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-ALL-REGIONS'],
  },
  {
    id: 'ENT-ALL-REGIONS',
    type: 'ORGANIZATION',
    name: 'All GSOC Regions',
    shortName: 'All Regions',
    description: 'AMER, EMEA, APAC operations impacted',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-CORE-APP'],
  },
  {
    id: 'ENT-BACKUP-SYS',
    type: 'SYSTEM',
    name: 'Backup Manual Processes',
    shortName: 'Manual Backup',
    description: 'Paper-based and phone-based backup procedures',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-CORE-APP'],
  },
  {
    id: 'ENT-VENDOR-SUPPORT',
    type: 'ORGANIZATION',
    name: 'Platform Vendor Support',
    shortName: 'Vendor',
    description: 'Software vendor technical support team',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-CORE-APP'],
  },
  {
    id: 'ENT-IT-OPS',
    type: 'ORGANIZATION',
    name: 'IT Operations',
    shortName: 'IT Ops',
    description: 'Internal IT infrastructure team',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-CORE-APP'],
  },
];

/**
 * Protected assets for Tech Outage scenario
 */
const TECH_OUTAGE_ASSETS: ProtectedAsset[] = [
  {
    id: 'asset-security-ops',
    name: 'Security Operations Capability',
    description: 'Ability to monitor, detect, and respond to security incidents',
    criticality: 'CRITICAL',
    businessFunction: 'Security Operations',
    owner: {
      name: 'Director of Security Operations',
      title: 'Director, Global Security Operations',
      organization: 'Corporate Security',
      contactMethod: 'Direct line',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Primary platform unavailable, manual processes activated',
  },
  {
    id: 'asset-incident-data',
    name: 'Incident Documentation',
    description: 'Audit trail and incident records',
    criticality: 'HIGH',
    businessFunction: 'Compliance',
    owner: {
      name: 'Compliance Officer',
      title: 'Chief Compliance Officer',
      organization: 'Legal & Compliance',
      contactMethod: 'Email / Bridge',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Gap in electronic records during outage',
  },
  {
    id: 'asset-response-time',
    name: 'Response Time SLAs',
    description: 'Contractual and regulatory response time commitments',
    criticality: 'HIGH',
    businessFunction: 'Operations',
    owner: {
      name: 'CSO',
      title: 'Chief Security Officer',
      organization: 'Corporate Security',
      contactMethod: 'Direct',
      riskTolerance: 'MODERATE',
      notified: false,
    },
    currentExposure: 'Degraded response times during manual operations',
  },
];

/**
 * Scenario: Technology Outage - Core Platform Down
 *
 * Tests leadership in managing global team through degraded operations,
 * maintaining service levels, and vendor/stakeholder coordination.
 */
export function createTechOutageScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'SecureOps Platform',
    vendorType: 'Physical Security Information Management (PSIM)',
    servicesAffected: [
      'Incident management',
      'Alarm monitoring',
      'Dispatch coordination',
      'Reporting',
    ],
    slaRequirements: '99.9% uptime, 15-minute RTO',
    alternateVendors: ['Manual dispatch procedures', 'Phone tree', 'Email triage'],
    lastKnownGoodState: 'Normal operations 45 minutes ago',
  };

  const learningObjective: LearningObjective = {
    primary:
      'Lead global team through technology failure while maintaining security operations and stakeholder confidence',
    secondary: [
      'Execute business continuity procedures across regions',
      'Coordinate vendor escalation effectively',
      'Maintain SOP compliance during degraded operations',
      'Document for post-incident technology roadmap discussions',
    ],
    expectedDecisions: [
      'Backup procedure activation',
      'Vendor escalation level',
      'Stakeholder notification timing',
      'Resource reallocation across regions',
    ],
    skillsTrained: [
      'Crisis operations continuity',
      'Vendor management under pressure',
      'Global team coordination',
      'Technology roadmap influence',
    ],
  };

  const injects: LeadershipInject[] = [
    {
      id: generateId('INJ'),
      sequenceNumber: 1,
      revealAtMinute: 0.25,
      title: 'CRITICAL: Core Platform Unresponsive',
      content:
        'SecureOps platform showing 503 errors across all regions. AMER, EMEA, APAC all reporting ' +
        'inability to access incident management system. Alarms still flowing to backup email. ' +
        'Your team is asking: activate manual procedures?',
      source: 'IT Operations',
      decisionPressure: 'Activate BCP? All regions affected—coordinate response.',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-CORE-APP', 'ENT-ALL-REGIONS'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 2 },
      leadershipChallenge: 'TEAM_COORDINATION',
      teamImpact: {
        regionsAffected: ['AMERICAS', 'EMEA', 'APAC'],
        resourceDemand: 'HIGH',
        shiftHandoffRequired: false,
        loadBalanceNeeded: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 0.75,
      title: 'VENDOR: Acknowledged, Investigating',
      content:
        'SecureOps support: "Issue acknowledged. Engineering investigating. No ETA yet. ' +
        'Recommend activating your backup procedures. Will update in 30 minutes."',
      source: 'Vendor Support',
      decisionPressure: 'Vendor has no ETA. How aggressively to escalate?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'VENDOR',
      confidenceLevel: 'MEDIUM',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-VENDOR-SUPPORT', 'ENT-CORE-APP'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      leadershipChallenge: 'STAKEHOLDER_BRIEFING',
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 1.5,
      title: 'TEAM: Manual Process Gaps',
      content:
        'EMEA lead reports: Manual backup procedures not practiced in 8 months. Some analysts ' +
        'unfamiliar with paper forms. Request permission to skip some documentation steps ' +
        'to maintain response times.',
      source: 'EMEA Regional Lead',
      decisionPressure: 'SOP compliance vs. response time. Standards drift decision.',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-ALL-REGIONS', 'ENT-BACKUP-SYS'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      leadershipChallenge: 'SOP_ENFORCEMENT',
      teamImpact: {
        regionsAffected: ['EMEA'],
        resourceDemand: 'MEDIUM',
        shiftHandoffRequired: false,
        loadBalanceNeeded: false,
      },
      programImpact: {
        sopGapIdentified: true,
        metricsAffected: ['BCP drill compliance', 'Documentation completeness'],
        processImprovementOpportunity: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
      revealAtMinute: 2.5,
      title: 'EXEC: CSO Notification Required',
      content:
        'Per escalation matrix, CSO notification required at 60-minute mark of critical ' +
        'system outage. Mark approaching. Prepare briefing: what happened, impact, response, ETA.',
      source: 'Escalation Protocol',
      decisionPressure: 'Executive briefing during active outage. Frame the narrative.',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-ALL-REGIONS'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: {},
      leadershipChallenge: 'EXECUTIVE_PRESENCE',
      stakeholderImpact: {
        notifyRequired: ['CSO', 'Director IT'],
        briefingType: 'SITUATION',
        escalationLevel: 3,
        executivePresenceRequired: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 5,
      revealAtMinute: 3.5,
      title: 'INCIDENT: Real Event During Outage',
      content:
        'APAC reports: Actual alarm activation at Singapore facility. Fire alarm zone 3. ' +
        'Need to dispatch response, coordinate with site, document—all manually. ' +
        'High-pressure real incident during system outage.',
      source: 'APAC Regional Lead',
      decisionPressure: 'Real incident during outage. Ensure proper response without system.',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-ALL-REGIONS'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { responders: 2 },
      leadershipChallenge: 'CRISIS_GOVERNANCE',
      teamImpact: {
        regionsAffected: ['APAC'],
        resourceDemand: 'HIGH',
        shiftHandoffRequired: false,
        loadBalanceNeeded: true,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 6,
      revealAtMinute: 5,
      title: 'VENDOR: Root Cause Identified',
      content:
        'SecureOps: "Database replication failure. Fix in progress. ETA 45 minutes to full ' +
        'restoration. Read-only access possible in 15 minutes. No data loss confirmed."',
      source: 'Vendor Engineering',
      decisionPressure: 'Light at end of tunnel. How to phase back to normal ops?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'VENDOR',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-VENDOR-SUPPORT', 'ENT-CORE-APP'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      leadershipChallenge: 'TEAM_COORDINATION',
      teamImpact: {
        regionsAffected: ['AMERICAS', 'EMEA', 'APAC'],
        resourceDemand: 'MEDIUM',
        shiftHandoffRequired: false,
        loadBalanceNeeded: false,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
      revealAtMinute: 6.5,
      title: 'TEAM: Shift Handoff Approaching',
      content:
        'AMER shift ending in 2 hours. Need to hand off: (1) ongoing outage recovery, ' +
        '(2) manual incident documentation to reconcile, (3) Singapore fire follow-up. ' +
        'EMEA lead asking for comprehensive handoff.',
      source: 'AMER Regional Lead',
      decisionPressure: 'Quality handoff during recovery. What state to leave things?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-ALL-REGIONS'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      leadershipChallenge: 'SHIFT_HANDOFF',
      teamImpact: {
        regionsAffected: ['AMERICAS', 'EMEA'],
        resourceDemand: 'MEDIUM',
        shiftHandoffRequired: true,
        loadBalanceNeeded: false,
      },
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
      revealAtMinute: 8,
      title: 'RESTORED: System Back Online',
      content:
        'SecureOps platform fully restored. All regions confirming access. Manual records ' +
        'need to be entered into system. Total outage duration: 2 hours 15 minutes.',
      source: 'IT Operations',
      decisionPressure: 'Coordinate data reconciliation. Plan post-incident activities.',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-CORE-APP', 'ENT-ALL-REGIONS'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      leadershipChallenge: 'TEAM_COORDINATION',
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
      revealAtMinute: 10,
      title: 'ROADMAP: Technology Improvement Discussion',
      content:
        'CSO scheduling meeting to discuss: (1) Vendor SLA review, (2) Backup procedure gaps, ' +
        '(3) Technology redundancy investment. Your input on roadmap priorities expected. ' +
        'This is your chance to influence program direction.',
      source: 'CSO Office',
      decisionPressure: 'Strategic input opportunity. What technology priorities?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: ['ENT-CORE-APP', 'ENT-VENDOR-SUPPORT'],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      leadershipChallenge: 'CONTINUOUS_IMPROVEMENT',
      programImpact: {
        sopGapIdentified: true,
        metricsAffected: ['System uptime', 'BCP effectiveness', 'Recovery time'],
        processImprovementOpportunity: true,
      },
    },
  ];

  const log = createDecisionLog({
    title: 'Technology Outage - Core Platform Failure',
    description:
      'Critical security operations platform experiences extended outage affecting all global regions. ' +
      'Tests leadership ability to maintain operations through degraded mode, coordinate vendor escalation, ' +
      'manage cross-regional team response, and drive technology improvement conversations.',
    severity: 'HIGH',
    impactCategories: ['BUSINESS_CONTINUITY', 'VENDOR_OPERATIONS', 'DATA_INTEGRITY'],
    reportedBy: 'IT Operations',
    createdBy: 'GSOC Watch Commander',
    organization: 'Hourglass Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
    linkedEntities: TECH_OUTAGE_ENTITIES,
  });

  return log;
}

/**
 * ESRM configuration for Civil Unrest scenario
 */
export const CIVIL_UNREST_ESRM: ScenarioESRMConfig = {
  primaryAssets: CIVIL_UNREST_ASSETS,
  initialRiskLevel: 'HIGH',
  riskToleranceThreshold: 'MEDIUM',
  requiredCommunications: [
    { role: 'CSO', timing: 'IMMEDIATE', purpose: 'Building posture decision' },
    { role: 'CHRO', timing: 'WITHIN_15MIN', purpose: 'Employee safety guidance' },
    { role: 'VP Facilities', timing: 'IMMEDIATE', purpose: 'Building operations coordination' },
    { role: 'VP Communications', timing: 'WITHIN_15MIN', purpose: 'Employee messaging' },
  ],
  governanceGuidelines: [
    'Employee safety takes precedence over business continuity',
    'Building posture changes require CSO or delegate authorization',
    'Employee messaging requires HR and Communications alignment',
    'Extended incident requires EMEA handoff briefing',
  ],
};

/**
 * ESRM configuration for Tech Outage scenario
 */
export const TECH_OUTAGE_ESRM: ScenarioESRMConfig = {
  primaryAssets: TECH_OUTAGE_ASSETS,
  initialRiskLevel: 'HIGH',
  riskToleranceThreshold: 'HIGH',
  requiredCommunications: [
    { role: 'CSO', timing: 'WITHIN_15MIN', purpose: 'System outage notification' },
    { role: 'Director IT', timing: 'IMMEDIATE', purpose: 'Technical coordination' },
    { role: 'Compliance Officer', timing: 'WITHIN_HOUR', purpose: 'Documentation gap awareness' },
  ],
  governanceGuidelines: [
    'Manual procedures maintain documentation standards where feasible',
    'Real incidents during outage take precedence over recovery',
    'Vendor escalation follows contract escalation path',
    'Post-incident reconciliation mandatory within 24 hours',
  ],
};

/**
 * Leadership scenario definitions for scenario selection
 */
export const LEADERSHIP_SCENARIOS = [
  {
    id: 'civil-unrest-downtown',
    name: 'Civil Unrest Response',
    description:
      'Coordinate multi-regional team response during downtown protests affecting HQ. ' +
      'Practice executive briefings, shift handoffs, and stakeholder management.',
    severity: 'HIGH' as const,
    vendorType: 'Contract Security',
    domains: ['PHYSICAL', 'INTELLIGENCE'] as SecurityDomain[],
    scenarioType: 'CIVIL_UNREST' as LeadershipScenarioType,
    leadershipFocus: [
      'TEAM_COORDINATION',
      'EXECUTIVE_PRESENCE',
      'SHIFT_HANDOFF',
    ] as LeadershipChallengeType[],
    esrmConfig: CIVIL_UNREST_ESRM,
    createFn: createCivilUnrestScenario,
  },
  {
    id: 'tech-outage-platform',
    name: 'Technology Outage',
    description:
      'Lead global team through critical platform failure. Maintain operations, ' +
      'coordinate vendor escalation, and influence technology roadmap.',
    severity: 'HIGH' as const,
    vendorType: 'PSIM Platform',
    domains: ['CYBER', 'PHYSICAL'] as SecurityDomain[],
    scenarioType: 'TECH_OUTAGE' as LeadershipScenarioType,
    leadershipFocus: [
      'SOP_ENFORCEMENT',
      'CRISIS_GOVERNANCE',
      'CONTINUOUS_IMPROVEMENT',
    ] as LeadershipChallengeType[],
    esrmConfig: TECH_OUTAGE_ESRM,
    createFn: createTechOutageScenario,
  },
];
