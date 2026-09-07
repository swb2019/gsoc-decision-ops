'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGlasshouseSession,
  GLASSHOUSE_VERSIONS,
  transitionGlasshouse,
  type GlasshouseSession as Session,
  type GlasshouseCommand as Command,
  type GlasshouseMode as Mode,
} from '@gsoc-decision-ops/core';
import { openGlasshouseJournal } from '@/lib/glasshouse-storage';

type Intent = Command extends infer C
  ? C extends Command
    ? Omit<C, 'commandId' | 'actor'>
    : never
  : never;
type Journal = Awaited<ReturnType<typeof openGlasshouseJournal>>;
const currentRubric = (value: Session | null): boolean =>
  Boolean(
    value &&
    value.rubricVersion === GLASSHOUSE_VERSIONS.rubric &&
    value.rulesVersion === GLASSHOUSE_VERSIONS.rules &&
    value.assetsVersion === GLASSHOUSE_VERSIONS.assets &&
    value.scenarioVersion === GLASSHOUSE_VERSIONS.scenario
  );

export function useGlasshouse(activeView = true) {
  const [state, setState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Opening local journal…');
  const [unsaved, setUnsaved] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [recoveryText, setRecoveryText] = useState('');
  const [error, setError] = useState('');
  const [activeSeconds, setActiveSeconds] = useState(0);
  const stateRef = useRef<Session | null>(null);
  const commandError = useRef('');
  const journal = useRef<Journal | null>(null);
  const saveChain = useRef(Promise.resolve());
  const activeSecondsRef = useRef(0);
  const historical = Boolean(state && !currentRubric(state));

  const persist = useCallback((next: Session) => {
    const measuredSeconds = activeSecondsRef.current;
    setSaveStatus('Saving locally…');
    saveChain.current = saveChain.current
      .then(async () => {
        if (!journal.current) throw new Error('Local storage is unavailable.');
        await journal.current.save(next, measuredSeconds);
        setReadOnly(false);
        setUnsaved(false);
        setSaveStatus('Saved on this device');
      })
      .catch((cause: unknown) => {
        setUnsaved(true);
        setReadOnly(journal.current?.readOnly ?? false);
        if (
          cause &&
          typeof cause === 'object' &&
          'recoveryText' in cause &&
          typeof cause.recoveryText === 'string'
        )
          setRecoveryText(cause.recoveryText);
        setSaveStatus(
          cause instanceof Error ? cause.message : 'The journal could not save this change.'
        );
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let opened: Journal | null = null;
    void (async () => {
      try {
        opened = await openGlasshouseJournal();
        if (cancelled) {
          opened.close();
          return;
        }
        journal.current = opened;
        const previous = await opened.load();
        const status = await opened.getSaveStatus();
        if (!cancelled) {
          stateRef.current = previous;
          setState(previous);
          activeSecondsRef.current = status.activePlaySeconds;
          setActiveSeconds(status.activePlaySeconds);
          setReadOnly(status.readOnly);
          setSaveStatus(
            status.readOnly
              ? 'Another tab is saving this run. This tab is read-only until you explicitly take over.'
              : previous
                ? 'Restored from this device'
                : 'Local journal ready'
          );
        }
      } catch (cause) {
        if (!cancelled) {
          if (
            cause &&
            typeof cause === 'object' &&
            'recoveryText' in cause &&
            typeof cause.recoveryText === 'string'
          )
            setRecoveryText(cause.recoveryText);
          setUnsaved(true);
          setSaveStatus(cause instanceof Error ? cause.message : 'Local saving is unavailable.');
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      opened?.close();
      journal.current = null;
    };
  }, []);

  const replace = useCallback(
    (next: Session, resetActiveTime = false) => {
      if (resetActiveTime || stateRef.current?.sessionId !== next.sessionId) {
        activeSecondsRef.current = 0;
        setActiveSeconds(0);
      }
      stateRef.current = next;
      setState(next);
      setError('');
      persist(next);
    },
    [persist]
  );

  const send = useCallback(
    (intent: Intent): boolean => {
      commandError.current = '';
      const current = stateRef.current;
      if (!current) return false;
      if (!currentRubric(current)) {
        commandError.current =
          'This is a historical read-only record. Start a fresh mission to act.';
        setError(
          'This historical rules, rubric and asset contract is preserved for read-only review. Start a fresh mission to use the current version.'
        );
        return false;
      }
      if (journal.current?.readOnly) {
        commandError.current = 'This tab is read-only. Take over the journal before acting.';
        setReadOnly(true);
        setError(
          'This tab is read-only. Inspect the saved run and explicitly take over before making changes.'
        );
        return false;
      }
      const command = { ...intent, actor: 'commander', commandId: crypto.randomUUID() } as Command;
      const result = transitionGlasshouse(current, command);
      if (result.error) {
        commandError.current = result.error;
        if (result.state !== current) replace(result.state);
        setError(result.error);
        return false;
      }
      replace(result.state);
      return true;
    },
    [replace]
  );

  useEffect(() => {
    const pause = () => {
      if (
        document.hidden &&
        currentRubric(stateRef.current) &&
        stateRef.current?.lifecycle === 'active' &&
        !stateRef.current.paused
      )
        send({ type: 'pause', paused: true });
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, [send]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        activeView &&
        !document.hidden &&
        !journal.current?.readOnly &&
        stateRef.current?.lifecycle === 'active' &&
        currentRubric(stateRef.current)
      ) {
        activeSecondsRef.current += 1;
        setActiveSeconds(activeSecondsRef.current);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeView]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!journal.current || !stateRef.current) return;
      void journal.current
        .getSaveStatus()
        .then((status) => {
          setReadOnly(status.readOnly);
          if (status.readOnly)
            setSaveStatus(
              'Another tab is saving this run. This tab is read-only until you explicitly take over.'
            );
        })
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        activeView &&
        !document.hidden &&
        stateRef.current &&
        currentRubric(stateRef.current) &&
        journal.current &&
        !journal.current.readOnly
      )
        persist(stateRef.current);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [activeView, persist]);

  const start = useCallback(
    (mode: Mode, seed: number) => {
      setActiveSeconds(0);
      activeSecondsRef.current = 0;
      setRecoveryText('');
      replace(createGlasshouseSession(seed, mode, crypto.randomUUID()));
    },
    [replace]
  );

  const takeover = useCallback(async () => {
    try {
      if (!journal.current) journal.current = await openGlasshouseJournal();
      if (journal.current.readOnly) {
        const latest = await journal.current.load();
        await journal.current.takeover();
        if (latest) {
          stateRef.current = latest;
          setState(latest);
          const status = await journal.current.getSaveStatus();
          activeSecondsRef.current = status.activePlaySeconds;
          setActiveSeconds(status.activePlaySeconds);
        }
      }
      setReadOnly(false);
      if (stateRef.current && currentRubric(stateRef.current)) persist(stateRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not take over this journal.');
    }
  }, [persist]);

  const deleteLocal = useCallback(async () => {
    try {
      await saveChain.current;
      if (!journal.current) journal.current = await openGlasshouseJournal();
      await journal.current.deleteAll();
      stateRef.current = null;
      setState(null);
      setSaveStatus('Glasshouse journal deleted');
      setUnsaved(false);
      setReadOnly(false);
      setActiveSeconds(0);
      activeSecondsRef.current = 0;
    } catch (cause) {
      setError(
        `The Glasshouse journal could not be deleted. No deletion was confirmed. ${cause instanceof Error ? cause.message : 'Local storage is unavailable.'}`
      );
    }
  }, []);

  const showLaunch = useCallback(async () => {
    if (
      stateRef.current &&
      currentRubric(stateRef.current) &&
      journal.current &&
      !journal.current.readOnly
    )
      persist(stateRef.current);
    await saveChain.current;
    stateRef.current = null;
    setState(null);
    setError('');
    setReadOnly(false);
  }, [persist]);

  return {
    state,
    ready,
    saveStatus,
    unsaved,
    readOnly,
    historical,
    recoveryText,
    error,
    setError,
    send,
    getCommandError: () => commandError.current,
    getCurrentState: () => stateRef.current,
    start,
    replace,
    takeover,
    deleteLocal,
    showLaunch,
    activeSeconds,
  };
}
