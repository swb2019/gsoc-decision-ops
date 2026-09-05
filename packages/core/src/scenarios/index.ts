/**
 * GSOC Decision Operations - Training Scenarios
 *
 * Scenarios for practicing structured decision-making under conditions
 * of incomplete information. All scenarios are simulations for training.
 */

import type { DecisionLog, VendorContext, LearningObjective, ScenarioInject } from '../types.js';
import { createDecisionLog } from '../decision-log.js';
import { generateId } from '../utils.js';

export {
  FUSED_SCENARIOS,
  createExecutiveThreatScenario,
  createSupplyChainScenario,
  createInsiderThreatScenario,
  EXECUTIVE_THREAT_ESRM,
  SUPPLY_CHAIN_ESRM,
  INSIDER_THREAT_ESRM,
  type FusedInject,
  type SecurityDomain,
  type InjectSource,
} from './fused-gsoc.js';

/**
 * Scenario 1: Access Control Vendor Ransomware
 *
 * Your organization's access control system vendor experiences a
 * ransomware attack, potentially affecting badge systems across
 * multiple sites.
 */
export function createAccessControlVendorScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'SecureAccess Solutions',
    vendorType: 'Physical Access Control System Provider',
    servicesAffected: [
      'Badge credential management',
      'Access control panel communications',
      'Mobile credential app',
      'Visitor management integration',
    ],
    slaRequirements: '99.9% uptime, 4-hour response for critical issues',
    alternateVendors: ['Manual key override', 'Security officer stationed access'],
    lastKnownGoodState: 'Systems operational 6 hours ago',
  };

  const learningObjective: LearningObjective = {
    primary: 'Practice separating operational continuity decisions from forensic investigation',
    secondary: [
      'Document assumptions explicitly with risk-if-wrong',
      'Frame posture recommendations as ESRM risk advice to asset owners',
    ],
    expectedDecisions: [
      'Initial posture on badge reader operations (CONTINUE with monitoring likely)',
      'Posture on automated provisioning (PAUSE likely)',
      'Posture on visitor management (DEGRADE to manual likely)',
    ],
    skillsTrained: [
      'Fact vs assumption separation',
      'ESRM residual risk framing',
      'Stakeholder coordination',
    ],
  };

  const injects: ScenarioInject[] = [
    {
      id: generateId('INJ'),
      sequenceNumber: 1,
      revealAtMinute: 5,
      title: 'Vendor Confirms Ransomware Scope',
      content:
        'Vendor confirms ransomware affected cloud credential database. ' +
        'Local panel caches remain intact. No evidence of data exfiltration yet.',
      source: 'Vendor Emergency Call',
      decisionPressure: 'Should you change posture on badge operations given new information?',
      expectedPostureImpact: 'CONTINUE',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 12,
      title: 'Executive Building Access Request',
      content:
        'CEO office requests new badge provisioning for visiting board member arriving in 2 hours. ' +
        'Normal process would use vendor cloud system.',
      source: 'Executive Assistant',
      decisionPressure: 'How do you handle urgent provisioning when automated systems are suspect?',
      expectedPostureImpact: 'DEGRADE',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 20,
      title: 'IT Security Requests Credential Rotation',
      content:
        'CISO team asks if GSOC can isolate vendor API connections. They want to rotate all ' +
        'service account credentials as precaution.',
      source: 'IT Security Operations',
      decisionPressure:
        'Credential rotation will break badge sync. Who owns this decision? What is residual risk?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
      revealAtMinute: 35,
      title: 'Vendor Provides Restoration Timeline',
      content:
        'Vendor estimates 4-6 hours to restore cloud services from clean backup. ' +
        'They recommend customers continue using local panel caches.',
      source: 'Vendor Status Update',
      decisionPressure:
        'With timeline known, should you adjust manual procedures or wait for restoration?',
      revealed: false,
    },
  ];

  const log = createDecisionLog({
    title: 'Access Control Vendor Ransomware Incident',
    description:
      'SecureAccess Solutions has notified us of a ransomware attack affecting their ' +
      'cloud infrastructure. Badge systems are intermittently available. ' +
      'Scope of data exposure unknown.',
    severity: 'HIGH',
    impactCategories: ['ACCESS_CONTROL', 'VISITOR_MANAGEMENT', 'PHYSICAL_SECURITY'],
    reportedBy: 'Vendor Account Manager',
    createdBy: 'GSOC Manager',
    organization: 'Training Organization',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects,
  });

  return log;
}

/**
 * Scenario 2: Video Management System Compromise
 *
 * Anomalous behavior is detected in your video management system,
 * potentially indicating a supply chain compromise.
 */
export function createVideoSystemCompromiseScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'VisionGuard VMS',
    vendorType: 'Video Management System Provider',
    servicesAffected: [
      'Live video streaming',
      'Video recording and storage',
      'Analytics and alerts',
      'Remote viewing application',
    ],
    slaRequirements: '99.95% uptime, 24/7 support',
    alternateVendors: ['Local NVR recording', 'Mobile device documentation'],
    lastKnownGoodState: 'Normal operations 12 hours ago',
  };

  const learningObjective: LearningObjective = {
    primary: 'Practice coordinating with IT Security while maintaining GSOC operational focus',
    secondary: [
      'Distinguish GSOC operational decisions from IT forensic investigation',
      'Frame video system as asset with business owner (Facilities/Security Director)',
    ],
    expectedDecisions: [
      'Posture on live video operations (DEGRADE or CONTINUE with monitoring)',
      'Posture on remote viewing access (PAUSE likely)',
      'Evidence preservation coordination with IT',
    ],
    skillsTrained: ['IT/GSOC coordination', 'Evidence preservation awareness', 'Scope discipline'],
  };

  const injects: ScenarioInject[] = [
    {
      id: generateId('INJ'),
      sequenceNumber: 1,
      revealAtMinute: 8,
      title: 'IT Security Detects C2 Traffic Pattern',
      content:
        'Network team confirms traffic pattern matches known command-and-control signature. ' +
        'Recommends isolating VMS servers immediately.',
      source: 'IT Security SOC',
      decisionPressure:
        'IT wants to isolate servers. This will kill video. Who approves? What alternatives exist?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 15,
      title: 'Active Investigation Requires Video',
      content:
        'Investigations team reports they need VMS access for ongoing workplace incident review. ' +
        'Evidence may be compromised if servers are isolated.',
      source: 'Corporate Investigations',
      decisionPressure:
        'Competing priorities: security isolation vs. evidence access. How do you advise?',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 25,
      title: 'Vendor Releases Emergency Patch',
      content:
        'VisionGuard acknowledges vulnerability in recent update. Emergency patch available. ' +
        'Vendor recommends patching before reconnecting to network.',
      source: 'Vendor Security Advisory',
      decisionPressure:
        'Do you recommend patching isolated systems before restoration? Who owns this decision?',
      revealed: false,
    },
  ];

  const log = createDecisionLog({
    title: 'Video Management System Supply Chain Concern',
    description:
      'IT Security has flagged unusual network traffic patterns from VMS servers. ' +
      'VisionGuard has not confirmed a breach but is investigating. ' +
      'Potential supply chain compromise through recent software update.',
    severity: 'HIGH',
    impactCategories: ['VIDEO_SURVEILLANCE', 'DATA_INTEGRITY', 'INVESTIGATIONS'],
    reportedBy: 'IT Security Operations Center',
    createdBy: 'GSOC Manager',
    organization: 'Training Organization',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects,
  });

  return log;
}

/**
 * Scenario 3: Alarm Monitoring Service Outage
 *
 * Your third-party alarm monitoring service experiences a
 * significant outage during off-hours.
 */
export function createAlarmMonitoringOutageScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'CentralStation Pro',
    vendorType: 'Third-Party Alarm Monitoring Service',
    servicesAffected: [
      'Intrusion alarm monitoring',
      'Fire alarm supervision',
      'Panic/duress alarm response',
      'Environmental sensor monitoring',
    ],
    slaRequirements: '99.99% uptime, immediate dispatch protocols',
    alternateVendors: ['Direct GSOC monitoring', 'Local police/fire direct notification'],
    lastKnownGoodState: 'Full service 2 hours ago',
  };

  const learningObjective: LearningObjective = {
    primary: 'Practice rapid escalation and stakeholder notification under time pressure',
    secondary: [
      'Prioritize life-safety alarms over property alarms',
      'Document residual risk clearly for asset owners (site managers)',
    ],
    expectedDecisions: [
      'Immediate posture on alarm monitoring (DEGRADE to GSOC direct monitoring)',
      'Fire alarm supervision approach (may require local fire department notification)',
      'Staffing adjustment decisions',
    ],
    skillsTrained: [
      'Life-safety prioritization',
      'Rapid stakeholder notification',
      'Resource allocation under pressure',
    ],
  };

  const injects: ScenarioInject[] = [
    {
      id: generateId('INJ'),
      sequenceNumber: 1,
      revealAtMinute: 3,
      title: 'Fire Alarm Activates at Remote Site',
      content:
        'GSOC receives direct fire alarm signal from Site 7 (normally routed through vendor). ' +
        'Cannot confirm if vendor received signal. Site is unoccupied overnight.',
      source: 'Direct Panel Signal',
      decisionPressure:
        'Fire alarm with no vendor backup. Dispatch fire department? Who makes this call?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
      revealAtMinute: 10,
      title: 'Vendor Suspects Ransomware',
      content:
        'CentralStation Pro now believes outage is ransomware-related. ' +
        'They cannot provide restoration timeline. Recommending all customers assume extended outage.',
      source: 'Vendor Emergency Call',
      decisionPressure:
        'Extended outage likely. Do you increase GSOC staffing? How do you advise site managers?',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 18,
      title: 'Site Manager Questions Coverage',
      content:
        'Distribution center manager calls GSOC asking if their site is still protected. ' +
        'They have high-value inventory and are concerned about overnight security.',
      source: 'Site Manager Call',
      decisionPressure:
        'How do you frame residual risk to the asset owner? What compensating controls can you offer?',
      revealed: false,
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
      revealAtMinute: 30,
      title: 'Second Vendor Offers Emergency Coverage',
      content:
        'Backup monitoring vendor (SecureWatch) can assume monitoring within 4 hours ' +
        'if you provide site configuration data. Cost is 3x normal rate.',
      source: 'Vendor Sales (via Emergency Line)',
      decisionPressure:
        'Emergency vendor available at premium cost. Who approves this spend? Is it worth it?',
      revealed: false,
    },
  ];

  const log = createDecisionLog({
    title: 'Third-Party Alarm Monitoring Service Outage',
    description:
      'CentralStation Pro reports major infrastructure failure. ' +
      'Alarm signals not being received or processed. Affects all monitored sites. ' +
      'Cause under investigation - potential cyber incident not ruled out.',
    severity: 'CRITICAL',
    impactCategories: ['ALARM_MONITORING', 'PHYSICAL_SECURITY', 'BUSINESS_CONTINUITY'],
    reportedBy: 'Vendor NOC',
    createdBy: 'GSOC Supervisor',
    organization: 'Training Organization',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects,
  });

  return log;
}

/**
 * Get all available training scenarios
 */
import type { ScenarioESRMConfig } from '../esrm.js';

export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  severity: string;
  vendorType: string;
  domains?: ('PHYSICAL' | 'INTELLIGENCE' | 'CYBER')[];
  esrmConfig?: ScenarioESRMConfig;
  createFn: () => DecisionLog;
}

import { FUSED_SCENARIOS } from './fused-gsoc.js';

export function getAvailableScenarios(): ScenarioInfo[] {
  return [
    ...FUSED_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      severity: s.severity,
      vendorType: s.vendorType,
      domains: s.domains,
      esrmConfig: s.esrmConfig,
      createFn: s.createFn,
    })),
    {
      id: 'access-control-ransomware',
      name: 'Access Control Vendor Ransomware',
      description:
        'Badge system vendor experiences ransomware attack affecting credential management.',
      severity: 'HIGH',
      vendorType: 'Physical Access Control',
      createFn: createAccessControlVendorScenario,
    },
    {
      id: 'video-system-compromise',
      name: 'Video Management Supply Chain Concern',
      description:
        'Anomalous network behavior from VMS suggests potential supply chain compromise.',
      severity: 'HIGH',
      vendorType: 'Video Management System',
      createFn: createVideoSystemCompromiseScenario,
    },
    {
      id: 'alarm-monitoring-outage',
      name: 'Alarm Monitoring Service Outage',
      description:
        'Third-party alarm monitoring service experiences critical infrastructure failure.',
      severity: 'CRITICAL',
      vendorType: 'Alarm Monitoring Service',
      createFn: createAlarmMonitoringOutageScenario,
    },
  ];
}

/**
 * Create a scenario by ID
 */
export function createScenarioById(scenarioId: string): DecisionLog | null {
  const scenario = getAvailableScenarios().find((s) => s.id === scenarioId);
  return scenario ? scenario.createFn() : null;
}
