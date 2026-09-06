/**
 * Scoped cancellation for model-file fetches in CDN-loaded inference libraries.
 * The library versions in use do not expose a pipeline AbortSignal. The wrapper
 * only attaches a signal to Hugging Face model hosts, preserves other requests,
 * and restores the original fetch when this provision settles.
 */
export function createModelDownloadSession(host: Pick<typeof globalThis, 'fetch'>): {
  signal: AbortSignal;
  cancel: () => void;
  assertActive: () => void;
  restore: () => void;
} {
  const controller = new AbortController();
  const original = host.fetch;
  const wrapped: typeof fetch = (input, init) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      'https://local.invalid'
    );
    const modelHost =
      url.hostname === 'huggingface.co' ||
      url.hostname.endsWith('.huggingface.co') ||
      url.hostname === 'hf.co' ||
      url.hostname.endsWith('.hf.co');
    if (!modelHost) return original.call(host, input, init);
    const upstream = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const signal = upstream ? AbortSignal.any([controller.signal, upstream]) : controller.signal;
    return original.call(host, input, { ...init, signal });
  };
  host.fetch = wrapped;
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
    assertActive: () => controller.signal.throwIfAborted(),
    restore: (): void => {
      // Do not erase a later wrapper installed by another feature.
      if (host.fetch === wrapped) host.fetch = original;
    },
  };
}
