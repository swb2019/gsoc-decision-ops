/**
 * GSOC Decision Operations - Schema Validation
 *
 * Runtime validation for decision log structures.
 * Ensures data integrity for training scenarios and exports.
 */

import type {
  DecisionLog,
  Assumption,
  DecisionPosture,
  SeverityLevel,
  ConfidenceLevel,
} from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

const VALID_POSTURES: DecisionPosture[] = ['CONTINUE', 'DEGRADE', 'PAUSE'];
const VALID_SEVERITIES: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];
const VALID_CONFIDENCE: ConfidenceLevel[] = ['CONFIRMED', 'HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'];
const VALID_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validate a Fact object
 */
export function validateFact(fact: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `facts[${index}]`;

  if (!fact || typeof fact !== 'object') {
    errors.push({ path, message: 'Fact must be an object', value: fact });
    return errors;
  }

  const f = fact as Record<string, unknown>;

  if (!isNonEmptyString(f.id)) {
    errors.push({ path: `${path}.id`, message: 'Fact ID is required', value: f.id });
  }

  if (!isNonEmptyString(f.description)) {
    errors.push({ path: `${path}.description`, message: 'Fact description is required', value: f.description });
  }

  if (!isNonEmptyString(f.source)) {
    errors.push({ path: `${path}.source`, message: 'Fact source is required', value: f.source });
  }

  if (!VALID_CONFIDENCE.includes(f.confidence as ConfidenceLevel)) {
    errors.push({ path: `${path}.confidence`, message: `Confidence must be one of: ${VALID_CONFIDENCE.join(', ')}`, value: f.confidence });
  }

  if (!isValidISODate(f.timestamp)) {
    errors.push({ path: `${path}.timestamp`, message: 'Fact timestamp must be a valid ISO date', value: f.timestamp });
  }

  return errors;
}

/**
 * Validate an Assumption object
 */
export function validateAssumption(assumption: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `assumptions[${index}]`;

  if (!assumption || typeof assumption !== 'object') {
    errors.push({ path, message: 'Assumption must be an object', value: assumption });
    return errors;
  }

  const a = assumption as Record<string, unknown>;

  if (!isNonEmptyString(a.id)) {
    errors.push({ path: `${path}.id`, message: 'Assumption ID is required', value: a.id });
  }

  if (!isNonEmptyString(a.description)) {
    errors.push({ path: `${path}.description`, message: 'Assumption description is required', value: a.description });
  }

  if (!isNonEmptyString(a.basis)) {
    errors.push({ path: `${path}.basis`, message: 'Assumption basis is required', value: a.basis });
  }

  if (!isNonEmptyString(a.riskIfWrong)) {
    errors.push({ path: `${path}.riskIfWrong`, message: 'Risk if wrong is required', value: a.riskIfWrong });
  }

  return errors;
}

/**
 * Validate an Unknown object
 */
export function validateUnknown(unknown: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `unknowns[${index}]`;

  if (!unknown || typeof unknown !== 'object') {
    errors.push({ path, message: 'Unknown must be an object', value: unknown });
    return errors;
  }

  const u = unknown as Record<string, unknown>;

  if (!isNonEmptyString(u.id)) {
    errors.push({ path: `${path}.id`, message: 'Unknown ID is required', value: u.id });
  }

  if (!isNonEmptyString(u.question)) {
    errors.push({ path: `${path}.question`, message: 'Unknown question is required', value: u.question });
  }

  if (!VALID_PRIORITIES.includes(u.priority as typeof VALID_PRIORITIES[number])) {
    errors.push({ path: `${path}.priority`, message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, value: u.priority });
  }

  return errors;
}

/**
 * Validate a Decision object
 */
export function validateDecision(decision: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `decisions[${index}]`;

  if (!decision || typeof decision !== 'object') {
    errors.push({ path, message: 'Decision must be an object', value: decision });
    return errors;
  }

  const d = decision as Record<string, unknown>;

  if (!isNonEmptyString(d.id)) {
    errors.push({ path: `${path}.id`, message: 'Decision ID is required', value: d.id });
  }

  if (!isNonEmptyString(d.title)) {
    errors.push({ path: `${path}.title`, message: 'Decision title is required', value: d.title });
  }

  if (!isNonEmptyString(d.description)) {
    errors.push({ path: `${path}.description`, message: 'Decision description is required', value: d.description });
  }

  if (!VALID_POSTURES.includes(d.posture as DecisionPosture)) {
    errors.push({ path: `${path}.posture`, message: `Posture must be one of: ${VALID_POSTURES.join(', ')}`, value: d.posture });
  }

  if (!isNonEmptyString(d.owner)) {
    errors.push({ path: `${path}.owner`, message: 'Decision owner is required', value: d.owner });
  }

  if (!isNonEmptyString(d.rationale)) {
    errors.push({ path: `${path}.rationale`, message: 'Decision rationale is required', value: d.rationale });
  }

  return errors;
}

/**
 * Validate an ActionItem object
 */
export function validateActionItem(actionItem: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `actionItems[${index}]`;

  if (!actionItem || typeof actionItem !== 'object') {
    errors.push({ path, message: 'ActionItem must be an object', value: actionItem });
    return errors;
  }

  const a = actionItem as Record<string, unknown>;

  if (!isNonEmptyString(a.id)) {
    errors.push({ path: `${path}.id`, message: 'ActionItem ID is required', value: a.id });
  }

  if (!isNonEmptyString(a.description)) {
    errors.push({ path: `${path}.description`, message: 'ActionItem description is required', value: a.description });
  }

  if (!isNonEmptyString(a.owner)) {
    errors.push({ path: `${path}.owner`, message: 'ActionItem owner is required', value: a.owner });
  }

  if (!VALID_PRIORITIES.includes(a.priority as typeof VALID_PRIORITIES[number])) {
    errors.push({ path: `${path}.priority`, message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`, value: a.priority });
  }

  return errors;
}

/**
 * Validate a complete DecisionLog
 */
export function validateDecisionLog(log: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!log || typeof log !== 'object') {
    return {
      valid: false,
      errors: [{ path: '', message: 'Decision log must be an object', value: log }],
      warnings: [],
    };
  }

  const l = log as Record<string, unknown>;

  // Required top-level fields
  if (!isNonEmptyString(l.id)) {
    errors.push({ path: 'id', message: 'Decision log ID is required', value: l.id });
  }

  if (!isNonEmptyString(l.version)) {
    errors.push({ path: 'version', message: 'Version is required', value: l.version });
  }

  if (!isValidISODate(l.createdAt)) {
    errors.push({ path: 'createdAt', message: 'Created timestamp must be a valid ISO date', value: l.createdAt });
  }

  // Incident validation
  if (!l.incident || typeof l.incident !== 'object') {
    errors.push({ path: 'incident', message: 'Incident object is required' });
  } else {
    const inc = l.incident as Record<string, unknown>;

    if (!isNonEmptyString(inc.title)) {
      errors.push({ path: 'incident.title', message: 'Incident title is required', value: inc.title });
    }

    if (!VALID_SEVERITIES.includes(inc.severity as SeverityLevel)) {
      errors.push({ path: 'incident.severity', message: `Severity must be one of: ${VALID_SEVERITIES.join(', ')}`, value: inc.severity });
    }
  }

  // Metadata validation
  if (!l.metadata || typeof l.metadata !== 'object') {
    errors.push({ path: 'metadata', message: 'Metadata object is required' });
  } else {
    const meta = l.metadata as Record<string, unknown>;

    if (meta.syntheticScenario !== true && meta.exerciseMode !== true) {
      warnings.push({
        path: 'metadata',
        message: 'Production scenarios should be clearly marked',
        suggestion: 'Set exerciseMode or syntheticScenario to true for training content',
      });
    }
  }

  // Validate arrays
  if (Array.isArray(l.facts)) {
    l.facts.forEach((fact, index) => {
      errors.push(...validateFact(fact, index));
    });
  }

  if (Array.isArray(l.assumptions)) {
    l.assumptions.forEach((assumption, index) => {
      errors.push(...validateAssumption(assumption, index));
    });
  }

  if (Array.isArray(l.unknowns)) {
    l.unknowns.forEach((unknown, index) => {
      errors.push(...validateUnknown(unknown, index));
    });
  }

  if (Array.isArray(l.decisions)) {
    l.decisions.forEach((decision, index) => {
      errors.push(...validateDecision(decision, index));
    });
  }

  if (Array.isArray(l.actionItems)) {
    l.actionItems.forEach((actionItem, index) => {
      errors.push(...validateActionItem(actionItem, index));
    });
  }

  // Semantic warnings
  if (Array.isArray(l.decisions) && l.decisions.length === 0 && Array.isArray(l.timeline) && l.timeline.length > 5) {
    warnings.push({
      path: 'decisions',
      message: 'No decisions recorded despite significant timeline activity',
      suggestion: 'Record key decisions to maintain audit trail',
    });
  }

  if (Array.isArray(l.assumptions) && Array.isArray(l.facts)) {
    const unvalidatedAssumptions = (l.assumptions as Assumption[]).filter(
      (a) => !a.validationResult
    );
    if (unvalidatedAssumptions.length > 3) {
      warnings.push({
        path: 'assumptions',
        message: `${unvalidatedAssumptions.length} assumptions remain unvalidated`,
        suggestion: 'Prioritize validating critical assumptions',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Assert that a decision log is valid, throwing if not
 */
export function assertValidDecisionLog(log: unknown): asserts log is DecisionLog {
  const result = validateDecisionLog(log);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid decision log:\n${errorMessages}`);
  }
}
