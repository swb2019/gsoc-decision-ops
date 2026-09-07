/** Run after Next static export and before copying/promoting the tested static artifact. */
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

const output = resolve(process.argv[2] ?? 'apps/web/out');
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
if (!/^(?:\/[a-zA-Z0-9_-]+)*$/.test(basePath)) throw new Error('Unsupported deployment base path.');
const scope = `${basePath}/`;
const included = new Map();
async function add(file, path) {
  const absolute = resolve(output, file);
  if (!absolute.startsWith(output + sep))
    throw new Error('Asset escaped the static artifact directory.');
  const bytes = await readFile(absolute);
  included.set(path, {
    path,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
async function walk(directory) {
  for (const entry of await readdir(resolve(output, directory), { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:js|css|woff2?|ttf|svg|png|webp|json|txt)$/.test(file))
      await add(file, `${scope}${file}`);
  }
}
await stat(resolve(output, 'glasshouse/index.html'));
await stat(resolve(output, 'glasshouse-sw.js'));
await add('index.html', scope);
await add('glasshouse/index.html', `${scope}glasshouse/`);
await add('evidence/index.html', `${scope}evidence/`);
for (const file of ['index.txt', 'glasshouse/index.txt', 'evidence/index.txt']) {
  try {
    await add(file, `${scope}${file}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
await add('brand/Manrope.ttf', `${scope}brand/Manrope.ttf`);
await walk('brand');
await walk('_next/static');
// Fonts, styles, shared shell and lazy feature chunks are included so the full review/PDF path works offline.
const assets = [...included.values()].sort((a, b) => a.path.localeCompare(b.path));
const version = createHash('sha256').update(JSON.stringify(assets)).digest('hex').slice(0, 24);
const manifest = {
  schemaVersion: 1,
  version,
  scope,
  totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
  assets,
};
await writeFile(
  resolve(output, 'glasshouse-offline-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);
console.log(
  JSON.stringify({
    manifest: relative(process.cwd(), resolve(output, 'glasshouse-offline-manifest.json')),
    version,
    files: assets.length,
    bytes: manifest.totalBytes,
    scope,
  })
);
