import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

test('optional campus projects real commitments and GPU loss preserves the complete exercise', async ({
  page,
  context,
}) => {
  await mkdir('qa-output', { recursive: true });
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.getByRole('button', { name: 'Architecture · optional', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByLabel('Campus commitments shown in the architectural view')).toContainText(
    'Guard available'
  );
  await page
    .locator('.gh-campus-panel')
    .screenshot({ path: 'qa-output/glasshouse-campus-quiet.png' });
  const devtools = await context.newCDPSession(page);
  await devtools.send('Performance.enable');
  await devtools.send('HeapProfiler.collectGarbage');
  const heap = async () =>
    (await devtools.send('Performance.getMetrics')).metrics.find(
      (item) => item.name === 'JSHeapUsedSize'
    ).value;
  const baselineHeap = await heap();
  const cycleHeaps = [];
  for (let cycle = 0; cycle < 10; cycle++) {
    await page.getByRole('button', { name: 'Schematic', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.getByRole('button', { name: 'Architecture · optional', exact: true }).click();
    await expect(page.locator('canvas')).toBeVisible();
    await devtools.send('HeapProfiler.collectGarbage');
    cycleHeaps.push(await heap());
  }
  // A bounded ten-cycle browser regression budget; physical GPU-memory qualification is separate.
  expect(Math.max(...cycleHeaps) - baselineHeap).toBeLessThan(12 * 1024 * 1024);
  await test.info().attach('scene-js-heap-ten-cycles', {
    body: JSON.stringify({ baselineHeap, cycleHeaps }),
    contentType: 'application/json',
  });
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await expect(page.getByLabel('Campus commitments shown in the architectural view')).toContainText(
    'Mobile patrol coverage is displaced'
  );
  await page
    .locator('.gh-campus-panel')
    .screenshot({ path: 'qa-output/glasshouse-campus-committed.png' });
  await page.locator('canvas').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension)
      throw new Error('The test browser does not expose WebGL context-loss injection.');
    extension.loseContext();
  });
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.gh-app').getByRole('alert')).toContainText(
    'Your session and complete schematic are preserved'
  );
  await expect(page.locator('.gh-commitment')).toHaveCount(1);
  await page.getByRole('button', { name: 'Next significant update', exact: true }).click();
  await page.getByRole('button', { name: 'Next significant update', exact: true }).click();
  await expect(page.locator('.gh-commitments')).toContainText('Direct entrance check received');
});

test('failure to load optional architecture leaves the schematic and decision path usable', async ({
  page,
}) => {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.route('**/_next/static/chunks/*.js', (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'Architecture · optional', exact: true }).click();
  await expect(page.locator('.gh-app').getByRole('alert')).toContainText(
    'Your session and complete schematic are preserved'
  );
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await expect(page.locator('.gh-commitment')).toHaveCount(1);
});

test('a verified published pack supports offline reload, decisions and text PDF export', async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
  await page.getByRole('button', { name: 'Inspect offline download', exact: true }).click();
  await expect(page.locator('.gh-offline-facts')).toContainText('Complete download');
  await page.getByRole('button', { name: /Download complete pack/ }).click();
  await expect(page.getByText('Verified · next start', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Activate for next start', exact: true }).click();
  await expect(page.getByText('Offline active', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await expect(page.getByRole('heading', { name: 'Make a bounded plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  await page.getByRole('button', { name: 'Close settings' }).click();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Make a bounded plan' })).toBeVisible();
  const takeover = page.getByRole('button', { name: 'Take over here', exact: true });
  if (await takeover.isVisible()) await takeover.click();
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await expect(page.locator('.gh-commitment')).toHaveCount(1);
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const download = await downloadPromise;
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(1000);
  await context.setOffline(false);
});

test('text enlargement preserves readable controls and a coherent narrow layout', async ({
  page,
}) => {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await page.getByRole('button', { name: 'Decide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Commit plan', exact: true })).toBeVisible();
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(layout.content).toBeLessThanOrEqual(layout.width + 1);
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await expect(page.locator('.gh-commitment')).toHaveCount(1);
  const result = await new AxeBuilder({ page })
    .include('.gh-app')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))
  ).toEqual([]);
});

test('local practice history preserves partial runs and supports read-only evidence comparison', async ({
  page,
}) => {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  await page
    .getByRole('button', { name: 'Start a new mission · preserve this backup', exact: true })
    .click();
  await page.getByRole('button', { name: /^Independent practice/ }).click();
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  await page.getByRole('button', { name: 'Show local practice history', exact: true }).click();
  const cards = page.getByRole('article', { name: /^Saved practice / });
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('independent');
  await expect(cards.last()).toContainText('guided');
  await cards.last().getByRole('button', { name: 'Inspect read-only review', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Saved checkpoint review', exact: true })
  ).toBeVisible();
  await cards
    .first()
    .getByRole('button', { name: 'Select for context comparison', exact: true })
    .click();
  await cards
    .last()
    .getByRole('button', { name: 'Select for context comparison', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Context only · conditions differ', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.locator('.gh-commitment')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Make a bounded plan' })).toBeVisible();
});
