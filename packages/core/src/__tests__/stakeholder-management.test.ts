/**
 * Stakeholder Management Module Tests
 *
 * Tests for GSOC stakeholder management functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ESCALATION_FRAMEWORK,
  createDefaultStakeholderMap,
  categorizeStakeholders,
  determineEscalationLevel,
  calculateExecutivePresenceScore,
  createStakeholderNPCs,
  type MappedStakeholder,
  type ExecutiveBriefing,
} from '../stakeholder-management.js';

describe('Stakeholder Management', () => {
  describe('DEFAULT_ESCALATION_FRAMEWORK', () => {
    it('should have 5 escalation levels', () => {
      expect(DEFAULT_ESCALATION_FRAMEWORK).toHaveLength(5);
    });

    it('should have increasing response times', () => {
      for (let i = 1; i < DEFAULT_ESCALATION_FRAMEWORK.length; i++) {
        expect(DEFAULT_ESCALATION_FRAMEWORK[i].responseTimeMinutes).toBeLessThan(
          DEFAULT_ESCALATION_FRAMEWORK[i - 1].responseTimeMinutes
        );
      }
    });

    it('should have level 5 with shortest response time', () => {
      const level5 = DEFAULT_ESCALATION_FRAMEWORK.find((l) => l.level === 5);
      expect(level5?.responseTimeMinutes).toBe(5);
    });

    it('should authorize wake-up for levels 3+', () => {
      const level1 = DEFAULT_ESCALATION_FRAMEWORK.find((l) => l.level === 1);
      const level2 = DEFAULT_ESCALATION_FRAMEWORK.find((l) => l.level === 2);
      const level3 = DEFAULT_ESCALATION_FRAMEWORK.find((l) => l.level === 3);
      const level4 = DEFAULT_ESCALATION_FRAMEWORK.find((l) => l.level === 4);
      const level5 = DEFAULT_ESCALATION_FRAMEWORK.find((l) => l.level === 5);

      expect(level1?.wakeUpAuthorized).toBe(false);
      expect(level2?.wakeUpAuthorized).toBe(false);
      expect(level3?.wakeUpAuthorized).toBe(true);
      expect(level4?.wakeUpAuthorized).toBe(true);
      expect(level5?.wakeUpAuthorized).toBe(true);
    });
  });

  describe('createDefaultStakeholderMap', () => {
    it('should create a valid stakeholder map', () => {
      const map = createDefaultStakeholderMap('test-scenario');

      expect(map).toBeDefined();
      expect(map.id).toContain('test-scenario');
      expect(map.stakeholders.length).toBeGreaterThan(0);
    });

    it('should include key stakeholder categories', () => {
      const map = createDefaultStakeholderMap('test-scenario');
      const categories = map.stakeholders.map((s) => s.category);

      expect(categories).toContain('EXECUTIVE');
      expect(categories).toContain('CYBER');
      expect(categories).toContain('LEGAL');
      expect(categories).toContain('FACILITIES');
    });

    it('should have decision makers in the stakeholder list', () => {
      const map = createDefaultStakeholderMap('test-scenario');
      const decisionMakers = map.stakeholders.filter((s) => s.influence === 'DECISION_MAKER');

      expect(decisionMakers.length).toBeGreaterThan(0);
    });

    it('should populate the quadrant correctly', () => {
      const map = createDefaultStakeholderMap('test-scenario');

      expect(map.quadrant.highPowerHighInterest.length).toBeGreaterThan(0);
    });
  });

  describe('categorizeStakeholders', () => {
    it('should categorize stakeholders into correct quadrants', () => {
      const stakeholders: MappedStakeholder[] = [
        {
          id: 'sh-1',
          name: 'Decision Maker High Interest',
          title: 'CSO',
          organization: 'Security',
          category: 'EXECUTIVE',
          influence: 'DECISION_MAKER',
          interest: 'HIGH',
          communicationPreference: {
            method: 'PHONE',
            frequency: 'REAL_TIME',
            escalationThreshold: 'HIGH',
          },
          relationship: { strength: 'STRONG', preferredStyle: 'ACTION_ORIENTED' },
          concerns: [],
          expectations: [],
          decisionAuthority: [],
        },
        {
          id: 'sh-2',
          name: 'Influencer Low Interest',
          title: 'Board Member',
          organization: 'Board',
          category: 'EXECUTIVE',
          influence: 'KEY_INFLUENCER',
          interest: 'LOW',
          communicationPreference: {
            method: 'EMAIL',
            frequency: 'AS_NEEDED',
            escalationThreshold: 'CRITICAL',
          },
          relationship: { strength: 'WEAK', preferredStyle: 'DATA_DRIVEN' },
          concerns: [],
          expectations: [],
          decisionAuthority: [],
        },
        {
          id: 'sh-3',
          name: 'Contributor High Interest',
          title: 'Site Manager',
          organization: 'Operations',
          category: 'FACILITIES',
          influence: 'CONTRIBUTOR',
          interest: 'HIGH',
          communicationPreference: {
            method: 'PHONE',
            frequency: 'HOURLY',
            escalationThreshold: 'MEDIUM',
          },
          relationship: { strength: 'DEVELOPING', preferredStyle: 'ACTION_ORIENTED' },
          concerns: [],
          expectations: [],
          decisionAuthority: [],
        },
      ];

      const quadrant = categorizeStakeholders(stakeholders);

      expect(quadrant.highPowerHighInterest).toContain('sh-1');
      expect(quadrant.highPowerLowInterest).toContain('sh-2');
      expect(quadrant.lowPowerHighInterest).toContain('sh-3');
    });
  });

  describe('determineEscalationLevel', () => {
    it('should return level 5 for life safety threats', () => {
      const level = determineEscalationLevel({
        businessImpact: 'HIGH',
        lifeSafety: true,
        executiveInvolved: false,
        regulatoryImplication: false,
        mediaExposure: false,
        activeThread: false,
      });

      expect(level.level).toBe(5);
    });

    it('should return level 5 for active threats', () => {
      const level = determineEscalationLevel({
        businessImpact: 'LOW',
        lifeSafety: false,
        executiveInvolved: false,
        regulatoryImplication: false,
        mediaExposure: false,
        activeThread: true,
      });

      expect(level.level).toBe(5);
    });

    it('should return level 4 for critical business impact', () => {
      const level = determineEscalationLevel({
        businessImpact: 'CRITICAL',
        lifeSafety: false,
        executiveInvolved: false,
        regulatoryImplication: false,
        mediaExposure: false,
        activeThread: false,
      });

      expect(level.level).toBe(4);
    });

    it('should return level 4 for executive involvement', () => {
      const level = determineEscalationLevel({
        businessImpact: 'MEDIUM',
        lifeSafety: false,
        executiveInvolved: true,
        regulatoryImplication: false,
        mediaExposure: false,
        activeThread: false,
      });

      expect(level.level).toBe(4);
    });

    it('should return level 3 for regulatory implications', () => {
      const level = determineEscalationLevel({
        businessImpact: 'MEDIUM',
        lifeSafety: false,
        executiveInvolved: false,
        regulatoryImplication: true,
        mediaExposure: false,
        activeThread: false,
      });

      expect(level.level).toBe(3);
    });

    it('should return level 1 for low impact routine incidents', () => {
      const level = determineEscalationLevel({
        businessImpact: 'LOW',
        lifeSafety: false,
        executiveInvolved: false,
        regulatoryImplication: false,
        mediaExposure: false,
        activeThread: false,
      });

      expect(level.level).toBe(1);
    });
  });

  describe('calculateExecutivePresenceScore', () => {
    it('should give high score for complete briefings', () => {
      const briefing: ExecutiveBriefing = {
        id: 'brief-1',
        timestamp: new Date().toISOString(),
        recipientId: 'sh-cso',
        recipientName: 'CSO',
        recipientTitle: 'Chief Security Officer',
        briefingType: 'DECISION_REQUIRED',
        deliveryMethod: 'PHONE',
        content: {
          situation: 'Detailed situation description covering all key points.',
          assessment: 'Thorough assessment of risks and implications.',
          recommendation: 'Clear recommendation with supporting rationale.',
          options: [
            {
              id: 'opt-1',
              description: 'Option 1',
              pros: ['Pro'],
              cons: ['Con'],
              cost: 'LOW',
              risk: 'LOW',
              recommended: true,
            },
            {
              id: 'opt-2',
              description: 'Option 2',
              pros: ['Pro'],
              cons: ['Con'],
              cost: 'HIGH',
              risk: 'MEDIUM',
              recommended: false,
            },
          ],
        },
        questionsFaced: ['Question 1', 'Question 2'],
        responsesGiven: ['Response 1', 'Response 2'],
        outcome: 'DECISION_MADE',
        followUpRequired: [],
      };

      const score = calculateExecutivePresenceScore(briefing);

      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should give lower score for incomplete briefings', () => {
      const briefing: ExecutiveBriefing = {
        id: 'brief-1',
        timestamp: new Date().toISOString(),
        recipientId: 'sh-cso',
        recipientName: 'CSO',
        recipientTitle: 'Chief Security Officer',
        briefingType: 'STATUS_UPDATE',
        deliveryMethod: 'EMAIL',
        content: {
          situation: 'Brief',
          assessment: 'Short',
        },
        questionsFaced: ['Question 1', 'Question 2'],
        responsesGiven: [],
        outcome: 'DEFERRED',
        followUpRequired: ['Follow up'],
      };

      const score = calculateExecutivePresenceScore(briefing);

      expect(score).toBeLessThan(80);
    });
  });

  describe('createStakeholderNPCs', () => {
    it('should create NPCs for all stakeholders', () => {
      const map = createDefaultStakeholderMap('test-scenario');
      const npcs = createStakeholderNPCs(map);

      expect(npcs).toHaveLength(map.stakeholders.length);
    });

    it('should map personality traits based on stakeholder attributes', () => {
      const map = createDefaultStakeholderMap('test-scenario');
      const npcs = createStakeholderNPCs(map);

      const legalNpc = npcs.find((n) => n.stakeholder.category === 'LEGAL');
      expect(legalNpc?.personality.riskTolerance).toBe('RISK_AVERSE');

      const execNpc = npcs.find((n) => n.stakeholder.category === 'EXECUTIVE');
      expect(execNpc?.personality.underPressure).toBe('DEMANDING');
    });

    it('should initialize NPCs with neutral mood', () => {
      const map = createDefaultStakeholderMap('test-scenario');
      const npcs = createStakeholderNPCs(map);

      for (const npc of npcs) {
        expect(npc.currentMood).toBe('NEUTRAL');
      }
    });
  });
});
