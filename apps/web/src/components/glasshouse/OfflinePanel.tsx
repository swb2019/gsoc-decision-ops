'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, HardDrive, X } from 'lucide-react';
import {
  activateGlasshouseOfflinePack,
  deleteGlasshouseOfflinePacks,
  downloadGlasshouseOfflinePack,
  getGlasshouseOfflineInfo,
  getGlasshouseOfflineStatus,
  type GlasshouseOfflineStatus,
} from '@/lib/glasshouse-offline';

const bytes = (value: number) => `${(value / 1024 / 1024).toFixed(2)} MB`;

export default function OfflinePanel({
  hasSession,
  onError,
}: {
  hasSession: boolean;
  onError: (error: string) => void;
}) {
  const [status, setStatus] = useState<GlasshouseOfflineStatus>({ ready: false, active: false });
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getGlasshouseOfflineInfo>> | null>(
    null
  );
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    void getGlasshouseOfflineStatus()
      .then(setStatus)
      .catch(() => undefined);
    return () => controller.current?.abort();
  }, []);
  async function inspect() {
    setBusy('inspect');
    try {
      setInfo(await getGlasshouseOfflineInfo());
      setMessage('Inspect the size before choosing to download.');
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Offline information could not be loaded.');
    } finally {
      setBusy('');
    }
  }
  async function download() {
    setBusy('download');
    setProgress(0);
    controller.current = new AbortController();
    try {
      const next = await downloadGlasshouseOfflinePack(
        (done, total) => setProgress(total ? done / total : 0),
        controller.current.signal
      );
      setStatus(next);
      setMessage(
        'Complete pack verified. It will activate at your next new mission; this run keeps its pinned content.'
      );
    } catch (cause) {
      if (controller.current.signal.aborted)
        setMessage('Download cancelled. No partial pack is marked ready.');
      else
        onError(
          cause instanceof Error
            ? cause.message
            : 'The complete offline pack could not be downloaded.'
        );
    } finally {
      controller.current = null;
      setBusy('');
    }
  }
  async function activate() {
    setBusy('activate');
    try {
      await activateGlasshouseOfflinePack(status.version);
      setStatus(await getGlasshouseOfflineStatus());
      setMessage('Offline pack activated at this safe start.');
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Offline activation failed.');
    } finally {
      setBusy('');
    }
  }
  async function remove() {
    setBusy('delete');
    try {
      await deleteGlasshouseOfflinePacks();
      setStatus({ ready: false, active: false });
      setMessage(
        'Offline files removed. Your Glasshouse journals and downloaded backups are preserved.'
      );
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The offline files could not be removed.');
    } finally {
      setBusy('');
    }
  }
  return (
    <section className="gh-offline">
      <div className="gh-panel-heading">
        <h3>
          <HardDrive size={16} />
          Optional offline pack
        </h3>
        <span className={`gh-pill ${status.active ? 'gh-pill-green' : ''}`}>
          {status.active
            ? 'Offline active'
            : status.ready
              ? 'Verified · next start'
              : 'Not downloaded'}
        </span>
      </div>
      <p className="gh-helper">
        Download is explicit. Readiness requires every pinned asset to pass integrity checks. Local
        session saving by itself does not make the application available offline.
      </p>
      {info && (
        <dl className="gh-offline-facts">
          <div>
            <dt>Complete download</dt>
            <dd>
              {bytes(info.manifest.totalBytes)} · {info.manifest.assets.length} files
            </dd>
          </div>
          <div>
            <dt>Estimated device use</dt>
            <dd>
              {info.storage?.usage !== undefined ? bytes(info.storage.usage) : 'Unavailable'}
              {info.storage?.quota !== undefined ? ` of ${bytes(info.storage.quota)}` : ''}
            </dd>
          </div>
          <div>
            <dt>Pack revision</dt>
            <dd className="gh-mono">{info.manifest.version}</dd>
          </div>
        </dl>
      )}
      {busy === 'download' && (
        <div className="gh-download-progress">
          <progress aria-label="Offline pack download progress" max={1} value={progress} />
          <span>{Math.round(progress * 100)}%</span>
          <button className="gh-button" onClick={() => controller.current?.abort()}>
            <X size={15} />
            Cancel download
          </button>
        </div>
      )}
      <div className="gh-button-row">
        {!info && (
          <button className="gh-button" disabled={Boolean(busy)} onClick={() => void inspect()}>
            {busy === 'inspect' ? 'Checking…' : 'Inspect offline download'}
          </button>
        )}
        {info && (
          <button className="gh-button" disabled={Boolean(busy)} onClick={() => void download()}>
            <Download size={15} />
            Download complete pack · {bytes(info.manifest.totalBytes)}
          </button>
        )}
        {status.ready && !status.active && !hasSession && (
          <button className="gh-button" disabled={Boolean(busy)} onClick={() => void activate()}>
            Activate for next start
          </button>
        )}
        {status.ready && (
          <button className="gh-text-button" disabled={Boolean(busy)} onClick={() => void remove()}>
            Remove offline files
          </button>
        )}
      </div>
      {status.bytes && (
        <p className="gh-helper">
          Verified local pack: {bytes(status.bytes)}. Its cache can be removed independently of your
          journal.
        </p>
      )}
      {message && (
        <p className="gh-success" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
