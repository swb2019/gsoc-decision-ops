/** Conservative release arithmetic; no traffic telemetry or paid service. */
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';

const directory = resolve(process.argv[2] ?? 'apps/web/out');
const manifest = JSON.parse(
  await readFile(resolve(directory, 'glasshouse-offline-manifest.json'), 'utf8')
);
async function bytesIn(path) {
  const info = await stat(path);
  if (info.isFile()) return info.size;
  const children = await readdir(path);
  return (await Promise.all(children.map((child) => bytesIn(resolve(path, child))))).reduce(
    (a, b) => a + b,
    0
  );
}
const shell = await readFile(resolve(directory, 'index.html'), 'utf8');
const entryPaths = [
  ...new Set(
    [...shell.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter(
        (path) => path.startsWith(manifest.scope) && /\.(?:js|css|woff2?|ttf)(?:\?|$)/.test(path)
      )
  ),
];
const initialEntryBytes =
  Buffer.byteLength(shell) +
  (
    await Promise.all(
      entryPaths.map((path) =>
        bytesIn(resolve(directory, path.slice(manifest.scope.length).split('?')[0]))
      )
    )
  ).reduce((a, b) => a + b, 0);
const entryBodies = [
  Buffer.from(shell),
  ...(await Promise.all(
    entryPaths.map((path) =>
      readFile(resolve(directory, path.slice(manifest.scope.length).split('?')[0]))
    )
  )),
];
const initialEntryCompression = {
  gzipBytes: entryBodies.reduce((sum, body) => sum + gzipSync(body).byteLength, 0),
  brotliBytes: entryBodies.reduce((sum, body) => sum + brotliCompressSync(body).byteLength, 0),
  targetBytes: 1000000,
  basis:
    'Reproducible compression of each statically referenced entry body, including HTML. This is an artifact estimate, not host-transferred bytes; response headers, dynamic requests and server configuration differ.',
};
const plannedNewSessions = Number(process.env.HOURGLASS_PLANNED_NEW_SESSIONS ?? 10000);
if (!Number.isSafeInteger(plannedNewSessions) || plannedNewSessions < 0)
  throw new Error('The planning session count must be a nonnegative integer.');
const siteBytes = await bytesIn(directory);
// Every planned session loads the entry AND downloads the complete pack;
// add 25% headroom for repeat requests and protocol variability.
const bytesPerPlannedSession = Math.ceil((initialEntryBytes + manifest.totalBytes) * 1.25);
const projectedMonthlyBytes = plannedNewSessions * bytesPerPlannedSession;
const knownHostLimits = {
  siteBytes: 1000000000,
  monthlySoftBandwidthBytes: 100000000000,
  reviewFraction: 0.7,
};
const ownerReviewRequired =
  siteBytes >= knownHostLimits.siteBytes * 0.7 ||
  projectedMonthlyBytes >= knownHostLimits.monthlySoftBandwidthBytes * 0.7;
const result = {
  scope: manifest.scope,
  offlineVersion: manifest.version,
  siteBytes,
  initialEntryBytes,
  initialEntryCompression,
  completeOfflineBytes: manifest.totalBytes,
  plannedNewSessions,
  bytesPerPlannedSession,
  projectedMonthlyBytes,
  knownHostLimits,
  ownerReviewRequired,
  conservativeSessionsBeforeReview: Math.floor(70000000000 / bytesPerPlannedSession),
  accountableOwner: 'Shannon Brown',
  basis:
    'Planning arithmetic, not observed traffic. Assumes every new session also downloads the full offline pack; adds 25% headroom. Legacy scenario use, unusually frequent repeat requests and other portfolio traffic are additional. No analytics were introduced.',
  limitsSource:
    'https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits',
  limitsChecked: '2026-09-06',
};
await mkdir('qa-output', { recursive: true });
await writeFile('qa-output/release-budget.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (ownerReviewRequired)
  console.warn(
    'OWNER REVIEW: conservative usage estimate reaches 70% of a known hosting limit. Reassess before promotion.'
  );
