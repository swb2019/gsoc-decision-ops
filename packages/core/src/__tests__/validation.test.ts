/**
 * GSOC Decision Operations - Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateDecisionLog,
  validateFact,
  validateAssumption,
  validateUnknown,
  validateDecision,
  validateActionItem,
  assertValidDecisionLog,
} from '../validation.js';
import { createDecisionLog, addFact, addAssumption, recordDecision } from '../decision-log.js';

describe('Validation', () => {
  describe('validateDecisionLog', () => {
    it('should validate a correct decision log', () => {
      const log = createDecisionLog({
        title: 'Test Incident',
        description: 'Test description',
        severity: 'HIGH',
        impactCategories: ['ACCESS_CONTROL'],
        reportedBy: 'Reporter',
        createdBy: 'Creator',
        organization: 'Org',
        exerciseMode: true,
        syntheticScenario: true,
      });

      const result = validateDecisionLog(log);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object input', () => {
      const result = validateDecisionLog(null);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('must be an object');
    });

    it('should require id field', () => {
      const result = validateDecisionLog({});

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'id')).toBe(true);
    });

    it('should require version field', () => {
      const result = validateDecisionLog({ id: 'test' });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'version')).toBe(true);
    });

    it('should validate incident severity', () => {
      const log = createDecisionLog({
        title: 'Test',
        description: 'Test',
        severity: 'HIGH',
        impactCategories: [],
        reportedBy: 'R',
        createdBy: 'C',
        organization: 'O',
        syntheticScenario: true,
      });

      // @ts-expect-error - Testing invalid data
      log.incident.severity = 'INVALID';

      const result = validateDecisionLog(log);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'incident.severity')).toBe(true);
    });

    it('should warn when not marked as training content', () => {
      const log = createDecisionLog({
        title: 'Test',
        description: 'Test',
        severity: 'HIGH',
        impactCategories: [],
        reportedBy: 'R',
        createdBy: 'C',
        organization: 'O',
        exerciseMode: false,
        syntheticScenario: false,
      });

      const result = validateDecisionLog(log);

      expect(result.warnings.some((w) => w.path === 'metadata')).toBe(true);
    });

    it('should validate all facts in the log', () => {
      const log = createDecisionLog({
        title: 'Test',
        description: 'Test',
        severity: 'HIGH',
        impactCategories: [],
        reportedBy: 'R',
        createdBy: 'C',
        organization: 'O',
        syntheticScenario: true,
      });

      // Add invalid fact
      log.facts.push({
        id: '',
        timestamp: 'invalid',
        description: '',
        source: '',
        // @ts-expect-error - Testing invalid data
        confidence: 'WRONG',
      });

      const result = validateDecisionLog(log);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.startsWith('facts[0]'))).toBe(true);
    });
  });

  describe('validateFact', () => {
    it('should validate correct fact', () => {
      const fact = {
        id: 'FACT_123',
        timestamp: new Date().toISOString(),
        description: 'Test fact',
        source: 'Test source',
        confidence: 'CONFIRMED',
      };

      const errors = validateFact(fact, 0);

      expect(errors).toHaveLength(0);
    });

    it('should require all mandatory fields', () => {
      const errors = validateFact({}, 0);

      expect(errors.some((e) => e.path.includes('id'))).toBe(true);
      expect(errors.some((e) => e.path.includes('description'))).toBe(true);
      expect(errors.some((e) => e.path.includes('source'))).toBe(true);
    });

    it('should validate confidence level', () => {
      const fact = {
        id: 'FACT_123',
        timestamp: new Date().toISOString(),
        description: 'Test',
        source: 'Source',
        confidence: 'INVALID',
      };

      const errors = validateFact(fact, 0);

      expect(errors.some((e) => e.path.includes('confidence'))).toBe(true);
    });

    it('should reject non-object input', () => {
      const errors = validateFact(null, 0);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('must be an object');
    });
  });

  describe('validateAssumption', () => {
    it('should validate correct assumption', () => {
      const assumption = {
        id: 'ASSM_123',
        timestamp: new Date().toISOString(),
        description: 'Test assumption',
        basis: 'Test basis',
        riskIfWrong: 'Test risk',
      };

      const errors = validateAssumption(assumption, 0);

      expect(errors).toHaveLength(0);
    });

    it('should require riskIfWrong field', () => {
      const assumption = {
        id: 'ASSM_123',
        timestamp: new Date().toISOString(),
        description: 'Test',
        basis: 'Basis',
      };

      const errors = validateAssumption(assumption, 0);

      expect(errors.some((e) => e.path.includes('riskIfWrong'))).toBe(true);
    });
  });

  describe('validateUnknown', () => {
    it('should validate correct unknown', () => {
      const unknown = {
        id: 'UNK_123',
        timestamp: new Date().toISOString(),
        question: 'What is the impact?',
        priority: 'HIGH',
      };

      const errors = validateUnknown(unknown, 0);

      expect(errors).toHaveLength(0);
    });

    it('should validate priority values', () => {
      const unknown = {
        id: 'UNK_123',
        timestamp: new Date().toISOString(),
        question: 'Test?',
        priority: 'EXTREME',
      };

      const errors = validateUnknown(unknown, 0);

      expect(errors.some((e) => e.path.includes('priority'))).toBe(true);
    });
  });

  describe('validateDecision', () => {
    it('should validate correct decision', () => {
      const decision = {
        id: 'DEC_123',
        timestamp: new Date().toISOString(),
        title: 'Test Decision',
        description: 'Description',
        posture: 'DEGRADE',
        owner: 'Owner',
        ownerRole: 'Role',
        rationale: 'Because reasons',
        factsConsidered: [],
        assumptionsMade: [],
        unknownsAccepted: [],
      };

      const errors = validateDecision(decision, 0);

      expect(errors).toHaveLength(0);
    });

    it('should validate posture values', () => {
      const decision = {
        id: 'DEC_123',
        timestamp: new Date().toISOString(),
        title: 'Test',
        description: 'Desc',
        posture: 'INVALID',
        owner: 'Owner',
        rationale: 'Rationale',
      };

      const errors = validateDecision(decision, 0);

      expect(errors.some((e) => e.path.includes('posture'))).toBe(true);
    });

    it('should require rationale', () => {
      const decision = {
        id: 'DEC_123',
        timestamp: new Date().toISOString(),
        title: 'Test',
        description: 'Desc',
        posture: 'CONTINUE',
        owner: 'Owner',
      };

      const errors = validateDecision(decision, 0);

      expect(errors.some((e) => e.path.includes('rationale'))).toBe(true);
    });
  });

  describe('validateActionItem', () => {
    it('should validate correct action item', () => {
      const actionItem = {
        id: 'ACT_123',
        createdAt: new Date().toISOString(),
        description: 'Test action',
        owner: 'Owner',
        priority: 'HIGH',
        status: 'OPEN',
      };

      const errors = validateActionItem(actionItem, 0);

      expect(errors).toHaveLength(0);
    });

    it('should require owner', () => {
      const actionItem = {
        id: 'ACT_123',
        createdAt: new Date().toISOString(),
        description: 'Test',
        priority: 'HIGH',
      };

      const errors = validateActionItem(actionItem, 0);

      expect(errors.some((e) => e.path.includes('owner'))).toBe(true);
    });
  });

  describe('assertValidDecisionLog', () => {
    it('should not throw for valid log', () => {
      const log = createDecisionLog({
        title: 'Test',
        description: 'Test',
        severity: 'HIGH',
        impactCategories: [],
        reportedBy: 'R',
        createdBy: 'C',
        organization: 'O',
        syntheticScenario: true,
      });

      expect(() => assertValidDecisionLog(log)).not.toThrow();
    });

    it('should throw for invalid log', () => {
      expect(() => assertValidDecisionLog({})).toThrow('Invalid decision log');
    });

    it('should include error details in thrown error', () => {
      try {
        assertValidDecisionLog({ id: 'test' });
      } catch (e) {
        expect((e as Error).message).toContain('version');
      }
    });
  });

  describe('Integration validation', () => {
    it('should validate log built with decision-log functions', () => {
      let log = createDecisionLog({
        title: 'Integration Test',
        description: 'Testing validation with real functions',
        severity: 'CRITICAL',
        impactCategories: ['ACCESS_CONTROL', 'VIDEO_SURVEILLANCE'],
        reportedBy: 'Test System',
        createdBy: 'Test User',
        organization: 'Test Org',
        syntheticScenario: true,
        exerciseMode: true,
      });

      log = addFact(log, 'Vendor confirmed breach', 'Vendor notification', 'CONFIRMED');
      log = addAssumption(log, 'Attack is contained', 'Vendor statement', 'May need to reassess');
      log = recordDecision(log, {
        title: 'Suspend vendor access',
        description: 'Temporarily disable all vendor connections',
        posture: 'PAUSE',
        owner: 'GSOC Manager',
        ownerRole: 'Incident Commander',
        rationale: 'Precautionary measure until scope is confirmed',
      });

      const result = validateDecisionLog(log);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
