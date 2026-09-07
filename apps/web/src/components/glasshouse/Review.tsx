'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Download, GitBranch, ShieldCheck } from 'lucide-react';
import {
  getGlasshouseReport,
  type GlasshouseReport as Report,
  type GlasshouseSession as Session,
} from '@gsoc-decision-ops/core';
import { downloadReport, downloadSession } from '@/lib/glasshouse-export';
import { actorLabels, assetLabels, clockLabel, money } from './PlanComposer';

export default function Review({
  report,
  state,
  onBack,
  onFork,
  onImprove,
  onDispute,
  comparison,
  comparisonNote,
  onError,
}: {
  report: Report;
  state: Session;
  onBack: () => void;
  onFork: (decisionId: string) => void;
  onImprove: (improvement: {
    action: string;
    owner: string;
    targetDate: string;
    retest: string;
  }) => boolean;
  onDispute: (findingId: string, reason: string) => boolean;
  comparison: Report | null;
  comparisonNote?: string;
  onError: (error: string) => void;
}) {
  const [selectedDecision, setSelectedDecision] = useState(report.decisions.at(-1)?.id ?? '');
  const [redacted, setRedacted] = useState(false);
  const [dispute, setDispute] = useState('');
  const [reason, setReason] = useState('');
  const [improvement, setImprovement] = useState(
    report.improvement ?? { action: '', owner: '', targetDate: '', retest: '' }
  );
  const [exporting, setExporting] = useState('');
  const decision = report.decisions.find((item) => item.id === selectedDecision);
  const knownThen = decision
    ? report.observations.filter(
        (item) => decision.knownEvidenceIds.includes(item.id) && item.receivedAt <= decision.at
      )
    : [];
  const ledger = report.ledger;
  async function exportAs(format: 'html' | 'json' | 'pdf') {
    setExporting(format);
    try {
      const frozen = redacted ? getGlasshouseReport(state, report.activePlaySeconds, true) : report;
      await downloadReport(frozen, format);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The report could not be exported.');
    } finally {
      setExporting('');
    }
  }
  return (
    <div className="gh-review">
      <div className="gh-review-title">
        <div>
          <span className="gh-eyebrow">Glasshouse / Causal debrief</span>
          <h1 id="gh-page-title" tabIndex={-1}>
            What did your choices change?
          </h1>
          <p>
            Decisions are reviewed against what was available then. Modeled outcomes remain separate
            from process observations.
          </p>
        </div>
        <button className="gh-button" onClick={onBack}>
          <ArrowLeft size={16} />
          {state.lifecycle === 'active' ? 'Return to command' : 'Return to situation'}
        </button>
      </div>
      <section className="gh-review-status gh-panel">
        <div>
          <span className={`gh-pill ${report.lifecycle === 'completed' ? 'gh-pill-green' : ''}`}>
            {report.lifecycle === 'completed'
              ? 'Scenario completed'
              : report.lifecycle === 'incomplete'
                ? 'Incomplete scenario'
                : 'Partial review · mission active'}
          </span>
          <h2>{report.terminalReason || 'A checkpoint, with work still open.'}</h2>
          <p>Opening this review does not advance time or complete the exercise.</p>
        </div>
        <dl>
          <div>
            <dt>Simulated</dt>
            <dd>{report.simulatedMinutes} min</dd>
          </div>
          <div>
            <dt>Recorded active play</dt>
            <dd>
              {Math.floor(report.activePlaySeconds / 60)}m {report.activePlaySeconds % 60}s
            </dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{report.mode}</dd>
          </div>
          <div>
            <dt>Assistance</dt>
            <dd>{report.assistance.length} recorded</dd>
          </div>
        </dl>
      </section>
      <div className="gh-review-grid">
        <section className="gh-panel">
          <div className="gh-panel-heading">
            <div>
              <span className="gh-eyebrow">Process observations</span>
              <h2>Evidence, with boundaries</h2>
            </div>
            <ShieldCheck size={23} />
          </div>
          <p className="gh-muted">
            No overall grade or readiness judgment. Structured rules can observe actions; they
            cannot establish the quality of free-text reasoning.
          </p>
          <div className="gh-findings">
            {report.findings.map((finding) => (
              <article className="gh-finding" key={finding.id}>
                <div className="gh-finding-title">
                  <h3>{finding.dimension}</h3>
                  <span className={`gh-pill ${finding.score === 2 ? 'gh-pill-green' : ''}`}>
                    {finding.score === null
                      ? 'Not assessed'
                      : finding.score === 2
                        ? 'Target observed'
                        : finding.score === 1
                          ? 'Partially observed'
                          : 'Omission observed'}
                  </span>
                </div>
                <p>{finding.result}</p>
                <p className="gh-muted">{finding.explanation}</p>
                <details>
                  <summary>Inspect finding basis</summary>
                  <p>{finding.boundary}</p>
                  <dl className="gh-detail-list">
                    <div>
                      <dt>Evaluator</dt>
                      <dd>{finding.evaluatorType}</dd>
                    </div>
                    <div>
                      <dt>Rule version</dt>
                      <dd>{finding.ruleVersion}</dd>
                    </div>
                    <div>
                      <dt>Event references</dt>
                      <dd>
                        {finding.eventIds.length
                          ? finding.eventIds.map((id) => (
                              <a href={`#event-${id}`} key={id}>
                                {id}
                              </a>
                            ))
                          : 'No cited event'}
                      </dd>
                    </div>
                    <div>
                      <dt>Evidence snapshots</dt>
                      <dd>{finding.evidenceSnapshotIds.join(', ') || 'No recorded snapshot'}</dd>
                    </div>
                  </dl>
                </details>
                <button
                  className="gh-text-button"
                  onClick={() => {
                    setDispute(finding.id);
                    setReason('');
                  }}
                >
                  Flag a disagreement
                </button>
                {report.disputes.some((item) => item.findingId === finding.id) && (
                  <p className="gh-success">Disagreement retained with the original finding.</p>
                )}
                {dispute === finding.id && (
                  <form
                    className="gh-dispute"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (onDispute(finding.id, reason)) {
                        setDispute('');
                        setReason('');
                      }
                    }}
                  >
                    <label className="gh-field">
                      Reason for disagreement
                      <textarea
                        autoFocus
                        maxLength={1000}
                        required
                        rows={3}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                      />
                    </label>
                    <div className="gh-button-row">
                      <button className="gh-button" type="submit">
                        Save disagreement
                      </button>
                      <button
                        className="gh-text-button"
                        type="button"
                        onClick={() => setDispute('')}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))}
          </div>
        </section>
        <div className="gh-stack">
          <section className="gh-panel">
            <div className="gh-panel-heading">
              <div>
                <span className="gh-eyebrow">Synthetic outcome / USD</span>
                <h2>One exposure. One horizon.</h2>
              </div>
            </div>
            <p className="gh-muted">
              {ledger.horizon}. This is an authored teaching model, not a forecast of actual loss or
              professional competence.
            </p>
            <dl className="gh-ledger">
              <div>
                <dt>Baseline expected loss</dt>
                <dd>{money(ledger.baselineLossCents)}</dd>
              </div>
              <div>
                <dt>Residual expected loss</dt>
                <dd>{money(ledger.residualLossCents)}</dd>
              </div>
              <div>
                <dt>Avoided loss</dt>
                <dd>{money(ledger.avoidedLossCents)}</dd>
              </div>
              <div>
                <dt>Incremental treatment cost</dt>
                <dd>{money(ledger.treatmentCostCents)}</dd>
              </div>
              <div className="gh-ledger-total">
                <dt>Modeled net benefit</dt>
                <dd>{money(ledger.netBenefitCents)}</dd>
              </div>
              <div>
                <dt>ROI</dt>
                <dd>
                  {ledger.roiPercent === null
                    ? 'Not applicable — zero cost'
                    : `${ledger.roiPercent.toFixed(1)}%`}
                </dd>
              </div>
            </dl>
            <details>
              <summary>Calculation & assumptions</summary>
              <p>
                Avoided loss = baseline − residual. Net benefit = avoided loss − incremental cost.
                ROI = net benefit ÷ incremental cost × 100. No speed or documentation multiplier
                applies.
              </p>
              <p className="gh-mono">Exposure: {ledger.exposureId}</p>
              <ul>
                {ledger.assumptions.map((assumption, index) => (
                  <li key={index}>{assumption}</li>
                ))}
              </ul>
            </details>
          </section>
          <section className="gh-panel">
            <div className="gh-panel-heading">
              <div>
                <span className="gh-eyebrow">Follow-through</span>
                <h2>What remains unresolved</h2>
              </div>
            </div>
            {report.unresolved.length ? (
              <ul className="gh-unresolved">
                {report.unresolved.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No unresolved obligations are reported by this scenario model.</p>
            )}
            {report.handoff && (
              <div className="gh-handoff-receipt">
                <span className="gh-eyebrow">Handoff / {clockLabel(report.handoff.at)}</span>
                <p>{report.handoff.summary}</p>
                <p>
                  <b>Owner:</b> {report.handoff.owner}
                </p>
                <p>
                  <b>Review:</b> {report.handoff.reviewTrigger}
                </p>
              </div>
            )}
          </section>
          <section className="gh-panel">
            <div className="gh-panel-heading">
              <div>
                <span className="gh-eyebrow">A next step you own</span>
                <h2>One improvement action</h2>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onImprove(improvement);
              }}
            >
              <label className="gh-field">
                Action
                <textarea
                  required
                  maxLength={1000}
                  rows={2}
                  value={improvement.action}
                  onChange={(event) =>
                    setImprovement((value) => ({ ...value, action: event.target.value }))
                  }
                />
              </label>
              <div className="gh-form-grid">
                <label className="gh-field">
                  Responsible label
                  <input
                    required
                    maxLength={100}
                    value={improvement.owner}
                    placeholder="Fictional or private label"
                    onChange={(event) =>
                      setImprovement((value) => ({ ...value, owner: event.target.value }))
                    }
                  />
                </label>
                <label className="gh-field">
                  Target date
                  <input
                    required
                    type="date"
                    value={improvement.targetDate}
                    onChange={(event) =>
                      setImprovement((value) => ({ ...value, targetDate: event.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="gh-field">
                Retest condition
                <input
                  required
                  maxLength={1000}
                  value={improvement.retest}
                  onChange={(event) =>
                    setImprovement((value) => ({ ...value, retest: event.target.value }))
                  }
                />
              </label>
              <button type="submit" className="gh-button gh-full">
                Save improvement locally
              </button>
              {report.improvement && (
                <p className="gh-success">
                  Saved with this session. Immediate replay is practice, not a retention measure.
                </p>
              )}
            </form>
          </section>
        </div>
      </div>
      <section className="gh-panel gh-known-then">
        <div className="gh-panel-heading">
          <div>
            <span className="gh-eyebrow">Decision replay</span>
            <h2>Known then. Preserved now.</h2>
          </div>
        </div>
        {report.decisions.length ? (
          <>
            <label className="gh-field">
              Inspect a decision
              <select
                value={selectedDecision}
                onChange={(event) => setSelectedDecision(event.target.value)}
              >
                {report.decisions.map((item, index) => (
                  <option key={item.id} value={item.id}>
                    {String(index + 1).padStart(2, '0')} · {clockLabel(item.at)} ·{' '}
                    {item.control.replaceAll('-', ' ')}
                    {item.revisionOf ? ' (revision)' : ''}
                  </option>
                ))}
              </select>
            </label>
            {decision && (
              <div className="gh-known-grid">
                <div>
                  <h3>{assetLabels[decision.scope]}</h3>
                  <div className="gh-inline-meta">
                    <span>{decision.posture}</span>
                    <span>{decision.treatments.join(' + ')}</span>
                    <span>{decision.authority}</span>
                  </div>
                  <p>
                    <b>Rationale:</b> {decision.rationale || 'Not recorded'}
                  </p>
                  <p>
                    <b>Hypothesis:</b> {decision.hypothesis || 'Not recorded'}
                  </p>
                  <p>
                    <b>Likelihood:</b> {decision.likelihood} · <b>Confidence:</b>{' '}
                    {decision.confidence}
                  </p>
                  <p>
                    <b>Assumption:</b> {decision.assumption || 'Not recorded'}
                  </p>
                  <p>
                    <b>Alternative:</b> {decision.alternative || 'Not recorded'}
                  </p>
                  <p>
                    <b>Review trigger:</b> {decision.reviewTrigger || 'Not recorded'}
                  </p>
                  <p className="gh-mono">Snapshot {decision.evidenceSnapshotId}</p>
                  <button className="gh-button" onClick={() => onFork(decision.id)}>
                    <GitBranch size={16} />
                    Try another approach here
                  </button>
                  <p className="gh-helper">
                    Creates a separate branch before this decision. The original is preserved in a
                    downloaded backup and local history. Commit an alternative, then choose “See
                    next consequence & compare” for a bounded comparison at the same simulated
                    horizon. The replay stops for your next decision.
                  </p>
                </div>
                <div>
                  <h3>Available to the commander at {clockLabel(decision.at)}</h3>
                  {knownThen.map((observation) => (
                    <article key={observation.id} className="gh-snapshot-observation">
                      <div className="gh-inline-meta">
                        <span>{observation.source}</span>
                        <span>{clockLabel(observation.receivedAt)}</span>
                        <span>
                          {decision.evidenceIds.includes(observation.id)
                            ? 'Cited by plan'
                            : 'Available, not cited'}
                        </span>
                      </div>
                      <p>{observation.claim}</p>
                      <small>{observation.limitation}</small>
                    </article>
                  ))}
                  {!knownThen.length && <p>No authorized evidence in this snapshot.</p>}
                </div>
              </div>
            )}
          </>
        ) : (
          <p>No decisions recorded yet. Return to the command workspace to make a plan.</p>
        )}
      </section>
      {comparison && (
        <section className="gh-panel">
          <div className="gh-panel-heading">
            <div>
              <span className="gh-eyebrow">Original / alternative</span>
              <h2>
                {comparison.simulatedMinutes === report.simulatedMinutes
                  ? 'Comparison at the same horizon'
                  : 'Unequal horizons — comparison pending'}
              </h2>
            </div>
            <GitBranch size={22} />
          </div>
          <p>
            {comparison.simulatedMinutes === report.simulatedMinutes
              ? 'Both branches use the same seed and pinned authored conditions. Differences reflect their own decisions and timing.'
              : `The original is at +${comparison.simulatedMinutes} min; this branch is at +${report.simulatedMinutes} min. Do not interpret the current totals as a fair alternative comparison.`}
          </p>
          {comparisonNote && <p className="gh-helper">{comparisonNote}</p>}
          <div className="gh-table-scroll">
            <table>
              <caption>Branch outcome comparison</caption>
              <thead>
                <tr>
                  <th>Modeled measure</th>
                  <th>Original</th>
                  <th>Alternative</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Simulated horizon</th>
                  <td>{comparison.simulatedMinutes} min</td>
                  <td>{report.simulatedMinutes} min</td>
                </tr>
                <tr>
                  <th>Treatment cost</th>
                  <td>{money(comparison.ledger.treatmentCostCents)}</td>
                  <td>{money(report.ledger.treatmentCostCents)}</td>
                </tr>
                <tr>
                  <th>Residual loss</th>
                  <td>{money(comparison.ledger.residualLossCents)}</td>
                  <td>{money(report.ledger.residualLossCents)}</td>
                </tr>
                <tr>
                  <th>Lifecycle</th>
                  <td>{comparison.lifecycle}</td>
                  <td>{report.lifecycle}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="gh-panel">
        <details>
          <summary>Inspect the immutable event journal · {report.events.length} events</summary>
          <ol className="gh-event-log">
            {report.events.map((event) => (
              <li id={`event-${event.eventId}`} key={event.eventId}>
                <div>
                  <b>
                    {clockLabel(event.simulatedAt)} / {event.type.replaceAll('_', ' ')}
                  </b>
                  <span>{actorLabels[event.actorId]}</span>
                </div>
                <p className="gh-mono">{event.eventId}</p>
                <p className="gh-helper">
                  Caused by:{' '}
                  {event.causalParentIds.join(', ') || 'Scenario opening / explicit command'}
                </p>
                <details>
                  <summary>Structured event payload</summary>
                  <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
        </details>
      </section>
      <section className="gh-panel gh-export">
        <div>
          <span className="gh-eyebrow">Your record stays yours</span>
          <h2>Take the evidence with you.</h2>
          <p>
            All formats use the same frozen report. HTML is the accessible reading version; PDF
            accessibility still needs manual qualification.
          </p>
          <label className="gh-checkbox">
            <input
              type="checkbox"
              checked={redacted}
              onChange={(event) => setRedacted(event.target.checked)}
            />
            Redact free text and private labels for intentional sharing
          </label>
          {redacted && (
            <p className="gh-notice">
              Sharing preview: decision explanations, briefs, handoff text, improvement labels and
              dispute reasons will be withheld. Structured actions and model evidence remain.
            </p>
          )}
          <div className="gh-button-row">
            {(['html', 'json', 'pdf'] as const).map((format) => (
              <button
                className="gh-button"
                disabled={Boolean(exporting)}
                key={format}
                onClick={() => void exportAs(format)}
              >
                <Download size={16} />
                {exporting === format ? 'Preparing…' : format.toUpperCase()}
              </button>
            ))}
            <button className="gh-text-button" onClick={() => downloadSession(state)}>
              Download full local backup
            </button>
          </div>
        </div>
        <div className="gh-export-meta">
          <span className="gh-eyebrow">Pinned interpretation</span>
          {Object.entries(report.versions).map(([name, version]) => (
            <p key={name}>
              <span>{name}</span>
              <b>{version}</b>
            </p>
          ))}
          <p className="gh-helper">
            Digest {report.canonicalDigest}. Detects accidental changes; it is not a credential or
            proof of authorship.
          </p>
        </div>
      </section>
      <div className="gh-review-limitations">
        <h2>Interpret this exercise within its limits.</h2>
        <ul>
          {report.limitations.map((limitation, index) => (
            <li key={index}>{limitation}</li>
          ))}
        </ul>
        <p>
          Professional content calibration, formative user evidence, manual screen-reader checks and
          named-device release qualification remain human review gates.
        </p>
      </div>
      <div className="gh-finish-options">
        <button className="gh-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Finish review
        </button>
        <button
          className="gh-button"
          disabled={!decision}
          onClick={() => decision && onFork(decision.id)}
        >
          Try another approach
          <ArrowUpRight size={17} />
        </button>
      </div>
    </div>
  );
}
