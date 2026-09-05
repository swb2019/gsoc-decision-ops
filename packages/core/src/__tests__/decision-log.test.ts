/**
 * GSOC Decision Operations - Decision Log Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
} from '../decision-log.js';
import type { DecisionLog } from '../types.js';

describe('Decision Log', () => {
  let log: DecisionLog;

  beforeEach(() => {
    log = createDecisionLog({
      title: 'Test Incident',
      description: 'A test incident for unit testing',
      severity: 'HIGH',
      impactCategories: ['ACCESS_CONTROL', 'PHYSICAL_SECURITY'],
      reportedBy: 'Test Reporter',
      createdBy: 'Test Creator',
      organization: 'Test Organization',
      exerciseMode: true,
      syntheticScenario: true,
    });
  });

  describe('createDecisionLog', () => {
    it('should create a decision log with correct structure', () => {
      expect(log.id).toMatch(/^DL_/);
      expect(log.version).toBe('1.0.0');
      expect(log.incident.title).toBe('Test Incident');
      expect(log.incident.severity).toBe('HIGH');
      expect(log.incident.status).toBe('ACTIVE');
      expect(log.metadata.exerciseMode).toBe(true);
      expect(log.metadata.syntheticScenario).toBe(true);
    });

    it('should initialize with empty arrays', () => {
      expect(log.facts).toHaveLength(0);
      expect(log.assumptions).toHaveLength(0);
      expect(log.unknowns).toHaveLength(0);
      expect(log.decisions).toHaveLength(0);
      expect(log.stakeholders).toHaveLength(0);
      expect(log.bridgeRecords).toHaveLength(0);
      expect(log.actionItems).toHaveLength(0);
    });

    it('should create initial timeline event', () => {
      expect(log.timeline).toHaveLength(1);
      expect(log.timeline[0].type).toBe('DETECTION');
    });
  });

  describe('addFact', () => {
    it('should add a fact to the log', () => {
      const updatedLog = addFact(log, 'Vendor confirmed outage', 'Vendor status page', 'CONFIRMED');

      expect(updatedLog.facts).toHaveLength(1);
      expect(updatedLog.facts[0].description).toBe('Vendor confirmed outage');
      expect(updatedLog.facts[0].confidence).toBe('CONFIRMED');
    });

    it('should add timeline event for new fact', () => {
      const updatedLog = addFact(log, 'Test fact', 'Test source');

      expect(updatedLog.timeline.length).toBeGreaterThan(log.timeline.length);
      expect(updatedLog.timeline[updatedLog.timeline.length - 1].type).toBe('UPDATE');
    });

    it('should default confidence to UNVERIFIED', () => {
      const updatedLog = addFact(log, 'Test fact', 'Test source');

      expect(updatedLog.facts[0].confidence).toBe('UNVERIFIED');
    });
  });

  describe('addAssumption', () => {
    it('should add an assumption to the log', () => {
      const updatedLog = addAssumption(
        log,
        'Vendor will restore service within 4 hours',
        'SLA agreement',
        'Longer outage would require escalation',
        'Confirm with vendor during next bridge'
      );

      expect(updatedLog.assumptions).toHaveLength(1);
      expect(updatedLog.assumptions[0].description).toBe(
        'Vendor will restore service within 4 hours'
      );
      expect(updatedLog.assumptions[0].basis).toBe('SLA agreement');
      expect(updatedLog.assumptions[0].riskIfWrong).toBe('Longer outage would require escalation');
    });
  });

  describe('addUnknown', () => {
    it('should add an unknown to the log', () => {
      const updatedLog = addUnknown(
        log,
        'Was customer data exposed?',
        'CRITICAL',
        'IT Security',
        '2024-01-01T12:00:00Z'
      );

      expect(updatedLog.unknowns).toHaveLength(1);
      expect(updatedLog.unknowns[0].question).toBe('Was customer data exposed?');
      expect(updatedLog.unknowns[0].priority).toBe('CRITICAL');
    });
  });

  describe('recordDecision', () => {
    it('should record a decision in the log', () => {
      const updatedLog = recordDecision(log, {
        title: 'Suspend vendor access',
        description: 'Temporarily suspend all vendor remote access pending investigation',
        posture: 'PAUSE',
        owner: 'GSOC Manager',
        ownerRole: 'Incident Commander',
        rationale: 'Precautionary measure until scope of breach is known',
      });

      expect(updatedLog.decisions).toHaveLength(1);
      expect(updatedLog.decisions[0].title).toBe('Suspend vendor access');
      expect(updatedLog.decisions[0].posture).toBe('PAUSE');
    });

    it('should add timeline event for decision', () => {
      const updatedLog = recordDecision(log, {
        title: 'Continue operations',
        description: 'Continue with increased monitoring',
        posture: 'CONTINUE',
        owner: 'GSOC Manager',
        ownerRole: 'Incident Commander',
        rationale: 'No immediate impact identified',
      });

      const lastEvent = updatedLog.timeline[updatedLog.timeline.length - 1];
      expect(lastEvent.type).toBe('DECISION');
    });
  });

  describe('addStakeholder', () => {
    it('should add a stakeholder to the log', () => {
      const updatedLog = addStakeholder(
        log,
        'John Smith',
        'CISO',
        'Corporate Security',
        'Email/Phone',
        'FULL'
      );

      expect(updatedLog.stakeholders).toHaveLength(1);
      expect(updatedLog.stakeholders[0].name).toBe('John Smith');
      expect(updatedLog.stakeholders[0].briefingLevel).toBe('FULL');
    });
  });

  describe('recordBridge', () => {
    it('should record a bridge call', () => {
      const updatedLog = recordBridge(log, {
        scheduledTime: '2024-01-01T10:00:00Z',
        type: 'INITIAL',
        attendees: ['GSOC Manager', 'IT Security Lead'],
        keyUpdates: ['Vendor confirmed ransomware attack'],
        nextBridgeTime: '2024-01-01T11:00:00Z',
      });

      expect(updatedLog.bridgeRecords).toHaveLength(1);
      expect(updatedLog.bridgeRecords[0].type).toBe('INITIAL');
      expect(updatedLog.bridgeRecords[0].attendees).toHaveLength(2);
    });
  });

  describe('addActionItem', () => {
    it('should add an action item', () => {
      const updatedLog = addActionItem(
        log,
        'Activate backup access procedures',
        'GSOC Supervisor',
        'CRITICAL',
        '2024-01-01T11:00:00Z'
      );

      expect(updatedLog.actionItems).toHaveLength(1);
      expect(updatedLog.actionItems[0].status).toBe('OPEN');
      expect(updatedLog.actionItems[0].priority).toBe('CRITICAL');
    });
  });

  describe('updateActionItemStatus', () => {
    it('should update action item status', () => {
      let updatedLog = addActionItem(log, 'Test action', 'Owner', 'HIGH');
      const actionItemId = updatedLog.actionItems[0].id;

      updatedLog = updateActionItemStatus(updatedLog, actionItemId, 'COMPLETED');

      expect(updatedLog.actionItems[0].status).toBe('COMPLETED');
      expect(updatedLog.actionItems[0].completedAt).toBeDefined();
    });
  });

  describe('resolveUnknown', () => {
    it('should resolve an unknown', () => {
      let updatedLog = addUnknown(log, 'Test question', 'HIGH');
      const unknownId = updatedLog.unknowns[0].id;

      updatedLog = resolveUnknown(updatedLog, unknownId, 'No data was exposed');

      expect(updatedLog.unknowns[0].resolution).toBe('No data was exposed');
      expect(updatedLog.unknowns[0].resolvedAt).toBeDefined();
    });
  });

  describe('validateAssumption', () => {
    it('should validate an assumption', () => {
      let updatedLog = addAssumption(log, 'Test assumption', 'basis', 'risk');
      const assumptionId = updatedLog.assumptions[0].id;

      updatedLog = validateAssumption(updatedLog, assumptionId, 'CONFIRMED');

      expect(updatedLog.assumptions[0].validationResult).toBe('CONFIRMED');
      expect(updatedLog.assumptions[0].validatedAt).toBeDefined();
    });
  });

  describe('updateIncidentStatus', () => {
    it('should update incident status', () => {
      const updatedLog = updateIncidentStatus(log, 'RESOLVED', 'GSOC Manager');

      expect(updatedLog.incident.status).toBe('RESOLVED');
      expect(updatedLog.incident.incidentCommander).toBe('GSOC Manager');
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      let updatedLog = addFact(log, 'Fact 1', 'Source', 'CONFIRMED');
      updatedLog = addFact(updatedLog, 'Fact 2', 'Source', 'UNVERIFIED');
      updatedLog = addAssumption(updatedLog, 'Assumption 1', 'basis', 'risk');
      updatedLog = addUnknown(updatedLog, 'Unknown 1', 'CRITICAL');
      updatedLog = recordDecision(updatedLog, {
        title: 'Decision 1',
        description: 'Test',
        posture: 'DEGRADE',
        owner: 'Owner',
        ownerRole: 'Role',
        rationale: 'Rationale',
      });

      const stats = calculateStats(updatedLog);

      expect(stats.totalFacts).toBe(2);
      expect(stats.confirmedFacts).toBe(1);
      expect(stats.totalAssumptions).toBe(1);
      expect(stats.totalUnknowns).toBe(1);
      expect(stats.criticalUnknowns).toBe(1);
      expect(stats.totalDecisions).toBe(1);
      expect(stats.postureBreakdown.DEGRADE).toBe(1);
    });
  });
});
