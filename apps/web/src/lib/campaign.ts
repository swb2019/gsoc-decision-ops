/**
 * Campaign progression utilities
 *
 * Manages localStorage-persisted unlock state for the scenario campaign.
 */

import { getCampaignArcs, getAvailableScenarios } from '@gsoc-decision-ops/core';

// localStorage keys for campaign progression
const CAMPAIGN_UNLOCKS_KEY = 'hourglass-campaign-unlocks';
const CAMPAIGN_COMPLETIONS_KEY = 'hourglass-campaign-completions';

/**
 * Get unlocked arc IDs from localStorage
 */
export function getUnlockedArcs(): Set<string> {
  if (typeof window === 'undefined') return new Set(['arc-1-foundations']);
  try {
    const stored = localStorage.getItem(CAMPAIGN_UNLOCKS_KEY);
    const parsed = stored ? JSON.parse(stored) : ['arc-1-foundations'];
    return new Set(parsed);
  } catch {
    return new Set(['arc-1-foundations']);
  }
}

/**
 * Save unlocked arc IDs to localStorage
 */
export function saveUnlockedArcs(unlocks: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CAMPAIGN_UNLOCKS_KEY, JSON.stringify([...unlocks]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get completed arc IDs from localStorage
 */
export function getCompletedArcs(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(CAMPAIGN_COMPLETIONS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

/**
 * Get the arc ID for a given scenario ID
 */
export function getArcIdForScenario(scenarioId: string): string | null {
  const scenarios = getAvailableScenarios();
  const scenario = scenarios.find((s) => s.id === scenarioId);
  return scenario?.campaign?.arcId || null;
}

/**
 * Mark a scenario as completed and unlock dependent arcs
 * Returns true if any new arcs were unlocked
 */
export function completeScenario(scenarioId: string): { completed: boolean; newUnlocks: string[] } {
  if (typeof window === 'undefined') return { completed: false, newUnlocks: [] };

  const arcId = getArcIdForScenario(scenarioId);
  if (!arcId) return { completed: false, newUnlocks: [] };

  try {
    // Mark as completed
    const completions = getCompletedArcs();
    const wasAlreadyCompleted = completions.has(arcId);
    completions.add(arcId);
    localStorage.setItem(CAMPAIGN_COMPLETIONS_KEY, JSON.stringify([...completions]));

    // Unlock dependent arcs
    const allArcs = getCampaignArcs();
    const unlocks = getUnlockedArcs();
    const newUnlocks: string[] = [];

    for (const arc of allArcs) {
      if (
        arc.unlockRequirements.length > 0 &&
        arc.unlockRequirements.every((req) => completions.has(req)) &&
        !unlocks.has(arc.arcId)
      ) {
        unlocks.add(arc.arcId);
        newUnlocks.push(arc.arcId);
      }
    }
    saveUnlockedArcs(unlocks);

    return { completed: !wasAlreadyCompleted, newUnlocks };
  } catch {
    return { completed: false, newUnlocks: [] };
  }
}

/**
 * Reset campaign progress (for testing/replay)
 */
export function resetCampaignProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CAMPAIGN_UNLOCKS_KEY);
    localStorage.removeItem(CAMPAIGN_COMPLETIONS_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if an arc is unlocked
 */
export function isArcUnlocked(arcId: string): boolean {
  const unlocks = getUnlockedArcs();
  return unlocks.has(arcId);
}

/**
 * Check if an arc is completed
 */
export function isArcCompleted(arcId: string): boolean {
  const completions = getCompletedArcs();
  return completions.has(arcId);
}
