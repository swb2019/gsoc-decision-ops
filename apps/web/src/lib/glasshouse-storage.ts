import {
  canonicalGlasshouseState,
  restoreGlasshouseSession,
  serializeGlasshouseSession,
  type GlasshouseSession as Session,
} from '@gsoc-decision-ops/core';

export const GLASSHOUSE_DATABASE = 'hourglass:glasshouse:v1';
const DATABASE_VERSION = 1;
const LEASE_MS = 30_000;
const HEARTBEAT_MS = 8_000;
const STORES = ['checkpoints', 'journal', 'metadata', 'quarantine', 'legacy'] as const;

export class GlasshouseJournalError extends Error {
  constructor(
    public readonly code:
      'unavailable' | 'readonly' | 'stale' | 'corrupt' | 'closed' | 'save-failed',
    message: string,
    public readonly recoveryText?: string
  ) {
    super(message);
    this.name = 'GlasshouseJournalError';
  }
}

export interface Journal {
  readonly readOnly: boolean;
  load(): Promise<Session | null>;
  save(state: Session, activePlaySeconds?: number): Promise<void>;
  getSaveStatus(): Promise<GlasshouseSaveStatus>;
  takeover(): Promise<void>;
  close(): void;
  deleteAll(): Promise<void>;
}

export interface GlasshouseSaveStatus {
  sessionId: string | null;
  readOnly: boolean;
  durableCommands: number;
  lastSavedAt: number | null;
  activePlaySeconds: number;
}

interface Checkpoint {
  sessionId: string;
  text: string;
  commandCount: number;
  savedAt: number;
}
interface Metadata {
  key: string;
  value: string;
}
interface Lease {
  key: string;
  owner: string;
  expiresAt: number;
}
interface ActiveTime {
  key: string;
  seconds: number;
}
export interface LegacyGlasshouseRecord {
  key: string;
  text: string;
  validJson: boolean;
  interpretation: string;
}
export interface GlasshouseRecoveryRecord {
  id: string;
  sessionId: string;
  text: string;
  reason: string;
  capturedAt: number;
}

export type GlasshousePracticeRecord = {
  sessionId: string;
  lastSavedAt: number | null;
  activePlaySeconds: number | null;
  isCurrentCheckpoint: boolean;
  originalText: string;
} & (
  | { validation: 'valid'; session: Session }
  | { validation: 'unreadable'; reason: string; session: null }
);

/** A read-only inventory; it never claims a lease, selects a current run, saves, or removes damage. */
export async function listGlasshousePracticeRecords(): Promise<GlasshousePracticeRecord[]> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(['checkpoints', 'metadata'], 'readonly');
    const done = completed(transaction);
    const [checkpoints, metadata] = await Promise.all([
      request(transaction.objectStore('checkpoints').getAll()) as Promise<Checkpoint[]>,
      request(transaction.objectStore('metadata').getAll()) as Promise<
        Array<Metadata | Lease | ActiveTime>
      >,
    ]);
    await done;
    const current = metadata.find(
      (item): item is Metadata => item.key === 'current' && 'value' in item
    )?.value;
    const times = new Map(
      metadata
        .filter(
          (item): item is ActiveTime => item.key.startsWith('active-time:') && 'seconds' in item
        )
        .map((item) => [item.key.slice('active-time:'.length), item.seconds])
    );
    return checkpoints
      .map((checkpoint): GlasshousePracticeRecord => {
        const activeTime = times.get(checkpoint.sessionId);
        const originalText =
          typeof checkpoint.text === 'string' ? checkpoint.text : JSON.stringify(checkpoint);
        const context = {
          sessionId: checkpoint.sessionId,
          lastSavedAt:
            Number.isFinite(checkpoint.savedAt) && checkpoint.savedAt >= 0
              ? checkpoint.savedAt
              : null,
          activePlaySeconds:
            activeTime !== undefined && Number.isFinite(activeTime) && activeTime >= 0
              ? activeTime
              : null,
          isCurrentCheckpoint: current === checkpoint.sessionId,
          originalText,
        };
        try {
          const session = restoreGlasshouseSession(originalText);
          if (
            session.sessionId !== checkpoint.sessionId ||
            session.commands.length !== checkpoint.commandCount
          )
            throw new Error(
              'Checkpoint identity or acknowledged-command count disagrees with its record.'
            );
          return { ...context, validation: 'valid', session };
        } catch (cause) {
          return {
            ...context,
            validation: 'unreadable',
            session: null,
            reason: `This saved record could not be replay-validated: ${cause instanceof Error ? cause.message : 'unsupported record'}. Its original contents remain stored and can be downloaded for recovery.`,
          };
        }
      })
      .sort(
        (left, right) =>
          (right.lastSavedAt ?? -1) - (left.lastSavedAt ?? -1) ||
          left.sessionId.localeCompare(right.sessionId)
      );
  } finally {
    db.close();
  }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/** A lease cannot authorize replacing acknowledged commands with an older or divergent run. */
export function assertGlasshouseSaveExtends(previous: Session, next: Session): void {
  const identity = (state: Session) => [
    state.sessionId,
    state.seed,
    state.initialMode,
    state.scenarioVersion,
    state.rulesVersion,
    state.rubricVersion,
    state.assetsVersion,
    state.parentSessionId,
    state.forkAt,
  ];
  if (
    stable(identity(previous)) !== stable(identity(next)) ||
    next.commands.length < previous.commands.length
  ) {
    throw new GlasshouseJournalError(
      'stale',
      'A newer or different version of this run is already saved. Export your current run, then reload the saved checkpoint.'
    );
  }
  for (let index = 0; index < previous.commands.length; index += 1) {
    if (stable(previous.commands[index]) !== stable(next.commands[index])) {
      throw new GlasshouseJournalError(
        'stale',
        'This run diverges from acknowledged commands. Keep it as a separate imported or replay branch; the saved record was preserved.'
      );
    }
  }
  if (
    next.commands.length === previous.commands.length &&
    canonicalGlasshouseState(previous) !== canonicalGlasshouseState(next)
  ) {
    throw new GlasshouseJournalError(
      'stale',
      'The same command history has conflicting state. The saved checkpoint was preserved.'
    );
  }
}

const LEGACY_KEYS = [
  'hourglass-command-session',
  'hourglass-campaign-unlocks',
  'hourglass-campaign-completions',
  'hourglass-personal-bests',
];

/** Reads only the exact legacy application keys. It neither migrates nor deletes them. */
export function detectLegacyGlasshouseRecords(
  storage?: Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'length' | 'key'>>
): LegacyGlasshouseRecord[] {
  try {
    const source = storage ?? globalThis.localStorage;
    if (!source) return [];
    const keys = [...LEGACY_KEYS];
    for (let index = 0; index < (source.length ?? 0); index += 1) {
      const key = source.key?.(index);
      if (key?.startsWith('hourglass-command-session:archive:')) keys.push(key);
    }
    return [...new Set(keys)].flatMap((key) => {
      const text = source.getItem(key);
      if (text === null) return [];
      let validJson = true;
      try {
        JSON.parse(text);
      } catch {
        validJson = false;
      }
      return [
        {
          key,
          text,
          validJson,
          interpretation:
            'Read-only legacy evidence. Missing historical random state cannot be reconstructed; start a new versioned Glasshouse run for faithful recovery.',
        },
      ];
    });
  } catch {
    return [];
  }
}

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error ?? new Error('Storage request failed.'));
  });
}

function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Storage transaction was interrupted.'));
    transaction.onerror = () => {
      /* onabort is the authoritative failed commit acknowledgment. */
    };
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(
        new GlasshouseJournalError(
          'unavailable',
          'Persistent storage is unavailable. Your in-memory run can continue; export it before leaving.'
        )
      );
      return;
    }
    let opening: IDBOpenDBRequest;
    try {
      opening = indexedDB.open(GLASSHOUSE_DATABASE, DATABASE_VERSION);
    } catch {
      reject(
        new GlasshouseJournalError(
          'unavailable',
          'The browser denied persistent storage. Continue in memory and export before leaving.'
        )
      );
      return;
    }
    let blocked = false;
    opening.onupgradeneeded = () => {
      const db = opening.result;
      if (!db.objectStoreNames.contains('checkpoints'))
        db.createObjectStore('checkpoints', { keyPath: 'sessionId' });
      if (!db.objectStoreNames.contains('journal'))
        db.createObjectStore('journal', { keyPath: ['sessionId', 'commandId'] });
      if (!db.objectStoreNames.contains('metadata'))
        db.createObjectStore('metadata', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('quarantine'))
        db.createObjectStore('quarantine', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('legacy'))
        db.createObjectStore('legacy', { keyPath: 'key' });
    };
    opening.onsuccess = () => {
      if (blocked) {
        opening.result.close();
        return;
      }
      opening.result.onversionchange = () => opening.result.close();
      resolve(opening.result);
    };
    opening.onerror = () =>
      reject(
        new GlasshouseJournalError(
          'unavailable',
          'Persistent storage could not open. The run remains available in memory.'
        )
      );
    opening.onblocked = () => {
      blocked = true;
      reject(
        new GlasshouseJournalError(
          'unavailable',
          'Another tab is holding an older storage version. Close that tab, then try storage again.'
        )
      );
    };
  });
}

function storageFailure(error: unknown): GlasshouseJournalError {
  if (error instanceof GlasshouseJournalError) return error;
  const detail =
    error instanceof DOMException && error.name === 'QuotaExceededError'
      ? 'Storage is full.'
      : 'The browser could not commit this save.';
  return new GlasshouseJournalError(
    'save-failed',
    `${detail} Your in-memory run is unsaved. Export it before leaving; the previous complete checkpoint is preserved.`
  );
}

async function quarantine(db: IDBDatabase, checkpoint: Checkpoint, error: unknown): Promise<void> {
  const transaction = db.transaction('quarantine', 'readwrite');
  const done = completed(transaction);
  transaction.objectStore('quarantine').put({
    id: `${checkpoint.sessionId}:${checkpoint.commandCount}`,
    sessionId: checkpoint.sessionId,
    text: checkpoint.text,
    reason: error instanceof Error ? error.message : 'Invalid saved checkpoint',
    capturedAt: Date.now(),
  } satisfies GlasshouseRecoveryRecord);
  await done;
}

/** Creates an atomic, namespaced journal. Wall-clock lease metadata never enters the simulation. */
export async function openGlasshouseJournal(): Promise<Journal> {
  const db = await openDatabase();
  const writerId = globalThis.crypto.randomUUID();
  let closed = false;
  let activeSessionId: string | null = null;
  let ownedSessionId: string | null = null;
  let readOnly = false;
  let tail: Promise<unknown> = Promise.resolve();
  const ensureOpen = () => {
    if (closed)
      throw new GlasshouseJournalError(
        'closed',
        'This journal is closed. Open it again to resume saving.'
      );
  };
  const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      ensureOpen();
    } catch (error) {
      return Promise.reject(error);
    }
    const result = tail.then(operation);
    tail = result.catch(() => undefined);
    return result;
  };

  async function claim(sessionId: string, force: boolean): Promise<void> {
    const transaction = db.transaction('metadata', 'readwrite');
    const done = completed(transaction);
    try {
      const metadata = transaction.objectStore('metadata');
      const existing = (await request(metadata.get(`writer:${sessionId}`))) as Lease | undefined;
      if (!force && existing && existing.owner !== writerId && existing.expiresAt > Date.now()) {
        readOnly = true;
        throw new GlasshouseJournalError(
          'readonly',
          'Another tab is saving this run. This tab is read-only until you explicitly take over.'
        );
      }
      metadata.put({
        key: `writer:${sessionId}`,
        owner: writerId,
        expiresAt: Date.now() + LEASE_MS,
      } satisfies Lease);
      await done;
      ownedSessionId = sessionId;
      readOnly = false;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        /* The transaction may already have aborted. */
      }
      await done.catch(() => undefined);
      throw storageFailure(error);
    }
  }

  const heartbeat = globalThis.setInterval(() => {
    if (closed || !ownedSessionId) return;
    const sessionId = ownedSessionId;
    void serial(() => claim(sessionId, false)).catch(() => {
      ownedSessionId = null;
    });
  }, HEARTBEAT_MS);

  return {
    get readOnly() {
      return readOnly;
    },
    load: () =>
      serial(async () => {
        const transaction = db.transaction(['metadata', 'checkpoints'], 'readonly');
        const done = completed(transaction);
        const current = (await request(transaction.objectStore('metadata').get('current'))) as
          Metadata | undefined;
        const checkpoint = current
          ? ((await request(transaction.objectStore('checkpoints').get(current.value))) as
              Checkpoint | undefined)
          : undefined;
        const lease = checkpoint
          ? ((await request(
              transaction.objectStore('metadata').get(`writer:${checkpoint.sessionId}`)
            )) as Lease | undefined)
          : undefined;
        await done;
        readOnly = Boolean(lease && lease.owner !== writerId && lease.expiresAt > Date.now());
        if (!checkpoint) {
          activeSessionId = null;
          return null;
        }
        activeSessionId = checkpoint.sessionId;
        try {
          return restoreGlasshouseSession(checkpoint.text);
        } catch (error) {
          await quarantine(db, checkpoint, error).catch(() => undefined);
          throw new GlasshouseJournalError(
            'corrupt',
            'This checkpoint failed replay validation. Its original bytes were preserved for recovery; do not replace it with an invented state.',
            checkpoint.text
          );
        }
      }),
    getSaveStatus: () =>
      serial(async () => {
        const transaction = db.transaction(['metadata', 'checkpoints'], 'readonly');
        const done = completed(transaction);
        const metadata = transaction.objectStore('metadata');
        const [lease, checkpoint, activeTime] = activeSessionId
          ? await Promise.all([
              request(metadata.get(`writer:${activeSessionId}`)) as Promise<Lease | undefined>,
              request(transaction.objectStore('checkpoints').get(activeSessionId)) as Promise<
                Checkpoint | undefined
              >,
              request(metadata.get(`active-time:${activeSessionId}`)) as Promise<
                ActiveTime | undefined
              >,
            ])
          : [undefined, undefined, undefined];
        await done;
        readOnly = Boolean(lease && lease.owner !== writerId && lease.expiresAt > Date.now());
        return {
          sessionId: activeSessionId,
          readOnly,
          durableCommands: checkpoint?.commandCount ?? 0,
          lastSavedAt: checkpoint?.savedAt ?? null,
          activePlaySeconds: activeTime?.seconds ?? 0,
        };
      }),
    save: (state, activePlaySeconds) => {
      // Freeze caller input before entering the queue; later UI mutations cannot change a pending save.
      let text: string;
      let incoming: Session;
      try {
        text = serializeGlasshouseSession(state);
        incoming = restoreGlasshouseSession(text);
      } catch (error) {
        return Promise.reject(storageFailure(error));
      }
      return serial(async () => {
        const transaction = db.transaction(['checkpoints', 'journal', 'metadata'], 'readwrite');
        const done = completed(transaction);
        try {
          const metadata = transaction.objectStore('metadata');
          const checkpoints = transaction.objectStore('checkpoints');
          const [lease, previous, previousActiveTime] = await Promise.all([
            request(metadata.get(`writer:${incoming.sessionId}`)) as Promise<Lease | undefined>,
            request(checkpoints.get(incoming.sessionId)) as Promise<Checkpoint | undefined>,
            request(metadata.get(`active-time:${incoming.sessionId}`)) as Promise<
              ActiveTime | undefined
            >,
          ]);
          if (lease && lease.owner !== writerId && lease.expiresAt > Date.now()) {
            readOnly = true;
            throw new GlasshouseJournalError(
              'readonly',
              'Another tab owns the saved run. Keep your current work in memory or export it; use takeover only after inspecting the saved checkpoint.'
            );
          }
          if (previous) {
            let previousState: Session;
            try {
              previousState = restoreGlasshouseSession(previous.text);
            } catch {
              throw new GlasshouseJournalError(
                'corrupt',
                'The prior saved record is corrupt. It was preserved; start a separate run or download its recovery copy.',
                previous.text
              );
            }
            assertGlasshouseSaveExtends(previousState, incoming);
          }
          const journal = transaction.objectStore('journal');
          for (
            let index = previous?.commandCount ?? 0;
            index < incoming.commands.length;
            index += 1
          ) {
            const command = incoming.commands[index];
            journal.add({
              sessionId: incoming.sessionId,
              commandId: command.commandId,
              sequence: index,
              command,
            });
          }
          checkpoints.put({
            sessionId: incoming.sessionId,
            text,
            commandCount: incoming.commands.length,
            savedAt: Date.now(),
          } satisfies Checkpoint);
          metadata.put({ key: 'current', value: incoming.sessionId } satisfies Metadata);
          metadata.put({
            key: `writer:${incoming.sessionId}`,
            owner: writerId,
            expiresAt: Date.now() + LEASE_MS,
          } satisfies Lease);
          if (activePlaySeconds !== undefined) {
            if (!Number.isFinite(activePlaySeconds) || activePlaySeconds < 0)
              throw new Error('Active play time must be a finite, nonnegative number.');
            metadata.put({
              key: `active-time:${incoming.sessionId}`,
              seconds: Math.max(previousActiveTime?.seconds ?? 0, activePlaySeconds),
            } satisfies ActiveTime);
          }
          await done;
          activeSessionId = incoming.sessionId;
          ownedSessionId = incoming.sessionId;
          readOnly = false;
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            /* Already committed/aborted. */
          }
          await done.catch(() => undefined);
          throw storageFailure(error);
        }
      });
    },
    takeover: () =>
      serial(async () => {
        if (!activeSessionId)
          throw new GlasshouseJournalError(
            'stale',
            'Load the saved run before taking over so you can inspect its latest checkpoint.'
          );
        await claim(activeSessionId, true);
      }),
    close: () => {
      if (closed) return;
      closed = true;
      globalThis.clearInterval(heartbeat);
      void tail.then(async () => {
        if (ownedSessionId) {
          try {
            const transaction = db.transaction('metadata', 'readwrite');
            const done = completed(transaction);
            const store = transaction.objectStore('metadata');
            const key = `writer:${ownedSessionId}`;
            const lease = (await request(store.get(key))) as Lease | undefined;
            if (lease?.owner === writerId) store.delete(key);
            await done;
          } catch {
            /* An unclean close safely expires the lease. */
          }
        }
        db.close();
      });
    },
    deleteAll: () =>
      serial(async () => {
        const transaction = db.transaction([...STORES], 'readwrite');
        const done = completed(transaction);
        try {
          const leases = (await request(transaction.objectStore('metadata').getAll())) as (
            Metadata | Lease
          )[];
          if (
            leases.some(
              (entry) =>
                'owner' in entry && entry.owner !== writerId && entry.expiresAt > Date.now()
            )
          ) {
            throw new GlasshouseJournalError(
              'readonly',
              'Another tab is actively saving Glasshouse. Close that tab before deleting this application’s records.'
            );
          }
          for (const name of STORES) transaction.objectStore(name).clear();
          await done;
          activeSessionId = null;
          ownedSessionId = null;
          readOnly = false;
        } catch (error) {
          try {
            transaction.abort();
          } catch {
            /* Already aborted. */
          }
          await done.catch(() => undefined);
          throw storageFailure(error);
        }
      }),
  };
}

/** Optional explicit, idempotent backup. Originals in localStorage remain untouched. */
export async function backupLegacyGlasshouseRecords(): Promise<number> {
  const records = detectLegacyGlasshouseRecords();
  if (!records.length) return 0;
  const db = await openDatabase();
  try {
    const transaction = db.transaction('legacy', 'readwrite');
    const done = completed(transaction);
    const store = transaction.objectStore('legacy');
    for (const record of records) {
      const exists = await request(store.get(record.key));
      if (!exists) store.add(record);
    }
    await done;
    return records.length;
  } finally {
    db.close();
  }
}

export async function getGlasshouseRecoveryRecords(): Promise<GlasshouseRecoveryRecord[]> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction('quarantine', 'readonly');
    const done = completed(transaction);
    const records = (await request(
      transaction.objectStore('quarantine').getAll()
    )) as GlasshouseRecoveryRecord[];
    await done;
    return records;
  } finally {
    db.close();
  }
}
