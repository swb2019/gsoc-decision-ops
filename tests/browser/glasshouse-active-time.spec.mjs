import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function report(page) {
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  return JSON.parse(await readFile(await (await downloaded).path(), 'utf8'));
}

test('a counterfactual measures its own active reading time instead of inheriting the original run', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await page.clock.runFor(7000);
  const original = await report(page);
  expect(original.activePlaySeconds).toBeGreaterThanOrEqual(7);
  const backup = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Try another approach here', exact: true }).click();
  await backup;
  const branch = await report(page);
  expect(branch.sessionId).not.toBe(original.sessionId);
  expect(branch.activePlaySeconds).toBeLessThan(3);
});

test('returning to launch flushes the final reading interval to the original saved record', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.clock.runFor(7000); // shorter than the periodic fifteen-second save
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
  await page
    .getByRole('button', { name: 'Start a new mission · preserve this backup', exact: true })
    .click();
  await page.getByRole('button', { name: /^Independent practice/ }).click();
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  const times = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const opening = indexedDB.open('hourglass:glasshouse:v1', 1);
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction('metadata', 'readonly').objectStore('metadata').getAll();
        request.onsuccess = () =>
          resolve(
            request.result
              .filter((item) => item.key.startsWith('active-time:'))
              .map((item) => item.seconds)
              .sort((a, b) => a - b)
          );
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
  expect(times).toHaveLength(2);
  expect(times[0]).toBeLessThan(3);
  expect(times[1]).toBeGreaterThanOrEqual(7);
});
