/**
 * Fused GSOC Scenarios - Physical + Intelligence + Cyber
 *
 * Cross-domain incidents that weave all three security lanes together,
 * requiring the player to manage residual risk across physical security,
 * threat intelligence, and cybersecurity simultaneously.
 */

import type { DecisionLog, VendorContext, LearningObjective, ScenarioInject } from '../types.js';
import { createDecisionLog } from '../decision-log.js';
import { generateId } from '../utils.js';
import type { ScenarioESRMConfig } from '../esrm.js';
import { EXECUTIVE_THREAT_ASSETS, SUPPLY_CHAIN_ASSETS, INSIDER_THREAT_ASSETS } from '../esrm.js';

/**
 * Inject source types for fused GSOC operations
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
 * Domain classification for cross-domain risk assessment
 */
export type SecurityDomain = 'PHYSICAL' | 'INTELLIGENCE' | 'CYBER';

/**
 * Extended inject with domain classification
 */
export interface FusedInject extends ScenarioInject {
  domain: SecurityDomain;
  sourceType: InjectSource;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';
  crossDomainImpact?: SecurityDomain[];
  urgencyLevel: 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
}

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

  const injects: FusedInject[] = [
    {
      id: generateId('INJ'),
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
      revealAtMinute: 1.5,
      title: 'PHYSICAL: Badge Anomaly C-Suite',
      content:
        'PSIM: 3 failed badge attempts at exec floor—credential not in directory. ' +
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 5,
      revealAtMinute: 3.5,
      title: 'EP: Surveillance in Singapore',
      content:
        'EP team reports possible surveillance of advance team at hotel. Two individuals ' +
        'photographing vehicles 30+ mins. Local liaison can\'t ID. CEO arrival in 18 hours.',
      source: 'Executive Protection Lead',
      decisionPressure: 'Connect to dark web post? Recommend trip modification?',
      expectedPostureImpact: 'PAUSE',
      revealed: false,
      domain: 'PHYSICAL',
      sourceType: 'EXEC_PROTECTION',
      confidenceLevel: 'HIGH',
      crossDomainImpact: ['INTELLIGENCE'],
      urgencyLevel: 'IMMEDIATE',
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 6,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
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
    organization: 'Aegis Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
  });

  return log;
}

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

  const injects: FusedInject[] = [
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 5,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 6,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 10,
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
    organization: 'Aegis Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
  });

  return log;
}

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

  const injects: FusedInject[] = [
    {
      id: generateId('INJ'),
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 2,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 3,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 4,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 5,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 6,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 7,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 8,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 9,
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
    },
    {
      id: generateId('INJ'),
      sequenceNumber: 10,
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
    organization: 'Aegis Command Training',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
    learningObjective,
    injects: injects as ScenarioInject[],
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
