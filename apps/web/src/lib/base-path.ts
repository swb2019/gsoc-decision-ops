'use client';

/**
 * Shared basePath utility for audio/voice files
 *
 * Derives basePath for GitHub Pages deployment:
 * 1. Uses NEXT_PUBLIC_BASE_PATH env var if set
 * 2. Falls back to deriving from window.location.pathname
 *    (e.g., /gsoc-decision-ops/scenarios/1 → /gsoc-decision-ops)
 * 3. Returns empty string for root deployment
 */

let cachedBasePath: string | null = null;

/**
 * Get the base path for static assets.
 * On GitHub Pages (swb2019.github.io/gsoc-decision-ops/), returns '/gsoc-decision-ops'.
 * For root deployments, returns empty string.
 */
export function getBasePath(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_PATH || '';
  }

  if (cachedBasePath !== null) {
    return cachedBasePath;
  }

  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
  if (envBasePath) {
    cachedBasePath = envBasePath;
    return cachedBasePath;
  }

  const pathname = window.location.pathname;
  const match = pathname.match(/^(\/[^/]+)/);

  if (match && match[1] !== '/') {
    const potentialBasePath = match[1];

    if (potentialBasePath === '/gsoc-decision-ops' || pathname.startsWith('/gsoc-decision-ops/')) {
      cachedBasePath = '/gsoc-decision-ops';
      return cachedBasePath;
    }
  }

  cachedBasePath = '';
  return cachedBasePath;
}

/**
 * Build a full URL for an audio file, handling basePath correctly.
 */
export function getAudioUrl(relativePath: string): string {
  const basePath = getBasePath();
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${basePath}${normalizedPath}`;
}
