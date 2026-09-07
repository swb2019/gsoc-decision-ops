import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
await mkdir('qa-output', { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const results = { coldRuns: [], errors: [], accessibility: [], layouts: [] };
for (let index = 0; index < 5; index++) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => results.errors.push(e.message));
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__vitals.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('http://127.0.0.1:4192/', { waitUntil: 'networkidle' });
  const initial = await page.evaluate(() => ({
    ...window.__vitals,
    transfer: performance.getEntriesByType('resource').reduce((n, e) => n + e.encodedBodySize, 0),
    userAgent: navigator.userAgent,
  }));
  results.coldRuns.push(initial);
  if (index === 0) {
    await page.screenshot({ path: 'qa-output/glasshouse-launch.png', fullPage: true });
    results.accessibility.push({
      screen: 'launch',
      ...(await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()),
    });
    await page.getByRole('button', { name: /Guided practice/ }).click();
    await page.getByRole('heading', { name: 'Make a bounded plan' }).waitFor();
    await page.screenshot({ path: 'qa-output/glasshouse-command.png', fullPage: true });
    results.accessibility.push({
      screen: 'command',
      ...(await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()),
    });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      results.layouts.push(
        await page.evaluate(() => ({
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        }))
      );
      await page.screenshot({ path: `qa-output/glasshouse-mobile-${width}.png`, fullPage: true });
    }
  }
  await context.close();
}
await browser.close();
await writeFile('qa-output/glasshouse-lab.json', JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    {
      coldRuns: results.coldRuns,
      layouts: results.layouts,
      errors: results.errors,
      accessibility: results.accessibility.map((a) => ({
        screen: a.screen,
        violations: a.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
      })),
    },
    null,
    2
  )
);
