/** Architectural guard for the new deterministic domain; legacy modules are explicitly outside this contract. */
import ts from 'typescript';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ambient = new Set([
  'window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB',
  'fetch', 'XMLHttpRequest', 'WebSocket', 'Worker', 'AudioContext', 'webkitAudioContext',
  'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval', 'performance', 'Date', 'crypto', 'process',
  'globalThis', 'global', 'self', 'eval', 'Function', 'Reflect',
]);

/** Inspect syntax, not comments or scenario prose. This is a dependency/lint guard, not a sandbox. */
export function inspectDomainSource(text, fileName = 'domain.ts') {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const issues = [];
  const imports = [];
  const issue = (node, message) => {
    const position = source.getLineAndCharacterOfPosition(node.getStart(source));
    issues.push({ file: fileName, line: position.line + 1, message });
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      if (ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      else issue(node, 'A domain dependency must be a static relative module.');
    }
    if (ts.isImportEqualsDeclaration(node)) issue(node, 'CommonJS import aliases are outside the domain contract.');
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require')))
      issue(node, 'Dynamic module loading is outside the domain contract.');
    if (ts.isIdentifier(node) && ambient.has(node.text)) {
      const parent = node.parent;
      // Ordinary data fields such as observation.document are not global API access.
      const fieldName = (ts.isPropertyAccessExpression(parent) && parent.name === node)
        || ((ts.isPropertySignature(parent) || ts.isPropertyAssignment(parent) || ts.isMethodSignature(parent)) && parent.name === node);
      if (!fieldName) issue(node, `Ambient ${node.text} is forbidden in the deterministic domain.`);
    }
    if (ts.isPropertyAccessExpression(node) && node.expression.getText(source) === 'Math' && node.name.text === 'random')
      issue(node, 'Math.random must not control domain state; use keyed scenario randomness.');
    if (ts.isElementAccessExpression(node) && node.expression.getText(source) === 'Math')
      issue(node, 'Computed Math access can hide nondeterministic randomness.');
    if (ts.isVariableDeclaration(node) && node.initializer?.getText(source) === 'Math' && (!ts.isIdentifier(node.name) || node.name.text !== 'Math'))
      issue(node, 'Aliasing Math hides the deterministic randomness boundary.');
    ts.forEachChild(node, visit);
  };
  visit(source);
  for (const dependency of imports) {
    if (!dependency.startsWith('./') && !dependency.startsWith('../'))
      issues.push({ file: fileName, line: 1, message: `External dependency ${dependency} is outside the deterministic domain.` });
  }
  return { issues, imports };
}

export async function checkDomainBoundary(root = resolve('packages/core/src/glasshouse')) {
  root = resolve(root);
  const pending = (await readdir(root)).filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts')).map(name => resolve(root, name));
  const visited = new Set();
  const issues = [];
  while (pending.length) {
    const path = pending.pop();
    if (visited.has(path)) continue;
    visited.add(path);
    const inspected = inspectDomainSource(await readFile(path, 'utf8'), relative(process.cwd(), path));
    issues.push(...inspected.issues);
    for (const dependency of inspected.imports.filter(item => item.startsWith('.'))) {
      const target = resolve(dirname(path), dependency.replace(/\.js$/, '.ts'));
      if (!target.startsWith(root + sep) || target.endsWith('.test.ts')) {
        issues.push({ file: relative(process.cwd(), path), line: 1, message: `Dependency ${dependency} escapes the reviewed Glasshouse domain.` });
      } else pending.push(target);
    }
  }
  return { files: visited.size, issues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await checkDomainBoundary();
  if (result.issues.length) {
    for (const item of result.issues) console.error(`${item.file}:${item.line}: ${item.message}`);
    process.exitCode = 1;
  } else console.log(`Domain boundary passed: ${result.files} source modules, no renderer/browser imports or ambient clock/random transitions.`);
}
