/**
 * GSOC Decision Operations - After-Action Export
 *
 * Generate structured after-action reports in Markdown and JSON formats
 * for documentation, compliance, and continuous improvement.
 */

import type { DecisionLog, AfterActionReport } from './types.js';
import { generateId, now, formatDuration, sortByTimestamp } from './utils.js';
import { calculateStats } from './decision-log.js';

/**
 * Generate an after-action report from a decision log
 */
export function generateAfterActionReport(
  log: DecisionLog,
  lessonsLearned: string[] = [],
  recommendations: string[] = []
): AfterActionReport {
  const stats = calculateStats(log);
  const sortedTimeline = sortByTimestamp(log.timeline, true);
  const keyDecisions = log.decisions.filter(
    (d) => d.posture === 'PAUSE' || d.posture === 'DEGRADE'
  );

  const duration =
    log.incident.status === 'CLOSED' || log.incident.status === 'RESOLVED'
      ? formatDuration(log.incident.detectedAt, log.lastUpdated)
      : formatDuration(log.incident.detectedAt);

  return {
    id: generateId('AAR'),
    generatedAt: now(),
    decisionLogId: log.id,

    executiveSummary: generateExecutiveSummary(log, stats, duration),

    incidentOverview: {
      title: log.incident.title,
      duration,
      severity: log.incident.severity,
      impactSummary: log.incident.impactCategories.join(', '),
    },

    chronology: sortedTimeline,

    decisionAnalysis: {
      totalDecisions: stats.totalDecisions,
      postureBreakdown: stats.postureBreakdown,
      keyDecisions,
    },

    informationQuality: {
      factsCount: stats.totalFacts,
      assumptionsCount: stats.totalAssumptions,
      unknownsResolved: stats.resolvedUnknowns,
      unknownsUnresolved: stats.totalUnknowns - stats.resolvedUnknowns,
      assumptionsValidated: stats.validatedAssumptions,
      assumptionsInvalidated: stats.invalidatedAssumptions,
    },

    lessonsLearned,
    recommendations,

    appendices: {
      fullDecisionLog: log,
      exportFormat: 'BOTH',
    },
  };
}

/**
 * Generate executive summary text
 */
function generateExecutiveSummary(
  log: DecisionLog,
  stats: ReturnType<typeof calculateStats>,
  duration: string
): string {
  const lines: string[] = [];

  lines.push(
    `On ${new Date(log.incident.detectedAt).toLocaleDateString()}, ` +
      `a ${log.incident.severity} severity incident was detected: "${log.incident.title}".`
  );

  if (log.vendorContext) {
    lines.push(
      `The incident involved ${log.vendorContext.vendorName} ` +
        `(${log.vendorContext.vendorType}), affecting ${log.vendorContext.servicesAffected.length} service(s).`
    );
  }

  lines.push(
    `Over ${duration}, the response team made ${stats.totalDecisions} documented decisions ` +
      `(${stats.postureBreakdown.CONTINUE} CONTINUE, ` +
      `${stats.postureBreakdown.DEGRADE} DEGRADE, ` +
      `${stats.postureBreakdown.PAUSE} PAUSE).`
  );

  lines.push(
    `The team tracked ${stats.totalFacts} facts, ` +
      `${stats.totalAssumptions} assumptions, and ` +
      `${stats.totalUnknowns} unknowns.`
  );

  if (stats.criticalUnknowns > 0) {
    lines.push(`${stats.criticalUnknowns} critical unknown(s) remain unresolved.`);
  }

  lines.push(`Current status: ${log.incident.status}.`);

  return lines.join(' ');
}

/**
 * Export after-action report as Markdown
 */
export function exportToMarkdown(report: AfterActionReport): string {
  const lines: string[] = [];
  const log = report.appendices.fullDecisionLog;

  // Header
  lines.push(`# After-Action Report: ${report.incidentOverview.title}`);
  lines.push('');
  lines.push(`**Report ID:** ${report.id}`);
  lines.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push(`**Decision Log ID:** ${report.decisionLogId}`);

  if (log.metadata.exerciseMode || log.metadata.syntheticScenario) {
    lines.push('');
    lines.push(
      '> ⚠️ **EXERCISE/TRAINING SCENARIO** - This report documents a synthetic scenario for training purposes.'
    );
  }

  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(report.executiveSummary);
  lines.push('');

  // Incident Overview
  lines.push('## Incident Overview');
  lines.push('');
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Title | ${report.incidentOverview.title} |`);
  lines.push(`| Severity | ${report.incidentOverview.severity} |`);
  lines.push(`| Duration | ${report.incidentOverview.duration} |`);
  lines.push(`| Impact Areas | ${report.incidentOverview.impactSummary} |`);
  lines.push(`| Status | ${log.incident.status} |`);
  lines.push('');

  // Vendor Context (if applicable)
  if (log.vendorContext) {
    lines.push('### Vendor Context');
    lines.push('');
    lines.push(`| Property | Value |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Vendor | ${log.vendorContext.vendorName} |`);
    lines.push(`| Type | ${log.vendorContext.vendorType} |`);
    lines.push(`| Services Affected | ${log.vendorContext.servicesAffected.join(', ')} |`);
    if (log.vendorContext.slaRequirements) {
      lines.push(`| SLA Requirements | ${log.vendorContext.slaRequirements} |`);
    }
    lines.push('');
  }

  // Timeline
  lines.push('## Incident Timeline');
  lines.push('');
  report.chronology.forEach((event) => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    lines.push(`- **${time}** [${event.type}] ${event.title}`);
    lines.push(`  - ${event.description}`);
  });
  lines.push('');

  // Decision Analysis
  lines.push('## Decision Analysis');
  lines.push('');
  lines.push(`**Total Decisions:** ${report.decisionAnalysis.totalDecisions}`);
  lines.push('');
  lines.push('### Posture Breakdown');
  lines.push('');
  lines.push(`| Posture | Count |`);
  lines.push(`|---------|-------|`);
  lines.push(`| CONTINUE | ${report.decisionAnalysis.postureBreakdown.CONTINUE} |`);
  lines.push(`| DEGRADE | ${report.decisionAnalysis.postureBreakdown.DEGRADE} |`);
  lines.push(`| PAUSE | ${report.decisionAnalysis.postureBreakdown.PAUSE} |`);
  lines.push('');

  if (report.decisionAnalysis.keyDecisions.length > 0) {
    lines.push('### Key Decisions');
    lines.push('');
    report.decisionAnalysis.keyDecisions.forEach((decision) => {
      lines.push(`#### ${decision.title} (${decision.posture})`);
      lines.push('');
      lines.push(`- **Owner:** ${decision.owner} (${decision.ownerRole})`);
      lines.push(`- **Time:** ${new Date(decision.timestamp).toLocaleString()}`);
      lines.push(`- **Description:** ${decision.description}`);
      lines.push(`- **Rationale:** ${decision.rationale}`);
      if (decision.reviewTrigger) {
        lines.push(`- **Review Trigger:** ${decision.reviewTrigger}`);
      }
      lines.push('');
    });
  }

  // Information Quality
  lines.push('## Information Quality Metrics');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Facts Documented | ${report.informationQuality.factsCount} |`);
  lines.push(`| Assumptions Made | ${report.informationQuality.assumptionsCount} |`);
  lines.push(`| Assumptions Validated | ${report.informationQuality.assumptionsValidated} |`);
  lines.push(`| Assumptions Invalidated | ${report.informationQuality.assumptionsInvalidated} |`);
  lines.push(`| Unknowns Resolved | ${report.informationQuality.unknownsResolved} |`);
  lines.push(`| Unknowns Unresolved | ${report.informationQuality.unknownsUnresolved} |`);
  lines.push('');

  // Facts
  if (log.facts.length > 0) {
    lines.push('### Documented Facts');
    lines.push('');
    log.facts.forEach((fact) => {
      lines.push(`- **[${fact.confidence}]** ${fact.description}`);
      lines.push(`  - Source: ${fact.source}`);
    });
    lines.push('');
  }

  // Assumptions
  if (log.assumptions.length > 0) {
    lines.push('### Assumptions Made');
    lines.push('');
    log.assumptions.forEach((assumption) => {
      const status = assumption.validationResult
        ? ` [${assumption.validationResult}]`
        : ' [UNVALIDATED]';
      lines.push(`- ${assumption.description}${status}`);
      lines.push(`  - Basis: ${assumption.basis}`);
      lines.push(`  - Risk if Wrong: ${assumption.riskIfWrong}`);
    });
    lines.push('');
  }

  // Lessons Learned
  if (report.lessonsLearned.length > 0) {
    lines.push('## Lessons Learned');
    lines.push('');
    report.lessonsLearned.forEach((lesson, index) => {
      lines.push(`${index + 1}. ${lesson}`);
    });
    lines.push('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    report.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec}`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by GSOC Decision Ops Toolkit*`);
  lines.push(`*Organization: ${log.metadata.organization}*`);

  return lines.join('\n');
}

/**
 * Export after-action report as JSON
 */
export function exportToJSON(report: AfterActionReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Export decision log as standalone JSON
 */
export function exportDecisionLogJSON(log: DecisionLog): string {
  return JSON.stringify(log, null, 2);
}

/**
 * Export combined Markdown + JSON bundle
 */
export interface ExportBundle {
  markdown: string;
  json: string;
  filename: string;
}

export function exportBundle(report: AfterActionReport): ExportBundle {
  const dateStr = new Date(report.generatedAt).toISOString().split('T')[0];
  const safeTitle = report.incidentOverview.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50);

  return {
    markdown: exportToMarkdown(report),
    json: exportToJSON(report),
    filename: `aar-${dateStr}-${safeTitle}`,
  };
}
