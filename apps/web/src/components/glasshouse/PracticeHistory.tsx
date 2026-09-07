'use client';

import { useId, useMemo, useState } from 'react';
import { Archive, Download, FileText, GitBranch } from 'lucide-react';
import {
  listGlasshousePracticeRecords,
  type GlasshousePracticeRecord,
} from '@/lib/glasshouse-storage';
import {
  compareGlasshousePractice,
  getGlasshousePracticeReport,
  projectGlasshousePractice,
} from '@/lib/glasshouse-practice';
import { downloadReport, glasshouseReportHtml } from '@/lib/glasshouse-export';

const lastSaved = (value: number | null) =>
  value === null ? 'Timestamp unavailable' : new Date(value).toLocaleString();

function backup(record: GlasshousePracticeRecord): void {
  const valid = record.validation === 'valid';
  const url = URL.createObjectURL(
    new Blob([record.originalText], {
      type: valid ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
    })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `hourglass-${valid ? 'session' : 'recovery'}-${record.sessionId.replace(/[^a-zA-Z0-9_-]/g, '-')}.${valid ? 'json' : 'txt'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function PracticeHistory() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [records, setRecords] = useState<GlasshousePracticeRecord[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const valid = records.filter(
    (record): record is Extract<GlasshousePracticeRecord, { validation: 'valid' }> =>
      record.validation === 'valid'
  );
  const reviewRecord = valid.find((record) => record.sessionId === reviewId);
  const frozenReview = useMemo(
    () => (reviewRecord ? getGlasshousePracticeReport(reviewRecord) : null),
    [reviewRecord]
  );
  const comparison = useMemo(() => {
    const selected = compareIds.map((sessionId) =>
      valid.find((record) => record.sessionId === sessionId)
    );
    if (selected.length !== 2 || selected.some((record) => !record)) return null;
    return compareGlasshousePractice(
      ...(selected.map((record) =>
        projectGlasshousePractice(record!.session, record!.lastSavedAt, record!.activePlaySeconds)
      ) as [
        ReturnType<typeof projectGlasshousePractice>,
        ReturnType<typeof projectGlasshousePractice>,
      ])
    );
  }, [compareIds, records]);

  async function load() {
    setBusy(true);
    setError('');
    try {
      setRecords(await listGlasshousePracticeRecords());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Local practice history could not be read. Existing records were preserved.'
      );
    } finally {
      setBusy(false);
    }
  }
  async function exportHtml(record: Extract<GlasshousePracticeRecord, { validation: 'valid' }>) {
    setError('');
    try {
      await downloadReport(getGlasshousePracticeReport(record), 'html');
      setMessage(
        `Accessible review downloaded for ${record.sessionId}. Your current run is unchanged.`
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The saved report could not be exported.');
    }
  }
  function toggleCompare(sessionId: string) {
    setCompareIds((selected) =>
      selected.includes(sessionId)
        ? selected.filter((value) => value !== sessionId)
        : selected.length < 2
          ? [...selected, sessionId]
          : [selected[1], sessionId]
    );
  }

  return (
    <section className="gh-offline" aria-labelledby={`${id}-heading`}>
      <div className="gh-panel-heading">
        <h3 id={`${id}-heading`}>
          <Archive size={16} />
          Local practice history
        </h3>
      </div>
      <p className="gh-helper">
        Inspect saved cases and their evidence. Reading a checkpoint does not resume it, change its
        lifecycle, or replace your current run.
      </p>
      <button
        className="gh-button"
        aria-expanded={open}
        aria-controls={`${id}-history`}
        disabled={busy}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) void load();
        }}
      >
        {open ? 'Hide local practice history' : 'Show local practice history'}
      </button>
      {open && (
        <div id={`${id}-history`} style={{ marginTop: 16 }}>
          <p className="gh-helper">
            Observed in this case is not independently demonstrated learning. Calibration remains
            pending. Immediate replays and time spent do not establish retention; unfamiliar-case
            delayed demonstration is unavailable until G3. Improvement goals remain local and create
            no external reminders.
          </p>
          {busy && <p role="status">Reading saved checkpoints…</p>}
          {!busy && !error && !records.length && (
            <p className="gh-helper">
              No Glasshouse checkpoints are saved in this browser. In-memory or downloaded-only
              sessions will appear here only after an explicit journal save.
            </p>
          )}
          <div style={{ display: 'grid', gap: 12 }}>
            {records.map((record) => {
              const summary =
                record.validation === 'valid'
                  ? projectGlasshousePractice(
                      record.session,
                      record.lastSavedAt,
                      record.activePlaySeconds
                    )
                  : null;
              return (
                <article
                  key={record.sessionId}
                  aria-label={`Saved practice ${record.sessionId}`}
                  style={{
                    padding: 14,
                    border: '1px solid #c9c9bf',
                    borderRadius: 4,
                    background: '#f0efea',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <div className="gh-panel-heading" style={{ marginBottom: 9 }}>
                    <h4 style={{ fontSize: '1rem', margin: 0 }}>
                      {summary?.caseLabel ?? 'Unreadable saved record'}
                    </h4>
                    <span className="gh-pill">
                      {summary?.statusLabel ?? 'Recovery copy retained'}
                    </span>
                  </div>
                  <p className="gh-helper" style={{ margin: '4px 0' }}>
                    <span className="gh-mono">{record.sessionId}</span>
                    {record.isCurrentCheckpoint ? ' · current saved checkpoint' : ''}
                  </p>
                  <p className="gh-helper" style={{ margin: '4px 0' }}>
                    Last saved: {lastSaved(record.lastSavedAt)}
                  </p>
                  {record.validation === 'unreadable' ? (
                    <p className="gh-error-text">{record.reason}</p>
                  ) : (
                    summary && (
                      <>
                        <p className="gh-helper" style={{ margin: '4px 0' }}>
                          {summary.mode} mode · {summary.simulatedMinutes} simulated minutes ·
                          active play{' '}
                          {summary.activePlaySeconds === null
                            ? 'not retained'
                            : `${Math.floor(summary.activePlaySeconds)} seconds`}
                        </p>
                        <p className="gh-helper" style={{ margin: '4px 0' }}>
                          Assistance: {summary.assistance.join('; ') || 'none recorded'}
                        </p>
                        {summary.parentSessionId && (
                          <p className="gh-helper">
                            <GitBranch size={13} /> Branch of{' '}
                            <span className="gh-mono">{summary.parentSessionId}</span>
                          </p>
                        )}
                        <p className="gh-helper">{summary.practiceNote}</p>
                        <dl style={{ display: 'grid', gap: 7, margin: '10px 0' }}>
                          {summary.observations.map((observation) => (
                            <div key={observation.objective}>
                              <dt style={{ fontSize: '.8125rem', fontWeight: 650 }}>
                                {observation.objective} ·{' '}
                                {observation.status === 'recorded-in-this-case'
                                  ? 'recorded in this case'
                                  : 'not observed'}
                              </dt>
                              <dd
                                style={{ fontSize: '.8125rem', margin: '3px 0 0', lineHeight: 1.6 }}
                              >
                                {observation.detail}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <details>
                          <summary
                            style={{ fontSize: '.8125rem', cursor: 'pointer', padding: '8px 0' }}
                          >
                            Versions and assessment boundaries
                          </summary>
                          <p className="gh-helper">
                            Scenario {summary.versions.scenario} · rubric {summary.versions.rubric}{' '}
                            · rules {summary.versions.rules} · assets {summary.versions.assets}
                          </p>
                          {summary.observations.map((observation) => (
                            <p className="gh-helper" key={observation.objective}>
                              <strong>{observation.objective}:</strong> {observation.boundary}
                              {observation.eventIds.length > 0 && (
                                <> Evidence: {observation.eventIds.join(', ')}.</>
                              )}
                            </p>
                          ))}
                        </details>
                        {summary.improvement && (
                          <div
                            style={{
                              borderLeft: '2px solid #aa9161',
                              paddingLeft: 10,
                              margin: '12px 0',
                            }}
                          >
                            <strong style={{ fontSize: '.8125rem' }}>Local improvement goal</strong>
                            <p className="gh-helper">{summary.improvement.action}</p>
                            <p className="gh-helper">
                              Responsible label: {summary.improvement.owner || 'not recorded'} ·
                              target {summary.improvement.targetDate || 'not recorded'}
                              <br />
                              Re-test condition: {summary.improvement.retest || 'not recorded'}
                            </p>
                          </div>
                        )}
                      </>
                    )
                  )}
                  <div className="gh-button-row" style={{ marginTop: 10 }}>
                    <button
                      className="gh-button"
                      onClick={() => {
                        try {
                          backup(record);
                          setMessage(
                            `Original ${record.validation === 'valid' ? 'session' : 'recovery'} backup downloaded. Current run unchanged.`
                          );
                        } catch (cause) {
                          setError(
                            cause instanceof Error ? cause.message : 'Backup download failed.'
                          );
                        }
                      }}
                    >
                      <Download size={14} />
                      {record.validation === 'valid'
                        ? 'Back up saved session'
                        : 'Download original recovery copy'}
                    </button>
                    {record.validation === 'valid' && (
                      <>
                        <button
                          className="gh-button"
                          aria-expanded={reviewId === record.sessionId}
                          onClick={() =>
                            setReviewId((current) =>
                              current === record.sessionId ? '' : record.sessionId
                            )
                          }
                        >
                          <FileText size={14} />
                          {reviewId === record.sessionId
                            ? 'Close saved review'
                            : 'Inspect read-only review'}
                        </button>
                        <button className="gh-text-button" onClick={() => void exportHtml(record)}>
                          Download accessible HTML
                        </button>
                        <button
                          className="gh-text-button"
                          aria-pressed={compareIds.includes(record.sessionId)}
                          onClick={() => toggleCompare(record.sessionId)}
                        >
                          {compareIds.includes(record.sessionId)
                            ? 'Remove from comparison'
                            : 'Select for context comparison'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {compareIds.length === 1 && (
            <p className="gh-helper" role="status">
              Select one more saved record for a context comparison. Selecting a third replaces the
              older selection.
            </p>
          )}
          {comparison && (
            <section aria-labelledby={`${id}-comparison`} style={{ marginTop: 20 }}>
              <h4 id={`${id}-comparison`}>{comparison.label}</h4>
              <p className="gh-helper">
                A: {compareIds[0]}
                <br />
                B: {compareIds[1]}
              </p>
              {comparison.reasons.length > 0 && (
                <ul className="gh-helper">
                  {comparison.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
              <p className="gh-helper">{comparison.intervalNote}</p>
              <dl style={{ display: 'grid', gap: 10 }}>
                {comparison.rows.map((row) => (
                  <div key={row.label}>
                    <dt style={{ fontWeight: 650, fontSize: '.8125rem' }}>{row.label}</dt>
                    <dd style={{ margin: '3px 0', fontSize: '.8125rem', lineHeight: 1.6 }}>
                      A: {row.left}
                      <br />
                      B: {row.right}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="gh-helper">{comparison.conclusion}</p>
            </section>
          )}
          {frozenReview && (
            <section aria-label="Saved checkpoint review" style={{ marginTop: 20 }}>
              <h4>Read-only saved review</h4>
              <p className="gh-helper">
                This is the frozen report for {frozenReview.sessionId}. It leaves your current run
                unchanged. Download accessible HTML for a full-window reading view.
              </p>
              <iframe
                title={`Read-only review for ${frozenReview.sessionId}`}
                srcDoc={glasshouseReportHtml(frozenReview)}
                sandbox=""
                style={{
                  display: 'block',
                  width: '100%',
                  height: 480,
                  border: '1px solid #b9beb0',
                  background: '#fff',
                }}
              />
            </section>
          )}
          <button
            className="gh-text-button"
            style={{ marginTop: 14 }}
            disabled={busy}
            onClick={() => void load()}
          >
            Refresh saved checkpoints
          </button>
        </div>
      )}
      {error && (
        <p className="gh-error-text" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="gh-success" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
