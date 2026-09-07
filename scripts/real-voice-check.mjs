import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const fixtureDir = process.argv[2];
const samples = Object.fromEntries(
  await Promise.all(
    ['verify', 'monitor', 'stop'].map(async (name) => [
      name,
      (await readFile(`${fixtureDir}/${name}.wav`)).toString('base64'),
    ])
  )
);
const config = process.argv[4] ? JSON.parse(await readFile(process.argv[4], 'utf8')) : null;
const device = config?.devices[Number(process.argv[5] ?? 0)];
const port = Number(process.argv[3] ?? 4198);
if (device)
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
const remote = device ? await chromium.connectOverCDP(device.endpoint) : null;
const context = remote
  ? remote.contexts()[0]
  : await chromium.launchPersistentContext(`${fixtureDir}/browser-cache`, {
      channel: 'chrome',
      headless: true,
      viewport: { width: 390, height: 844 },
      args: ['--enable-unsafe-swiftshader'],
    });
const page = await context.newPage();
const result = {
  source: 'Windows synthesized speech; actual app Whisper model and Kokoro/browser playback',
  device: device?.model ?? 'Desktop Chrome, phone viewport',
  turns: [],
  timings: [],
};
const directory = device ? `qa-output/real-voice/${device.model}` : 'qa-output/real-voice';
await mkdir(directory, { recursive: true });
try {
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) console.log(message.text().slice(0, 800));
  });
  page.on('requestfailed', (request) =>
    console.log(`Request failed: ${request.url()} ${request.failure()?.errorText}`)
  );
  await page.addInitScript((samples) => {
    localStorage.setItem(
      'hourglass-local-voice-config',
      JSON.stringify({ enabled: false, sttEnabled: true, ttsEnabled: true })
    );
    window.__realVoice = { samples, streams: [], recognition: [] };
    let transformers;
    Object.defineProperty(window, 'transformers', {
      get: () => transformers,
      set: (value) => {
        transformers = {
          ...value,
          pipeline: async (...args) => {
            const pipeline = await value.pipeline(...args);
            return async (...input) => {
              const run = {
                samples: input[0].length,
                rms: Math.sqrt(input[0].reduce((sum, v) => sum + v * v, 0) / input[0].length),
              };
              window.__realVoice.recognition.push(run);
              try {
                const answer = await pipeline(...input);
                run.answer = answer;
                console.warn('Recognition result', JSON.stringify(run));
                return answer;
              } catch (error) {
                run.error = String(error);
                console.warn('Recognition error', error);
                throw error;
              }
            };
          },
        };
      },
    });
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      await audio.resume();
      const destination = audio.createMediaStreamDestination();
      window.__realVoice.streams.push(destination.stream);
      window.__realVoice.say = async (name) => {
        const data = Uint8Array.from(atob(samples[name]), (c) => c.charCodeAt(0));
        const buffer = await audio.decodeAudioData(data.buffer);
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.connect(destination);
        source.start();
      };
      return destination.stream;
    };
  }, samples);
  await page.bringToFront();
  await page.goto(
    `http://${device ? 'localhost' : '127.0.0.1'}:${port}/gsoc-decision-ops/glasshouse/`
  );
  const start = page.getByRole('button', { name: /^Guided practice/ });
  if (await start.count()) await start.click();
  await page.getByRole('button', { name: 'More options' }).click();
  await page.getByRole('menuitem', { name: 'Two-way audio', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Two-way audio settings' });
  const panel = dialog.getByRole('region', { name: 'Ongoing two-way voice' });
  const setupStarted = Date.now();
  await dialog.getByRole('switch', { name: 'Enable two-way audio', exact: true }).click();
  console.log('Loading actual local voice models');
  await expect(panel.getByRole('button', { name: 'Start conversation', exact: true })).toBeEnabled({
    timeout: 600000,
  });
  result.setupMs = Date.now() - setupStarted;
  result.outputMode = (await dialog.getByText('Browser TTS', { exact: true }).count())
    ? 'native device speech'
    : 'Kokoro';
  await panel.getByRole('button', { name: 'Start conversation', exact: true }).click();
  console.log('Models ready; conversation activated');
  const stopBounds = await page
    .getByRole('button', { name: 'Stop voice', exact: true })
    .boundingBox();
  expect(stopBounds.height).toBeGreaterThanOrEqual(44);
  expect(stopBounds.width).toBeGreaterThanOrEqual(44);
  expect(stopBounds.y).toBeGreaterThanOrEqual(0);
  expect(stopBounds.y + stopBounds.height).toBeLessThanOrEqual(
    await page.evaluate(() => innerHeight)
  );
  result.stopTarget = stopBounds;
  const activated = Date.now();
  for (const name of ['verify', 'monitor', 'stop']) {
    await expect(panel.getByRole('status')).toHaveText('Listening — speak naturally', {
      timeout: 180000,
    });
    if (name === 'verify') result.firstListeningMs = Date.now() - activated;
    const turnStarted = Date.now();
    await page.evaluate((name) => window.__realVoice.say(name), name);
    console.log(`Synthetic speech sent: ${name}`);
    if (name === 'stop')
      await expect(panel.getByRole('status')).toHaveText('Conversation off', { timeout: 180000 });
    else {
      await expect(panel.locator('details')).toContainText(
        name === 'verify' ? 'Committed verify' : 'Committed continue with a review commitment',
        { timeout: 180000 }
      );
      result.turns.push(await panel.locator('details').textContent());
    }
    console.log(`Actual recognizer: ${name} passed`);
    result.timings.push({ phrase: name, responseMs: Date.now() - turnStarted });
  }
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__realVoice.streams.every((s) =>
          s.getTracks().every((t) => t.readyState === 'ended')
        )
      )
    )
    .toBe(true);
  result.pack = await page.evaluate(
    async () =>
      (await (await fetch('/gsoc-decision-ops/glasshouse-offline-manifest.json')).json()).version
  );
  result.status = 'passed';
  result.layout = await page.evaluate(() => ({
    width: innerWidth,
    contentWidth: document.documentElement.scrollWidth,
  }));
  expect(result.layout.contentWidth).toBeLessThanOrEqual(result.layout.width + 1);
  await page.screenshot({ path: `${directory}/completed.png`, fullPage: false });
} catch (error) {
  result.status = 'failed';
  result.error = String(error);
  result.page = await page
    .locator('body')
    .innerText()
    .catch(() => 'unavailable');
  await page.screenshot({ path: `${directory}/failure.png`, fullPage: false }).catch(() => {});
  process.exitCode = 1;
} finally {
  result.recognition = await page.evaluate(() => window.__realVoice?.recognition).catch(() => []);
  await writeFile(`${directory}/result.json`, JSON.stringify(result, null, 2));
  if (remote) {
    await page.close();
    await remote.close();
  } else await context.close();
}
