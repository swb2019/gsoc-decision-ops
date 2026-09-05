/**
 * GSOC Decision Operations - After-Action Export
 *
 * Generate structured after-action reports in Markdown and JSON formats
 * for documentation, compliance, and continuous improvement.
 *
 * AAR structure based on military/organizational methodology:
 * - What was supposed to happen (intended outcomes)
 * - What actually happened (actual outcomes)
 * - What went well (sustains)
 * - What can improve (improves)
 * - Action items with owner and due date
 */

import type { DecisionLog, AfterActionReport, AARActionItem } from './types.js';
import { generateId, now, formatDuration, sortByTimestamp } from './utils.js';
import { calculateStats } from './decision-log.js';

/**
 * Generate an after-action report from a decision log
 */
export function generateAfterActionReport(
  log: DecisionLog,
  lessonsLearned: string[] = [],
  recommendations: string[] = [],
  sustains: string[] = [],
  improves: string[] = [],
  actionItems: AARActionItem[] = []
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

  const lastPosture =
    log.decisions.length > 0 ? log.decisions[log.decisions.length - 1].posture : 'CONTINUE';

  const revealedInjects = log.injects.filter((i) => i.revealed).length;

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

    learningObjective: log.learningObjective,

    intendedOutcomes: {
      expectedPosture: log.learningObjective?.expectedDecisions?.[0] ?? 'Per scenario guidance',
      expectedDecisions: log.learningObjective?.expectedDecisions ?? [],
      trainingGoals: log.learningObjective?.skillsTrained ?? [],
    },

    actualOutcomes: {
      finalPosture: lastPosture,
      decisionsRecorded: stats.totalDecisions,
      postureChanges: countPostureChanges(log),
      injectsRevealed: revealedInjects,
      injectsTotal: log.injects.length,
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

    sustains: sustains.length > 0 ? sustains : generateDefaultSustains(log, stats),
    improves: improves.length > 0 ? improves : generateDefaultImproves(log, stats),
    actionItems: actionItems.length > 0 ? actionItems : generateDefaultActionItems(log),

    lessonsLearned,
    recommendations,

    appendices: {
      fullDecisionLog: log,
      exportFormat: 'BOTH',
    },
  };
}

/**
 * Count posture changes in the decision log
 */
function countPostureChanges(log: DecisionLog): number {
  if (log.decisions.length <= 1) return 0;
  let changes = 0;
  for (let i = 1; i < log.decisions.length; i++) {
    if (log.decisions[i].posture !== log.decisions[i - 1].posture) {
      changes++;
    }
  }
  return changes;
}

/**
 * Generate default sustains based on log analysis
 */
function generateDefaultSustains(
  log: DecisionLog,
  stats: ReturnType<typeof calculateStats>
): string[] {
  const sustains: string[] = [];

  if (stats.totalFacts > 0) {
    sustains.push(`Documented ${stats.totalFacts} facts with sources`);
  }
  if (stats.totalAssumptions > 0 && log.assumptions.every((a) => a.riskIfWrong)) {
    sustains.push('All assumptions included risk-if-wrong assessment');
  }
  if (stats.totalDecisions > 0) {
    sustains.push(`Recorded ${stats.totalDecisions} decisions with rationale`);
  }
  if (log.decisions.some((d) => d.esrmFraming?.residualRisk)) {
    sustains.push('Decisions included residual risk framing (ESRM best practice)');
  }

  return sustains;
}

/**
 * Generate default improves based on log analysis
 */
function generateDefaultImproves(
  log: DecisionLog,
  stats: ReturnType<typeof calculateStats>
): string[] {
  const improves: string[] = [];

  if (stats.totalUnknowns > stats.resolvedUnknowns) {
    improves.push(`${stats.totalUnknowns - stats.resolvedUnknowns} unknowns remain unresolved`);
  }
  if (stats.criticalUnknowns > 0) {
    improves.push(`${stats.criticalUnknowns} critical unknowns still open`);
  }
  if (log.decisions.length > 0 && !log.decisions.some((d) => d.esrmFraming)) {
    improves.push('Consider adding ESRM risk framing (asset owner, residual risk) to decisions');
  }
  if (log.injects.length > 0 && log.injects.filter((i) => i.revealed).length < log.injects.length) {
    improves.push(
      `Only ${log.injects.filter((i) => i.revealed).length}/${log.injects.length} injects revealed — consider completing full scenario`
    );
  }

  return improves;
}

/**
 * Generate default action items from open items in log
 */
function generateDefaultActionItems(log: DecisionLog): AARActionItem[] {
  const actionItems: AARActionItem[] = [];

  log.actionItems
    .filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
    .forEach((a) => {
      actionItems.push({
        id: generateId('AAR_ACT'),
        description: a.description,
        owner: a.owner,
        dueDate: a.dueBy,
        priority: a.priority === 'CRITICAL' ? 'HIGH' : a.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
      });
    });

  return actionItems;
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
      '> ⚠️ **TRAINING EXERCISE** - This report documents a synthetic scenario. Not for production use.'
    );
  }

  lines.push('');

  // Learning Objective (if present)
  if (report.learningObjective) {
    lines.push('## Learning Objective');
    lines.push('');
    lines.push(`**Primary:** ${report.learningObjective.primary}`);
    if (report.learningObjective.secondary && report.learningObjective.secondary.length > 0) {
      lines.push('');
      lines.push('**Secondary:**');
      report.learningObjective.secondary.forEach((s) => lines.push(`- ${s}`));
    }
    lines.push('');
  }

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(report.executiveSummary);
  lines.push('');

  // What Was Supposed to Happen vs What Actually Happened
  lines.push('## Intended vs. Actual Outcomes');
  lines.push('');
  lines.push('| Metric | Intended | Actual |');
  lines.push('|--------|----------|--------|');
  lines.push(
    `| Posture | ${report.intendedOutcomes.expectedPosture} | ${report.actualOutcomes.finalPosture} |`
  );
  lines.push(
    `| Decisions | (per scenario) | ${report.actualOutcomes.decisionsRecorded} recorded |`
  );
  lines.push(
    `| Injects | ${report.actualOutcomes.injectsTotal} total | ${report.actualOutcomes.injectsRevealed} revealed |`
  );
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

  // Sustains (What Went Well)
  if (report.sustains.length > 0) {
    lines.push('## Sustains (What Went Well)');
    lines.push('');
    report.sustains.forEach((sustain) => {
      lines.push(`- ✓ ${sustain}`);
    });
    lines.push('');
  }

  // Improves (What Can Be Better)
  if (report.improves.length > 0) {
    lines.push('## Improves (Opportunities)');
    lines.push('');
    report.improves.forEach((improve) => {
      lines.push(`- △ ${improve}`);
    });
    lines.push('');
  }

  // Action Items
  if (report.actionItems.length > 0) {
    lines.push('## Action Items');
    lines.push('');
    lines.push('| Action | Owner | Due | Priority | Status |');
    lines.push('|--------|-------|-----|----------|--------|');
    report.actionItems.forEach((item) => {
      lines.push(
        `| ${item.description} | ${item.owner} | ${item.dueDate ?? 'TBD'} | ${item.priority} | ${item.status} |`
      );
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
  lines.push('*Generated by GSOC Decision Ops*');
  lines.push(`*Organization: ${log.metadata.organization}*`);
  lines.push('');
  lines.push(
    '> This tool trains first-hour judgment beside Resolver-class platforms — it does not replace enterprise incident management.'
  );

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
