/**
 * Team Management Module
 *
 * Operationalizes GSOC/CMIC operator team management for leadership training.
 * Covers follow-the-sun roster, regional leads, coaching, performance,
 * coverage gaps, handoffs, shift quality, and load balancing.
 *
 * This is role-strength/leadership training for practicing Global CMIC/GSOC
 * leadership competencies.
 */

/**
 * Global regions for follow-the-sun coverage model
 * Standard corporate security 24/7 coverage structure
 */
export type GlobalRegion = 'AMERICAS' | 'EMEA' | 'APAC';

/**
 * Region metadata for follow-the-sun operations
 */
export interface RegionConfig {
  id: GlobalRegion;
  name: string;
  shortName: string;
  timezone: string;
  primaryHours: { start: number; end: number };
  languages: string[];
  coverageLevel: 'FULL' | 'PARTIAL' | 'MINIMAL';
}

export const REGION_CONFIGS: Record<GlobalRegion, RegionConfig> = {
  AMERICAS: {
    id: 'AMERICAS',
    name: 'Americas Region',
    shortName: 'AMER',
    timezone: 'America/New_York',
    primaryHours: { start: 8, end: 20 },
    languages: ['English', 'Spanish', 'Portuguese'],
    coverageLevel: 'FULL',
  },
  EMEA: {
    id: 'EMEA',
    name: 'Europe, Middle East & Africa',
    shortName: 'EMEA',
    timezone: 'Europe/London',
    primaryHours: { start: 7, end: 19 },
    languages: ['English', 'French', 'German', 'Arabic'],
    coverageLevel: 'FULL',
  },
  APAC: {
    id: 'APAC',
    name: 'Asia-Pacific Region',
    shortName: 'APAC',
    timezone: 'Asia/Singapore',
    primaryHours: { start: 8, end: 20 },
    languages: ['English', 'Mandarin', 'Japanese', 'Hindi'],
    coverageLevel: 'FULL',
  },
};

/**
 * Operator skill categories for GSOC operations
 */
export type OperatorSkill =
  | 'TRIAGE'
  | 'INTEL_ANALYSIS'
  | 'INCIDENT_MANAGEMENT'
  | 'EXECUTIVE_PROTECTION'
  | 'TRAVEL_SECURITY'
  | 'PHYSICAL_RESPONSE'
  | 'CYBER_COORDINATION'
  | 'STAKEHOLDER_COMMS'
  | 'CRISIS_MANAGEMENT'
  | 'VENDOR_LIAISON';

/**
 * Performance level for coaching mechanics
 */
export type PerformanceLevel = 'EXCEEDS' | 'MEETS' | 'DEVELOPING' | 'NEEDS_IMPROVEMENT';

/**
 * Operator certification status
 */
export type CertificationStatus = 'CERTIFIED' | 'IN_TRAINING' | 'EXPIRED' | 'PENDING';

/**
 * An individual GSOC operator
 */
export interface Operator {
  id: string;
  name: string;
  role: 'ANALYST' | 'SENIOR_ANALYST' | 'TEAM_LEAD' | 'REGIONAL_LEAD' | 'WATCH_COMMANDER';
  region: GlobalRegion;
  skills: {
    skill: OperatorSkill;
    level: 1 | 2 | 3 | 4 | 5;
    certification: CertificationStatus;
  }[];
  performance: {
    overall: PerformanceLevel;
    recentTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    lastReview: string;
    coachingNotes?: string;
  };
  availability: {
    currentShift: boolean;
    onCall: boolean;
    ptoUntil?: string;
    maxHoursRemaining: number;
  };
  workload: {
    activeIncidents: number;
    tasksQueued: number;
    utilizationPercent: number;
  };
}

/**
 * Regional Lead - manages operators in a region
 */
export interface RegionalLead {
  id: string;
  operatorId: string;
  name: string;
  region: GlobalRegion;
  yearsExperience: number;
  directReports: string[];
  delegationAuthority: 'FULL' | 'LIMITED' | 'ESCALATION_ONLY';
  currentFocus: string;
  recentDecisions: LeadershipDecision[];
}

/**
 * A leadership decision made during the simulation
 */
export interface LeadershipDecision {
  id: string;
  timestamp: string;
  type: LeadershipDecisionType;
  description: string;
  impactedOperators: string[];
  rationale: string;
  outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export type LeadershipDecisionType =
  | 'COACHING'
  | 'TASK_ASSIGNMENT'
  | 'WORKLOAD_REBALANCE'
  | 'ESCALATION'
  | 'COVERAGE_ADJUSTMENT'
  | 'SHIFT_CHANGE'
  | 'PERFORMANCE_INTERVENTION'
  | 'TRAINING_ASSIGNMENT'
  | 'RECOGNITION'
  | 'DELEGATION';

/**
 * Shift handoff record
 */
export interface ShiftHandoff {
  id: string;
  timestamp: string;
  fromRegion: GlobalRegion;
  toRegion: GlobalRegion;
  outgoingLead: string;
  incomingLead: string;
  openIncidents: number;
  activeEscalations: number;
  pendingDecisions: string[];
  criticalWatchItems: string[];
  handoffQuality: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR';
  briefingComplete: boolean;
  followUpsRequired: string[];
}

/**
 * Coverage gap detected in roster
 */
export interface CoverageGap {
  id: string;
  timestamp: string;
  region: GlobalRegion;
  skill: OperatorSkill;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: 'PTO' | 'SICK' | 'TRAINING' | 'TURNOVER' | 'SURGE_DEMAND' | 'INCIDENT';
  duration: { start: string; end?: string };
  mitigationOptions: CoverageMitigation[];
  selectedMitigation?: string;
  resolvedAt?: string;
}

/**
 * Option for mitigating a coverage gap
 */
export interface CoverageMitigation {
  id: string;
  type: 'OVERTIME' | 'CROSS_TRAIN' | 'CONTRACT' | 'MUTUAL_AID' | 'DEFER' | 'AUTOMATE';
  description: string;
  cost: 'HIGH' | 'MEDIUM' | 'LOW';
  riskReduction: 'HIGH' | 'MEDIUM' | 'LOW';
  implementationTime: string;
}

/**
 * Shift quality metrics
 */
export interface ShiftQuality {
  region: GlobalRegion;
  shiftPeriod: { start: string; end: string };
  metrics: {
    responseTimeAvg: number;
    incidentsHandled: number;
    escalationsRequired: number;
    sopCompliance: number;
    handoffQuality: number;
    stakeholderSatisfaction: number;
  };
  standardsDrift: {
    area: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    observation: string;
    correctionRequired: boolean;
  }[];
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * Load balancing state across regions
 */
export interface LoadBalanceState {
  timestamp: string;
  globalLoad: number;
  regionLoads: Record<GlobalRegion, number>;
  hotspots: {
    region: GlobalRegion;
    loadPercent: number;
    queueDepth: number;
    avgWaitTime: number;
  }[];
  recommendedActions: LoadBalanceAction[];
}

/**
 * Load balancing action recommendation
 */
export interface LoadBalanceAction {
  id: string;
  type: 'REDISTRIBUTE' | 'SURGE_SUPPORT' | 'DEFER_NON_CRITICAL' | 'ESCALATE_PRIORITY';
  fromRegion?: GlobalRegion;
  toRegion?: GlobalRegion;
  description: string;
  expectedImpact: string;
  urgency: 'IMMEDIATE' | 'WITHIN_HOUR' | 'NEXT_SHIFT';
}

/**
 * Team roster state for a simulation
 */
export interface TeamRosterState {
  timestamp: string;
  activeShift: GlobalRegion;
  regionalLeads: Record<GlobalRegion, RegionalLead>;
  operators: Operator[];
  handoffs: ShiftHandoff[];
  coverageGaps: CoverageGap[];
  loadBalance: LoadBalanceState;
  teamHealth: {
    overallMorale: 'HIGH' | 'MODERATE' | 'LOW';
    burnoutRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    trainingDebt: number;
    vacancyCount: number;
  };
}

/**
 * Coaching moment during simulation
 */
export interface CoachingMoment {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  type:
    'POSITIVE_FEEDBACK' | 'CORRECTIVE' | 'DEVELOPMENTAL' | 'RECOGNITION' | 'DIFFICULT_CONVERSATION';
  context: string;
  observation: string;
  suggestedApproach: string;
  playerResponse?: string;
  outcome?: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE';
}

/**
 * Calculate team utilization across regions
 */
export function calculateTeamUtilization(roster: TeamRosterState): Record<GlobalRegion, number> {
  const result: Record<GlobalRegion, number> = {
    AMERICAS: 0,
    EMEA: 0,
    APAC: 0,
  };

  for (const region of Object.keys(result) as GlobalRegion[]) {
    const regionOps = roster.operators.filter(
      (o) => o.region === region && o.availability.currentShift
    );
    if (regionOps.length === 0) {
      result[region] = 0;
      continue;
    }
    const totalUtil = regionOps.reduce((sum, op) => sum + op.workload.utilizationPercent, 0);
    result[region] = Math.round(totalUtil / regionOps.length);
  }

  return result;
}

/**
 * Identify coverage gaps from roster state
 */
export function identifyCoverageGaps(roster: TeamRosterState): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  const requiredSkills: OperatorSkill[] = [
    'TRIAGE',
    'INTEL_ANALYSIS',
    'INCIDENT_MANAGEMENT',
    'STAKEHOLDER_COMMS',
  ];

  for (const region of Object.keys(REGION_CONFIGS) as GlobalRegion[]) {
    const regionOps = roster.operators.filter(
      (o) => o.region === region && o.availability.currentShift
    );

    for (const skill of requiredSkills) {
      const certifiedCount = regionOps.filter((op) =>
        op.skills.some((s) => s.skill === skill && s.certification === 'CERTIFIED' && s.level >= 3)
      ).length;

      if (certifiedCount === 0) {
        gaps.push({
          id: `gap-${region}-${skill}`,
          timestamp: new Date().toISOString(),
          region,
          skill,
          severity: skill === 'TRIAGE' || skill === 'INCIDENT_MANAGEMENT' ? 'CRITICAL' : 'HIGH',
          reason: 'TURNOVER',
          duration: { start: new Date().toISOString() },
          mitigationOptions: [
            {
              id: `mit-overtime-${region}`,
              type: 'OVERTIME',
              description: `Request overtime from off-shift ${skill} specialist`,
              cost: 'MEDIUM',
              riskReduction: 'HIGH',
              implementationTime: '30 minutes',
            },
            {
              id: `mit-cross-${region}`,
              type: 'CROSS_TRAIN',
              description: `Cross-utilize from adjacent region`,
              cost: 'LOW',
              riskReduction: 'MEDIUM',
              implementationTime: '15 minutes',
            },
          ],
        });
      }
    }
  }

  return gaps;
}

/**
 * Generate load balance recommendations
 */
export function generateLoadBalanceRecommendations(state: LoadBalanceState): LoadBalanceAction[] {
  const actions: LoadBalanceAction[] = [];

  for (const hotspot of state.hotspots) {
    if (hotspot.loadPercent > 85) {
      const underutilized = Object.entries(state.regionLoads)
        .filter(([, load]) => load < 50)
        .map(([region]) => region as GlobalRegion);

      if (underutilized.length > 0) {
        actions.push({
          id: `lb-${hotspot.region}-${Date.now()}`,
          type: 'REDISTRIBUTE',
          fromRegion: hotspot.region,
          toRegion: underutilized[0],
          description: `Redirect non-critical tasks from ${hotspot.region} to ${underutilized[0]}`,
          expectedImpact: `Reduce ${hotspot.region} load by ~20%`,
          urgency: hotspot.loadPercent > 95 ? 'IMMEDIATE' : 'WITHIN_HOUR',
        });
      }
    }
  }

  return actions;
}

/**
 * Evaluate shift handoff quality
 */
export function evaluateHandoffQuality(
  handoff: ShiftHandoff
): 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR' {
  let score = 0;

  if (handoff.briefingComplete) score += 30;
  if (handoff.criticalWatchItems.length > 0) score += 20;
  if (handoff.pendingDecisions.length <= 2) score += 20;
  if (handoff.followUpsRequired.length <= 3) score += 15;
  if (handoff.openIncidents < 5) score += 15;

  if (score >= 90) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'ADEQUATE';
  return 'POOR';
}

/**
 * Create initial team roster for simulation
 */
export function createInitialRoster(): TeamRosterState {
  const now = new Date().toISOString();

  const operators: Operator[] = [
    {
      id: 'op-amer-1',
      name: 'Maria Santos',
      role: 'TEAM_LEAD',
      region: 'AMERICAS',
      skills: [
        { skill: 'TRIAGE', level: 5, certification: 'CERTIFIED' },
        { skill: 'INCIDENT_MANAGEMENT', level: 4, certification: 'CERTIFIED' },
        { skill: 'STAKEHOLDER_COMMS', level: 4, certification: 'CERTIFIED' },
      ],
      performance: { overall: 'EXCEEDS', recentTrend: 'STABLE', lastReview: now },
      availability: { currentShift: true, onCall: false, maxHoursRemaining: 6 },
      workload: { activeIncidents: 2, tasksQueued: 3, utilizationPercent: 75 },
    },
    {
      id: 'op-amer-2',
      name: 'James Wilson',
      role: 'SENIOR_ANALYST',
      region: 'AMERICAS',
      skills: [
        { skill: 'INTEL_ANALYSIS', level: 5, certification: 'CERTIFIED' },
        { skill: 'TRAVEL_SECURITY', level: 4, certification: 'CERTIFIED' },
      ],
      performance: { overall: 'MEETS', recentTrend: 'IMPROVING', lastReview: now },
      availability: { currentShift: true, onCall: true, maxHoursRemaining: 8 },
      workload: { activeIncidents: 1, tasksQueued: 2, utilizationPercent: 55 },
    },
    {
      id: 'op-amer-3',
      name: 'Alex Chen',
      role: 'ANALYST',
      region: 'AMERICAS',
      skills: [
        { skill: 'TRIAGE', level: 3, certification: 'CERTIFIED' },
        { skill: 'CYBER_COORDINATION', level: 2, certification: 'IN_TRAINING' },
      ],
      performance: {
        overall: 'DEVELOPING',
        recentTrend: 'IMPROVING',
        lastReview: now,
        coachingNotes: 'Strong potential, needs confidence building',
      },
      availability: { currentShift: true, onCall: false, maxHoursRemaining: 7 },
      workload: { activeIncidents: 1, tasksQueued: 4, utilizationPercent: 65 },
    },
    {
      id: 'op-emea-1',
      name: 'Sophie Dubois',
      role: 'TEAM_LEAD',
      region: 'EMEA',
      skills: [
        { skill: 'CRISIS_MANAGEMENT', level: 5, certification: 'CERTIFIED' },
        { skill: 'STAKEHOLDER_COMMS', level: 5, certification: 'CERTIFIED' },
        { skill: 'INTEL_ANALYSIS', level: 4, certification: 'CERTIFIED' },
      ],
      performance: { overall: 'EXCEEDS', recentTrend: 'STABLE', lastReview: now },
      availability: { currentShift: false, onCall: true, maxHoursRemaining: 4 },
      workload: { activeIncidents: 0, tasksQueued: 1, utilizationPercent: 20 },
    },
    {
      id: 'op-emea-2',
      name: 'Omar Al-Hassan',
      role: 'SENIOR_ANALYST',
      region: 'EMEA',
      skills: [
        { skill: 'INTEL_ANALYSIS', level: 5, certification: 'CERTIFIED' },
        { skill: 'EXECUTIVE_PROTECTION', level: 4, certification: 'CERTIFIED' },
      ],
      performance: { overall: 'EXCEEDS', recentTrend: 'STABLE', lastReview: now },
      availability: { currentShift: false, onCall: false, maxHoursRemaining: 8 },
      workload: { activeIncidents: 0, tasksQueued: 0, utilizationPercent: 0 },
    },
    {
      id: 'op-apac-1',
      name: 'Hiroshi Tanaka',
      role: 'TEAM_LEAD',
      region: 'APAC',
      skills: [
        { skill: 'INCIDENT_MANAGEMENT', level: 5, certification: 'CERTIFIED' },
        { skill: 'VENDOR_LIAISON', level: 4, certification: 'CERTIFIED' },
        { skill: 'PHYSICAL_RESPONSE', level: 4, certification: 'CERTIFIED' },
      ],
      performance: { overall: 'MEETS', recentTrend: 'STABLE', lastReview: now },
      availability: { currentShift: false, onCall: true, maxHoursRemaining: 6 },
      workload: { activeIncidents: 1, tasksQueued: 2, utilizationPercent: 30 },
    },
    {
      id: 'op-apac-2',
      name: 'Priya Sharma',
      role: 'ANALYST',
      region: 'APAC',
      skills: [
        { skill: 'TRIAGE', level: 4, certification: 'CERTIFIED' },
        { skill: 'INTEL_ANALYSIS', level: 3, certification: 'CERTIFIED' },
      ],
      performance: { overall: 'MEETS', recentTrend: 'IMPROVING', lastReview: now },
      availability: { currentShift: false, onCall: false, maxHoursRemaining: 8 },
      workload: { activeIncidents: 0, tasksQueued: 1, utilizationPercent: 15 },
    },
  ];

  const regionalLeads: Record<GlobalRegion, RegionalLead> = {
    AMERICAS: {
      id: 'rl-amer',
      operatorId: 'op-amer-1',
      name: 'Maria Santos',
      region: 'AMERICAS',
      yearsExperience: 8,
      directReports: ['op-amer-2', 'op-amer-3'],
      delegationAuthority: 'FULL',
      currentFocus: 'Incident surge management',
      recentDecisions: [],
    },
    EMEA: {
      id: 'rl-emea',
      operatorId: 'op-emea-1',
      name: 'Sophie Dubois',
      region: 'EMEA',
      yearsExperience: 12,
      directReports: ['op-emea-2'],
      delegationAuthority: 'FULL',
      currentFocus: 'Cross-regional coordination',
      recentDecisions: [],
    },
    APAC: {
      id: 'rl-apac',
      operatorId: 'op-apac-1',
      name: 'Hiroshi Tanaka',
      region: 'APAC',
      yearsExperience: 10,
      directReports: ['op-apac-2'],
      delegationAuthority: 'LIMITED',
      currentFocus: 'New analyst onboarding',
      recentDecisions: [],
    },
  };

  return {
    timestamp: now,
    activeShift: 'AMERICAS',
    regionalLeads,
    operators,
    handoffs: [],
    coverageGaps: [],
    loadBalance: {
      timestamp: now,
      globalLoad: 45,
      regionLoads: { AMERICAS: 65, EMEA: 20, APAC: 25 },
      hotspots: [],
      recommendedActions: [],
    },
    teamHealth: {
      overallMorale: 'MODERATE',
      burnoutRisk: 'MEDIUM',
      trainingDebt: 3,
      vacancyCount: 1,
    },
  };
}
