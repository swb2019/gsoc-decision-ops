import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { REQUIRED_GATES, validateQualificationRecord } from '../../scripts/check-release-gate.mjs';

const root = mkdtempSync(join(tmpdir(), 'hourglass-release-gate-'));
mkdirSync(join(root, 'packages/core/src/glasshouse'), { recursive: true });
mkdirSync(join(root, 'evidence'), { recursive: true });
writeFileSync(
  join(root, 'packages/core/src/glasshouse/content.ts'),
  "export const GLASSHOUSE_VERSIONS = { scenario: 'case-1', rules: 'rules-1', rubric: 'rubric-1', assets: 'assets-1' } as const;"
);
writeFileSync(
  join(root, 'evidence/review.txt'),
  'Synthetic validator fixture; no actual human qualification is claimed.'
);
writeFileSync(join(root, 'evidence/empty.txt'), '');
after(() => {
  // Delete only the exact temporary directory created by this test.
  if (
    resolve(root).startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/')) &&
    basename(root).startsWith('hourglass-release-gate-')
  )
    rmSync(root, { recursive: true, force: true });
});
function valid() {
  return {
    schemaVersion: 1,
    product: 'Hourglass Command Glasshouse',
    accountableOwner: 'Test Product Owner',
    baseline: 'a'.repeat(40),
    qualificationRevision: 'b'.repeat(40),
    publicRelease: 'qualified',
    scenarioVersion: 'case-1',
    rulesVersion: 'rules-1',
    rubricVersion: 'rubric-1',
    assetsVersion: 'assets-1',
    gates: Object.fromEntries(
      REQUIRED_GATES.map((name) => [
        name,
        {
          status: 'passed',
          evidence: ['evidence/review.txt'],
          signoffs:
            name === 'independentContentAndRubricReview'
              ? ['physical-security', 'cyber-response', 'exercise-design'].map((role, index) => ({
                  name: `Test Reviewer ${index + 1}`,
                  role,
                  date: '2020-01-01',
                }))
              : [
                  {
                    name: 'Test Gate Reviewer',
                    role: 'qualification reviewer',
                    date: '2020-01-01',
                  },
                ],
        },
      ])
    ),
  };
}
function rejects(change, pattern = /Public release is held/) {
  const record = valid();
  change(record);
  assert.throws(() => validateQualificationRecord(record, root), pattern);
}
test('accepts a fully declared synthetic fixture with actual local evidence references', () => {
  const record = valid();
  assert.equal(validateQualificationRecord(record, root), record);
});
test('the real unqualified record remains held with a clear message', () => {
  const record = JSON.parse(
    readFileSync(new URL('../../release/qualification.json', import.meta.url), 'utf8')
  );
  assert.equal(record.publicRelease, 'hold');
  assert.throws(
    () => validateQualificationRecord(record, root),
    /Public release is held.*human gates/
  );
});
test('rejects absent, empty, array, incomplete and unexpected gates', () => {
  for (const gates of [undefined, {}, [], { semanticEngineering: 'passed:' }])
    rejects((record) => {
      record.gates = gates;
    }, /named engineering and human gate/);
  rejects((record) => {
    delete record.gates.formativePlaytest;
  }, /named engineering and human gate/);
  rejects((record) => {
    record.gates.extra = record.gates.semanticEngineering;
  }, /named engineering and human gate/);
});
test('passed text alone cannot replace a structured gate and actual signoff', () => {
  rejects((record) => {
    record.gates.formativePlaytest = 'passed: trust me';
  }, /structured passed decision/);
  rejects((record) => {
    record.gates.formativePlaytest.status = 'pending';
  }, /structured passed decision/);
  rejects((record) => {
    record.gates.formativePlaytest.signoffs = [];
  }, /named signoffs/);
  for (const name of ['pending', 'AI-assisted reviewer', '', null])
    rejects((record) => {
      record.gates.formativePlaytest.signoffs[0].name = name;
    }, /named signoffs/);
  for (const date of ['2020-02-30', '2099-01-01', 'January 1', null])
    rejects((record) => {
      record.gates.formativePlaytest.signoffs[0].date = date;
    }, /review dates/);
});
test('requires three independent reviewer disciplines and distinct non-owner people', () => {
  rejects((record) => {
    record.gates.independentContentAndRubricReview.signoffs.pop();
  }, /three distinct non-owner/);
  rejects((record) => {
    record.gates.independentContentAndRubricReview.signoffs[1].name = 'Test Reviewer 1';
  }, /three distinct non-owner/);
  rejects((record) => {
    record.gates.independentContentAndRubricReview.signoffs[0].name = record.accountableOwner;
  }, /three distinct non-owner/);
  rejects((record) => {
    record.gates.independentContentAndRubricReview.signoffs[0].role = 'general reviewer';
  }, /three distinct non-owner/);
});
test('rejects missing, empty, duplicate, external, absolute and traversal evidence paths', () => {
  for (const evidence of [
    [],
    ['evidence/missing.txt'],
    ['evidence/empty.txt'],
    ['evidence'],
    ['https://example.invalid/review'],
    ['../outside.txt'],
    ['/outside.txt'],
    ['C:\\outside.txt'],
    ['evidence/review.txt', 'evidence/review.txt'],
  ])
    rejects((record) => {
      record.gates.formativePlaytest.evidence = evidence;
    });
});
test('requires supported schema, owner and exact review/baseline revisions', () => {
  rejects((record) => {
    record.schemaVersion = 2;
  }, /supported schema/);
  rejects((record) => {
    record.accountableOwner = 'pending';
  }, /named accountable owner/);
  rejects((record) => {
    record.product = 'Another product';
  }, /supported schema/);
  for (const field of ['baseline', 'qualificationRevision'])
    for (const value of [undefined, 'HEAD', 'abc123', 'g'.repeat(40)])
      rejects((record) => {
        record[field] = value;
      }, /40-character Git revision/);
});
test('all four declared versions must match the authored pack', () => {
  for (const field of ['scenarioVersion', 'rulesVersion', 'rubricVersion', 'assetsVersion']) {
    rejects((record) => {
      delete record[field];
    }, /authored pack/);
    rejects((record) => {
      record[field] = 'old-version';
    }, /authored pack/);
  }
});
