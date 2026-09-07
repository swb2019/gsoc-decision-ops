import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { rolldown } from 'rolldown';
import { createHash } from 'node:crypto';

let server;
let origin;
test.beforeAll(async () => {
  const build = await rolldown({
    input: resolve('tests/browser/glasshouse-adapter-harness.ts'),
    platform: 'browser',
  });
  const generated = await build.generate({
    format: 'esm',
    entryFileNames: 'harness.js',
    chunkFileNames: '[name]-[hash].js',
  });
  await build.close();
  const chunks = new Map(
    generated.output.map((chunk) => [
      `/${chunk.fileName}`,
      chunk.type === 'chunk' ? chunk.code : chunk.source,
    ])
  );
  const font = await readFile('apps/web/public/brand/Manrope.ttf');
  const worker = await readFile('apps/web/public/glasshouse-sw.js');
  const html =
    '<!doctype html><html lang="en"><title>Adapter qualification harness</title><script>window.process={env:{NEXT_PUBLIC_BASE_PATH:""}};</script><script type="module">import * as harness from "/harness.js"; window.harness=harness;</script><body><h1>Adapter qualification harness</h1></body></html>';
  const assetBytes = new Map([
    ...chunks,
    ['/', html],
    ['/glasshouse/', html],
    ['/brand/Manrope.ttf', font],
  ]);
  const assets = [...assetBytes].map(([path, bytes]) => ({
    path,
    bytes: Buffer.byteLength(bytes),
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }));
  const manifest = {
    schemaVersion: 1,
    version: createHash('sha256').update(JSON.stringify(assets)).digest('hex'),
    scope: '/',
    totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    assets,
  };
  server = createServer((request, response) => {
    if (request.url === '/glasshouse-sw.js') {
      response.writeHead(200, { 'content-type': 'text/javascript' });
      response.end(worker);
      return;
    }
    if (request.url === '/glasshouse-offline-manifest.json') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(manifest));
      return;
    }
    if (request.url === '/brand/Manrope.ttf') {
      response.writeHead(200, { 'content-type': 'font/ttf' });
      response.end(font);
      return;
    }
    if (chunks.has(request.url)) {
      response.writeHead(200, { 'content-type': 'text/javascript' });
      response.end(chunks.get(request.url));
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(html);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  await new Promise((done) => server?.close(done));
});
async function ready(page) {
  await page.goto(origin);
  await page.waitForFunction(() => Boolean(window.harness));
}

test('atomic checkpoint, command journal, rollback on quota failure, reload and isolated deletion', async ({
  page,
}) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { storage, core } = window.harness;
    localStorage.setItem('neighbor-portfolio', 'preserve-me');
    localStorage.setItem('hourglass-command-session', '{legacy-original}');
    window.journal = await storage.openGlasshouseJournal();
    let state = core.createGlasshouseSession(31, 'guided', 'browser-atomic');
    await window.journal.save(state, 12);
    const initial = core.canonicalGlasshouseState(state);
    state = core.transitionGlasshouse(state, {
      commandId: 'help-1',
      actor: 'commander',
      type: 'help',
      topic: 'evidence',
    }).state;
    const originalPut = IDBObjectStore.prototype.put;
    let failure;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'checkpoints')
        throw new DOMException('Injected full quota', 'QuotaExceededError');
      return originalPut.apply(this, args);
    };
    try {
      await window.journal.save(state, 15);
    } catch (error) {
      failure = error.code;
    } finally {
      IDBObjectStore.prototype.put = originalPut;
    }
    const savedAfterFailure = await window.journal.load();
    const failedStatus = await window.journal.getSaveStatus();
    await window.journal.save(state, 18);
    await window.journal.save(state, 15);
    const successStatus = await window.journal.getSaveStatus();
    window.journal.close();
    return {
      failure,
      initial,
      savedAfterFailure: core.canonicalGlasshouseState(savedAfterFailure),
      failedStatus,
      successStatus,
    };
  });
  expect(result.failure).toBe('save-failed');
  expect(result.savedAfterFailure).toBe(result.initial);
  expect(result.failedStatus.durableCommands).toBe(0);
  expect(result.successStatus.durableCommands).toBe(1);
  expect(result.successStatus.activePlaySeconds).toBe(18);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.harness));
  const recovered = await page.evaluate(async () => {
    const journal = await window.harness.storage.openGlasshouseJournal();
    const loaded = await journal.load();
    const status = await journal.getSaveStatus();
    await journal.deleteAll();
    const deleted = await journal.load();
    journal.close();
    return {
      commands: loaded.commands.length,
      status,
      deleted,
      neighbor: localStorage.getItem('neighbor-portfolio'),
      legacy: localStorage.getItem('hourglass-command-session'),
    };
  });
  expect(recovered.commands).toBe(1);
  expect(recovered.status.activePlaySeconds).toBe(18);
  expect(recovered.deleted).toBeNull();
  expect(recovered.neighbor).toBe('preserve-me');
  expect(recovered.legacy).toBe('{legacy-original}');
});

test('two tabs are read-only until takeover and an old writer cannot overwrite newer acknowledged history', async ({
  page,
  context,
}) => {
  await ready(page);
  await page.evaluate(async () => {
    const { storage, core } = window.harness;
    window.journal = await storage.openGlasshouseJournal();
    window.state = core.createGlasshouseSession(15, 'guided', 'browser-lease');
    await window.journal.save(window.state);
  });
  const second = await context.newPage();
  await ready(second);
  const result = await second.evaluate(async () => {
    const { storage, core } = window.harness;
    window.journal = await storage.openGlasshouseJournal();
    window.state = await window.journal.load();
    const readOnly = window.journal.readOnly;
    let rejected;
    try {
      await window.journal.save(window.state);
    } catch (error) {
      rejected = error.code;
    }
    await window.journal.takeover();
    window.state = core.transitionGlasshouse(window.state, {
      commandId: 'other-tab-help',
      actor: 'commander',
      type: 'help',
      topic: 'authority',
    }).state;
    await window.journal.save(window.state);
    return { readOnly, rejected, status: await window.journal.getSaveStatus() };
  });
  expect(result.readOnly).toBe(true);
  expect(result.rejected).toBe('readonly');
  expect(result.status.readOnly).toBe(false);
  const firstResult = await page.evaluate(async () => {
    const status = await window.journal.getSaveStatus();
    await window.journal.takeover();
    let rejected;
    try {
      await window.journal.save(window.state);
    } catch (error) {
      rejected = error.code;
    }
    const loaded = await window.journal.load();
    window.journal.close();
    return { status, rejected, commands: loaded.commands.length };
  });
  expect(firstResult.status.readOnly).toBe(true);
  expect(firstResult.rejected).toBe('stale');
  expect(firstResult.commands).toBe(1);
  await second.evaluate(() => window.journal.close());
});

test('corrupt checkpoint bytes are quarantined and remain downloadable without replacing the prior evidence', async ({
  page,
}) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { storage, core } = window.harness;
    const journal = await storage.openGlasshouseJournal();
    await journal.save(core.createGlasshouseSession(77, 'guided', 'browser-corrupt'));
    const corrupt = '{original damaged bytes';
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(storage.GLASSHOUSE_DATABASE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction('checkpoints', 'readwrite');
    const committed = new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
    });
    tx.objectStore('checkpoints').put({
      sessionId: 'browser-corrupt',
      text: corrupt,
      commandCount: 0,
      savedAt: Date.now(),
    });
    await committed;
    db.close();
    let failure;
    try {
      await journal.load();
    } catch (error) {
      failure = { code: error.code, recoveryText: error.recoveryText };
    }
    const quarantine = await storage.getGlasshouseRecoveryRecords();
    journal.close();
    return { failure, quarantine, corrupt };
  });
  expect(result.failure).toEqual({ code: 'corrupt', recoveryText: result.corrupt });
  expect(result.quarantine[0].text).toBe(result.corrupt);
});

test('text PDF renders a complete long report with transfer, known-then references and readable continued records', async ({
  page,
}) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const { core, exports } = window.harness;
    const initial = core.createGlasshouseSession(4, 'guided', 'pdf-long');
    const state = core.transitionGlasshouse(initial, {
      commandId: 'decision-one',
      actor: 'commander',
      type: 'plan',
      plan: {
        control: 'verify-entrance',
        scope: 'entrance',
        posture: 'CONTINUE',
        treatments: ['MITIGATE', 'TRANSFER'],
        authority: 'delegated',
        evidenceIds: ['reader-alert'],
        rationale: 'Inspect the source before concluding.',
        assumption: 'Uncertain reader status',
        hypothesis: 'Connector fault',
        likelihood: 'unknown',
        confidence: 'low',
        alternative: 'Bounded precaution',
        reviewTrigger: 'Direct report',
        uncertainty: 'unverified',
        notify: true,
      },
    }).state;
    const report = structuredClone(core.getGlasshouseReport(state));
    report.decisions = Array.from({ length: 100 }, (_, index) => ({
      ...report.decisions[0],
      id: `LONG-DECISION-${index + 1}`,
      rationale: `${'This is a readable long-record fixture with source context. '.repeat(40)} COMPLETE-END-${index + 1}`,
    }));
    const blob = await exports.buildGlasshouseReportPdf(report);
    return {
      bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
      html: exports.glasshouseReportHtml(report),
    };
  });
  expect(result.bytes.length).toBeGreaterThan(10_000);
  expect(String.fromCharCode(...result.bytes.slice(0, 5))).toBe('%PDF-');
  expect(result.html).toContain('COMPLETE-END-100');
  expect(result.html).toContain('MITIGATE; TRANSFER');
  await mkdir('qa-output', { recursive: true });
  await writeFile('qa-output/glasshouse-100-decisions.pdf', Buffer.from(result.bytes));
  await writeFile('qa-output/glasshouse-100-decisions.html', result.html);
});

test('explicit complete offline packs survive network loss; cancellation and eviction never report ready', async ({
  page,
  context,
}) => {
  await ready(page);
  const completed = await page.evaluate(async () => {
    const { offline, storage, core } = window.harness;
    const journal = await storage.openGlasshouseJournal();
    await journal.save(core.createGlasshouseSession(8, 'guided', 'offline-journal'));
    journal.close();
    const controller = new AbortController();
    let aborted = false;
    try {
      await offline.downloadGlasshouseOfflinePack((bytes) => {
        if (bytes > 0) controller.abort();
      }, controller.signal);
    } catch (error) {
      aborted = error.name === 'AbortError';
    }
    const cancelledStatus = await offline.getGlasshouseOfflineStatus();
    const complete = await offline.downloadGlasshouseOfflinePack();
    await offline.activateGlasshouseOfflinePack(complete.version);
    return { aborted, cancelledStatus, status: await offline.getGlasshouseOfflineStatus() };
  });
  expect(completed.aborted).toBe(true);
  expect(completed.cancelledStatus.ready).toBe(false);
  expect(completed.status.ready).toBe(true);
  expect(completed.status.active).toBe(true);
  await context.setOffline(true);
  await page.goto(`${origin}/glasshouse/`);
  await expect(page.getByRole('heading', { name: 'Adapter qualification harness' })).toBeVisible();
  await page.waitForFunction(() => Boolean(window.harness));
  const pdf = await page.evaluate(async () => {
    const { exports, core } = window.harness;
    return (
      await exports.buildGlasshouseReportPdf(
        core.getGlasshouseReport(core.createGlasshouseSession(9, 'guided', 'offline-pdf'))
      )
    ).size;
  });
  expect(pdf).toBeGreaterThan(1000);
  await context.setOffline(false);
  const retired = await page.evaluate(async () => {
    const { offline, storage } = window.harness;
    const status = await offline.getGlasshouseOfflineStatus();
    const cache = await caches.open(status.cacheName);
    await cache.delete('/brand/Manrope.ttf');
    const evicted = await offline.getGlasshouseOfflineStatus();
    await offline.deleteGlasshouseOfflinePacks();
    const journal = await storage.openGlasshouseJournal();
    const state = await journal.load();
    journal.close();
    return { evicted, final: await offline.getGlasshouseOfflineStatus(), session: state.sessionId };
  });
  expect(retired.evicted.ready).toBe(false);
  expect(retired.final.ready).toBe(false);
  expect(retired.session).toBe('offline-journal');
});
