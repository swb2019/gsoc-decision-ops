'use client';

export interface FieldGuideTip {
  term: string;
  shortTip: string;
  category: 'treatment' | 'metric' | 'process' | 'role';
}

export const FIELD_GUIDE: Record<string, FieldGuideTip> = {
  ACCEPT: {
    term: 'Accept',
    shortTip:
      'Acknowledge risk exists, proceed without additional controls. Use when cost of mitigation exceeds potential loss.',
    category: 'treatment',
  },
  MITIGATE: {
    term: 'Mitigate',
    shortTip:
      'Reduce likelihood or impact through controls. Most common treatment — balance cost vs. risk reduction.',
    category: 'treatment',
  },
  AVOID: {
    term: 'Avoid',
    shortTip:
      'Eliminate the risk by stopping the activity. Use for unacceptable risks where no control is sufficient.',
    category: 'treatment',
  },
  TRANSFER: {
    term: 'Transfer',
    shortTip:
      'Shift risk to third party (insurance, vendor). Risk still exists but financial burden moves.',
    category: 'treatment',
  },
  RESIDUAL: {
    term: 'Residual Risk',
    shortTip:
      'Risk remaining after controls applied. No treatment eliminates risk entirely — document what remains.',
    category: 'metric',
  },
  KRI: {
    term: 'Key Risk Indicator',
    shortTip:
      'Early warning metric that signals risk level change. Monitor trends, not just thresholds.',
    category: 'metric',
  },
  COP: {
    term: 'Common Operating Picture',
    shortTip:
      'Shared situational awareness across all responders. Single source of truth during incidents.',
    category: 'process',
  },
  ESRM: {
    term: 'Enterprise Security Risk Management',
    shortTip:
      'Security as business advisor. Asset owners own risk; security provides expertise and options.',
    category: 'process',
  },
  ASSET_OWNER: {
    term: 'Asset Owner',
    shortTip:
      'Business stakeholder who owns the risk decision. Security advises; owner accepts residual risk.',
    category: 'role',
  },
  INHERENT: {
    term: 'Inherent Risk',
    shortTip: 'Risk level before any controls. Baseline used to measure treatment effectiveness.',
    category: 'metric',
  },
  LIKELIHOOD: {
    term: 'Likelihood',
    shortTip:
      'Probability of threat materializing. Consider threat capability, intent, and opportunity.',
    category: 'metric',
  },
  IMPACT: {
    term: 'Impact',
    shortTip:
      'Consequence severity if risk occurs. Measure in business terms: revenue, reputation, safety.',
    category: 'metric',
  },
  POSTURE: {
    term: 'Posture',
    shortTip:
      'Current operational stance. CONTINUE normal ops, DEGRADE reduced capacity, PAUSE full stop.',
    category: 'process',
  },
  CONTINUE: {
    term: 'Continue',
    shortTip: 'Maintain normal operations. Risk is managed within acceptable tolerance.',
    category: 'process',
  },
  DEGRADE: {
    term: 'Degrade',
    shortTip: 'Reduce operations to limit exposure. Partial service while managing elevated risk.',
    category: 'process',
  },
  PAUSE: {
    term: 'Pause',
    shortTip: 'Full operational stop. Risk exceeds all tolerance — resume only when controlled.',
    category: 'process',
  },
  INJECT: {
    term: 'Inject',
    shortTip: 'Incoming information or event requiring decision. Triage by urgency and domain.',
    category: 'process',
  },
  ALE: {
    term: 'Annual Loss Expectancy',
    shortTip: 'Expected yearly loss: (likelihood × impact). Baseline for ROI calculations.',
    category: 'metric',
  },
  ROI: {
    term: 'Return on Investment',
    shortTip: 'Value created vs. cost spent. Positive ROI = treatment worth the investment.',
    category: 'metric',
  },
};

const SEEN_TIPS_KEY = 'hourglass-seen-tips';
const TIPS_ENABLED_KEY = 'hourglass-tips-enabled';

let seenTips: Set<string> = new Set();
let tipsEnabled = true;

export function loadFieldGuideConfig(): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(SEEN_TIPS_KEY);
    if (stored) {
      seenTips = new Set(JSON.parse(stored));
    }
    const enabledStr = localStorage.getItem(TIPS_ENABLED_KEY);
    if (enabledStr !== null) {
      tipsEnabled = enabledStr === 'true';
    }
  } catch {
    seenTips = new Set();
    tipsEnabled = true;
  }
}

export function saveSeenTip(term: string): void {
  seenTips.add(term);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify([...seenTips]));
  }
}

export function hasSeenTip(term: string): boolean {
  return seenTips.has(term);
}

export function setTipsEnabled(enabled: boolean): void {
  tipsEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TIPS_ENABLED_KEY, String(enabled));
  }
}

export function areTipsEnabled(): boolean {
  return tipsEnabled;
}

export function getTip(term: string): FieldGuideTip | null {
  const key = term.toUpperCase().replace(/[^A-Z_]/g, '_');
  return FIELD_GUIDE[key] || null;
}

export function resetSeenTips(): void {
  seenTips = new Set();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SEEN_TIPS_KEY);
  }
}

export function getSeenTipsCount(): number {
  return seenTips.size;
}

export function getTotalTipsCount(): number {
  return Object.keys(FIELD_GUIDE).length;
}
