/**
 * Data Pipeline Health Tracking
 *
 * Simulates realistic data pipeline stages faithfully based on top software
 * providers' designs/functions (generic names, no trademark cosplay).
 *
 * Pipeline stages:
 * Source → Normalize/Enrich → Correlate → Triage Queue → Case/Activity → COP/ESRM Decision → AAR Feedback
 *
 * Health metrics:
 * - Latency (lag)
 * - Drop rate
 * - Enrichment miss rate
 *
 * Reflects ACS/VMS/SIEM/alarm/OSINT/tip/dispatch intake patterns.
 */

import type { DecisionLog, ScenarioInject } from './types.js';

/**
 * Pipeline stage identifiers
 */
export type PipelineStage =
  | 'SOURCE'
  | 'NORMALIZE'
  | 'ENRICH'
  | 'CORRELATE'
  | 'TRIAGE'
  | 'CASE'
  | 'DECISION'
  | 'AAR';

/**
 * Source types for intake channels
 */
export type SourceType =
  | 'ACS'      // Access Control System
  | 'VMS'      // Video Management System
  | 'SIEM'     // Security Information & Event Management
  | 'ALARM'    // Alarm/Intrusion Detection
  | 'OSINT'    // Open Source Intelligence
  | 'TIP'      // Threat Intelligence Platform
  | 'DISPATCH' // Dispatch/CAD
  | 'HUMINT'   // Human Intelligence
  | 'MANUAL';  // Manual entry

/**
 * Health status for pipeline components
 */
export type PipelineHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';

/**
 * Single pipeline stage health metrics
 */
export interface StageHealth {
  stage: PipelineStage;
  status: PipelineHealthStatus;
  latencyMs: number;
  throughputPerMin: number;
  errorRate: number;
  queueDepth: number;
  lastProcessed: string;
}

/**
 * Source channel health
 */
export interface SourceChannelHealth {
  sourceType: SourceType;
  displayName: string;
  status: PipelineHealthStatus;
  eventsReceived: number;
  eventsDropped: number;
  dropRate: number;
  enrichmentMissRate: number;
  latencyMs: number;
  lastEventTime: string;
}

/**
 * Complete pipeline health snapshot
 */
export interface PipelineHealth {
  timestamp: string;
  overallStatus: PipelineHealthStatus;
  stages: StageHealth[];
  sources: SourceChannelHealth[];
  metrics: {
    totalEventsProcessed: number;
    totalEventsDropped: number;
    averageLatencyMs: number;
    peakLatencyMs: number;
    enrichmentSuccessRate: number;
    correlationHitRate: number;
    triageEfficiency: number;
    decisionThroughput: number;
  };
  alerts: PipelineAlert[];
}

/**
 * Pipeline alert for degraded conditions
 */
export interface PipelineAlert {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  stage: PipelineStage | SourceType;
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

/**
 * Pipeline stage display configuration
 */
export const PIPELINE_STAGE_CONFIG: Record<PipelineStage, { name: string; description: string; icon: string }> = {
  SOURCE: {
    name: 'Source Intake',
    description: 'Raw event ingestion from security systems',
    icon: 'Radio',
  },
  NORMALIZE: {
    name: 'Normalize',
    description: 'Schema standardization and field mapping',
    icon: 'Filter',
  },
  ENRICH: {
    name: 'Enrich',
    description: 'Context addition: asset info, threat intel, geo',
    icon: 'Layers',
  },
  CORRELATE: {
    name: 'Correlate',
    description: 'Cross-source event correlation and entity linking',
    icon: 'Link2',
  },
  TRIAGE: {
    name: 'Triage Queue',
    description: 'Priority sorting and analyst routing',
    icon: 'ListOrdered',
  },
  CASE: {
    name: 'Case/Activity',
    description: 'Incident bundling and workflow assignment',
    icon: 'Briefcase',
  },
  DECISION: {
    name: 'COP/Decision',
    description: 'Common Operating Picture and posture decision',
    icon: 'Target',
  },
  AAR: {
    name: 'AAR Feedback',
    description: 'After-action review and continuous improvement',
    icon: 'BarChart3',
  },
};

/**
 * Source channel display configuration
 */
export const SOURCE_CHANNEL_CONFIG: Record<SourceType, { name: string; description: string }> = {
  ACS: {
    name: 'Access Control',
    description: 'Badge readers, doors, credentials',
  },
  VMS: {
    name: 'Video Management',
    description: 'Camera feeds, analytics, motion alerts',
  },
  SIEM: {
    name: 'Security Analytics',
    description: 'Log aggregation, threat detection, correlation',
  },
  ALARM: {
    name: 'Alarm Systems',
    description: 'Intrusion detection, glass break, perimeter',
  },
  OSINT: {
    name: 'Open Source Intel',
    description: 'Dark web, social media, news monitoring',
  },
  TIP: {
    name: 'Threat Intel',
    description: 'IOC feeds, ISAC advisories, vendor alerts',
  },
  DISPATCH: {
    name: 'Dispatch/CAD',
    description: 'Guard dispatch, patrol tracking, response',
  },
  HUMINT: {
    name: 'Human Intel',
    description: 'Source reports, tips, verbal briefings',
  },
  MANUAL: {
    name: 'Manual Entry',
    description: 'Analyst observations, phone calls, walk-ins',
  },
};

/**
 * Calculate pipeline stage health based on simulation state
 */
function calculateStageHealth(
  stage: PipelineStage,
  log: DecisionLog,
  revealedInjects: ScenarioInject[],
  elapsedSeconds: number
): StageHealth {
  const baseLatency: Record<PipelineStage, number> = {
    SOURCE: 50,
    NORMALIZE: 100,
    ENRICH: 200,
    CORRELATE: 300,
    TRIAGE: 150,
    CASE: 250,
    DECISION: 500,
    AAR: 1000,
  };

  const decisionCount = log.decisions.length;
  const injectCount = revealedInjects.length;

  const loadFactor = Math.min(2, (injectCount + 1) / 3);
  const latencyMs = Math.round(baseLatency[stage] * loadFactor);

  const throughputPerMin = stage === 'DECISION' 
    ? decisionCount 
    : Math.round((injectCount / Math.max(1, elapsedSeconds / 60)) * 10);

  const errorRate = Math.max(0, Math.min(15, (loadFactor - 1) * 10 + Math.random() * 2));
  const queueDepth = stage === 'TRIAGE' 
    ? revealedInjects.filter((i) => !log.decisions.some((d) => d.title === i.title)).length
    : Math.round(loadFactor * 2);

  const status: PipelineHealthStatus =
    errorRate > 10 ? 'CRITICAL' :
    errorRate > 5 ? 'DEGRADED' :
    'HEALTHY';

  return {
    stage,
    status,
    latencyMs,
    throughputPerMin,
    errorRate: Math.round(errorRate * 10) / 10,
    queueDepth,
    lastProcessed: new Date().toISOString(),
  };
}

/**
 * Calculate source channel health
 */
function calculateSourceHealth(
  sourceType: SourceType,
  injects: ScenarioInject[],
  _elapsedSeconds: number
): SourceChannelHealth {
  const sourceInjects = injects.filter((inject) => {
    const source = (inject as unknown as { sourceType?: string }).sourceType;
    return source === sourceType || (!source && sourceType === 'MANUAL');
  });

  const eventsReceived = sourceInjects.length + Math.floor(Math.random() * 5);
  const eventsDropped = Math.floor(Math.random() * Math.max(0, eventsReceived * 0.05));
  const dropRate = eventsReceived > 0 ? Math.round((eventsDropped / eventsReceived) * 100) : 0;

  const enrichmentMissRate = Math.round(Math.random() * 10);
  const latencyMs = 50 + Math.floor(Math.random() * 150);

  const status: PipelineHealthStatus =
    dropRate > 10 || enrichmentMissRate > 15 ? 'CRITICAL' :
    dropRate > 5 || enrichmentMissRate > 10 ? 'DEGRADED' :
    'HEALTHY';

  return {
    sourceType,
    displayName: SOURCE_CHANNEL_CONFIG[sourceType].name,
    status,
    eventsReceived,
    eventsDropped,
    dropRate,
    enrichmentMissRate,
    latencyMs,
    lastEventTime: new Date().toISOString(),
  };
}

/**
 * Generate pipeline alerts from health data
 */
function generateAlerts(
  stages: StageHealth[],
  sources: SourceChannelHealth[]
): PipelineAlert[] {
  const alerts: PipelineAlert[] = [];
  let alertId = 1;

  for (const stage of stages) {
    if (stage.errorRate > 5) {
      alerts.push({
        id: `alert-${alertId++}`,
        timestamp: new Date().toISOString(),
        severity: stage.errorRate > 10 ? 'CRITICAL' : 'WARNING',
        stage: stage.stage,
        message: `${PIPELINE_STAGE_CONFIG[stage.stage].name} error rate elevated`,
        metric: 'errorRate',
        value: stage.errorRate,
        threshold: 5,
      });
    }

    if (stage.latencyMs > 500) {
      alerts.push({
        id: `alert-${alertId++}`,
        timestamp: new Date().toISOString(),
        severity: stage.latencyMs > 1000 ? 'CRITICAL' : 'WARNING',
        stage: stage.stage,
        message: `${PIPELINE_STAGE_CONFIG[stage.stage].name} latency high`,
        metric: 'latencyMs',
        value: stage.latencyMs,
        threshold: 500,
      });
    }
  }

  for (const source of sources) {
    if (source.dropRate > 5) {
      alerts.push({
        id: `alert-${alertId++}`,
        timestamp: new Date().toISOString(),
        severity: source.dropRate > 10 ? 'CRITICAL' : 'WARNING',
        stage: source.sourceType,
        message: `${source.displayName} event drop rate elevated`,
        metric: 'dropRate',
        value: source.dropRate,
        threshold: 5,
      });
    }

    if (source.enrichmentMissRate > 10) {
      alerts.push({
        id: `alert-${alertId++}`,
        timestamp: new Date().toISOString(),
        severity: source.enrichmentMissRate > 15 ? 'CRITICAL' : 'WARNING',
        stage: source.sourceType,
        message: `${source.displayName} enrichment miss rate elevated`,
        metric: 'enrichmentMissRate',
        value: source.enrichmentMissRate,
        threshold: 10,
      });
    }
  }

  return alerts;
}

/**
 * Create complete pipeline health snapshot
 */
export function createPipelineHealth(
  log: DecisionLog,
  revealedInjects: ScenarioInject[],
  elapsedSeconds: number
): PipelineHealth {
  const timestamp = new Date().toISOString();

  const stages: StageHealth[] = (
    ['SOURCE', 'NORMALIZE', 'ENRICH', 'CORRELATE', 'TRIAGE', 'CASE', 'DECISION', 'AAR'] as PipelineStage[]
  ).map((stage) => calculateStageHealth(stage, log, revealedInjects, elapsedSeconds));

  const sources: SourceChannelHealth[] = (
    ['ACS', 'VMS', 'SIEM', 'ALARM', 'OSINT', 'TIP', 'DISPATCH', 'HUMINT'] as SourceType[]
  ).map((sourceType) => calculateSourceHealth(sourceType, revealedInjects, elapsedSeconds));

  const alerts = generateAlerts(stages, sources);

  const criticalStages = stages.filter((s) => s.status === 'CRITICAL').length;
  const degradedStages = stages.filter((s) => s.status === 'DEGRADED').length;
  const criticalSources = sources.filter((s) => s.status === 'CRITICAL').length;

  const overallStatus: PipelineHealthStatus =
    criticalStages > 0 || criticalSources > 1 ? 'CRITICAL' :
    degradedStages > 2 || criticalSources > 0 ? 'DEGRADED' :
    'HEALTHY';

  const totalEventsProcessed = sources.reduce((sum, s) => sum + s.eventsReceived, 0);
  const totalEventsDropped = sources.reduce((sum, s) => sum + s.eventsDropped, 0);
  const averageLatencyMs = Math.round(stages.reduce((sum, s) => sum + s.latencyMs, 0) / stages.length);
  const peakLatencyMs = Math.max(...stages.map((s) => s.latencyMs));

  const enrichmentSuccessRate = 100 - Math.round(
    sources.reduce((sum, s) => sum + s.enrichmentMissRate, 0) / sources.length
  );

  const correlationHitRate = Math.min(100, 70 + log.decisions.length * 5);
  
  const unhandledInjects = revealedInjects.filter(
    (i) => !log.decisions.some((d) => d.title === i.title)
  ).length;
  const triageEfficiency = revealedInjects.length > 0
    ? Math.round(((revealedInjects.length - unhandledInjects) / revealedInjects.length) * 100)
    : 100;

  const decisionThroughput = elapsedSeconds > 0
    ? Math.round((log.decisions.length / (elapsedSeconds / 60)) * 10) / 10
    : 0;

  return {
    timestamp,
    overallStatus,
    stages,
    sources,
    metrics: {
      totalEventsProcessed,
      totalEventsDropped,
      averageLatencyMs,
      peakLatencyMs,
      enrichmentSuccessRate,
      correlationHitRate,
      triageEfficiency,
      decisionThroughput,
    },
    alerts,
  };
}

/**
 * Pipeline stage flow for visualization
 */
export const PIPELINE_FLOW: { from: PipelineStage; to: PipelineStage }[] = [
  { from: 'SOURCE', to: 'NORMALIZE' },
  { from: 'NORMALIZE', to: 'ENRICH' },
  { from: 'ENRICH', to: 'CORRELATE' },
  { from: 'CORRELATE', to: 'TRIAGE' },
  { from: 'TRIAGE', to: 'CASE' },
  { from: 'CASE', to: 'DECISION' },
  { from: 'DECISION', to: 'AAR' },
];

/**
 * Pipeline glossary definitions for Field Guide
 */
export const PIPELINE_DEFINITIONS: Record<string, { name: string; definition: string; realWorldAnalog: string }> = {
  SOURCE: {
    name: 'Source Intake',
    definition: 'Entry point for raw events from security systems. Handles protocol translation and initial validation.',
    realWorldAnalog: 'Similar to SIEM log collectors, PSIM event receivers, or CAD interfaces.',
  },
  NORMALIZE: {
    name: 'Normalize',
    definition: 'Transforms raw events into a common schema. Maps vendor-specific fields to standard taxonomy.',
    realWorldAnalog: 'Like SIEM parsing pipelines or CEF/LEEF normalization.',
  },
  ENRICH: {
    name: 'Enrich',
    definition: 'Adds context from reference data: asset ownership, threat intel, geo location, user identity.',
    realWorldAnalog: 'Similar to SOAR enrichment playbooks or CMDB lookups.',
  },
  CORRELATE: {
    name: 'Correlate',
    definition: 'Links related events across sources and time. Identifies patterns and entity relationships.',
    realWorldAnalog: 'Like SIEM correlation rules or graph-based entity resolution.',
  },
  TRIAGE: {
    name: 'Triage Queue',
    definition: 'Priority-sorted queue for analyst attention. Routes based on severity, asset criticality, SLA.',
    realWorldAnalog: 'Similar to SOC ticket queues or PSIM event prioritization.',
  },
  CASE: {
    name: 'Case/Activity',
    definition: 'Bundles related events into incidents. Assigns workflow, tracks investigation state.',
    realWorldAnalog: 'Like case management in ITSM or PSIM incident workflows.',
  },
  DECISION: {
    name: 'COP/Decision',
    definition: 'Common Operating Picture integration and posture decision recording. ESRM treatment selection.',
    realWorldAnalog: 'Similar to situation room dashboards or command center consoles.',
  },
  AAR: {
    name: 'AAR Feedback',
    definition: 'After-action review and metrics feedback. Lessons learned flow back to improve detection and response.',
    realWorldAnalog: 'Like post-incident review workflows or continuous improvement loops.',
  },
};
