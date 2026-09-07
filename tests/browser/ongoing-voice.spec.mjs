import { test, expect } from '@playwright/test';
import { setup, utter } from './helpers/ongoing-voice.mjs';

test('one activation runs successive Glasshouse decisions and a spoken handoff on mobile', async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = await setup(page, '/glasshouse/');
  // No UI actions from activation until voice stops.
  await utter(page, 'Start guided practice', /Mission started/);
  await utter(page, 'Do not verify the entrance', /I have not acted/);
  await utter(page, 'Verify the entrance and investigate the connector', /multiple actions/);
  await utter(page, 'Verify the entrance', /Committed.*verify/i);
  await utter(page, 'Monitor', /Committed continue with a review commitment/i);
  await utter(page, 'Next update', /Advanced to/);
  await utter(page, 'Review', /2 decisions are recorded/);
  await utter(page, 'Return to command', /Command view open/);
  await utter(page, 'Handoff', /What summary/);
  await utter(page, 'Entrance verification requested and monitoring retained', /Who owns/);
  await utter(page, 'The next watch commander', /What should trigger/);
  await utter(
    page,
    'Review when the entrance verification report arrives',
    /Early or unresolved handoff recorded/
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
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    .toBe(true);
  await page.screenshot({ path: 'qa-output/ongoing-voice-mobile-handoff.png', fullPage: true });
});

test('legacy decisions collect missing choices through speech and record without taps', async ({
  page,
}) => {
  test.setTimeout(120000);
  const panel = await setup(page, '/scenarios/access-control-ransomware/');
  await utter(page, 'Start mission', /Mission running/);
  await expect(panel.getByRole('status')).toHaveText('Listening — speak naturally');
  await page.clock.runFor(311000);
  await page.clock.resume();
  await utter(page, 'Pause', /Simulation paused/);
  await utter(page, 'Manual verification', /Which asset/);
  await utter(page, 'Physical access control', /Which residual risk/);
  await utter(page, 'Medium temporary coverage gap', /Decision recorded/);
  await utter(page, 'Stop listening');
  await expect(panel.getByRole('status')).toHaveText('Conversation off');
  await expect(page.getByText(/^Decision recorded\./).first()).toBeVisible();
  expect(
    await page.evaluate(
      () => window.__conversation.replies.filter((t) => t.startsWith('Decision recorded.')).length
    )
  ).toBe(1);
});
