/**
 * Team Management Module Tests
 *
 * Tests for GSOC/CMIC operator team management functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  REGION_CONFIGS,
  calculateTeamUtilization,
  identifyCoverageGaps,
  generateLoadBalanceRecommendations,
  evaluateHandoffQuality,
  createInitialRoster,
  type ShiftHandoff,
  type LoadBalanceState,
} from '../team-management.js';

describe('Team Management', () => {
  describe('REGION_CONFIGS', () => {
    it('should define all three global regions', () => {
      expect(REGION_CONFIGS.AMERICAS).toBeDefined();
      expect(REGION_CONFIGS.EMEA).toBeDefined();
      expect(REGION_CONFIGS.APAC).toBeDefined();
    });

    it('should have valid timezone data for each region', () => {
      expect(REGION_CONFIGS.AMERICAS.timezone).toBe('America/New_York');
      expect(REGION_CONFIGS.EMEA.timezone).toBe('Europe/London');
      expect(REGION_CONFIGS.APAC.timezone).toBe('Asia/Singapore');
    });

    it('should have primary hours within 0-24 range', () => {
      for (const region of Object.values(REGION_CONFIGS)) {
        expect(region.primaryHours.start).toBeGreaterThanOrEqual(0);
        expect(region.primaryHours.start).toBeLessThan(24);
        expect(region.primaryHours.end).toBeGreaterThan(0);
        expect(region.primaryHours.end).toBeLessThanOrEqual(24);
      }
    });
  });

  describe('createInitialRoster', () => {
    it('should create a valid team roster', () => {
      const roster = createInitialRoster();

      expect(roster).toBeDefined();
      expect(roster.timestamp).toBeDefined();
      expect(roster.activeShift).toBe('AMERICAS');
      expect(roster.operators).toHaveLength(7);
    });

    it('should create operators for all three regions', () => {
      const roster = createInitialRoster();

      const amerOps = roster.operators.filter((o) => o.region === 'AMERICAS');
      const emeaOps = roster.operators.filter((o) => o.region === 'EMEA');
      const apacOps = roster.operators.filter((o) => o.region === 'APAC');

      expect(amerOps.length).toBeGreaterThan(0);
      expect(emeaOps.length).toBeGreaterThan(0);
      expect(apacOps.length).toBeGreaterThan(0);
    });

    it('should create regional leads for all regions', () => {
      const roster = createInitialRoster();

      expect(roster.regionalLeads.AMERICAS).toBeDefined();
      expect(roster.regionalLeads.EMEA).toBeDefined();
      expect(roster.regionalLeads.APAC).toBeDefined();
    });

    it('should have valid team health metrics', () => {
      const roster = createInitialRoster();

      expect(['HIGH', 'MODERATE', 'LOW']).toContain(roster.teamHealth.overallMorale);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(roster.teamHealth.burnoutRisk);
      expect(roster.teamHealth.trainingDebt).toBeGreaterThanOrEqual(0);
      expect(roster.teamHealth.vacancyCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateTeamUtilization', () => {
    it('should calculate utilization per region', () => {
      const roster = createInitialRoster();
      const utilization = calculateTeamUtilization(roster);

      expect(utilization.AMERICAS).toBeDefined();
      expect(utilization.EMEA).toBeDefined();
      expect(utilization.APAC).toBeDefined();
    });

    it('should return 0 for regions with no active operators', () => {
      const roster = createInitialRoster();
      roster.operators = roster.operators.filter((o) => o.region !== 'APAC');
      roster.operators.forEach((o) => {
        if (o.region !== 'AMERICAS') o.availability.currentShift = false;
      });

      const utilization = calculateTeamUtilization(roster);

      expect(utilization.APAC).toBe(0);
    });

    it('should calculate average utilization correctly', () => {
      const roster = createInitialRoster();
      roster.operators = [
        {
          ...roster.operators[0],
          region: 'AMERICAS',
          availability: { currentShift: true, onCall: false, maxHoursRemaining: 8 },
          workload: { activeIncidents: 0, tasksQueued: 0, utilizationPercent: 50 },
        },
        {
          ...roster.operators[1],
          region: 'AMERICAS',
          availability: { currentShift: true, onCall: false, maxHoursRemaining: 8 },
          workload: { activeIncidents: 0, tasksQueued: 0, utilizationPercent: 100 },
        },
      ];

      const utilization = calculateTeamUtilization(roster);

      expect(utilization.AMERICAS).toBe(75);
    });
  });

  describe('evaluateHandoffQuality', () => {
    it('should evaluate excellent handoffs correctly', () => {
      const handoff: ShiftHandoff = {
        id: 'ho-1',
        timestamp: new Date().toISOString(),
        fromRegion: 'AMERICAS',
        toRegion: 'EMEA',
        outgoingLead: 'Maria',
        incomingLead: 'Sophie',
        openIncidents: 2,
        activeEscalations: 0,
        pendingDecisions: ['Decision 1'],
        criticalWatchItems: ['Watch item 1'],
        handoffQuality: 'EXCELLENT',
        briefingComplete: true,
        followUpsRequired: ['Follow up 1'],
      };

      const quality = evaluateHandoffQuality(handoff);

      expect(quality).toBe('EXCELLENT');
    });

    it('should evaluate poor handoffs correctly', () => {
      const handoff: ShiftHandoff = {
        id: 'ho-1',
        timestamp: new Date().toISOString(),
        fromRegion: 'AMERICAS',
        toRegion: 'EMEA',
        outgoingLead: 'Maria',
        incomingLead: 'Sophie',
        openIncidents: 10,
        activeEscalations: 5,
        pendingDecisions: ['D1', 'D2', 'D3', 'D4', 'D5'],
        criticalWatchItems: [],
        handoffQuality: 'POOR',
        briefingComplete: false,
        followUpsRequired: ['F1', 'F2', 'F3', 'F4', 'F5'],
      };

      const quality = evaluateHandoffQuality(handoff);

      expect(quality).toBe('POOR');
    });
  });

  describe('identifyCoverageGaps', () => {
    it('should identify gaps when skills are missing', () => {
      const roster = createInitialRoster();
      roster.operators.forEach((o) => {
        o.availability.currentShift = false;
      });

      const gaps = identifyCoverageGaps(roster);

      expect(gaps.length).toBeGreaterThan(0);
    });

    it('should not identify gaps when all required skills are covered', () => {
      const roster = createInitialRoster();

      roster.operators.forEach((o) => {
        o.availability.currentShift = true;
        o.skills = [
          { skill: 'TRIAGE', level: 5, certification: 'CERTIFIED' },
          { skill: 'INTEL_ANALYSIS', level: 5, certification: 'CERTIFIED' },
          { skill: 'INCIDENT_MANAGEMENT', level: 5, certification: 'CERTIFIED' },
          { skill: 'STAKEHOLDER_COMMS', level: 5, certification: 'CERTIFIED' },
        ];
      });

      const gaps = identifyCoverageGaps(roster);

      expect(gaps.length).toBe(0);
    });
  });

  describe('generateLoadBalanceRecommendations', () => {
    it('should recommend redistribution for overloaded regions', () => {
      const state: LoadBalanceState = {
        timestamp: new Date().toISOString(),
        globalLoad: 75,
        regionLoads: { AMERICAS: 95, EMEA: 40, APAC: 30 },
        hotspots: [{ region: 'AMERICAS', loadPercent: 95, queueDepth: 10, avgWaitTime: 15 }],
        recommendedActions: [],
      };

      const recommendations = generateLoadBalanceRecommendations(state);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBe('REDISTRIBUTE');
      expect(recommendations[0].fromRegion).toBe('AMERICAS');
    });

    it('should not recommend actions for balanced loads', () => {
      const state: LoadBalanceState = {
        timestamp: new Date().toISOString(),
        globalLoad: 50,
        regionLoads: { AMERICAS: 50, EMEA: 50, APAC: 50 },
        hotspots: [],
        recommendedActions: [],
      };

      const recommendations = generateLoadBalanceRecommendations(state);

      expect(recommendations.length).toBe(0);
    });
  });
});
