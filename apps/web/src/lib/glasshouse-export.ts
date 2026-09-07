import {
  restoreGlasshouseSession,
  serializeGlasshouseSession,
  type GlasshouseReport as Report,
  type GlasshouseSession as Session,
} from '@gsoc-decision-ops/core';
import { getBasePath } from './base-path';

export const MAX_GLASSHOUSE_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_GLASSHOUSE_IMPORT_DEPTH = 32;

export function escapeGlasshouseHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!
  );
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100) || 'session';
}
function readableKey(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}
function fieldValue(value: unknown): string {
  if (value === undefined || value === null) return 'Not recorded';
  if (typeof value === 'string') return value || '(empty)';
  if (Array.isArray(value))
    return value.length
      ? value
          .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
          .join('; ')
      : 'None';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export interface GlasshouseReportBlock {
  title: string;
  id: string;
  fields: Array<[string, string]>;
}

/** Every frozen report field is represented here; all export views use this same traversal. */
export function glasshouseReportBlocks(report: Report): GlasshouseReportBlock[] {
  const blocks: GlasshouseReportBlock[] = [];
  const objectFields = (value: object): Array<[string, string]> =>
    Object.entries(value).map(([key, item]) => [readableKey(key), fieldValue(item)]);
  const collections = new Set([
    'decisions',
    'observations',
    'events',
    'actions',
    'findings',
    'disputes',
  ]);
  const metadata = Object.fromEntries(
    Object.entries(report).filter(
      ([key]) =>
        !collections.has(key) && !['ledger', 'improvement', 'handoff', 'abandonment'].includes(key)
    )
  );
  blocks.push({
    title: 'Run context and limitations',
    id: 'context',
    fields: objectFields(metadata),
  });
  for (const key of ['ledger', 'handoff', 'improvement', 'abandonment'] as const) {
    const record = report[key];
    blocks.push({
      title: readableKey(key),
      id: key,
      fields: record ? objectFields(record) : [['Status', 'Not recorded']],
    });
  }
  for (const key of [
    'findings',
    'decisions',
    'observations',
    'actions',
    'events',
    'disputes',
  ] as const) {
    const records = report[key];
    if (!records.length)
      blocks.push({ title: readableKey(key), id: key, fields: [['Status', 'None recorded']] });
    records.forEach((item, index) => {
      const record = item as unknown as Record<string, unknown>;
      const identifier = fieldValue(record.id ?? record.eventId ?? record.findingId ?? index + 1);
      blocks.push({
        title: `${readableKey(key)} ${index + 1} — ${identifier}`,
        id: `${key}-${index + 1}`,
        fields: objectFields(record),
      });
    });
  }
  return blocks;
}

export function glasshouseReportHtml(report: Report): string {
  const escape = escapeGlasshouseHtml;
  const blocks = glasshouseReportBlocks(report);
  const money = (cents: number) =>
    `${report.ledger.currency} ${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const status = report.lifecycle.toUpperCase();
  const links = blocks
    .map((block) => `<li><a href="#${escape(block.id)}">${escape(block.title)}</a></li>`)
    .join('');
  const sections = blocks
    .map(
      (block) =>
        `<section id="${escape(block.id)}" aria-labelledby="${escape(block.id)}-heading"><h2 id="${escape(block.id)}-heading">${escape(block.title)}</h2><dl>${block.fields.map(([label, value]) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`).join('')}</dl></section>`
    )
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Hourglass Command — ${escape(status)} — ${escape(report.sessionId)}</title>
<style>html{color-scheme:light}body{font:17px/1.6 system-ui,sans-serif;color:#192320;background:#fff;margin:0 auto;padding:32px 24px;max-width:920px}h1,h2,h3{line-height:1.2;break-after:avoid}h1{font-size:2rem}h2{margin-top:2.2rem;font-size:1.35rem;border-top:1px solid #b8c4bf;padding-top:1rem}a{color:#075b47}a:focus-visible{outline:3px solid #b66b00;outline-offset:4px}.status{font-weight:700;letter-spacing:.08em}.summary{border:1px solid #b8c4bf;padding:20px;border-radius:12px;background:#f5f7f3}dt{font-weight:650;break-after:avoid;margin-top:12px}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}nav{border-block:1px solid #b8c4bf;margin:24px 0}nav ol{columns:2;column-gap:2rem;padding-left:1.2rem}nav li{break-inside:avoid}footer{margin-top:40px;border-top:1px solid #b8c4bf;padding-top:20px}.small{font-size:.9rem}@media(max-width:540px){body{padding:20px 16px}nav ol{columns:1}}@media print{body{max-width:none;padding:0;font-size:11pt}nav{display:none}section{break-inside:auto}dt,dd{orphans:3;widows:3}.summary{break-inside:avoid}a{color:inherit}h2{font-size:15pt}footer{font-size:10pt}}</style></head><body>
<header><p class="status">Synthetic educational practice · ${escape(status)}${report.redacted ? ' · REDACTED SHARE COPY' : ' · LOCAL RECORD'}</p><h1>Hourglass Command</h1><p>${escape(report.scenario)} — evidence-linked review</p><p>Session ${escape(report.sessionId)} · ${escape(report.simulatedMinutes)} simulated minutes · ${escape(report.mode)} mode</p></header>
<main><section class="summary" aria-labelledby="summary-heading"><h2 id="summary-heading">Executive brief</h2><p>${report.decisions.length} recorded decisions; ${report.unresolved.length} unresolved items. ${escape(report.terminalReason ?? 'No terminal reason has been recorded.')}</p><p>Modeled net benefit: ${escape(money(report.ledger.netBenefitCents))}. Modeled treatment cost: ${escape(money(report.ledger.treatmentCostCents))}. Horizon: ${escape(report.ledger.horizon)}. These are synthetic model outputs, not real loss savings.</p><p>Process findings below describe exposed behavior and their assessment limits. They are separate from business outcomes and do not establish professional readiness or learning transfer.</p><p>Next practice action: ${escape(report.improvement?.action ?? 'Not selected.')}</p></section>
<nav aria-label="Report contents"><h2>Find the evidence</h2><ol>${links}</ol></nav>${sections}</main>
<footer><p>This HTML record is the canonical accessible export. It is an unsigned local practice record. Its digest detects accidental changes; it does not establish authorship or make this a trusted credential. The full decision and event record appears above.</p></footer></body></html>`;
}

export function glasshouseReportText(report: Report): string {
  return [
    'HOURGLASS COMMAND',
    `Synthetic educational practice | ${report.lifecycle.toUpperCase()}${report.redacted ? ' | REDACTED SHARE COPY' : ''}`,
    `${report.scenario} | Session ${report.sessionId}`,
    'Process findings and synthetic business outcomes are separate. This record is not a professional credential.',
    ...glasshouseReportBlocks(report).flatMap((block) => [
      '',
      block.title,
      ...block.fields.map(([key, value]) => `${key}: ${value}`),
    ]),
    '',
    'Unsigned local record. The digest detects accidental change; it is not proof of authorship.',
  ].join('\n');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Let browsers finish consuming the object URL. This is download cleanup, not simulation time.
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadSession(state: Session): void {
  const text = serializeGlasshouseSession(state);
  downloadBlob(
    new Blob([text], { type: 'application/json;charset=utf-8' }),
    `hourglass-session-${safeFilename(state.sessionId)}.json`
  );
}

export function validateGlasshouseImportText(text: string): Session {
  if (new TextEncoder().encode(text).byteLength > MAX_GLASSHOUSE_IMPORT_BYTES)
    throw new Error('This session exceeds the 5 MB import limit. The current run was preserved.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid session JSON. Nothing was imported.');
  }
  const pending: Array<{ value: unknown; depth: number }> = [{ value: parsed, depth: 0 }];
  let nodes = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    nodes += 1;
    if (depth > MAX_GLASSHOUSE_IMPORT_DEPTH || nodes > 250_000)
      throw new Error('This session exceeds the supported structure limits. Nothing was imported.');
    if (
      typeof value === 'string' &&
      /<\s*\/?\s*(?:script|iframe|object|embed|svg|math|link|meta|style|img|video|audio)\b|\bon[a-z]+\s*=/iu.test(
        value
      )
    ) {
      throw new Error(
        'Executable markup is not accepted in practice imports. Nothing was imported.'
      );
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key))
          throw new Error(
            'This file contains unsupported object properties. Nothing was imported.'
          );
        pending.push({ value: child, depth: depth + 1 });
      }
    }
  }
  try {
    return restoreGlasshouseSession(text);
  } catch (error) {
    throw new Error(
      `This session failed version, schema or replay validation. ${error instanceof Error ? error.message : 'Nothing was imported.'}`,
      { cause: error }
    );
  }
}

export async function importSession(file: File): Promise<Session> {
  if (file.size > MAX_GLASSHOUSE_IMPORT_BYTES)
    throw new Error(
      'Choose a session JSON file no larger than 5 MB. The current run was preserved.'
    );
  return validateGlasshouseImportText(await file.text());
}

async function loadPdfFont(pdf: import('jspdf').jsPDF): Promise<void> {
  const response = await fetch(`${getBasePath()}/brand/Manrope.ttf`, {
    credentials: 'same-origin',
  });
  if (!response.ok)
    throw new Error(
      'The report font could not load. Export the complete accessible HTML or JSON record, or retry PDF when the font is available.'
    );
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 16_384)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 16_384));
  pdf.addFileToVFS('HourglassManrope.ttf', btoa(binary));
  pdf.addFont('HourglassManrope.ttf', 'HourglassManrope', 'normal');
  pdf.setFont('HourglassManrope', 'normal');
}

/** Searchable text with page-aware continuation; never rasterized or shrunk to fit. */
export async function buildGlasshouseReportPdf(report: Report): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true, putOnlyUsedFonts: true });
  await loadPdfFont(pdf);
  pdf.setProperties({
    title: `Hourglass Command - ${report.lifecycle} - ${report.sessionId}`,
    subject: 'Synthetic educational practice record; HTML is the canonical accessible alternative',
    author: 'Hourglass Command',
    creator: 'Hourglass Command report adapter',
  });
  const font = pdf.getFont().metadata as { characterToGlyph?: (code: number) => number };
  if (font.characterToGlyph) {
    const unsupported = [...glasshouseReportText(report)].find(
      (character) =>
        character.codePointAt(0)! > 31 && font.characterToGlyph!(character.codePointAt(0)!) === 0
    );
    if (unsupported)
      throw new Error(
        `The PDF font cannot represent a character in this record (U+${unsupported.codePointAt(0)!.toString(16).toUpperCase()}). Export HTML or JSON to preserve the complete text.`
      );
  }
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 42;
  const usableWidth = width - margin * 2;
  const bottom = height - 54;
  const lineHeight = 15;
  let y = 0;
  let context = 'Run context';
  const pageHeader = (continued = false) => {
    pdf.setFontSize(10);
    pdf.setTextColor(40, 56, 49);
    const lines = pdf.splitTextToSize(
      `Hourglass Command | ${report.lifecycle.toUpperCase()} | ${report.sessionId}`,
      usableWidth
    ) as string[];
    y = margin;
    for (const line of lines) {
      pdf.text(line, margin, y);
      y += 13;
    }
    if (continued) {
      const contexts = pdf.splitTextToSize(`${context} (continued)`, usableWidth) as string[];
      for (const line of contexts) {
        pdf.text(line, margin, y);
        y += 13;
      }
    }
    pdf.setDrawColor(175, 187, 180);
    pdf.line(margin, y + 3, width - margin, y + 3);
    y += 23;
  };
  const newPage = () => {
    pdf.addPage();
    pageHeader(true);
  };
  const write = (text: string, size = 11) => {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, usableWidth) as string[];
    for (const line of lines) {
      if (y + lineHeight > bottom) newPage();
      pdf.setFontSize(size);
      pdf.text(line, margin, y);
      y += lineHeight;
    }
  };
  pageHeader();
  write('Synthetic educational practice', 16);
  y += 8;
  write(report.scenario);
  write(
    'Process findings are separate from modeled business outcomes. This record does not establish professional readiness or learning transfer.'
  );
  write(report.redacted ? 'REDACTED SHARE COPY' : 'LOCAL PRACTICE RECORD');
  y += 12;
  for (const block of glasshouseReportBlocks(report)) {
    context = block.title;
    pdf.setFontSize(13);
    const headingLines = pdf.splitTextToSize(block.title, usableWidth) as string[];
    if (y + (headingLines.length + 3) * lineHeight > bottom) newPage();
    write(block.title, 13);
    y += 5;
    for (const [key, value] of block.fields) {
      pdf.setFontSize(11);
      const fieldLines = pdf.splitTextToSize(`${key}: ${value}`, usableWidth) as string[];
      // Keep a field together when it fits a page, otherwise continue with explicit record context.
      if (
        fieldLines.length * lineHeight < bottom - margin - 90 &&
        y + fieldLines.length * lineHeight > bottom
      )
        newPage();
      write(`${key}: ${value}`);
      y += 4;
    }
    y += 10;
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(10);
    pdf.setTextColor(60, 70, 65);
    pdf.text(
      `Synthetic practice | ${report.lifecycle} | Page ${page} of ${pages}`,
      margin,
      height - 27
    );
  }
  return pdf.output('blob');
}

export async function downloadReport(
  report: Report,
  format: 'json' | 'html' | 'pdf'
): Promise<void> {
  // Copy once at the boundary so asynchronous font loading cannot mix report revisions.
  const frozen = JSON.parse(JSON.stringify(report)) as Report;
  const suffix = frozen.redacted ? '-redacted' : '';
  const filename = `hourglass-review-${safeFilename(frozen.sessionId)}-${frozen.lifecycle}${suffix}.${format}`;
  if (format === 'json')
    downloadBlob(
      new Blob([JSON.stringify(frozen, null, 2)], { type: 'application/json;charset=utf-8' }),
      filename
    );
  else if (format === 'html')
    downloadBlob(
      new Blob([glasshouseReportHtml(frozen)], { type: 'text/html;charset=utf-8' }),
      filename
    );
  else downloadBlob(await buildGlasshouseReportPdf(frozen), filename);
}
