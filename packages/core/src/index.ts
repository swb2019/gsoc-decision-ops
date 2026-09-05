/**
 * GSOC Decision Operations - Core Library
 *
 * A structured decision-making toolkit for corporate Global Security
 * Operations Center (GSOC) leaders facing vendor compromises and
 * cyber-adjacent operational disruptions.
 *
 * This library provides:
 * - Type-safe decision log schema
 * - Vendor compromise response playbook
 * - After-action report generation
 * - Synthetic training scenarios
 *
 * GOVERNANCE NOTE: This toolkit is designed to support human decision-makers,
 * not replace them. All critical decisions require human judgment and
 * organizational authority.
 */

// Core types
export type {
  DecisionPosture,
  SeverityLevel,
  ImpactCategory,
  ConfidenceLevel,
  RiskTreatment,
  Fact,
  Assumption,
  Unknown,
  Stakeholder,
  Decision,
  BridgeRecord,
  ActionItem,
  VendorContext,
  LearningObjective,
  ScenarioInject,
  RPDPrompts,
  ESRMRiskFraming,
  DecisionLog,
  TimelineEvent,
  AfterActionReport,
  AARActionItem,
  PlaybookPhase,
  ChecklistItem,
  Playbook,
  PlaybookExecution,
  EntityType,
  LinkedEntity,
  PhaseTransition,
  PhaseGate,
  TriageQueue,
  DispatchState,
  ResourcePool,
  ContentionEvent,
  IntakeChannel,
  IntakeConfidence,
  IntakeCompleteness,
  AttachmentType,
  InjectAttachment,
  IntakeMetadata,
} from './types.js';

// Decision log management
export {
  createDecisionLog,
  addFact,
  addAssumption,
  addUnknown,
  recordDecision,
  addStakeholder,
  recordBridge,
  addActionItem,
  updateActionItemStatus,
  resolveUnknown,
  validateAssumption,
  updateIncidentStatus,
  calculateStats,
  revealInject,
  getNextInject,
  getRevealedInjects,
} from './decision-log.js';

export type {
  CreateDecisionLogConfig,
  RecordDecisionConfig,
  RecordBridgeConfig,
  DecisionLogStats,
} from './decision-log.js';

// Playbooks
export {
  vendorCompromisePlaybook,
  getVendorCompromisePlaybook,
  getPlaybookPhase,
  getPhaseChecklist,
  calculatePhaseCompletion,
} from './playbooks/index.js';

// Export functionality
export {
  generateAfterActionReport,
  exportToMarkdown,
  exportToJSON,
  exportDecisionLogJSON,
  exportBundle,
} from './export.js';

export type { ExportBundle } from './export.js';

// Synthetic scenarios
export {
  createAccessControlVendorScenario,
  createVideoSystemCompromiseScenario,
  createAlarmMonitoringOutageScenario,
  getAvailableScenarios,
  createScenarioById,
  FUSED_SCENARIOS,
  createExecutiveThreatScenario,
  createSupplyChainScenario,
  createInsiderThreatScenario,
  EXECUTIVE_THREAT_ESRM,
  SUPPLY_CHAIN_ESRM,
  INSIDER_THREAT_ESRM,
  LEADERSHIP_SCENARIOS,
  createCivilUnrestScenario,
  createTechOutageScenario,
  CIVIL_UNREST_ESRM,
  TECH_OUTAGE_ESRM,
} from './scenarios/index.js';

export type {
  ScenarioInfo,
  FusedInject,
  SecurityDomain,
  InjectSource,
  LeadershipInject,
  LeadershipScenarioType,
  LeadershipChallengeType,
} from './scenarios/index.js';

// Team Management
export {
  REGION_CONFIGS,
  calculateTeamUtilization,
  identifyCoverageGaps,
  generateLoadBalanceRecommendations,
  evaluateHandoffQuality,
  createInitialRoster,
} from './team-management.js';

export type {
  GlobalRegion,
  RegionConfig,
  OperatorSkill,
  PerformanceLevel,
  CertificationStatus,
  Operator,
  RegionalLead,
  LeadershipDecision,
  LeadershipDecisionType,
  ShiftHandoff,
  CoverageGap,
  CoverageMitigation,
  ShiftQuality,
  LoadBalanceState,
  LoadBalanceAction,
  TeamRosterState,
  CoachingMoment,
} from './team-management.js';

// Stakeholder Management
export {
  DEFAULT_ESCALATION_FRAMEWORK,
  createDefaultStakeholderMap,
  categorizeStakeholders,
  determineEscalationLevel,
  calculateExecutivePresenceScore,
  createStakeholderNPCs,
} from './stakeholder-management.js';

export type {
  StakeholderCategory,
  InfluenceLevel,
  InterestLevel,
  CommFrequency,
  MappedStakeholder,
  StakeholderQuadrant,
  StakeholderMap,
  CommunicationPlan,
  ScheduledBriefing,
  EscalationLevel,
  MessageTemplate,
  ExecutiveBriefing,
  BriefingOption,
  CrisisGovernance,
  MaturityLevel,
  MaturityDomain,
  MaturityInitiative,
  ImprovementConversation,
  StakeholderNPC,
} from './stakeholder-management.js';

// Utilities
export {
  generateId,
  now,
  formatDuration,
  minutesSince,
  isValidTimestamp,
  truncate,
  deepClone,
  sortByTimestamp,
  groupBy,
  countWhere,
} from './utils.js';

// ESRM Framework
export {
  treatmentToPosture,
  postureToTreatment,
  calculateESRMScore,
  calculateRiskLevel,
  calculateAssetPriorityScore,
  RISK_MATRIX,
  RISK_LEVEL_VALUES,
  TREATMENT_DESCRIPTIONS,
  EXECUTIVE_THREAT_ASSETS,
  SUPPLY_CHAIN_ASSETS,
  INSIDER_THREAT_ASSETS,
} from './esrm.js';

export type {
  AssetCriticality,
  RiskTreatmentOption,
  ExtendedPosture,
  RiskLikelihood,
  RiskImpact,
  RiskLevel,
  ProtectedAsset,
  AssetOwner,
  OwnerAffirmation,
  RiskAssessment,
  ESRMDecisionContext,
  RiskCommunication,
  ScenarioESRMConfig,
  ESRMScorecard,
  LessonLearned,
  ContinuousImprovementState,
} from './esrm.js';

// Validation
export {
  validateDecisionLog,
  validateFact,
  validateAssumption as validateAssumptionSchema,
  validateUnknown as validateUnknownSchema,
  validateDecision as validateDecisionSchema,
  validateActionItem as validateActionItemSchema,
  assertValidDecisionLog,
} from './validation.js';

export type { ValidationResult, ValidationError, ValidationWarning } from './validation.js';

// Intake Channels
export {
  INTAKE_CHANNELS,
  getChannelConfig,
  calculateEffectivePriority,
  calculateQueueWeight,
  generateSourceSystem,
  generateSourceId,
  createIntakeMetadata,
  createNoiseIntake,
  createCorrectionIntake,
} from './intake-channels.js';

export type { ChannelConfig } from './intake-channels.js';

// Value Metrics (ESRM Business Value Visibility)
export {
  calculateESRMValueCreated,
  calculateMissionContinuityValue,
  calculateResidualRiskValue,
  calculateOwnerAffirmationValue,
  calculateAvoidedLossValue,
  calculateAdvisorEffectivenessValue,
} from './value-metrics.js';

export type {
  MissionContinuityState,
  MissionContinuityValue,
  ResidualRiskValue,
  OwnerAffirmationValue,
  AvoidedLossProxy,
  AvoidedLossValue,
  AdvisorEffectivenessValue,
  ESRMValueCreated,
} from './value-metrics.js';

// KRI (Key Risk Indicators)
export {
  createKRIDashboard,
  calculateMTTA,
  calculateMTTR,
  calculateOpenCriticalRisks,
  calculateResidualRiskExplicitnessRate,
  calculateAssetOwnerBriefingRate,
  calculateDispatchContention,
  calculateChannelNoiseRatio,
  calculateTreatmentMix,
  calculateEscalationIndicator,
  KRI_DEFINITIONS,
} from './kri.js';

export type {
  TrafficLightStatus,
  TrendDirection,
  KRICategory,
  KRIMeasurement,
  KRIDashboard,
  KRIHistoryEntry,
} from './kri.js';

// Pipeline Health
export {
  createPipelineHealth,
  PIPELINE_STAGE_CONFIG,
  SOURCE_CHANNEL_CONFIG,
  PIPELINE_FLOW,
  PIPELINE_DEFINITIONS,
} from './pipeline.js';

export type {
  PipelineStage,
  SourceType,
  PipelineHealthStatus,
  StageHealth,
  SourceChannelHealth,
  PipelineHealth,
  PipelineAlert,
} from './pipeline.js';

// Tactical Actions (Security Deployments)
export {
  TACTICAL_ACTIONS,
  TACTICAL_CATEGORY_CONFIG,
  createInitialTacticalState,
  deployTacticalAction,
  getAvailableActions,
} from './tactical-actions.js';

export type {
  TacticalCategory,
  DeploymentStatus,
  EffectivenessRating,
  TacticalAction,
  DeployedAction,
  DeploymentFeedback,
  TacticalState,
} from './tactical-actions.js';
