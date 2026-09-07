import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function settings(page) {
  await page.getByRole('button', { name: 'Open display and local data settings' }).click();
}
async function checkpoint(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const open = indexedDB.open('hourglass:glasshouse:v1', 1);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(['metadata', 'checkpoints'], 'readonly');
        const current = transaction.objectStore('metadata').get('current');
        current.onsuccess = () => {
          const saved = transaction.objectStore('checkpoints').get(current.result.value);
          saved.onsuccess = () => resolve(saved.result);
          saved.onerror = () => reject(saved.error);
        };
        current.onerror = () => reject(current.error);
      });
    } finally {
      db.close();
    }
  });
}
async function report(page) {
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  return JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
}

test('historical rubric import preserves the original report without resuming or autosaving it', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/glasshouse/');
  await settings(page);
  await page
    .locator('input[type=file]')
    .setInputFiles(resolve('packages/core/src/glasshouse/fixtures/observable-1.0.0-session.json'));
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.getByRole('button', { name: 'Commit plan', exact: true })).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Next significant update', exact: true })
  ).toBeDisabled();
  const before = await checkpoint(page);
  await page.clock.runFor(20000);
  expect(await checkpoint(page)).toEqual(before);
  const old = await report(page);
  await expect(
    page.getByRole('button', { name: 'Try another approach here', exact: true })
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Save improvement locally', exact: true })
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Flag a disagreement', exact: true }).first()
  ).toBeDisabled();
  expect(old.versions.rubric).toBe('observable-1.0.0');
  expect(old.versions.rules).toBe('kernel-1.0.0');
  expect(old.versions.assets).toBe('campus-1.0.0');
  expect(old.limitations.join(' ')).toContain('has not been regraded');
  expect(old.unresolved.join(' ')).not.toContain('send an updated brief');
  expect(old.canonicalDigest).toBe('fnv1a-1b214652');
  await settings(page);
  await page
    .getByRole('button', { name: 'Start a new mission · preserve this backup', exact: true })
    .click();
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await expect(page.getByRole('button', { name: 'Commit plan', exact: true })).toBeEnabled();
  expect((await report(page)).versions).toMatchObject({
    rubric: 'observable-1.0.1',
    rules: 'kernel-1.1.0',
    assets: 'campus-audio-1.1.0',
  });
});

test('denied storage cannot be reported as successful deletion of an existing journal', async ({
  page,
  context,
}) => {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await settings(page);
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  await page.addInitScript(() => {
    IDBFactory.prototype.open = function () {
      throw new DOMException('Injected storage denial', 'SecurityError');
    };
  });
  await page.reload();
  await expect(page.locator('.gh-unsaved')).toContainText('denied persistent storage');
  await settings(page);
  await page.getByRole('button', { name: 'Delete local Glasshouse journal', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Glasshouse data', exact: true }).click();
  await expect(page.locator('.gh-error[role="alert"]')).toContainText('No deletion was confirmed');
  await settings(page);
  await expect(page.locator('.gh-save-state')).not.toContainText('journal deleted');
  const other = await context.newPage();
  await other.goto('/glasshouse/');
  await expect(other.locator('.gh-commitment')).toHaveCount(1);
});

test('an explicit end records abandonment durably without completing or clearing unfinished work', async ({
  page,
}) => {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await settings(page);
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  await page.getByRole('button', { name: 'Close settings' }).click();
  const before = JSON.parse((await checkpoint(page)).text).state;
  await page.getByRole('button', { name: 'End practice here', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'End practice and keep record', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Keep practicing', exact: true }).click();
  expect(JSON.parse((await checkpoint(page)).text).state).toEqual(before);
  await page.getByRole('button', { name: 'End practice here', exact: true }).click();
  await page
    .getByLabel('Reason for ending practice')
    .fill('Private note: another commitment requires ending this practice here.');
  await page.getByRole('button', { name: 'End practice and keep record', exact: true }).click();
  await expect(page.locator('.gh-review-status')).toContainText(
    'Abandoned · practice ended voluntarily'
  );
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const ended = JSON.parse(await readFile(await (await downloaded).path(), 'utf8'));
  expect(ended.lifecycle).toBe('abandoned');
  expect(ended.simulatedMinutes).toBe(before.tick);
  expect(ended.actions).toEqual(before.actions);
  expect(ended.ledger).toEqual(before.ledger);
  expect(ended.findings.find((finding) => finding.id === 'gh-8').score).toBeNull();
  await settings(page);
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Next significant update', exact: true })
  ).toBeDisabled();
  expect((await report(page)).canonicalDigest).toBe(ended.canonicalDigest);
  await settings(page);
  await page.getByRole('button', { name: 'Show local practice history', exact: true }).click();
  await expect(page.getByRole('article', { name: /^Saved practice / }).first()).toContainText(
    'Abandoned · practice ended voluntarily'
  );
});

test('a writer-lease read-only review cannot append feedback or create a fork', async ({
  page,
  context,
}) => {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).click();
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await settings(page);
  await expect(page.locator('.gh-save-state')).toContainText('Saved');
  const other = await context.newPage();
  await other.goto('/glasshouse/');
  await expect(other.locator('.gh-unsaved')).toContainText('Another tab owns this journal');
  await other.getByRole('button', { name: 'Review', exact: true }).click();
  await expect(
    other.getByRole('button', { name: 'Try another approach here', exact: true })
  ).toBeDisabled();
  await expect(
    other.getByRole('button', { name: 'Save improvement locally', exact: true })
  ).toBeDisabled();
  await expect(
    other.getByRole('button', { name: 'Flag a disagreement', exact: true }).first()
  ).toBeDisabled();
});
