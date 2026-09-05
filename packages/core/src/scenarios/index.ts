/**
 * GSOC Decision Operations - Synthetic Training Scenarios
 *
 * IMPORTANT: These scenarios are entirely fictional and designed for
 * training and exercise purposes only. Any resemblance to actual
 * incidents, companies, or events is purely coincidental.
 *
 * These scenarios help GSOC professionals practice structured decision-making
 * under conditions of incomplete information.
 */

import type { DecisionLog, VendorContext } from '../types.js';
import { createDecisionLog } from '../decision-log.js';

/**
 * Scenario 1: Access Control Vendor Ransomware
 *
 * A fictional scenario where your organization's access control
 * system vendor experiences a ransomware attack, potentially
 * affecting badge systems across multiple sites.
 */
export function createAccessControlVendorScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'SecureAccess Solutions (FICTIONAL)',
    vendorType: 'Physical Access Control System Provider',
    servicesAffected: [
      'Badge credential management',
      'Access control panel communications',
      'Mobile credential app',
      'Visitor management integration',
    ],
    slaRequirements: '99.9% uptime, 4-hour response for critical issues',
    alternateVendors: ['Manual key override', 'Security officer stationed access'],
    lastKnownGoodState: 'Systems operational 6 hours ago',
  };

  const log = createDecisionLog({
    title: 'Access Control Vendor Ransomware Incident',
    description:
      'Vendor (SecureAccess Solutions - FICTIONAL) has notified us of a ransomware attack ' +
      'affecting their cloud infrastructure. Badge systems are intermittently available. ' +
      'Scope of data exposure unknown.',
    severity: 'HIGH',
    impactCategories: ['ACCESS_CONTROL', 'VISITOR_MANAGEMENT', 'PHYSICAL_SECURITY'],
    reportedBy: 'Vendor Account Manager',
    createdBy: 'GSOC Manager',
    organization: 'Training Organization',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
  });

  return log;
}

/**
 * Scenario 2: Video Management System Compromise
 *
 * A fictional scenario where anomalous behavior is detected in
 * your video management system, potentially indicating a
 * supply chain compromise.
 */
export function createVideoSystemCompromiseScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'VisionGuard VMS (FICTIONAL)',
    vendorType: 'Video Management System Provider',
    servicesAffected: [
      'Live video streaming',
      'Video recording and storage',
      'Analytics and alerts',
      'Remote viewing application',
    ],
    slaRequirements: '99.95% uptime, 24/7 support',
    alternateVendors: ['Local NVR recording', 'Mobile device documentation'],
    lastKnownGoodState: 'Normal operations 12 hours ago',
  };

  const log = createDecisionLog({
    title: 'Video Management System Supply Chain Concern',
    description:
      'IT Security has flagged unusual network traffic patterns from VMS servers. ' +
      'Vendor (VisionGuard - FICTIONAL) has not confirmed a breach but is investigating. ' +
      'Potential supply chain compromise through recent software update.',
    severity: 'HIGH',
    impactCategories: ['VIDEO_SURVEILLANCE', 'DATA_INTEGRITY', 'INVESTIGATIONS'],
    reportedBy: 'IT Security Operations Center',
    createdBy: 'GSOC Manager',
    organization: 'Training Organization',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
  });

  return log;
}

/**
 * Scenario 3: Alarm Monitoring Service Outage
 *
 * A fictional scenario where your third-party alarm monitoring
 * service experiences a significant outage during off-hours.
 */
export function createAlarmMonitoringOutageScenario(): DecisionLog {
  const vendorContext: VendorContext = {
    vendorName: 'CentralStation Pro (FICTIONAL)',
    vendorType: 'Third-Party Alarm Monitoring Service',
    servicesAffected: [
      'Intrusion alarm monitoring',
      'Fire alarm supervision',
      'Panic/duress alarm response',
      'Environmental sensor monitoring',
    ],
    slaRequirements: '99.99% uptime, immediate dispatch protocols',
    alternateVendors: ['Direct GSOC monitoring', 'Local police/fire direct notification'],
    lastKnownGoodState: 'Full service 2 hours ago',
  };

  const log = createDecisionLog({
    title: 'Third-Party Alarm Monitoring Service Outage',
    description:
      'CentralStation Pro (FICTIONAL) reports major infrastructure failure. ' +
      'Alarm signals not being received or processed. Affects all monitored sites. ' +
      'Cause under investigation - potential cyber incident not ruled out.',
    severity: 'CRITICAL',
    impactCategories: ['ALARM_MONITORING', 'PHYSICAL_SECURITY', 'BUSINESS_CONTINUITY'],
    reportedBy: 'Vendor NOC',
    createdBy: 'GSOC Supervisor',
    organization: 'Training Organization',
    exerciseMode: true,
    syntheticScenario: true,
    vendorContext,
  });

  return log;
}

/**
 * Get all available synthetic scenarios
 */
export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  severity: string;
  vendorType: string;
  createFn: () => DecisionLog;
}

export function getAvailableScenarios(): ScenarioInfo[] {
  return [
    {
      id: 'access-control-ransomware',
      name: 'Access Control Vendor Ransomware',
      description:
        'Badge system vendor experiences ransomware attack affecting credential management.',
      severity: 'HIGH',
      vendorType: 'Physical Access Control',
      createFn: createAccessControlVendorScenario,
    },
    {
      id: 'video-system-compromise',
      name: 'Video Management Supply Chain Concern',
      description:
        'Anomalous network behavior from VMS suggests potential supply chain compromise.',
      severity: 'HIGH',
      vendorType: 'Video Management System',
      createFn: createVideoSystemCompromiseScenario,
    },
    {
      id: 'alarm-monitoring-outage',
      name: 'Alarm Monitoring Service Outage',
      description:
        'Third-party alarm monitoring service experiences critical infrastructure failure.',
      severity: 'CRITICAL',
      vendorType: 'Alarm Monitoring Service',
      createFn: createAlarmMonitoringOutageScenario,
    },
  ];
}

/**
 * Create a scenario by ID
 */
export function createScenarioById(scenarioId: string): DecisionLog | null {
  const scenario = getAvailableScenarios().find((s) => s.id === scenarioId);
  return scenario ? scenario.createFn() : null;
}
