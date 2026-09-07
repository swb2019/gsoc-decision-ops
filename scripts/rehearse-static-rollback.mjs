/** Local artifact-swap rehearsal. It does not deploy, delete journals, or certify an owner signoff. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

assert.ok(process.argv[2], 'Supply the extracted previous static artifact directory.');
const previous = resolve(process.argv[2]);
const current = resolve('apps/web/out');
const output = resolve('qa-output/rollback');
await mkdir(output, { recursive: true });
const manifests = Object.fromEntries(
  await Promise.all(
    [
      ['previous', previous],
      ['current', current],
    ].map(async ([name, root]) => [
      name,
      JSON.parse(await readFile(resolve(root, 'glasshouse-offline-manifest.json'), 'utf8')),
    ])
  )
);
assert.equal(manifests.previous.scope, manifests.current.scope);
assert.notEqual(
  manifests.previous.version,
  manifests.current.version,
  'A rollback requires two distinct artifacts.'
);
const scope = manifests.current.scope;
let serving = previous;
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.png': 'image/png',
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(scope)) {
      res.writeHead(404).end();
      return;
    }
    let file = resolve(serving, pathname.slice(scope.length));
    if (file !== serving && !file.startsWith(serving + sep)) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    res
      .writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      .end(await readFile(file));
  } catch {
    res.writeHead(404).end('Not found');
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}${scope}`;
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const result = {
  kind: 'automated-local-staging-rehearsal',
  ownerReview: 'pending',
  previousPack: manifests.previous.version,
  currentPack: manifests.current.version,
  checks: [],
  pageErrors: [],
};
page.on('pageerror', (error) => result.pageErrors.push(error.message));
const button = (name) => page.getByRole('button', { name, exact: true });
const settings = () => button('Open display and local data settings').click();
const closed = () => button('Close settings').click();
async function saved() {
  await settings();
  await page.waitForFunction(() =>
    /Saved|Restored/.test(document.querySelector('.gh-save-state')?.textContent || '')
  );
  await closed();
}
async function records() {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('hourglass:glasshouse:v1');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const req = db.transaction('checkpoints').objectStore('checkpoints').getAll();
        req.onsuccess = () =>
          resolve(req.result.map((item) => ({ id: item.sessionId, text: item.text })));
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  });
}
try {
  await page.goto(url);
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await button('Commit plan').click();
  await saved();
  const oldRecords = await records();
  assert.equal(oldRecords.length, 1);
  const oldBackup = oldRecords[0].text;
  assert.equal(JSON.parse(oldBackup).state.rubricVersion, 'observable-1.0.0');
  serving = current;
  await page.reload();
  await page.locator('.gh-command-heading').waitFor();
  assert.equal(
    await button('Commit plan').isDisabled(),
    true,
    'The upgraded app keeps the original rubric read-only.'
  );
  assert.equal((await records())[0].text, oldBackup);
  result.checks.push('previous save opens under its original rubric without changing saved bytes');
  await settings();
  const backupDownload = page.waitForEvent('download');
  await button('Start a new mission · preserve this backup').click();
  await (await backupDownload).saveAs(resolve(output, 'previous-session-backup.json'));
  await settings();
  await button('Inspect offline download').click();
  await page.getByRole('button', { name: /^Download complete pack/ }).click();
  await button('Activate for next start').waitFor();
  await button('Activate for next start').click();
  await page.locator('.gh-offline').getByText('Offline active', { exact: true }).waitFor();
  await closed();
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await button('Commit plan').click();
  await saved();
  // Pause active-time accounting while comparing immutable saved records across the swap.
  await button('Review').click();
  await page.getByRole('heading', { name: 'What did your choices change?' }).waitFor();
  await page.evaluate(async () => {
    localStorage.setItem('neighbor-portfolio', 'retained');
    const cache = await caches.open('neighbor-portfolio-cache');
    await cache.put('/neighbor-proof', new Response('retained'));
  });
  const beforeRollback = await records();
  assert.equal(beforeRollback.length, 2);
  const rollbackStart = performance.now();
  serving = previous;
  await settings();
  await button('Remove offline files').click();
  await page.locator('.gh-offline').getByText('Not downloaded', { exact: true }).waitFor();
  assert.deepEqual(
    await records(),
    beforeRollback,
    'Offline removal preserves every journal byte.'
  );
  await page.reload();
  await page.locator('.gh-unsaved').waitFor();
  assert.match(await page.locator('.gh-unsaved').innerText(), /preserved|recover|version/i);
  assert.deepEqual(
    await records(),
    beforeRollback,
    'The previous build must not overwrite an unsupported newer save.'
  );
  await page.screenshot({
    path: resolve(output, 'rollback-newer-record-preserved.png'),
    fullPage: true,
  });
  const isolation = await page.evaluate(async () => ({
    local: localStorage.getItem('neighbor-portfolio'),
    cached: await (
      await caches.open('neighbor-portfolio-cache')
    )
      .match('/neighbor-proof')
      .then((response) => response?.text()),
    flagshipCaches: (await caches.keys()).filter((name) =>
      name.startsWith('hourglass-glasshouse:')
    ),
  }));
  assert.equal(isolation.local, 'retained');
  assert.equal(isolation.cached, 'retained');
  assert.deepEqual(isolation.flagshipCaches, []);
  result.checks.push(
    'rolled-back build preserves unsupported newer save exactly and exposes recovery; offline rollback leaves neighboring data intact'
  );
  const previousContext = await browser.newContext({ acceptDownloads: true });
  const previousPage = await previousContext.newPage();
  await previousPage.goto(url);
  await previousPage.getByRole('button', { name: 'Open display and local data settings' }).click();
  await previousPage
    .locator('input[type=file]')
    .setInputFiles({
      name: 'previous-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(oldBackup),
    });
  await previousPage.waitForFunction(() =>
    document.querySelector('.gh-save-state')?.textContent?.includes('Saved')
  );
  await previousPage.getByRole('button', { name: 'Close settings' }).click();
  assert.equal(
    await previousPage
      .getByRole('button', { name: 'Next significant update', exact: true })
      .isEnabled(),
    true
  );
  await previousPage.getByRole('button', { name: 'Next significant update', exact: true }).click();
  await previousPage.goto(url + 'legacy/');
  const legacyLinks = await previousPage
    .locator('a[href*="/scenarios/"]')
    .evaluateAll((links) => [...new Set(links.map((link) => link.href))]);
  assert.equal(legacyLinks.length, 8);
  for (const link of legacyLinks)
    assert.equal((await previousPage.request.get(link)).status(), 200);
  for (const asset of manifests.previous.assets)
    assert.equal(
      (await previousPage.request.get(new URL(asset.path, url).href)).status(),
      200,
      asset.path
    );
  result.rollbackElapsedSeconds = (performance.now() - rollbackStart) / 1000;
  assert.ok(
    result.rollbackElapsedSeconds < 900,
    'The local rehearsal meets the 15-minute artifact rollback target.'
  );
  await previousContext.close();
  result.checks.push(
    'previous launch, eight scenario links, every pinned asset, and original-save continuation work within 15 minutes'
  );
  serving = current;
  await page.reload();
  await page.locator('.gh-command-heading').waitFor();
  await button('Review').click();
  await page.getByRole('heading', { name: 'What did your choices change?' }).waitFor();
  const afterRestore = await records();
  assert.deepEqual(
    afterRestore,
    beforeRollback,
    'Restoring the candidate recovers the original newer checkpoint without mutation.'
  );
  await page.screenshot({ path: resolve(output, 'candidate-recovered.png'), fullPage: true });
  result.checks.push(
    'returning to the candidate restores the newer checkpoint, with both original journals preserved'
  );
  result.journalDigests = beforeRollback.map((item) => ({
    id: item.id,
    bytes: Buffer.byteLength(item.text),
    sha256: createHash('sha256').update(item.text).digest('hex'),
  }));
  assert.deepEqual(result.pageErrors, []);
  result.status = 'passed';
} catch (error) {
  result.status = 'failed';
  result.failure = error.stack || String(error);
  await page
    .screenshot({ path: resolve(output, 'failure.png'), fullPage: true })
    .catch(() => undefined);
  process.exitCode = 1;
} finally {
  await writeFile(resolve(output, 'rehearsal.json'), JSON.stringify(result, null, 2));
  await browser.close();
  await new Promise((done) => server.close(done));
  console.log(JSON.stringify(result, null, 2));
}
