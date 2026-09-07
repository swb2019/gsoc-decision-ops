import { getBasePath } from './base-path';

const CACHE_PREFIX = 'hourglass-glasshouse:pack:';
const CONTROL_CACHE = 'hourglass-glasshouse:control:v1';
interface PackAsset {
  path: string;
  bytes: number;
  sha256: string;
}
export interface GlasshouseOfflineManifest {
  schemaVersion: 1;
  version: string;
  scope: string;
  totalBytes: number;
  assets: PackAsset[];
}
export interface GlasshouseOfflineStatus {
  ready: boolean;
  active: boolean;
  version?: string;
  bytes?: number;
  cacheName?: string;
}
const base = () => `${getBasePath().replace(/\/$/, '')}/`;
const markerUrl = () => `${location.origin}${base()}__glasshouse-complete-pack.json`;
const pointerUrl = () => `${location.origin}${base()}__glasshouse-active-pack.json`;

function validateManifest(value: unknown): GlasshouseOfflineManifest {
  const manifest = value as GlasshouseOfflineManifest;
  if (
    !manifest ||
    manifest.schemaVersion !== 1 ||
    !/^[a-f0-9]{16,64}$/.test(manifest.version) ||
    manifest.scope !== base() ||
    !Array.isArray(manifest.assets) ||
    !manifest.assets.length ||
    manifest.assets.length > 3000
  ) {
    throw new Error(
      'The offline manifest is missing or incompatible with this build. Offline readiness was not changed.'
    );
  }
  let bytes = 0;
  const paths = new Set<string>();
  for (const asset of manifest.assets) {
    if (
      !asset ||
      typeof asset.path !== 'string' ||
      !asset.path.startsWith(manifest.scope) ||
      asset.path.includes('..') ||
      asset.path.includes('?') ||
      asset.path.includes('#') ||
      asset.path.includes('\\') ||
      paths.has(asset.path) ||
      !Number.isSafeInteger(asset.bytes) ||
      asset.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)
    ) {
      throw new Error('An offline asset failed path, size or integrity validation.');
    }
    const url = new URL(asset.path, location.origin);
    if (url.origin !== location.origin || url.pathname !== asset.path)
      throw new Error('Offline packs may contain only this application’s published assets.');
    paths.add(asset.path);
    bytes += asset.bytes;
  }
  if (
    manifest.totalBytes !== bytes ||
    !paths.has(`${base()}glasshouse/`) ||
    !paths.has(`${base()}brand/Manrope.ttf`)
  )
    throw new Error('This pack is incomplete or its total size does not reconcile.');
  return manifest;
}

export async function getGlasshouseOfflineInfo(): Promise<{
  manifest: GlasshouseOfflineManifest;
  storage: StorageEstimate | null;
}> {
  if (!('caches' in globalThis) || !('serviceWorker' in navigator))
    throw new Error(
      'This browser does not support the complete offline pack. Online play and local session exports remain available.'
    );
  const response = await fetch(`${base()}glasshouse-offline-manifest.json`, {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!response.ok)
    throw new Error('This build has no prepared offline pack. It is not ready for offline play.');
  const manifest = validateManifest(await response.json());
  const storage = navigator.storage?.estimate
    ? await navigator.storage.estimate().catch(() => null)
    : null;
  return { manifest, storage };
}

async function completePacks(): Promise<
  Array<{ cacheName: string; manifest: GlasshouseOfflineManifest }>
> {
  if (!('caches' in globalThis)) return [];
  const found: Array<{ cacheName: string; manifest: GlasshouseOfflineManifest }> = [];
  for (const cacheName of await caches.keys()) {
    if (!cacheName.startsWith(CACHE_PREFIX)) continue;
    const cache = await caches.open(cacheName);
    const marker = await cache.match(markerUrl());
    if (!marker) continue;
    try {
      const manifest = validateManifest(await marker.json());
      const storedPaths = new Set((await cache.keys()).map((entry) => new URL(entry.url).pathname));
      if (manifest.assets.every((asset) => storedPaths.has(asset.path)))
        found.push({ cacheName, manifest });
    } catch {
      /* An incomplete/incompatible pack is never ready. */
    }
  }
  return found;
}

export async function getGlasshouseOfflineStatus(): Promise<GlasshouseOfflineStatus> {
  const packs = await completePacks();
  if (!packs.length) return { ready: false, active: false };
  const control = await caches.open(CONTROL_CACHE);
  const pointer = await control.match(pointerUrl());
  const activeName = pointer ? (await pointer.json()).cacheName : undefined;
  const selected = packs.find((pack) => pack.cacheName === activeName) ?? packs[packs.length - 1];
  return {
    ready: true,
    active: selected.cacheName === activeName,
    version: selected.manifest.version,
    bytes: selected.manifest.totalBytes,
    cacheName: selected.cacheName,
  };
}

/** Explicit download only. Completion marker is written after every asset's size and SHA-256 match. */
export async function downloadGlasshouseOfflinePack(
  progress?: (downloadedBytes: number, totalBytes: number) => void,
  signal?: AbortSignal
): Promise<GlasshouseOfflineStatus> {
  const { manifest, storage } = await getGlasshouseOfflineInfo();
  if (
    storage?.quota !== undefined &&
    storage.usage !== undefined &&
    storage.quota - storage.usage < manifest.totalBytes * 1.15
  )
    throw new Error(
      'There is not enough estimated storage for the full pack. Free space or keep using online play; a partial download will not be labeled ready.'
    );
  const existing = (await completePacks()).find(
    (pack) => pack.manifest.version === manifest.version
  );
  if (existing) {
    const status = await getGlasshouseOfflineStatus();
    return {
      ready: true,
      active: status.active && status.cacheName === existing.cacheName,
      version: manifest.version,
      bytes: manifest.totalBytes,
      cacheName: existing.cacheName,
    };
  }
  const cacheName = `${CACHE_PREFIX}${manifest.version}:${crypto.randomUUID()}`;
  const cache = await caches.open(cacheName);
  let downloaded = 0;
  progress?.(downloaded, manifest.totalBytes);
  try {
    for (const asset of manifest.assets) {
      signal?.throwIfAborted();
      const response = await fetch(asset.path, {
        signal,
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!response.ok || response.redirected)
        throw new Error(
          `Offline download failed for ${asset.path}. The previous complete pack is preserved.`
        );
      const data = await response.arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      if (data.byteLength !== asset.bytes || digest !== asset.sha256)
        throw new Error(
          `The published asset changed during download: ${asset.path}. Start a new complete download after the update.`
        );
      const headers = new Headers(response.headers);
      headers.delete('content-encoding');
      headers.set('content-length', String(data.byteLength));
      await cache.put(asset.path, new Response(data, { status: 200, headers }));
      downloaded += data.byteLength;
      progress?.(downloaded, manifest.totalBytes);
    }
    signal?.throwIfAborted();
    await cache.put(
      markerUrl(),
      new Response(JSON.stringify(manifest), { headers: { 'content-type': 'application/json' } })
    );
    await navigator.serviceWorker.register(`${base()}glasshouse-sw.js`, {
      scope: base(),
      updateViaCache: 'none',
    });
    return {
      ready: true,
      active: false,
      version: manifest.version,
      bytes: manifest.totalBytes,
      cacheName,
    };
  } catch (error) {
    await caches.delete(cacheName);
    throw error;
  }
}

/** Call only at an explicit safe start, never while changing a running session's content version. */
export async function activateGlasshouseOfflinePack(version?: string): Promise<void> {
  const packs = await completePacks();
  const selected = version
    ? packs.find((pack) => pack.manifest.version === version)
    : packs[packs.length - 1];
  if (!selected)
    throw new Error('Download a complete reviewed pack before activating offline play.');
  const cache = await caches.open(selected.cacheName);
  for (const asset of selected.manifest.assets)
    if (!(await cache.match(asset.path)))
      throw new Error('An offline asset was evicted. Download the pack again before offline play.');
  const registration = await navigator.serviceWorker.register(`${base()}glasshouse-sw.js`, {
    scope: base(),
    updateViaCache: 'none',
  });
  registration.waiting?.postMessage({ type: 'glasshouse-safe-activate' });
  const control = await caches.open(CONTROL_CACHE);
  await control.put(
    pointerUrl(),
    new Response(
      JSON.stringify({ cacheName: selected.cacheName, version: selected.manifest.version }),
      { headers: { 'content-type': 'application/json' } }
    )
  );
  await navigator.serviceWorker.ready;
}

/** Cache/worker rollback leaves the IndexedDB journal and neighboring application storage untouched. */
export async function deleteGlasshouseOfflinePacks(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const expected = `${location.origin}${base()}glasshouse-sw.js`;
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      const script =
        registration.active?.scriptURL ??
        registration.waiting?.scriptURL ??
        registration.installing?.scriptURL;
      if (script === expected && registration.scope === `${location.origin}${base()}`)
        await registration.unregister();
    }
  }
  if ('caches' in globalThis) {
    for (const name of await caches.keys())
      if (name.startsWith(CACHE_PREFIX) || name === CONTROL_CACHE) await caches.delete(name);
  }
}
