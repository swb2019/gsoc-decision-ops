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
} from './scenarios/index.js';

export type { ScenarioInfo, FusedInject, SecurityDomain, InjectSource } from './scenarios/index.js';

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
  EXECUTIVE_THREAT_ASSETS,
  SUPPLY_CHAIN_ASSETS,
  INSIDER_THREAT_ASSETS,
} from './esrm.js';

export type {
  AssetCriticality,
  RiskTreatmentOption,
  ProtectedAsset,
  AssetOwner,
  RiskAssessment,
  ESRMDecisionContext,
  RiskCommunication,
  ScenarioESRMConfig,
  ESRMScorecard,
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
