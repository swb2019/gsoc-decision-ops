import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const record = JSON.parse(readFileSync('release/qualification.json', 'utf8'));
if (
  record.publicRelease !== 'qualified' ||
  !/^[0-9a-f]{40}$/.test(record.qualificationRevision || '') ||
  Object.values(record.gates).some((value) => !String(value).startsWith('passed:'))
) {
  throw new Error(
    'Public release is held. Record independently completed PRD qualification evidence for the exact revision; automated tests cannot substitute for human gates.'
  );
}
// The qualification record may be committed after the reviewed code. Avoid a
// self-referential commit hash while requiring identical executable sources.
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
  { stdio: 'inherit' }
);
console.log('The exact public release revision has a recorded qualification decision.');
