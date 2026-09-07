import { chromium, expect } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { setup, utter } from '../tests/browser/helpers/ongoing-voice.mjs';
const config = JSON.parse(await readFile(process.argv[2], 'utf8'));
const port = Number(process.argv[3] ?? 4198);
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
  const directory = `qa-output/android-ongoing/${device.model}`;
  await mkdir(directory, { recursive: true });
  const result = {
    model: device.model,
    recognition: 'deterministic fixture; native recorder and playback',
    checks: [],
  };
  try {
    await page.bringToFront();
    const panel = await setup(page, `http://localhost:${port}/gsoc-decision-ops/glasshouse/`);
    await utter(page, 'Start guided practice', /Mission started/);
    await utter(page, 'Verify the entrance', /Committed verify/);
    await utter(page, 'Monitor', /Committed continue with a review commitment/);
    await utter(page, 'Review', /2 decisions are recorded/);
    const stop = page.getByRole('button', { name: 'Stop voice', exact: true });
    const bounds = await stop.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
    result.checks.push(
      'One activation, two successive decisions and spoken review without game-control taps',
      'Stop voice remains within the phone viewport with a 44px minimum target'
    );
    await utter(page, 'Stop listening');
    await expect(panel.getByRole('status')).toHaveText('Conversation off');
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.__conversation.streams.every((s) =>
            s.getTracks().every((t) => t.readyState === 'ended')
          )
        )
      )
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    result.checks.push('Spoken stop releases every microphone track', 'No horizontal overflow');
    result.pack = await page.evaluate(
      async () =>
        (await (await fetch('/gsoc-decision-ops/glasshouse-offline-manifest.json')).json()).version
    );
    result.replies = await page.evaluate(() => window.__conversation.replies);
    result.status = 'passed';
    await page.screenshot({ path: `${directory}/spoken-review.png`, fullPage: false });
  } catch (error) {
    result.status = 'failed';
    result.error = String(error);
    await page.screenshot({ path: `${directory}/failure.png`, fullPage: false }).catch(() => {});
  } finally {
    await page.close();
    await browser.close();
  }
  results.push(result);
  await writeFile(`${directory}/result.json`, JSON.stringify(result, null, 2));
  console.log(`${device.model}: ${result.status}`);
}
await writeFile('qa-output/android-ongoing/results.json', JSON.stringify(results, null, 2));
if (results.some((r) => r.status !== 'passed')) process.exitCode = 1;
