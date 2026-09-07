import { readFileSync, realpathSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_GATES = Object.freeze([
  'semanticEngineering',
  'independentContentAndRubricReview',
  'formativePlaytest',
  'manualAccessibilityAndDevices',
  'artAudioComparator',
  'publicRollbackRehearsal',
]);
const REVIEW_ROLES = ['physical-security', 'cyber-response', 'exercise-design'];
const VERSION_KEYS = {
  scenario: 'scenarioVersion',
  rubric: 'rubricVersion',
  rules: 'rulesVersion',
  assets: 'assetsVersion',
};
const held = (reason) => {
  throw new Error(`Public release is held. ${reason}`);
};
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
function named(value) {
  return (
    typeof value === 'string' &&
    value.trim().length >= 3 &&
    value.length <= 150 &&
    !/\b(pending|unknown|unassigned|tbd|placeholder|automated|assistant|chatgpt|codex|ai-assisted)\b/i.test(
      value
    )
  );
}
function actualDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value &&
    parsed.getTime() <= Date.now()
  );
}
function verifyEvidence(path, repositoryRoot) {
  if (
    typeof path !== 'string' ||
    !path ||
    path.length > 500 ||
    isAbsolute(path) ||
    /[:\\\0]/.test(path) ||
    path.split('/').some((part) => !part || part === '.' || part === '..')
  )
    held(
      'Evidence must use bounded repository-relative file paths without traversal or external URLs.'
    );
  try {
    const absolute = realpathSync(resolve(repositoryRoot, path));
    const within = relative(realpathSync(repositoryRoot), absolute);
    if (!within || within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within))
      held(`Evidence leaves the repository: ${path}.`);
    const info = statSync(absolute);
    if (!info.isFile() || info.size < 1 || info.size > 100 * 1024 * 1024)
      held(`Evidence must be a nonempty file of at most 100 MB: ${path}.`);
  } catch (error) {
    held(`Evidence could not be verified (${path}): ${error.message}`);
  }
}

/** Validates declarations and evidence references, not the truth of a human qualification result. */
export function validateQualificationRecord(record, repositoryRoot = process.cwd()) {
  if (!object(record) || record.publicRelease !== 'qualified')
    held(
      'Record independently completed qualification for the exact revision; automated tests cannot substitute for human gates.'
    );
  if (
    record.schemaVersion !== 1 ||
    record.product !== 'Hourglass Command Glasshouse' ||
    !named(record.accountableOwner)
  )
    held('A supported schema, product and named accountable owner are required.');
  for (const field of ['baseline', 'qualificationRevision'])
    if (typeof record[field] !== 'string' || !/^[0-9a-f]{40}$/.test(record[field]))
      held(`${field} must name an exact 40-character Git revision.`);
  const content = readFileSync(
    resolve(repositoryRoot, 'packages/core/src/glasshouse/content.ts'),
    'utf8'
  );
  const versionBlock = content.match(
    /export const GLASSHOUSE_VERSIONS\s*=\s*\{([\s\S]*?)\}\s*as const/
  );
  if (!versionBlock) held('The authored content version contract could not be read.');
  for (const [key, field] of Object.entries(VERSION_KEYS)) {
    const version = versionBlock[1].match(new RegExp(`\\b${key}:\\s*['"]([^'"]+)['"]`))?.[1];
    if (!version || record[field] !== version) held(`${field} does not match the authored pack.`);
  }
  if (
    !object(record.gates) ||
    Object.keys(record.gates).length !== REQUIRED_GATES.length ||
    REQUIRED_GATES.some((key) => !Object.hasOwn(record.gates, key))
  )
    held(
      'Every named engineering and human gate is required; empty, missing or unknown gates cannot qualify a release.'
    );
  for (const name of REQUIRED_GATES) {
    const gate = record.gates[name];
    if (!object(gate) || gate.status !== 'passed')
      held(`${name} needs a structured passed decision.`);
    if (
      !Array.isArray(gate.evidence) ||
      gate.evidence.length < 1 ||
      gate.evidence.length > 50 ||
      new Set(gate.evidence).size !== gate.evidence.length
    )
      held(`${name} needs distinct local evidence files.`);
    for (const path of gate.evidence) verifyEvidence(path, repositoryRoot);
    if (
      !Array.isArray(gate.signoffs) ||
      gate.signoffs.length < 1 ||
      gate.signoffs.length > 20 ||
      gate.signoffs.some(
        (entry) =>
          !object(entry) || !named(entry.name) || !named(entry.role) || !actualDate(entry.date)
      )
    )
      held(`${name} needs named signoffs with roles and valid completed review dates.`);
    if (name === 'independentContentAndRubricReview') {
      const reviewers = REVIEW_ROLES.map((role) =>
        gate.signoffs.find((entry) => entry.role === role)
      );
      if (
        reviewers.some((entry) => !entry) ||
        new Set(reviewers.map((entry) => entry?.name.trim().toLowerCase())).size !==
          REVIEW_ROLES.length ||
        reviewers.some(
          (entry) =>
            entry?.name.trim().toLowerCase() === record.accountableOwner.trim().toLowerCase()
        )
      )
        held(
          'Independent content review needs three distinct non-owner reviewers spanning physical-security, cyber-response and exercise-design.'
        );
    }
  }
  return record;
}

export function checkReleaseGate(repositoryRoot = process.cwd()) {
  const record = validateQualificationRecord(
    JSON.parse(readFileSync(resolve(repositoryRoot, 'release/qualification.json'), 'utf8')),
    repositoryRoot
  );
  // A later qualification-only commit may identify reviewed code without a self-referential hash.
  // The executable sources must still be identical to the reviewed revision.
  execFileSync(
    'git',
    [
      'diff',
      '--exit-code',
      record.qualificationRevision,
      'HEAD',
      '--',
      'apps',
      'packages',
      'scripts',
      'package.json',
      'package-lock.json',
      '.github',
    ],
    { cwd: repositoryRoot, stdio: 'inherit' }
  );
  console.log('The exact public release revision has a recorded qualification decision.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  checkReleaseGate();
