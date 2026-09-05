/**
 * Tactical Security Actions
 *
 * Deployable tactical options with effectiveness feedback against residual risk.
 * Each action has costs, benefits, and potential unintended consequences.
 */

/**
 * Categories of tactical actions
 */
export type TacticalCategory =
  'ACCESS_CONTROL' | 'SURVEILLANCE' | 'PERSONNEL' | 'CYBER' | 'COMMUNICATIONS' | 'PROTECTIVE';

/**
 * Deployment status for a tactical action
 */
export type DeploymentStatus = 'AVAILABLE' | 'DEPLOYING' | 'ACTIVE' | 'COOLDOWN' | 'EXHAUSTED';

/**
 * Effectiveness rating for deployed actions
 */
export type EffectivenessRating = 'HIGH' | 'MEDIUM' | 'LOW' | 'NEGLIGIBLE' | 'COUNTERPRODUCTIVE';

/**
 * Definition of a tactical action that can be deployed
 */
export interface TacticalAction {
  id: string;
  name: string;
  shortName: string;
  category: TacticalCategory;
  description: string;
  deployTime: number;
  duration: number;
  cooldown: number;
  resourceCost: {
    guards?: number;
    analysts?: number;
    responders?: number;
  };
  businessImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskReduction: number;
  baseEffectiveness: number;
  prerequisites?: string[];
  incompatibleWith?: string[];
  unintendedConsequences?: {
    probability: number;
    description: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  }[];
}

/**
 * State of a deployed tactical action
 */
export interface DeployedAction {
  actionId: string;
  deployedAt: string;
  expiresAt?: string;
  status: DeploymentStatus;
  effectiveness: EffectivenessRating;
  riskReductionApplied: number;
  triggeredConsequence?: string;
}

/**
 * Feedback from deploying a tactical action
 */
export interface DeploymentFeedback {
  success: boolean;
  message: string;
  effectiveness: EffectivenessRating;
  riskReduction: number;
  businessImpactIncurred: string;
  unintendedEffect?: string;
  pointsAwarded: number;
  pointsPenalty: number;
}

/**
 * Complete tactical state for the command center
 */
export interface TacticalState {
  availableActions: TacticalAction[];
  deployedActions: DeployedAction[];
  currentRiskLevel: number;
  residualRisk: number;
  tacticalScore: number;
  deploymentHistory: {
    actionId: string;
    timestamp: string;
    outcome: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'BACKFIRED';
  }[];
}

/**
 * Standard tactical actions available for deployment
 */
export const TACTICAL_ACTIONS: TacticalAction[] = [
  {
    id: 'lockdown-l1',
    name: 'Access Lockdown Level 1',
    shortName: 'L1 Lockdown',
    category: 'ACCESS_CONTROL',
    description: 'Disable all non-essential badge access. Essential personnel retain access.',
    deployTime: 2,
    duration: 30,
    cooldown: 5,
    resourceCost: { analysts: 1 },
    businessImpact: 'LOW',
    riskReduction: 15,
    baseEffectiveness: 0.7,
    unintendedConsequences: [
      {
        probability: 0.15,
        description: 'Authorized vendor locked out during critical maintenance',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'lockdown-l2',
    name: 'Access Lockdown Level 2',
    shortName: 'L2 Lockdown',
    category: 'ACCESS_CONTROL',
    description: 'Disable ALL badge access. Manual verification required at every entry point.',
    deployTime: 3,
    duration: 20,
    cooldown: 10,
    resourceCost: { guards: 2, analysts: 1 },
    businessImpact: 'HIGH',
    riskReduction: 35,
    baseEffectiveness: 0.9,
    prerequisites: ['lockdown-l1'],
    unintendedConsequences: [
      {
        probability: 0.25,
        description: 'Executive delayed accessing building, escalation to C-suite',
        impact: 'NEGATIVE',
      },
      {
        probability: 0.1,
        description: 'Emergency responders impeded',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'camera-callup',
    name: 'Camera Call-Up',
    shortName: 'Cam Focus',
    category: 'SURVEILLANCE',
    description: 'Direct operator attention to specific camera views. Enhanced monitoring.',
    deployTime: 1,
    duration: 15,
    cooldown: 2,
    resourceCost: { analysts: 1 },
    businessImpact: 'NONE',
    riskReduction: 10,
    baseEffectiveness: 0.6,
  },
  {
    id: 'ptz-focus',
    name: 'PTZ Priority Focus',
    shortName: 'PTZ Lock',
    category: 'SURVEILLANCE',
    description: 'Lock PTZ cameras to specific areas. Sacrifice coverage elsewhere.',
    deployTime: 1,
    duration: 20,
    cooldown: 3,
    resourceCost: { analysts: 1 },
    businessImpact: 'NONE',
    riskReduction: 12,
    baseEffectiveness: 0.65,
    unintendedConsequences: [
      {
        probability: 0.2,
        description: 'Activity in unwatched area goes undetected',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'guard-dispatch',
    name: 'Guard Dispatch',
    shortName: 'Dispatch',
    category: 'PERSONNEL',
    description: 'Deploy available guards to investigate or secure a location.',
    deployTime: 3,
    duration: 25,
    cooldown: 5,
    resourceCost: { guards: 1 },
    businessImpact: 'NONE',
    riskReduction: 20,
    baseEffectiveness: 0.75,
  },
  {
    id: 'guard-posture-up',
    name: 'Elevated Guard Posture',
    shortName: 'High Alert',
    category: 'PERSONNEL',
    description: 'All guards on heightened alert. Increased vigilance, faster response.',
    deployTime: 2,
    duration: 30,
    cooldown: 10,
    resourceCost: {},
    businessImpact: 'LOW',
    riskReduction: 18,
    baseEffectiveness: 0.7,
    unintendedConsequences: [
      {
        probability: 0.1,
        description: 'Guard fatigue leads to reduced effectiveness later',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'badge-revoke',
    name: 'Badge Revocation',
    shortName: 'Revoke Badge',
    category: 'ACCESS_CONTROL',
    description: 'Immediately disable specific badge credentials.',
    deployTime: 1,
    duration: 0,
    cooldown: 0,
    resourceCost: { analysts: 1 },
    businessImpact: 'LOW',
    riskReduction: 25,
    baseEffectiveness: 0.85,
  },
  {
    id: 'visitor-hold',
    name: 'Visitor Hold',
    shortName: 'Hold Visitors',
    category: 'ACCESS_CONTROL',
    description: 'Pause all visitor check-ins. Visitors in progress escorted to holding area.',
    deployTime: 2,
    duration: 30,
    cooldown: 5,
    resourceCost: { guards: 1 },
    businessImpact: 'MEDIUM',
    riskReduction: 15,
    baseEffectiveness: 0.7,
    unintendedConsequences: [
      {
        probability: 0.2,
        description: 'VIP visitor delayed, relationship impact',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'cyber-isolate',
    name: 'Network Isolation',
    shortName: 'Net Isolate',
    category: 'CYBER',
    description: 'Isolate affected network segments. Contain potential spread.',
    deployTime: 5,
    duration: 60,
    cooldown: 15,
    resourceCost: { analysts: 2 },
    businessImpact: 'HIGH',
    riskReduction: 40,
    baseEffectiveness: 0.85,
    unintendedConsequences: [
      {
        probability: 0.3,
        description: 'Critical business system offline unexpectedly',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'mfa-stepup',
    name: 'MFA Step-Up',
    shortName: 'Force MFA',
    category: 'CYBER',
    description: 'Require additional authentication factor for all high-privilege access.',
    deployTime: 3,
    duration: 45,
    cooldown: 10,
    resourceCost: { analysts: 1 },
    businessImpact: 'MEDIUM',
    riskReduction: 30,
    baseEffectiveness: 0.8,
  },
  {
    id: 'travel-advisory',
    name: 'Travel Advisory',
    shortName: 'Travel Alert',
    category: 'COMMUNICATIONS',
    description: 'Issue advisory to travelers. Recommend postponement or enhanced precautions.',
    deployTime: 5,
    duration: 0,
    cooldown: 0,
    resourceCost: {},
    businessImpact: 'LOW',
    riskReduction: 10,
    baseEffectiveness: 0.5,
  },
  {
    id: 'shelter-in-place',
    name: 'Shelter-in-Place',
    shortName: 'Shelter',
    category: 'PROTECTIVE',
    description: 'Direct all personnel to shelter. Lock exterior doors. Wait for all-clear.',
    deployTime: 2,
    duration: 30,
    cooldown: 15,
    resourceCost: { guards: 2 },
    businessImpact: 'CRITICAL',
    riskReduction: 50,
    baseEffectiveness: 0.9,
    unintendedConsequences: [
      {
        probability: 0.15,
        description: 'Panic among employees, HR escalation',
        impact: 'NEGATIVE',
      },
      {
        probability: 0.1,
        description: 'False alarm damages credibility',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'soc-enrichment',
    name: 'SOC Enrichment Request',
    shortName: 'SOC Intel',
    category: 'CYBER',
    description:
      'Request threat intelligence enrichment from SOC. Takes time but provides context.',
    deployTime: 10,
    duration: 0,
    cooldown: 5,
    resourceCost: {},
    businessImpact: 'NONE',
    riskReduction: 8,
    baseEffectiveness: 0.6,
    unintendedConsequences: [
      {
        probability: 0.05,
        description: 'SOC provides critical insight that changes assessment',
        impact: 'POSITIVE',
      },
    ],
  },
  {
    id: 'stakeholder-notify-t1',
    name: 'Stakeholder Notify (Tier 1)',
    shortName: 'Notify T1',
    category: 'COMMUNICATIONS',
    description: 'Notify immediate stakeholders: CISO, affected asset owners.',
    deployTime: 2,
    duration: 0,
    cooldown: 0,
    resourceCost: {},
    businessImpact: 'NONE',
    riskReduction: 5,
    baseEffectiveness: 0.7,
  },
  {
    id: 'stakeholder-notify-t2',
    name: 'Stakeholder Notify (Tier 2)',
    shortName: 'Notify T2',
    category: 'COMMUNICATIONS',
    description: 'Notify executive leadership: CEO, General Counsel, Board liaison.',
    deployTime: 5,
    duration: 0,
    cooldown: 0,
    resourceCost: {},
    businessImpact: 'LOW',
    riskReduction: 8,
    baseEffectiveness: 0.6,
    prerequisites: ['stakeholder-notify-t1'],
    unintendedConsequences: [
      {
        probability: 0.15,
        description: 'Executive micromanagement begins',
        impact: 'NEGATIVE',
      },
    ],
  },
  {
    id: 'stakeholder-notify-t3',
    name: 'Stakeholder Notify (Tier 3)',
    shortName: 'Notify T3',
    category: 'COMMUNICATIONS',
    description: 'External notification: regulators, law enforcement, PR standby.',
    deployTime: 10,
    duration: 0,
    cooldown: 0,
    resourceCost: {},
    businessImpact: 'MEDIUM',
    riskReduction: 10,
    baseEffectiveness: 0.5,
    prerequisites: ['stakeholder-notify-t2'],
    unintendedConsequences: [
      {
        probability: 0.25,
        description: 'Regulatory inquiry triggered',
        impact: 'NEGATIVE',
      },
      {
        probability: 0.1,
        description: 'Law enforcement provides useful intelligence',
        impact: 'POSITIVE',
      },
    ],
  },
];

/**
 * Category display configuration
 */
export const TACTICAL_CATEGORY_CONFIG: Record<
  TacticalCategory,
  { label: string; color: string; bgColor: string }
> = {
  ACCESS_CONTROL: { label: 'Access', color: 'text-cyan-400', bgColor: 'bg-cyan-500/15' },
  SURVEILLANCE: { label: 'Surveillance', color: 'text-violet-400', bgColor: 'bg-violet-500/15' },
  PERSONNEL: { label: 'Personnel', color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  CYBER: { label: 'Cyber', color: 'text-orange-400', bgColor: 'bg-orange-500/15' },
  COMMUNICATIONS: { label: 'Comms', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
  PROTECTIVE: { label: 'Protective', color: 'text-red-400', bgColor: 'bg-red-500/15' },
};

/**
 * Create initial tactical state
 */
export function createInitialTacticalState(): TacticalState {
  return {
    availableActions: TACTICAL_ACTIONS,
    deployedActions: [],
    currentRiskLevel: 50,
    residualRisk: 50,
    tacticalScore: 0,
    deploymentHistory: [],
  };
}

/**
 * Calculate effectiveness based on context
 */
function calculateEffectiveness(
  action: TacticalAction,
  currentRisk: number,
  deployedActions: DeployedAction[]
): EffectivenessRating {
  let effectiveness = action.baseEffectiveness;

  // Reduce effectiveness if similar actions already deployed (diminishing returns)
  const similarDeployed = deployedActions.filter(
    (d) =>
      d.status === 'ACTIVE' &&
      TACTICAL_ACTIONS.find((a) => a.id === d.actionId)?.category === action.category
  );
  effectiveness -= similarDeployed.length * 0.1;

  // Higher risk situations may warrant stronger responses
  if (currentRisk > 70 && action.riskReduction > 20) {
    effectiveness += 0.1;
  }

  // Clamp and convert to rating
  effectiveness = Math.max(0, Math.min(1, effectiveness));

  if (effectiveness >= 0.8) return 'HIGH';
  if (effectiveness >= 0.6) return 'MEDIUM';
  if (effectiveness >= 0.4) return 'LOW';
  if (effectiveness >= 0.2) return 'NEGLIGIBLE';
  return 'COUNTERPRODUCTIVE';
}

/**
 * Check if unintended consequence triggers
 */
function checkUnintendedConsequence(action: TacticalAction): {
  triggered: boolean;
  consequence?: string;
  impact?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
} {
  if (!action.unintendedConsequences || action.unintendedConsequences.length === 0) {
    return { triggered: false };
  }

  for (const consequence of action.unintendedConsequences) {
    if (Math.random() < consequence.probability) {
      return {
        triggered: true,
        consequence: consequence.description,
        impact: consequence.impact,
      };
    }
  }

  return { triggered: false };
}

/**
 * Deploy a tactical action
 */
export function deployTacticalAction(
  state: TacticalState,
  actionId: string,
  resources: { guards: number; analysts: number; responders: number }
): { newState: TacticalState; feedback: DeploymentFeedback } {
  const action = TACTICAL_ACTIONS.find((a) => a.id === actionId);

  if (!action) {
    return {
      newState: state,
      feedback: {
        success: false,
        message: 'Unknown tactical action',
        effectiveness: 'NEGLIGIBLE',
        riskReduction: 0,
        businessImpactIncurred: 'NONE',
        pointsAwarded: 0,
        pointsPenalty: 0,
      },
    };
  }

  // Check prerequisites
  if (action.prerequisites) {
    for (const prereq of action.prerequisites) {
      const prereqDeployed = state.deployedActions.find(
        (d) => d.actionId === prereq && d.status === 'ACTIVE'
      );
      if (!prereqDeployed) {
        return {
          newState: state,
          feedback: {
            success: false,
            message: `Prerequisite not met: ${TACTICAL_ACTIONS.find((a) => a.id === prereq)?.name}`,
            effectiveness: 'NEGLIGIBLE',
            riskReduction: 0,
            businessImpactIncurred: 'NONE',
            pointsAwarded: 0,
            pointsPenalty: 0,
          },
        };
      }
    }
  }

  // Check resource availability
  if (
    (action.resourceCost.guards || 0) > resources.guards ||
    (action.resourceCost.analysts || 0) > resources.analysts ||
    (action.resourceCost.responders || 0) > resources.responders
  ) {
    return {
      newState: state,
      feedback: {
        success: false,
        message: 'Insufficient resources',
        effectiveness: 'NEGLIGIBLE',
        riskReduction: 0,
        businessImpactIncurred: 'NONE',
        pointsAwarded: 0,
        pointsPenalty: 0,
      },
    };
  }

  // Check incompatibility
  if (action.incompatibleWith) {
    for (const incompatible of action.incompatibleWith) {
      const conflicting = state.deployedActions.find(
        (d) => d.actionId === incompatible && d.status === 'ACTIVE'
      );
      if (conflicting) {
        return {
          newState: state,
          feedback: {
            success: false,
            message: `Incompatible with active action: ${TACTICAL_ACTIONS.find((a) => a.id === incompatible)?.name}`,
            effectiveness: 'NEGLIGIBLE',
            riskReduction: 0,
            businessImpactIncurred: 'NONE',
            pointsAwarded: 0,
            pointsPenalty: 0,
          },
        };
      }
    }
  }

  // Calculate effectiveness
  const effectiveness = calculateEffectiveness(
    action,
    state.currentRiskLevel,
    state.deployedActions
  );

  // Calculate actual risk reduction based on effectiveness
  const effectivenessMultiplier =
    effectiveness === 'HIGH'
      ? 1.0
      : effectiveness === 'MEDIUM'
        ? 0.7
        : effectiveness === 'LOW'
          ? 0.4
          : effectiveness === 'NEGLIGIBLE'
            ? 0.1
            : 0;
  const actualRiskReduction = Math.floor(action.riskReduction * effectivenessMultiplier);

  // Check for unintended consequences
  const consequence = checkUnintendedConsequence(action);

  // Calculate points
  let pointsAwarded = Math.floor(actualRiskReduction * 2);
  let pointsPenalty = 0;

  // Business impact affects points
  if (action.businessImpact === 'HIGH') pointsPenalty += 10;
  if (action.businessImpact === 'CRITICAL') pointsPenalty += 25;

  // Unintended consequences affect points
  if (consequence.triggered) {
    if (consequence.impact === 'NEGATIVE') pointsPenalty += 15;
    if (consequence.impact === 'POSITIVE') pointsAwarded += 20;
  }

  // Create deployed action
  const now = new Date().toISOString();
  const deployedAction: DeployedAction = {
    actionId,
    deployedAt: now,
    expiresAt:
      action.duration > 0
        ? new Date(Date.now() + action.duration * 60000).toISOString()
        : undefined,
    status: 'ACTIVE',
    effectiveness,
    riskReductionApplied: actualRiskReduction,
    triggeredConsequence: consequence.triggered ? consequence.consequence : undefined,
  };

  // Update state
  const newState: TacticalState = {
    ...state,
    deployedActions: [...state.deployedActions, deployedAction],
    residualRisk: Math.max(0, state.residualRisk - actualRiskReduction),
    tacticalScore: state.tacticalScore + pointsAwarded - pointsPenalty,
    deploymentHistory: [
      ...state.deploymentHistory,
      {
        actionId,
        timestamp: now,
        outcome:
          effectiveness === 'HIGH' || effectiveness === 'MEDIUM'
            ? 'SUCCESS'
            : effectiveness === 'LOW'
              ? 'PARTIAL'
              : consequence.triggered && consequence.impact === 'NEGATIVE'
                ? 'BACKFIRED'
                : 'FAILED',
      },
    ],
  };

  // Build feedback message
  let message = `${action.name} deployed. `;
  message += `Effectiveness: ${effectiveness}. `;
  message += `Risk reduced by ${actualRiskReduction}%.`;

  if (consequence.triggered) {
    message += ` Unintended effect: ${consequence.consequence}`;
  }

  const businessImpactMessages: Record<string, string> = {
    NONE: 'No business impact',
    LOW: 'Minor operational friction',
    MEDIUM: 'Moderate business disruption',
    HIGH: 'Significant business impact',
    CRITICAL: 'Major business disruption',
  };

  return {
    newState,
    feedback: {
      success: true,
      message,
      effectiveness,
      riskReduction: actualRiskReduction,
      businessImpactIncurred: businessImpactMessages[action.businessImpact],
      unintendedEffect: consequence.triggered ? consequence.consequence : undefined,
      pointsAwarded,
      pointsPenalty,
    },
  };
}

/**
 * Get available actions given current state
 */
export function getAvailableActions(state: TacticalState): TacticalAction[] {
  return TACTICAL_ACTIONS.filter((action) => {
    // Check if already deployed and still active
    const deployed = state.deployedActions.find(
      (d) => d.actionId === action.id && (d.status === 'ACTIVE' || d.status === 'DEPLOYING')
    );
    if (deployed) return false;

    // Check prerequisites
    if (action.prerequisites) {
      for (const prereq of action.prerequisites) {
        const prereqDeployed = state.deployedActions.find(
          (d) => d.actionId === prereq && d.status === 'ACTIVE'
        );
        if (!prereqDeployed) return false;
      }
    }

    return true;
  });
}
