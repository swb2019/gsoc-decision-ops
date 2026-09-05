/**
 * GSOC Decision Operations - Scenarios Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createAccessControlVendorScenario,
  createVideoSystemCompromiseScenario,
  createAlarmMonitoringOutageScenario,
  getAvailableScenarios,
  createScenarioById,
} from '../scenarios/index.js';

describe('Scenarios', () => {
  describe('createAccessControlVendorScenario', () => {
    it('should create a valid access control scenario', () => {
      const log = createAccessControlVendorScenario();

      expect(log.incident.title).toContain('Access Control');
      expect(log.incident.severity).toBe('HIGH');
      expect(log.vendorContext?.vendorName).toContain('SecureAccess');
      expect(log.metadata.exerciseMode).toBe(true);
      expect(log.metadata.syntheticScenario).toBe(true);
    });
  });

  describe('createVideoSystemCompromiseScenario', () => {
    it('should create a valid video system scenario', () => {
      const log = createVideoSystemCompromiseScenario();

      expect(log.incident.title).toContain('Video Management');
      expect(log.incident.severity).toBe('HIGH');
      expect(log.vendorContext?.vendorName).toContain('VisionGuard');
      expect(log.metadata.syntheticScenario).toBe(true);
    });
  });

  describe('createAlarmMonitoringOutageScenario', () => {
    it('should create a valid alarm monitoring scenario', () => {
      const log = createAlarmMonitoringOutageScenario();

      expect(log.incident.title).toContain('Alarm Monitoring');
      expect(log.incident.severity).toBe('CRITICAL');
      expect(log.vendorContext?.vendorName).toContain('CentralStation');
      expect(log.metadata.syntheticScenario).toBe(true);
    });
  });

  describe('getAvailableScenarios', () => {
    it('should return all available scenarios', () => {
      const scenarios = getAvailableScenarios();

      expect(scenarios).toHaveLength(3);
      expect(scenarios.map((s) => s.id)).toContain('access-control-ransomware');
      expect(scenarios.map((s) => s.id)).toContain('video-system-compromise');
      expect(scenarios.map((s) => s.id)).toContain('alarm-monitoring-outage');
    });

    it('should include required scenario metadata', () => {
      const scenarios = getAvailableScenarios();

      for (const scenario of scenarios) {
        expect(scenario.id).toBeDefined();
        expect(scenario.name).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.severity).toBeDefined();
        expect(scenario.vendorType).toBeDefined();
        expect(scenario.createFn).toBeInstanceOf(Function);
      }
    });
  });

  describe('createScenarioById', () => {
    it('should create scenario by valid ID', () => {
      const log = createScenarioById('access-control-ransomware');

      expect(log).not.toBeNull();
      expect(log?.incident.title).toContain('Access Control');
    });

    it('should return null for invalid ID', () => {
      const log = createScenarioById('invalid-scenario');

      expect(log).toBeNull();
    });
  });
});
