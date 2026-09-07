import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

// Observe actual browser WebAudio calls. The implementation and native graph still run.
async function observeAudio(page) {
  await page.addInitScript(() => {
    const NativeAudio = window.AudioContext ?? window.webkitAudioContext;
    const probe = {
      supported: Boolean(NativeAudio),
      contexts: [],
      starts: 0,
      stops: 0,
      gains: [],
      connected: new Set(),
    };
    window.__glasshouseAudioProbe = probe;
    if (!NativeAudio) return;
    window.AudioContext = class extends NativeAudio {
      constructor(options) {
        super(options);
        probe.contexts.push(this);
      }
      createGain() {
        const node = super.createGain();
        probe.gains.push(node.gain);
        return node;
      }
      createOscillator() {
        const node = super.createOscillator();
        const start = node.start.bind(node);
        const stop = node.stop.bind(node);
        const connect = node.connect.bind(node);
        const disconnect = node.disconnect.bind(node);
        node.connect = (...args) => {
          probe.connected.add(node);
          return connect(...args);
        };
        node.disconnect = (...args) => {
          const result = disconnect(...args);
          probe.connected.delete(node);
          return result;
        };
        node.start = (...args) => {
          probe.starts++;
          return start(...args);
        };
        node.stop = (...args) => {
          probe.stops++;
          return stop(...args);
        };
        return node;
      }
    };
  });
}

async function stats(page) {
  return page.evaluate(() => {
    const probe = window.__glasshouseAudioProbe;
    return {
      contexts: probe.contexts.length,
      supported: probe.supported,
      connected: probe.connected.size,
      starts: probe.starts,
      stops: probe.stops,
      states: probe.contexts.map((context) => context.state),
      buses: probe.gains.slice(0, 2).map((gain) => gain.value),
    };
  });
}
async function start(page) {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await expect(page.locator('.gh-command-heading h1')).toContainText('Glasshouse');
}
async function settings(page) {
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
}
async function next(page) {
  await page.getByRole('button', { name: 'Next significant update', exact: true }).click();
}
async function report(page) {
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const result = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
  await page.getByRole('button', { name: 'Return to command', exact: true }).click();
  return result;
}

test('audio is opt-in, receipt-linked, independently muted, immediately paused and stopped', async ({
  page,
}) => {
  await observeAudio(page);
  await start(page);
  test.skip(
    !(await stats(page)).supported,
    'This local engine has no native WebAudio output. The separate unavailable-output journey still runs.'
  );
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  expect((await stats(page)).contexts).toBe(0);
  await settings(page);
  const controls = page.locator('.gh-audio-controls');
  for (const channel of ['voice', 'effects', 'ambience']) {
    await expect(controls.getByRole('checkbox', { name: `Enable ${channel}` })).not.toBeChecked();
  }
  await controls.getByRole('checkbox', { name: 'Enable effects' }).check();
  await expect.poll(async () => (await stats(page)).states).toEqual(['running']);
  expect((await stats(page)).starts).toBe(0); // no historical receipt replay
  await settings(page);
  await next(page);
  await expect(page.getByLabel('Optional audio status')).toContainText(
    'New evidence received · 06:13'
  );
  expect((await stats(page)).starts).toBe(1);
  await settings(page);
  await controls.getByRole('checkbox', { name: 'Enable effects' }).uncheck();
  await settings(page);
  const muted = (await stats(page)).starts;
  await next(page);
  await expect(page.locator('.gh-commitments')).toContainText('Direct entrance check received');
  expect((await stats(page)).starts).toBe(muted);
  const before = await report(page);

  await settings(page);
  await controls.getByRole('checkbox', { name: 'Enable ambience' }).check();
  await expect.poll(async () => (await stats(page)).starts).toBe(muted + 3);
  await controls.getByRole('button', { name: 'Pause audio', exact: true }).click();
  await expect.poll(async () => (await stats(page)).states).toEqual(['suspended']);
  // AudioParam.value can retain its last rendered automation value after the clock suspends.
  // Actual silence is established by the suspended context and every oscillator disconnected.
  expect((await stats(page)).connected).toBe(0);
  const pausedStarts = (await stats(page)).starts;
  await controls.getByRole('button', { name: 'Resume audio', exact: true }).click();
  await expect.poll(async () => (await stats(page)).starts).toBe(pausedStarts + 3);
  await controls.getByRole('button', { name: 'Stop all audio', exact: true }).click();
  for (const channel of ['voice', 'effects', 'ambience']) {
    await expect(controls.getByRole('checkbox', { name: `Enable ${channel}` })).not.toBeChecked();
  }
  await expect.poll(async () => (await stats(page)).states).toEqual(['suspended']);
  expect((await stats(page)).connected).toBe(0);
  const axe = await new AxeBuilder({ page })
    .include('.gh-settings')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.evaluate(() => (document.documentElement.style.fontSize = ''));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await settings(page);
  const after = await report(page);
  expect(after.canonicalDigest).toBe(before.canonicalDigest);
  expect(after.events).toEqual(before.events);
  expect(after.observations).toEqual(before.observations);
  expect(after.ledger).toEqual(before.ledger);
});

test('audio-off and audio-on runs expose identical evidence and modeled consequences', async ({
  page,
  browser,
}) => {
  await start(page);
  test.skip(
    !(await page.evaluate(() => Boolean(window.AudioContext ?? window.webkitAudioContext))),
    'This local engine has no native WebAudio output; it cannot qualify an audio-on comparison.'
  );
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await next(page);
  await next(page);
  const withoutAudio = await report(page);
  const audibleContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  const audible = await audibleContext.newPage();
  await start(audible);
  await settings(audible);
  await audible.getByRole('checkbox', { name: 'Enable effects' }).check();
  await settings(audible);
  await audible.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await next(audible);
  await next(audible);
  const withAudio = await report(audible);
  expect(withAudio.sessionId).not.toBe(withoutAudio.sessionId);
  expect(withAudio.simulatedMinutes).toBe(withoutAudio.simulatedMinutes);
  expect(withAudio.observations).toEqual(withoutAudio.observations);
  expect(withAudio.ledger).toEqual(withoutAudio.ledger);
  expect(
    withAudio.events.map((event) => ({
      type: event.type,
      at: event.simulatedAt,
      payload: event.payload,
    }))
  ).toEqual(
    withoutAudio.events.map((event) => ({
      type: event.type,
      at: event.simulatedAt,
      payload: event.payload,
    }))
  );
  await audibleContext.close();
});

test('unavailable WebAudio falls back to complete text and can be retried without changing the journal', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeAudio = window.AudioContext ?? window.webkitAudioContext;
    window.__hasNativeGlasshouseAudio = Boolean(NativeAudio);
    window.__failGlasshouseAudio = true;
    window.AudioContext = function (options) {
      if (window.__failGlasshouseAudio || !NativeAudio)
        throw new DOMException('Injected unsupported output', 'NotSupportedError');
      return new NativeAudio(options);
    };
  });
  await start(page);
  const before = await report(page);
  await settings(page);
  const controls = page.locator('.gh-audio-controls');
  // A failed activation immediately reverts this checkbox, so assert the fallback after a click.
  await controls.getByRole('checkbox', { name: 'Enable effects' }).click();
  await expect(controls.getByRole('status')).toContainText('Optional sound is unavailable');
  await expect(controls.getByRole('checkbox', { name: 'Enable effects' })).not.toBeChecked();
  await settings(page);
  const failed = await report(page);
  expect(failed.canonicalDigest).toBe(before.canonicalDigest);
  expect(failed.events).toEqual(before.events);
  await page.evaluate(() => (window.__failGlasshouseAudio = false));
  await settings(page);
  const nativeAvailable = await page.evaluate(() => window.__hasNativeGlasshouseAudio);
  await controls.getByRole('checkbox', { name: 'Enable effects' }).click();
  if (nativeAvailable) await expect(controls.getByRole('status')).toHaveCount(0);
  else {
    test
      .info()
      .annotations.push({
        type: 'capability',
        description:
          'This local engine provides no WebAudio. Retry remains in the complete-text fallback; recovered native output is unqualified.',
      });
    await expect(controls.getByRole('status')).toContainText('Optional sound is unavailable');
    await expect(controls.getByRole('checkbox', { name: 'Enable effects' })).not.toBeChecked();
  }
  await settings(page);
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  if (nativeAvailable)
    await expect(page.getByLabel('Optional audio status')).toContainText('Assignment started');
  await next(page);
  await next(page);
  await expect(page.locator('.gh-commitments')).toContainText('Direct entrance check received');
  const recovered = await report(page);
  expect(recovered.decisions).toHaveLength(1);
  expect(recovered.simulatedMinutes).toBe(4);
});
