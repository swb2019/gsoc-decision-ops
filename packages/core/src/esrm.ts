/**
 * ESRM (Enterprise Security Risk Management) Framework
 *
 * Operationalizes ASIS ESRM principles (Allen & Loyear's "Enterprise Security Risk Management:
 * Concepts and Applications" and Loyear's "ESRM in the Real World") as live gameplay mechanics.
 *
 * The ESRM Cycle practiced in-sim:
 * 1. Context — mission/stakeholders briefly framed per scenario
 * 2. Identify & prioritize assets — interactive asset inventory/ranking tied to mission
 * 3. Identify & prioritize risks — threat × vulnerability × impact style ranking
 * 4. Treat — accept/mitigate/transfer/avoid as first-class options
 * 5. Advisor → asset owner — briefing workflow; owner affirmation; residual risk explicit
 * 6. Incident response + post-incident review — AAR deepened; lessons feed continuous improvement
 *
 * Security/GSOC serves as trusted advisor to asset owners who own the risk.
 */

import type { DecisionPosture } from './types.js';

/**
 * Asset criticality levels based on business impact
 * Per ASIS ESRM: criticality determines prioritization of protection resources
 */
export type AssetCriticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Risk treatment options per ESRM framework (ASIS International)
 * All four treatments are first-class gameplay options:
 * - ACCEPT → CONTINUE (risk within tolerance; proceed with awareness)
 * - MITIGATE → DEGRADE (reduce exposure via compensating controls)
 * - TRANSFER → TRANSFER (shift risk to third party: insurance, vendor liability, contracts)
 * - AVOID → PAUSE (eliminate the risk source entirely)
 */
export type RiskTreatmentOption = 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID';

/**
 * Extended posture type that includes TRANSFER as distinct from DEGRADE
 * TRANSFER is a strategic choice to shift risk ownership, not just mitigate
 */
export type ExtendedPosture = DecisionPosture | 'TRANSFER';

/**
 * Likelihood levels for risk assessment (ASIS 5-level scale)
 */
export type RiskLikelihood = 'ALMOST_CERTAIN' | 'LIKELY' | 'POSSIBLE' | 'UNLIKELY' | 'RARE';

/**
 * Impact levels for risk assessment (ASIS 5-level scale)
 */
export type RiskImpact = 'CATASTROPHIC' | 'MAJOR' | 'MODERATE' | 'MINOR' | 'INSIGNIFICANT';

/**
 * Risk level derived from likelihood × impact matrix
 */
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Risk Matrix: Maps likelihood × impact to risk level
 * Based on ASIS ESRM 5×5 risk matrix
 */
export const RISK_MATRIX: Record<RiskLikelihood, Record<RiskImpact, RiskLevel>> = {
  ALMOST_CERTAIN: {
    CATASTROPHIC: 'CRITICAL',
    MAJOR: 'CRITICAL',
    MODERATE: 'HIGH',
    MINOR: 'HIGH',
    INSIGNIFICANT: 'MEDIUM',
  },
  LIKELY: {
    CATASTROPHIC: 'CRITICAL',
    MAJOR: 'HIGH',
    MODERATE: 'HIGH',
    MINOR: 'MEDIUM',
    INSIGNIFICANT: 'MEDIUM',
  },
  POSSIBLE: {
    CATASTROPHIC: 'HIGH',
    MAJOR: 'HIGH',
    MODERATE: 'MEDIUM',
    MINOR: 'MEDIUM',
    INSIGNIFICANT: 'LOW',
  },
  UNLIKELY: {
    CATASTROPHIC: 'HIGH',
    MAJOR: 'MEDIUM',
    MODERATE: 'MEDIUM',
    MINOR: 'LOW',
    INSIGNIFICANT: 'LOW',
  },
  RARE: {
    CATASTROPHIC: 'MEDIUM',
    MAJOR: 'MEDIUM',
    MODERATE: 'LOW',
    MINOR: 'LOW',
    INSIGNIFICANT: 'LOW',
  },
};

/**
 * Calculate risk level from likelihood and impact
 */
export function calculateRiskLevel(likelihood: RiskLikelihood, impact: RiskImpact): RiskLevel {
  return RISK_MATRIX[likelihood][impact];
}

/**
 * Numeric values for risk levels (for scoring and comparison)
 */
export const RISK_LEVEL_VALUES: Record<RiskLevel, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Maps ESRM risk treatment to operational posture
 * TRANSFER now maps to its own distinct posture for explicit tracking
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
 * ESRM Treatment descriptions for Field Guide and UI
 */
export const TREATMENT_DESCRIPTIONS: Record<
  RiskTreatmentOption,
  {
    name: string;
    shortDesc: string;
    longDesc: string;
    whenToUse: string[];
    examples: string[];
    residualRiskNote: string;
  }
> = {
  ACCEPT: {
    name: 'Accept Risk',
    shortDesc: 'Risk is within tolerance; proceed with awareness',
    longDesc:
      'The asset owner acknowledges the risk and chooses to proceed without additional controls. ' +
      'This is appropriate when the cost of treatment exceeds the potential impact, or when the ' +
      'risk aligns with organizational risk appetite.',
    whenToUse: [
      'Risk level is LOW and within tolerance threshold',
      'Cost of mitigation exceeds potential loss',
      'Business opportunity outweighs security concern',
      'Temporary acceptance with planned future treatment',
    ],
    examples: [
      'Accepting minor vendor delay during non-critical period',
      'Proceeding with travel after threat assessment shows low credibility',
      'Continuing operations with known low-severity vulnerability',
    ],
    residualRiskNote: 'Full inherent risk remains; document acceptance rationale',
  },
  MITIGATE: {
    name: 'Mitigate Risk',
    shortDesc: 'Reduce exposure via compensating controls',
    longDesc:
      'Implement controls to reduce likelihood and/or impact of the risk. This is the most common ' +
      'treatment when risk exceeds tolerance but elimination is not feasible or cost-effective.',
    whenToUse: [
      'Risk exceeds tolerance but cannot be eliminated',
      'Controls exist that meaningfully reduce exposure',
      'Balance needed between security and operations',
      'Layered defense strategy appropriate',
    ],
    examples: [
      'Adding manual escort procedures when badge system degraded',
      'Implementing enhanced monitoring during threat window',
      'Restricting access to need-to-know during investigation',
    ],
    residualRiskNote: 'Reduced but not eliminated; quantify remaining exposure',
  },
  TRANSFER: {
    name: 'Transfer Risk',
    shortDesc: 'Shift risk ownership to third party',
    longDesc:
      'Transfer the financial or operational impact of risk to another party through insurance, ' +
      'contracts, or outsourcing. Note: responsibility for managing the risk may transfer, but ' +
      'accountability to stakeholders often remains.',
    whenToUse: [
      'Insurance coverage exists for the risk type',
      'Vendor/contractor can better manage the risk',
      'Contractual liability shift is appropriate',
      'Specialized expertise needed beyond internal capability',
    ],
    examples: [
      'Activating cyber insurance for breach response costs',
      'Invoking vendor SLA penalties for service degradation',
      'Engaging third-party IR firm under retainer',
      'Shifting liability to contractor via indemnification clause',
    ],
    residualRiskNote:
      'Transferred party may fail to perform; counterparty risk remains',
  },
  AVOID: {
    name: 'Avoid Risk',
    shortDesc: 'Eliminate the risk source entirely',
    longDesc:
      'Remove the activity, asset, or condition that creates the risk. This is the most protective ' +
      'option but may have significant business impact. Use when risk exceeds acceptable thresholds ' +
      'and no adequate mitigation exists.',
    whenToUse: [
      'Risk level is CRITICAL and unacceptable',
      'Life safety is at stake',
      'No adequate mitigation controls exist',
      'Business can function without the risky activity',
    ],
    examples: [
      'Canceling executive travel to high-threat location',
      'Shutting down compromised system entirely',
      'Terminating relationship with compromised vendor',
      'Evacuating facility during active threat',
    ],
    residualRiskNote: 'Eliminated for this vector; verify no alternative paths',
  },
};

/**
 * Continuous improvement lesson learned from incident/exercise
 */
export interface LessonLearned {
  id: string;
  timestamp: string;
  category: 'PROCESS' | 'TECHNOLOGY' | 'PEOPLE' | 'GOVERNANCE';
  finding: string;
  recommendation: string;
  owner: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'IDENTIFIED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'VERIFIED';
  targetDate?: string;
}

/**
 * Continuous improvement tracking for ESRM cycle completion
 */
export interface ContinuousImprovementState {
  lessonsLearned: LessonLearned[];
  cycleCount: number;
  lastReviewDate: string;
  maturityLevel: 'INITIAL' | 'DEVELOPING' | 'DEFINED' | 'MANAGED' | 'OPTIMIZING';
}

/**
 * Asset at risk during an incident
 * Per ASIS ESRM: assets must be identified, valued, and prioritized
 */
export interface ProtectedAsset {
  id: string;
  name: string;
  description: string;
  criticality: AssetCriticality;
  businessFunction: string;
  owner: AssetOwner;
  currentExposure: string;
  priorityScore?: number;
  vulnerabilityLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  currentThreatLevel?: RiskLikelihood;
}

/**
 * Calculate asset priority score based on criticality, vulnerability, and threat
 * Higher score = higher priority for protection resources
 */
export function calculateAssetPriorityScore(asset: ProtectedAsset): number {
  const criticalityScore: Record<AssetCriticality, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const vulnerabilityScore: Record<string, number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const threatScore: Record<RiskLikelihood, number> = {
    ALMOST_CERTAIN: 5,
    LIKELY: 4,
    POSSIBLE: 3,
    UNLIKELY: 2,
    RARE: 1,
  };

  const base = criticalityScore[asset.criticality] * 25;
  const vuln = vulnerabilityScore[asset.vulnerabilityLevel || 'MEDIUM'] * 10;
  const threat = threatScore[asset.currentThreatLevel || 'POSSIBLE'] * 5;

  return base + vuln + threat;
}

/**
 * Asset owner who owns the risk per ESRM
 * Security/GSOC advises; asset owner decides
 * Per Allen & Loyear: "Asset owners bear the ultimate responsibility for risk decisions"
 */
export interface AssetOwner {
  name: string;
  title: string;
  organization: string;
  contactMethod: string;
  riskTolerance: 'LOW' | 'MODERATE' | 'HIGH';
  notified: boolean;
  briefedAt?: string;
  affirmationReceived?: boolean;
  affirmationTimestamp?: string;
  decisionAuthority?: 'DELEGATED' | 'RETAINED' | 'ESCALATED';
}

/**
 * Owner affirmation record for audit trail
 * Documents the advisor → owner handoff per ESRM workflow
 */
export interface OwnerAffirmation {
  assetId: string;
  ownerId: string;
  ownerName: string;
  briefingTimestamp: string;
  affirmationTimestamp?: string;
  treatmentRecommended: RiskTreatmentOption;
  treatmentAccepted?: RiskTreatmentOption;
  residualRiskAcknowledged: boolean;
  notes?: string;
  escalationRequired?: boolean;
  escalationReason?: string;
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
 * Captures the full ESRM cycle: asset → risk → treatment → owner → residual
 */
export interface ESRMDecisionContext {
  asset: ProtectedAsset;
  riskAssessment: RiskAssessment;
  recommendedTreatment: RiskTreatmentOption;
  selectedTreatment?: RiskTreatmentOption;
  residualRisk: string;
  residualRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assetOwnerBriefed: boolean;
  ownerAffirmation?: OwnerAffirmation;
  escalationRequired: boolean;
  escalationReason?: string;
  governanceNotes?: string;
  transferDetails?: {
    transferType: 'INSURANCE' | 'CONTRACT' | 'OUTSOURCE' | 'SLA';
    transferredTo: string;
    coverageDetails?: string;
    counterpartyRisk?: string;
  };
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
