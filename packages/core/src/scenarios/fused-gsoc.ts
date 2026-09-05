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
      revealAtMinute: 2,
      title: 'OSINT Alert: Executive Mentioned on Dark Web',
      content:
        'Threat intel platform flags CEO name on a dark web forum. Post discusses ' +
        '"upcoming opportunity" related to Singapore trip next week. Source reliability: MEDIUM. ' +
        'No specific threat articulated but timing correlates with public earnings call announcement.',
      source: 'Threat Intelligence Platform',
      decisionPressure:
        'Is this credible enough to brief the executive? What additional validation needed?',
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
      revealAtMinute: 5,
      title: 'SOC Ticket: Spear-Phishing Campaign Targeting EA',
      content:
        'SOC escalates ticket #4521: Three executive assistants received sophisticated ' +
        'phishing emails mimicking travel booking confirmations for Singapore. One clicked through ' +
        'but MFA blocked credential harvest. Attacker infrastructure traced to known APT cluster.',
      source: 'SOC Tier 2 Analyst',
      decisionPressure: 'Coordinate with SOC on containment. Does this validate the OSINT threat?',
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
      revealAtMinute: 9,
      title: 'Badge System Anomaly at Executive Floor',
      content:
        'PSIM alerts: 3 failed badge attempts at C-suite floor from credential ID not in directory. ' +
        'Credential format valid but identity lookup returns null. Vendor API showing intermittent ' +
        '503 errors. Could be system issue or credential cloning attempt.',
      source: 'PSIM Platform',
      decisionPressure:
        'Is this related to the threat or a vendor system issue? How do you secure the floor?',
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
      revealAtMinute: 14,
      title: 'Vendor Confirms API Compromise Investigation',
      content:
        'GlobalSecure CISO calls: They are investigating potential API credential compromise ' +
        'affecting multiple customers. Cannot confirm your tenant affected but recommending ' +
        'credential rotation and monitoring. Full assessment expected in 6-8 hours.',
      source: 'Vendor Emergency Notification',
      decisionPressure:
        'Do you rotate credentials now (breaking badge sync) or wait for assessment?',
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
      revealAtMinute: 20,
      title: 'Executive Protection Reports Surveillance',
      content:
        'EP team in Singapore reports possible surveillance of advance team at hotel. ' +
        'Two individuals photographing team vehicles over 30-minute period. Local liaison ' +
        'unable to identify. Hotel security reviewing CCTV. CEO arrival in 18 hours.',
      source: 'Executive Protection Lead',
      decisionPressure: 'Does this connect to the dark web post? Recommend trip modification?',
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
      revealAtMinute: 28,
      title: 'Law Enforcement Advisory Received',
      content:
        'FBI Cyber Division shares TLP:AMBER advisory on APT group matching your SOC indicators. ' +
        'Group known for corporate espionage with occasional physical operations support. ' +
        'Advisory recommends enhanced monitoring but no specific threat to your organization named.',
      source: 'FBI Cyber Division Liaison',
      decisionPressure:
        'How does this affect your threat assessment? What stakeholders need briefing?',
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
      revealAtMinute: 35,
      title: 'Site Security: Unfamiliar Vehicle in Exec Parking',
      content:
        'Security officer reports unfamiliar vehicle in executive parking structure for 3+ hours. ' +
        'Vehicle registered to rental company. Occupant not visible. Camera angle shows ' +
        'possible equipment setup inside vehicle. Local PD can respond in 15 minutes if requested.',
      source: 'Site Security Supervisor',
      decisionPressure:
        'Escalate to law enforcement? How does this fit the overall threat picture?',
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
      revealAtMinute: 42,
      title: 'SOC Update: C2 Beacon Detected on EA Workstation',
      content:
        'SOC confirms command-and-control beacon on one executive assistant workstation. ' +
        'Beacon dormant but matches APT infrastructure from phishing campaign. Workstation ' +
        'has calendar access for CEO and CFO. Attacker may have visibility into travel plans.',
      source: 'SOC Incident Commander',
      decisionPressure:
        'Travel plans potentially compromised. Immediate posture change for Singapore trip?',
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
      revealAtMinute: 50,
      title: 'Executive Decision Required: Trip Status',
      content:
        'Chief of Staff calls: Board meeting in 20 minutes will discuss Singapore trip. ' +
        'CEO wants GSOC recommendation on proceed/modify/cancel. CFO is pushing to proceed ' +
        'citing deal importance. CLO wants documented risk assessment before any decision.',
      source: 'Chief of Staff',
      decisionPressure: 'Frame your recommendation. What residual risk does each option carry?',
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
      revealAtMinute: 3,
      title: 'Vendor Emergency Notification',
      content:
        'Nexus Industrial Controls issues emergency advisory: "Active intrusion detected ' +
        'in customer management network. Scope under investigation. Recommending customers ' +
        'review access logs for anomalies. Do NOT disconnect without coordinating—may affect ' +
        'life-safety system handoffs."',
      source: 'Vendor Security Team',
      decisionPressure: 'What systems need immediate review? Who coordinates with Facilities?',
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
      revealAtMinute: 7,
      title: 'ISAC Alert: Industry-Wide Campaign',
      content:
        'FS-ISAC shares TLP:AMBER report: APT group "Industrial Spider" targeting ' +
        'building automation vendors across financial services. Known TTPs include ' +
        'long dwell times, data exfiltration, and potential for physical system manipulation. ' +
        'Three other institutions confirmed affected.',
      source: 'FS-ISAC',
      decisionPressure: 'Your vendor is likely part of coordinated campaign. Escalation path?',
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
      revealAtMinute: 11,
      title: 'Access Control Anomaly Detected',
      content:
        'SIEM correlates unusual pattern: 47 badge reads at data center perimeter in last hour—' +
        'normally 5-8 during this shift. All reads from valid credentials but timing suggests ' +
        'automated replay. Physical guard confirms no unusual foot traffic observed.',
      source: 'SIEM Correlation Engine',
      decisionPressure:
        'Evidence of credential replay? What is the physical security posture at DC?',
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
      revealAtMinute: 16,
      title: 'Data Center Cooling Alert',
      content:
        'Facilities reports: Data center cooling setpoints changed remotely to 85°F. ' +
        'Attempting manual override but BMS console shows "remote session active." ' +
        'Server room temps rising. Estimated 45 minutes to thermal shutdown threshold if unchecked.',
      source: 'Facilities Operations Center',
      decisionPressure: 'Life-safety/business-critical decision. Who authorizes network isolation?',
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
      revealAtMinute: 22,
      title: 'Fire Panel Communication Loss',
      content:
        'Main campus fire panel reports "communication fault" with building automation. ' +
        'Fire suppression remains functional in standalone mode but central monitoring lost. ' +
        'Fire marshal notification may be required if not restored within 4 hours per code.',
      source: 'Fire Safety Systems',
      decisionPressure:
        'Life-safety system degradation. Document for compliance. Notify fire marshal?',
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
      revealAtMinute: 28,
      title: 'Vendor Confirms Your Tenant Accessed',
      content:
        'Nexus CISO calls directly: "We have confirmed unauthorized access to your tenant ' +
        'configuration data. Attacker had read access to BMS credentials, floor plans, and ' +
        'access control topology. Cannot confirm write access yet. Forensics ongoing."',
      source: 'Vendor CISO',
      decisionPressure: 'Threat actor has your blueprints. Physical security implications?',
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
      revealAtMinute: 34,
      title: 'Site Security: Unusual Contractor Activity',
      content:
        'Guard reports: Two individuals in Nexus-branded uniforms arrived claiming emergency ' +
        'maintenance call. Nexus dispatch has no record of the call. Individuals departed ' +
        'when asked to wait for verification. Vehicle plate captured.',
      source: 'Site Security Officer',
      decisionPressure: 'Physical reconnaissance using vendor cover? Law enforcement notification?',
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
      revealAtMinute: 40,
      title: 'OSINT: Leaked Documents on Paste Site',
      content:
        "Threat intel detects your organization's data center floor plans posted to paste site. " +
        'Metadata shows Nexus origin. Includes rack locations, camera positions, and mantrap ' +
        'specifications. Post is 2 hours old with 340 views.',
      source: 'Threat Intelligence Platform',
      decisionPressure: 'Physical security posture compromised. What compensating controls?',
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
      revealAtMinute: 48,
      title: 'FBI Cyber: Request for Preserved Evidence',
      content:
        'FBI Cyber Division contacts: "We are investigating Industrial Spider across multiple ' +
        'victims. Request you preserve all logs and avoid system changes that might affect ' +
        'forensic evidence. Can we schedule evidence collection within 24 hours?"',
      source: 'FBI Cyber Division',
      decisionPressure:
        'Evidence preservation vs. operational recovery. Legal coordination needed.',
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
      revealAtMinute: 55,
      title: 'CEO Requests Status Briefing',
      content:
        'CEO scheduling emergency call in 10 minutes. Wants to understand: (1) Are our people ' +
        'safe? (2) Is our data safe? (3) When are systems back? (4) Who is accountable? ' +
        'Prepare concise BLUF for each question.',
      source: 'Executive Office',
      decisionPressure:
        'Frame cross-domain incident for executive audience. What is your recommendation?',
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
      revealAtMinute: 2,
      title: 'UEBA High-Risk Alert: Privileged User',
      content:
        'SecureView flags HIGH risk score for user JSmith (Sr. Network Engineer). Anomalies: ' +
        '(1) 3AM VPN access from new geolocation, (2) Large file downloads from restricted shares, ' +
        '(3) Badge access to data center outside normal pattern. Risk score: 94/100.',
      source: 'UEBA Platform',
      decisionPressure: 'Who needs to know? How do you investigate without alerting the subject?',
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
      revealAtMinute: 6,
      title: 'Physical Access Pattern Analysis',
      content:
        'GSOC analyst correlates badge data: JSmith accessed data center at 2:47 AM—unusual ' +
        'for role. Camera review shows subject photographing server rack labels with personal phone. ' +
        'Subject spent 34 minutes in DC vs. typical 5-10 minute visits.',
      source: 'GSOC Analyst',
      decisionPressure:
        'Physical evidence of reconnaissance. Escalate to HR/Legal? Preserve footage.',
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
      revealAtMinute: 11,
      title: 'DLP Alert: Sensitive Data Transfer',
      content:
        'DLP detects 2.3GB transfer to personal cloud storage from JSmith workstation. ' +
        'Content includes network diagrams, firewall configs, and customer contract data. ' +
        'Transfer completed before DLP could block (policy was monitor-only for this category).',
      source: 'DLP Platform',
      decisionPressure: 'Data exfiltration confirmed. Block account now or continue monitoring?',
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
      revealAtMinute: 16,
      title: 'HR Reports: Performance Concerns',
      content:
        'HR Business Partner (responding to discreet inquiry): JSmith on PIP for past 6 weeks. ' +
        'Manager reports attitude change after being passed over for promotion. Mentioned ' +
        '"having options" in recent 1:1. HR had no prior security concerns flagged.',
      source: 'HR Business Partner',
      decisionPressure: 'Motivation context. Does this change your assessment? Legal involvement?',
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
      revealAtMinute: 22,
      title: 'OSINT: Competitor Job Posting Match',
      content:
        'Threat intel identifies JSmith LinkedIn profile updated 3 weeks ago. Profile viewed by ' +
        'multiple accounts linked to direct competitor. JSmith accepted connection from recruiter ' +
        "at competitor's strategic initiatives group.",
      source: 'Threat Intelligence',
      decisionPressure: 'Possible competitor coordination. Trade secret theft concern?',
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
      revealAtMinute: 28,
      title: 'Subject Badged into Building',
      content:
        'Real-time alert: JSmith just badged into main lobby. Subject heading toward ' +
        'IT operations area. Current time is within normal work hours. Manager is offsite today.',
      source: 'Access Control System',
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
      revealAtMinute: 34,
      title: 'Network: Attempted Access to Backup Systems',
      content:
        'SOC detects JSmith attempting to access backup infrastructure—not part of current role. ' +
        'Three failed authentication attempts followed by successful access using old credentials ' +
        'that should have been revoked. Backup systems contain full customer database copies.',
      source: 'SOC Analyst',
      decisionPressure:
        'Active threat. Disable access now? This may alert subject to investigation.',
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
      revealAtMinute: 40,
      title: 'Legal Counsel Guidance',
      content:
        'General Counsel (on emergency call): "Based on what you\'ve described, we need to ' +
        'preserve all evidence and consider law enforcement notification. However, confronting ' +
        'the employee without HR present creates liability. What is the immediate threat level?"',
      source: 'General Counsel',
      decisionPressure:
        'Balance legal requirements with immediate security needs. Frame your recommendation.',
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
      revealAtMinute: 48,
      title: 'Subject Attempting Data Center Access',
      content:
        'Real-time: JSmith at data center mantrap. Has valid badge for perimeter but should be ' +
        'denied inner door based on your earlier recommendation. Guard in mantrap area. ' +
        'Subject appears to be on phone call while waiting.',
      source: 'Data Center Security',
      decisionPressure: 'Moment of truth. Deny access and confront? Or allow and monitor?',
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
      revealAtMinute: 54,
      title: 'FBI Cyber: Ongoing Investigation Notice',
      content:
        'FBI agent contacts your threat intel team: "We have an active investigation into economic ' +
        'espionage targeting your industry sector. A name from your organization has appeared in ' +
        'our investigation. Can we schedule a meeting within 24 hours?"',
      source: 'FBI Cyber Division',
      decisionPressure:
        'FBI already investigating. Coordinate with law enforcement? What can you share?',
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
