/**
 * GSOC Decision Operations - Export Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateAfterActionReport,
  exportToMarkdown,
  exportToJSON,
  exportBundle,
} from '../export.js';
import { createDecisionLog, addFact, recordDecision } from '../decision-log.js';
import type { DecisionLog } from '../types.js';

describe('Export', () => {
  function createTestLog(): DecisionLog {
    let log = createDecisionLog({
      title: 'Test Export Incident',
      description: 'An incident for testing export functionality',
      severity: 'HIGH',
      impactCategories: ['ACCESS_CONTROL'],
      reportedBy: 'Test Reporter',
      createdBy: 'Test Creator',
      organization: 'Test Organization',
      exerciseMode: true,
      syntheticScenario: true,
      vendorContext: {
        vendorName: 'Test Vendor',
        vendorType: 'Test Type',
        servicesAffected: ['Service 1', 'Service 2'],
      },
    });

    log = addFact(log, 'Test fact', 'Test source', 'CONFIRMED');
    log = recordDecision(log, {
      title: 'Test Decision',
      description: 'A test decision',
      posture: 'DEGRADE',
      owner: 'Test Owner',
      ownerRole: 'Test Role',
      rationale: 'Test rationale',
    });

    return log;
  }

  describe('generateAfterActionReport', () => {
    it('should generate a complete after-action report', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log, ['Lesson 1'], ['Recommendation 1']);

      expect(report.id).toMatch(/^AAR_/);
      expect(report.decisionLogId).toBe(log.id);
      expect(report.incidentOverview.title).toBe('Test Export Incident');
      expect(report.lessonsLearned).toContain('Lesson 1');
      expect(report.recommendations).toContain('Recommendation 1');
    });

    it('should calculate decision analysis correctly', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log);

      expect(report.decisionAnalysis.totalDecisions).toBe(1);
      expect(report.decisionAnalysis.postureBreakdown.DEGRADE).toBe(1);
    });

    it('should include key decisions (PAUSE and DEGRADE)', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log);

      expect(report.decisionAnalysis.keyDecisions).toHaveLength(1);
      expect(report.decisionAnalysis.keyDecisions[0].posture).toBe('DEGRADE');
    });
  });

  describe('exportToMarkdown', () => {
    it('should generate valid markdown', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log);
      const markdown = exportToMarkdown(report);

      expect(markdown).toContain('# After-Action Report');
      expect(markdown).toContain('Test Export Incident');
      expect(markdown).toContain('## Executive Summary');
      expect(markdown).toContain('## Incident Overview');
      expect(markdown).toContain('## Decision Analysis');
    });

    it('should include exercise mode warning', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log);
      const markdown = exportToMarkdown(report);

      expect(markdown).toContain('TRAINING EXERCISE');
    });

    it('should include vendor context when present', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log);
      const markdown = exportToMarkdown(report);

      expect(markdown).toContain('### Vendor Context');
      expect(markdown).toContain('Test Vendor');
    });
  });

  describe('exportToJSON', () => {
    it('should generate valid JSON', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log);
      const json = exportToJSON(report);

      const parsed = JSON.parse(json);
      expect(parsed.id).toBe(report.id);
      expect(parsed.appendices.fullDecisionLog.id).toBe(log.id);
    });
  });

  describe('exportBundle', () => {
    it('should generate both markdown and JSON', () => {
      const log = createTestLog();
      const report = generateAfterActionReport(log);
      const bundle = exportBundle(report);

      expect(bundle.markdown).toContain('# After-Action Report');
      expect(() => JSON.parse(bundle.json)).not.toThrow();
      expect(bundle.filename).toMatch(/^aar-\d{4}-\d{2}-\d{2}-/);
    });
  });
});
