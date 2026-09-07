import { describe, expect, it } from 'vitest';
import {
  createGlasshouseSession,
  getGlasshouseReport,
  transitionGlasshouse,
  serializeGlasshouseSession,
} from '@gsoc-decision-ops/core';
import { assertGlasshouseSaveExtends, detectLegacyGlasshouseRecords } from './glasshouse-storage';
import {
  escapeGlasshouseHtml,
  glasshouseReportBlocks,
  glasshouseReportHtml,
  glasshouseReportText,
  importSession,
  validateGlasshouseImportText,
} from './glasshouse-export';

describe('Glasshouse persistence boundary', () => {
  it('refuses stale or divergent acknowledged commands, including after an explicit takeover', () => {
    const initial = createGlasshouseSession(7, 'guided', 'adapter-stale');
    const next = transitionGlasshouse(initial, {
      commandId: 'first',
      actor: 'commander',
      type: 'help',
      topic: 'authority',
    }).state;
    expect(() => assertGlasshouseSaveExtends(initial, next)).not.toThrow();
    expect(() => assertGlasshouseSaveExtends(next, initial)).toThrow(/newer/);
    const divergent = transitionGlasshouse(initial, {
      commandId: 'first',
      actor: 'commander',
      type: 'help',
      topic: 'evidence',
    }).state;
    expect(() => assertGlasshouseSaveExtends(next, divergent)).toThrow(/diverges/);
    const changedState = structuredClone(next);
    changedState.tick += 1;
    expect(() => assertGlasshouseSaveExtends(next, changedState)).toThrow(/conflicting state/);
  });

  it('detects exact legacy keys as read-only evidence and retains corrupt bytes', () => {
    const values = new Map([
      ['hourglass-command-session', '{broken'],
      ['hourglass-campaign-completions', '["arc-one"]'],
      ['unrelated-portfolio', 'private'],
    ]);
    const before = [...values.entries()];
    const records = detectLegacyGlasshouseRecords({ getItem: (key) => values.get(key) ?? null });
    expect(records).toHaveLength(2);
    expect(records[0].text).toBe('{broken');
    expect(records[0].validJson).toBe(false);
    expect(records.every((record) => record.interpretation.includes('Read-only'))).toBe(true);
    expect([...values.entries()]).toEqual(before);
  });
});

describe('Glasshouse import boundary', () => {
  it('round-trips a canonical checkpoint and rejects altered domain state', () => {
    const state = createGlasshouseSession(0xffffffff, 'guided', 'adapter-import');
    expect(validateGlasshouseImportText(serializeGlasshouseSession(state))).toEqual(state);
    const corrupt = JSON.parse(serializeGlasshouseSession(state));
    // Preserve valid syntax while changing canonical state, not merely a parser error.
    if ('state' in corrupt) corrupt.state.tick = 23;
    else corrupt.tick = 23;
    expect(() => validateGlasshouseImportText(JSON.stringify(corrupt))).toThrow(/validation/);
  });

  it('rejects executable content, prototype keys, extreme depth and oversized files before application writes', async () => {
    expect(() => validateGlasshouseImportText('{"rationale":"<svg onload=alert(1)>"}')).toThrow(
      /Executable/
    );
    expect(() => validateGlasshouseImportText('{"__proto__":{"polluted":true}}')).toThrow(
      /unsupported object/
    );
    expect(() => validateGlasshouseImportText(`${'['.repeat(34)}0${']'.repeat(34)}`)).toThrow(
      /structure/
    );
    let read = false;
    await expect(
      importSession({
        size: 5 * 1024 * 1024 + 1,
        text: async () => {
          read = true;
          return '{}';
        },
      } as File)
    ).rejects.toThrow(/5 MB/);
    expect(read).toBe(false);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });
});

describe('one complete immutable report across text and HTML', () => {
  it('preserves all fields in a 100-decision fixture without interpreting free text as markup', () => {
    const initial = createGlasshouseSession(12, 'guided', 'adapter-report');
    const state = transitionGlasshouse(initial, {
      commandId: 'plan-1',
      actor: 'commander',
      type: 'plan',
      plan: {
        control: 'verify-entrance',
        scope: 'entrance',
        posture: 'CONTINUE',
        treatments: ['MITIGATE', 'TRANSFER'],
        authority: 'delegated',
        evidenceIds: ['reader-alert'],
        rationale: 'Check the source before escalation.',
        assumption: 'The reader report may be stale.',
        hypothesis: 'Narrow outage',
        likelihood: 'unknown',
        confidence: 'low',
        alternative: 'Bounded pause',
        reviewTrigger: 'Direct report received',
        uncertainty: 'unverified',
        notify: true,
      },
    }).state;
    expect(state.decisions).toHaveLength(1);
    const report = structuredClone(getGlasshouseReport(state));
    report.decisions = Array.from({ length: 100 }, (_, index) => ({
      ...report.decisions[0],
      id: `long-${index + 1}`,
      rationale: `${'Readable evidence '.repeat(70)} <script>private ${index + 1}</script> END-${index + 1}`,
    }));
    const original = JSON.stringify(report);
    const html = glasshouseReportHtml(report);
    const text = glasshouseReportText(report);
    expect(html).toContain('&lt;script&gt;private 100&lt;/script&gt; END-100');
    expect(html).not.toContain('<script>');
    expect(html).toContain('MITIGATE; TRANSFER');
    expect(text).toContain('END-100');
    expect(text).toContain(report.ledger.exposureId);
    expect(
      glasshouseReportBlocks(report).filter((block) => block.id.startsWith('decisions-'))
    ).toHaveLength(100);
    expect(JSON.stringify(report)).toBe(original);
  });

  it('escapes every HTML-significant character and labels partial/unassessed evidence honestly', () => {
    expect(escapeGlasshouseHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;');
    const report = getGlasshouseReport(
      createGlasshouseSession(1, 'independent', 'adapter-partial')
    );
    const html = glasshouseReportHtml(report);
    expect(html).toContain('Synthetic educational practice');
    expect(html).toContain(report.lifecycle.toUpperCase());
    expect(html).toContain('canonical accessible export');
    expect(html).not.toMatch(/<script|<iframe|<img\b/);
  });
});
