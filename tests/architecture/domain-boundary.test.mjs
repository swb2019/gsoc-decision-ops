import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectDomainSource, checkDomainBoundary } from '../../scripts/check-domain-boundary.mjs';

test('current complete Glasshouse dependency graph stays inside its pure domain', async () => {
  const result = await checkDomainBoundary();
  assert.ok(result.files >= 5);
  assert.deepEqual(result.issues, []);
});
test('renderer, browser and node dependencies cannot enter through static or dynamic imports', () => {
  for (const code of ["import React from 'react';", "export { Canvas } from '@react-three/fiber';", "import fs from 'node:fs';", "const actor = import('./renderer.js');", "const renderer = require('three');"])
    assert.ok(inspectDomainSource(code).issues.length > 0, code);
});
test('clock, network, storage and audio APIs fail even when aliased from their ambient object', () => {
  for (const code of ['const now = Date.now();', 'const random = Math.random;', "const random = Math['random'];", 'const { random } = Math;', 'const network = fetch;', 'window.localStorage.clear();', 'new AudioContext();', 'const timer = globalThis.setTimeout;', 'crypto.getRandomValues(bytes);'])
    assert.ok(inspectDomainSource(code).issues.length > 0, code);
});
test('scenario prose, data fields and deterministic numerical operations remain valid', () => {
  const checked = inspectDomainSource("import type { Session } from './types.js'; const instruction = 'Inspect the document before the time window closes; no Math.random()'; const note = { document: 'synthetic' }; const result = Math.floor(10.4) + note.document.length;");
  assert.deepEqual(checked.issues, []);
  assert.deepEqual(checked.imports, ['./types.js']);
});
