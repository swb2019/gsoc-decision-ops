/**
 * Light-Touch Guidance System for Hourglass Command
 *
 * Provides contextual guidance popups to help users navigate the interface.
 * Designed with "Don't Make Me Think" principles:
 * - One tip at a time (queued)
 * - Never spam; trigger on first visit or first relevant state
 * - Dismissible with "don't show again" option
 * - Respects existing JIT Field Guide / tips disable preferences
 * - Premium glass/card styling matching Hourglass chrome
 */

export type GuidanceSurface =
  | 'INTEL_FEED'
  | 'COP_LAYERS'
  | 'DECISION_POSTURE'
  | 'RISK_TREATMENTS'
  | 'TACTICAL'
  | 'TEAM_STAKEHOLDERS'
  | 'KRI_VALUE'
  | 'FIELD_GUIDE'
  | 'MICRO_TASKS'
  | 'AAR_EXPORT';

export type GuidanceTrigger =
  | 'FIRST_VISIT'
  | 'FIRST_INJECT'
  | 'FIRST_DECISION'
  | 'LOW_TRUST'
  | 'HIGH_HEAT'
  | 'RESOURCE_CONTENTION'
  | 'STREAK_LOST'
  | 'FIRST_NOISE_INJECT'
  | 'FIRST_URGENT_INJECT'
  | 'TIMER_WARNING';

export interface GuidanceTip {
  id: string;
  surface: GuidanceSurface;
  trigger: GuidanceTrigger;
  title: string;
  content: string;
  actionHint?: string;
  relatedSurfaces?: GuidanceSurface[];
  priority: number;
  showOnce: boolean;
}

const GUIDANCE_TIPS: GuidanceTip[] = [
  {
    id: 'intel-feed-intro',
    surface: 'INTEL_FEED',
    trigger: 'FIRST_VISIT',
    title: 'Intel Feed',
    content:
      'This is your primary information stream. Injects arrive here with priority indicators (red = IMMEDIATE, amber = URGENT). Triage by urgency and domain.',
    actionHint: 'Watch for intake channel icons to identify the source',
    priority: 1,
    showOnce: true,
  },
  {
    id: 'intel-noise',
    surface: 'INTEL_FEED',
    trigger: 'FIRST_NOISE_INJECT',
    title: 'Noise vs. Signal',
    content:
      'Not every inject requires action. Routine items (gray priority) can often be acknowledged and deprioritized. Focus cognitive budget on URGENT and IMMEDIATE.',
    priority: 5,
    showOnce: true,
  },
  {
    id: 'cop-layers-intro',
    surface: 'COP_LAYERS',
    trigger: 'FIRST_VISIT',
    title: 'Common Operating Picture',
    content:
      'The COP shows your situational awareness: zone heat levels, entity connections, and overall threat posture. Decisions cascade into COP changes.',
    actionHint: 'Monitor zone heat (colors) and entity links for threat patterns',
    relatedSurfaces: ['KRI_VALUE'],
    priority: 2,
    showOnce: true,
  },
  {
    id: 'decision-posture-intro',
    surface: 'DECISION_POSTURE',
    trigger: 'FIRST_DECISION',
    title: 'Posture Decisions',
    content:
      'Choose CONTINUE (accept risk), DEGRADE (mitigate with reduced ops), or PAUSE (avoid by halting). Each posture maps to an ESRM risk treatment.',
    actionHint: 'Select the affected asset first, then commit your posture',
    relatedSurfaces: ['RISK_TREATMENTS'],
    priority: 1,
    showOnce: true,
  },
  {
    id: 'risk-treatments-intro',
    surface: 'RISK_TREATMENTS',
    trigger: 'FIRST_DECISION',
    title: 'Risk Treatments',
    content:
      'After selecting posture, choose a specific treatment action. ACCEPT = proceed with monitoring. MITIGATE = apply controls. AVOID = shut down. TRANSFER = escalate externally.',
    actionHint: 'Selecting a treatment category grants bonus time',
    relatedSurfaces: ['DECISION_POSTURE'],
    priority: 2,
    showOnce: true,
  },
  {
    id: 'tactical-intro',
    surface: 'TACTICAL',
    trigger: 'FIRST_VISIT',
    title: 'Tactical Actions',
    content:
      'Deploy security resources for additional protection. Actions cost resources (guards, analysts, responders) and have cooldowns. Use tactically, not reactively.',
    actionHint: 'Check resource availability before deploying',
    relatedSurfaces: ['TEAM_STAKEHOLDERS'],
    priority: 3,
    showOnce: true,
  },
  {
    id: 'team-stakeholders-intro',
    surface: 'TEAM_STAKEHOLDERS',
    trigger: 'FIRST_VISIT',
    title: 'Team & Stakeholders',
    content:
      'Your team roster shows operator availability. Stakeholders have influence levels that affect how your decisions are received. Brief asset owners to build trust.',
    actionHint: 'Watch stakeholder trust - it affects point multipliers',
    relatedSurfaces: ['TACTICAL'],
    priority: 3,
    showOnce: true,
  },
  {
    id: 'kri-value-intro',
    surface: 'KRI_VALUE',
    trigger: 'FIRST_VISIT',
    title: 'KRIs & Business Value',
    content:
      'Key Risk Indicators show operational health. Green = within tolerance, Amber = approaching threshold, Red = exceeded. Decisions affect KRIs in real-time.',
    actionHint: 'Track MTTA (time to acknowledge) and coverage metrics',
    relatedSurfaces: ['COP_LAYERS'],
    priority: 4,
    showOnce: true,
  },
  {
    id: 'field-guide-intro',
    surface: 'FIELD_GUIDE',
    trigger: 'FIRST_VISIT',
    title: 'Field Guide',
    content:
      'The Field Guide explains ESRM terminology and concepts. Tap any highlighted term for a quick definition. Enable/disable tips in settings.',
    priority: 5,
    showOnce: true,
  },
  {
    id: 'micro-tasks-intro',
    surface: 'MICRO_TASKS',
    trigger: 'FIRST_VISIT',
    title: 'Knowledge Checks',
    content:
      "When there's a gap between injects, you'll get quick ESRM knowledge checks. These fill dead air and earn bonus points. Skip if a real inject needs attention.",
    priority: 4,
    showOnce: true,
  },
  {
    id: 'timer-warning',
    surface: 'DECISION_POSTURE',
    trigger: 'TIMER_WARNING',
    title: 'Time Pressure',
    content:
      'Decision timer is running low. Commit a posture quickly - a late decision is worse than an imperfect one. You can adjust in a follow-up decision.',
    priority: 1,
    showOnce: false,
  },
  {
    id: 'trust-low',
    surface: 'TEAM_STAKEHOLDERS',
    trigger: 'LOW_TRUST',
    title: 'Stakeholder Trust Low',
    content:
      'Trust has dropped significantly. Brief asset owners on your decisions and document residual risk clearly to rebuild confidence.',
    actionHint: 'Enable "Owner Briefed" checkbox on decisions',
    priority: 2,
    showOnce: false,
  },
  {
    id: 'heat-high',
    surface: 'COP_LAYERS',
    trigger: 'HIGH_HEAT',
    title: 'Zone Heat Critical',
    content:
      'One or more zones are at critical heat levels. Consider PAUSE posture for affected areas or deploy tactical actions to reduce exposure.',
    actionHint: 'Check Tactical panel for available mitigations',
    relatedSurfaces: ['TACTICAL'],
    priority: 2,
    showOnce: false,
  },
  {
    id: 'resource-contention',
    surface: 'TACTICAL',
    trigger: 'RESOURCE_CONTENTION',
    title: 'Resource Contention',
    content:
      'Security resources are strained. Prioritize deployments for IMMEDIATE priority injects. Resources regenerate on cooldown timers.',
    priority: 2,
    showOnce: false,
  },
  {
    id: 'streak-lost',
    surface: 'DECISION_POSTURE',
    trigger: 'STREAK_LOST',
    title: 'Decision Streak Lost',
    content:
      'Your streak reset due to an incorrect or timed-out decision. Rebuild by matching expected postures - check the inject\'s "decision pressure" hint.',
    priority: 3,
    showOnce: false,
  },
  {
    id: 'aar-export-intro',
    surface: 'AAR_EXPORT',
    trigger: 'FIRST_VISIT',
    title: 'After-Action Report',
    content:
      'When the hour ends, you can export a detailed AAR with your decisions, outcomes, and lessons learned. Use for self-assessment or sharing with mentors.',
    priority: 5,
    showOnce: true,
  },
];

const GUIDANCE_STORAGE_KEY = 'hourglass-guidance-state';
const GUIDANCE_ENABLED_KEY = 'hourglass-guidance-enabled';

interface GuidanceState {
  seenTips: string[];
  visitedSurfaces: GuidanceSurface[];
  dismissedForSession: string[];
  globalEnabled: boolean;
}

let state: GuidanceState = {
  seenTips: [],
  visitedSurfaces: [],
  dismissedForSession: [],
  globalEnabled: true,
};

let tipQueue: GuidanceTip[] = [];
let activeTip: GuidanceTip | null = null;

export function loadGuidanceState(): GuidanceState {
  if (typeof window === 'undefined') return state;

  try {
    const stored = localStorage.getItem(GUIDANCE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      state = {
        ...state,
        seenTips: parsed.seenTips || [],
        visitedSurfaces: parsed.visitedSurfaces || [],
      };
    }

    const enabledStr = localStorage.getItem(GUIDANCE_ENABLED_KEY);
    if (enabledStr !== null) {
      state.globalEnabled = enabledStr === 'true';
    }
  } catch {
    // Use defaults
  }

  return state;
}

function saveGuidanceState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      GUIDANCE_STORAGE_KEY,
      JSON.stringify({
        seenTips: state.seenTips,
        visitedSurfaces: state.visitedSurfaces,
      })
    );
  } catch {
    // Ignore storage errors
  }
}

export function setGuidanceEnabled(enabled: boolean): void {
  state.globalEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUIDANCE_ENABLED_KEY, String(enabled));
  }
  if (!enabled) {
    activeTip = null;
    tipQueue = [];
  }
}

export function isGuidanceEnabled(): boolean {
  return state.globalEnabled;
}

export function markTipSeen(tipId: string): void {
  if (!state.seenTips.includes(tipId)) {
    state.seenTips.push(tipId);
    saveGuidanceState();
  }
}

export function markTipDismissedForSession(tipId: string): void {
  if (!state.dismissedForSession.includes(tipId)) {
    state.dismissedForSession.push(tipId);
  }
}

export function markTipDismissedForever(tipId: string): void {
  markTipSeen(tipId);
  markTipDismissedForSession(tipId);
}

export function markSurfaceVisited(surface: GuidanceSurface): void {
  if (!state.visitedSurfaces.includes(surface)) {
    state.visitedSurfaces.push(surface);
    saveGuidanceState();
  }
}

export function hasSurfaceBeenVisited(surface: GuidanceSurface): boolean {
  return state.visitedSurfaces.includes(surface);
}

export function hasTipBeenSeen(tipId: string): boolean {
  return state.seenTips.includes(tipId);
}

function canShowTip(tip: GuidanceTip): boolean {
  if (!state.globalEnabled) return false;
  if (state.dismissedForSession.includes(tip.id)) return false;
  if (tip.showOnce && state.seenTips.includes(tip.id)) return false;
  return true;
}

export function queueTip(tip: GuidanceTip): void {
  if (!canShowTip(tip)) return;
  if (tipQueue.some((t) => t.id === tip.id)) return;
  if (activeTip?.id === tip.id) return;

  tipQueue.push(tip);
  tipQueue.sort((a, b) => a.priority - b.priority);
}

export function queueTipByTrigger(trigger: GuidanceTrigger, surface?: GuidanceSurface): void {
  const matchingTips = GUIDANCE_TIPS.filter(
    (tip) => tip.trigger === trigger && (!surface || tip.surface === surface)
  );
  for (const tip of matchingTips) {
    queueTip(tip);
  }
}

export function queueFirstVisitTip(surface: GuidanceSurface): void {
  if (hasSurfaceBeenVisited(surface)) return;
  markSurfaceVisited(surface);
  queueTipByTrigger('FIRST_VISIT', surface);
}

export function getNextTip(): GuidanceTip | null {
  if (!state.globalEnabled) return null;
  if (activeTip) return activeTip;
  if (tipQueue.length === 0) return null;

  const nextTip = tipQueue.shift()!;
  if (!canShowTip(nextTip)) {
    return getNextTip();
  }

  activeTip = nextTip;
  return activeTip;
}

export function dismissActiveTip(permanent: boolean = false): void {
  if (!activeTip) return;

  if (permanent) {
    markTipDismissedForever(activeTip.id);
  } else {
    markTipSeen(activeTip.id);
    markTipDismissedForSession(activeTip.id);
  }

  activeTip = null;
}

export function getActiveTip(): GuidanceTip | null {
  return activeTip;
}

export function hasQueuedTips(): boolean {
  return tipQueue.length > 0;
}

export function getQueuedTipCount(): number {
  return tipQueue.length;
}

export function clearTipQueue(): void {
  tipQueue = [];
  activeTip = null;
}

export function resetGuidanceState(): void {
  state = {
    seenTips: [],
    visitedSurfaces: [],
    dismissedForSession: [],
    globalEnabled: true,
  };
  tipQueue = [];
  activeTip = null;

  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUIDANCE_STORAGE_KEY);
    localStorage.removeItem(GUIDANCE_ENABLED_KEY);
  }
}

export function getTipForSurface(surface: GuidanceSurface): GuidanceTip | null {
  return (
    GUIDANCE_TIPS.find(
      (tip) => tip.surface === surface && tip.trigger === 'FIRST_VISIT' && canShowTip(tip)
    ) || null
  );
}

export function getAllTips(): GuidanceTip[] {
  return [...GUIDANCE_TIPS];
}

export function getSeenTipsCount(): number {
  return state.seenTips.length;
}

export function getTotalTipsCount(): number {
  return GUIDANCE_TIPS.filter((t) => t.showOnce).length;
}
