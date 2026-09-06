import { test, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';

test('campaign and free-play entry, persistence, and reset confirmation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The first hour');
  await expect(page.locator('#free-play a[href*="/scenarios/"]')).toHaveCount(8);
  // A saved campaign fixture tests rendering/persistence, without claiming a completed live mission.
  await page.evaluate(() => {
    localStorage.setItem('hourglass-campaign-completions', JSON.stringify(['arc-1-foundations']));
    localStorage.setItem('hourglass-campaign-unlocks', JSON.stringify(['arc-1-foundations']));
  });
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('hourglass-campaign-completions')))
  ).toEqual(['arc-1-foundations']);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Reset campaign progress' }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('hourglass-campaign-completions')))
  ).toEqual(['arc-1-foundations']);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset campaign progress' }).click();
  expect(
    await page.evaluate(() => localStorage.getItem('hourglass-campaign-completions'))
  ).toBeNull();
  await page.getByRole('link', { name: 'Enter the simulation' }).click();
  await expect(page.getByRole('button', { name: 'Begin Mission' })).toBeVisible();
});

test('a decision appears in the review and produces a PDF download', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/scenarios/access-control-ransomware/');
  await page.getByRole('button', { name: 'Begin Mission' }).click();
  // First-visit guidance appears after the mission begins. Dismiss it through
  // the UI before working with the decision that the first inject opens.
  await page.getByRole('button', { name: "Don't show again options" }).click();
  await page.getByRole('button', { name: 'Disable all tips', exact: true }).click();
  await page.getByRole('button', { name: 'Disable JIT tips' }).click();
  const asset = page.getByRole('button', { name: /Physical Access Control System/ });
  await asset.waitFor({ state: 'visible', timeout: 60000 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await asset.click();
  await page.getByRole('button', { name: 'Brief Owner', exact: true }).click();
  await expect(page.getByRole('button', { name: /Briefed/ })).toBeVisible();
  await page.getByRole('button', { name: /MITIGATE.*DEGRADE/ }).click();
  await page.getByRole('button', { name: /Manual verification required/ }).click();
  await page.getByRole('button', { name: /Medium — temporary coverage gap/ }).click();
  await page.getByRole('button', { name: 'Commit Decision' }).click();
  await expect(page.getByRole('heading', { name: 'Decision Log' })).toBeVisible();
  await page.getByRole('button', { name: 'View debrief' }).click();
  await page.getByRole('button', { name: 'Export AAR' }).click();
  await expect(page.getByRole('heading', { name: 'Decision Timeline' })).toBeVisible();
  await expect(page.getByText('Treatment: MITIGATE', { exact: true })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF', exact: true }).click();
  const download = await pending;
  await mkdir('qa-output', { recursive: true });
  await download.saveAs('qa-output/decision-review.pdf');
  const bytes = await readFile('qa-output/decision-review.pdf');
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(10000);
  await page.getByRole('button', { name: 'Close export preview' }).click();
  await page.getByRole('button', { name: 'Close after-action review' }).click();
  await expect(page.getByRole('heading', { name: 'Decision Log' })).toBeVisible();
});

test('headset provisioning is opt-in and cancellation returns the switch to idle', async ({
  page,
}) => {
  let modules = 0,
    models = 0,
    release;
  await page.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1', (route) => {
    modules++;
    return route.fulfill({
      contentType: 'text/javascript',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: "export const env={}; export async function pipeline(){ await fetch('https://huggingface.co/swb-test/model'); return ()=>{}; }",
    });
  });
  await page.route('https://huggingface.co/swb-test/model', (route) => {
    models++;
    return new Promise((resolve) => {
      release = async () => {
        await route.abort().catch(() => {});
        resolve();
      };
    });
  });
  await page.goto('/scenarios/access-control-ransomware/');
  expect(modules).toBe(0);
  expect(models).toBe(0);
  await page.getByRole('button', { name: 'Enable local comms headset' }).click();
  const toggle = page.getByRole('switch', { name: 'Enable headset' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect.poll(() => models).toBe(1);
  await page.getByRole('button', { name: 'Cancel model download' }).click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).toBeEnabled();
  await release?.();
  await page.getByRole('button', { name: 'Close headset settings' }).click();
  await expect(page.getByRole('button', { name: 'Begin Mission' })).toBeVisible();
});
