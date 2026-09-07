import { createGlasshouseSession, forkGlasshouse, transitionGlasshouse } from './kernel.js';
import {
  canonicalGlasshouseState,
  glasshouseDigest,
  restoreGlasshouseSession,
  serializeGlasshouseSession,
} from './record.js';
import type { Command, Session } from './types.js';

function sameCommand(left: Command, right: Command): boolean {
  const normalize = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(normalize)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, item]) => [key, normalize(item)])
          )
        : value;
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function replayCommand(state: Session, command: Command): Session {
  const result = transitionGlasshouse(state, command);
  if (
    result.error &&
    !result.state.commands.some((recorded) => recorded.commandId === command.commandId)
  )
    throw new Error(`The original journal cannot be reconstructed: ${result.error}`);
  return result.state;
}

/** A read-only original snapshot, interpolating only its clock when the horizon lies between recorded updates. */
function originalAtHorizon(
  source: Session,
  horizon: number
): { state: Session; interpolated: boolean } {
  let state = createGlasshouseSession(source.seed, source.initialMode, source.sessionId);
  let interpolated = false;
  for (const command of source.commands) {
    if (command.type === 'advance' && command.to > horizon) {
      if (state.tick < horizon) {
        const baseId = `comparison-${glasshouseDigest(`${source.sessionId}:${horizon}:${command.commandId}`)}`;
        let commandId = baseId;
        for (
          let index = 1;
          source.commands.some((recorded) => recorded.commandId === commandId);
          index += 1
        )
          commandId = `${baseId}-${index}`;
        state = replayCommand(state, {
          actor: 'commander',
          commandId,
          type: 'advance',
          to: horizon,
        });
        interpolated = true;
      }
      break;
    }
    state = replayCommand(state, command);
    if (state.tick > horizon)
      throw new Error('The original replay passed the requested comparison horizon.');
  }
  if (state.tick !== horizon)
    throw new Error(
      'The original record does not contain enough simulated time for this comparison.'
    );
  if (source.parentSessionId !== undefined) {
    if ((source.forkAt ?? 0) > horizon)
      throw new Error('This comparison predates the original branch’s own checkpoint.');
    state.parentSessionId = source.parentSessionId;
    state.forkAt = source.forkAt;
  }
  return { state, interpolated };
}

/**
 * Advances one accepted alternative to its next event only. The original is reconstructed independently;
 * its post-checkpoint choices never become commands for the changed branch. Neither input is mutated.
 */
export function compareGlasshouseNextCheckpoint(
  sourceOriginalSession: Session,
  selectedDecisionId: string,
  currentBranch: Session,
  advanceCommandId: string
): { branch: Session; original: Session; reason: string } {
  const source = restoreGlasshouseSession(serializeGlasshouseSession(sourceOriginalSession));
  const branch = restoreGlasshouseSession(serializeGlasshouseSession(currentBranch));
  const decision = source.decisions.find((item) => item.id === selectedDecisionId);
  if (!decision) throw new Error('Select an existing decision in the original run.');
  if (
    branch.sessionId === source.sessionId ||
    branch.parentSessionId !== source.sessionId ||
    branch.forkAt !== decision.at
  )
    throw new Error('This branch is not linked to the selected original checkpoint.');
  const checkpoint = forkGlasshouse(source, selectedDecisionId, branch.sessionId);
  if (
    branch.commands.length < checkpoint.commands.length ||
    checkpoint.commands.some((command, index) => !sameCommand(command, branch.commands[index]))
  )
    throw new Error('The branch history does not preserve the original pre-decision checkpoint.');
  // Replay the claimed prefix independently: ancestry alone is not proof of compatible content/seed.
  let prefix = createGlasshouseSession(branch.seed, branch.initialMode, branch.sessionId);
  for (const command of branch.commands.slice(0, checkpoint.commands.length))
    prefix = replayCommand(prefix, command);
  prefix.parentSessionId = branch.parentSessionId;
  prefix.forkAt = branch.forkAt;
  if (canonicalGlasshouseState(prefix) !== canonicalGlasshouseState(checkpoint))
    throw new Error('The branch uses different initial conditions or checkpoint state.');
  if (branch.decisions.length !== checkpoint.decisions.length + 1)
    throw new Error('Commit exactly one alternative plan before requesting its next consequence.');
  if (
    branch.tick !== checkpoint.tick ||
    branch.commands.slice(checkpoint.commands.length).some((command) => command.type === 'advance')
  )
    throw new Error(
      'This branch has already advanced beyond its choice. Inspect the current checkpoint or create a fresh alternative.'
    );
  if (branch.lifecycle !== 'active')
    throw new Error('This branch has already ended; inspect its recorded review.');
  if (
    !/^[a-zA-Z0-9_-]{1,100}$/.test(advanceCommandId) ||
    branch.commands.some((command) => command.commandId === advanceCommandId)
  )
    throw new Error('A new valid command identifier is required for the comparison advance.');
  const next = branch.queue[0];
  if (!next || next.at <= branch.tick)
    throw new Error(
      'There is no later consequential checkpoint available; inspect the current state.'
    );
  if (next.at > source.tick)
    throw new Error(
      `The next branch event is at minute ${next.at}, beyond the original record’s minute ${source.tick}. Continue the original separately before comparing; no future choices were invented.`
    );
  const original = originalAtHorizon(source, next.at);
  const advanced = transitionGlasshouse(branch, {
    actor: 'commander',
    commandId: advanceCommandId,
    type: 'advance',
    to: next.at,
  });
  if (advanced.error)
    throw new Error(`The branch needs your input before comparison: ${advanced.error}`);
  return {
    branch: advanced.state,
    original: original.state,
    reason: `Modeled comparison at the same simulated minute ${next.at}. The changed branch stops at its next meaningful update and requires your next decision. The original includes only its actually recorded choices up to that horizon.${original.interpolated ? ' Its clock is interpolated between recorded updates; no unrecorded choice was added.' : ''} Original future commands were not copied into the changed branch. This is a bounded consequence comparison, not a completed alternate mission or evidence of learning.`,
  };
}
