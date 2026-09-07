import { test, expect } from '@playwright/test';

// Synthetic audio enters the real browser recorder/analyser/decoder. Recognition is an explicit
// deterministic fixture: these tests verify sending and cancellation, not speech-model accuracy.
async function prepare(page, options = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((options) => {
    localStorage.setItem(
      'hourglass-local-voice-config',
      JSON.stringify({
        enabled: false,
        sttEnabled: !options.ttsOnly,
        ttsEnabled: !!options.ttsOnly,
      })
    );
    window.__voiceTest = { calls: 0, streams: [], options };
    navigator.mediaDevices.getUserMedia = async () => {
      if (options.denied) throw new DOMException('Test permission refusal', 'NotAllowedError');
      if (options.permissionPending)
        await new Promise((resolve) => {
          window.__voiceTest.allow = resolve;
        });
      const context = new AudioContext();
      await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      oscillator.frequency.value = 220;
      gain.gain.value = options.silent ? 0 : 0.12;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      window.__voiceTest.streams.push(destination.stream);
      window.__voiceTest.quiet = () => {
        gain.gain.value = 0;
      };
      window.__voiceTest.context = context;
      return destination.stream;
    };
  }, options);
  await page.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: `export const env={}; export async function pipeline(){return async (audio)=>{
      window.__voiceTest.calls++; window.__voiceTest.samples=audio.length;
      if(window.__voiceTest.options.deferred) await new Promise(resolve=>window.__voiceTest.release=resolve);
      return {text:window.__voiceTest.options.empty?'':'I will verify the entrance and retain manual checks.'};
    };}`,
    })
  );
  await page.route('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'export const KokoroTTS={from_pretrained:async()=>({})};',
    })
  );
  await page.clock.install();
  await page.goto('/scenarios/access-control-ransomware/');
  test.skip(
    !(await page.evaluate(() => Boolean(window.AudioContext && window.MediaRecorder))),
    'This engine lacks native audio capture; Chrome covers the recorder path.'
  );
  await page.getByRole('button', { name: 'Exit mission', exact: true }).waitFor();
  await page.getByRole('button', { name: 'More options' }).click();
  await page.getByRole('menuitem', { name: 'Two-way audio', exact: true }).click();
  await page.getByRole('switch', { name: 'Enable two-way audio', exact: true }).click();
  await expect(page.getByText('Ready to hear and respond', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Close two-way audio settings' }).click();
  await page.getByRole('button', { name: 'Begin Mission' }).click();
  await page.getByRole('button', { name: "Don't show again options" }).click();
  await page.getByRole('button', { name: 'Disable all tips', exact: true }).click();
  const tipsToggle = page.getByRole('button', { name: 'Disable JIT tips', exact: true });
  if (await tipsToggle.isVisible()) await tipsToggle.click();
  await page.clock.runFor(311000);
  await expect(page.getByRole('button', { name: /Physical Access Control System/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.resume();
  await page.getByRole('button', { name: /Physical Access Control System/ }).click();
  await page.getByRole('button', { name: /MITIGATE.*DEGRADE/ }).click();
  await page.getByRole('button', { name: /Manual verification required/ }).click();
  await page.getByRole('button', { name: /Medium — temporary coverage gap/ }).click();
  if (!options.ttsOnly)
    await expect(page.getByRole('button', { name: 'Speak a response', exact: true })).toBeEnabled();
}

test('spoken updates remain available when speech input is disabled', async ({ page }) => {
  await prepare(page, { ttsOnly: true });
  await expect(page.getByRole('button', { name: 'Read Aloud', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Speak a response', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.__voiceTest.streams.length)).toBe(0);
});

async function speakThenPause(page) {
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish and send now' })).toBeVisible();
  await page.waitForTimeout(650); // Actual audio graph time, not model or simulation time.
  await page.evaluate(() => window.__voiceTest.quiet());
}

async function micIsReleased(page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__voiceTest.streams.every((stream) =>
          stream.getTracks().every((track) => track.readyState === 'ended')
        )
      )
    )
    .toBe(true);
}

test('end of speech sends the selected decision once without a review or commit click', async ({
  page,
  browserName,
}) => {
  await prepare(page);
  await speakThenPause(page);
  await expect(
    page.getByText('Response sent: I will verify the entrance and retain manual checks.', {
      exact: true,
    })
  ).toBeVisible();
  await micIsReleased(page);
  await page.screenshot({ path: `qa-output/voice-autosend-sent-${browserName}.png` });
  expect(await page.evaluate(() => window.__voiceTest.calls)).toBe(1);
  expect(await page.evaluate(() => window.__voiceTest.samples)).toBeGreaterThan(1000);
  const debrief = page.getByRole('button', { name: 'View debrief', exact: true });
  if (await debrief.isVisible()) await debrief.click();
  else {
    await page.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Debrief', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Export AAR' }).click();
  await expect(
    page.getByText(/I will verify the entrance and retain manual checks/).last()
  ).toBeVisible();
  await expect(page.getByText('Treatment: MITIGATE', { exact: true })).toHaveCount(1);
});

test('cancelling during recognition prevents a late result from sending', async ({ page }) => {
  await prepare(page, { deferred: true });
  await speakThenPause(page);
  await expect(page.getByRole('button', { name: 'Sending response…' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel response' }).click();
  await page.evaluate(() => window.__voiceTest.release());
  await micIsReleased(page);
  await expect(
    page.getByText('Response cancelled. Nothing was sent.', { exact: true })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commit Decision', exact: true })).toBeVisible();
  await expect(page.getByText(/^Response sent:/)).toHaveCount(0);
});

test('changing the decision cancels capture instead of attaching speech to another plan', async ({
  page,
}) => {
  await prepare(page);
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish and send now' })).toBeVisible();
  await page.getByRole('button', { name: /MITIGATE.*DEGRADE/ }).click();
  await micIsReleased(page);
  expect(await page.evaluate(() => window.__voiceTest.calls)).toBe(0);
  await expect(page.getByText(/^Response sent:/)).toHaveCount(0);
});

test('silence cannot be sent even with the explicit finish button', async ({ page }) => {
  await prepare(page, { silent: true });
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await page.getByRole('button', { name: 'Finish and send now' }).click();
  await expect(
    page.getByRole('status').filter({
      hasText: 'No clear speech was heard. Nothing was sent. Try speaking again.',
    })
  ).toBeVisible();
  await micIsReleased(page);
  expect(await page.evaluate(() => window.__voiceTest.calls)).toBe(0);
});

test('an interrupted microphone does not send a truncated response', async ({ page }) => {
  await prepare(page);
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish and send now' })).toBeVisible();
  await page.waitForTimeout(650);
  await page.evaluate(() =>
    window.__voiceTest.streams[0].getTracks().forEach((track) => track.stop())
  );
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /The microphone stopped before the response finished/ })
  ).toBeVisible();
  expect(await page.evaluate(() => window.__voiceTest.calls)).toBe(0);
  await expect(page.getByRole('button', { name: 'Commit Decision', exact: true })).toBeEnabled();
});

test('denied permission leaves a usable typed decision and sends nothing', async ({ page }) => {
  await prepare(page, { denied: true });
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /Microphone access or audio capture was unavailable/ })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Commit Decision', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__voiceTest.calls)).toBe(0);
});

test('cancelling a pending microphone permission releases the eventual stream', async ({
  page,
}) => {
  await prepare(page, { permissionPending: true });
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Opening microphone…' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel response' }).click();
  await page.evaluate(() => window.__voiceTest.allow());
  await expect.poll(() => page.evaluate(() => window.__voiceTest.streams.length)).toBe(1);
  await micIsReleased(page);
  expect(await page.evaluate(() => window.__voiceTest.calls)).toBe(0);
});

test('a cancelled permission request cannot erase a newer spoken response', async ({ page }) => {
  await prepare(page, { permissionPending: true });
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Opening microphone…' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel response' }).click();
  await page.evaluate(() => {
    window.__voiceTest.options.permissionPending = false;
  });
  await page.getByRole('button', { name: 'Speak a response', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Finish and send now' })).toBeVisible();
  await page.evaluate(() => {
    window.__voiceTest.quietNew = window.__voiceTest.quiet;
    window.__voiceTest.allow();
  });
  await expect.poll(() => page.evaluate(() => window.__voiceTest.streams.length)).toBe(2);
  await page.waitForTimeout(650);
  await page.evaluate(() => window.__voiceTest.quietNew());
  await expect(
    page.getByText('Response sent: I will verify the entrance and retain manual checks.', {
      exact: true,
    })
  ).toBeVisible();
  await micIsReleased(page);
  expect(await page.evaluate(() => window.__voiceTest.calls)).toBe(1);
});
