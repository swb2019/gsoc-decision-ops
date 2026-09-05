/**
 * ESRM (Enterprise Security Risk Management) Framework
 *
 * Operationalizes ASIS ESRM principles as live gameplay mechanics.
 * Security/GSOC serves as trusted advisor to asset owners who own the risk.
 */

import type { DecisionPosture } from './types.js';

/**
 * Asset criticality levels based on business impact
 */
export type AssetCriticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Risk treatment options per ESRM framework
 * Maps to decision postures:
 * - ACCEPT → CONTINUE (risk within tolerance)
 * - MITIGATE → DEGRADE (reduce exposure via controls)
 * - TRANSFER → DEGRADE (shift risk to third party)  
 * - AVOID → PAUSE (eliminate the risk source)
 */
export type RiskTreatmentOption = 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID';

/**
 * Maps ESRM risk treatment to operational posture
 */
export function treatmentToPosture(treatment: RiskTreatmentOption): DecisionPosture {
  switch (treatment) {
    case 'ACCEPT':
      return 'CONTINUE';
    case 'MITIGATE':
      return 'DEGRADE';
    case 'TRANSFER':
      return 'DEGRADE';
    case 'AVOID':
      return 'PAUSE';
  }
}

/**
 * Maps operational posture to primary ESRM treatment
 */
export function postureToTreatment(posture: DecisionPosture): RiskTreatmentOption {
  switch (posture) {
    case 'CONTINUE':
      return 'ACCEPT';
    case 'DEGRADE':
      return 'MITIGATE';
    case 'PAUSE':
      return 'AVOID';
  }
}

/**
 * Asset at risk during an incident
 */
export interface ProtectedAsset {
  id: string;
  name: string;
  description: string;
  criticality: AssetCriticality;
  businessFunction: string;
  owner: AssetOwner;
  currentExposure: string;
}

/**
 * Asset owner who owns the risk per ESRM
 * Security/GSOC advises; asset owner decides
 */
export interface AssetOwner {
  name: string;
  title: string;
  organization: string;
  contactMethod: string;
  riskTolerance: 'LOW' | 'MODERATE' | 'HIGH';
  notified: boolean;
  briefedAt?: string;
}

/**
 * Risk assessment for a specific threat to an asset
 */
export interface RiskAssessment {
  threatDescription: string;
  likelihood: 'ALMOST_CERTAIN' | 'LIKELY' | 'POSSIBLE' | 'UNLIKELY' | 'RARE';
  impact: 'CATASTROPHIC' | 'MAJOR' | 'MODERATE' | 'MINOR' | 'INSIGNIFICANT';
  inherentRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  currentControls: string[];
  controlEffectiveness: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'UNKNOWN';
}

/**
 * ESRM decision context for a posture commit
 */
export interface ESRMDecisionContext {
  asset: ProtectedAsset;
  riskAssessment: RiskAssessment;
  recommendedTreatment: RiskTreatmentOption;
  residualRisk: string;
  residualRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assetOwnerBriefed: boolean;
  escalationRequired: boolean;
  escalationReason?: string;
  governanceNotes?: string;
}

/**
 * Risk communication record
 */
export interface RiskCommunication {
  id: string;
  timestamp: string;
  recipient: string;
  recipientRole: string;
  method: 'PHONE' | 'EMAIL' | 'BRIDGE' | 'IN_PERSON' | 'CHAT';
  summary: string;
  riskFraming: string;
  responseReceived?: string;
  decisionAuthority?: 'ACCEPTED' | 'REJECTED' | 'DEFERRED' | 'ESCALATED';
}

/**
 * Scenario ESRM configuration
 */
export interface ScenarioESRMConfig {
  primaryAssets: ProtectedAsset[];
  initialRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskToleranceThreshold: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  requiredCommunications: {
    role: string;
    timing: 'IMMEDIATE' | 'WITHIN_15MIN' | 'WITHIN_HOUR' | 'AS_NEEDED';
    purpose: string;
  }[];
  governanceGuidelines: string[];
}

/**
 * ESRM scoring criteria
 */
export interface ESRMScorecard {
  assetIdentification: number; // Did player identify affected assets?
  ownerEngagement: number; // Did player brief asset owners?
  riskArticulation: number; // Clear risk framing in decisions?
  treatmentAlignment: number; // Treatment matches posture logic?
  residualRiskClarity: number; // Residual risk explicitly stated?
  escalationDiscipline: number; // Proper escalation when needed?
  communicationQuality: number; // Quality of stakeholder comms?
  reassessmentCadence: number; // Updated assessment as intel changed?
  totalESRMScore: number; // Aggregate ESRM discipline score
}

/**
 * Calculate ESRM discipline score
 */
export function calculateESRMScore(
  decisions: { esrmContext?: ESRMDecisionContext }[],
  communications: RiskCommunication[],
  assetsIdentified: number,
  totalAssets: number
): ESRMScorecard {
  const decisionsWithContext = decisions.filter((d) => d.esrmContext);
  const totalDecisions = decisions.length || 1;

  const assetIdentification =
    totalAssets > 0 ? Math.round((assetsIdentified / totalAssets) * 100) : 0;

  const ownersBriefed = decisionsWithContext.filter((d) => d.esrmContext?.assetOwnerBriefed).length;
  const ownerEngagement = Math.round((ownersBriefed / totalDecisions) * 100);

  const withResidualRisk = decisionsWithContext.filter((d) => d.esrmContext?.residualRisk).length;
  const residualRiskClarity = Math.round((withResidualRisk / totalDecisions) * 100);

  const escalationsNeeded = decisionsWithContext.filter(
    (d) => d.esrmContext?.escalationRequired
  ).length;
  const escalationsHandled = decisionsWithContext.filter(
    (d) => d.esrmContext?.escalationRequired && d.esrmContext?.assetOwnerBriefed
  ).length;
  const escalationDiscipline =
    escalationsNeeded > 0 ? Math.round((escalationsHandled / escalationsNeeded) * 100) : 100;

  const communicationQuality = Math.min(100, communications.length * 20);

  const riskArticulation = decisionsWithContext.length > 0 ? 80 : 40;
  const treatmentAlignment = decisionsWithContext.length > 0 ? 85 : 50;
  const reassessmentCadence = decisions.length > 3 ? 90 : 60;

  const totalESRMScore = Math.round(
    (assetIdentification +
      ownerEngagement +
      riskArticulation +
      treatmentAlignment +
      residualRiskClarity +
      escalationDiscipline +
      communicationQuality +
      reassessmentCadence) /
      8
  );

  return {
    assetIdentification,
    ownerEngagement,
    riskArticulation,
    treatmentAlignment,
    residualRiskClarity,
    escalationDiscipline,
    communicationQuality,
    reassessmentCadence,
    totalESRMScore,
  };
}

/**
 * Default ESRM assets for executive threat scenario
 */
export const EXECUTIVE_THREAT_ASSETS: ProtectedAsset[] = [
  {
    id: 'asset-ceo',
    name: 'CEO & Executive Leadership',
    description: 'Physical safety and security of C-suite executives',
    criticality: 'CRITICAL',
    businessFunction: 'Executive Leadership',
    owner: {
      name: 'Chief of Staff',
      title: 'Chief of Staff to CEO',
      organization: 'Executive Office',
      contactMethod: 'Direct line / Signal',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Overseas travel with potential surveillance indicators',
  },
  {
    id: 'asset-badge-system',
    name: 'Physical Access Control System',
    description: 'Badge readers, credential management, executive floor access',
    criticality: 'HIGH',
    businessFunction: 'Facility Security',
    owner: {
      name: 'VP of Facilities',
      title: 'Vice President, Global Facilities',
      organization: 'Corporate Services',
      contactMethod: 'Teams / Mobile',
      riskTolerance: 'MODERATE',
      notified: false,
    },
    currentExposure: 'Vendor API anomalies during active threat window',
  },
  {
    id: 'asset-travel-data',
    name: 'Executive Travel Intelligence',
    description: 'Travel itineraries, protective intel, advance team data',
    criticality: 'CRITICAL',
    businessFunction: 'Executive Protection',
    owner: {
      name: 'Director of Executive Protection',
      title: 'Director, Global Executive Protection',
      organization: 'Corporate Security',
      contactMethod: 'Secure comms / In-person',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Potential compromise via EA workstation beacon',
  },
];

/**
 * Default ESRM assets for supply chain scenario  
 */
export const SUPPLY_CHAIN_ASSETS: ProtectedAsset[] = [
  {
    id: 'asset-datacenter',
    name: 'Primary Data Center',
    description: 'Critical compute infrastructure, customer data, business applications',
    criticality: 'CRITICAL',
    businessFunction: 'IT Infrastructure',
    owner: {
      name: 'VP of Infrastructure',
      title: 'Vice President, IT Infrastructure',
      organization: 'Information Technology',
      contactMethod: 'Bridge / Mobile',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Environmental controls compromised, thermal risk',
  },
  {
    id: 'asset-fire-safety',
    name: 'Life Safety Systems',
    description: 'Fire detection, suppression, evacuation systems',
    criticality: 'CRITICAL',
    businessFunction: 'Life Safety',
    owner: {
      name: 'Director of EHS',
      title: 'Director, Environment Health & Safety',
      organization: 'Corporate Services',
      contactMethod: 'Emergency line / Mobile',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Communication fault with central monitoring',
  },
  {
    id: 'asset-physical-security',
    name: 'Physical Security Infrastructure',
    description: 'Access control, CCTV, intrusion detection across all sites',
    criticality: 'HIGH',
    businessFunction: 'Physical Security',
    owner: {
      name: 'CSO',
      title: 'Chief Security Officer',
      organization: 'Corporate Security',
      contactMethod: 'Direct line / Signal',
      riskTolerance: 'MODERATE',
      notified: false,
    },
    currentExposure: 'Floor plans and topology exposed to threat actor',
  },
];

/**
 * Default ESRM assets for insider threat scenario
 */
export const INSIDER_THREAT_ASSETS: ProtectedAsset[] = [
  {
    id: 'asset-customer-data',
    name: 'Customer Database & Contracts',
    description: 'Customer PII, contract terms, relationship data',
    criticality: 'CRITICAL',
    businessFunction: 'Revenue Operations',
    owner: {
      name: 'Chief Revenue Officer',
      title: 'Chief Revenue Officer',
      organization: 'Revenue',
      contactMethod: 'EA / Direct',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Large data transfer to personal cloud detected',
  },
  {
    id: 'asset-network-infra',
    name: 'Network Infrastructure Configs',
    description: 'Firewall rules, network diagrams, security architecture',
    criticality: 'HIGH',
    businessFunction: 'IT Security',
    owner: {
      name: 'CISO',
      title: 'Chief Information Security Officer',
      organization: 'Information Security',
      contactMethod: 'Secure channel / Bridge',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Configs exfiltrated, potential for future attack',
  },
  {
    id: 'asset-trade-secrets',
    name: 'Proprietary Business Intelligence',
    description: 'Strategic plans, competitive intel, product roadmaps',
    criticality: 'CRITICAL',
    businessFunction: 'Strategy',
    owner: {
      name: 'Chief Strategy Officer',
      title: 'Chief Strategy Officer',
      organization: 'Strategy',
      contactMethod: 'EA / In-person',
      riskTolerance: 'LOW',
      notified: false,
    },
    currentExposure: 'Competitor recruitment correlation suggests espionage',
  },
];
