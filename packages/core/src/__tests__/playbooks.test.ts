/**
 * GSOC Decision Operations - Playbooks Tests
 */

import { describe, it, expect } from 'vitest';
import {
  vendorCompromisePlaybook,
  getVendorCompromisePlaybook,
  getPlaybookPhase,
  getPhaseChecklist,
  calculatePhaseCompletion,
} from '../playbooks/index.js';

describe('Vendor Compromise Playbook', () => {
  describe('vendorCompromisePlaybook', () => {
    it('should have correct structure', () => {
      expect(vendorCompromisePlaybook.id).toBe('PB_VENDOR_COMPROMISE_V1');
      expect(vendorCompromisePlaybook.name).toBe('Vendor Compromise First-Hour Response');
      expect(vendorCompromisePlaybook.version).toBe('1.0.0');
      expect(vendorCompromisePlaybook.totalDurationMinutes).toBe(60);
    });

    it('should have 5 phases', () => {
      expect(vendorCompromisePlaybook.phases).toHaveLength(5);
    });

    it('should have governance notes', () => {
      expect(vendorCompromisePlaybook.governanceNotes.length).toBeGreaterThan(0);
    });

    it('should have phases totaling 60 minutes', () => {
      const totalMinutes = vendorCompromisePlaybook.phases.reduce(
        (sum, phase) => sum + phase.durationMinutes,
        0
      );
      expect(totalMinutes).toBe(60);
    });
  });

  describe('getVendorCompromisePlaybook', () => {
    it('should return the playbook', () => {
      const playbook = getVendorCompromisePlaybook();
      expect(playbook).toBe(vendorCompromisePlaybook);
    });
  });

  describe('getPlaybookPhase', () => {
    it('should return correct phase by ID', () => {
      const phase = getPlaybookPhase('PHASE_1_ASSESSMENT');

      expect(phase).toBeDefined();
      expect(phase?.name).toBe('Initial Assessment');
      expect(phase?.durationMinutes).toBe(10);
    });

    it('should return undefined for invalid ID', () => {
      const phase = getPlaybookPhase('INVALID_PHASE');
      expect(phase).toBeUndefined();
    });
  });

  describe('getPhaseChecklist', () => {
    it('should return checklist items for phase', () => {
      const checklist = getPhaseChecklist('PHASE_1_ASSESSMENT');

      expect(checklist.length).toBeGreaterThan(0);
      expect(checklist[0].id).toBeDefined();
      expect(checklist[0].description).toBeDefined();
    });

    it('should return empty array for invalid phase', () => {
      const checklist = getPhaseChecklist('INVALID_PHASE');
      expect(checklist).toHaveLength(0);
    });
  });

  describe('calculatePhaseCompletion', () => {
    it('should calculate 0% for no completed items', () => {
      const result = calculatePhaseCompletion('PHASE_1_ASSESSMENT', new Set());

      expect(result.completed).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should calculate correct percentage', () => {
      const checklist = getPhaseChecklist('PHASE_1_ASSESSMENT');
      const completedIds = new Set([checklist[0].id, checklist[1].id]);

      const result = calculatePhaseCompletion('PHASE_1_ASSESSMENT', completedIds);

      expect(result.completed).toBe(2);
      expect(result.total).toBe(checklist.length);
      expect(result.percentage).toBe(Math.round((2 / checklist.length) * 100));
    });

    it('should calculate 100% when all items completed', () => {
      const checklist = getPhaseChecklist('PHASE_1_ASSESSMENT');
      const completedIds = new Set(checklist.map((item) => item.id));

      const result = calculatePhaseCompletion('PHASE_1_ASSESSMENT', completedIds);

      expect(result.percentage).toBe(100);
    });
  });

  describe('Phase structure validation', () => {
    it('all phases should have required fields', () => {
      for (const phase of vendorCompromisePlaybook.phases) {
        expect(phase.id).toBeDefined();
        expect(phase.name).toBeDefined();
        expect(phase.description).toBeDefined();
        expect(phase.durationMinutes).toBeGreaterThan(0);
        expect(phase.objectives.length).toBeGreaterThan(0);
        expect(phase.keyQuestions.length).toBeGreaterThan(0);
        expect(phase.checklistItems.length).toBeGreaterThan(0);
      }
    });

    it('all checklist items should have required fields', () => {
      for (const phase of vendorCompromisePlaybook.phases) {
        for (const item of phase.checklistItems) {
          expect(item.id).toBeDefined();
          expect(item.description).toBeDefined();
          expect(typeof item.required).toBe('boolean');
          expect(item.completed).toBe(false);
        }
      }
    });
  });
});
