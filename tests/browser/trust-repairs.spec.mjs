import { test, expect } from '@playwright/test';

const route = '/scenarios/access-control-ransomware/';
const storageKey = 'hourglass-command-session';

async function beginLegacyExercise(page) {
  // Avoid freezing a decorative CSS transition when this timing regression pauses the clock.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto(route);
  await page.getByRole('button', { name: 'Begin Mission', exact: true }).click();
  await page.getByRole('button', { name: "Don't show again options" }).click();
  await page.getByRole('button', { name: 'Disable all tips', exact: true }).click();
  await page.getByRole('button', { name: 'Disable JIT tips' }).click();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 1_000)));
  // This legacy case authors its first receipt at minute 5. Preserve that
  // chronology while advancing the test's browser clock through the wait.
  await page.clock.runFor(311_000);
  await expect(page.getByRole('button', { name: /Physical Access Control System/ })).toBeVisible();
}

test('partial review preserves saved bytes and the decision window without completing the mission', async ({
  page,
}) => {
  await beginLegacyExercise(page);
  const decisionTimer = page.locator('[aria-label="Decision time remaining"]:visible').first();
  const remainingBefore = Number.parseInt(await decisionTimer.textContent(), 10);
  await page.getByRole('button', { name: 'View debrief', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Partial Review', exact: true })).toBeVisible();
  const originalSave = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  expect(JSON.parse(originalSave).isComplete).toBe(false);
  await page.clock.runFor(15_000);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(originalSave);
  expect(
    await page.evaluate(() => localStorage.getItem('hourglass-campaign-completions'))
  ).toBeNull();
  await page.getByRole('button', { name: 'Close after-action review' }).click();
  expect(Number.parseInt(await decisionTimer.textContent(), 10)).toBe(remainingBefore);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.clock.runFor(1_000);
  // The clock delivers the interval; React may commit its render in the next browser task.
  await expect
    .poll(async () => Number.parseInt(await decisionTimer.textContent(), 10))
    .toBe(remainingBefore - 1);
});

test('explicit TRANSFER and its concrete control survive the decision and report', async ({
  page,
}) => {
  await beginLegacyExercise(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: /Physical Access Control System/ }).click();
  await page.getByRole('button', { name: 'Brief Owner', exact: true }).click();
  await page.getByRole('button', { name: /TRANSFER.*DEGRADE/ }).click();
  await page.getByRole('button', { name: /Escalate to vendor support/ }).click();
  await page.getByRole('button', { name: /Medium — temporary coverage gap/ }).click();
  await page.getByRole('button', { name: 'Commit Decision', exact: true }).click();
  await page.getByRole('button', { name: 'View debrief', exact: true }).click();
  await page.getByRole('button', { name: 'Export AAR', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Partial After-Action Report', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Treatment: TRANSFER', { exact: true })).toBeVisible();
  await expect(page.getByText(/Treatment: TRANSFER\. Control: transfer-vendor\./)).toBeVisible();
});

test('an old legacy record is read-only and its exact bytes survive a fresh exercise', async ({
  page,
}) => {
  await beginLegacyExercise(page);
  const originalSave = await page.evaluate((key) => {
    const snapshot = JSON.parse(localStorage.getItem(key));
    snapshot.savedAt = 1;
    snapshot.isComplete = true;
    snapshot.log.incident.title = 'Original legacy evidence';
    const original = JSON.stringify(snapshot);
    localStorage.setItem(key, original);
    return original;
  }, storageKey);
  await page.reload();
  // Allow the route's deferred initialization to run after the controlled clock test.
  await page.clock.resume();
  await expect(page.getByRole('heading', { name: 'Legacy Record Found' })).toBeVisible();
  await page.getByRole('button', { name: 'Review Saved Record', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Original legacy evidence', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Difficulty not recorded', { exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(originalSave);
  await page.getByRole('button', { name: 'Close after-action review' }).click();
  await page.getByRole('button', { name: 'Begin Mission', exact: true }).click();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey))
    .not.toBe(originalSave);
  const archives = await page.evaluate(
    (key) =>
      Object.keys(localStorage)
        .filter((name) => name.startsWith(`${key}:archive:`))
        .map((name) => localStorage.getItem(name)),
    storageKey
  );
  expect(archives).toContain(originalSave);
});

test('a failed archive keeps the original save and reports memory-only operation', async ({
  page,
}) => {
  await beginLegacyExercise(page);
  const originalSave = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  await page.addInitScript(() => {
    const originalWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('hourglass-command-session:archive:')) {
        throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      }
      return originalWrite.call(this, key, value);
    };
  });
  await page.reload();
  await page.clock.resume();
  await page.getByRole('button', { name: 'Start Fresh', exact: true }).click();
  await page.getByRole('button', { name: 'Begin Mission', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saving is unavailable' })).toContainText(
    'this run currently exists only in memory'
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(originalSave);
});
