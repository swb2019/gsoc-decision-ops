/** Opens configured USB debugging tunnels and reads only the task tab. No browser/profile reset. */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
assert.ok(process.argv[2], 'Pass a local device-configuration JSON path.');
const configuration = JSON.parse(await readFile(process.argv[2], 'utf8'));
const baseURL = new URL(configuration.url).href;
assert.ok(['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname));
for (const device of configuration.devices) {
  const endpoint = new URL(device.endpoint);
  assert.ok(['localhost', '127.0.0.1'].includes(endpoint.hostname));
  const adb = (...args) =>
    execFileSync(
      configuration.adb,
      ['-P', String(configuration.adbServerPort ?? 5037), '-s', device.serial, ...args],
      {
        encoding: 'utf8',
        windowsHide: true,
      }
    );
  const port = new URL(baseURL).port;
  assert.ok(port && endpoint.port);
  adb('reverse', `tcp:${port}`, `tcp:${port}`);
  adb('forward', `tcp:${endpoint.port}`, 'localabstract:chrome_devtools_remote');
  const browser = await chromium.connectOverCDP(device.endpoint);
  try {
    const pages = browser
      .contexts()
      .flatMap((context) => context.pages())
      .filter((page) => page.url().startsWith(baseURL));
    assert.equal(pages.length, 1, `${device.model}: exactly one task-owned tab is required.`);
    const page = pages[0];
    console.log(
      JSON.stringify({
        device: device.model,
        ...(await page.evaluate(() => ({
          title: document.title,
          width: innerWidth,
          contentWidth: document.documentElement.scrollWidth,
          height: innerHeight,
          dpr: devicePixelRatio,
          visibility: document.visibilityState,
          userAgent: navigator.userAgent,
          memoryGB: navigator.deviceMemory,
          cores: navigator.hardwareConcurrency,
          viewport: visualViewport
            ? {
                width: visualViewport.width,
                height: visualViewport.height,
                scale: visualViewport.scale,
                offsetLeft: visualViewport.offsetLeft,
                offsetTop: visualViewport.offsetTop,
              }
            : null,
          text: document.body.innerText.slice(0, 1200),
        }))),
      })
    );
  } finally {
    await browser.close();
  }
}
