import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

async function start(page, mode = 'Guided practice') {
  await page.goto('/glasshouse/');
  await page.getByRole('button', { name: new RegExp(`^${mode}`) }).click();
  await expect(page.locator('.gh-command-heading h1')).toContainText('Glasshouse');
}

async function next(page) {
  await page.getByRole('button', { name: 'Next significant update', exact: true }).click();
}

async function exportJson(page) {
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const download = await waiting;
  return JSON.parse(await readFile(await download.path(), 'utf8'));
}

async function assertAccessible(page, label) {
  const result = await new AxeBuilder({ page })
    .include('.gh-app')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
    label
  ).toEqual([]);
}

test('flagship launch, full preview continuation, controlled handoff, frozen report and known-then fork', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto('/glasshouse/');
  await assertAccessible(page, 'Launch accessibility checks');
  await page.getByRole('button', { name: /^Preview/ }).click();
  await page.getByRole('button', { name: /Evidence, reasoning & safeguards/ }).click();
  await page.getByRole('checkbox', { name: /Mara Chen/ }).check();
  await page.getByRole('checkbox', { name: 'MITIGATE', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'TRANSFER', exact: true }).check();
  await page
    .getByLabel('Rationale', { exact: true })
    .fill('Private practice note: obtain a timestamped guard observation before broad controls.');
  await page
    .getByLabel('Review trigger', { exact: true })
    .fill('Reassess when the guard reports, or if service conditions change.');
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await expect(page.locator('.gh-commitments .gh-commitment')).toHaveCount(1);
  await next(page); // authored image at +3
  await next(page); // direct guard consequence at +4
  await expect(
    page.getByRole('heading', { name: 'Your first choice has a consequence.' })
  ).toBeVisible();
  await expect(page.locator('.gh-commitments')).toContainText('Direct entrance check received');
  await page.getByRole('button', { name: 'Review this checkpoint', exact: true }).click();
  await expect(page.getByText('Partial review · mission active', { exact: true })).toBeVisible();
  const partial = await exportJson(page);
  expect(partial.lifecycle).toBe('active');
  expect(partial.simulatedMinutes).toBe(4);
  expect(partial.decisions[0].treatments).toEqual(['TRANSFER']);
  expect(partial.decisions[0].knownEvidenceIds).not.toContain('image');
  await expect(page.locator('.gh-known-grid')).not.toContainText('A forwarded image appears');
  await page.getByRole('button', { name: 'Return to command', exact: true }).click();
  await page.getByRole('button', { name: 'Continue mission', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Control', exact: true })
    .selectOption('investigate-connector');
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await next(page); // +8
  await next(page); // +10 scope
  await page.getByRole('combobox', { name: 'Control', exact: true }).selectOption('monitor');
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await next(page); // +11 monitoring
  await next(page); // +12 correction
  await next(page); // +18 availability
  await next(page); // +24 repair
  await next(page); // +30 dispatch boundary
  await expect(page.locator('.gh-clock-offset')).toHaveText('+30 min');
  await assertAccessible(page, 'Command workspace accessibility checks');
  await page.getByRole('button', { name: 'Prepare handoff', exact: true }).click();
  await page
    .getByLabel('Situation & outstanding work')
    .fill(
      'Entrance verified; connector scope investigated. Dispatch continues under review. The relief watch owns remaining identity questions.'
    );
  await page.getByLabel('Receiving owner').fill('Relief watch');
  await page
    .locator('.gh-handoff-panel')
    .getByLabel('Review trigger')
    .fill('Review at the next vendor update or any new entry anomaly.');
  await page.getByRole('button', { name: 'Record handoff', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The watch is handed over.' })).toBeVisible();
  await page.getByRole('button', { name: 'Open causal debrief', exact: true }).click();
  const completed = await exportJson(page);
  expect(completed.lifecycle).toBe('completed');
  expect(completed.mode).toBe('guided');
  expect(completed.decisions).toHaveLength(3);
  expect(completed.decisions[0]).toEqual(partial.decisions[0]);
  expect(completed.ledger.netBenefitCents).toBe(
    completed.ledger.avoidedLossCents - completed.ledger.treatmentCostCents
  );
  await assertAccessible(page, 'Review accessibility checks');
  const second = await exportJson(page);
  expect(second).toEqual(completed); // review and export do not advance time or change the frozen record
  await page.getByRole('checkbox', { name: /Redact free text/ }).check();
  const redacted = await exportJson(page);
  expect(redacted.redacted).toBe(true);
  expect(JSON.stringify(redacted)).not.toContain('Private practice note');
  expect(redacted.decisions[0].treatments).toEqual(['TRANSFER']);
  const htmlWaiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'HTML', exact: true }).click();
  expect((await htmlWaiting).suggestedFilename()).toMatch(/-redacted\.html$/);
  const pdfWaiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  const pdfDownload = await pdfWaiting;
  expect((await readFile(await pdfDownload.path())).subarray(0, 5).toString()).toBe('%PDF-');
  await page.getByLabel('Inspect a decision').selectOption('d1');
  const backupWaiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Try another approach here', exact: true }).click();
  const backup = JSON.parse(await readFile(await (await backupWaiting).path(), 'utf8'));
  expect(JSON.stringify(backup)).toContain(completed.sessionId);
  await expect(page.locator('.gh-clock-offset')).toHaveText('+0 min');
  await expect(page.locator('.gh-branch-banner')).toContainText('Compare at +30 min');
  await expect(page.locator('.gh-commitment')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Control', exact: true }).selectOption('manual-access');
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await page.getByRole('button', { name: 'See next consequence & compare', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Comparison at the same horizon', exact: true })
  ).toBeVisible();
  const alternative = await exportJson(page);
  expect(alternative.sessionId).not.toBe(completed.sessionId);
  expect(alternative.simulatedMinutes).toBe(2);
  expect(alternative.decisions).toHaveLength(1);
  expect(alternative.decisions[0].control).toBe('manual-access');
});

test('approval receipt, shared evidence, actual authorization, cancellation and append-only revision', async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole('combobox', { name: 'Control', exact: true })
    .selectOption('isolate-connector');
  await expect(page.getByRole('combobox', { name: 'Authority', exact: true })).toHaveValue(
    'approval'
  );
  await page.getByRole('button', { name: /Evidence, reasoning & safeguards/ }).click();
  await page.getByRole('checkbox', { name: /Elias Reed/ }).check();
  await page
    .getByLabel('Review trigger', { exact: true })
    .fill('Review service impact when the scope comparison arrives.');
  await page.getByRole('button', { name: 'Request approval', exact: true }).click();
  const commitment = page.locator('.gh-commitment').first();
  await expect(commitment.getByText('requested', { exact: true })).toBeVisible();
  for (
    let step = 0;
    step < 4 && (await commitment.getByText('requested', { exact: true }).isVisible());
    step++
  )
    await next(page);
  await expect(commitment.getByText('started', { exact: true })).toBeVisible();
  await commitment.getByRole('button', { name: 'Cancel commitment', exact: true }).click();
  await expect(commitment.getByText('cancelled', { exact: true })).toBeVisible();
  await commitment.getByRole('button', { name: 'Revise plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revise your plan', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Elias Reed/ })).toBeChecked();
  await page
    .getByLabel('Rationale', { exact: true })
    .fill('Revised scope and review conditions, with original evidence retained.');
  await page.getByRole('button', { name: 'Request approval', exact: true }).click();
  await expect(page.locator('.gh-commitment')).toHaveCount(2);
  await page.getByRole('button', { name: 'Review checkpoint', exact: true }).click();
  const report = await exportJson(page);
  expect(report.decisions[1].revisionOf).toBe(report.decisions[0].id);
  expect(report.decisions[1].evidenceIds).toEqual(report.decisions[0].evidenceIds);
  expect(report.events.some((event) => event.type === 'approval.granted')).toBe(true);
  expect(report.events.some((event) => event.type === 'action.cancelled')).toBe(true);
});

test('second tab is read-only before any command and explicit takeover restores the saved run', async ({
  page,
  context,
}) => {
  await start(page);
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await page
    .getByRole('button', { name: 'Open display and local data settings', exact: true })
    .click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/glasshouse/');
  await expect(other.locator('.gh-unsaved')).toContainText('Another tab owns this journal');
  await expect(
    other.getByRole('button', { name: 'Next significant update', exact: true })
  ).toBeDisabled();
  await other.getByRole('button', { name: 'Take over here', exact: true }).click();
  await expect(
    other.getByRole('button', { name: 'Next significant update', exact: true })
  ).toBeEnabled();
  await expect(other.locator('.gh-commitment')).toHaveCount(1);
  await next(other);
  await expect(other.locator('.gh-clock-offset')).toHaveText('+3 min');
  await page.bringToFront();
  await expect(page.locator('.gh-unsaved')).toContainText('Another tab owns this journal');
});

for (const width of [320, 390])
  test(`sequential mobile workspace at ${width}px keeps evidence, controls and review reachable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await start(page, 'Independent practice');
    await expect(page.getByRole('button', { name: 'Context help', exact: true })).toHaveCount(0);
    await expect(page.locator('.gh-evidence-area')).toBeVisible();
    await page.getByRole('button', { name: 'Decide', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Control', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
    await page.getByRole('button', { name: 'Situation', exact: true }).click();
    await expect(page.getByRole('img', { name: 'Glasshouse campus dependencies' })).toBeVisible();
    await page.getByRole('button', { name: /Identity connector.*known reports/ }).click();
    await page.getByRole('button', { name: 'Inspect related evidence', exact: true }).click();
    await expect(page.getByLabel('Show reports')).toHaveValue('connector');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.getByRole('button', { name: 'Review checkpoint', exact: true }).click();
    await expect(page.getByText('Partial review · mission active', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  });

test('keyboard control traversal, visible focus and reduced-motion default preserve a complete plan path', async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/glasshouse/');
  await page.keyboard.press('Tab');
  if (browserName === 'webkit' && process.platform === 'win32') {
    test.info().annotations.push({
      type: 'capability',
      description:
        'The Windows WebKit port skips native links in its default Tab order. This run checks skip-link focus/Enter and native form-control Tab traversal; Safari full-keyboard-access qualification remains separate.',
    });
    await page.getByRole('link', { name: 'Skip to exercise' }).focus();
  }
  await expect(page.getByRole('link', { name: 'Skip to exercise' })).toBeFocused();
  expect(
    await page
      .getByRole('link', { name: 'Skip to exercise' })
      .evaluate((element) => getComputedStyle(element).outlineStyle)
  ).not.toBe('none');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /^Guided practice/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.gh-app')).toHaveClass(/gh-motion-off/);
  // Let the authored context-change focus settle before starting form traversal.
  // Otherwise a fast driver can focus a new select before the heading focus effect runs.
  await expect(page.locator('.gh-command-heading #gh-page-title')).toBeFocused();
  await page.getByRole('combobox', { name: 'Control', exact: true }).focus();
  await expect(page.getByRole('combobox', { name: 'Control', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Scope', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Service posture', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Commit plan', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.gh-commitment')).toHaveCount(1);
});

test('uncommitted plan and revision drafts survive review and mobile navigation without entering the journal', async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole('combobox', { name: 'Control', exact: true })
    .selectOption('investigate-connector');
  await page.getByRole('button', { name: /Evidence, reasoning & safeguards/ }).click();
  await page.getByRole('checkbox', { name: /Elias Reed/ }).check();
  await page.getByRole('checkbox', { name: 'TRANSFER', exact: true }).check();
  await page.getByRole('checkbox', { name: 'MITIGATE', exact: true }).uncheck();
  const rationale =
    'Uncommitted working draft: compare the affected connector logs before expanding scope.';
  await page.getByLabel('Rationale', { exact: true }).fill(rationale);
  await page
    .getByLabel('Viable alternative', { exact: true })
    .fill('Use delegated manual checks while waiting for scoped evidence.');
  await page.getByRole('button', { name: 'Review checkpoint', exact: true }).click();
  const beforeCommit = await exportJson(page);
  expect(beforeCommit.decisions).toEqual([]);
  expect(JSON.stringify(beforeCommit)).not.toContain('Uncommitted working draft');
  await page.getByRole('button', { name: 'Return to command', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Control', exact: true })).toHaveValue(
    'investigate-connector'
  );
  await expect(page.getByLabel('Rationale', { exact: true })).toHaveValue(rationale);
  await expect(page.getByRole('checkbox', { name: /Elias Reed/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'TRANSFER', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'MITIGATE', exact: true })).not.toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Decide', exact: true }).click();
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  await page.getByRole('button', { name: 'Decide', exact: true }).click();
  await expect(page.getByLabel('Rationale', { exact: true })).toHaveValue(rationale);
  await page.getByRole('button', { name: 'Commit plan', exact: true }).click();
  await expect(page.locator('.gh-commitment')).toHaveCount(1);
  await page.getByRole('button', { name: /Evidence, reasoning & safeguards/ }).click();
  await expect(page.getByLabel('Rationale', { exact: true })).toHaveValue('');
  await expect(page.getByRole('checkbox', { name: /Elias Reed/ })).not.toBeChecked();
  await page.getByRole('button', { name: 'Cancel commitment', exact: true }).click();
  await page.getByRole('button', { name: 'Revise plan', exact: true }).click();
  const revision = 'Revision draft: retain the original evidence and revisit the control timing.';
  await page.getByLabel('Rationale', { exact: true }).fill(revision);
  await page.getByRole('button', { name: 'Review checkpoint', exact: true }).click();
  const original = await exportJson(page);
  expect(original.decisions).toHaveLength(1);
  expect(original.decisions[0].rationale).toBe(rationale);
  expect(JSON.stringify(original)).not.toContain('Revision draft');
  await page.getByRole('button', { name: 'Return to command', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revise your plan', exact: true })).toBeVisible();
  await expect(page.getByLabel('Rationale', { exact: true })).toHaveValue(revision);
  await expect(page.getByRole('checkbox', { name: /Elias Reed/ })).toBeChecked();
  await page.getByRole('button', { name: 'Commit revised plan', exact: true }).click();
  await expect(page.locator('.gh-commitment')).toHaveCount(2);
});
