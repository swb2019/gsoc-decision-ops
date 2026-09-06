import { describe, expect, it, vi } from 'vitest';
import { createModelDownloadSession } from './model-download-session';

describe('model download cancellation', () => {
  it('aborts active model requests and prevents later model requests', async () => {
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const abort = (): void => reject(new DOMException('Cancelled', 'AbortError'));
        if (init?.signal?.aborted) abort();
        else init?.signal?.addEventListener('abort', abort, { once: true });
      });
    });
    const host = { fetch: fetcher as typeof fetch };
    const session = createModelDownloadSession(host);
    const first = host.fetch('https://huggingface.co/onnx-community/model/resolve/main/model.onnx');
    const checkFirst = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    session.cancel();
    await checkFirst;
    await expect(host.fetch('https://cdn-lfs.hf.co/model')).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(() => session.assertActive()).toThrow();
  });

  it('preserves an upstream abort signal and leaves unrelated requests alone', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('ok'));
    const host = { fetch: fetcher as typeof fetch };
    const session = createModelDownloadSession(host);
    const upstream = new AbortController();
    await host.fetch('https://huggingface.co/model', { signal: upstream.signal });
    const passed = fetcher.mock.calls[0][1].signal as AbortSignal;
    upstream.abort();
    expect(passed.aborted).toBe(true);
    const other = { headers: { Accept: 'application/json' } };
    await host.fetch('https://example.org/data', other);
    expect(fetcher.mock.calls[1][1]).toBe(other);
    session.restore();
    expect(host.fetch).toBe(fetcher);
  });

  it('does not overwrite a later fetch owner during cleanup', () => {
    const host = { fetch: vi.fn() as unknown as typeof fetch };
    const session = createModelDownloadSession(host);
    const later = vi.fn() as unknown as typeof fetch;
    host.fetch = later;
    session.restore();
    expect(host.fetch).toBe(later);
  });
});
