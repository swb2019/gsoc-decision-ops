/**
 * Fused GSOC Scenarios - Physical + Intelligence + Cyber
 *
 * Cross-domain incidents that weave all three security lanes together,
 * requiring the player to manage residual risk across physical security,
 * threat intelligence, and cybersecurity simultaneously.
 *
 * Realistic data reception: Injects arrive through believable intake channels
 * with channel-faithful metadata, urgency, noise, and routing.
 */

import type {
  DecisionLog,
  VendorContext,
  LearningObjective,
  ScenarioInject,
  LinkedEntity,
  IntakeChannel,
} from '../types.js';
import { createDecisionLog } from '../decision-log.js';
import { generateId } from '../utils.js';
import type { ScenarioESRMConfig } from '../esrm.js';
import { EXECUTIVE_THREAT_ASSETS, SUPPLY_CHAIN_ASSETS, INSIDER_THREAT_ASSETS } from '../esrm.js';
import {
  createIntakeMetadata,
  createNoiseIntake,
  createCorrectionIntake,
} from '../intake-channels.js';

/**
 * Inject source types for fused GSOC operations
 * Maps to intake channels for realistic data reception
 */
export type InjectSource =
  | 'OSINT' // Open source intelligence
  | 'LE' // Law enforcement
  | 'VENDOR' // Vendor notification
  | 'INTERNAL' // Internal detection/report
  | 'SOC' // Security Operations Center (cyber)
  | 'PSIM' // Physical Security Information Management
  | 'HUMINT' // Human intelligence / sources
  | 'EXEC_PROTECTION' // Executive protection team
  | 'TRAVEL_SECURITY' // Travel security / GEO risk
  | 'SITE_SECURITY'; // On-site security personnel

/**
 * Maps legacy InjectSource to IntakeChannel for backward compatibility
 */
export function sourceToChannel(source: InjectSource): IntakeChannel {
  const mapping: Record<InjectSource, IntakeChannel> = {
    OSINT: 'OSINT',
    LE: 'LE',
    VENDOR: 'VENDOR',
    INTERNAL: 'TIP',
    SOC: 'SIEM',
    PSIM: 'ACS',
    HUMINT: 'TIP',
    EXEC_PROTECTION: 'EXECUTIVE',
    TRAVEL_SECURITY: 'OSINT',
    SITE_SECURITY: 'RADIO',
  };
  return mapping[source];
}

/**
 * Domain classification for cross-domain risk assessment
 */
export type SecurityDomain = 'PHYSICAL' | 'INTELLIGENCE' | 'CYBER';

/**
 * Extended inject with domain classification and intake metadata
 */
export interface FusedInject extends ScenarioInject {
  domain: SecurityDomain;
  sourceType: InjectSource;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';
  crossDomainImpact?: SecurityDomain[];
  urgencyLevel: 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
}

/**
 * Entity definitions for Executive Threat scenario
 */
const EXECUTIVE_THREAT_ENTITIES: LinkedEntity[] = [
  {
    id: 'ENT-CEO',
    type: 'PERSON',
    name: 'Chief Executive Officer',
    shortName: 'CEO',
    description: 'Target of coordinated threat activity',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-SINGAPORE', 'ENT-EA-TEAM', 'ENT-EP-TEAM'],
  },
  {
    id: 'ENT-EA-TEAM',
    type: 'PERSON',
    name: 'Executive Assistants',
    shortName: 'EAs',
    description: 'Three EAs with calendar access, targeted by phishing',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-CEO', 'ENT-APT-ACTOR'],
  },
  {
    id: 'ENT-SINGAPORE',
    type: 'PLACE',
    name: 'Singapore Hotel & Venue',
    shortName: 'SG Trip',
    description: 'Overseas trip location with surveillance indicators',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-CEO', 'ENT-EP-TEAM'],
  },
  {
    id: 'ENT-EXEC-FLOOR',
    type: 'PLACE',
    name: 'Executive Floor (HQ)',
    shortName: 'Exec Floor',
    description: 'C-suite offices with badge anomalies detected',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-BADGE-SYSTEM', 'ENT-SUSP-VEHICLE'],
  },
  {
    id: 'ENT-BADGE-SYSTEM',
    type: 'SYSTEM',
    name: 'GlobalSecure Access System',
    shortName: 'Badge System',
    description: 'Physical access control with vendor API issues',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-EXEC-FLOOR', 'ENT-GLOBALSECURE'],
  },
  {
    id: 'ENT-GLOBALSECURE',
    type: 'ORGANIZATION',
    name: 'GlobalSecure Access (Vendor)',
    shortName: 'GlobalSecure',
    description: 'Badge system vendor investigating API compromise',
    criticality: 'MEDIUM',
    relatedEntityIds: ['ENT-BADGE-SYSTEM'],
  },
  {
    id: 'ENT-APT-ACTOR',
    type: 'ORGANIZATION',
    name: 'APT Threat Actor',
    shortName: 'APT',
    description: 'Sophisticated actor with physical ops capability',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-EA-TEAM', 'ENT-CEO', 'ENT-C2-BEACON'],
  },
  {
    id: 'ENT-EP-TEAM',
    type: 'PERSON',
    name: 'Executive Protection Team',
    shortName: 'EP Team',
    description: 'Advance team in Singapore reporting surveillance',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-CEO', 'ENT-SINGAPORE'],
  },
  {
    id: 'ENT-SUSP-VEHICLE',
    type: 'ASSET',
    name: 'Suspicious Rental Vehicle',
    shortName: 'Susp. Vehicle',
    description: 'Unknown vehicle in exec parking with equipment',
    criticality: 'MEDIUM',
    relatedEntityIds: ['ENT-EXEC-FLOOR', 'ENT-APT-ACTOR'],
  },
  {
    id: 'ENT-C2-BEACON',
    type: 'SYSTEM',
    name: 'C2 Beacon (EA Workstation)',
    shortName: 'C2 Beacon',
    description: 'Dormant malware with calendar access confirmed',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-EA-TEAM', 'ENT-APT-ACTOR', 'ENT-CEO'],
  },
];

/**
 * Scenario 1: Executive Threat Convergence
 *
 * A threat actor targets the CEO during an overseas trip. Intelligence
 * suggests physical surveillance, while cyber indicators show spear-phishing
 * attempts against executive assistants. A vendor badge system anomaly
 * compounds the situation.
 */
export function createExecutiveThreatScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'GlobalSecure Access',
    vendorType: 'Integrated Physical Access & Identity Management',
    servicesAffected: [
      'Executive suite badge access',
      'Visitor pre-registration',
      'Identity verification API',
      'Mobile credential provisioning',
    ],
    slaRequirements: '99.99% uptime for executive areas',
    alternateVendors: ['Manual escort protocols', 'Biometric standalone readers'],
    lastKnownGoodState: 'Normal operations 4 hours ago',
  };

  const learningObjective: LearningObjective = {
    primary: 'Coordinate cross-domain threat response while maintaining executive operations',
    secondary: [
      'Triangulate physical surveillance indicators with cyber reconnaissance',
      'Frame protective posture recommendations to executive stakeholders',
      'Manage vendor uncertainty during active threat window',
    ],
    expectedDecisions: [
      'Executive travel posture adjustment',
      'Badge system integrity assessment',
      'SOC-GSOC coordination on phishing campaign',
      'Physical surveillance countermeasures',
    ],
    skillsTrained: [
      'Cross-domain threat correlation',
      'Executive protection coordination',
      'Vendor risk during active incidents',
      'ESRM stakeholder communication',
    ],
  };

  // ID references for corrections/updates
  const darkWebInjectId = generateId('INJ');
  const badgeAnomalyInjectId = generateId('INJ');
  const vehicleInjectId = generateId('INJ');

  const injects: FusedInject[] = [
    // ========== INJECT 1: OSINT Dark Web Alert ==========
    {
      id: darkWebInjectId,
      sequenceNumber: 1,
      revealAtMinute: 0.25,
      title: 'FLASH: CEO Dark Web Mention',
      content:
        'Threat intel flags CEO name on dark web forum. Post mentions "upcoming opportunity" ' +
        're: Singapore trip next week. Source: MEDIUM reliability. Correlates with earnings call.',
      source: 'Threat Intelligence Platform',
      decisionPressure: 'Credible enough to brief executive? What validation needed?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'OSINT',
      confidenceLevel: 'MEDIUM',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-CEO', 'ENT-SINGAPORE', 'ENT-APT-ACTOR'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('OSINT', {
        sourceSystem: 'Flashpoint',
        sourceId: 'OSINT-DW-2847',
        confidence: 'MEDIUM',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Forum post screenshot',
            description: 'Dark web forum thread capture',
          },
        ],
        requiresFollowUp: true,
        pendingVerification: true,
      }),
    },
    // ========== NOISE: Routine parking lot camera motion ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 0.5,
      title: 'VMS: Motion - Visitor Lot B',
      content:
        'Analytics: Vehicle motion detected visitor lot B, camera VIS-LOT-B-02. ' +
        'Normal business hours. No anomalies. Logged for reference.',
      source: 'Milestone XProtect',
      decisionPressure: 'Routine motion event—prioritize or acknowledge?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('VMS', {
        sourceSystem: 'Milestone XProtect',
        sourceId: 'CAM-VIS-LOT-B-02',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          { type: 'STILL', label: 'Motion capture', description: 'Vehicle entering lot' },
        ],
        ...createNoiseIntake('VMS', 'Routine motion event during business hours'),
      }),
    },
    // ========== INJECT 2: SIEM Phishing Alert ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 0.75,
      title: 'CYBER: Spear-Phishing EAs',
      content:
        'SOC escalates: 3 executive assistants hit with phishing mimicking Singapore travel ' +
        'bookings. One clicked, MFA blocked harvest. APT infrastructure confirmed.',
      source: 'SOC Tier 2',
      decisionPressure: 'Coordinate SOC containment. Does this validate OSINT threat?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE', 'PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-EA-TEAM', 'ENT-APT-ACTOR', 'ENT-SINGAPORE'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 2 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'Microsoft Sentinel',
        sourceId: 'INC-SEC-8847',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          { type: 'LOG_EXCERPT', label: 'Email headers', description: 'Phishing email forensics' },
          { type: 'DOCUMENT', label: 'IOC list', description: 'APT infrastructure indicators' },
        ],
        relatedInjectIds: [darkWebInjectId],
      }),
    },
    // ========== NOISE: Badge door held open ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
      revealAtMinute: 1.0,
      title: 'ACS: Door Held - Loading Dock',
      content:
        'Door held alarm: DOCK-3A, duration 2m15s. Delivery in progress per manifest. ' +
        'Officer verified, delivery personnel present with valid visitor badge.',
      source: 'Lenel OnGuard',
      decisionPressure: 'Acknowledged delivery—clear or log?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('ACS', {
        sourceSystem: 'Lenel OnGuard',
        sourceId: 'DOOR-DOCK-3A',
        confidence: 'VERIFIED',
        completeness: 'COMPLETE',
        ...createNoiseIntake('ACS', 'Verified delivery activity'),
      }),
    },
    // ========== INJECT 3: ACS Badge Anomaly ==========
    {
      id: badgeAnomalyInjectId,
      sequenceNumber: 5,
      revealAtMinute: 1.5,
      title: 'PHYSICAL: Badge Anomaly C-Suite',
      content:
        'ACS: 3 failed badge attempts at exec floor—credential not in directory. ' +
        'Format valid, identity null. Vendor API showing 503s. System issue or cloning?',
      source: 'PSIM Platform',
      decisionPressure: 'Related to threat or vendor issue? How to secure floor?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'MEDIUM',
      crossDomainImpact: ['CYBER'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-EXEC-FLOOR', 'ENT-BADGE-SYSTEM', 'ENT-GLOBALSECURE'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 2, analysts: 1 },
      intake: createIntakeMetadata('ACS', {
        sourceSystem: 'Lenel OnGuard',
        sourceId: 'RDR-EXEC-FL12-01',
        confidence: 'MEDIUM',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Badge read log',
            description: 'Failed credential attempts',
          },
          { type: 'MAP_PIN', label: 'Reader location', location: 'Exec Floor 12, East Entry' },
        ],
        pendingVerification: true,
      }),
    },
    // ========== INJECT 4: Vendor Notification ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 6,
      revealAtMinute: 2.5,
      title: 'VENDOR: API Compromise Investigation',
      content:
        'GlobalSecure CISO: Investigating API credential compromise across customers. ' +
        'Your tenant status unknown. Recommending credential rotation. ETA 6-8 hours.',
      source: 'Vendor Emergency',
      decisionPressure: 'Rotate now (break badge sync) or wait for assessment?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'VENDOR',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-GLOBALSECURE', 'ENT-BADGE-SYSTEM', 'ENT-EXEC-FLOOR'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('VENDOR', {
        sourceSystem: 'Vendor Emergency Line',
        sourceId: 'TKT-GS-EMERG-4421',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'Vendor advisory',
            description: 'API compromise preliminary notice',
          },
        ],
        relatedInjectIds: [badgeAnomalyInjectId],
        requiresFollowUp: true,
      }),
    },
    // ========== CORRECTION: Badge anomaly update ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
      revealAtMinute: 3.0,
      title: 'UPDATE: Badge Anomaly - Additional Reads',
      content:
        'ACS update: Total now 7 failed attempts across 3 exec floor readers. Pattern suggests ' +
        'systematic testing, not random failure. Credentials appear sequentially generated.',
      source: 'PSIM Platform',
      decisionPressure: 'Credential cloning now more likely. Escalate physical response?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER', 'INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-EXEC-FLOOR', 'ENT-BADGE-SYSTEM', 'ENT-APT-ACTOR'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 1 },
      intake: createIntakeMetadata('ACS', {
        sourceSystem: 'Lenel OnGuard',
        sourceId: 'RDR-EXEC-FL12-MULTI',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        ...createCorrectionIntake('ACS', badgeAnomalyInjectId, 'VERIFIED'),
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Expanded read log',
            description: 'All 7 failed attempts with timestamps',
          },
          {
            type: 'DOCUMENT',
            label: 'Pattern analysis',
            description: 'Sequential credential generation detected',
          },
        ],
      }),
    },
    // ========== INJECT 5: EP Surveillance Report ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
      revealAtMinute: 3.5,
      title: 'EP: Surveillance in Singapore',
      content:
        'EP team reports possible surveillance of advance team at hotel. Two individuals ' +
        "photographing vehicles 30+ mins. Local liaison can't ID. CEO arrival in 18 hours.",
      source: 'Executive Protection Lead',
      decisionPressure: 'Connect to dark web post? Recommend trip modification?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'EXEC_PROTECTION',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-EP-TEAM', 'ENT-SINGAPORE', 'ENT-CEO', 'ENT-APT-ACTOR'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { responders: 1 },
      intake: createIntakeMetadata('EXECUTIVE', {
        sourceSystem: 'EP Secure Comms',
        sourceId: 'EP-SG-FLASH-001',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'STILL',
            label: 'Surveillance photo',
            description: 'Two subjects with camera equipment',
          },
          { type: 'MAP_PIN', label: 'Hotel location', location: 'Singapore, Marina Bay Sands' },
        ],
        relatedInjectIds: [darkWebInjectId],
      }),
    },
    // ========== NOISE: Routine elevator maintenance ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
      revealAtMinute: 4.0,
      title: 'BMS: Elevator PM - Tower A',
      content:
        'Scheduled preventive maintenance: Elevators 3-4 Tower A offline 30 mins. ' +
        'Contractor on-site with valid credentials. Service desk notified.',
      source: 'Johnson Controls Metasys',
      decisionPressure: 'Scheduled event—acknowledge only.',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('FACILITIES', {
        sourceSystem: 'Johnson Controls Metasys',
        sourceId: 'ELEV-TWR-A-3-4',
        confidence: 'VERIFIED',
        completeness: 'COMPLETE',
        ...createNoiseIntake('FACILITIES', 'Scheduled maintenance per work order'),
      }),
    },
    // ========== INJECT 6: FBI Advisory ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 10,
      revealAtMinute: 5,
      title: 'FBI: APT Advisory TLP:AMBER',
      content:
        'FBI shares advisory on APT matching your SOC indicators. Known for corporate espionage ' +
        'with occasional physical ops support. Enhanced monitoring recommended.',
      source: 'FBI Cyber Division',
      decisionPressure: 'Impact on threat assessment? Who needs briefing?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'LE',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER', 'PHYSICAL'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-APT-ACTOR', 'ENT-CEO', 'ENT-EA-TEAM'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('LE', {
        sourceSystem: 'FBI Liaison / InfraGard',
        sourceId: 'FBI-TLP-AMBER-2847',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'TLP:AMBER Advisory',
            description: 'APT threat profile and TTPs',
          },
        ],
        relatedInjectIds: [darkWebInjectId],
      }),
    },
    // ========== TIP: Anonymous report ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 11,
      revealAtMinute: 5.5,
      title: 'TIP: Suspicious Inquiry at Reception',
      content:
        'Anonymous hotline: Caller reports person at main reception asking about "executive floor ' +
        'access procedures" and "visitor badge duration." Left before security arrived. ' +
        'Described as male, 30s, business casual. No photo available.',
      source: 'Security Hotline',
      decisionPressure: 'Incomplete report—correlate with other intel or deprioritize?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'HUMINT',
      confidenceLevel: 'LOW',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: ['ENT-EXEC-FLOOR', 'ENT-APT-ACTOR'],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('TIP', {
        sourceSystem: 'EthicsPoint Hotline',
        sourceId: 'TIP-ANON-44821',
        confidence: 'LOW',
        completeness: 'MINIMAL',
        requiresFollowUp: true,
        pendingVerification: true,
      }),
    },
    // ========== INJECT 7: Suspicious Vehicle ==========
    {
      id: vehicleInjectId,
      sequenceNumber: 12,
      revealAtMinute: 6.5,
      title: 'SITE: Suspicious Vehicle Exec Lot',
      content:
        'Security: Unfamiliar vehicle in exec parking 3+ hours. Rental registration. ' +
        'Occupant not visible. Camera shows possible equipment inside. PD can respond in 15.',
      source: 'Site Security Supervisor',
      decisionPressure: 'Escalate to law enforcement? Fits threat picture?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'SITE_SECURITY',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-SUSP-VEHICLE', 'ENT-EXEC-FLOOR', 'ENT-APT-ACTOR'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 2, responders: 1 },
      intake: createIntakeMetadata('RADIO', {
        sourceSystem: 'Dispatch Console',
        sourceId: 'UNIT-7-EXEC-LOT',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          { type: 'STILL', label: 'Vehicle photo', description: 'Silver sedan, rental plates' },
          { type: 'MAP_PIN', label: 'Vehicle location', location: 'Exec Parking Row C, Space 14' },
        ],
      }),
    },
    // ========== CORRECTION: Vehicle identified ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 13,
      revealAtMinute: 7.5,
      title: 'UPDATE: Vehicle Plate - Rental to Unknown',
      content:
        'PD callback: Rental traced to cash transaction, fake ID. Name matches known alias ' +
        'in FBI advisory. Equipment visible confirmed as camera with telephoto lens.',
      source: 'Local PD Detective',
      decisionPressure: 'Confirmed surveillance. Coordinate with FBI? Immediate action?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'LE',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-SUSP-VEHICLE', 'ENT-APT-ACTOR', 'ENT-EXEC-FLOOR'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { responders: 1 },
      intake: createIntakeMetadata('LE', {
        sourceSystem: 'Local PD Dispatch',
        sourceId: 'PD-DET-CALLBACK-772',
        confidence: 'VERIFIED',
        completeness: 'COMPLETE',
        ...createCorrectionIntake('LE', vehicleInjectId, 'VERIFIED'),
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'Rental record',
            description: 'Cash transaction, fake ID details',
          },
        ],
      }),
    },
    // ========== INJECT 8: SOC C2 Beacon ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 14,
      revealAtMinute: 8,
      title: 'SOC: C2 Beacon on EA Machine',
      content:
        'SOC confirms C2 beacon on EA workstation. Matches APT infra from phishing. ' +
        'Dormant but has CEO/CFO calendar access. Travel plans may be exposed.',
      source: 'SOC Incident Commander',
      decisionPressure: 'Travel compromised. Immediate posture change for Singapore?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL', 'INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: [
        'ENT-C2-BEACON',
        'ENT-EA-TEAM',
        'ENT-APT-ACTOR',
        'ENT-CEO',
        'ENT-SINGAPORE',
      ],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 2, responders: 1 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'CrowdStrike Falcon',
        sourceId: 'INC-MAL-9984',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'C2 traffic log',
            description: 'Beacon communication pattern',
          },
          {
            type: 'DOCUMENT',
            label: 'IOC match report',
            description: 'APT infrastructure correlation',
          },
        ],
      }),
    },
    // ========== NOISE: Fire panel supervisory ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 15,
      revealAtMinute: 9.0,
      title: 'ALARM: Fire Supervisory - Bldg 2',
      content:
        'Fire panel supervisory: Zone 4B trouble, Building 2 warehouse. Facilities dispatched. ' +
        'Likely sensor issue per maintenance log. Not life safety impacting.',
      source: 'Honeywell Fire Panel',
      decisionPressure: 'Maintenance issue—monitor or escalate?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('ALARM', {
        sourceSystem: 'Honeywell Fire Panel',
        sourceId: 'FP-BLDG2-Z4B',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        ...createNoiseIntake('ALARM', 'Supervisory trouble, not alarm - maintenance issue'),
      }),
    },
    // ========== INJECT 9: Executive Decision Request ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 16,
      revealAtMinute: 10,
      title: 'EXEC: Trip Decision Required',
      content:
        'Chief of Staff: Board meeting in 20 mins on Singapore trip. CEO wants GSOC ' +
        'recommendation. CFO pushing to proceed (deal importance). CLO wants risk doc.',
      source: 'Chief of Staff',
      decisionPressure: 'Frame recommendation. What residual risk per option?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL', 'CYBER'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-CEO', 'ENT-SINGAPORE', 'ENT-APT-ACTOR'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: {},
      intake: createIntakeMetadata('EXECUTIVE', {
        sourceSystem: 'Chief of Staff Direct',
        sourceId: 'EXEC-COS-FLASH',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
      }),
    },
    // ========== CONFLICTING: OSINT correction ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 17,
      revealAtMinute: 11,
      title: 'INTEL: Dark Web Post Update - Conflicting',
      content:
        'Analyst update: Second source claims original dark web post is disinformation/hoax. ' +
        'However, physical indicators and C2 beacon remain valid. Intel confidence now CONFLICTING.',
      source: 'Threat Intel Analyst',
      decisionPressure:
        'Original OSINT may be unreliable, but physical evidence stands. Re-assess?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'OSINT',
      confidenceLevel: 'LOW',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-CEO', 'ENT-SINGAPORE', 'ENT-APT-ACTOR'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      intake: createIntakeMetadata('OSINT', {
        sourceSystem: 'Analyst Desktop',
        sourceId: 'OSINT-CONF-UPDATE',
        confidence: 'CONFLICTING',
        completeness: 'PARTIAL',
        ...createCorrectionIntake('OSINT', darkWebInjectId, 'CONFLICTING'),
      }),
    },
  ];

  const log = createDecisionLog({
    title: 'Executive Threat Convergence',
    description:
      'Multiple indicators suggest coordinated threat activity targeting executive leadership. ' +
      'Dark web chatter, sophisticated phishing campaign, and physical surveillance indicators ' +
      'are converging as CEO prepares for high-profile overseas trip. Badge system vendor ' +
      'reporting potential compromise adds complexity to physical security posture.',
    severity: 'CRITICAL',
    impactCategories: [
      'EXECUTIVE_PROTECTION',
      'PHYSICAL_SECURITY',
      'DATA_INTEGRITY',
      'TRAVEL_SECURITY',
    ],
    reportedBy: 'Threat Intelligence Analyst',
    createdBy: 'GSOC Watch Commander',
    organization: 'Hourglass Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
    linkedEntities: EXECUTIVE_THREAT_ENTITIES,
  });

  return log;
}

/**
 * Entity definitions for Supply Chain scenario
 */
const SUPPLY_CHAIN_ENTITIES: LinkedEntity[] = [
  {
    id: 'ENT-NEXUS',
    type: 'ORGANIZATION',
    name: 'Nexus Industrial Controls',
    shortName: 'Nexus',
    description: 'Building automation vendor with confirmed breach',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-BMS', 'ENT-HVAC', 'ENT-FIRE-PANEL'],
  },
  {
    id: 'ENT-DC',
    type: 'PLACE',
    name: 'Primary Data Center',
    shortName: 'Data Center',
    description: 'Critical infrastructure with thermal risk',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-HVAC', 'ENT-FIRE-PANEL', 'ENT-FLOOR-PLANS'],
  },
  {
    id: 'ENT-BMS',
    type: 'SYSTEM',
    name: 'Building Management System',
    shortName: 'BMS',
    description: 'Central control for HVAC, access, and fire systems',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-NEXUS', 'ENT-HVAC', 'ENT-FIRE-PANEL'],
  },
  {
    id: 'ENT-HVAC',
    type: 'SYSTEM',
    name: 'HVAC Control System',
    shortName: 'HVAC',
    description: 'Environmental controls with hijacked setpoints',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-BMS', 'ENT-DC', 'ENT-NEXUS'],
  },
  {
    id: 'ENT-FIRE-PANEL',
    type: 'SYSTEM',
    name: 'Fire Safety Panel',
    shortName: 'Fire Panel',
    description: 'Life safety system with comm fault',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-BMS', 'ENT-DC'],
  },
  {
    id: 'ENT-APT-SPIDER',
    type: 'ORGANIZATION',
    name: 'Industrial Spider APT',
    shortName: 'Ind. Spider',
    description: 'APT group targeting building automation',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-NEXUS', 'ENT-FLOOR-PLANS'],
  },
  {
    id: 'ENT-FLOOR-PLANS',
    type: 'ASSET',
    name: 'DC Floor Plans & Topology',
    shortName: 'Floor Plans',
    description: 'Sensitive blueprints leaked to paste site',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-DC', 'ENT-APT-SPIDER'],
  },
  {
    id: 'ENT-FAKE-CONTRACTORS',
    type: 'PERSON',
    name: 'Fake Nexus Contractors',
    shortName: 'Fake Contractors',
    description: 'Unknown individuals claiming vendor access',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-NEXUS', 'ENT-APT-SPIDER'],
  },
  {
    id: 'ENT-CREDS-DC',
    type: 'ASSET',
    name: 'DC Perimeter Credentials',
    shortName: 'DC Creds',
    description: 'Credentials showing replay attack pattern',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-DC', 'ENT-NEXUS'],
  },
];

/**
 * Scenario 2: Supply Chain Intrusion
 *
 * A critical vendor's network is compromised, potentially affecting
 * both IT systems and physical access controls. Intelligence suggests
 * the attack may be part of a larger campaign targeting your industry.
 */
export function createSupplyChainScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'Nexus Industrial Controls',
    vendorType: 'Building Automation & Access Control Integration',
    servicesAffected: [
      'HVAC control systems',
      'Fire suppression integration',
      'Access control panel management',
      'Security camera network switches',
      'Data center environmental monitoring',
    ],
    slaRequirements: '99.95% uptime, 2-hour critical response',
    alternateVendors: [
      'Manual HVAC override',
      'Standalone fire panels',
      'Direct camera connections',
    ],
    lastKnownGoodState: 'Normal operations 8 hours ago',
  };

  const learningObjective: LearningObjective = {
    primary: 'Manage cascading vendor compromise across physical and cyber domains',
    secondary: [
      'Assess blast radius of supply chain compromise',
      'Coordinate with facilities on life-safety system isolation',
      'Balance operational continuity with containment needs',
    ],
    expectedDecisions: [
      'Vendor network isolation scope',
      'Life-safety system manual override activation',
      'Data center cooling contingency',
      'Physical security augmentation during system degradation',
    ],
    skillsTrained: [
      'Supply chain risk assessment',
      'OT/IT convergence incident response',
      'Life-safety system prioritization',
      'Multi-stakeholder coordination',
    ],
  };

  // ID references for corrections
  const credReplayId = generateId('INJ');
  const hvacHijackId = generateId('INJ');

  const injects: FusedInject[] = [
    // ========== INJECT 1: Vendor Notification ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 1,
      revealAtMinute: 0.25,
      title: 'VENDOR: Active Intrusion Detected',
      content:
        'Nexus Industrial Controls: "Active intrusion in customer network. Do NOT ' +
        'disconnect without coordinating—may affect life-safety handoffs."',
      source: 'Vendor Security Team',
      decisionPressure: 'What systems need review? Who coordinates with Facilities?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'VENDOR',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-NEXUS', 'ENT-BMS', 'ENT-FIRE-PANEL'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 2 },
      intake: createIntakeMetadata('VENDOR', {
        sourceSystem: 'Nexus Emergency Line',
        sourceId: 'VND-NEXUS-EMERG-001',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'Initial advisory',
            description: 'Vendor intrusion notification',
          },
        ],
        requiresFollowUp: true,
      }),
    },
    // ========== NOISE: Routine camera offline ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 0.5,
      title: 'VMS: Camera Offline - Parking Deck 3',
      content:
        'Camera PK-DECK3-04 offline. Maintenance ticket open since yesterday for cabling. ' +
        'Scheduled repair this afternoon. Adjacent cameras providing coverage.',
      source: 'Milestone XProtect',
      decisionPressure: 'Known maintenance—acknowledge or escalate given current situation?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('VMS', {
        sourceSystem: 'Milestone XProtect',
        sourceId: 'CAM-PK-DECK3-04',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        ...createNoiseIntake('VMS', 'Known maintenance issue, scheduled repair'),
      }),
    },
    // ========== INJECT 2: OSINT ISAC Alert ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 0.75,
      title: 'ISAC: Industry-Wide APT Campaign',
      content:
        'FS-ISAC TLP:AMBER: APT "Industrial Spider" targeting building automation vendors. ' +
        'Known TTPs: long dwell, exfil, physical system manipulation. 3 others confirmed hit.',
      source: 'FS-ISAC',
      decisionPressure: 'Your vendor likely in coordinated campaign. Escalation path?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'OSINT',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER', 'PHYSICAL'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-APT-SPIDER', 'ENT-NEXUS'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('OSINT', {
        sourceSystem: 'FS-ISAC Portal',
        sourceId: 'ISAC-TLP-AMB-4421',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'TLP:AMBER Advisory',
            description: 'Industrial Spider APT profile',
          },
        ],
      }),
    },
    // ========== INJECT 3: SIEM Credential Replay ==========
    {
      id: credReplayId,
      sequenceNumber: 4,
      revealAtMinute: 1.5,
      title: 'SIEM: Credential Replay at DC',
      content:
        '47 badge reads at DC perimeter in 1 hour (normally 5-8). Valid credentials, ' +
        'timing suggests automated replay. Guard confirms no unusual foot traffic.',
      source: 'SIEM Correlation',
      decisionPressure: 'Evidence of replay attack? Physical posture at DC?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'MEDIUM',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-DC', 'ENT-CREDS-DC', 'ENT-NEXUS'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 2, analysts: 1 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'Splunk',
        sourceId: 'COR-ACS-ANOMALY-882',
        confidence: 'MEDIUM',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Badge read pattern',
            description: 'Correlation rule output',
          },
        ],
        pendingVerification: true,
      }),
    },
    // ========== TIP: Guard reports contractor ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 5,
      revealAtMinute: 2.0,
      title: 'RADIO: Guard - Unknown Contractor at Gate',
      content:
        'Gate officer: Individual claiming Nexus maintenance, no appointment on file. ' +
        'Valid-looking badge but cant verify against vendor list. Holding at gate.',
      source: 'Gate Console',
      decisionPressure: 'Deny entry given vendor compromise? Or verify with Nexus?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'SITE_SECURITY',
      confidenceLevel: 'MEDIUM',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-FAKE-CONTRACTORS', 'ENT-NEXUS'],
      triagePriority: 'URGENT',
      resourcesRequired: { guards: 1 },
      intake: createIntakeMetadata('RADIO', {
        sourceSystem: 'Dispatch Console',
        sourceId: 'UNIT-GATE-1',
        confidence: 'MEDIUM',
        completeness: 'PARTIAL',
        attachments: [
          { type: 'STILL', label: 'Badge photo', description: 'Contractor credential image' },
        ],
        requiresFollowUp: true,
      }),
    },
    // ========== INJECT 4: Facilities HVAC Hijack ==========
    {
      id: hvacHijackId,
      sequenceNumber: 6,
      revealAtMinute: 2.5,
      title: 'CRITICAL: DC Cooling Hijacked',
      content:
        'Facilities: DC cooling setpoints changed to 85°F remotely. BMS shows "remote ' +
        'session active." Temps rising. 45 min to thermal shutdown if unchecked.',
      source: 'Facilities Ops',
      decisionPressure: 'Life-safety decision. Who authorizes network isolation?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-DC', 'ENT-HVAC', 'ENT-BMS', 'ENT-APT-SPIDER'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { responders: 2, analysts: 1 },
      intake: createIntakeMetadata('FACILITIES', {
        sourceSystem: 'Johnson Controls Metasys',
        sourceId: 'BMS-DC-HVAC-CRIT',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Setpoint change log',
            description: 'Unauthorized modification detected',
          },
          { type: 'MAP_PIN', label: 'DC location', location: 'Data Center, Building 4' },
        ],
      }),
    },
    // ========== INJECT 5: Alarm Fire Panel ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
      revealAtMinute: 3.5,
      title: 'FIRE: Panel Comm Fault',
      content:
        'Fire panel lost communication with BMS. Suppression functional in standalone. ' +
        'Fire marshal notification may be required within 4 hours per code.',
      source: 'Fire Safety Systems',
      decisionPressure: 'Life-safety degradation. Document for compliance. Notify marshal?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-FIRE-PANEL', 'ENT-BMS', 'ENT-DC'],
      triagePriority: 'URGENT',
      resourcesRequired: { responders: 1 },
      intake: createIntakeMetadata('ALARM', {
        sourceSystem: 'Honeywell Fire Panel',
        sourceId: 'FP-DC-BLDG4-COMM',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          { type: 'LOG_EXCERPT', label: 'Panel fault log', description: 'BMS communication loss' },
        ],
        relatedInjectIds: [hvacHijackId],
      }),
    },
    // ========== CORRECTION: HVAC setpoints restored but backdoor found ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
      revealAtMinute: 4.5,
      title: 'UPDATE: HVAC Manual Override - Backdoor Found',
      content:
        'Facilities restored HVAC via manual override. However, forensics found additional ' +
        'backdoor on BMS controller. Attacker may have persistent access to building systems.',
      source: 'IT Security / Facilities',
      decisionPressure: 'Thermal crisis averted but persistent threat remains. Full isolation?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-HVAC', 'ENT-BMS', 'ENT-APT-SPIDER'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'IR Forensics',
        sourceId: 'FOR-BMS-BACKDOOR',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        ...createCorrectionIntake('SIEM', hvacHijackId, 'HIGH'),
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Backdoor indicators',
            description: 'Persistence mechanism identified',
          },
        ],
      }),
    },
    // ========== INJECT 6: Vendor Breach Confirmation ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
      revealAtMinute: 5,
      title: 'VENDOR: Your Tenant Breached',
      content:
        'Nexus CISO: "Confirmed unauthorized access to your tenant. Attacker had read ' +
        'access to BMS creds, floor plans, access control topology. Write access TBD."',
      source: 'Vendor CISO',
      decisionPressure: 'Threat actor has your blueprints. Physical security impact?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'VENDOR',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL', 'INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-NEXUS', 'ENT-FLOOR-PLANS', 'ENT-BMS', 'ENT-APT-SPIDER'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 2 },
      intake: createIntakeMetadata('VENDOR', {
        sourceSystem: 'Vendor CISO Direct',
        sourceId: 'VND-NEXUS-CISO-002',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'Breach notification',
            description: 'Tenant access confirmation',
          },
        ],
        requiresFollowUp: true,
      }),
    },
    // ========== INJECT 7: Site Security - Fake Contractors ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 10,
      revealAtMinute: 6.5,
      title: 'SITE: Fake Contractors',
      content:
        'Guard: Two in Nexus uniforms claimed emergency maintenance. Nexus has no record. ' +
        'Departed when asked to verify. Plate captured.',
      source: 'Site Security Officer',
      decisionPressure: 'Physical recon using vendor cover? Notify law enforcement?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'SITE_SECURITY',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-FAKE-CONTRACTORS', 'ENT-NEXUS', 'ENT-APT-SPIDER'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 2, responders: 1 },
      intake: createIntakeMetadata('RADIO', {
        sourceSystem: 'Dispatch Console',
        sourceId: 'UNIT-PATROL-7',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        attachments: [
          { type: 'STILL', label: 'Vehicle plate', description: 'License plate photo' },
          {
            type: 'STILL',
            label: 'Subject photos',
            description: 'Two individuals in vendor uniforms',
          },
        ],
      }),
    },
    // ========== NOISE: ACS - after hours valid access ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 11,
      revealAtMinute: 7.5,
      title: 'ACS: After-Hours Access - IT Oncall',
      content:
        'Badge access: IT on-call engineer entered server room. Valid credential, ' +
        'matches scheduled rotation. No anomalies detected.',
      source: 'Lenel OnGuard',
      decisionPressure: 'Valid access during active incident—verify or acknowledge?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('ACS', {
        sourceSystem: 'Lenel OnGuard',
        sourceId: 'RDR-SERVER-RM-01',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        ...createNoiseIntake('ACS', 'Valid scheduled access, verified against rotation'),
      }),
    },
    // ========== INJECT 8: OSINT Floor Plans Leaked ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 12,
      revealAtMinute: 8,
      title: 'OSINT: Floor Plans Leaked',
      content:
        'Threat intel: Your DC floor plans posted to paste site. Nexus metadata. ' +
        'Includes rack locations, camera positions, mantrap specs. 340 views.',
      source: 'Threat Intel Platform',
      decisionPressure: 'Physical security compromised. What compensating controls?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'OSINT',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-FLOOR-PLANS', 'ENT-DC', 'ENT-APT-SPIDER'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 1, guards: 1 },
      intake: createIntakeMetadata('OSINT', {
        sourceSystem: 'Recorded Future',
        sourceId: 'OSINT-PASTE-8821',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'Leaked document',
            description: 'DC floor plan with camera positions',
          },
        ],
      }),
    },
    // ========== INJECT 9: FBI Evidence Request ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 13,
      revealAtMinute: 9.5,
      title: 'FBI: Evidence Preservation Request',
      content:
        'FBI Cyber: Investigating Industrial Spider multi-victim. Request log preservation, ' +
        'avoid system changes. Can we collect evidence within 24 hours?',
      source: 'FBI Cyber Division',
      decisionPressure: 'Evidence vs. recovery tradeoff. Legal coordination needed.',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'LE',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-APT-SPIDER', 'ENT-NEXUS'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('LE', {
        sourceSystem: 'FBI Cyber Division',
        sourceId: 'FBI-EVID-REQ-441',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'DOCUMENT',
            label: 'Evidence request',
            description: 'Formal preservation request',
          },
        ],
      }),
    },
    // ========== INJECT 10: Executive Briefing Request ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 14,
      revealAtMinute: 11,
      title: 'EXEC: CEO Wants BLUF',
      content:
        'CEO call in 10 mins. Needs: (1) People safe? (2) Data safe? (3) Systems ETA? ' +
        '(4) Accountability? Prepare BLUF for each.',
      source: 'Executive Office',
      decisionPressure: 'Frame cross-domain incident for exec. Your recommendation?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL', 'CYBER'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-DC', 'ENT-FIRE-PANEL', 'ENT-NEXUS'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: {},
      intake: createIntakeMetadata('EXECUTIVE', {
        sourceSystem: 'CEO Direct Line',
        sourceId: 'EXEC-CEO-FLASH',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
      }),
    },
  ];

  const log = createDecisionLog({
    title: 'Supply Chain Intrusion - Building Automation',
    description:
      'Critical building automation vendor reports active intrusion affecting customer environments. ' +
      'Your organization relies on this vendor for HVAC, fire systems, access control, and data center ' +
      'environmental monitoring. Early indicators suggest attacker interest in physical security ' +
      'configurations. Life-safety systems may require isolation from compromised network.',
    severity: 'CRITICAL',
    impactCategories: [
      'PHYSICAL_SECURITY',
      'BUSINESS_CONTINUITY',
      'DATA_INTEGRITY',
      'VENDOR_OPERATIONS',
    ],
    reportedBy: 'Vendor Emergency Line',
    createdBy: 'GSOC Watch Commander',
    organization: 'Hourglass Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
    linkedEntities: SUPPLY_CHAIN_ENTITIES,
  });

  return log;
}

/**
 * Entity definitions for Insider Threat scenario
 */
const INSIDER_THREAT_ENTITIES: LinkedEntity[] = [
  {
    id: 'ENT-JSMITH',
    type: 'PERSON',
    name: 'JSmith (Sr. Network Engineer)',
    shortName: 'JSmith',
    description: 'Subject of investigation, privileged access',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-JSMITH-WKSTN', 'ENT-DC-ACCESS', 'ENT-COMPETITOR'],
  },
  {
    id: 'ENT-JSMITH-WKSTN',
    type: 'SYSTEM',
    name: 'JSmith Workstation',
    shortName: 'Subject Wkstn',
    description: 'Source of 2.3GB data exfiltration',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-JSMITH', 'ENT-CUSTOMER-DATA'],
  },
  {
    id: 'ENT-CUSTOMER-DATA',
    type: 'ASSET',
    name: 'Customer Database & Contracts',
    shortName: 'Customer Data',
    description: 'PII and contracts transferred to personal cloud',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-JSMITH', 'ENT-JSMITH-WKSTN', 'ENT-COMPETITOR'],
  },
  {
    id: 'ENT-NETWORK-CONFIGS',
    type: 'ASSET',
    name: 'Network Infrastructure Configs',
    shortName: 'Network Configs',
    description: 'Firewall rules and diagrams exfiltrated',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-JSMITH', 'ENT-BACKUP-SYSTEM'],
  },
  {
    id: 'ENT-DC-ACCESS',
    type: 'PLACE',
    name: 'Data Center (Physical)',
    shortName: 'DC',
    description: 'Location of after-hours photography',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-JSMITH', 'ENT-DC-MANTRAP'],
  },
  {
    id: 'ENT-DC-MANTRAP',
    type: 'PLACE',
    name: 'DC Mantrap',
    shortName: 'Mantrap',
    description: 'Access control point for confrontation decision',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-DC-ACCESS', 'ENT-JSMITH'],
  },
  {
    id: 'ENT-COMPETITOR',
    type: 'ORGANIZATION',
    name: 'Competitor (Strategic Initiatives)',
    shortName: 'Competitor',
    description: 'LinkedIn recruiter connection, suspected coordinator',
    criticality: 'HIGH',
    relatedEntityIds: ['ENT-JSMITH', 'ENT-CUSTOMER-DATA'],
  },
  {
    id: 'ENT-BACKUP-SYSTEM',
    type: 'SYSTEM',
    name: 'Backup Infrastructure',
    shortName: 'Backup System',
    description: 'Customer DB copies, stale credentials used',
    criticality: 'CRITICAL',
    relatedEntityIds: ['ENT-JSMITH', 'ENT-CUSTOMER-DATA'],
  },
  {
    id: 'ENT-FBI-AGENT',
    type: 'PERSON',
    name: 'FBI Economic Espionage Investigator',
    shortName: 'FBI Agent',
    description: 'Active investigation, requesting coordination',
    criticality: 'MEDIUM',
    relatedEntityIds: ['ENT-JSMITH', 'ENT-COMPETITOR'],
  },
];

/**
 * Scenario 3: Insider Threat with External Coordination
 *
 * Behavioral analytics flag suspicious activity from a privileged user.
 * Investigation reveals potential coordination with external actors
 * and physical access to sensitive areas.
 */
export function createInsiderThreatScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'SecureView Analytics',
    vendorType: 'User Behavior Analytics & Insider Threat Detection',
    servicesAffected: [
      'UEBA platform',
      'DLP integration',
      'Badge access correlation',
      'HR system integration',
    ],
    slaRequirements: '99.9% uptime, real-time alerting',
    alternateVendors: ['Manual log review', 'HR investigation protocols'],
    lastKnownGoodState: 'Normal operations',
  };

  const learningObjective: LearningObjective = {
    primary:
      'Coordinate insider threat response across security domains while preserving investigation integrity',
    secondary: [
      'Balance employee rights with security requirements',
      'Coordinate physical access restrictions without alerting subject',
      'Manage intelligence sharing with law enforcement',
    ],
    expectedDecisions: [
      'Investigation scope and HR involvement',
      'Physical access modification approach',
      'Law enforcement engagement timing',
      'Data exfiltration containment',
    ],
    skillsTrained: [
      'Insider threat investigation coordination',
      'Legal/HR/Security collaboration',
      'Physical-cyber correlation',
      'Evidence preservation',
    ],
  };

  // ID references for corrections
  const uebaAlertId = generateId('INJ');
  const dlpAlertId = generateId('INJ');

  const injects: FusedInject[] = [
    // ========== INJECT 1: SIEM UEBA Alert ==========
    {
      id: uebaAlertId,
      sequenceNumber: 1,
      revealAtMinute: 0.25,
      title: 'UEBA: High-Risk User Alert',
      content:
        'SecureView: JSmith (Sr. Network Engineer) risk score 94/100. Anomalies: 3AM VPN ' +
        'from new geo, large restricted downloads, unusual DC badge access.',
      source: 'UEBA Platform',
      decisionPressure: 'Who needs to know? How to investigate without alerting subject?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-JSMITH', 'ENT-JSMITH-WKSTN', 'ENT-DC-ACCESS'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'SecureView Analytics',
        sourceId: 'UEBA-HIGH-RISK-4482',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Risk score breakdown',
            description: 'Behavioral anomaly details',
          },
        ],
      }),
    },
    // ========== NOISE: Routine badge access ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 0.5,
      title: 'ACS: Badge Access - Cafeteria',
      content:
        'Routine: 47 badge reads at cafeteria entrance 7:45-8:15 AM. Normal morning traffic. ' +
        'No anomalies detected.',
      source: 'Lenel OnGuard',
      decisionPressure: 'Routine report—acknowledge during active investigation?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('ACS', {
        sourceSystem: 'Lenel OnGuard',
        sourceId: 'RDR-CAF-MAIN-01',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        ...createNoiseIntake('ACS', 'Normal morning badge traffic'),
      }),
    },
    // ========== INJECT 2: VMS DC Recon Evidence ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 0.75,
      title: 'PHYSICAL: DC Recon Evidence',
      content:
        'GSOC: JSmith accessed DC at 2:47 AM. Camera shows subject photographing server rack ' +
        'labels with personal phone. 34-min visit vs. typical 5-10 min.',
      source: 'GSOC Analyst',
      decisionPressure: 'Physical recon evidence. Escalate HR/Legal? Preserve footage.',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER', 'INTELLIGENCE'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-JSMITH', 'ENT-DC-ACCESS'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('VMS', {
        sourceSystem: 'Milestone XProtect',
        sourceId: 'CAM-DC-RACK-A-12',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'VIDEO_CLIP',
            label: 'DC footage',
            description: 'Subject photographing server rack labels',
          },
          { type: 'STILL', label: 'Badge access', description: 'Subject entering DC at 2:47 AM' },
        ],
        relatedInjectIds: [uebaAlertId],
      }),
    },
    // ========== INJECT 3: SIEM DLP Alert ==========
    {
      id: dlpAlertId,
      sequenceNumber: 4,
      revealAtMinute: 1.5,
      title: 'DLP: 2.3GB Exfiltrated',
      content:
        'DLP: 2.3GB to personal cloud from JSmith workstation. Network diagrams, firewall ' +
        'configs, customer contracts. Transfer completed—policy was monitor-only.',
      source: 'DLP Platform',
      decisionPressure: 'Exfil confirmed. Block account now or continue monitoring?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: [
        'ENT-JSMITH',
        'ENT-JSMITH-WKSTN',
        'ENT-CUSTOMER-DATA',
        'ENT-NETWORK-CONFIGS',
      ],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 2 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'Microsoft Purview DLP',
        sourceId: 'DLP-EXFIL-HIGH-991',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Transfer log',
            description: '2.3GB transfer to personal cloud service',
          },
          { type: 'DOCUMENT', label: 'File manifest', description: 'List of exfiltrated files' },
        ],
      }),
    },
    // ========== TIP: HR provides context ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 5,
      revealAtMinute: 2.5,
      title: 'HR: Subject on PIP',
      content:
        'HR BP: JSmith on PIP 6 weeks. Attitude change after missed promotion. Mentioned ' +
        '"having options" in recent 1:1. No prior security concerns.',
      source: 'HR Business Partner',
      decisionPressure: 'Motivation context. Changes assessment? Legal involvement?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-JSMITH'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      intake: createIntakeMetadata('TIP', {
        sourceSystem: 'HR Business Partner Call',
        sourceId: 'TIP-HR-INTERNAL',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
      }),
    },
    // ========== INJECT 4: OSINT Competitor Connection ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 6,
      revealAtMinute: 3.5,
      title: 'OSINT: Competitor Connection',
      content:
        'Threat intel: JSmith LinkedIn updated 3 weeks ago. Profile viewed by competitor ' +
        'accounts. Accepted recruiter connection from competitor strategic initiatives.',
      source: 'Threat Intelligence',
      decisionPressure: 'Competitor coordination? Trade secret theft concern?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'OSINT',
      confidenceLevel: 'MEDIUM',
      crossDomainImpact: ['CYBER'],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-JSMITH', 'ENT-COMPETITOR', 'ENT-CUSTOMER-DATA'],
      triagePriority: 'URGENT',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('OSINT', {
        sourceSystem: 'Analyst Desktop / LinkedIn',
        sourceId: 'OSINT-SOCMINT-221',
        confidence: 'MEDIUM',
        completeness: 'PARTIAL',
        attachments: [
          {
            type: 'STILL',
            label: 'LinkedIn profile',
            description: 'Recent updates and connections',
          },
        ],
      }),
    },
    // ========== CORRECTION: DLP additional files found ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
      revealAtMinute: 4.5,
      title: 'UPDATE: DLP - Additional Exfil Discovered',
      content:
        'Forensics update: Earlier transfer also included customer PII database export. ' +
        'Total exfil now 3.7GB. Some files encrypted before transfer—cannot confirm contents.',
      source: 'SOC Forensics',
      decisionPressure: 'PII exposure confirmed. Breach notification threshold reached?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-JSMITH', 'ENT-CUSTOMER-DATA'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'SOC Forensics',
        sourceId: 'FOR-DLP-UPDATE',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        ...createCorrectionIntake('SIEM', dlpAlertId, 'HIGH'),
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Extended transfer log',
            description: 'Additional encrypted files identified',
          },
        ],
      }),
    },
    // ========== INJECT 5: ACS Subject On-Site ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
      revealAtMinute: 5,
      title: 'REAL-TIME: Subject On-Site',
      content:
        'JSmith just badged into main lobby, heading to IT ops area. Normal work hours. ' +
        'Manager offsite today.',
      source: 'Access Control',
      decisionPressure: 'Subject on-site. Confront now or continue covert observation?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-JSMITH'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 1 },
      intake: createIntakeMetadata('ACS', {
        sourceSystem: 'Lenel OnGuard',
        sourceId: 'RDR-LOBBY-MAIN',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          { type: 'MAP_PIN', label: 'Current location', location: 'Main Lobby → IT Ops' },
        ],
      }),
    },
    // ========== NOISE: Visitor badge request ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
      revealAtMinute: 5.5,
      title: 'ACS: Visitor Pre-Reg - Sales Meeting',
      content:
        'Visitor pre-registration: 3 visitors from Acme Corp for 10 AM sales meeting. ' +
        'Host: VP Sales. Standard escort policy applies.',
      source: 'Visitor Management',
      decisionPressure: 'Routine visitor activity—acknowledge?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'PSIM',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'ROUTINE',
      linkedEntityIds: [],
      triagePriority: 'ROUTINE',
      resourcesRequired: {},
      intake: createIntakeMetadata('ACS', {
        sourceSystem: 'Visitor Management System',
        sourceId: 'VIS-PRE-REG-4421',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        ...createNoiseIntake('ACS', 'Scheduled business visitor'),
      }),
    },
    // ========== INJECT 6: SIEM Backup System Access ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 10,
      revealAtMinute: 6.5,
      title: 'SOC: Backup System Access',
      content:
        'JSmith attempting backup infrastructure access—not in current role. 3 failed auths, ' +
        'then success with stale creds that should be revoked. Contains customer DB copies.',
      source: 'SOC Analyst',
      decisionPressure: 'Active threat. Disable access? May alert subject to investigation.',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'CYBER',
      sourceType: 'SOC',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-JSMITH', 'ENT-BACKUP-SYSTEM', 'ENT-CUSTOMER-DATA'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 1, responders: 1 },
      intake: createIntakeMetadata('SIEM', {
        sourceSystem: 'Splunk',
        sourceId: 'COR-AUTH-ANOMALY-772',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          {
            type: 'LOG_EXCERPT',
            label: 'Auth attempts',
            description: 'Failed and successful authentication log',
          },
        ],
      }),
    },
    // ========== TIP: Legal Guidance ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 11,
      revealAtMinute: 8,
      title: 'LEGAL: Guidance Required',
      content:
        'General Counsel: "Preserve evidence, consider LE notification. But confronting ' +
        'without HR present creates liability. What is immediate threat level?"',
      source: 'General Counsel',
      decisionPressure: 'Balance legal vs. security needs. Frame your recommendation.',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'INTERNAL',
      confidenceLevel: 'HIGH',
      crossDomainImpact: [],
      urgencyLevel: 'URGENT',
      linkedEntityIds: ['ENT-JSMITH', 'ENT-CUSTOMER-DATA'],
      triagePriority: 'URGENT',
      resourcesRequired: {},
      intake: createIntakeMetadata('TIP', {
        sourceSystem: 'General Counsel Direct',
        sourceId: 'TIP-LEGAL-FLASH',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        requiresFollowUp: true,
      }),
    },
    // ========== INJECT 7: Radio - DC Mantrap ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 12,
      revealAtMinute: 9.5,
      title: 'REAL-TIME: DC Mantrap',
      content:
        'JSmith at DC mantrap now. Valid perimeter badge but should be denied inner door per ' +
        'your recommendation. Guard in mantrap. Subject on phone while waiting.',
      source: 'DC Security',
      decisionPressure: 'Moment of truth. Deny access and confront, or allow and monitor?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'SITE_SECURITY',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-JSMITH', 'ENT-DC-MANTRAP', 'ENT-DC-ACCESS'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { guards: 2, responders: 1 },
      intake: createIntakeMetadata('RADIO', {
        sourceSystem: 'Dispatch Console',
        sourceId: 'UNIT-DC-MANTRAP',
        confidence: 'HIGH',
        completeness: 'COMPLETE',
        attachments: [
          { type: 'STILL', label: 'Mantrap camera', description: 'Subject waiting at inner door' },
        ],
      }),
    },
    // ========== INJECT 8: LE FBI Already Investigating ==========
    {
      id: generateId('INJ'),
      sequenceNumber: 13,
      revealAtMinute: 11,
      title: 'FBI: Already Investigating',
      content:
        'FBI agent: "Active economic espionage investigation in your sector. A name from ' +
        'your org has appeared. Can we meet within 24 hours?"',
      source: 'FBI Cyber Division',
      decisionPressure: 'FBI already on it. Coordinate? What can you share?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'INTELLIGENCE',
      sourceType: 'LE',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['CYBER', 'PHYSICAL'],
      urgencyLevel: 'IMMEDIATE',
      linkedEntityIds: ['ENT-FBI-AGENT', 'ENT-JSMITH', 'ENT-COMPETITOR'],
      triagePriority: 'IMMEDIATE',
      resourcesRequired: { analysts: 1 },
      intake: createIntakeMetadata('LE', {
        sourceSystem: 'FBI Cyber Division',
        sourceId: 'FBI-ECON-ESPION-001',
        confidence: 'HIGH',
        completeness: 'PARTIAL',
        requiresFollowUp: true,
      }),
    },
  ];

  const log = createDecisionLog({
    title: 'Insider Threat - External Coordination Suspected',
    description:
      'User behavior analytics has flagged a privileged employee for high-risk activity. ' +
      'Initial investigation reveals patterns consistent with data theft: after-hours physical ' +
      'access, large file transfers, and reconnaissance of sensitive systems. Subject remains ' +
      'employed and may be coordinating with external parties.',
    severity: 'CRITICAL',
    impactCategories: [
      'DATA_INTEGRITY',
      'PHYSICAL_SECURITY',
      'INVESTIGATIONS',
      'BUSINESS_CONTINUITY',
    ],
    reportedBy: 'UEBA Platform',
    createdBy: 'GSOC Watch Commander',
    organization: 'Hourglass Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
    linkedEntities: INSIDER_THREAT_ENTITIES,
  });

  return log;
}

/**
 * ESRM configuration for Executive Threat scenario
 */
export const EXECUTIVE_THREAT_ESRM: ScenarioESRMConfig = {
  primaryAssets: EXECUTIVE_THREAT_ASSETS,
  initialRiskLevel: 'HIGH',
  riskToleranceThreshold: 'MEDIUM',
  requiredCommunications: [
    { role: 'Chief of Staff', timing: 'IMMEDIATE', purpose: 'Executive safety posture decision' },
    {
      role: 'Director of Executive Protection',
      timing: 'IMMEDIATE',
      purpose: 'Protective intel coordination',
    },
    { role: 'CISO', timing: 'WITHIN_15MIN', purpose: 'Cyber-physical correlation' },
    { role: 'General Counsel', timing: 'WITHIN_HOUR', purpose: 'Legal notification requirements' },
  ],
  governanceGuidelines: [
    'Executive safety decisions require Chief of Staff concurrence',
    'Travel modifications over $50K require CFO awareness',
    'Law enforcement engagement requires Legal coordination',
    'Vendor credential rotation requires IT Security approval',
  ],
};

/**
 * ESRM configuration for Supply Chain scenario
 */
export const SUPPLY_CHAIN_ESRM: ScenarioESRMConfig = {
  primaryAssets: SUPPLY_CHAIN_ASSETS,
  initialRiskLevel: 'CRITICAL',
  riskToleranceThreshold: 'HIGH',
  requiredCommunications: [
    { role: 'VP of Infrastructure', timing: 'IMMEDIATE', purpose: 'Data center thermal risk' },
    { role: 'Director of EHS', timing: 'IMMEDIATE', purpose: 'Life safety system status' },
    { role: 'CSO', timing: 'IMMEDIATE', purpose: 'Physical security posture' },
    { role: 'CEO', timing: 'WITHIN_15MIN', purpose: 'Executive situational awareness' },
  ],
  governanceGuidelines: [
    'Life safety decisions take precedence over evidence preservation',
    'Data center shutdown authority rests with VP Infrastructure',
    'Fire marshal notification required for extended monitoring loss',
    'Vendor isolation requires documented risk acceptance',
  ],
};

/**
 * ESRM configuration for Insider Threat scenario
 */
export const INSIDER_THREAT_ESRM: ScenarioESRMConfig = {
  primaryAssets: INSIDER_THREAT_ASSETS,
  initialRiskLevel: 'HIGH',
  riskToleranceThreshold: 'MEDIUM',
  requiredCommunications: [
    { role: 'General Counsel', timing: 'IMMEDIATE', purpose: 'Legal/HR coordination' },
    { role: 'CISO', timing: 'IMMEDIATE', purpose: 'Data exfiltration containment' },
    {
      role: 'HR Business Partner',
      timing: 'WITHIN_15MIN',
      purpose: 'Employee action coordination',
    },
    {
      role: 'Chief Revenue Officer',
      timing: 'WITHIN_HOUR',
      purpose: 'Customer data exposure assessment',
    },
  ],
  governanceGuidelines: [
    'Employee confrontation requires HR and Legal presence',
    'Access revocation may alert subject to investigation',
    'Evidence preservation takes priority over immediate containment',
    'Law enforcement coordination through Legal only',
  ],
};

export const FUSED_SCENARIOS = [
  {
    id: 'executive-threat-convergence',
    name: 'Executive Threat Convergence',
    description:
      'Multi-vector threat targeting executive leadership: cyber reconnaissance, physical surveillance, and vendor compromise converge.',
    severity: 'CRITICAL' as const,
    vendorType: 'Physical Access & Identity Management',
    domains: ['PHYSICAL', 'INTELLIGENCE', 'CYBER'] as SecurityDomain[],
    esrmConfig: EXECUTIVE_THREAT_ESRM,
    createFn: createExecutiveThreatScenario,
  },
  {
    id: 'supply-chain-intrusion',
    name: 'Supply Chain Intrusion',
    description:
      'Building automation vendor compromised by APT group. Life-safety systems at risk, physical security blueprints exposed.',
    severity: 'CRITICAL' as const,
    vendorType: 'Building Automation & Access Control',
    domains: ['CYBER', 'PHYSICAL', 'INTELLIGENCE'] as SecurityDomain[],
    esrmConfig: SUPPLY_CHAIN_ESRM,
    createFn: createSupplyChainScenario,
  },
  {
    id: 'insider-threat-external',
    name: 'Insider Threat Investigation',
    description:
      'Privileged employee showing indicators of data theft and external coordination. Real-time investigation with subject on-site.',
    severity: 'CRITICAL' as const,
    vendorType: 'User Behavior Analytics',
    domains: ['CYBER', 'PHYSICAL', 'INTELLIGENCE'] as SecurityDomain[],
    esrmConfig: INSIDER_THREAT_ESRM,
    createFn: createInsiderThreatScenario,
  },
];
