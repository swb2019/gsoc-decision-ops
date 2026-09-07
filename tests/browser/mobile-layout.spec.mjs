import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
test.use({ hasTouch: true });

async function noOverflow(page) {
  try {
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      .toBe(true);
  } catch (error) {
    console.log(
      await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll('body *')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width && r.right > innerWidth + 1;
          })
          .map((e) => ({
            tag: e.tagName,
            cls: String(e.className),
            text: e.textContent.slice(0, 80),
            rect: e.getBoundingClientRect().toJSON(),
          })),
      }))
    );
    throw error;
  }
}
async function touchSize(locator) {
  // Measure the settled hit area, after the menu's entrance transform completes.
  await expect
    .poll(async () => (await locator.boundingBox())?.height ?? 0)
    .toBeGreaterThanOrEqual(43.99);
  await expect
    .poll(async () => (await locator.boundingBox())?.width ?? 0)
    .toBeGreaterThanOrEqual(43.99);
}

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
]) {
  test(`mobile mission controls and audio settings fit ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/scenarios/access-control-ransomware/');
    await expect(page.getByRole('button', { name: 'Begin Mission', exact: true })).toBeVisible();
    await noOverflow(page);
    const more = page.getByRole('button', { name: 'More options' });
    await touchSize(more);
    await more.tap();
    const audio = page.getByRole('menuitem', { name: 'Two-way audio', exact: true });
    await touchSize(audio);
    await audio.tap();
    const dialog = page.getByRole('dialog', { name: 'Two-way audio settings' });
    await expect(dialog).toBeVisible();
    await noOverflow(page);
    const toggle = dialog.getByRole('switch', { name: 'Enable two-way audio', exact: true });
    await touchSize(toggle);
    await toggle.scrollIntoViewIfNeeded();
    // No model download or microphone request is needed for layout qualification.
    const close = dialog.getByRole('button', { name: 'Close two-way audio settings' });
    await close.scrollIntoViewIfNeeded();
    const bounds = await close.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    await close.tap();
    await expect(dialog).toHaveCount(0);
    await mkdir('qa-output/mobile', { recursive: true });
    await page.screenshot({ path: `qa-output/mobile/legacy-${viewport.width}.png` });
  });

  test(`Glasshouse plan and review reflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/glasshouse/');
    await page.getByRole('button', { name: /^Guided practice/ }).tap();
    await expect(page.locator('.gh-command-heading')).toBeVisible();
    const decide = page
      .getByRole('navigation', { name: 'Workspace areas' })
      .getByRole('button', { name: 'Decide', exact: true });
    if (await decide.isVisible()) await decide.tap();
    await noOverflow(page);
    for (const input of await page.locator('.gh-composer select').all()) {
      if (!(await input.isVisible())) continue;
      expect(
        await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
      ).toBeGreaterThanOrEqual(16);
      await touchSize(input);
    }
    await page.getByRole('button', { name: /Evidence, reasoning & safeguards/ }).tap();
    const rationale = page.getByRole('textbox', { name: 'Rationale', exact: true });
    await rationale.fill('Verify the entrance while preserving safe access.');
    expect(
      await rationale.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
    ).toBeGreaterThanOrEqual(16);
    // A reduced viewport tests reflow; physical Android separately exercises its actual keyboard.
    await page.setViewportSize({ width: viewport.width, height: Math.min(360, viewport.height) });
    await noOverflow(page);
    await page.getByRole('button', { name: 'Commit plan', exact: true }).tap();
    await expect(page.locator('.gh-commitment')).toHaveCount(1);
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await noOverflow(page);
    await page.getByRole('button', { name: 'Review', exact: true }).tap();
    await expect(
      page.getByRole('heading', { name: 'What did your choices change?' })
    ).toBeVisible();
    await noOverflow(page);
    await mkdir('qa-output/mobile', { recursive: true });
    await page.screenshot({ path: `qa-output/mobile/review-rotated-${viewport.width}.png` });
  });
}

test('enlarged mobile text preserves the plan and touch navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: /^Guided practice/ }).tap();
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  const tabs = page.getByRole('navigation', { name: 'Workspace areas' });
  await tabs.getByRole('button', { name: 'Decide', exact: true }).tap();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Commit plan', exact: true }).tap();
  await expect(page.locator('.gh-commitment')).toHaveCount(1);
});
