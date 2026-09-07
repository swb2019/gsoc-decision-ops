/** A new task-only tab/origin preserves existing phone journals and unrelated browser tabs. */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const config = JSON.parse(await readFile(process.argv[2], 'utf8'));
const port = Number(config.legacyPort ?? 4195);
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535);
const origin = `http://localhost:${port}`;
const results = [];
for (const device of config.devices) {
  execFileSync(
    config.adb,
    [
      '-P',
      String(config.adbServerPort),
      '-s',
      device.serial,
      'reverse',
      `tcp:${port}`,
      `tcp:${port}`,
    ],
    { windowsHide: true }
  );
  const browser = await chromium.connectOverCDP(device.endpoint);
  const page = await browser.contexts()[0].newPage();
  const directory = `qa-output/android-mobile/${device.model}`;
  await mkdir(directory, { recursive: true });
  const result = { model: device.model, checks: [], status: 'running' };
  try {
    await page.bringToFront();
    const client = await page.context().newCDPSession(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    const tap = async (locator) => {
      await locator.waitFor({ state: 'visible' });
      await locator.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.clock.runFor(300);
      const point = await locator.evaluate((e) => {
        const r = e.getBoundingClientRect(),
          x = r.x + r.width / 2,
          y = r.y + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        return {
          x: x - (visualViewport?.offsetLeft ?? 0),
          y: y - (visualViewport?.offsetTop ?? 0),
          receives: e === hit || e.contains(hit),
        };
      });
      assert.ok(point.receives, 'The native touch target must be unobstructed.');
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: point.x, y: point.y }],
      });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.clock.runFor(300);
    };
    const button = (name) => page.getByRole('button', { name, exact: true });
    await page.goto(`${origin}/gsoc-decision-ops/scenarios/access-control-ransomware/`);
    await button('Begin Mission').waitFor();
    await tap(button('More options'));
    await tap(page.getByRole('menuitem', { name: 'Two-way audio', exact: true }));
    await tap(button('Close two-way audio settings'));
    await tap(button('Begin Mission'));
    await tap(button("Don't show again options"));
    await tap(button('Disable all tips'));
    await page.clock.runFor(311000);
    await tap(button('Pause'));
    await tap(page.getByRole('button', { name: /Physical Access Control System/ }));
    await tap(page.getByRole('button', { name: /MITIGATE.*DEGRADE/ }));
    await tap(page.getByRole('button', { name: /Manual verification required/ }));
    await tap(page.getByRole('button', { name: /Medium — temporary coverage gap/ }));
    await tap(button('Commit Decision'));
    await tap(button('More options'));
    await tap(page.getByRole('menuitem', { name: 'Debrief', exact: true }));
    await tap(button('Export AAR'));
    await page.getByText('Treatment: MITIGATE', { exact: true }).waitFor();
    result.layout = await page.evaluate(() => ({
      width: innerWidth,
      contentWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(result.layout.contentWidth <= result.layout.width + 1);
    await page.screenshot({ path: `${directory}/legacy-touch-review.png` });
    result.checks.push(
      'Native touch opens and closes audio settings, starts a mission, selects a treatment/control/risk, commits once and opens the decision report.'
    );
    result.packVersion = (
      await (
        await page.request.get(`${origin}/gsoc-decision-ops/glasshouse-offline-manifest.json`)
      ).json()
    ).version;
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.failure = String(error.message).replaceAll(device.serial, '[device]');
    await page.screenshot({ path: `${directory}/legacy-failure.png` }).catch(() => {});
  } finally {
    await page.close();
    await browser.close();
  }
  results.push(result);
  console.log(JSON.stringify(result));
}
await writeFile('qa-output/android-mobile/legacy-summary.json', JSON.stringify(results, null, 2));
if (results.some((r) => r.status !== 'passed')) process.exitCode = 1;
