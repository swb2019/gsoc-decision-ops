'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  AlertTriangle,
  Radio,
  Play,
  Pause,
  Timer,
  FileText,
  Target,
  ChevronRight,
  Volume2,
  VolumeX,
  Download,
  X,
  DoorOpen,
  Cpu,
  Brain,
  Zap,
  TrendingUp,
  Users,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  Flame,
  Activity,
  Briefcase,
  BarChart3,
  HelpCircle,
  BookOpen,
  Layers,
  Link2,
  Hourglass,
  Video,
  Building,
  Package,
  Crown,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Eye,
  EyeOff,
  Signal,
  CircleDot,
  Home,
  RotateCcw,
  ListChecks,
  Shuffle,
  ClipboardList,
  Radar,
  ShieldAlert,
  FileQuestion,
  TrendingDown,
  Minus,
  CheckCircle2,
  ShieldCheck,
  Crosshair,
  Music,
  ThumbsUp,
  Wrench,
  ArrowRightLeft,
  Ban,
  Gauge,
  AlertOctagon,
  Trophy,
  Repeat,
  Settings,
  GraduationCap,
  Sparkles,
  Calculator,
  DollarSign,
  Percent,
  Thermometer,
  ArrowUp,
  ArrowDown,
  Hexagon,
} from 'lucide-react';

// Session storage key for persistence
const SESSION_STORAGE_KEY = 'hourglass-command-session';
const PERSONAL_BEST_KEY = 'hourglass-personal-bests';
const DIFFICULTY_KEY = 'hourglass-difficulty';

// Get basePath for navigation (GitHub Pages compatible)
const getBasePath = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_PATH || '';
  }
  return '';
};

/**
 * DIFFICULTY CONFIGURATION
 *
 * Three tiers designed for progressive mastery:
 * - Rookie: Learning mode with extended timers, coach marks, less noise
 * - Operator: Standard challenge for trained responders
 * - Director: Expert mode with compressed timers, no hand-holding
 */
type DifficultyLevel = 'ROOKIE' | 'OPERATOR' | 'DIRECTOR';

interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  description: string;
  timerMultiplier: number;
  showCoachMarks: boolean;
  injectNoiseLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  microTaskFrequency: number;
  pointMultiplier: number;
  color: string;
  icon: string;
}

const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  ROOKIE: {
    id: 'ROOKIE',
    label: 'Rookie',
    description: 'Extended timers, coach marks, fewer distractions',
    timerMultiplier: 1.5,
    showCoachMarks: true,
    injectNoiseLevel: 'LOW',
    microTaskFrequency: 0.3,
    pointMultiplier: 0.8,
    color: 'emerald',
    icon: '🎓',
  },
  OPERATOR: {
    id: 'OPERATOR',
    label: 'Operator',
    description: 'Standard challenge for GSOC responders',
    timerMultiplier: 1.0,
    showCoachMarks: false,
    injectNoiseLevel: 'MEDIUM',
    microTaskFrequency: 0.5,
    pointMultiplier: 1.0,
    color: 'amber',
    icon: '⚡',
  },
  DIRECTOR: {
    id: 'DIRECTOR',
    label: 'Director',
    description: 'Compressed timers, high noise, no safety net',
    timerMultiplier: 0.7,
    showCoachMarks: false,
    injectNoiseLevel: 'HIGH',
    microTaskFrequency: 0.8,
    pointMultiplier: 1.5,
    color: 'red',
    icon: '🔥',
  },
};

interface PersonalBest {
  score: number;
  grade: string;
  accuracy: number;
  maxStreak: number;
  difficulty: DifficultyLevel;
  timestamp: number;
}

const getPersonalBests = (): Record<string, PersonalBest> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(PERSONAL_BEST_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const savePersonalBest = (scenarioId: string, best: PersonalBest): void => {
  if (typeof window === 'undefined') return;
  try {
    const bests = getPersonalBests();
    const existing = bests[scenarioId];
    if (!existing || best.score > existing.score) {
      bests[scenarioId] = best;
      localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(bests));
    }
  } catch {
    // Ignore storage errors
  }
};

const getSavedDifficulty = (): DifficultyLevel => {
  if (typeof window === 'undefined') return 'OPERATOR';
  try {
    const stored = localStorage.getItem(DIFFICULTY_KEY);
    if (stored && stored in DIFFICULTY_CONFIGS) {
      return stored as DifficultyLevel;
    }
  } catch {
    // Ignore
  }
  return 'OPERATOR';
};

const saveDifficulty = (difficulty: DifficultyLevel): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
  } catch {
    // Ignore
  }
};

// Sound effect URLs (Web Audio API compatible)
const SOUND_EFFECTS = {
  injectArrive:
    'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQYAiuHqkGYXD3C03O+FPgkWf8/u9IpHBA6P4fF/QwAJi+Duh0EACI3f7odAAAmL3+6HQAAL',
  decisionConfirm:
    'data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YToFAACAf35+gICBgoKCgoGAf359fHt7e3x9fn+AgYKDg4SDg4KBgH9+fXx7e3t8fH1+f4CAgYGBgYGAgH9+fn19fX1+fn9/gICAgYGBgICAf39+fn5+fn5+f3+AgICAgICAgA==',
  escalation:
    'data:audio/wav;base64,UklGRpIGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YW4GAACAgIB/fn18e3p5eHd2dXRzcnFwcG9vb29wcHFycnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wA==',
  error: 'data:audio/wav;base64,UklGRjIFAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4FAACA',
  tick: 'data:audio/wav;base64,UklGRiQCAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQACAACAf4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/',
  microTaskComplete:
    'data:audio/wav;base64,UklGRlIFAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YS4FAACAgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==',
};

// Ambient music storage key
const AMBIENT_MUSIC_KEY = 'hourglass-command-ambient-music';

/**
 * DECISION TIMER CONFIGURATION
 *
 * Benchmarks based on fast-casual mobile game UX research:
 * - Average reading speed: 200-250 WPM (~3 words/second)
 * - Option scanning: ~1.5-2 seconds per option
 * - Decision confirmation: ~2-3 seconds
 *
 * Hourglass Command multi-step decision flow:
 * 1. Read inject content (50-100 words) ~15-25s
 * 2. Select affected asset (3 options) ~5-8s
 * 3. Brief asset owner (click) ~3s
 * 4. Select treatment category (4 options) ~5-8s
 * 5. Select specific action (3-5 options) ~8-12s
 * 6. Select residual risk (7 options) ~10-15s
 *
 * Total careful read: ~50-70 seconds
 * With pressure buffer: 75 seconds base for multi-step
 *
 * References:
 * - Nielsen Norman Group: ~2.5 seconds per UI option for scanning
 * - Mobile game UX: 60-90s for complex decisions (Candy Crush, Clash Royale deck building)
 * - Reading comprehension under time pressure: -30% speed degradation
 */
const DECISION_TIMER_CONFIG = {
  BASE_TIMER: 75,
  SIMPLE_ACCEPT_TIMER: 45,
  TREATMENT_STEP_BONUS: 8,
  WARNING_THRESHOLD: 20,
  CRITICAL_THRESHOLD: 10,
  MICRO_TASK_BUFFER: 5,
} as const;

// Residual risk level icons
const RESIDUAL_LEVEL_ICONS = {
  LOW: Gauge,
  MEDIUM: AlertTriangle,
  HIGH: AlertCircle,
  CRITICAL: AlertOctagon,
} as const;

// Structured residual risk options (no free text)
const RESIDUAL_RISK_OPTIONS = [
  {
    id: 'low-manual',
    level: 'LOW',
    label: 'Low — manual workaround in place',
    rationale: 'Manual processes introduce minor delays but maintain full coverage',
  },
  {
    id: 'low-vendor',
    level: 'LOW',
    label: 'Low — vendor SLA provides coverage',
    rationale: 'Third-party agreement ensures backup response within acceptable timeframe',
  },
  {
    id: 'medium-gap',
    level: 'MEDIUM',
    label: 'Medium — temporary coverage gap',
    rationale: 'Reduced monitoring capability for limited duration; escalation path clear',
  },
  {
    id: 'medium-delay',
    level: 'MEDIUM',
    label: 'Medium — response time increased',
    rationale: 'Detection intact but response will take 15-30 minutes longer than normal',
  },
  {
    id: 'high-blind',
    level: 'HIGH',
    label: 'High — partial blind spot accepted',
    rationale: 'Some assets unmonitored temporarily; business owner acknowledges risk',
  },
  {
    id: 'high-manual',
    level: 'HIGH',
    label: 'High — relying on manual checks only',
    rationale: 'Automated detection offline; guard rounds are sole detection method',
  },
  {
    id: 'critical-exposure',
    level: 'CRITICAL',
    label: 'Critical — significant exposure accepted',
    rationale: 'Known vulnerability remains open; executive sign-off required',
  },
] as const;

// Concrete treatment options by category
const TREATMENT_OPTIONS = {
  ACCEPT: [
    {
      id: 'accept-monitor',
      label: 'Continue with enhanced monitoring',
      detail: 'Risk within tolerance; add logging/alerting',
    },
    {
      id: 'accept-asis',
      label: 'Accept current state',
      detail: 'No action needed; existing controls adequate',
    },
    {
      id: 'accept-document',
      label: 'Document and proceed',
      detail: 'Note risk in log; maintain normal operations',
    },
  ],
  MITIGATE: [
    {
      id: 'mitigate-isolate',
      label: 'Network isolation',
      detail: 'Segment affected systems from production',
    },
    {
      id: 'mitigate-disable',
      label: 'Disable compromised accounts/badges',
      detail: 'Revoke access for affected credentials',
    },
    {
      id: 'mitigate-patrol',
      label: 'Increase patrol frequency',
      detail: 'Double guard rounds in affected areas',
    },
    {
      id: 'mitigate-backup',
      label: 'Activate backup system',
      detail: 'Switch to redundant monitoring/access',
    },
    {
      id: 'mitigate-manual',
      label: 'Manual verification required',
      detail: 'Add human check to automated process',
    },
  ],
  TRANSFER: [
    {
      id: 'transfer-vendor',
      label: 'Escalate to vendor support',
      detail: 'Invoke vendor SLA for incident response',
    },
    {
      id: 'transfer-insurance',
      label: 'Notify insurance carrier',
      detail: 'Trigger cyber/liability coverage process',
    },
    {
      id: 'transfer-le',
      label: 'Involve law enforcement',
      detail: 'File report; transfer investigation authority',
    },
    {
      id: 'transfer-third',
      label: 'Engage third-party responder',
      detail: 'Bring in external IR team per contract',
    },
  ],
  AVOID: [
    {
      id: 'avoid-shutdown',
      label: 'Shut down affected system',
      detail: 'Take system offline to eliminate exposure',
    },
    {
      id: 'avoid-evacuate',
      label: 'Evacuate/secure area',
      detail: 'Remove personnel from affected zone',
    },
    {
      id: 'avoid-disconnect',
      label: 'Disconnect from network',
      detail: 'Sever all external connectivity',
    },
    {
      id: 'avoid-cancel',
      label: 'Cancel/postpone activity',
      detail: 'Delay planned operation until resolved',
    },
  ],
} as const;

// Micro-task challenge types
type MicroTaskType = 'MULTIPLE_CHOICE' | 'RANKING' | 'TRADEOFF' | 'SCENARIO';

interface MicroTaskChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: number;
  category: string;
  type: MicroTaskType;
  points: number;
  wrongPenalty: number;
  question: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctOrder?: string[];
  tradeoffOptions?: { id: string; text: string; consequence: string; points: number }[];
  scenarioOutcomes?: { choice: string; result: string; points: number }[];
  explanation?: string;
}

// ESRM Prep Micro-tasks with actual challenges requiring real effort
const ESRM_MICRO_TASKS: MicroTaskChallenge[] = [
  {
    id: 'asset-priority-mc',
    title: 'Asset Priority Check',
    description: 'Which asset class typically has highest business criticality?',
    icon: 'Target',
    duration: 15,
    category: 'ESRM',
    type: 'MULTIPLE_CHOICE',
    points: 25,
    wrongPenalty: -5,
    question:
      'During a vendor compromise affecting access control, which asset owner notification takes priority?',
    options: [
      { id: 'a', text: 'Marketing team workspace badge access', isCorrect: false },
      { id: 'b', text: 'Executive floor and data center perimeter', isCorrect: true },
      { id: 'c', text: 'Cafeteria turnstile systems', isCorrect: false },
      { id: 'd', text: 'Visitor lobby badge printers', isCorrect: false },
    ],
    explanation:
      'Executive and data center assets have highest criticality due to information sensitivity and physical security of crown jewels.',
  },
  {
    id: 'risk-rank-order',
    title: 'Threat Ranking',
    description: 'Order threats by likelihood × impact score',
    icon: 'AlertTriangle',
    duration: 20,
    category: 'ESRM',
    type: 'RANKING',
    points: 30,
    wrongPenalty: 0,
    question: 'Rank these threats from HIGHEST to LOWEST risk (likelihood × impact):',
    options: [
      { id: 'a', text: 'Active credential theft campaign (HIGH likelihood, HIGH impact)' },
      { id: 'b', text: 'Physical tailgating attempt (MEDIUM likelihood, LOW impact)' },
      { id: 'c', text: 'Insider data exfiltration (LOW likelihood, CRITICAL impact)' },
      { id: 'd', text: 'Social engineering call (HIGH likelihood, MEDIUM impact)' },
    ],
    correctOrder: ['a', 'd', 'c', 'b'],
    explanation:
      'Active credential theft is highest (H×H), social engineering next (H×M), insider threat (L×C) varies, tailgating lowest (M×L).',
  },
  {
    id: 'tradeoff-resources',
    title: 'Resource Tradeoff',
    description: 'Balance competing security priorities',
    icon: 'ClipboardList',
    duration: 18,
    category: 'ESRM',
    type: 'TRADEOFF',
    points: 35,
    wrongPenalty: -10,
    question:
      'You have ONE guard available. Two simultaneous alerts: suspicious person at loading dock, and executive requesting immediate escort. What do you do?',
    tradeoffOptions: [
      {
        id: 'a',
        text: 'Deploy to loading dock - physical threat takes priority',
        consequence: 'Executive complains but dock secured. Good situational awareness.',
        points: 35,
      },
      {
        id: 'b',
        text: 'Deploy to executive - VIP protection is paramount',
        consequence: 'Loading dock unsecured. Potential entry point compromised.',
        points: 15,
      },
      {
        id: 'c',
        text: 'Split time between both locations',
        consequence: 'Neither fully addressed. Guard effectiveness halved.',
        points: 0,
      },
      {
        id: 'd',
        text: 'Call for backup and hold both positions remotely via camera',
        consequence: 'Smart resource management. Both monitored while help arrives.',
        points: 30,
      },
    ],
    explanation:
      'Active physical threats generally take priority, but smart resource management (option D) shows tactical thinking.',
  },
  {
    id: 'scenario-escalation',
    title: 'Escalation Decision',
    description: 'Determine correct escalation path',
    icon: 'Layers',
    duration: 15,
    category: 'COMMUNICATION',
    type: 'SCENARIO',
    points: 25,
    wrongPenalty: -5,
    question:
      'Badge system shows 3 failed attempts from a terminated employee badge. What escalation level?',
    options: [
      { id: 'a', text: 'ACTIVITY - Log it, continue monitoring', isCorrect: false },
      { id: 'b', text: 'INCIDENT - Immediate supervisor notification', isCorrect: true },
      { id: 'c', text: 'INVESTIGATION - Full forensic response', isCorrect: false },
      { id: 'd', text: 'No escalation needed - badge is already disabled', isCorrect: false },
    ],
    explanation:
      'Terminated employee attempting access = INCIDENT level. The badge possession alone is a policy violation requiring supervisor notification.',
  },
  {
    id: 'channel-triage-mc',
    title: 'Intel Source Triage',
    description: 'Assign intel to correct domain',
    icon: 'Shuffle',
    duration: 12,
    category: 'TRIAGE',
    type: 'MULTIPLE_CHOICE',
    points: 20,
    wrongPenalty: -5,
    question:
      '"SIEM alert: Unusual VPN login from overseas for executive during known domestic travel." Which domain owns initial triage?',
    options: [
      { id: 'a', text: 'Physical Security - travel-related', isCorrect: false },
      { id: 'b', text: 'Cyber Security - VPN/identity anomaly', isCorrect: true },
      { id: 'c', text: 'Executive Protection - involves executive', isCorrect: false },
      { id: 'd', text: 'Intelligence - requires investigation', isCorrect: false },
    ],
    explanation:
      'SIEM VPN alerts are cyber domain. Physical/EP may be looped in, but cyber owns identity anomaly triage.',
  },
  {
    id: 'cop-accuracy',
    title: 'Fact vs Assumption',
    description: 'Identify which is verified vs unverified',
    icon: 'Eye',
    duration: 12,
    category: 'AWARENESS',
    type: 'MULTIPLE_CHOICE',
    points: 20,
    wrongPenalty: -5,
    question: 'Which statement is a FACT (not an assumption)?',
    options: [
      { id: 'a', text: 'The attacker is likely nation-state sponsored', isCorrect: false },
      { id: 'b', text: 'Badge system logs show 47 denials in the last hour', isCorrect: true },
      { id: 'c', text: 'The breach probably started with phishing', isCorrect: false },
      { id: 'd', text: 'Most employees are unaware of the incident', isCorrect: false },
    ],
    explanation:
      'System logs with specific numbers are verifiable facts. The others use "likely," "probably," or assume employee awareness.',
  },
  {
    id: 'stakeholder-notify',
    title: 'Notification Priority',
    description: 'Who needs to know first?',
    icon: 'Users',
    duration: 15,
    category: 'COMMUNICATION',
    type: 'RANKING',
    points: 30,
    wrongPenalty: 0,
    question: 'Access control vendor confirmed breach. Rank stakeholder notification order:',
    options: [
      { id: 'a', text: 'Legal/Privacy - potential data exposure' },
      { id: 'b', text: 'CISO - security leadership' },
      { id: 'c', text: 'Affected asset owners - their systems at risk' },
      { id: 'd', text: 'PR/Communications - potential media inquiry' },
    ],
    correctOrder: ['b', 'c', 'a', 'd'],
    explanation:
      'CISO first (security leadership), then asset owners (direct impact), Legal (compliance), PR last (no public exposure yet).',
  },
  {
    id: 'treatment-choice',
    title: 'Treatment Selection',
    description: 'Choose appropriate risk treatment',
    icon: 'ShieldAlert',
    duration: 15,
    category: 'ESRM',
    type: 'MULTIPLE_CHOICE',
    points: 25,
    wrongPenalty: -5,
    question:
      'Video analytics flagged a "suspicious package" that security confirmed is a forgotten lunch bag. Correct treatment?',
    options: [
      { id: 'a', text: 'AVOID - evacuate the area', isCorrect: false },
      { id: 'b', text: 'MITIGATE - post a guard nearby', isCorrect: false },
      { id: 'c', text: 'ACCEPT - log and continue monitoring', isCorrect: true },
      { id: 'd', text: 'TRANSFER - call local authorities', isCorrect: false },
    ],
    explanation:
      'Confirmed false positive = ACCEPT risk. Document for analytics tuning, no further action needed.',
  },
  {
    id: 'threat-secondary',
    title: 'Secondary Threat ID',
    description: 'Identify cascading risk',
    icon: 'Radar',
    duration: 18,
    category: 'INTELLIGENCE',
    type: 'TRADEOFF',
    points: 30,
    wrongPenalty: -10,
    question:
      'Access control vendor is compromised. What secondary threat should you monitor for FIRST?',
    tradeoffOptions: [
      {
        id: 'a',
        text: 'Social engineering calls impersonating the vendor',
        consequence: 'Good thinking, but not the most immediate risk.',
        points: 20,
      },
      {
        id: 'b',
        text: 'Physical intrusion attempts using cloned credentials',
        consequence: 'Correct! Compromised ACS = credential exposure is immediate.',
        points: 30,
      },
      {
        id: 'c',
        text: 'Ransomware deployment through vendor connection',
        consequence: 'Valid concern but ACS typically air-gapped from IT.',
        points: 15,
      },
      {
        id: 'd',
        text: 'Media inquiry about the vendor breach',
        consequence: 'Reputation risk is real but not a security threat.',
        points: 5,
      },
    ],
    explanation:
      'ACS compromise = credential data exposure. Physical intrusion using cloned/stolen credentials is the most direct secondary threat.',
  },
  {
    id: 'control-effectiveness',
    title: 'Control Gap Analysis',
    description: 'Identify which control is bypassed',
    icon: 'ShieldAlert',
    duration: 15,
    category: 'ESRM',
    type: 'MULTIPLE_CHOICE',
    points: 25,
    wrongPenalty: -5,
    question:
      'Vendor has read access to badge holder photos and names. Which control is MOST compromised?',
    options: [
      { id: 'a', text: 'Perimeter access control', isCorrect: false },
      { id: 'b', text: 'Identity verification at entry points', isCorrect: true },
      { id: 'c', text: 'Video surveillance coverage', isCorrect: false },
      { id: 'd', text: 'Visitor management process', isCorrect: false },
    ],
    explanation:
      'Photo + name exposure enables impersonation at manned entry points where guards verify identity visually.',
  },
  {
    id: 'time-pressure',
    title: 'Urgency Assessment',
    description: 'Prioritize under time pressure',
    icon: 'Clock',
    duration: 12,
    category: 'TRIAGE',
    type: 'SCENARIO',
    points: 25,
    wrongPenalty: -5,
    question: 'You have 3 pending items. Bridge call in 5 minutes. Which do you address NOW?',
    options: [
      { id: 'a', text: 'Update the COP with latest facts for the bridge', isCorrect: true },
      { id: 'b', text: 'Draft the after-action report outline', isCorrect: false },
      { id: 'c', text: "Review yesterday's incident logs", isCorrect: false },
      { id: 'd', text: 'Organize your notes from earlier', isCorrect: false },
    ],
    explanation:
      'Bridge call preparation (current COP status) is time-critical. AAR and historical review can wait.',
  },
  {
    id: 'posture-recommend',
    title: 'Posture Recommendation',
    description: 'Advise on operational posture',
    icon: 'Activity',
    duration: 15,
    category: 'ESRM',
    type: 'SCENARIO',
    points: 30,
    wrongPenalty: -10,
    question:
      'Vendor confirms breach contained, no evidence of data access, patch deployed. Asset owner asks your recommendation. What posture?',
    options: [
      { id: 'a', text: 'PAUSE - stay locked down until full audit', isCorrect: false },
      { id: 'b', text: 'DEGRADE - controlled restoration with monitoring', isCorrect: true },
      { id: 'c', text: 'CONTINUE - breach contained, resume normal ops', isCorrect: false },
      { id: 'd', text: 'Defer to vendor recommendation only', isCorrect: false },
    ],
    explanation:
      'DEGRADE allows controlled restoration while maintaining heightened monitoring. Full PAUSE is excessive post-containment, full CONTINUE is premature.',
  },
];

// Decision prompt variations to reduce repetition
const DECISION_PROMPT_VARIATIONS = [
  { header: 'Decision Required', subtext: 'Assess and commit to a posture' },
  { header: 'Posture Call Needed', subtext: "What's your recommendation?" },
  { header: 'Treatment Decision', subtext: 'Select risk response strategy' },
  { header: 'Action Required', subtext: 'Time-sensitive posture decision' },
  { header: 'Commander Decision', subtext: "Your call—what's the posture?" },
  { header: 'Risk Treatment', subtext: 'Recommend action to asset owner' },
];

// Custom hook for sound effects
function useSoundEffects(
  enabled: boolean,
  reducedMotion: boolean
): { playSound: (soundType: keyof typeof SOUND_EFFECTS) => void } {
  useEffect(() => {
    initAudio();
    loadAudioConfig();
  }, []);

  useEffect(() => {
    saveAudioConfig({ enabled });
  }, [enabled]);

  const playSound = useCallback(
    (soundType: keyof typeof SOUND_EFFECTS): void => {
      if (!enabled || reducedMotion) return;

      const sfxMap: Record<string, Parameters<typeof playSFX>[0]> = {
        injectArrive: 'injectArrive',
        decisionConfirm: 'correctDecision',
        escalation: 'warning',
        error: 'error',
        tick: 'timerTick',
        microTaskComplete: 'microTask',
      };

      const sfxType = sfxMap[soundType];
      if (sfxType) {
        playSFX(sfxType);
      }
    },
    [enabled, reducedMotion]
  );

  return { playSound };
}

// Custom hook for haptic feedback
function useHaptics(reducedMotion: boolean): {
  tapFeedback: () => void;
  confirmFeedback: () => void;
  errorFeedback: () => void;
  urgentFeedback: () => void;
} {
  const vibrate = useCallback(
    (pattern: number | number[]): void => {
      if (reducedMotion) return;

      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(pattern);
        }
      } catch {
        // Silently fail if vibration not supported
      }
    },
    [reducedMotion]
  );

  const tapFeedback = useCallback((): void => vibrate(10), [vibrate]);
  const confirmFeedback = useCallback((): void => vibrate([15, 50, 15]), [vibrate]);
  const errorFeedback = useCallback((): void => vibrate([30, 100, 30, 100, 30]), [vibrate]);
  const urgentFeedback = useCallback((): void => vibrate([50, 100, 50]), [vibrate]);

  return { tapFeedback, confirmFeedback, errorFeedback, urgentFeedback };
}

// Custom hook for ambient music - pleasant procedural loop, not a drone hum
function useAmbientMusic(
  enabled: boolean,
  reducedMotion: boolean
): {
  startMusic: () => void;
  stopMusic: () => void;
  isPlaying: boolean;
} {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopMusic = useCallback(() => {
    if (!audioContextRef.current || !isPlayingRef.current) return;

    try {
      const now = audioContextRef.current.currentTime;
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.5);
      }

      setTimeout(() => {
        oscillatorsRef.current.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            /* Oscillator already stopped */
          }
        });
        if (lfoRef.current) {
          try {
            lfoRef.current.stop();
            lfoRef.current.disconnect();
          } catch {
            /* LFO already stopped */
          }
        }
        oscillatorsRef.current = [];
        lfoRef.current = null;
        isPlayingRef.current = false;
        setIsPlaying(false);
      }, 600);
    } catch {
      /* Audio context error */
    }
  }, []);

  const startMusic = useCallback(() => {
    if (reducedMotion || isPlayingRef.current) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      filter.connect(masterGain);
      filterRef.current = filter;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      lfoRef.current = lfo;

      const chordNotes = [
        { freq: 130.81, type: 'sine' as OscillatorType },
        { freq: 164.81, type: 'sine' as OscillatorType },
        { freq: 196.0, type: 'triangle' as OscillatorType },
        { freq: 261.63, type: 'sine' as OscillatorType },
      ];

      const oscs: OscillatorNode[] = [];
      chordNotes.forEach(({ freq, type }, i) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;

        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.04 - i * 0.008;

        const detune = ctx.createOscillator();
        detune.type = 'sine';
        detune.frequency.value = 0.1 + i * 0.02;
        const detuneGain = ctx.createGain();
        detuneGain.gain.value = 3;
        detune.connect(detuneGain);
        detuneGain.connect(osc.detune);
        detune.start();

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscs.push(osc, detune);
      });

      oscillatorsRef.current = oscs;

      masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);

      isPlayingRef.current = true;
      setIsPlaying(true);
    } catch {
      /* Audio not supported */
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled && isPlayingRef.current) {
      stopMusic();
    }
  }, [enabled, stopMusic]);

  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic]);

  return { startMusic, stopMusic, isPlaying };
}

// Session state interface for persistence
interface SessionState {
  log: DecisionLog;
  elapsedSeconds: number;
  gameState: GameState;
  scenarioId: string;
  savedAt: number;
  isComplete: boolean;
}
import {
  recordDecision,
  calculateStats,
  revealInject,
  getRevealedInjects,
  postureToTreatment,
  INTAKE_CHANNELS,
  calculateESRMValueCreated,
  createKRIDashboard,
  createPipelineHealth,
  PIPELINE_STAGE_CONFIG,
  createInitialRoster,
  createDefaultStakeholderMap,
  createInitialTacticalState,
  deployTacticalAction,
  getAvailableActions,
  TACTICAL_ACTIONS,
  TACTICAL_CATEGORY_CONFIG,
  calculateDecisionValue,
  postureToTreatmentCalc,
  VALUE_ASSUMPTIONS,
  scoreDecision,
  type DecisionScoringInput,
  type DecisionScoringResult,
  type ProtectedAsset,
  type ScenarioESRMConfig,
  type LinkedEntity,
  type EntityType,
  type IntakeMetadata,
  type IntakeChannel,
  type ESRMValueCreated,
  type KRIDashboard,
  type KRIMeasurement,
  type PipelineHealth,
  type TrafficLightStatus,
  type TrendDirection,
  type TeamRosterState,
  type StakeholderMap,
  type TacticalState,
  type TacticalAction,
  type DeploymentFeedback,
  type CalcTrail,
  type AssetCriticality,
  type RiskLikelihood,
  type RiskImpact,
} from '@gsoc-decision-ops/core';
import type { DecisionLog, DecisionPosture, ScenarioInject } from '@gsoc-decision-ops/core';
import Link from 'next/link';
import { clsx } from 'clsx';
import { TeamPanel, StakeholderPanel } from './TeamStakeholderPanel';
import { completeScenario } from '../lib/campaign';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { playSFX, initAudio, loadAudioConfig, saveAudioConfig } from '../lib/audio';
import {
  loadFieldGuideConfig,
  saveSeenTip,
  hasSeenTip,
  areTipsEnabled,
  setTipsEnabled,
  getTip,
} from '../lib/field-guide';
import GuidancePopup, { useGuidance } from './GuidancePopup';
import type { GuidanceSurface } from '../lib/guidance';
import {
  ArcScheduler,
  createArcFromLog,
  parseSeedCode,
  type ArcDifficulty,
} from '@gsoc-decision-ops/core';

type SecurityDomain = 'PHYSICAL' | 'INTELLIGENCE' | 'CYBER';
type MobileTab = 'intel' | 'decision' | 'cop';

interface CommandCenterProps {
  initialLog: DecisionLog;
  esrmConfig?: ScenarioESRMConfig;
  scenarioId?: string;
}

interface MicroTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: number;
  category: string;
  type: MicroTaskType;
  points: number;
  wrongPenalty: number;
  question: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctOrder?: string[];
  tradeoffOptions?: { id: string; text: string; consequence: string; points: number }[];
  scenarioOutcomes?: { choice: string; result: string; points: number }[];
  explanation?: string;
}

interface GameState {
  score: number;
  streak: number;
  maxStreak: number;
  decisionsCorrect: number;
  decisionsTotal: number;
  injectsHandled: number;
  assetsProtected: number;
  assetOwnersBriefed: number;
  crossDomainBonus: number;
  timeBonus: number;
  esrmBonus: number;
  comboMultiplier: number;
}

const DOMAIN_CONFIG: Record<
  SecurityDomain,
  {
    icon: typeof Shield;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    gradient: string;
  }
> = {
  PHYSICAL: {
    icon: DoorOpen,
    label: 'Physical',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  INTELLIGENCE: {
    icon: Brain,
    label: 'Intel',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    gradient: 'from-violet-500 to-violet-600',
  },
  CYBER: {
    icon: Cpu,
    label: 'Cyber',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    gradient: 'from-orange-500 to-orange-600',
  },
};

const ENTITY_TYPE_CONFIG: Record<
  EntityType,
  {
    icon: typeof Users;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  PERSON: {
    icon: Users,
    label: 'Person',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  PLACE: {
    icon: DoorOpen,
    label: 'Location',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  ASSET: {
    icon: Briefcase,
    label: 'Asset',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  ORGANIZATION: {
    icon: Target,
    label: 'Org',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  SYSTEM: {
    icon: Cpu,
    label: 'System',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
};

const PLAYBOOK_PHASES = [
  { name: 'Assessment', duration: 10, icon: Target },
  { name: 'Bridge', duration: 10, icon: Phone },
  { name: 'Continuity', duration: 15, icon: Activity },
  { name: 'Information', duration: 15, icon: FileText },
  { name: 'Checkpoint', duration: 10, icon: CheckCircle },
];

const POSTURE_CONFIG: Record<
  DecisionPosture,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    gradient: string;
    treatment: string;
    riskAction: string;
  }
> = {
  CONTINUE: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    gradient: 'from-emerald-500 to-emerald-600',
    treatment: 'ACCEPT',
    riskAction: 'Risk accepted within tolerance',
  },
  DEGRADE: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    gradient: 'from-amber-500 to-amber-600',
    treatment: 'MITIGATE',
    riskAction: 'Apply compensating controls',
  },
  PAUSE: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/40',
    gradient: 'from-red-500 to-red-600',
    treatment: 'AVOID',
    riskAction: 'Eliminate risk exposure',
  },
};

export default function CommandCenter({
  initialLog,
  esrmConfig,
  scenarioId = 'unknown',
}: CommandCenterProps): JSX.Element {
  // Session recovery state
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedSession, setSavedSession] = useState<SessionState | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Core game state
  const [log, setLog] = useState<DecisionLog>(initialLog);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<ScenarioInject | null>(null);
  const [decisionTimer, setDecisionTimer] = useState(0);
  const [showScorePopup, setShowScorePopup] = useState<{ points: number; message: string } | null>(
    null
  );
  const [screenFlash, setScreenFlash] = useState<'red' | 'amber' | 'green' | null>(null);
  const [urgentPulse, setUrgentPulse] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ProtectedAsset | null>(null);
  const [assetOwnerBriefed, setAssetOwnerBriefed] = useState(false);
  const [residualRiskNote, setResidualRiskNote] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    maxStreak: 0,
    decisionsCorrect: 0,
    decisionsTotal: 0,
    injectsHandled: 0,
    assetsProtected: 0,
    assetOwnersBriefed: 0,
    crossDomainBonus: 0,
    timeBonus: 0,
    esrmBonus: 0,
    comboMultiplier: 1,
  });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lastInjectTime, setLastInjectTime] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('intel');
  const [showFieldGuide, setShowFieldGuide] = useState(false);
  const [showCoachMarks, setShowCoachMarks] = useState(true);
  const [activeFieldGuideTip, setActiveFieldGuideTip] = useState<string | null>(null);
  const [fieldGuideTipsEnabled, setFieldGuideTipsEnabled] = useState(true);
  const [escalationLevel, setEscalationLevel] = useState<'ACTIVITY' | 'INCIDENT' | 'INVESTIGATION'>(
    'ACTIVITY'
  );

  // Micro-task state for filling wait gaps
  const [activeMicroTask, setActiveMicroTask] = useState<MicroTask | null>(null);
  const [microTaskTimer, setMicroTaskTimer] = useState(0);
  const [completedMicroTasks, setCompletedMicroTasks] = useState<string[]>([]);
  const [lastActivityTime, setLastActivityTime] = useState(0);
  const [microTaskAnimating, setMicroTaskAnimating] = useState(false);
  const [microTaskAnswer, setMicroTaskAnswer] = useState<string | string[] | null>(null);
  const [microTaskResult, setMicroTaskResult] = useState<
    'pending' | 'correct' | 'wrong' | 'partial' | null
  >(null);
  const [microTaskExplanationShown, setMicroTaskExplanationShown] = useState(false);

  // Skipped micro-tasks (can return later, separate from completed)
  const [skippedMicroTasks, setSkippedMicroTasks] = useState<{ id: string; skippedAt: number }[]>(
    []
  );

  // Arc scheduler for coherent randomized gameplay
  const arcSchedulerRef = useRef<ArcScheduler | null>(null);

  // Light-touch guidance system
  const { triggerFirstVisit, triggerCondition, isEnabled: guidanceEnabled } = useGuidance();

  // Ambient music state (default OFF, persisted)
  const [ambientMusicEnabled, setAmbientMusicEnabled] = useState(false);
  const [ambientMusicUnlocked, setAmbientMusicUnlocked] = useState(false);

  // Difficulty and personal best tracking
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(() => getSavedDifficulty());
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
  const [personalBest, setPersonalBest] = useState<PersonalBest | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const difficultyConfig = DIFFICULTY_CONFIGS[difficulty];

  // Load personal best on mount
  useEffect(() => {
    const bests = getPersonalBests();
    if (bests[scenarioId]) {
      setPersonalBest(bests[scenarioId]);
    }
  }, [scenarioId]);

  // Update coach marks based on difficulty
  useEffect(() => {
    setShowCoachMarks(difficultyConfig.showCoachMarks);
  }, [difficultyConfig.showCoachMarks]);

  // Structured risk treatment selection
  const [selectedTreatmentCategory, setSelectedTreatmentCategory] = useState<
    'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID' | null
  >(null);
  const [selectedTreatmentOption, setSelectedTreatmentOption] = useState<string | null>(null);
  const [selectedResidualRisk, setSelectedResidualRisk] = useState<string | null>(null);
  const [treatmentBonusGiven, setTreatmentBonusGiven] = useState(false);

  // Initialize field guide config on mount
  useEffect(() => {
    loadFieldGuideConfig();
  }, []);

  // Handler for treatment category selection with bonus time
  const handleTreatmentCategorySelect = useCallback(
    (category: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID' | null) => {
      setSelectedTreatmentCategory(category);
      if (category && !treatmentBonusGiven && pendingDecision) {
        setDecisionTimer((t) =>
          Math.min(t + DECISION_TIMER_CONFIG.TREATMENT_STEP_BONUS, DECISION_TIMER_CONFIG.BASE_TIMER)
        );
        setTreatmentBonusGiven(true);
      }
      // Trigger JIT field guide tip for treatment category
      if (category && fieldGuideTipsEnabled && !hasSeenTip(category)) {
        setActiveFieldGuideTip(category);
      }
    },
    [treatmentBonusGiven, pendingDecision, fieldGuideTipsEnabled]
  );

  // Mobile menu button ref for portal positioning
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [mobileMenuPosition, setMobileMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // Animation tracking
  const [tabAnimating, setTabAnimating] = useState(false);

  // Decision variety tracking
  const [decisionPromptIndex, setDecisionPromptIndex] = useState(0);

  const [dispatchResources, setDispatchResources] = useState<{
    guards: {
      available: number;
      total: number;
      cooldown: number;
      contentionLevel: 'NORMAL' | 'STRAINED' | 'CRITICAL';
    };
    analysts: {
      available: number;
      total: number;
      cooldown: number;
      contentionLevel: 'NORMAL' | 'STRAINED' | 'CRITICAL';
    };
    responders: {
      available: number;
      total: number;
      cooldown: number;
      contentionLevel: 'NORMAL' | 'STRAINED' | 'CRITICAL';
    };
  }>({
    guards: { available: 3, total: 4, cooldown: 0, contentionLevel: 'NORMAL' },
    analysts: { available: 2, total: 3, cooldown: 0, contentionLevel: 'NORMAL' },
    responders: { available: 2, total: 2, cooldown: 0, contentionLevel: 'NORMAL' },
  });
  const [currentPlaybookPhase, setCurrentPlaybookPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState<Record<number, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null);
  const [showEntityPanel, setShowEntityPanel] = useState(false);
  const [triageQueue, setTriageQueue] = useState<string[]>([]);
  const [resourceContention, setResourceContention] = useState<string | null>(null);
  const [esrmCascadeActive, setEsrmCascadeActive] = useState(false);
  const [cascadeMultiplier, setCascadeMultiplier] = useState(1);
  const [showValuePanel, setShowValuePanel] = useState(false);
  const [showKRIPanel, setShowKRIPanel] = useState(false);
  const [showPipelinePanel, setShowPipelinePanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [valueMetrics, setValueMetrics] = useState<ESRMValueCreated | null>(null);
  const [calcTrails, setCalcTrails] = useState<CalcTrail[]>([]);
  const [kriDashboard, setKRIDashboard] = useState<KRIDashboard | null>(null);
  const [pipelineHealth, setPipelineHealth] = useState<PipelineHealth | null>(null);

  // Consequence Theatre State - tracks animated feedback for decisions
  const [consequenceAnimation, setConsequenceAnimation] = useState<{
    active: boolean;
    type: 'positive' | 'negative' | 'neutral';
    kriChanges: { id: string; delta: number; newStatus: 'GREEN' | 'AMBER' | 'RED' }[];
    trustChange: number;
    valueChange: number;
    residualChange: number;
  } | null>(null);
  const [stakeholderTrust, setStakeholderTrust] = useState(75); // 0-100 trust score
  const [overallResidualRisk, setOverallResidualRisk] = useState<
    'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  >('MEDIUM');
  const [zoneHeatLevels, setZoneHeatLevels] = useState<Record<string, number>>({
    executive: 30,
    operations: 40,
    perimeter: 25,
    cyber: 35,
  });
  const [teamRoster, setTeamRoster] = useState<TeamRosterState | null>(null);
  const [stakeholderMap, setStakeholderMap] = useState<StakeholderMap | null>(null);
  const [showLeadershipPanel, setShowLeadershipPanel] = useState(false);
  const [leadershipTab, setLeadershipTab] = useState<'team' | 'stakeholders'>('team');

  // Tactical actions state
  const [tacticalState, setTacticalState] = useState<TacticalState>(createInitialTacticalState());
  const [showTacticalPanel, setShowTacticalPanel] = useState(false);
  const [lastDeploymentFeedback, setLastDeploymentFeedback] = useState<DeploymentFeedback | null>(
    null
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const decisionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const microTaskTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedInjectsRef = useRef<Set<string>>(new Set());
  const sessionSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Sound and haptic hooks
  const { playSound } = useSoundEffects(soundEnabled, reducedMotion);
  const { tapFeedback, confirmFeedback, errorFeedback, urgentFeedback } = useHaptics(reducedMotion);
  const {
    startMusic,
    stopMusic,
    isPlaying: isMusicPlaying,
  } = useAmbientMusic(ambientMusicEnabled, reducedMotion);

  // Load ambient music preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AMBIENT_MUSIC_KEY);
      if (saved === 'true') {
        setAmbientMusicEnabled(true);
      }
    } catch {
      /* localStorage not available */
    }
  }, []);

  // Persist ambient music preference
  useEffect(() => {
    try {
      localStorage.setItem(AMBIENT_MUSIC_KEY, ambientMusicEnabled ? 'true' : 'false');
    } catch {
      /* localStorage not available */
    }
  }, [ambientMusicEnabled]);

  // Handle ambient music toggle - requires user gesture to unlock
  const handleAmbientMusicToggle = useCallback(() => {
    if (!ambientMusicUnlocked) {
      setAmbientMusicUnlocked(true);
      setAmbientMusicEnabled(true);
      startMusic();
    } else if (ambientMusicEnabled) {
      setAmbientMusicEnabled(false);
      stopMusic();
    } else {
      setAmbientMusicEnabled(true);
      startMusic();
    }
  }, [ambientMusicEnabled, ambientMusicUnlocked, startMusic, stopMusic]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent): void => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!showMobileMenu) return;
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      if (!target.closest('[aria-label="More options"]') && !target.closest('[role="menu"]')) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMobileMenu]);

  // Check for saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const session: SessionState = JSON.parse(saved);
        // Only offer resume if session is for same scenario and not complete
        if (session.scenarioId === scenarioId && !session.isComplete) {
          const ageMinutes = (Date.now() - session.savedAt) / 1000 / 60;
          // Only offer resume if session is less than 2 hours old
          if (ageMinutes < 120) {
            setSavedSession(session);
            setShowResumePrompt(true);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [scenarioId]);

  // Auto-save session periodically when running
  useEffect(() => {
    if (!isRunning) return;

    const saveSession = (): void => {
      try {
        const session: SessionState = {
          log,
          elapsedSeconds,
          gameState,
          scenarioId,
          savedAt: Date.now(),
          isComplete: showDebrief,
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch {
        // Ignore localStorage errors
      }
    };

    // Save immediately and then every 10 seconds
    saveSession();
    sessionSaveRef.current = setInterval(saveSession, 10000);

    return () => {
      if (sessionSaveRef.current) {
        clearInterval(sessionSaveRef.current);
      }
    };
  }, [isRunning, log, elapsedSeconds, gameState, scenarioId, showDebrief]);

  // Clear session on completion
  useEffect(() => {
    if (showDebrief) {
      try {
        const session: SessionState = {
          log,
          elapsedSeconds,
          gameState,
          scenarioId,
          savedAt: Date.now(),
          isComplete: true,
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch {
        // Ignore
      }
    }
  }, [showDebrief, log, elapsedSeconds, gameState, scenarioId]);

  // Resume session handler
  const handleResumeSession = useCallback(() => {
    if (savedSession) {
      setLog(savedSession.log);
      setElapsedSeconds(savedSession.elapsedSeconds);
      setGameState(savedSession.gameState);
      // Rebuild processed injects set
      savedSession.log.decisions.forEach((d) => {
        const inject = savedSession.log.injects.find((i) => i.title === d.title);
        if (inject) {
          processedInjectsRef.current.add(inject.id);
        }
      });
      setShowResumePrompt(false);
      setSavedSession(null);
    }
  }, [savedSession]);

  // Start fresh handler
  const handleStartFresh = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setShowResumePrompt(false);
    setSavedSession(null);
  }, []);

  // Exit confirmation handler
  const handleExitClick = useCallback(() => {
    if (isRunning || elapsedSeconds > 0) {
      setShowExitConfirm(true);
    } else {
      const basePath = getBasePath();
      window.location.href = basePath ? `${basePath}/` : '/';
    }
  }, [isRunning, elapsedSeconds]);

  const handleConfirmExit = useCallback(() => {
    // Session is auto-saved, navigate home with basePath
    const basePath = getBasePath();
    window.location.href = basePath ? `${basePath}/` : '/';
  }, []);

  // Start game with arc scheduler initialization
  const handleStartGame = useCallback(
    (customSeed?: string) => {
      // Initialize arc scheduler with seed for coherent randomized gameplay
      const seed = customSeed ? parseSeedCode(customSeed) : undefined;
      const arcDifficulty = difficulty as ArcDifficulty;
      const scheduler = createArcFromLog(initialLog, seed, arcDifficulty);

      arcSchedulerRef.current = scheduler;
      setIsRunning(true);

      // Trigger first-visit guidance for main surfaces
      setTimeout(() => {
        triggerFirstVisit('INTEL_FEED');
      }, 2000);
    },
    [difficulty, initialLog, triggerFirstVisit]
  );

  // Tab change with animation and guidance triggers
  const handleTabChange = useCallback(
    (newTab: MobileTab) => {
      if (newTab === mobileTab || tabAnimating) return;
      tapFeedback();
      setTabAnimating(true);
      setTimeout(() => {
        setMobileTab(newTab);
        setTabAnimating(false);

        // Trigger first-visit guidance for the new tab
        if (newTab === 'intel') triggerFirstVisit('INTEL_FEED');
        else if (newTab === 'decision') triggerFirstVisit('DECISION_POSTURE');
        else if (newTab === 'cop') triggerFirstVisit('COP_LAYERS');
      }, 150);
    },
    [mobileTab, tabAnimating, tapFeedback, triggerFirstVisit]
  );

  // Initialize leadership roster and stakeholder map
  useEffect(() => {
    setTeamRoster(createInitialRoster());
    setStakeholderMap(createDefaultStakeholderMap(log.id));
  }, [log.id]);

  // Progressive disclosure - show leadership panel after 2 decisions
  useEffect(() => {
    if (log.decisions.length >= 2 && !showLeadershipPanel) {
      setShowLeadershipPanel(true);
    }
  }, [log.decisions.length, showLeadershipPanel]);

  // Main game timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => {
          const newSeconds = s + 1;
          if (newSeconds >= 3600) {
            setIsRunning(false);
            setShowDebrief(true);

            // Mark campaign arc as complete and unlock next arcs
            completeScenario(scenarioId);

            // Check and save personal best
            const accuracy =
              gameState.decisionsTotal > 0
                ? Math.round((gameState.decisionsCorrect / gameState.decisionsTotal) * 100)
                : 0;
            const currentBest: PersonalBest = {
              score: gameState.score,
              grade: calculateGrade().grade,
              accuracy,
              maxStreak: gameState.maxStreak,
              difficulty,
              timestamp: Date.now(),
            };
            if (!personalBest || gameState.score > personalBest.score) {
              setIsNewPersonalBest(true);
              savePersonalBest(scenarioId, currentBest);
              setPersonalBest(currentBest);
            }
          }
          return newSeconds;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, gameState, personalBest, difficulty, scenarioId]);

  // Decision pressure timer - adaptive based on complexity and difficulty
  useEffect(() => {
    if (pendingDecision && isRunning) {
      const adjustedTimer = Math.floor(
        DECISION_TIMER_CONFIG.BASE_TIMER * difficultyConfig.timerMultiplier
      );
      setDecisionTimer(adjustedTimer);
      decisionTimerRef.current = setInterval(() => {
        setDecisionTimer((t) => {
          if (t <= 1) {
            setUrgentPulse(true);
            setTimeout(() => setUrgentPulse(false), 500);
          }
          // Play urgent timer SFX when time is low
          if (t <= 10 && t > 0) {
            playSFX('timerUrgent');
          }
          if (t <= 0) {
            playSFX('error');
            handleTimeoutDecision();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (decisionTimerRef.current) {
      clearInterval(decisionTimerRef.current);
    }
    return () => {
      if (decisionTimerRef.current) clearInterval(decisionTimerRef.current);
    };
  }, [pendingDecision, isRunning]);

  // Auto-reveal injects based on time - creates compulsion loop
  useEffect(() => {
    if (!isRunning) return;

    const currentMinute = Math.floor(elapsedSeconds / 60);
    const allInjects = log.injects;

    for (const inject of allInjects) {
      if (
        !inject.revealed &&
        inject.revealAtMinute <= currentMinute &&
        !processedInjectsRef.current.has(inject.id)
      ) {
        processedInjectsRef.current.add(inject.id);
        setLog(revealInject(log, inject.id));
        setLastInjectTime(elapsedSeconds);

        // Play inject arrival SFX
        playSFX('injectArrive');

        triggerInjectAlert(inject);

        if (!pendingDecision) {
          setPendingDecision(inject);
          setSelectedAsset(null);
          setAssetOwnerBriefed(false);
          setResidualRiskNote('');
          setSelectedTreatmentCategory(null);
          setSelectedTreatmentOption(null);
          setSelectedResidualRisk(null);
          setTreatmentBonusGiven(false);
        }
        break;
      }
    }
  }, [elapsedSeconds, isRunning, log, pendingDecision]);

  // Urgency pulse when no action for too long
  useEffect(() => {
    if (isRunning && elapsedSeconds - lastInjectTime > 30 && !pendingDecision) {
      const revealedInjects = getRevealedInjects(log);
      const unhandled = revealedInjects.filter(
        (i) => !log.decisions.some((d) => d.title === i.title)
      );
      if (unhandled.length > 0) {
        setUrgentPulse(true);
        urgentFeedback();
        setTimeout(() => setUrgentPulse(false), 1000);
      }
    }
  }, [elapsedSeconds, isRunning, lastInjectTime, log, pendingDecision, urgentFeedback]);

  // Check if a skipped task can return (45 second cooldown)
  const canSkippedTaskReturn = useCallback(
    (taskId: string): boolean => {
      const skipped = skippedMicroTasks.find((s) => s.id === taskId);
      if (!skipped) return true;
      return elapsedSeconds - skipped.skippedAt >= 45;
    },
    [skippedMicroTasks, elapsedSeconds]
  );

  // Micro-task system for filling wait gaps (no dead air > 20s)
  useEffect(() => {
    if (!isRunning || pendingDecision || activeMicroTask) return;

    const timeSinceActivity = elapsedSeconds - lastActivityTime;

    // If more than 20 seconds of inactivity, spawn a micro-task
    if (timeSinceActivity > 20) {
      // Exclude completed tasks, but allow skipped tasks to return after cooldown
      const availableTasks = ESRM_MICRO_TASKS.filter(
        (t) => !completedMicroTasks.includes(t.id) && canSkippedTaskReturn(t.id)
      );
      if (availableTasks.length > 0) {
        const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
        setActiveMicroTask(randomTask);
        setMicroTaskTimer(randomTask.duration);
        setMicroTaskAnimating(true);
        setMicroTaskAnswer(null);
        setMicroTaskResult(null);
        setMicroTaskExplanationShown(false);
        setTimeout(() => setMicroTaskAnimating(false), 500);
        playSound('tick');
      }
    }
  }, [
    elapsedSeconds,
    isRunning,
    pendingDecision,
    activeMicroTask,
    lastActivityTime,
    completedMicroTasks,
    canSkippedTaskReturn,
    playSound,
  ]);

  // Micro-task timer countdown
  useEffect(() => {
    if (!activeMicroTask || !isRunning) return;

    microTaskTimerRef.current = setInterval(() => {
      setMicroTaskTimer((t) => {
        if (t <= 1) {
          // Time expired, task failed
          setActiveMicroTask(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (microTaskTimerRef.current) {
        clearInterval(microTaskTimerRef.current);
      }
    };
  }, [activeMicroTask, isRunning]);

  // Submit micro-task answer
  const submitMicroTaskAnswer = useCallback(
    (answer: string | string[]) => {
      if (!activeMicroTask || microTaskResult) return;

      let points = 0;
      let result: 'correct' | 'wrong' | 'partial' = 'wrong';

      if (activeMicroTask.type === 'MULTIPLE_CHOICE' || activeMicroTask.type === 'SCENARIO') {
        const correctOption = activeMicroTask.options?.find((o) => o.isCorrect);
        if (correctOption && answer === correctOption.id) {
          points = activeMicroTask.points;
          result = 'correct';
        } else {
          points = activeMicroTask.wrongPenalty;
          result = 'wrong';
        }
      } else if (activeMicroTask.type === 'RANKING') {
        const answerArr = answer as string[];
        const correctOrder = activeMicroTask.correctOrder || [];
        let correctCount = 0;
        for (let i = 0; i < Math.min(answerArr.length, correctOrder.length); i++) {
          if (answerArr[i] === correctOrder[i]) correctCount++;
        }
        if (correctCount === correctOrder.length) {
          points = activeMicroTask.points;
          result = 'correct';
        } else if (correctCount > 0) {
          points = Math.floor((activeMicroTask.points * correctCount) / correctOrder.length);
          result = 'partial';
        } else {
          points = activeMicroTask.wrongPenalty;
          result = 'wrong';
        }
      } else if (activeMicroTask.type === 'TRADEOFF') {
        const selectedOption = activeMicroTask.tradeoffOptions?.find((o) => o.id === answer);
        if (selectedOption) {
          points = selectedOption.points;
          result =
            selectedOption.points === activeMicroTask.points
              ? 'correct'
              : selectedOption.points > 0
                ? 'partial'
                : 'wrong';
        }
      }

      setMicroTaskAnswer(answer);
      setMicroTaskResult(result);
      setMicroTaskExplanationShown(true);

      if (points !== 0) {
        setGameState((prev) => ({
          ...prev,
          score: Math.max(0, prev.score + points),
          esrmBonus: prev.esrmBonus + Math.max(0, points),
        }));
      }

      if (result === 'correct') {
        setShowScorePopup({ points, message: 'Correct!' });
        playSound('microTaskComplete');
        confirmFeedback();
      } else if (result === 'partial') {
        setShowScorePopup({ points, message: 'Partial Credit' });
        playSound('tick');
        tapFeedback();
      } else {
        setShowScorePopup({ points, message: points < 0 ? 'Wrong Answer' : 'Incorrect' });
        playSound('error');
        errorFeedback();
      }
      setTimeout(() => setShowScorePopup(null), 2000);
    },
    [activeMicroTask, microTaskResult, playSound, confirmFeedback, tapFeedback, errorFeedback]
  );

  // Dismiss micro-task after answer shown
  const dismissMicroTask = useCallback(() => {
    if (!activeMicroTask) return;
    setCompletedMicroTasks((prev) => [...prev, activeMicroTask.id]);
    setActiveMicroTask(null);
    setMicroTaskAnswer(null);
    setMicroTaskResult(null);
    setMicroTaskExplanationShown(false);
    setLastActivityTime(elapsedSeconds);
  }, [activeMicroTask, elapsedSeconds]);

  // Skip micro-task handler (0 points, but task can return after cooldown)
  const skipMicroTask = useCallback(() => {
    if (!activeMicroTask) return;
    // Add to skipped list with timestamp - NOT to completed, so it can return
    setSkippedMicroTasks((prev) => [
      ...prev,
      { id: activeMicroTask.id, skippedAt: elapsedSeconds },
    ]);
    setActiveMicroTask(null);
    setMicroTaskAnswer(null);
    setMicroTaskResult(null);
    setMicroTaskExplanationShown(false);
    setLastActivityTime(elapsedSeconds);
  }, [activeMicroTask, elapsedSeconds]);

  // Deploy tactical action handler
  const handleDeployTacticalAction = useCallback(
    (actionId: string) => {
      const resources = {
        guards: dispatchResources.guards.available,
        analysts: dispatchResources.analysts.available,
        responders: dispatchResources.responders.available,
      };

      const { newState, feedback } = deployTacticalAction(tacticalState, actionId, resources);
      setTacticalState(newState);
      setLastDeploymentFeedback(feedback);

      if (feedback.success) {
        const action = TACTICAL_ACTIONS.find((a) => a.id === actionId);

        // Update game score
        const netPoints = feedback.pointsAwarded - feedback.pointsPenalty;
        setGameState((prev) => ({
          ...prev,
          score: Math.max(0, prev.score + netPoints),
        }));

        // Show feedback popup
        if (netPoints > 0) {
          setShowScorePopup({
            points: netPoints,
            message: `${action?.shortName || 'Action'} Deployed`,
          });
          playSound('decisionConfirm');
          confirmFeedback();
        } else if (netPoints < 0) {
          setShowScorePopup({ points: netPoints, message: 'Action Backfired!' });
          playSound('error');
          errorFeedback();
        } else {
          playSound('tick');
          tapFeedback();
        }
        setTimeout(() => setShowScorePopup(null), 2500);

        // Update dispatch resources based on action cost
        if (action?.resourceCost) {
          setDispatchResources((prev) => ({
            ...prev,
            guards: {
              ...prev.guards,
              available: prev.guards.available - (action.resourceCost.guards || 0),
            },
            analysts: {
              ...prev.analysts,
              available: prev.analysts.available - (action.resourceCost.analysts || 0),
            },
            responders: {
              ...prev.responders,
              available: prev.responders.available - (action.resourceCost.responders || 0),
            },
          }));
        }

        // Flash screen based on effectiveness
        if (feedback.effectiveness === 'HIGH' || feedback.effectiveness === 'MEDIUM') {
          setScreenFlash('green');
        } else if (feedback.effectiveness === 'LOW' || feedback.effectiveness === 'NEGLIGIBLE') {
          setScreenFlash('amber');
        } else {
          setScreenFlash('red');
        }
        setTimeout(() => setScreenFlash(null), 300);

        setLastActivityTime(elapsedSeconds);
      } else {
        playSound('error');
        errorFeedback();
      }

      // Auto-dismiss feedback after 4 seconds
      setTimeout(() => setLastDeploymentFeedback(null), 4000);
    },
    [
      tacticalState,
      dispatchResources,
      playSound,
      confirmFeedback,
      tapFeedback,
      errorFeedback,
      elapsedSeconds,
    ]
  );

  // Update lastActivityTime on user actions
  useEffect(() => {
    if (pendingDecision || log.decisions.length > 0) {
      setLastActivityTime(elapsedSeconds);
    }
  }, [pendingDecision, log.decisions.length, elapsedSeconds]);

  // Escalation level based on game state - with cascade multiplier effects
  useEffect(() => {
    const revealed = getRevealedInjects(log);
    const urgentCount = revealed.filter(
      (i) => (i as unknown as { urgencyLevel?: string }).urgencyLevel === 'IMMEDIATE'
    ).length;
    const decisionsCount = log.decisions.length;

    let newLevel: 'ACTIVITY' | 'INCIDENT' | 'INVESTIGATION' = 'ACTIVITY';
    let newMultiplier = 1;

    if (urgentCount >= 3 || decisionsCount >= 5) {
      newLevel = 'INVESTIGATION';
      newMultiplier = 1.5;
    } else if (urgentCount >= 1 || decisionsCount >= 2) {
      newLevel = 'INCIDENT';
      newMultiplier = 1.25;
    }

    setEscalationLevel(newLevel);
    setCascadeMultiplier(newMultiplier);
  }, [log]);

  // Contextual guidance triggers based on game state
  useEffect(() => {
    if (!isRunning || !guidanceEnabled) return;

    // Trigger LOW_TRUST guidance when trust drops below 50
    if (stakeholderTrust < 50) {
      triggerCondition('LOW_TRUST', 'TEAM_STAKEHOLDERS');
    }

    // Trigger HIGH_HEAT guidance when any zone is above 70
    const highHeatZone = Object.entries(zoneHeatLevels).find(([, heat]) => heat > 70);
    if (highHeatZone) {
      triggerCondition('HIGH_HEAT', 'COP_LAYERS');
    }

    // Trigger RESOURCE_CONTENTION guidance
    if (
      dispatchResources.guards.contentionLevel === 'CRITICAL' ||
      dispatchResources.analysts.contentionLevel === 'CRITICAL' ||
      dispatchResources.responders.contentionLevel === 'CRITICAL'
    ) {
      triggerCondition('RESOURCE_CONTENTION', 'TACTICAL');
    }
  }, [isRunning, guidanceEnabled, stakeholderTrust, zoneHeatLevels, dispatchResources, triggerCondition]);

  // Trigger STREAK_LOST guidance when streak resets after being > 2
  const prevStreakRef = useRef(0);
  useEffect(() => {
    if (prevStreakRef.current >= 3 && gameState.streak === 0) {
      triggerCondition('STREAK_LOST', 'DECISION_POSTURE');
    }
    prevStreakRef.current = gameState.streak;
  }, [gameState.streak, triggerCondition]);

  // Playbook phase progression based on elapsed time
  useEffect(() => {
    if (!isRunning) return;

    const currentElapsedMinutes = Math.floor(elapsedSeconds / 60);
    const phaseMinutes = [10, 20, 35, 50, 60];
    const currentPhase = phaseMinutes.findIndex((m) => currentElapsedMinutes < m);
    const newPhase = currentPhase === -1 ? 4 : currentPhase;

    if (newPhase !== currentPlaybookPhase) {
      setCurrentPlaybookPhase(newPhase);
      if (newPhase > 0) {
        setScreenFlash('green');
        setTimeout(() => setScreenFlash(null), 300);
      }
    }

    // Calculate progress within current phase
    const phaseStarts = [0, 10, 20, 35, 50];
    const phaseEnds = [10, 20, 35, 50, 60];
    const phaseStart = phaseStarts[newPhase];
    const phaseEnd = phaseEnds[newPhase];
    const progress = Math.min(
      100,
      ((currentElapsedMinutes - phaseStart) / (phaseEnd - phaseStart)) * 100
    );
    setPhaseProgress((prev) => ({ ...prev, [newPhase]: progress }));
  }, [elapsedSeconds, isRunning, currentPlaybookPhase]);

  // Triage queue management - queue unhandled injects by priority
  useEffect(() => {
    const revealed = getRevealedInjects(log);
    const unhandled = revealed.filter((i) => !log.decisions.some((d) => d.title === i.title));
    const sorted = [...unhandled].sort((a, b) => {
      const priorityOrder = { IMMEDIATE: 0, URGENT: 1, ROUTINE: 2 };
      const aPriority = (a as unknown as { triagePriority?: string }).triagePriority || 'ROUTINE';
      const bPriority = (b as unknown as { triagePriority?: string }).triagePriority || 'ROUTINE';
      return (
        (priorityOrder[aPriority as keyof typeof priorityOrder] || 2) -
        (priorityOrder[bPriority as keyof typeof priorityOrder] || 2)
      );
    });
    setTriageQueue(sorted.map((i) => i.id));
  }, [log]);

  // Dispatch resource cooldown management with contention tracking
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setDispatchResources((prev) => {
        const updateResource = (r: typeof prev.guards): typeof prev.guards => {
          const newAvailable = r.cooldown <= 1 ? Math.min(r.available + 1, r.total) : r.available;
          const ratio = newAvailable / r.total;
          const contentionLevel =
            ratio <= 0.25
              ? ('CRITICAL' as const)
              : ratio <= 0.5
                ? ('STRAINED' as const)
                : ('NORMAL' as const);
          return {
            ...r,
            cooldown: Math.max(0, r.cooldown - 1),
            available: newAvailable,
            contentionLevel,
          };
        };
        return {
          guards: updateResource(prev.guards),
          analysts: updateResource(prev.analysts),
          responders: updateResource(prev.responders),
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Check resource availability for current inject
  const checkResourceAvailability = useCallback(
    (inject: ScenarioInject): { canProceed: boolean; warning: string | null } => {
      const required = (
        inject as unknown as {
          resourcesRequired?: { guards?: number; analysts?: number; responders?: number };
        }
      ).resourcesRequired;
      if (!required) return { canProceed: true, warning: null };

      const issues: string[] = [];
      if (required.guards && dispatchResources.guards.available < required.guards) {
        issues.push(`Guards (need ${required.guards}, have ${dispatchResources.guards.available})`);
      }
      if (required.analysts && dispatchResources.analysts.available < required.analysts) {
        issues.push(
          `Analysts (need ${required.analysts}, have ${dispatchResources.analysts.available})`
        );
      }
      if (required.responders && dispatchResources.responders.available < required.responders) {
        issues.push(
          `Responders (need ${required.responders}, have ${dispatchResources.responders.available})`
        );
      }

      if (issues.length > 0) {
        return { canProceed: false, warning: `Resource contention: ${issues.join(', ')}` };
      }
      return { canProceed: true, warning: null };
    },
    [dispatchResources]
  );

  // Deploy resources when making a decision
  const deployResources = useCallback((inject: ScenarioInject) => {
    const required = (
      inject as unknown as {
        resourcesRequired?: { guards?: number; analysts?: number; responders?: number };
      }
    ).resourcesRequired;
    if (!required) return;

    // Play tactical deploy SFX
    playSFX('tacticalDeploy');

    setDispatchResources((prev) => ({
      guards: {
        ...prev.guards,
        available: Math.max(0, prev.guards.available - (required.guards || 0)),
        cooldown: required.guards ? 3 : prev.guards.cooldown,
        contentionLevel:
          (prev.guards.available - (required.guards || 0)) / prev.guards.total <= 0.25
            ? 'CRITICAL'
            : (prev.guards.available - (required.guards || 0)) / prev.guards.total <= 0.5
              ? 'STRAINED'
              : 'NORMAL',
      },
      analysts: {
        ...prev.analysts,
        available: Math.max(0, prev.analysts.available - (required.analysts || 0)),
        cooldown: required.analysts ? 2 : prev.analysts.cooldown,
        contentionLevel:
          (prev.analysts.available - (required.analysts || 0)) / prev.analysts.total <= 0.25
            ? 'CRITICAL'
            : (prev.analysts.available - (required.analysts || 0)) / prev.analysts.total <= 0.5
              ? 'STRAINED'
              : 'NORMAL',
      },
      responders: {
        ...prev.responders,
        available: Math.max(0, prev.responders.available - (required.responders || 0)),
        cooldown: required.responders ? 4 : prev.responders.cooldown,
        contentionLevel:
          (prev.responders.available - (required.responders || 0)) / prev.responders.total <= 0.25
            ? 'CRITICAL'
            : (prev.responders.available - (required.responders || 0)) / prev.responders.total <=
                0.5
              ? 'STRAINED'
              : 'NORMAL',
      },
    }));
  }, []);

  // Auto-dismiss coach marks after first decision
  useEffect(() => {
    if (log.decisions.length > 0) {
      setShowCoachMarks(false);
    }
  }, [log.decisions.length]);

  const triggerInjectAlert = useCallback(
    (inject: ScenarioInject): void => {
      const urgency = (inject as unknown as { urgencyLevel?: string }).urgencyLevel;
      if (urgency === 'IMMEDIATE') {
        setScreenFlash('red');
        playSound('escalation');
        urgentFeedback();
      } else if (urgency === 'URGENT') {
        setScreenFlash('amber');
        playSound('injectArrive');
        tapFeedback();
      } else {
        playSound('injectArrive');
        tapFeedback();
      }
      setTimeout(() => setScreenFlash(null), 300);
      setLastActivityTime(elapsedSeconds);

      // Dismiss any active micro-task when real inject arrives
      if (activeMicroTask) {
        setActiveMicroTask(null);
      }
    },
    [playSound, urgentFeedback, tapFeedback, elapsedSeconds, activeMicroTask]
  );

  const handleTimeoutDecision = useCallback((): void => {
    if (!pendingDecision) return;

    // Score the timeout using the scoring engine (0 points, streak reset)
    const timeoutResult = scoreDecision({
      chosenPosture: 'CONTINUE',
      expectedPosture:
        (pendingDecision as unknown as { expectedPostureImpact?: DecisionPosture })
          .expectedPostureImpact || null,
      chosenTreatment: null,
      expectedTreatment: null,
      assetCriticality: 'MEDIUM',
      ownerBriefed: false,
      residualRiskSelected: false,
      treatmentCategorySelected: false,
      rationaleProvided: false,
      decisionTimeSeconds: 0,
      timerLimitSeconds: 75,
      wasTimeout: true,
      wasSkip: false,
      injectConfidence: 'MEDIUM',
      resourceContentionOccurred: false,
      currentStreak: gameState.streak,
      difficulty: difficulty as 'ROOKIE' | 'OPERATOR' | 'DIRECTOR',
    });

    // CONSEQUENCE THEATRE: Timeout has negative consequences
    setConsequenceAnimation({
      active: true,
      type: 'negative',
      kriChanges: [
        { id: 'mtta', delta: 15, newStatus: 'AMBER' },
        { id: 'response-time', delta: 20, newStatus: 'RED' },
      ],
      trustChange: -10,
      valueChange: -5000,
      residualChange: 15,
    });

    // Update stakeholder trust negatively
    setStakeholderTrust((prev) => Math.max(0, prev - 10));

    // Increase zone heat due to inaction
    setZoneHeatLevels((prev) => ({
      ...prev,
      operations: Math.min(100, prev.operations + 15),
    }));

    // Clear consequence animation after 1 second
    setTimeout(() => setConsequenceAnimation(null), 1000);

    setGameState((prev) => ({
      ...prev,
      score: prev.score, // No change - timeout gives 0 points
      streak: 0, // Streak resets on timeout
      decisionsTotal: prev.decisionsTotal + 1,
      comboMultiplier: 1,
    }));

    playSound('error');
    errorFeedback();

    setShowScorePopup({
      points: timeoutResult.totalPoints,
      message: 'Decision timeout - no points!',
    });
    setTimeout(() => setShowScorePopup(null), 2000);

    setPendingDecision(null);
    setSelectedAsset(null);
    setAssetOwnerBriefed(false);
    setSelectedTreatmentCategory(null);
    setSelectedTreatmentOption(null);
    setSelectedResidualRisk(null);
    setTreatmentBonusGiven(false);
  }, [pendingDecision, playSound, errorFeedback, gameState.streak, difficulty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsRunning((r) => !r);
          break;
        case 'c':
          if (pendingDecision && selectedAsset) handlePostureCommit('CONTINUE');
          break;
        case 'd':
          if (pendingDecision && selectedAsset) handlePostureCommit('DEGRADE');
          break;
        case 'p':
          if (pendingDecision && selectedAsset) handlePostureCommit('PAUSE');
          break;
        case 'escape':
          setPendingDecision(null);
          setSelectedAsset(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingDecision, selectedAsset]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingMinutes = Math.max(0, 60 - elapsedMinutes);
  const progressPercent = Math.min(100, (elapsedMinutes / 60) * 100);
  const isUrgent = remainingMinutes <= 15;
  const isCritical = remainingMinutes <= 5;

  const stats = useMemo(() => calculateStats(log), [log]);
  const revealedInjects = useMemo(() => getRevealedInjects(log), [log]);

  const handlePostureCommit = useCallback(
    (posture: DecisionPosture) => {
      if (!pendingDecision || !selectedAsset) return;

      // Check resource availability
      const resourceCheck = checkResourceAvailability(pendingDecision);
      if (!resourceCheck.canProceed) {
        setResourceContention(resourceCheck.warning);
        setTimeout(() => setResourceContention(null), 3000);
      }

      // Deploy resources
      deployResources(pendingDecision);

      const expectedPosture = (
        pendingDecision as unknown as { expectedPostureImpact?: DecisionPosture }
      ).expectedPostureImpact;

      // Get inject confidence from metadata
      const injectIntake = (pendingDecision as unknown as { intake?: { confidence?: string } })
        .intake;
      const injectConfidence = (injectIntake?.confidence || 'MEDIUM') as
        'VERIFIED' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';

      // Map posture to expected treatment
      const expectedTreatmentMap: Record<DecisionPosture, 'ACCEPT' | 'MITIGATE' | 'AVOID'> = {
        CONTINUE: 'ACCEPT',
        DEGRADE: 'MITIGATE',
        PAUSE: 'AVOID',
      };
      const expectedTreatment = expectedPosture ? expectedTreatmentMap[expectedPosture] : null;

      // Calculate time used for decision
      const decisionTimeUsed = Math.max(
        1,
        difficultyConfig.timerMultiplier * DECISION_TIMER_CONFIG.BASE_TIMER - decisionTimer
      );

      // Build scoring input for the new mathematically sound scoring engine
      const scoringInput: DecisionScoringInput = {
        chosenPosture: posture,
        expectedPosture: expectedPosture || null,
        chosenTreatment:
          (selectedTreatmentCategory as 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID') ||
          expectedTreatmentMap[posture],
        expectedTreatment,
        assetCriticality: selectedAsset.criticality as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        ownerBriefed: assetOwnerBriefed,
        residualRiskSelected: !!selectedResidualRisk,
        treatmentCategorySelected: !!selectedTreatmentCategory,
        rationaleProvided: !!residualRiskNote,
        decisionTimeSeconds: decisionTimeUsed,
        timerLimitSeconds: difficultyConfig.timerMultiplier * DECISION_TIMER_CONFIG.BASE_TIMER,
        wasTimeout: false,
        wasSkip: false,
        injectConfidence,
        resourceContentionOccurred: !resourceCheck.canProceed,
        currentStreak: gameState.streak,
        difficulty: difficulty as 'ROOKIE' | 'OPERATOR' | 'DIRECTOR',
      };

      // Score the decision using the new engine
      const scoringResult: DecisionScoringResult = scoreDecision(scoringInput);
      const totalPoints = scoringResult.totalPoints;
      const newStreak = scoringResult.newStreak;
      const isCorrect = scoringResult.isCorrect;

      // Play SFX based on decision outcome
      if (isCorrect) {
        playSFX('correctDecision');
        if (newStreak >= 3) {
          setTimeout(() => playSFX('streakBonus'), 300);
        }
      } else {
        playSFX('wrongDecision');
      }

      // Score up sound for positive points
      if (totalPoints > 0) {
        setTimeout(() => playSFX('scoreUp'), 150);
      }

      // Trigger ESRM cascade effect for PAUSE decisions
      if (posture === 'PAUSE') {
        setEsrmCascadeActive(true);
        setTimeout(() => setEsrmCascadeActive(false), 2000);
      }

      setLog(
        recordDecision(log, {
          title: pendingDecision.title,
          description: pendingDecision.content,
          posture,
          owner: 'GSOC Commander',
          ownerRole: 'Incident Commander',
          rationale: `Asset: ${selectedAsset.name}. Treatment: ${postureToTreatment(posture)}. ${residualRiskNote}`,
          esrmFraming: {
            assetOwner: selectedAsset.owner.name,
            assetOwnerRole: selectedAsset.owner.title,
            treatment: postureToTreatment(posture),
            residualRisk: residualRiskNote || 'Residual risk acknowledged',
          },
        })
      );

      // Calculate ESRM value for this decision
      const treatmentForCalc = postureToTreatmentCalc(
        posture,
        selectedTreatmentCategory as 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID' | undefined
      );
      const criticality = selectedAsset.criticality as AssetCriticality;
      const likelihood: RiskLikelihood =
        posture === 'PAUSE' ? 'LIKELY' : posture === 'DEGRADE' ? 'POSSIBLE' : 'UNLIKELY';
      const impact: RiskImpact =
        selectedAsset.criticality === 'CRITICAL'
          ? 'MAJOR'
          : selectedAsset.criticality === 'HIGH'
            ? 'MODERATE'
            : 'MINOR';

      const calcTrail = calculateDecisionValue({
        assetCriticality: criticality,
        threatLikelihood: likelihood,
        impactSeverity: impact,
        treatment: treatmentForCalc,
        decisionTimeSeconds: decisionTimeUsed,
        esrmDocumented: assetOwnerBriefed && !!residualRiskNote,
      });

      setCalcTrails((prev) => [...prev, calcTrail]);

      // CONSEQUENCE THEATRE: Calculate and animate visible COP/KRI/trust changes
      const valueNetChange = calcTrail.finalResult.netValue;
      const trustDelta = isCorrect
        ? (assetOwnerBriefed ? 8 : 3) + (selectedResidualRisk ? 3 : 0)
        : -(assetOwnerBriefed ? 2 : 8);
      const residualDelta = posture === 'PAUSE' ? -20 : posture === 'DEGRADE' ? -10 : 5;

      // Determine zone affected by this decision
      const zoneAffected = selectedAsset.businessFunction.toLowerCase().includes('executive')
        ? 'executive'
        : selectedAsset.businessFunction.toLowerCase().includes('security')
          ? 'perimeter'
          : selectedAsset.businessFunction.toLowerCase().includes('it')
            ? 'cyber'
            : 'operations';

      // Trigger consequence animation
      setConsequenceAnimation({
        active: true,
        type: isCorrect
          ? 'positive'
          : scoringResult.breakdown.penalties.total < -20
            ? 'negative'
            : 'neutral',
        kriChanges: [
          { id: 'mtta', delta: isCorrect ? -5 : 10, newStatus: isCorrect ? 'GREEN' : 'AMBER' },
          {
            id: 'residual-rate',
            delta: selectedResidualRisk ? 10 : -5,
            newStatus: selectedResidualRisk ? 'GREEN' : 'AMBER',
          },
        ],
        trustChange: trustDelta,
        valueChange: valueNetChange,
        residualChange: residualDelta,
      });

      // Update stakeholder trust (clamped 0-100)
      setStakeholderTrust((prev) => Math.max(0, Math.min(100, prev + trustDelta)));

      // Update zone heat levels
      setZoneHeatLevels((prev) => ({
        ...prev,
        [zoneAffected]: Math.max(0, Math.min(100, prev[zoneAffected] + (isCorrect ? -15 : 20))),
      }));

      // Update overall residual risk based on posture
      if (posture === 'PAUSE') {
        setOverallResidualRisk('LOW');
      } else if (posture === 'DEGRADE') {
        setOverallResidualRisk((prev) =>
          prev === 'CRITICAL' ? 'HIGH' : prev === 'HIGH' ? 'MEDIUM' : prev
        );
      } else if (!isCorrect && selectedAsset.criticality === 'CRITICAL') {
        setOverallResidualRisk((prev) =>
          prev === 'LOW' ? 'MEDIUM' : prev === 'MEDIUM' ? 'HIGH' : 'CRITICAL'
        );
      }

      // Clear consequence animation after 1 second
      setTimeout(() => setConsequenceAnimation(null), 1000);

      setGameState((prev) => ({
        ...prev,
        score: prev.score + totalPoints,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        decisionsCorrect: prev.decisionsCorrect + (isCorrect ? 1 : 0),
        decisionsTotal: prev.decisionsTotal + 1,
        injectsHandled: prev.injectsHandled + 1,
        assetOwnersBriefed: prev.assetOwnersBriefed + (assetOwnerBriefed ? 1 : 0),
        assetsProtected: prev.assetsProtected + 1,
        timeBonus: prev.timeBonus + Math.round(scoringResult.breakdown.timeBonus),
        esrmBonus: prev.esrmBonus + scoringResult.breakdown.esrmBonuses.total,
        comboMultiplier: scoringResult.breakdown.streakMultiplier,
      }));

      // Visual and audio feedback
      setScreenFlash(isCorrect ? 'green' : 'amber');
      setTimeout(() => setScreenFlash(null), 200);

      // Play sound and haptic with enhanced feedback
      playSound('decisionConfirm');
      if (isCorrect) {
        confirmFeedback();
      } else {
        tapFeedback();
      }

      // Rotate decision prompt variation for next decision
      setDecisionPromptIndex((prev) => (prev + 1) % DECISION_PROMPT_VARIATIONS.length);

      // Show score popup with feedback from scoring engine
      const scoreMessage =
        newStreak > 2 ? `${newStreak}x STREAK! ${scoringResult.feedback}` : scoringResult.feedback;
      setShowScorePopup({
        points: totalPoints,
        message: scoreMessage,
      });
      setTimeout(() => setShowScorePopup(null), 2500);

      // Update activity time
      setLastActivityTime(elapsedSeconds);

      // Reset decision state
      setPendingDecision(null);
      setSelectedAsset(null);
      setAssetOwnerBriefed(false);
      setResidualRiskNote('');
      setSelectedTreatmentCategory(null);
      setSelectedTreatmentOption(null);
      setSelectedResidualRisk(null);
      setTreatmentBonusGiven(false);

      // Auto-queue next unhandled inject
      setTimeout(() => {
        const unhandled = revealedInjects.filter(
          (i) => !log.decisions.some((d) => d.title === i.title) && i.id !== pendingDecision.id
        );
        if (unhandled.length > 0) {
          setPendingDecision(unhandled[0]);
        }
      }, 500);
    },
    [
      pendingDecision,
      selectedAsset,
      log,
      gameState,
      assetOwnerBriefed,
      residualRiskNote,
      selectedResidualRisk,
      selectedTreatmentCategory,
      decisionTimer,
      revealedInjects,
      checkResourceAvailability,
      deployResources,
      currentPlaybookPhase,
      cascadeMultiplier,
      playSound,
      confirmFeedback,
      tapFeedback,
    ]
  );

  const calculateGrade = (): { grade: string; title: string; color: string } => {
    const { decisionsCorrect, decisionsTotal, score, assetOwnersBriefed } = gameState;
    if (decisionsTotal === 0) return { grade: 'F', title: 'No Engagement', color: 'text-red-400' };

    const accuracy = decisionsCorrect / decisionsTotal;
    const esrmDiscipline = assetOwnersBriefed / Math.max(1, decisionsTotal);
    const composite = accuracy * 0.4 + esrmDiscipline * 0.3 + Math.min(score / 2000, 1) * 0.3;

    if (composite >= 0.95) return { grade: 'S', title: 'GSOC Legend', color: 'text-purple-400' };
    if (composite >= 0.85)
      return { grade: 'A', title: 'Crisis Commander', color: 'text-emerald-400' };
    if (composite >= 0.75) return { grade: 'B', title: 'Solid Operator', color: 'text-blue-400' };
    if (composite >= 0.6) return { grade: 'C', title: 'Learning Curve', color: 'text-amber-400' };
    if (composite >= 0.4) return { grade: 'D', title: 'Needs Work', color: 'text-orange-400' };
    return { grade: 'F', title: 'Mission Failed', color: 'text-red-400' };
  };

  const assets = esrmConfig?.primaryAssets || [];

  // Update value metrics, KRI dashboard, and pipeline health
  useEffect(() => {
    if (!isRunning && !showDebrief) return;

    const updateMetrics = () => {
      // Calculate ESRM Value Created
      const assetOwnersBriefed = log.decisions.filter(
        (d) =>
          d.rationale?.toLowerCase().includes('owner') ||
          d.rationale?.toLowerCase().includes('briefed')
      ).length;
      const crossDomainCount = log.decisions.filter(
        (d) => d.posture === 'PAUSE' || d.esrmFraming?.treatment === 'MITIGATE'
      ).length;

      const value = calculateESRMValueCreated(
        log,
        assets,
        elapsedSeconds,
        assetOwnersBriefed,
        crossDomainCount
      );
      setValueMetrics(value);

      // Calculate KRI Dashboard
      const escalationLevel: 'ACTIVITY' | 'INCIDENT' | 'INVESTIGATION' = log.decisions.some(
        (d) => d.posture === 'PAUSE'
      )
        ? 'INVESTIGATION'
        : log.decisions.length > 3
          ? 'INCIDENT'
          : 'ACTIVITY';

      const guardsDeployed = log.decisions.filter(
        (d) => d.esrmFraming?.treatment === 'MITIGATE'
      ).length;
      const analystsBusy = Math.min(2, log.decisions.length);
      const respondersDeployed = log.decisions.filter((d) => d.posture === 'PAUSE').length;

      const resources = {
        guards: {
          available: Math.max(0, 4 - guardsDeployed),
          total: 4,
          contentionLevel: guardsDeployed > 2 ? 'HIGH' : guardsDeployed > 0 ? 'MEDIUM' : 'LOW',
        },
        analysts: {
          available: Math.max(0, 2 - analystsBusy),
          total: 2,
          contentionLevel: analystsBusy > 1 ? 'HIGH' : analystsBusy > 0 ? 'MEDIUM' : 'LOW',
        },
        responders: {
          available: Math.max(0, 3 - respondersDeployed),
          total: 3,
          contentionLevel:
            respondersDeployed > 1 ? 'HIGH' : respondersDeployed > 0 ? 'MEDIUM' : 'LOW',
        },
      };

      const kri = createKRIDashboard(
        log,
        revealedInjects,
        elapsedSeconds,
        assetOwnersBriefed,
        escalationLevel,
        resources,
        kriDashboard || undefined
      );
      setKRIDashboard(kri);

      // Calculate Pipeline Health
      const pipeline = createPipelineHealth(log, revealedInjects, elapsedSeconds);
      setPipelineHealth(pipeline);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [log, elapsedSeconds, isRunning, showDebrief, assets, revealedInjects, kriDashboard]);

  return (
    <div
      className={clsx(
        'min-h-screen bg-[#06060a] text-gray-100 flex flex-col overflow-hidden',
        screenFlash === 'red' && 'animate-flash-red',
        screenFlash === 'amber' && 'animate-flash-amber',
        screenFlash === 'green' && 'animate-flash-green',
        urgentPulse && 'animate-urgent-pulse'
      )}
    >
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#06060a] to-[#04040a]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] animate-float-slow" />
          <div className="absolute bottom-[-30%] right-[-10%] w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] animate-float-slower" />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-orange-500/3 rounded-full blur-[100px] animate-float" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Top Command Bar - Mobile-first responsive */}
      <header className="relative z-40 flex-none border-b border-gray-800/60 bg-[#08080e]/90 backdrop-blur-2xl safe-area-top header-safe">
        <div className="flex items-center justify-between px-2 py-2 sm:px-3 lg:px-6 lg:py-3 gap-2">
          {/* Left: Back & Logo - Compact on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-shrink-0 min-w-0">
            <button
              onClick={handleExitClick}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-800/50 active:bg-gray-800/70 transition-all touch-target flex items-center justify-center animate-press flex-shrink-0"
              aria-label="Exit mission"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>

            <div className="hidden sm:flex items-center gap-2 lg:gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-xl blur-xl animate-pulse-slow" />
                <div className="relative w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
              </div>
              <div className="hidden lg:block min-w-0">
                <div className="text-sm lg:text-base font-bold text-gray-100 tracking-tight truncate">
                  Hourglass Command
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span
                    className={clsx(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                    )}
                  />
                  <span
                    className={clsx('truncate', isRunning ? 'text-emerald-400' : 'text-gray-500')}
                  >
                    {isRunning ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Timer - Always visible, compact on mobile */}
          <div className="flex items-center flex-shrink min-w-0">
            {/* Mobile compact timer */}
            <div
              className={clsx(
                'flex lg:hidden items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition-all',
                isCritical
                  ? 'bg-red-500/10 border-red-500/40 animate-escalation-pulse'
                  : isUrgent
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-gray-800/40 border-gray-700/50'
              )}
            >
              <button
                onClick={() => {
                  setIsRunning(!isRunning);
                  tapFeedback();
                }}
                className={clsx(
                  'p-1.5 sm:p-2 rounded-lg transition-all touch-target flex items-center justify-center animate-press',
                  isRunning
                    ? 'bg-amber-500/20 text-amber-400 active:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 active:bg-emerald-500/30'
                )}
                aria-label={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <div
                className={clsx(
                  'font-mono text-lg sm:text-xl font-black tracking-tighter tabular-nums',
                  isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white'
                )}
              >
                {formatTime(elapsedSeconds)}
              </div>
              <Timer
                className={clsx(
                  'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0',
                  isCritical
                    ? 'text-red-400 animate-bounce'
                    : isUrgent
                      ? 'text-amber-400'
                      : 'text-gray-500'
                )}
              />
            </div>

            {/* Desktop full timer */}
            <div
              className={clsx(
                'hidden lg:flex relative items-center gap-4 px-5 py-3 rounded-2xl border-2 transition-all duration-300',
                isCritical
                  ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/20'
                  : isUrgent
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-gray-800/40 border-gray-700/50'
              )}
            >
              {isCritical && (
                <div className="absolute inset-0 rounded-2xl bg-red-500/10 animate-pulse" />
              )}

              <button
                onClick={() => setIsRunning(!isRunning)}
                className={clsx(
                  'relative z-10 p-2.5 rounded-xl transition-all duration-200 touch-target flex items-center justify-center',
                  isRunning
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                )}
                aria-label={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <div className="relative z-10 text-center">
                <div
                  className={clsx(
                    'font-mono text-3xl font-black tracking-tighter',
                    isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white'
                  )}
                >
                  {formatTime(elapsedSeconds)}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {remainingMinutes}m remaining
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <Timer
                  className={clsx(
                    'w-6 h-6',
                    isCritical
                      ? 'text-red-400 animate-bounce'
                      : isUrgent
                        ? 'text-amber-400'
                        : 'text-gray-500'
                  )}
                />
                {isCritical && <Flame className="w-4 h-4 text-red-400 animate-pulse mt-1" />}
              </div>
            </div>
          </div>

          {/* Right: Score & Actions - Overflow safe with mobile menu */}
          <div className="flex items-center gap-0.5 sm:gap-1 lg:gap-2 flex-shrink-0 max-w-[55%] sm:max-w-[50%] lg:max-w-none overflow-hidden">
            {/* Mobile score badge */}
            <div className="flex lg:hidden items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-gray-800/40 flex-shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
                {gameState.score >= 1000
                  ? `${(gameState.score / 1000).toFixed(1)}k`
                  : gameState.score}
              </span>
            </div>

            {/* Desktop score display */}
            <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/50 flex-shrink-0">
              <div className="text-center">
                <div className="font-mono text-2xl font-black text-emerald-400 tracking-tight">
                  {gameState.score.toLocaleString()}
                </div>
                <div className="text-2xs text-gray-500 uppercase tracking-wider">Score</div>
              </div>

              {gameState.streak > 1 && (
                <>
                  <div className="w-px h-10 bg-gray-700" />
                  <div className="text-center">
                    <div className="font-mono text-xl font-bold text-amber-400 flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {gameState.streak}x
                    </div>
                    <div className="text-2xs text-gray-500 uppercase tracking-wider">Streak</div>
                  </div>
                </>
              )}
            </div>

            {/* Sound toggle - always visible */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/70 transition-all items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex-shrink-0"
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Ambient music toggle - hidden on very small mobile, accessible via menu */}
            <button
              onClick={handleAmbientMusicToggle}
              className={clsx(
                'hidden xs:flex p-2 rounded-xl transition-all items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex-shrink-0',
                ambientMusicEnabled && isMusicPlaying
                  ? 'text-violet-400 bg-violet-500/20 hover:bg-violet-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/70'
              )}
              aria-label={ambientMusicEnabled ? 'Disable ambient music' : 'Enable ambient music'}
              title={ambientMusicEnabled ? 'Ambient music on' : 'Ambient music off'}
            >
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Field Guide Tips toggle - hidden on mobile, accessible via menu */}
            <button
              onClick={() => {
                const newValue = !fieldGuideTipsEnabled;
                setFieldGuideTipsEnabled(newValue);
                setTipsEnabled(newValue);
              }}
              className={clsx(
                'hidden sm:flex p-2 rounded-xl transition-all items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex-shrink-0',
                fieldGuideTipsEnabled
                  ? 'text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/70'
              )}
              aria-label={fieldGuideTipsEnabled ? 'Disable JIT tips' : 'Enable JIT tips'}
              title={fieldGuideTipsEnabled ? 'Field Guide tips on' : 'Field Guide tips off'}
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Escalation Level Indicator - hidden on small mobile */}
            <div
              className={clsx(
                'hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex-shrink-0',
                escalationLevel === 'INVESTIGATION'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : escalationLevel === 'INCIDENT'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-gray-800/60 text-gray-400 border border-gray-700/50'
              )}
              title="Escalation Level"
            >
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden lg:inline">{escalationLevel}</span>
            </div>

            {/* Desktop-only action buttons */}
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
              {/* Entity Link Button */}
              {log.linkedEntities && log.linkedEntities.length > 0 && (
                <button
                  onClick={() => setShowEntityPanel(true)}
                  className="p-2 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 active:bg-cyan-500/20 transition-all flex items-center justify-center relative"
                  aria-label="Open Entity Map"
                >
                  <Link2 className="w-5 h-5" />
                  {highlightedEntityId && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </button>
              )}

              {/* Value Metrics Button */}
              <button
                onClick={() => setShowValuePanel(true)}
                className={clsx(
                  'p-2 rounded-xl transition-all flex items-center justify-center relative',
                  valueMetrics && valueMetrics.compositeValueScore >= 0.7
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                    : valueMetrics && valueMetrics.compositeValueScore >= 0.4
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                )}
                aria-label="View Value Metrics"
              >
                <TrendingUp className="w-5 h-5" />
                {valueMetrics && valueMetrics.compositeValueScore >= 0.7 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              {/* KRI Dashboard Button */}
              <button
                onClick={() => {
                  setShowKRIPanel(true);
                  triggerFirstVisit('KRI_VALUE');
                }}
                className={clsx(
                  'p-2 rounded-xl transition-all flex items-center justify-center relative',
                  kriDashboard?.overallHealth === 'GREEN'
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                    : kriDashboard?.overallHealth === 'AMBER'
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                      : kriDashboard?.overallHealth === 'RED'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                )}
                aria-label="View KRI Dashboard"
              >
                <BarChart3 className="w-5 h-5" />
                {kriDashboard && kriDashboard.criticalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                )}
              </button>

              {/* Pipeline Health Button */}
              <button
                onClick={() => setShowPipelinePanel(true)}
                className={clsx(
                  'p-2 rounded-xl transition-all flex items-center justify-center relative',
                  pipelineHealth?.overallStatus === 'HEALTHY'
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                    : pipelineHealth?.overallStatus === 'DEGRADED'
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                      : pipelineHealth?.overallStatus === 'CRITICAL'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                )}
                aria-label="View Pipeline Health"
              >
                <Activity className="w-5 h-5" />
                {pipelineHealth && pipelineHealth.alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              {/* Tactical Actions Button */}
              <button
                onClick={() => {
                  setShowTacticalPanel(true);
                  triggerFirstVisit('TACTICAL');
                }}
                className={clsx(
                  'p-2 rounded-xl transition-all flex items-center justify-center relative',
                  tacticalState.deployedActions.filter((d) => d.status === 'ACTIVE').length > 0
                    ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                )}
                aria-label="Tactical Actions"
              >
                <Crosshair className="w-5 h-5" />
                {tacticalState.deployedActions.filter((d) => d.status === 'ACTIVE').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500/90 text-2xs font-bold text-white flex items-center justify-center">
                    {tacticalState.deployedActions.filter((d) => d.status === 'ACTIVE').length}
                  </span>
                )}
              </button>

              {/* Field Guide Button */}
              <button
                onClick={() => {
                  setShowFieldGuide(true);
                  triggerFirstVisit('FIELD_GUIDE');
                }}
                className="p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 active:bg-amber-500/20 transition-all flex items-center justify-center"
                aria-label="Open Field Guide"
              >
                <BookOpen className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowDebrief(true)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/70 transition-all flex items-center justify-center"
                aria-label="View debrief"
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile overflow menu button */}
            <div className="lg:hidden flex-shrink-0">
              <button
                ref={mobileMenuButtonRef}
                onClick={() => {
                  if (!showMobileMenu && mobileMenuButtonRef.current) {
                    const rect = mobileMenuButtonRef.current.getBoundingClientRect();
                    setMobileMenuPosition({
                      top: rect.bottom + 8,
                      right: window.innerWidth - rect.right,
                    });
                  }
                  setShowMobileMenu(!showMobileMenu);
                }}
                className={clsx(
                  'p-2 rounded-xl transition-all flex items-center justify-center min-w-[40px] min-h-[40px] relative',
                  showMobileMenu
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                )}
                aria-label="More options"
                aria-expanded={showMobileMenu}
              >
                <Layers className="w-5 h-5" />
                {(kriDashboard?.criticalCount ?? 0) > 0 ||
                (pipelineHealth?.alerts?.length ?? 0) > 0 ? (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                ) : null}
              </button>
            </div>

            {/* Mobile dropdown menu - rendered via portal to escape stacking context */}
            {showMobileMenu &&
              typeof document !== 'undefined' &&
              createPortal(
                <>
                  {/* Backdrop to indicate overlay state */}
                  <div
                    className="fixed inset-0 z-[199]"
                    onClick={() => setShowMobileMenu(false)}
                    aria-hidden="true"
                  />
                  <div
                    className="fixed w-52 sm:w-56 py-2 rounded-xl bg-gray-900/98 border border-gray-700/60 shadow-2xl backdrop-blur-xl z-[200] animate-scale-in-fast max-h-[70vh] overflow-y-auto"
                    role="menu"
                    style={{
                      top: mobileMenuPosition?.top ?? 60,
                      right: Math.max(8, mobileMenuPosition?.right ?? 8),
                    }}
                  >
                    <div className="px-3 py-1.5 text-2xs text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-800 mb-1">
                      Dashboards
                    </div>

                    {log.linkedEntities && log.linkedEntities.length > 0 && (
                      <button
                        onClick={() => {
                          setShowEntityPanel(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-all"
                        role="menuitem"
                      >
                        <Link2 className="w-4 h-4" />
                        Entity Map
                        {highlightedEntityId && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowValuePanel(true);
                        setShowMobileMenu(false);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                        valueMetrics && valueMetrics.compositeValueScore >= 0.7
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : valueMetrics && valueMetrics.compositeValueScore >= 0.4
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : 'text-gray-400 hover:bg-gray-800/50'
                      )}
                      role="menuitem"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Value Metrics
                    </button>

                    <button
                      onClick={() => {
                        setShowKRIPanel(true);
                        setShowMobileMenu(false);
                        triggerFirstVisit('KRI_VALUE');
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                        kriDashboard?.overallHealth === 'GREEN'
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : kriDashboard?.overallHealth === 'AMBER'
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : kriDashboard?.overallHealth === 'RED'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-gray-400 hover:bg-gray-800/50'
                      )}
                      role="menuitem"
                    >
                      <BarChart3 className="w-4 h-4" />
                      KRI Dashboard
                      {kriDashboard && kriDashboard.criticalCount > 0 && (
                        <span className="ml-auto text-2xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                          {kriDashboard.criticalCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowPipelinePanel(true);
                        setShowMobileMenu(false);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                        pipelineHealth?.overallStatus === 'HEALTHY'
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : pipelineHealth?.overallStatus === 'DEGRADED'
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : pipelineHealth?.overallStatus === 'CRITICAL'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-gray-400 hover:bg-gray-800/50'
                      )}
                      role="menuitem"
                    >
                      <Activity className="w-4 h-4" />
                      Pipeline Health
                      {pipelineHealth && pipelineHealth.alerts.length > 0 && (
                        <span className="ml-auto text-2xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          {pipelineHealth.alerts.length}
                        </span>
                      )}
                    </button>

                    <div className="border-t border-gray-800 my-1" />

                    <button
                      onClick={() => {
                        setShowTacticalPanel(true);
                        setShowMobileMenu(false);
                        triggerFirstVisit('TACTICAL');
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                        tacticalState.deployedActions.filter((d) => d.status === 'ACTIVE').length >
                          0
                          ? 'text-cyan-400 hover:bg-cyan-500/10'
                          : 'text-gray-400 hover:bg-gray-800/50'
                      )}
                      role="menuitem"
                    >
                      <Crosshair className="w-4 h-4" />
                      Tactical Actions
                      {tacticalState.deployedActions.filter((d) => d.status === 'ACTIVE').length >
                        0 && (
                        <span className="ml-auto text-2xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                          {
                            tacticalState.deployedActions.filter((d) => d.status === 'ACTIVE')
                              .length
                          }{' '}
                          active
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowFieldGuide(true);
                        setShowMobileMenu(false);
                        triggerFirstVisit('FIELD_GUIDE');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-all"
                      role="menuitem"
                    >
                      <BookOpen className="w-4 h-4" />
                      Field Guide
                    </button>

                    <button
                      onClick={() => {
                        setShowDebrief(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-800/50 transition-all"
                      role="menuitem"
                    >
                      <FileText className="w-4 h-4" />
                      Debrief
                    </button>

                    {/* Ambient Music Toggle in mobile menu */}
                    <button
                      onClick={() => {
                        handleAmbientMusicToggle();
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                        ambientMusicEnabled && isMusicPlaying
                          ? 'text-violet-400 hover:bg-violet-500/10'
                          : 'text-gray-400 hover:bg-gray-800/50'
                      )}
                      role="menuitem"
                    >
                      <Music className="w-4 h-4" />
                      Ambient Music
                      {ambientMusicEnabled && isMusicPlaying && (
                        <span className="ml-auto text-2xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
                          On
                        </span>
                      )}
                    </button>

                    {/* Field Guide Tips Toggle in mobile menu */}
                    <button
                      onClick={() => {
                        const newValue = !fieldGuideTipsEnabled;
                        setFieldGuideTipsEnabled(newValue);
                        setTipsEnabled(newValue);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all',
                        fieldGuideTipsEnabled
                          ? 'text-cyan-400 hover:bg-cyan-500/10'
                          : 'text-gray-400 hover:bg-gray-800/50'
                      )}
                      role="menuitem"
                    >
                      <HelpCircle className="w-4 h-4" />
                      JIT Tips
                      {fieldGuideTipsEnabled && (
                        <span className="ml-auto text-2xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                          On
                        </span>
                      )}
                    </button>

                    <div className="border-t border-gray-800 my-1" />

                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="text-2xs text-gray-500 uppercase tracking-wider">
                        {escalationLevel}
                      </span>
                      <span
                        className={clsx(
                          'text-2xs px-1.5 py-0.5 rounded font-semibold',
                          escalationLevel === 'INVESTIGATION'
                            ? 'bg-red-500/20 text-red-400'
                            : escalationLevel === 'INCIDENT'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-700 text-gray-400'
                        )}
                      >
                        Level
                      </span>
                    </div>
                  </div>
                </>,
                document.body
              )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 lg:h-1.5 bg-gray-900/80">
          <div
            className={clsx(
              'h-full transition-all duration-500 relative',
              isCritical
                ? 'bg-gradient-to-r from-red-600 to-red-400'
                : isUrgent
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            )}
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Animated tabs */}
      <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">
        <div className="flex items-center">
          <button
            onClick={() => handleTabChange('intel')}
            className={clsx(
              'mobile-nav-item transition-all duration-200 animate-press',
              mobileTab === 'intel' ? 'mobile-nav-item-active scale-105' : 'text-gray-500'
            )}
            aria-current={mobileTab === 'intel' ? 'page' : undefined}
          >
            <div className="relative">
              <Radio
                className={clsx(
                  'w-6 h-6 transition-transform',
                  mobileTab === 'intel' && !reducedMotion && 'animate-pulse-slow'
                )}
              />
              {revealedInjects.length > 0 && (
                <span
                  className={clsx(
                    'absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-2xs font-bold text-black flex items-center justify-center',
                    !reducedMotion && 'animate-badge-pop'
                  )}
                >
                  {revealedInjects.length}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">Intel</span>
          </button>
          <button
            onClick={() => handleTabChange('decision')}
            className={clsx(
              'mobile-nav-item transition-all duration-200 animate-press',
              mobileTab === 'decision' ? 'mobile-nav-item-active scale-105' : 'text-gray-500'
            )}
            aria-current={mobileTab === 'decision' ? 'page' : undefined}
          >
            <Briefcase className="w-6 h-6" />
            <span className="mobile-nav-label">Decision</span>
            {pendingDecision && mobileTab !== 'decision' && (
              <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('cop')}
            className={clsx(
              'mobile-nav-item transition-all duration-200 animate-press',
              mobileTab === 'cop' ? 'mobile-nav-item-active scale-105' : 'text-gray-500'
            )}
            aria-current={mobileTab === 'cop' ? 'page' : undefined}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="mobile-nav-label">COP</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex overflow-hidden mobile-content-area">
        {/* Desktop: Full 3-column layout */}
        <div className="hidden lg:flex flex-1">
          {/* Left: Intel Feed */}
          <div className="w-80 xl:w-96 flex-shrink-0 border-r border-gray-800/50 bg-[#08080c]/80 backdrop-blur-xl flex flex-col">
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio
                    className={clsx(
                      'w-5 h-5',
                      isRunning ? 'text-emerald-400 animate-pulse' : 'text-gray-600'
                    )}
                  />
                  <h2 className="font-semibold text-gray-200">Intel Feed</h2>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {revealedInjects.length}/{log.injects.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
              {revealedInjects.length === 0 && (
                <div className="text-center py-16">
                  <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4 animate-pulse" />
                  <p className="text-sm text-gray-500">Awaiting intel...</p>
                  <p className="text-xs text-gray-600 mt-2">Press SPACE to begin</p>
                </div>
              )}

              {revealedInjects.map((inject, idx) => {
                const isHandled = log.decisions.some((d) => d.title === inject.title);
                const isActive = pendingDecision?.id === inject.id;

                return (
                  <InjectCard
                    key={inject.id}
                    inject={inject}
                    index={idx}
                    isHandled={isHandled}
                    isActive={isActive}
                    onSelect={() => {
                      if (!isHandled) {
                        setPendingDecision(inject);
                        setSelectedAsset(null);
                        setAssetOwnerBriefed(false);
                        setResidualRiskNote('');
                        setSelectedTreatmentCategory(null);
                        setSelectedTreatmentOption(null);
                        setSelectedResidualRisk(null);
                        setTreatmentBonusGiven(false);
                      }
                    }}
                    reducedMotion={reducedMotion}
                    linkedEntities={log.linkedEntities}
                    highlightedEntityId={highlightedEntityId}
                  />
                );
              })}
            </div>
          </div>

          {/* Center: Decision Console */}
          <div className="flex-1 flex flex-col min-w-0">
            {pendingDecision ? (
              <DecisionConsole
                inject={pendingDecision}
                decisionPromptVariation={DECISION_PROMPT_VARIATIONS[decisionPromptIndex]}
                assets={assets}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                assetOwnerBriefed={assetOwnerBriefed}
                onToggleBriefed={() => setAssetOwnerBriefed(!assetOwnerBriefed)}
                residualRiskNote={residualRiskNote}
                onResidualRiskChange={setResidualRiskNote}
                decisionTimer={decisionTimer}
                onCommit={handlePostureCommit}
                reducedMotion={reducedMotion}
                selectedTreatmentCategory={selectedTreatmentCategory}
                onSelectTreatmentCategory={handleTreatmentCategorySelect}
                selectedTreatmentOption={selectedTreatmentOption}
                onSelectTreatmentOption={setSelectedTreatmentOption}
                selectedResidualRisk={selectedResidualRisk}
                onSelectResidualRisk={setSelectedResidualRisk}
              />
            ) : (
              <IdleState
                isRunning={isRunning}
                revealedInjects={revealedInjects}
                decisions={log.decisions}
                onStart={() => handleStartGame()}
                onSelectInject={(inject) => {
                  setPendingDecision(inject);
                  setSelectedAsset(null);
                  setAssetOwnerBriefed(false);
                }}
                difficulty={difficulty}
                onOpenDifficultyPicker={() => setShowDifficultyPicker(true)}
                personalBest={personalBest}
              />
            )}
          </div>

          {/* Right: Assets & COP */}
          <div className="hidden xl:flex w-80 flex-shrink-0 border-l border-gray-800/50 bg-[#08080c]/80 backdrop-blur-xl flex-col">
            {/* Assets at Risk */}
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-300">Assets at Risk</h3>
              </div>
              <div className="space-y-2">
                {assets.slice(0, 3).map((asset) => (
                  <div
                    key={asset.id}
                    className={clsx(
                      'p-3 rounded-xl border cursor-pointer transition-all',
                      selectedAsset?.id === asset.id
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-gray-800/30 border-gray-700/40 hover:border-gray-600/60'
                    )}
                    onClick={() => pendingDecision && setSelectedAsset(asset)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {asset.name}
                      </span>
                      <span
                        className={clsx(
                          'text-2xs px-1.5 py-0.5 rounded font-bold',
                          asset.criticality === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        )}
                      >
                        {asset.criticality}
                      </span>
                    </div>
                    <p className="text-2xs text-gray-500 truncate">{asset.owner.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Playbook Phase Tracker */}
            <div className="p-4 border-b border-gray-800/50">
              <PlaybookPhaseTracker
                currentPhase={currentPlaybookPhase}
                phaseProgress={phaseProgress}
              />
            </div>

            {/* COP Stats with Icons */}
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-300">Situation Board</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat
                  label="Facts"
                  value={stats.totalFacts}
                  color="emerald"
                  icon={CheckCircle}
                  animating={consequenceAnimation?.active}
                  reducedMotion={reducedMotion}
                />
                <MiniStat
                  label="Assumed"
                  value={stats.totalAssumptions}
                  color="amber"
                  icon={HelpCircle}
                  animating={consequenceAnimation?.active}
                  reducedMotion={reducedMotion}
                />
                <MiniStat
                  label="Unknown"
                  value={stats.totalUnknowns}
                  color="red"
                  icon={AlertCircle}
                  animating={consequenceAnimation?.active}
                  reducedMotion={reducedMotion}
                />
              </div>
              {/* Triage Queue Status */}
              {triageQueue.length > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="font-medium">{triageQueue.length} in triage queue</span>
                  </div>
                </div>
              )}
              {/* Cascade Multiplier Display */}
              {cascadeMultiplier > 1 && (
                <div className="mt-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-violet-400">Cascade Multiplier</span>
                    <span className="text-violet-400 font-bold">
                      {cascadeMultiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visual COP Zone Display */}
            <div className="p-4 border-b border-gray-800/50">
              <COPZoneDisplay
                zoneHeatLevels={zoneHeatLevels}
                overallResidualRisk={overallResidualRisk}
                stakeholderTrust={stakeholderTrust}
                reducedMotion={reducedMotion}
                animating={!!consequenceAnimation?.active}
              />
            </div>

            {/* Dispatch Pressure with Resource Chips */}
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-300">Resources</h3>
              </div>
              {/* Compact Resource Chips */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <ResourceChip
                  label="Guards"
                  available={dispatchResources.guards.available}
                  total={dispatchResources.guards.total}
                  icon={Shield}
                  contentionLevel={dispatchResources.guards.contentionLevel}
                  reducedMotion={reducedMotion}
                />
                <ResourceChip
                  label="Analysts"
                  available={dispatchResources.analysts.available}
                  total={dispatchResources.analysts.total}
                  icon={Brain}
                  contentionLevel={dispatchResources.analysts.contentionLevel}
                  reducedMotion={reducedMotion}
                />
                <ResourceChip
                  label="Responders"
                  available={dispatchResources.responders.available}
                  total={dispatchResources.responders.total}
                  icon={Zap}
                  contentionLevel={dispatchResources.responders.contentionLevel}
                  reducedMotion={reducedMotion}
                />
              </div>
              {/* Detailed Resource Bars */}
              <div className="space-y-2">
                <DispatchResource label="Guards" resource={dispatchResources.guards} color="cyan" />
                <DispatchResource
                  label="Analysts"
                  resource={dispatchResources.analysts}
                  color="violet"
                />
                <DispatchResource
                  label="Responders"
                  resource={dispatchResources.responders}
                  color="orange"
                />
              </div>
            </div>

            {/* Leadership Panel - Progressive Disclosure */}
            {showLeadershipPanel && (
              <div className="border-b border-gray-800/50">
                <div className="flex border-b border-gray-800/50">
                  <button
                    onClick={() => setLeadershipTab('team')}
                    className={clsx(
                      'flex-1 py-2.5 text-xs font-medium transition-all',
                      leadershipTab === 'team'
                        ? 'text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-400'
                        : 'text-gray-500 hover:text-gray-300'
                    )}
                  >
                    Team
                  </button>
                  <button
                    onClick={() => setLeadershipTab('stakeholders')}
                    className={clsx(
                      'flex-1 py-2.5 text-xs font-medium transition-all',
                      leadershipTab === 'stakeholders'
                        ? 'text-violet-400 bg-violet-500/10 border-b-2 border-violet-400'
                        : 'text-gray-500 hover:text-gray-300'
                    )}
                  >
                    Stakeholders
                  </button>
                </div>
                <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
                  {leadershipTab === 'team' ? (
                    <TeamPanel roster={teamRoster} />
                  ) : (
                    <StakeholderPanel
                      stakeholderMap={stakeholderMap}
                      briefings={[]}
                      currentEscalationLevel={
                        escalationLevel === 'INVESTIGATION'
                          ? 4
                          : escalationLevel === 'INCIDENT'
                            ? 3
                            : 2
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Decision History */}
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Decision Log</h3>
              <div className="space-y-2">
                {log.decisions
                  .slice(-5)
                  .reverse()
                  .map((decision) => (
                    <div
                      key={decision.id}
                      className={clsx(
                        'p-2.5 rounded-lg border text-xs',
                        POSTURE_CONFIG[decision.posture].bgColor,
                        POSTURE_CONFIG[decision.posture].borderColor
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={clsx('font-bold', POSTURE_CONFIG[decision.posture].color)}>
                          {decision.posture}
                        </span>
                        <span className="text-gray-400 truncate">{decision.title}</span>
                      </div>
                    </div>
                  ))}
                {log.decisions.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">No decisions yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Single-surface tabbed view */}
        <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
          {/* Mobile Intel Tab */}
          {mobileTab === 'intel' && (
            <div
              className={clsx(
                'flex-1 flex flex-col overflow-hidden',
                !reducedMotion && 'animate-tab-enter'
              )}
            >
              <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio
                    className={clsx(
                      'w-5 h-5',
                      isRunning ? 'text-emerald-400 animate-pulse' : 'text-gray-600'
                    )}
                  />
                  <h2 className="font-semibold text-gray-200">Intel Feed</h2>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {revealedInjects.length}/{log.injects.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {revealedInjects.length === 0 && (
                  <div className="text-center py-16">
                    <Activity className="w-14 h-14 text-gray-700 mx-auto mb-4 animate-pulse" />
                    <p className="text-base text-gray-500">Awaiting intel...</p>
                    <p className="text-sm text-gray-600 mt-2">Tap play to begin simulation</p>
                  </div>
                )}

                {revealedInjects.map((inject, idx) => {
                  const isHandled = log.decisions.some((d) => d.title === inject.title);
                  const isActive = pendingDecision?.id === inject.id;

                  return (
                    <InjectCard
                      key={inject.id}
                      inject={inject}
                      index={idx}
                      isHandled={isHandled}
                      isActive={isActive}
                      onSelect={() => {
                        if (!isHandled) {
                          setPendingDecision(inject);
                          setSelectedAsset(null);
                          setAssetOwnerBriefed(false);
                          setResidualRiskNote('');
                          setSelectedTreatmentCategory(null);
                          setSelectedTreatmentOption(null);
                          setSelectedResidualRisk(null);
                          setTreatmentBonusGiven(false);
                          setMobileTab('decision');
                        }
                      }}
                      reducedMotion={reducedMotion}
                      linkedEntities={log.linkedEntities}
                      highlightedEntityId={highlightedEntityId}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile Decision Tab */}
          {mobileTab === 'decision' && (
            <div
              className={clsx(
                'flex-1 flex flex-col overflow-hidden',
                !reducedMotion && 'animate-tab-enter'
              )}
            >
              {pendingDecision ? (
                <DecisionConsole
                  inject={pendingDecision}
                  decisionPromptVariation={DECISION_PROMPT_VARIATIONS[decisionPromptIndex]}
                  assets={assets}
                  selectedAsset={selectedAsset}
                  onSelectAsset={setSelectedAsset}
                  assetOwnerBriefed={assetOwnerBriefed}
                  onToggleBriefed={() => setAssetOwnerBriefed(!assetOwnerBriefed)}
                  residualRiskNote={residualRiskNote}
                  onResidualRiskChange={setResidualRiskNote}
                  decisionTimer={decisionTimer}
                  onCommit={handlePostureCommit}
                  reducedMotion={reducedMotion}
                  selectedTreatmentCategory={selectedTreatmentCategory}
                  onSelectTreatmentCategory={handleTreatmentCategorySelect}
                  selectedTreatmentOption={selectedTreatmentOption}
                  onSelectTreatmentOption={setSelectedTreatmentOption}
                  selectedResidualRisk={selectedResidualRisk}
                  onSelectResidualRisk={setSelectedResidualRisk}
                />
              ) : (
                <IdleState
                  isRunning={isRunning}
                  revealedInjects={revealedInjects}
                  decisions={log.decisions}
                  onStart={() => handleStartGame()}
                  onSelectInject={(inject) => {
                    setPendingDecision(inject);
                    setSelectedAsset(null);
                    setAssetOwnerBriefed(false);
                  }}
                  difficulty={difficulty}
                  onOpenDifficultyPicker={() => setShowDifficultyPicker(true)}
                  personalBest={personalBest}
                />
              )}
            </div>
          )}

          {/* Mobile COP Tab */}
          {mobileTab === 'cop' && (
            <div className={clsx('flex-1 overflow-y-auto', !reducedMotion && 'animate-tab-enter')}>
              {/* Stats with Icons */}
              <div className="p-4 border-b border-gray-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Situation Board</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat
                    label="Facts"
                    value={stats.totalFacts}
                    color="emerald"
                    icon={CheckCircle}
                    animating={consequenceAnimation?.active}
                    reducedMotion={reducedMotion}
                  />
                  <MiniStat
                    label="Assumed"
                    value={stats.totalAssumptions}
                    color="amber"
                    icon={HelpCircle}
                    animating={consequenceAnimation?.active}
                    reducedMotion={reducedMotion}
                  />
                  <MiniStat
                    label="Unknown"
                    value={stats.totalUnknowns}
                    color="red"
                    icon={AlertCircle}
                    animating={consequenceAnimation?.active}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>

              {/* Visual COP Zone Display - Mobile */}
              <div className="p-4 border-b border-gray-800/50">
                <COPZoneDisplay
                  zoneHeatLevels={zoneHeatLevels}
                  overallResidualRisk={overallResidualRisk}
                  stakeholderTrust={stakeholderTrust}
                  reducedMotion={reducedMotion}
                  animating={!!consequenceAnimation?.active}
                />
              </div>

              {/* Assets */}
              <div className="p-4 border-b border-gray-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Assets at Risk</h3>
                </div>
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      className={clsx(
                        'w-full p-4 rounded-xl border text-left transition-all touch-target',
                        selectedAsset?.id === asset.id
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-gray-800/30 border-gray-700/40 active:bg-gray-800/50'
                      )}
                      onClick={() => {
                        if (pendingDecision) {
                          setSelectedAsset(asset);
                          setMobileTab('decision');
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-medium text-gray-200">{asset.name}</span>
                        <span
                          className={clsx(
                            'text-xs px-2 py-1 rounded font-bold',
                            asset.criticality === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          )}
                        >
                          {asset.criticality}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{asset.owner.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Decision History */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Decision Log</h3>
                <div className="space-y-3">
                  {log.decisions
                    .slice()
                    .reverse()
                    .map((decision) => (
                      <div
                        key={decision.id}
                        className={clsx(
                          'p-4 rounded-xl border',
                          POSTURE_CONFIG[decision.posture].bgColor,
                          POSTURE_CONFIG[decision.posture].borderColor
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={clsx(
                              'text-sm font-bold',
                              POSTURE_CONFIG[decision.posture].color
                            )}
                          >
                            {decision.posture}
                          </span>
                        </div>
                        <span className="text-sm text-gray-300">{decision.title}</span>
                      </div>
                    ))}
                  {log.decisions.length === 0 && (
                    <div className="text-center py-8">
                      <Briefcase className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No decisions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Score Popup */}
      {showScorePopup && (
        <div
          className={clsx(
            'fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none',
            !reducedMotion && 'animate-score-popup'
          )}
        >
          <div
            className={clsx(
              'px-8 py-4 rounded-2xl border-2 text-center',
              showScorePopup.points > 0
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-red-500/20 border-red-500/50 text-red-400'
            )}
          >
            <div className="text-4xl font-black font-mono">
              {showScorePopup.points > 0 ? '+' : ''}
              {showScorePopup.points}
            </div>
            <div className="text-sm font-medium mt-1">{showScorePopup.message}</div>
          </div>
        </div>
      )}

      {/* Field Guide JIT Tip */}
      {activeFieldGuideTip && (
        <FieldGuideTip term={activeFieldGuideTip} onDismiss={() => setActiveFieldGuideTip(null)} />
      )}

      {/* Debrief Modal */}
      {showDebrief && (
        <DebriefModal
          log={log}
          gameState={gameState}
          grade={calculateGrade()}
          elapsedSeconds={elapsedSeconds}
          onClose={() => setShowDebrief(false)}
          personalBest={personalBest}
          isNewPersonalBest={isNewPersonalBest}
          difficulty={difficulty}
          calcTrails={calcTrails}
          scenarioId={scenarioId}
          onRematch={() => {
            setShowDebrief(false);
            setIsNewPersonalBest(false);
            setLog(initialLog);
            setElapsedSeconds(0);
            setGameState({
              score: 0,
              streak: 0,
              maxStreak: 0,
              decisionsCorrect: 0,
              decisionsTotal: 0,
              injectsHandled: 0,
              assetsProtected: 0,
              assetOwnersBriefed: 0,
              crossDomainBonus: 0,
              timeBonus: 0,
              esrmBonus: 0,
              comboMultiplier: 1,
            });
            processedInjectsRef.current = new Set();
            setPendingDecision(null);
            setSelectedAsset(null);
            setAssetOwnerBriefed(false);
            setResidualRiskNote('');
            setSelectedTreatmentCategory(null);
            setSelectedTreatmentOption(null);
            setSelectedResidualRisk(null);
            setTreatmentBonusGiven(false);
            setActiveMicroTask(null);
            setCompletedMicroTasks([]);
            setSkippedMicroTasks([]);
            setCalcTrails([]);
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }}
        />
      )}

      {/* Consequence Theatre Overlay */}
      <ConsequenceTheatreOverlay animation={consequenceAnimation} reducedMotion={reducedMotion} />

      {/* Difficulty Picker Modal */}
      {showDifficultyPicker && (
        <DifficultyPickerModal
          currentDifficulty={difficulty}
          onSelect={(d) => {
            setDifficulty(d);
            saveDifficulty(d);
            setShowDifficultyPicker(false);
          }}
          onClose={() => setShowDifficultyPicker(false)}
        />
      )}

      {/* Field Guide Modal */}
      {showFieldGuide && <FieldGuideModal onClose={() => setShowFieldGuide(false)} />}

      {/* Tactical Actions Panel */}
      {showTacticalPanel && (
        <TacticalActionsPanel
          tacticalState={tacticalState}
          availableResources={{
            guards: dispatchResources.guards.available,
            analysts: dispatchResources.analysts.available,
            responders: dispatchResources.responders.available,
          }}
          onDeploy={handleDeployTacticalAction}
          onClose={() => setShowTacticalPanel(false)}
          lastFeedback={lastDeploymentFeedback}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Value Metrics Panel */}
      {showValuePanel && valueMetrics && (
        <ValueMetricsPanel
          metrics={valueMetrics}
          calcTrails={calcTrails}
          onClose={() => setShowValuePanel(false)}
        />
      )}

      {/* KRI Dashboard Panel */}
      {showKRIPanel && kriDashboard && (
        <KRIDashboardPanel dashboard={kriDashboard} onClose={() => setShowKRIPanel(false)} />
      )}

      {/* Pipeline Health Panel */}
      {showPipelinePanel && pipelineHealth && (
        <PipelineHealthPanel health={pipelineHealth} onClose={() => setShowPipelinePanel(false)} />
      )}

      {/* Coach Marks - First Run Help */}
      {showCoachMarks && !isRunning && revealedInjects.length === 0 && (
        <CoachMarks onDismiss={() => setShowCoachMarks(false)} />
      )}

      {/* Entity Link Panel */}
      {showEntityPanel && log.linkedEntities && (
        <EntityLinkPanel
          entities={log.linkedEntities}
          injects={log.injects}
          highlightedEntityId={highlightedEntityId}
          onHighlightEntity={setHighlightedEntityId}
          onClose={() => setShowEntityPanel(false)}
        />
      )}

      {/* Resource Contention Warning */}
      {resourceContention && <ResourceContentionWarning message={resourceContention} />}

      {/* ESRM Cascade Effect Overlay */}
      {esrmCascadeActive && (
        <div className="fixed inset-0 pointer-events-none z-30 bg-gradient-to-b from-red-500/5 to-transparent animate-pulse" />
      )}

      {/* Resume Session Prompt */}
      {showResumePrompt && savedSession && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4 animate-modal-backdrop">
          <div
            className={clsx(
              'bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl',
              !reducedMotion && 'animate-modal-enter'
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Session Found</h2>
                <p className="text-xs text-gray-500">
                  {Math.floor(savedSession.elapsedSeconds / 60)}m elapsed •{' '}
                  {savedSession.gameState.decisionsTotal} decisions
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              You have an in-progress session for this scenario. Would you like to resume where you
              left off?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleResumeSession}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all animate-press"
              >
                Resume Session
              </button>
              <button
                onClick={handleStartFresh}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-semibold border border-gray-700 hover:bg-gray-700 transition-all animate-press"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4 animate-modal-backdrop">
          <div
            className={clsx(
              'bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl',
              !reducedMotion && 'animate-modal-enter'
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Leave Mission?</h2>
                <p className="text-xs text-gray-500">Your progress will be saved</p>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Your session ({Math.floor(elapsedSeconds / 60)}m, {gameState.decisionsTotal}{' '}
              decisions, {gameState.score} pts) will be saved. You can resume when you return.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-semibold border border-gray-700 hover:bg-gray-700 transition-all animate-press"
              >
                Continue Mission
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-3 rounded-xl bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-press"
              >
                Exit & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESRM Micro-Task Overlay - Fills wait gaps */}
      {activeMicroTask && !pendingDecision && (
        <MicroTaskCard
          task={activeMicroTask}
          timer={microTaskTimer}
          onSubmitAnswer={submitMicroTaskAnswer}
          onDismiss={dismissMicroTask}
          onSkip={skipMicroTask}
          reducedMotion={reducedMotion}
          animating={microTaskAnimating}
          currentAnswer={microTaskAnswer}
          result={microTaskResult}
          showExplanation={microTaskExplanationShown}
        />
      )}

      {/* Light-touch Guidance Popup */}
      <GuidancePopup
        reducedMotion={reducedMotion}
        onNavigateToSurface={(surface: GuidanceSurface) => {
          if (surface === 'INTEL_FEED') handleTabChange('intel');
          else if (surface === 'COP_LAYERS') handleTabChange('cop');
          else if (surface === 'DECISION_POSTURE') handleTabChange('decision');
          else if (surface === 'TACTICAL') setShowTacticalPanel(true);
          else if (surface === 'TEAM_STAKEHOLDERS') setShowLeadershipPanel(true);
          else if (surface === 'KRI_VALUE') setShowKRIPanel(true);
          else if (surface === 'FIELD_GUIDE') setShowFieldGuide(true);
        }}
      />
    </div>
  );
}

/**
 * Get icon component for intake channel
 */
function getChannelIcon(channel: IntakeChannel): typeof Shield {
  const iconMap: Record<IntakeChannel, typeof Shield> = {
    ACS: DoorOpen,
    VMS: Video,
    ALARM: AlertTriangle,
    SIEM: Cpu,
    OSINT: Brain,
    TIP: MessageSquare,
    RADIO: Radio,
    FACILITIES: Building,
    VENDOR: Package,
    EXECUTIVE: Crown,
    LE: Shield,
  };
  return iconMap[channel] || Radio;
}

/**
 * Get confidence indicator color and icon
 */
function getConfidenceDisplay(confidence: string): {
  color: string;
  bgColor: string;
  label: string;
} {
  const displays: Record<string, { color: string; bgColor: string; label: string }> = {
    VERIFIED: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', label: 'Verified' },
    HIGH: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'High' },
    MEDIUM: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', label: 'Med' },
    LOW: { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'Low' },
    UNVERIFIED: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Unverified' },
    CONFLICTING: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Conflicting' },
  };
  return displays[confidence] || displays.MEDIUM;
}

function InjectCard({
  inject,
  index,
  isHandled,
  isActive,
  onSelect,
  reducedMotion,
  linkedEntities,
  highlightedEntityId,
}: {
  inject: ScenarioInject;
  index: number;
  isHandled: boolean;
  isActive: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
  linkedEntities?: LinkedEntity[];
  highlightedEntityId?: string | null;
}): JSX.Element {
  const extendedInject = inject as unknown as {
    domain?: SecurityDomain;
    urgencyLevel?: string;
    linkedEntityIds?: string[];
    triagePriority?: string;
    resourcesRequired?: { guards?: number; analysts?: number; responders?: number };
    intake?: IntakeMetadata;
  };
  const domain = extendedInject.domain;
  const config = domain ? DOMAIN_CONFIG[domain] : null;
  const urgency = extendedInject.urgencyLevel;
  const linkedEntityIds = extendedInject.linkedEntityIds || [];
  const hasHighlightedEntity = highlightedEntityId && linkedEntityIds.includes(highlightedEntityId);
  const resourcesNeeded = extendedInject.resourcesRequired;
  const hasResourceRequirement =
    resourcesNeeded &&
    (resourcesNeeded.guards || resourcesNeeded.analysts || resourcesNeeded.responders);

  // Intake channel metadata
  const intake = extendedInject.intake;
  const channelConfig = intake?.channel ? INTAKE_CHANNELS[intake.channel] : null;
  const ChannelIcon = intake?.channel ? getChannelIcon(intake.channel) : Radio;
  const confidenceDisplay = intake?.confidence ? getConfidenceDisplay(intake.confidence) : null;
  const hasAttachments = intake?.attachments && intake.attachments.length > 0;
  const isCorrection = intake?.isCorrection;
  const isNoise = intake?.isNoise;
  const isPendingVerification = intake?.pendingVerification;

  const getEntityChips = (): LinkedEntity[] | null => {
    if (!linkedEntities || linkedEntityIds.length === 0) return null;
    const entities = linkedEntities.filter((e) => linkedEntityIds.includes(e.id)).slice(0, 3);
    return entities;
  };

  const entityChips = getEntityChips();

  return (
    <button
      onClick={onSelect}
      disabled={isHandled}
      className={clsx(
        'w-full text-left p-4 rounded-xl border transition-all duration-200 animate-press',
        !reducedMotion && index === 0 && 'animate-inject-arrive',
        hasHighlightedEntity && 'ring-2 ring-cyan-500/50',
        isNoise && !isHandled && 'opacity-70',
        isHandled
          ? 'bg-gray-800/20 border-gray-800/40 opacity-60'
          : isActive
            ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-500/50 ring-2 ring-emerald-500/30'
            : isCorrection
              ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/40 hover:border-purple-400/60'
              : 'bg-gray-800/30 border-gray-700/40 hover:border-gray-600/60 hover:bg-gray-800/50'
      )}
    >
      {/* Top row: Channel badge and urgency */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Intake Channel Badge */}
          {channelConfig && (
            <span
              className={clsx(
                'flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded',
                channelConfig.bgColor,
                channelConfig.color
              )}
              title={`${channelConfig.name}${intake?.sourceSystem ? ` - ${intake.sourceSystem}` : ''}`}
            >
              <ChannelIcon className="w-3 h-3" />
              {channelConfig.shortName}
            </span>
          )}
          {/* Correction/Update badge */}
          {isCorrection && (
            <span className="flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
              <RefreshCw className="w-3 h-3" />
              UPDATE
            </span>
          )}
          {/* Urgency badge */}
          {urgency === 'IMMEDIATE' && !isNoise && (
            <span className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              URGENT
            </span>
          )}
          {/* Domain badge (only if no channel or for context) */}
          {config && !channelConfig && (
            <span
              className={clsx(
                'text-2xs font-semibold px-2 py-0.5 rounded',
                config.bgColor,
                config.color
              )}
            >
              {config.label}
            </span>
          )}
          {/* Noise/Low-priority indicator */}
          {isNoise && (
            <span className="flex items-center gap-1 text-2xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-500">
              <EyeOff className="w-3 h-3" />
              Routine
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Confidence indicator */}
          {confidenceDisplay && !isHandled && (
            <span
              className={clsx(
                'flex items-center gap-0.5 text-2xs px-1.5 py-0.5 rounded',
                confidenceDisplay.bgColor,
                confidenceDisplay.color
              )}
              title={`Confidence: ${intake?.confidence}`}
            >
              <Signal className="w-2.5 h-2.5" />
              {confidenceDisplay.label}
            </span>
          )}
          {/* Attachments indicator */}
          {hasAttachments && !isHandled && (
            <span
              className="flex items-center gap-0.5 text-2xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400"
              title={`${intake?.attachments?.length} attachment(s)`}
            >
              <Paperclip className="w-2.5 h-2.5" />
              {intake?.attachments?.length}
            </span>
          )}
          {/* Pending verification indicator */}
          {isPendingVerification && !isHandled && (
            <span
              className="flex items-center text-2xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400"
              title="Pending verification"
            >
              <Eye className="w-2.5 h-2.5" />
            </span>
          )}
          {isHandled && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
        </div>
      </div>

      {/* Resource requirements */}
      {hasResourceRequirement && !isHandled && (
        <div className="flex items-center gap-1 mb-2">
          <span className="flex items-center gap-1 text-2xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-400">
            <Users className="w-3 h-3" />
            Requires:
            {resourcesNeeded?.guards ? ` ${resourcesNeeded.guards}G` : ''}
            {resourcesNeeded?.analysts ? ` ${resourcesNeeded.analysts}A` : ''}
            {resourcesNeeded?.responders ? ` ${resourcesNeeded.responders}R` : ''}
          </span>
        </div>
      )}

      <h4
        className={clsx(
          'text-sm font-semibold mb-1.5',
          isHandled ? 'text-gray-500' : 'text-gray-200'
        )}
      >
        {inject.title}
      </h4>

      <p
        className={clsx(
          'text-xs leading-relaxed line-clamp-2',
          isHandled ? 'text-gray-600' : 'text-gray-400'
        )}
      >
        {inject.content}
      </p>

      {/* Entity chips */}
      {entityChips && entityChips.length > 0 && !isHandled && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          <Link2 className="w-3 h-3 text-cyan-500/60" />
          {entityChips.map((entity) => {
            const eConfig = ENTITY_TYPE_CONFIG[entity.type];
            const isHighlighted = highlightedEntityId === entity.id;
            return (
              <span
                key={entity.id}
                className={clsx(
                  'text-2xs px-1.5 py-0.5 rounded transition-all',
                  isHighlighted
                    ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/50'
                    : `${eConfig.bgColor} ${eConfig.color}`
                )}
              >
                {entity.shortName || entity.name}
              </span>
            );
          })}
          {linkedEntityIds.length > 3 && (
            <span className="text-2xs text-gray-500">+{linkedEntityIds.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: Source system and timestamp */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-700/30">
        <div className="flex items-center gap-2">
          <span className="text-2xs text-gray-500">{intake?.sourceSystem || inject.source}</span>
          {intake?.sourceId && (
            <span className="text-2xs text-gray-600 font-mono">[{intake.sourceId}]</span>
          )}
        </div>
        {!isHandled && <ChevronRight className="w-4 h-4 text-gray-600" />}
      </div>
    </button>
  );
}

function DecisionConsole({
  inject,
  assets,
  selectedAsset,
  onSelectAsset,
  assetOwnerBriefed,
  onToggleBriefed,
  residualRiskNote: _residualRiskNote,
  onResidualRiskChange,
  decisionTimer,
  onCommit,
  reducedMotion,
  decisionPromptVariation,
  selectedTreatmentCategory,
  onSelectTreatmentCategory,
  selectedTreatmentOption,
  onSelectTreatmentOption,
  selectedResidualRisk,
  onSelectResidualRisk,
}: {
  inject: ScenarioInject;
  assets: ProtectedAsset[];
  selectedAsset: ProtectedAsset | null;
  onSelectAsset: (asset: ProtectedAsset) => void;
  assetOwnerBriefed: boolean;
  onToggleBriefed: () => void;
  residualRiskNote: string;
  onResidualRiskChange: (note: string) => void;
  decisionTimer: number;
  onCommit: (posture: DecisionPosture) => void;
  reducedMotion: boolean;
  decisionPromptVariation?: { header: string; subtext: string };
  selectedTreatmentCategory: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID' | null;
  onSelectTreatmentCategory: (
    category: 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID' | null
  ) => void;
  selectedTreatmentOption: string | null;
  onSelectTreatmentOption: (option: string | null) => void;
  selectedResidualRisk: string | null;
  onSelectResidualRisk: (risk: string | null) => void;
}): JSX.Element {
  const extendedInject = inject as unknown as {
    domain?: SecurityDomain;
    expectedPostureImpact?: DecisionPosture;
  };
  const domain = extendedInject.domain;
  const config = domain ? DOMAIN_CONFIG[domain] : null;
  const isTimeCritical = decisionTimer <= DECISION_TIMER_CONFIG.CRITICAL_THRESHOLD;
  const isWarning = decisionTimer <= DECISION_TIMER_CONFIG.WARNING_THRESHOLD;
  const promptVariation = decisionPromptVariation || DECISION_PROMPT_VARIATIONS[0];

  // Note: residualRiskNote passed to parent; we use structured selection here
  void _residualRiskNote;

  return (
    <div
      className={clsx('flex-1 flex flex-col overflow-hidden', !reducedMotion && 'animate-fade-in')}
    >
      {/* Decision Timer Bar */}
      <div
        className={clsx(
          'h-2 transition-all duration-300',
          isTimeCritical ? 'bg-red-900/50' : 'bg-gray-900/50'
        )}
      >
        <div
          className={clsx(
            'h-full transition-all duration-1000',
            isTimeCritical
              ? 'bg-gradient-to-r from-red-600 to-red-400'
              : isWarning
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
          )}
          style={{ width: `${(decisionTimer / DECISION_TIMER_CONFIG.BASE_TIMER) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
          {/* Intel Card */}
          <div
            className={clsx(
              'p-6 rounded-2xl border-2 relative overflow-hidden',
              config
                ? `bg-gradient-to-br ${config.bgColor} ${config.borderColor}`
                : 'bg-gray-800/30 border-gray-700/40'
            )}
          >
            {config && (
              <div
                className={clsx(
                  'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20',
                  `bg-gradient-to-br ${config.gradient}`
                )}
              />
            )}

            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                {config && (
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                      `bg-gradient-to-br ${config.gradient}`
                    )}
                  >
                    <config.icon className="w-7 h-7 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">{inject.title}</h2>
                  <p className="text-gray-300 leading-relaxed">{inject.content}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                      isTimeCritical
                        ? 'bg-red-500/20 border border-red-500/40'
                        : isWarning
                          ? 'bg-amber-500/20 border border-amber-500/40'
                          : 'bg-emerald-500/20 border border-emerald-500/40'
                    )}
                  >
                    <Timer
                      className={clsx(
                        'w-4 h-4',
                        isTimeCritical
                          ? 'text-red-400 animate-pulse'
                          : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      )}
                    />
                    <span
                      className={clsx(
                        'font-mono text-xl font-bold tabular-nums',
                        isTimeCritical
                          ? 'text-red-400 animate-pulse'
                          : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      )}
                    >
                      {decisionTimer}s
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">to decide</div>
                </div>
              </div>

              {inject.decisionPressure && (
                <div
                  className={clsx(
                    'p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4',
                    !reducedMotion && 'animate-slide-in-up'
                  )}
                >
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    {promptVariation.header}
                  </div>
                  <p className="text-amber-200/80 text-sm">{promptVariation.subtext}</p>
                  <p className="text-amber-200/60 text-xs mt-2">{inject.decisionPressure}</p>
                </div>
              )}
            </div>
          </div>

          {/* ESRM: Asset Selection */}
          <div className="p-5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-gray-200">1. Identify Affected Asset</h3>
              {selectedAsset && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className={clsx(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    selectedAsset?.id === asset.id
                      ? 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/20'
                      : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-200">{asset.name}</span>
                    <span
                      className={clsx(
                        'text-2xs px-1.5 py-0.5 rounded font-bold uppercase',
                        asset.criticality === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      )}
                    >
                      {asset.criticality}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Owner: {asset.owner.name}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{asset.currentExposure}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ESRM: Advisor → Asset Owner Workflow */}
          {selectedAsset && (
            <div
              className={clsx(
                'p-5 rounded-2xl border transition-all',
                assetOwnerBriefed
                  ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/40'
                  : 'bg-gray-800/30 border-gray-700/40'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-gray-200">2. Advisor → Owner Handoff</h3>
                </div>
                <span className="text-xs text-emerald-400 font-medium">+75 pts</span>
              </div>

              {/* Owner Info Card */}
              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/40 mb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-200">{selectedAsset.owner.name}</p>
                    <p className="text-sm text-gray-400">{selectedAsset.owner.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedAsset.owner.organization}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={clsx(
                        'text-xs px-2 py-1 rounded font-semibold',
                        selectedAsset.owner.riskTolerance === 'LOW'
                          ? 'bg-red-500/20 text-red-400'
                          : selectedAsset.owner.riskTolerance === 'HIGH'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                      )}
                    >
                      {selectedAsset.owner.riskTolerance} Tolerance
                    </div>
                    <p className="text-2xs text-gray-600 mt-1">
                      {selectedAsset.owner.contactMethod}
                    </p>
                  </div>
                </div>
              </div>

              {/* Briefing Workflow Steps */}
              <div className="space-y-2 mb-4">
                <div
                  className={clsx(
                    'flex items-center gap-3 p-2 rounded-lg transition-all',
                    assetOwnerBriefed ? 'bg-emerald-500/10' : 'bg-gray-800/30'
                  )}
                >
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      assetOwnerBriefed
                        ? 'bg-emerald-500/30 text-emerald-400'
                        : 'bg-gray-700 text-gray-500'
                    )}
                  >
                    {assetOwnerBriefed ? '✓' : '1'}
                  </div>
                  <div className="flex-1">
                    <span className={assetOwnerBriefed ? 'text-emerald-400' : 'text-gray-400'}>
                      Communicate risk assessment to owner
                    </span>
                  </div>
                </div>
                <div
                  className={clsx(
                    'flex items-center gap-3 p-2 rounded-lg transition-all',
                    assetOwnerBriefed ? 'bg-emerald-500/10' : 'bg-gray-800/30'
                  )}
                >
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      assetOwnerBriefed
                        ? 'bg-emerald-500/30 text-emerald-400'
                        : 'bg-gray-700 text-gray-500'
                    )}
                  >
                    {assetOwnerBriefed ? '✓' : '2'}
                  </div>
                  <div className="flex-1">
                    <span className={assetOwnerBriefed ? 'text-emerald-400' : 'text-gray-400'}>
                      Receive owner acknowledgment
                    </span>
                  </div>
                </div>
              </div>

              {/* Brief Button */}
              <button
                onClick={onToggleBriefed}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all',
                  assetOwnerBriefed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-violet-500/20 text-violet-400 border border-violet-500/40 hover:bg-violet-500/30'
                )}
              >
                <Phone className="w-5 h-5" />
                {assetOwnerBriefed ? 'Owner Briefed & Affirmed ✓' : 'Brief Asset Owner Now'}
              </button>

              {/* ESRM Principle Reminder */}
              <div className="mt-3 p-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <p className="text-xs text-violet-300 italic text-center">
                  &ldquo;Security advises; asset owner owns the risk.&rdquo; — ESRM Core Principle
                </p>
              </div>
            </div>
          )}

          {/* ESRM: Risk Assessment Quick View */}
          {selectedAsset && (
            <div className="p-5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-gray-200">Risk Assessment</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                  <div className="text-xs text-cyan-400 font-semibold mb-1">Threat</div>
                  <div className="text-lg font-bold text-cyan-300">
                    {(inject as unknown as { urgencyLevel?: string }).urgencyLevel === 'IMMEDIATE'
                      ? 'HIGH'
                      : (inject as unknown as { urgencyLevel?: string }).urgencyLevel === 'URGENT'
                        ? 'MEDIUM'
                        : 'LOW'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <div className="text-xs text-amber-400 font-semibold mb-1">Vulnerability</div>
                  <div className="text-lg font-bold text-amber-300">
                    {selectedAsset.criticality === 'CRITICAL'
                      ? 'HIGH'
                      : selectedAsset.criticality === 'HIGH'
                        ? 'MEDIUM'
                        : 'LOW'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                  <div className="text-xs text-red-400 font-semibold mb-1">Impact</div>
                  <div className="text-lg font-bold text-red-300">
                    {selectedAsset.criticality === 'CRITICAL'
                      ? 'MAJOR'
                      : selectedAsset.criticality === 'HIGH'
                        ? 'MODERATE'
                        : 'MINOR'}
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-gray-800/60 flex items-center justify-between">
                <span className="text-xs text-gray-400">Calculated Risk Level:</span>
                <span
                  className={clsx(
                    'text-sm font-bold px-2 py-0.5 rounded',
                    (inject as unknown as { urgencyLevel?: string }).urgencyLevel === 'IMMEDIATE' &&
                      selectedAsset.criticality === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400'
                      : (inject as unknown as { urgencyLevel?: string }).urgencyLevel ===
                            'IMMEDIATE' || selectedAsset.criticality === 'CRITICAL'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-amber-500/20 text-amber-400'
                  )}
                >
                  {(inject as unknown as { urgencyLevel?: string }).urgencyLevel === 'IMMEDIATE' &&
                  selectedAsset.criticality === 'CRITICAL'
                    ? 'CRITICAL'
                    : (inject as unknown as { urgencyLevel?: string }).urgencyLevel ===
                          'IMMEDIATE' || selectedAsset.criticality === 'CRITICAL'
                      ? 'HIGH'
                      : 'MEDIUM'}
                </span>
              </div>
            </div>
          )}

          {/* ESRM: Treatment Selection - All 4 Options with Icons */}
          {selectedAsset && (
            <div className="p-5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-gray-200">3. Select Risk Treatment</h3>
              </div>

              {/* Step 1: Select Treatment Category with Icons */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {(
                  [
                    {
                      posture: 'CONTINUE' as DecisionPosture,
                      treatment: 'ACCEPT' as const,
                      desc: 'Risk within tolerance',
                      color: 'emerald',
                      key: 'C',
                      Icon: ThumbsUp,
                    },
                    {
                      posture: 'DEGRADE' as DecisionPosture,
                      treatment: 'MITIGATE' as const,
                      desc: 'Apply controls',
                      color: 'amber',
                      key: 'D',
                      Icon: Wrench,
                    },
                    {
                      posture: 'DEGRADE' as DecisionPosture,
                      treatment: 'TRANSFER' as const,
                      desc: 'Shift to third party',
                      color: 'blue',
                      key: 'T',
                      Icon: ArrowRightLeft,
                    },
                    {
                      posture: 'PAUSE' as DecisionPosture,
                      treatment: 'AVOID' as const,
                      desc: 'Eliminate exposure',
                      color: 'red',
                      key: 'P',
                      Icon: Ban,
                    },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.treatment}
                    onClick={() => {
                      onSelectTreatmentCategory(option.treatment);
                      onSelectTreatmentOption(null);
                    }}
                    disabled={!selectedAsset}
                    className={clsx(
                      'relative p-4 rounded-xl border-2 transition-all duration-200 group overflow-hidden text-left',
                      'hover:scale-[1.02] active:scale-[0.98]',
                      selectedTreatmentCategory === option.treatment &&
                        option.color === 'emerald' &&
                        'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50',
                      selectedTreatmentCategory === option.treatment &&
                        option.color === 'amber' &&
                        'border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50',
                      selectedTreatmentCategory === option.treatment &&
                        option.color === 'blue' &&
                        'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/50',
                      selectedTreatmentCategory === option.treatment &&
                        option.color === 'red' &&
                        'border-red-500 bg-red-500/20 ring-2 ring-red-500/50',
                      selectedTreatmentCategory !== option.treatment &&
                        option.color === 'emerald' &&
                        'border-emerald-500/40 hover:bg-emerald-500/10',
                      selectedTreatmentCategory !== option.treatment &&
                        option.color === 'amber' &&
                        'border-amber-500/40 hover:bg-amber-500/10',
                      selectedTreatmentCategory !== option.treatment &&
                        option.color === 'blue' &&
                        'border-blue-500/40 hover:bg-blue-500/10',
                      selectedTreatmentCategory !== option.treatment &&
                        option.color === 'red' &&
                        'border-red-500/40 hover:bg-red-500/10',
                      'bg-gradient-to-br from-gray-800/60 to-gray-900/40'
                    )}
                  >
                    {/* Treatment Icon */}
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                        option.color === 'emerald' && 'bg-emerald-500/20',
                        option.color === 'amber' && 'bg-amber-500/20',
                        option.color === 'blue' && 'bg-blue-500/20',
                        option.color === 'red' && 'bg-red-500/20'
                      )}
                    >
                      <option.Icon
                        className={clsx(
                          'w-5 h-5',
                          option.color === 'emerald' && 'text-emerald-400',
                          option.color === 'amber' && 'text-amber-400',
                          option.color === 'blue' && 'text-blue-400',
                          option.color === 'red' && 'text-red-400'
                        )}
                      />
                    </div>
                    <div className="relative z-10">
                      <div
                        className={clsx(
                          'text-sm sm:text-base font-bold mb-0.5 whitespace-nowrap',
                          option.color === 'emerald' && 'text-emerald-400',
                          option.color === 'amber' && 'text-amber-400',
                          option.color === 'blue' && 'text-blue-400',
                          option.color === 'red' && 'text-red-400'
                        )}
                        title={option.treatment}
                      >
                        {option.treatment}
                      </div>
                      <div className="text-2xs sm:text-xs text-gray-400 mb-1">
                        → {option.posture}
                      </div>
                      <p className="text-2xs text-gray-500 leading-tight">{option.desc}</p>
                      <div className="mt-2 text-2xs text-gray-600 font-mono">[{option.key}]</div>
                    </div>
                    {selectedTreatmentCategory === option.treatment && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Step 2: Select Concrete Action (shown when category selected) */}
              {selectedTreatmentCategory && (
                <div className="mb-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/40">
                  <label className="block text-xs text-gray-400 mb-3">
                    Select specific action for {selectedTreatmentCategory}:
                  </label>
                  <div className="space-y-2">
                    {TREATMENT_OPTIONS[selectedTreatmentCategory].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => onSelectTreatmentOption(opt.id)}
                        className={clsx(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          selectedTreatmentOption === opt.id
                            ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/50'
                            : 'border-gray-700/50 bg-gray-900/40 hover:bg-gray-800/60 hover:border-gray-600'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {selectedTreatmentOption === opt.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <CircleDot className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-200">{opt.label}</div>
                            <div className="text-2xs text-gray-500">{opt.detail}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Structured Residual Risk with Level Icons */}
              {selectedTreatmentCategory && selectedTreatmentOption && (
                <div className="mb-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/40">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-4 h-4 text-gray-400" />
                    <label className="text-xs text-gray-400">
                      Residual Risk Level <span className="text-emerald-400">(+50 pts)</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    {RESIDUAL_RISK_OPTIONS.map((opt) => {
                      const LevelIcon =
                        RESIDUAL_LEVEL_ICONS[opt.level as keyof typeof RESIDUAL_LEVEL_ICONS] ||
                        Gauge;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            onSelectResidualRisk(opt.id);
                            onResidualRiskChange(opt.rationale);
                          }}
                          className={clsx(
                            'w-full p-3 rounded-lg border text-left transition-all',
                            selectedResidualRisk === opt.id
                              ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/50'
                              : 'border-gray-700/50 bg-gray-900/40 hover:bg-gray-800/60 hover:border-gray-600'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {/* Risk Level Icon */}
                            <div
                              className={clsx(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                opt.level === 'LOW' && 'bg-emerald-500/20',
                                opt.level === 'MEDIUM' && 'bg-amber-500/20',
                                opt.level === 'HIGH' && 'bg-orange-500/20',
                                opt.level === 'CRITICAL' && 'bg-red-500/20'
                              )}
                            >
                              <LevelIcon
                                className={clsx(
                                  'w-4 h-4',
                                  opt.level === 'LOW' && 'text-emerald-400',
                                  opt.level === 'MEDIUM' && 'text-amber-400',
                                  opt.level === 'HIGH' && 'text-orange-400',
                                  opt.level === 'CRITICAL' && 'text-red-400'
                                )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-200">
                                  {opt.label}
                                </span>
                                <span
                                  className={clsx(
                                    'text-2xs px-1.5 py-0.5 rounded font-semibold',
                                    opt.level === 'LOW' && 'bg-emerald-500/20 text-emerald-400',
                                    opt.level === 'MEDIUM' && 'bg-amber-500/20 text-amber-400',
                                    opt.level === 'HIGH' && 'bg-orange-500/20 text-orange-400',
                                    opt.level === 'CRITICAL' && 'bg-red-500/20 text-red-400'
                                  )}
                                >
                                  {opt.level}
                                </span>
                              </div>
                              <div className="text-2xs text-gray-500 mt-0.5 line-clamp-1">
                                {opt.rationale}
                              </div>
                            </div>
                            {selectedResidualRisk === opt.id && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Commit Button */}
              {selectedTreatmentCategory && selectedTreatmentOption && selectedResidualRisk && (
                <button
                  onClick={() => {
                    const postureMap: Record<string, DecisionPosture> = {
                      ACCEPT: 'CONTINUE',
                      MITIGATE: 'DEGRADE',
                      TRANSFER: 'DEGRADE',
                      AVOID: 'PAUSE',
                    };
                    onCommit(postureMap[selectedTreatmentCategory]);
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Commit Decision
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IdleState({
  isRunning,
  revealedInjects,
  decisions,
  onStart,
  onSelectInject,
  difficulty,
  onOpenDifficultyPicker,
  personalBest,
}: {
  isRunning: boolean;
  revealedInjects: ScenarioInject[];
  decisions: { title: string }[];
  onStart: () => void;
  onSelectInject: (inject: ScenarioInject) => void;
  difficulty: DifficultyLevel;
  onOpenDifficultyPicker: () => void;
  personalBest: PersonalBest | null;
}): JSX.Element {
  const unhandled = revealedInjects.filter((i) => !decisions.some((d) => d.title === i.title));
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  if (!isRunning && revealedInjects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-12 h-12 text-emerald-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Command Center Ready</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            You are the GSOC Watch Commander. An incident is developing. Start the clock to begin
            receiving intel and making posture decisions.
          </p>

          {/* Difficulty Selector */}
          <button
            onClick={onOpenDifficultyPicker}
            className={clsx(
              'mb-6 px-4 py-2 rounded-xl border flex items-center gap-2 mx-auto transition-all hover:scale-105',
              diffConfig.color === 'emerald' &&
                'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
              diffConfig.color === 'amber' && 'bg-amber-500/10 border-amber-500/40 text-amber-400',
              diffConfig.color === 'red' && 'bg-red-500/10 border-red-500/40 text-red-400'
            )}
          >
            <Settings className="w-4 h-4" />
            <span className="font-semibold">
              {diffConfig.icon} {diffConfig.label}
            </span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>

          {/* Personal Best Display */}
          {personalBest && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">Personal Best</span>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-amber-300">
                    {personalBest.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
                <div className="w-px h-8 bg-amber-500/30" />
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-amber-300">
                    {personalBest.grade}
                  </div>
                  <div className="text-xs text-gray-500">Grade</div>
                </div>
                <div className="w-px h-8 bg-amber-500/30" />
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-amber-300">
                    {personalBest.maxStreak}x
                  </div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onStart}
            className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Play className="w-6 h-6" />
              Begin Mission
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (unhandled.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            {unhandled.length} Intel Awaiting Response
          </h2>
          <p className="text-gray-400 mb-6">
            Select an item from the feed to make a posture decision.
          </p>

          <button
            onClick={() => onSelectInject(unhandled[0])}
            className="px-6 py-3 rounded-xl bg-amber-500/15 text-amber-400 font-semibold hover:bg-amber-500/25 transition-all"
          >
            Respond to Oldest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
        <h2 className="text-lg font-medium text-gray-400">Monitoring for new intel...</h2>
        <p className="text-sm text-gray-600 mt-2">{decisions.length} decisions logged</p>
      </div>
    </div>
  );
}

function FieldGuideTip({
  term,
  onDismiss,
}: {
  term: string;
  onDismiss: () => void;
}): JSX.Element | null {
  const tip = getTip(term);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (tip && !hasSeenTip(term)) {
      saveSeenTip(term);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [term, tip, onDismiss]);

  if (!tip || !visible || !areTipsEnabled()) return null;

  const categoryColors = {
    treatment: 'border-emerald-500/50 bg-emerald-500/10',
    metric: 'border-blue-500/50 bg-blue-500/10',
    process: 'border-amber-500/50 bg-amber-500/10',
    role: 'border-violet-500/50 bg-violet-500/10',
  };

  return (
    <div
      className={clsx(
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] max-w-sm p-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-scale-in',
        categoryColors[tip.category]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-gray-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white">{tip.term}</span>
            <span className="text-2xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 uppercase">
              {tip.category}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{tip.shortTip}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="p-1 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  icon: Icon,
  delta,
  animating,
  reducedMotion,
}: {
  label: string;
  value: number;
  color: 'emerald' | 'amber' | 'red';
  icon?: typeof Shield;
  delta?: number;
  animating?: boolean;
  reducedMotion?: boolean;
}): JSX.Element {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div
      className={clsx(
        'p-2.5 rounded-xl border text-center relative overflow-hidden transition-all duration-300',
        colorClasses[color],
        animating && !reducedMotion && 'scale-105 ring-2 ring-white/20'
      )}
    >
      {Icon && <Icon className={clsx('w-4 h-4 mx-auto mb-1', colorClasses[color].split(' ')[0])} />}
      <div className={clsx('text-xl font-bold font-mono', colorClasses[color].split(' ')[0])}>
        {value}
      </div>
      <div className="text-2xs text-gray-500 uppercase tracking-wider">{label}</div>
      {delta !== undefined && delta !== 0 && (
        <div
          className={clsx(
            'absolute top-1 right-1 text-2xs font-bold flex items-center gap-0.5',
            !reducedMotion && 'animate-bounce',
            delta > 0 ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(delta)}
        </div>
      )}
    </div>
  );
}

/**
 * Consequence Theatre Overlay
 * Shows animated feedback when decisions affect COP/KRI/trust
 */
function ConsequenceTheatreOverlay({
  animation,
  reducedMotion,
}: {
  animation: {
    active: boolean;
    type: 'positive' | 'negative' | 'neutral';
    kriChanges: { id: string; delta: number; newStatus: 'GREEN' | 'AMBER' | 'RED' }[];
    trustChange: number;
    valueChange: number;
    residualChange: number;
  } | null;
  reducedMotion: boolean;
}): JSX.Element | null {
  if (!animation || !animation.active) return null;

  const bgGradient =
    animation.type === 'positive'
      ? 'from-emerald-500/20 via-transparent to-transparent'
      : animation.type === 'negative'
        ? 'from-red-500/20 via-transparent to-transparent'
        : 'from-amber-500/20 via-transparent to-transparent';

  return (
    <div
      className={clsx(
        'fixed inset-0 pointer-events-none z-30',
        !reducedMotion && 'animate-fade-in-fast'
      )}
    >
      <div className={clsx('absolute inset-0 bg-gradient-to-b', bgGradient)} />

      {/* Floating consequence indicators */}
      <div className="absolute top-20 right-4 flex flex-col gap-2">
        {animation.trustChange !== 0 && (
          <div
            className={clsx(
              'px-3 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2',
              !reducedMotion && 'animate-slide-in-right',
              animation.trustChange > 0
                ? 'bg-emerald-500/20 border border-emerald-500/40'
                : 'bg-red-500/20 border border-red-500/40'
            )}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              Trust {animation.trustChange > 0 ? '+' : ''}
              {animation.trustChange}%
            </span>
          </div>
        )}

        {animation.valueChange !== 0 && (
          <div
            className={clsx(
              'px-3 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2',
              !reducedMotion && 'animate-slide-in-right animation-delay-100',
              animation.valueChange > 0
                ? 'bg-emerald-500/20 border border-emerald-500/40'
                : 'bg-amber-500/20 border border-amber-500/40'
            )}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">
              {animation.valueChange >= 0 ? '+' : ''}$
              {Math.abs(animation.valueChange).toLocaleString()}
            </span>
          </div>
        )}

        {animation.residualChange !== 0 && (
          <div
            className={clsx(
              'px-3 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2',
              !reducedMotion && 'animate-slide-in-right animation-delay-200',
              animation.residualChange < 0
                ? 'bg-emerald-500/20 border border-emerald-500/40'
                : 'bg-red-500/20 border border-red-500/40'
            )}
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              Risk {animation.residualChange < 0 ? '' : '+'}
              {animation.residualChange}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * COP Zone Display - Visual layered view of operational zones
 */
function COPZoneDisplay({
  zoneHeatLevels,
  overallResidualRisk,
  stakeholderTrust,
  reducedMotion,
  animating,
}: {
  zoneHeatLevels: Record<string, number>;
  overallResidualRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  stakeholderTrust: number;
  reducedMotion: boolean;
  animating: boolean;
}): JSX.Element {
  const getHeatColor = (level: number): string => {
    if (level < 25) return 'bg-emerald-500/30 border-emerald-500/50';
    if (level < 50) return 'bg-amber-500/30 border-amber-500/50';
    if (level < 75) return 'bg-orange-500/30 border-orange-500/50';
    return 'bg-red-500/30 border-red-500/50';
  };

  const getHeatTextColor = (level: number): string => {
    if (level < 25) return 'text-emerald-400';
    if (level < 50) return 'text-amber-400';
    if (level < 75) return 'text-orange-400';
    return 'text-red-400';
  };

  const residualColors: Record<string, string> = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  const trustColor =
    stakeholderTrust >= 70
      ? 'text-emerald-400'
      : stakeholderTrust >= 40
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="space-y-3">
      {/* Zone Heat Map */}
      <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700/40">
        <div className="flex items-center gap-2 mb-3">
          <Thermometer className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Zone Heat
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(zoneHeatLevels).map(([zone, level]) => (
            <div
              key={zone}
              className={clsx(
                'p-2 rounded-lg border relative overflow-hidden transition-all duration-500',
                getHeatColor(level),
                animating && !reducedMotion && 'scale-[1.02]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Hexagon className={clsx('w-3 h-3', getHeatTextColor(level))} />
                  <span className="text-2xs font-medium text-gray-300 capitalize">{zone}</span>
                </div>
                <span className={clsx('text-xs font-bold font-mono', getHeatTextColor(level))}>
                  {level}%
                </span>
              </div>
              {/* Heat bar */}
              <div className="mt-1.5 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    level < 25
                      ? 'bg-emerald-400'
                      : level < 50
                        ? 'bg-amber-400'
                        : level < 75
                          ? 'bg-orange-400'
                          : 'bg-red-400'
                  )}
                  style={{ width: `${level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Residual Risk Chips */}
      <div className="grid grid-cols-2 gap-2">
        {/* Stakeholder Trust */}
        <div
          className={clsx(
            'p-2.5 rounded-xl border transition-all duration-300',
            stakeholderTrust >= 70
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : stakeholderTrust >= 40
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-red-500/10 border-red-500/30',
            animating && !reducedMotion && 'scale-105'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Users className={clsx('w-3 h-3', trustColor)} />
            <span className="text-2xs text-gray-400">Trust</span>
          </div>
          <div className={clsx('text-lg font-bold font-mono', trustColor)}>{stakeholderTrust}%</div>
        </div>

        {/* Overall Residual Risk */}
        <div
          className={clsx(
            'p-2.5 rounded-xl border transition-all duration-300',
            residualColors[overallResidualRisk],
            animating && !reducedMotion && 'scale-105'
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3" />
            <span className="text-2xs text-gray-400">Residual</span>
          </div>
          <div className="text-sm font-bold">{overallResidualRisk}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Resource Chip - Compact resource status indicator
 */
function ResourceChip({
  label,
  available,
  total,
  icon: Icon,
  contentionLevel,
  reducedMotion,
}: {
  label: string;
  available: number;
  total: number;
  icon: typeof Shield;
  contentionLevel: 'NORMAL' | 'STRAINED' | 'CRITICAL';
  reducedMotion: boolean;
}): JSX.Element {
  const ratio = available / total;
  const color =
    contentionLevel === 'CRITICAL' ? 'red' : contentionLevel === 'STRAINED' ? 'amber' : 'emerald';

  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div
      className={clsx(
        'px-2 py-1.5 rounded-lg border flex items-center gap-2 transition-all',
        colorClasses[color],
        contentionLevel === 'CRITICAL' && !reducedMotion && 'animate-pulse'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <div className="flex-1 min-w-0">
        <div className="text-2xs text-gray-400 truncate">{label}</div>
        <div className="text-xs font-bold font-mono">
          {available}/{total}
        </div>
      </div>
      {/* Mini utilization bar */}
      <div className="w-8 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300',
            color === 'emerald'
              ? 'bg-emerald-400'
              : color === 'amber'
                ? 'bg-amber-400'
                : 'bg-red-400'
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

function DispatchResource({
  label,
  resource,
  color,
}: {
  label: string;
  resource: {
    available: number;
    total: number;
    cooldown: number;
    contentionLevel: 'NORMAL' | 'STRAINED' | 'CRITICAL';
  };
  color: 'cyan' | 'violet' | 'orange';
}): JSX.Element {
  const colorClasses = {
    cyan: 'bg-cyan-500',
    violet: 'bg-violet-500',
    orange: 'bg-orange-500',
  };

  const textColors = {
    cyan: 'text-cyan-400',
    violet: 'text-violet-400',
    orange: 'text-orange-400',
  };

  const contentionColors = {
    NORMAL: '',
    STRAINED: 'ring-1 ring-amber-500/50',
    CRITICAL: 'ring-2 ring-red-500/50 animate-pulse',
  };

  return (
    <div
      className={clsx(
        'flex items-center justify-between p-1.5 rounded-lg transition-all',
        contentionColors[resource.contentionLevel]
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        {resource.contentionLevel !== 'NORMAL' && (
          <span
            className={clsx(
              'text-2xs px-1 py-0.5 rounded font-bold',
              resource.contentionLevel === 'CRITICAL'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-amber-500/20 text-amber-400'
            )}
          >
            {resource.contentionLevel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {Array.from({ length: resource.total }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                'w-2 h-2 rounded-full transition-all',
                i < resource.available ? colorClasses[color] : 'bg-gray-700',
                resource.cooldown > 0 &&
                  i >= resource.available &&
                  i < resource.available + 1 &&
                  'animate-pulse bg-gray-600'
              )}
            />
          ))}
        </div>
        <span className={clsx('text-xs font-mono', textColors[color])}>
          {resource.available}/{resource.total}
        </span>
      </div>
    </div>
  );
}

function DebriefModal({
  log,
  gameState,
  grade,
  elapsedSeconds,
  onClose,
  personalBest,
  isNewPersonalBest,
  difficulty,
  calcTrails,
  scenarioId,
  onRematch,
}: {
  log: DecisionLog;
  gameState: GameState;
  grade: { grade: string; title: string; color: string };
  elapsedSeconds: number;
  onClose: () => void;
  personalBest: PersonalBest | null;
  isNewPersonalBest: boolean;
  difficulty: DifficultyLevel;
  calcTrails: CalcTrail[];
  scenarioId: string;
  onRematch: () => void;
}): JSX.Element {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const minutes = Math.floor(elapsedSeconds / 60);
  const accuracy =
    gameState.decisionsTotal > 0
      ? Math.round((gameState.decisionsCorrect / gameState.decisionsTotal) * 100)
      : 0;
  const esrmRate =
    gameState.decisionsTotal > 0
      ? Math.round((gameState.assetOwnersBriefed / gameState.decisionsTotal) * 100)
      : 0;
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Calculate session value totals from calc trails
  const sessionTotals = useMemo(() => {
    if (calcTrails.length === 0) return null;
    return {
      totalAvoidedLoss: calcTrails.reduce((sum, t) => sum + t.finalResult.avoidedLoss, 0),
      totalTreatmentCost: calcTrails.reduce((sum, t) => sum + t.finalResult.treatmentCost, 0),
      totalNetValue: calcTrails.reduce((sum, t) => sum + t.finalResult.netValue, 0),
      averageROI: Math.round(
        calcTrails.reduce((sum, t) => sum + t.finalResult.roi, 0) / calcTrails.length
      ),
    };
  }, [calcTrails]);

  // Export to PDF
  const handleExportPDF = async (): Promise<void> => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: '#0d0d14',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, 10, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`hourglass-aar-${scenarioId}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PNG
  const handleExportPNG = async (): Promise<void> => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: '#0d0d14',
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `hourglass-aar-${scenarioId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('PNG export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClick = async (): Promise<void> => {
    if (exportFormat === 'pdf') {
      await handleExportPDF();
    } else {
      await handleExportPNG();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-3xl max-w-3xl w-full p-8 shadow-2xl animate-scale-in my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-2">Mission Complete</h2>
          <h1 className="text-3xl font-bold text-white">{log.incident.title}</h1>
        </div>

        {/* New Personal Best Banner */}
        {isNewPersonalBest && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 animate-pulse">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div className="text-center">
                <div className="text-xl font-bold text-amber-400">NEW PERSONAL BEST!</div>
                <div className="text-sm text-amber-300/80">
                  You beat your previous record of{' '}
                  {personalBest
                    ? `${(personalBest.score - gameState.score + personalBest.score).toLocaleString()} pts`
                    : 'N/A'}
                </div>
              </div>
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        )}

        {/* Streak Celebration */}
        {gameState.maxStreak >= 5 && (
          <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30">
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-violet-400" />
              <span className="text-violet-400 font-semibold">
                {gameState.maxStreak}x Streak! Sustained decision excellence.
              </span>
              <Flame className="w-5 h-5 text-violet-400" />
            </div>
          </div>
        )}

        {/* Grade Display */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className={clsx(
                'absolute inset-0 rounded-3xl blur-2xl opacity-50',
                grade.color.replace('text-', 'bg-').replace('-400', '-500/30')
              )}
            />
            <div
              className={clsx(
                'relative w-36 h-36 rounded-3xl border-4 flex flex-col items-center justify-center',
                grade.color,
                grade.color.replace('text-', 'border-').replace('-400', '-500/50'),
                grade.color.replace('text-', 'bg-').replace('-400', '-500/10')
              )}
            >
              <span className="text-6xl font-black">{grade.grade}</span>
              <span className="text-xs font-medium mt-1 opacity-80">{grade.title}</span>
            </div>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div className="flex justify-center mb-8">
          <div
            className={clsx(
              'px-4 py-2 rounded-xl border flex items-center gap-2',
              diffConfig.color === 'emerald' &&
                'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
              diffConfig.color === 'amber' && 'bg-amber-500/10 border-amber-500/40 text-amber-400',
              diffConfig.color === 'red' && 'bg-red-500/10 border-red-500/40 text-red-400'
            )}
          >
            <span>{diffConfig.icon}</span>
            <span className="text-sm font-semibold">{diffConfig.label} Difficulty</span>
            <span className="text-xs opacity-70">({diffConfig.pointMultiplier}x pts)</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Final Score"
            value={gameState.score.toLocaleString()}
            color="emerald"
            icon={<Zap />}
          />
          <StatCard label="Time" value={`${minutes}m`} color="blue" icon={<Clock />} />
          <StatCard label="Accuracy" value={`${accuracy}%`} color="amber" icon={<Target />} />
          <StatCard label="ESRM Rate" value={`${esrmRate}%`} color="violet" icon={<Users />} />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
            <h4 className="text-gray-400 mb-2">Score Breakdown</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Decisions</span>
                <span className="text-gray-300 font-mono">
                  {gameState.score - gameState.timeBonus - gameState.esrmBonus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time Bonus</span>
                <span className="text-emerald-400 font-mono">+{gameState.timeBonus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ESRM Bonus</span>
                <span className="text-violet-400 font-mono">+{gameState.esrmBonus}</span>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
            <h4 className="text-gray-400 mb-2">Performance</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Max Streak</span>
                <span className="text-amber-400 font-mono">{gameState.maxStreak}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Injects Handled</span>
                <span className="text-gray-300 font-mono">{gameState.injectsHandled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Owner Briefings</span>
                <span className="text-gray-300 font-mono">{gameState.assetOwnersBriefed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ESRM Lessons Learned */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/30">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <h4 className="text-violet-400 font-semibold">
              Lessons Learned — Continuous Improvement
            </h4>
          </div>
          <div className="space-y-2 text-sm">
            {esrmRate >= 80 ? (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-emerald-400 font-medium">Strong ESRM Discipline</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Consistent asset owner engagement demonstrates proper governance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-amber-400 font-medium">Improve Owner Engagement</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Brief asset owners before treatment decisions. Security advises; owner owns
                    risk.
                  </p>
                </div>
              </div>
            )}
            {accuracy >= 80 ? (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-emerald-400 font-medium">Accurate Risk Assessment</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Treatment decisions aligned with expected postures. Good threat × impact
                    analysis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-amber-400 font-medium">Review Risk Assessment</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Some treatments diverged from expected postures. Consider T×V×I more carefully.
                  </p>
                </div>
              </div>
            )}
            {gameState.maxStreak >= 5 ? (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-emerald-400 font-medium">Sustained Performance</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Maintained decision quality under pressure. Good operational rhythm.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-blue-400 font-medium">Build Decision Rhythm</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Focus on consistent tempo. ESRM cycle discipline builds over time.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 p-2 rounded-lg bg-gray-800/50 text-center">
            <p className="text-xs text-gray-500 italic">
              &ldquo;The ESRM cycle is continuous—lessons from each response improve future
              decisions.&rdquo;
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onRematch}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Repeat className="w-5 h-5" />
            Rematch
          </button>
          <button
            onClick={() => setShowExportPanel(true)}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export AAR
          </button>
          <Link
            href="/"
            className="flex-1 py-4 rounded-2xl bg-gray-800/50 text-gray-400 font-semibold border border-gray-700/50 hover:bg-gray-800 hover:text-gray-200 transition-all text-center"
          >
            Mission Select
          </Link>
        </div>

        {/* Attribution Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800/50 text-center">
          <p className="text-xs text-gray-500 mb-1">Training simulation built on ESRM principles</p>
          <p className="text-xs text-gray-600">
            Designed by <span className="text-gray-400">Shannon Brown</span> — GSOC Leadership &
            Crisis Management
          </p>
        </div>
      </div>

      {/* AAR Export Panel */}
      {showExportPanel && (
        <div className="fixed inset-0 bg-black/98 z-[60] flex flex-col overflow-hidden">
          {/* Export Controls Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-800/60 flex items-center justify-between bg-[#0d0d14]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExportPanel(false)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-lg font-semibold text-white">Export After-Action Report</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl overflow-hidden border border-gray-700">
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    exportFormat === 'pdf'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  PDF
                </button>
                <button
                  onClick={() => setExportFormat('png')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    exportFormat === 'png'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  PNG
                </button>
              </div>
              <button
                onClick={handleExportClick}
                disabled={isExporting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export {exportFormat.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export Preview (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* The AAR Export Document */}
              <div
                ref={exportRef}
                className="bg-[#0d0d14] p-8 rounded-2xl border border-gray-800/60"
                style={{ minWidth: '800px' }}
              >
                {/* Header with Branding */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">After-Action Report</h1>
                      <p className="text-sm text-gray-500">Hourglass Command Training</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{log.incident.title}</p>
                    <p className="text-xs text-gray-600">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    Executive Summary
                  </h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                      <div className="text-3xl font-bold text-emerald-400">{grade.grade}</div>
                      <div className="text-xs text-gray-400 mt-1">{grade.title}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                      <div className="text-3xl font-bold text-cyan-400">
                        {gameState.score.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Total Score</div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                      <div className="text-3xl font-bold text-amber-400">{accuracy}%</div>
                      <div className="text-xs text-gray-400 mt-1">Accuracy</div>
                    </div>
                    <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
                      <div className="text-3xl font-bold text-violet-400">{esrmRate}%</div>
                      <div className="text-xs text-gray-400 mt-1">ESRM Rate</div>
                    </div>
                  </div>
                </div>

                {/* Decision Timeline */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Decision Timeline
                  </h2>
                  <div className="space-y-3">
                    {log.decisions.slice(0, 6).map((decision, idx) => (
                      <div
                        key={decision.id}
                        className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center text-sm font-bold text-gray-300">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-200">{decision.title}</span>
                              <span
                                className={clsx(
                                  'px-2 py-0.5 text-2xs font-bold rounded',
                                  decision.posture === 'PAUSE'
                                    ? 'bg-red-500/20 text-red-400'
                                    : decision.posture === 'DEGRADE'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                )}
                              >
                                {decision.posture}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {decision.rationale}
                            </p>
                            {decision.esrmFraming && (
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>Treatment: {decision.esrmFraming.treatment}</span>
                                <span>Residual: {decision.esrmFraming.residualRisk}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {log.decisions.length > 6 && (
                      <p className="text-sm text-gray-500 text-center">
                        + {log.decisions.length - 6} more decisions
                      </p>
                    )}
                  </div>
                </div>

                {/* Value/KRI Calc Trail */}
                {sessionTotals && calcTrails.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-400" />
                      Value Calculation Trail
                    </h2>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Total Avoided Loss
                          </span>
                          <div className="text-xl font-bold text-emerald-400">
                            ${sessionTotals.totalAvoidedLoss.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Treatment Cost
                          </span>
                          <div className="text-xl font-bold text-amber-400">
                            ${sessionTotals.totalTreatmentCost.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Net Value Created
                          </span>
                          <div className="text-xl font-bold text-cyan-400">
                            ${sessionTotals.totalNetValue.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Average ROI
                          </span>
                          <div className="text-xl font-bold text-violet-400">
                            {sessionTotals.averageROI}%
                          </div>
                        </div>
                      </div>

                      {/* Sample Calc Trail */}
                      {calcTrails.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700/40">
                          <h4 className="text-sm font-medium text-gray-300 mb-3">
                            Sample Calculation (Decision 1)
                          </h4>
                          <div className="space-y-2 text-xs">
                            {calcTrails[0].steps.slice(0, 5).map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50"
                              >
                                <div className="w-6 h-6 rounded bg-gray-700/50 flex items-center justify-center text-gray-400">
                                  {idx + 1}
                                </div>
                                <div className="flex-1">
                                  <span className="text-gray-400">{step.operation}: </span>
                                  <span className="text-gray-300 font-mono">{step.formula}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-emerald-400 font-mono">
                                    {typeof step.result === 'number'
                                      ? step.result.toLocaleString()
                                      : step.result}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {calcTrails[0].steps.length > 5 && (
                              <p className="text-gray-500 text-center py-1">
                                + {calcTrails[0].steps.length - 5} more steps
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ESRM Coverage */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-violet-400" />
                    ESRM Coverage
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40 text-center">
                      <div className="text-2xl font-bold text-gray-200">
                        {gameState.assetsProtected}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Assets Addressed</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40 text-center">
                      <div className="text-2xl font-bold text-gray-200">
                        {gameState.assetOwnersBriefed}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Owner Briefings</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40 text-center">
                      <div className="text-2xl font-bold text-gray-200">{gameState.maxStreak}x</div>
                      <div className="text-xs text-gray-500 mt-1">Max Streak</div>
                    </div>
                  </div>
                </div>

                {/* Leadership Moves */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Leadership Moves
                  </h2>
                  <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-300">
                          {gameState.injectsHandled} injects triaged
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-300">
                          {gameState.decisionsCorrect} correct postures
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-300">
                          {diffConfig.label} difficulty mastered
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-300">{minutes}m mission duration</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Watermark Footer */}
                <div className="pt-6 border-t border-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Hourglass className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        Hourglass Command Training Simulation
                      </span>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <p>Built on ESRM principles</p>
                      <p className="text-gray-700">{new Date().toISOString().split('T')[0]}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: 'emerald' | 'blue' | 'amber' | 'violet';
  icon: React.ReactNode;
}): JSX.Element {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  };

  return (
    <div className={clsx('p-4 rounded-2xl border text-center', colorClasses[color])}>
      <div
        className={clsx(
          'w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center',
          colorClasses[color].split(' ')[1]
        )}
      >
        {icon}
      </div>
      <div className={clsx('text-2xl font-bold font-mono', colorClasses[color].split(' ')[0])}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function ValueMetricsPanel({
  metrics,
  calcTrails,
  onClose,
}: {
  metrics: ESRMValueCreated;
  calcTrails: CalcTrail[];
  onClose: () => void;
}): JSX.Element {
  const [activeTab, setActiveTab] = useState<'metrics' | 'formulas' | 'assumptions'>('metrics');
  const [expandedTrail, setExpandedTrail] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-400';
    if (score >= 0.6) return 'text-cyan-400';
    if (score >= 0.4) return 'text-amber-400';
    return 'text-red-400';
  };

  const sessionTotals = useMemo(() => {
    if (calcTrails.length === 0) return null;
    return {
      totalInherentRisk: calcTrails.reduce((sum, t) => sum + t.finalResult.inherentRisk, 0),
      totalResidualRisk: calcTrails.reduce((sum, t) => sum + t.finalResult.residualRisk, 0),
      totalAvoidedLoss: calcTrails.reduce((sum, t) => sum + t.finalResult.avoidedLoss, 0),
      totalTreatmentCost: calcTrails.reduce((sum, t) => sum + t.finalResult.treatmentCost, 0),
      totalNetValue: calcTrails.reduce((sum, t) => sum + t.finalResult.netValue, 0),
      averageROI: Math.round(
        calcTrails.reduce((sum, t) => sum + t.finalResult.roi, 0) / calcTrails.length
      ),
    };
  }, [calcTrails]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-5 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ESRM Value Created</h2>
              <p className="text-xs text-gray-500">
                Security&apos;s Business Impact • Reproducible Calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-800/50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800/60">
          {(['metrics', 'formulas', 'assumptions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors relative',
                activeTab === tab ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab === 'metrics' && 'Metrics'}
              {tab === 'formulas' && 'Formulas & Trail'}
              {tab === 'assumptions' && 'Assumptions'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* METRICS TAB */}
          {activeTab === 'metrics' && (
            <>
              {/* Composite Score */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Composite Value Score</span>
                  <span
                    className={`text-2xl font-bold ${getScoreColor(metrics.compositeValueScore)}`}
                  >
                    {Math.round(metrics.compositeValueScore * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">{metrics.valueNarrative}</p>
              </div>

              {/* Session Value Summary */}
              {sessionTotals && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-gray-200">
                      Session Value (Calc Trail)
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {calcTrails.length} decisions
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Avoided Loss</span>
                      <p className="text-lg font-semibold text-emerald-400 font-mono">
                        ${sessionTotals.totalAvoidedLoss.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Net Value</span>
                      <p
                        className={clsx(
                          'text-lg font-semibold font-mono',
                          sessionTotals.totalNetValue >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}
                      >
                        ${sessionTotals.totalNetValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg ROI</span>
                      <p
                        className={clsx(
                          'text-lg font-semibold font-mono',
                          sessionTotals.averageROI >= 100
                            ? 'text-emerald-400'
                            : sessionTotals.averageROI >= 0
                              ? 'text-amber-400'
                              : 'text-red-400'
                        )}
                      >
                        {sessionTotals.averageROI}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mission Continuity */}
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-gray-200">Mission Continuity</span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      metrics.missionContinuity.state === 'OPERATIONAL'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : metrics.missionContinuity.state === 'DEGRADED'
                          ? 'bg-amber-500/20 text-amber-400'
                          : metrics.missionContinuity.state === 'DISRUPTED'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {metrics.missionContinuity.state}
                  </span>
                  <span className="text-xs text-gray-500">
                    {metrics.missionContinuity.avoidedDowntimeMinutes}m avoided downtime
                  </span>
                </div>
              </div>

              {/* Residual Risk */}
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-gray-200">
                    Residual Risk Management
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Documented</span>
                    <p className="text-lg font-semibold text-white">
                      {metrics.residualRisk.risksWithExplicitResidual}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Explicit Rate</span>
                    <p
                      className={`text-lg font-semibold ${getScoreColor(metrics.residualRisk.residualRiskExplicitnessRate)}`}
                    >
                      {Math.round(metrics.residualRisk.residualRiskExplicitnessRate * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FORMULAS TAB */}
          {activeTab === 'formulas' && (
            <>
              {/* Core Formulas */}
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-gray-200">ESRM Value Formulas</span>
                </div>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-2 rounded bg-gray-900/50">
                    <span className="text-gray-500 block mb-1"># Risk Score (T×V×I)</span>
                    <span className="text-cyan-400">
                      Risk = Threat × Vulnerability × Impact × 100
                    </span>
                  </div>
                  <div className="p-2 rounded bg-gray-900/50">
                    <span className="text-gray-500 block mb-1"># Annualized Loss Expectancy</span>
                    <span className="text-cyan-400">ALE = ARO × SLE</span>
                    <span className="text-gray-500 block text-2xs mt-1">
                      where SLE = baseALE × impactMultiplier
                    </span>
                  </div>
                  <div className="p-2 rounded bg-gray-900/50">
                    <span className="text-gray-500 block mb-1"># Avoided Loss</span>
                    <span className="text-emerald-400">
                      AvoidedLoss = InherentALE - ResidualALE
                    </span>
                  </div>
                  <div className="p-2 rounded bg-gray-900/50">
                    <span className="text-gray-500 block mb-1"># Net Value & ROI</span>
                    <span className="text-emerald-400">NetValue = AvoidedLoss - TreatmentCost</span>
                    <span className="text-gray-500 block text-2xs mt-1">
                      ROI = (NetValue / TreatmentCost) × 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Decision Calc Trails */}
              {calcTrails.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Calculator className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-gray-200">
                      Decision Calc Trails
                    </span>
                    <span className="text-xs text-gray-500">({calcTrails.length} decisions)</span>
                  </div>
                  {calcTrails.map((trail, idx) => (
                    <div
                      key={trail.calculationId}
                      className="rounded-xl bg-gray-800/30 border border-gray-700/40 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedTrail(
                            expandedTrail === trail.calculationId ? null : trail.calculationId
                          )
                        }
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div className="text-left">
                            <span className="text-sm text-gray-200 block">
                              {trail.inputSummary.assetCriticality} Asset •{' '}
                              {trail.inputSummary.treatment}
                            </span>
                            <span className="text-xs text-gray-500">
                              Net:{' '}
                              <span
                                className={
                                  trail.finalResult.netValue >= 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                }
                              >
                                ${trail.finalResult.netValue.toLocaleString()}
                              </span>
                              {' • '}ROI: {trail.finalResult.roi}%
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          className={clsx(
                            'w-4 h-4 text-gray-500 transition-transform',
                            expandedTrail === trail.calculationId && 'rotate-90'
                          )}
                        />
                      </button>

                      {expandedTrail === trail.calculationId && (
                        <div className="p-3 pt-0 space-y-2 border-t border-gray-700/40">
                          {/* Input Summary */}
                          <div className="grid grid-cols-3 gap-2 text-xs p-2 rounded bg-gray-900/50">
                            <div>
                              <span className="text-gray-500">Criticality</span>
                              <p className="text-white font-medium">
                                {trail.inputSummary.assetCriticality}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Likelihood</span>
                              <p className="text-white font-medium">
                                {trail.inputSummary.threatLikelihood}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Impact</span>
                              <p className="text-white font-medium">
                                {trail.inputSummary.impactSeverity}
                              </p>
                            </div>
                          </div>

                          {/* Key Steps */}
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {trail.steps
                              .filter(
                                (_, i) =>
                                  i % 3 === 0 || trail.steps[i].operation.includes('Calculate')
                              )
                              .slice(0, 6)
                              .map((step) => (
                                <div
                                  key={step.stepNumber}
                                  className="text-2xs p-1.5 rounded bg-gray-900/30 flex items-start gap-2"
                                >
                                  <span className="text-gray-600 w-4">{step.stepNumber}.</span>
                                  <div className="flex-1">
                                    <span className="text-gray-400">{step.operation}</span>
                                    <span className="text-cyan-400 font-mono ml-2">
                                      ={' '}
                                      {typeof step.result === 'number' && step.unit.includes('$')
                                        ? `$${step.result.toLocaleString()}`
                                        : step.result}
                                      {step.unit && !step.unit.includes('$') ? ` ${step.unit}` : ''}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Final Results */}
                          <div className="grid grid-cols-3 gap-2 text-xs p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <div>
                              <span className="text-gray-500">Inherent</span>
                              <p className="text-white font-mono">
                                ${trail.finalResult.inherentRisk.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Residual</span>
                              <p className="text-amber-400 font-mono">
                                ${trail.finalResult.residualRisk.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Avoided</span>
                              <p className="text-emerald-400 font-mono">
                                ${trail.finalResult.avoidedLoss.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No decisions yet.</p>
                  <p className="text-xs mt-1">Make decisions to see value calculations.</p>
                </div>
              )}
            </>
          )}

          {/* ASSUMPTIONS TAB */}
          {activeTab === 'assumptions' && (
            <>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400/80">
                <strong>Training-Synthetic:</strong> All values are illustrative benchmarks. Method
                matches how real ESRM programs argue value to leadership.
              </div>

              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-gray-200">
                    Annual Loss Expectancy (ALE)
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {Object.entries(VALUE_ASSUMPTIONS.ANNUAL_LOSS_EXPECTANCY).map(
                    ([level, value]) => (
                      <div
                        key={level}
                        className="flex items-center justify-between p-2 rounded bg-gray-900/50"
                      >
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-2xs font-bold',
                            level === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400'
                              : level === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-400'
                                : level === 'MEDIUM'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-gray-500/20 text-gray-400'
                          )}
                        >
                          {level}
                        </span>
                        <span className="text-emerald-400 font-mono">
                          ${value.toLocaleString()}/yr
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-gray-200">Hourly Impact Cost</span>
                </div>
                <div className="space-y-2 text-xs">
                  {Object.entries(VALUE_ASSUMPTIONS.HOURLY_IMPACT).map(([level, value]) => (
                    <div
                      key={level}
                      className="flex items-center justify-between p-2 rounded bg-gray-900/50"
                    >
                      <span className="text-gray-400">{level}</span>
                      <span className="text-blue-400 font-mono">${value.toLocaleString()}/hr</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-gray-200">
                    Treatment Costs & Reduction
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {Object.entries(VALUE_ASSUMPTIONS.TREATMENT_COSTS).map(([treatment, costs]) => (
                    <div key={treatment} className="p-2 rounded bg-gray-900/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-300">{treatment}</span>
                        <span className="text-cyan-400 font-mono">
                          {Math.round(
                            VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION[
                              treatment as keyof typeof VALUE_ASSUMPTIONS.RESIDUAL_REDUCTION
                            ] * 100
                          )}
                          % reduction
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-2xs text-gray-500">
                        <span>Implementation: ${costs.implementation.toLocaleString()}</span>
                        <span>Ongoing: ${costs.ongoing.toLocaleString()}/yr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-gray-200">
                    Likelihood → Probability
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-2xs text-center">
                  {Object.entries(VALUE_ASSUMPTIONS.LIKELIHOOD_PROBABILITY).map(([level, prob]) => (
                    <div key={level} className="p-1.5 rounded bg-gray-900/50">
                      <span className="text-gray-500 block truncate">
                        {level.replace('_', ' ')}
                      </span>
                      <span className="text-cyan-400 font-mono">{Math.round(prob * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-gray-200">Multipliers</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-gray-900/50">
                    <span className="text-gray-500 block">First-Hour Premium</span>
                    <span className="text-amber-400 font-mono">
                      ×{VALUE_ASSUMPTIONS.FIRST_HOUR_PREMIUM}
                    </span>
                    <span className="text-2xs text-gray-600 block">Decisions within 60min</span>
                  </div>
                  <div className="p-2 rounded bg-gray-900/50">
                    <span className="text-gray-500 block">Governance Multiplier</span>
                    <span className="text-emerald-400 font-mono">
                      ×{VALUE_ASSUMPTIONS.GOVERNANCE_MULTIPLIER}
                    </span>
                    <span className="text-2xs text-gray-600 block">Documented ESRM decisions</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-800/60">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold hover:bg-emerald-500/25 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function KRIDashboardPanel({
  dashboard,
  onClose,
}: {
  dashboard: KRIDashboard;
  onClose: () => void;
}): JSX.Element {
  const getStatusColor = (status: TrafficLightStatus) => {
    switch (status) {
      case 'GREEN':
        return 'bg-emerald-400';
      case 'AMBER':
        return 'bg-amber-400';
      case 'RED':
        return 'bg-red-400';
    }
  };

  const getStatusBg = (status: TrafficLightStatus) => {
    switch (status) {
      case 'GREEN':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'AMBER':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'RED':
        return 'bg-red-500/10 border-red-500/30';
    }
  };

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="w-3 h-3 text-emerald-400" />;
      case 'DEGRADING':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      case 'STABLE':
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-5 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                dashboard.overallHealth === 'GREEN'
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                  : dashboard.overallHealth === 'AMBER'
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                    : 'bg-gradient-to-br from-red-400 to-red-600'
              }`}
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">KRI Dashboard</h2>
              <p className="text-xs text-gray-500">Key Risk Indicators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-800/50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Overall Health */}
          <div className={`p-4 rounded-2xl border ${getStatusBg(dashboard.overallHealth)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Overall Health</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${getStatusColor(dashboard.overallHealth)}`}
                />
                <span className="text-sm font-semibold text-white">{dashboard.overallHealth}</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-400">{dashboard.healthyCount} healthy</span>
              <span className="text-amber-400">{dashboard.warningCount} warning</span>
              <span className="text-red-400">{dashboard.criticalCount} critical</span>
            </div>
          </div>

          {/* Individual KRIs */}
          <div className="space-y-3">
            {dashboard.indicators.map((kri: KRIMeasurement) => (
              <div key={kri.id} className={`p-3 rounded-xl border ${getStatusBg(kri.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(kri.status)}`} />
                    <span className="text-sm font-semibold text-gray-200">{kri.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(kri.trend)}
                    <span className="text-sm font-mono text-white">
                      {typeof kri.value === 'number' ? kri.value.toFixed(1) : kri.value}
                      {kri.unit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{kri.category}</span>
                  <span className="text-gray-500">
                    Target: {kri.threshold.direction === 'LOWER_BETTER' ? '≤' : '≥'}
                    {kri.threshold.green}
                    {kri.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800/60">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 font-semibold hover:bg-cyan-500/25 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PipelineHealthPanel({
  health,
  onClose,
}: {
  health: PipelineHealth;
  onClose: () => void;
}): JSX.Element {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'DEGRADED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-5 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                health.overallStatus === 'HEALTHY'
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                  : health.overallStatus === 'DEGRADED'
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                    : 'bg-gradient-to-br from-red-400 to-red-600'
              }`}
            >
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pipeline Health</h2>
              <p className="text-xs text-gray-500">Data Flow Status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-800/50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Overall Status */}
          <div className={`p-4 rounded-2xl border ${getStatusColor(health.overallStatus)}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Pipeline</span>
              <span className="text-sm font-semibold">{health.overallStatus}</span>
            </div>
          </div>

          {/* Pipeline Flow Visualization */}
          <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Pipeline Flow</h4>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {Object.entries(PIPELINE_STAGE_CONFIG).map(([stageId, config], idx) => (
                <span key={stageId} className="contents">
                  {idx > 0 && <span className="text-gray-600">→</span>}
                  <span
                    className={`px-2 py-1 rounded ${
                      health.stages.find((s) => s.stage === stageId)?.status === 'HEALTHY'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : health.stages.find((s) => s.stage === stageId)?.status === 'DEGRADED'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {config.name.split(' ')[0]}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Stage Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Stage Health</h4>
            {health.stages.map((stage) => (
              <div
                key={stage.stage}
                className="p-3 rounded-xl bg-gray-800/30 border border-gray-700/40"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-200">
                    {PIPELINE_STAGE_CONFIG[stage.stage as keyof typeof PIPELINE_STAGE_CONFIG]
                      ?.name || stage.stage}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(stage.status)}`}>
                    {stage.status}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Latency: {stage.latencyMs}ms</span>
                  <span>Error: {stage.errorRate.toFixed(1)}%</span>
                  <span>Queue: {stage.queueDepth}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {health.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-300">Active Alerts</h4>
              {health.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-500/10 border-red-500/30'
                      : alert.severity === 'WARNING'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle
                      className={`w-3 h-3 ${
                        alert.severity === 'CRITICAL'
                          ? 'text-red-400'
                          : alert.severity === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-200">{alert.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">{alert.stage}</span>
                </div>
              ))}
            </div>
          )}

          {/* Metrics Summary */}
          <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Pipeline Metrics</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-white">
                  {health.metrics.totalEventsProcessed}
                </p>
                <span className="text-xs text-gray-500">Events</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {health.metrics.averageLatencyMs}ms
                </p>
                <span className="text-xs text-gray-500">Avg Latency</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {(health.metrics.enrichmentSuccessRate * 100).toFixed(0)}%
                </p>
                <span className="text-xs text-gray-500">Enriched</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800/60">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 rounded-xl bg-violet-500/15 text-violet-400 font-semibold hover:bg-violet-500/25 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DifficultyPickerModal({
  currentDifficulty,
  onSelect,
  onClose,
}: {
  currentDifficulty: DifficultyLevel;
  onSelect: (difficulty: DifficultyLevel) => void;
  onClose: () => void;
}): JSX.Element {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Select Difficulty</h2>
              <p className="text-xs text-gray-500">Choose your challenge level</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          {(Object.values(DIFFICULTY_CONFIGS) as DifficultyConfig[]).map((config) => (
            <button
              key={config.id}
              onClick={() => onSelect(config.id)}
              className={clsx(
                'w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]',
                currentDifficulty === config.id
                  ? config.color === 'emerald'
                    ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50'
                    : config.color === 'amber'
                      ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50'
                      : 'border-red-500 bg-red-500/20 ring-2 ring-red-500/50'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'font-bold',
                        config.color === 'emerald' && 'text-emerald-400',
                        config.color === 'amber' && 'text-amber-400',
                        config.color === 'red' && 'text-red-400'
                      )}
                    >
                      {config.label}
                    </span>
                    {currentDifficulty === config.id && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
                </div>
                <div className="text-right">
                  <div
                    className={clsx(
                      'text-xs font-mono font-bold',
                      config.color === 'emerald' && 'text-emerald-400',
                      config.color === 'amber' && 'text-amber-400',
                      config.color === 'red' && 'text-red-400'
                    )}
                  >
                    {config.pointMultiplier}x
                  </div>
                  <div className="text-2xs text-gray-500">points</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-2xs">
                <div className="p-2 rounded-lg bg-gray-900/50 text-center">
                  <div className="text-gray-400">Timer</div>
                  <div
                    className={clsx(
                      'font-mono font-bold',
                      config.color === 'emerald' && 'text-emerald-400',
                      config.color === 'amber' && 'text-amber-400',
                      config.color === 'red' && 'text-red-400'
                    )}
                  >
                    {config.timerMultiplier}x
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-900/50 text-center">
                  <div className="text-gray-400">Coach</div>
                  <div
                    className={clsx(
                      'font-mono font-bold',
                      config.showCoachMarks ? 'text-emerald-400' : 'text-gray-500'
                    )}
                  >
                    {config.showCoachMarks ? 'ON' : 'OFF'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-900/50 text-center">
                  <div className="text-gray-400">Noise</div>
                  <div
                    className={clsx(
                      'font-mono font-bold',
                      config.injectNoiseLevel === 'LOW' && 'text-emerald-400',
                      config.injectNoiseLevel === 'MEDIUM' && 'text-amber-400',
                      config.injectNoiseLevel === 'HIGH' && 'text-red-400'
                    )}
                  >
                    {config.injectNoiseLevel}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-3 rounded-xl bg-gray-800/30 border border-gray-700/40">
          <p className="text-xs text-gray-400 text-center">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            Start with <span className="text-emerald-400">Rookie</span> to learn ESRM fundamentals,
            then progress to <span className="text-red-400">Director</span> for expert challenge.
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldGuideModal({ onClose }: { onClose: () => void }): JSX.Element {
  const [activeSection, setActiveSection] = useState<
    | 'overview'
    | 'cycle'
    | 'intake'
    | 'assets'
    | 'risks'
    | 'treatments'
    | 'advisor'
    | 'team'
    | 'stakeholders'
    | 'response'
    | 'scoring'
    | 'glossary'
    | 'kri'
    | 'value'
    | 'pipeline'
  >('overview');

  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'cycle' as const, label: 'ESRM Cycle', icon: <Hourglass className="w-4 h-4" /> },
    { id: 'intake' as const, label: 'Intake Channels', icon: <Radio className="w-4 h-4" /> },
    { id: 'assets' as const, label: 'Assets', icon: <Target className="w-4 h-4" /> },
    { id: 'risks' as const, label: 'Risk Assessment', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'treatments' as const, label: 'Treatments', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'advisor' as const, label: 'Advisor Model', icon: <Users className="w-4 h-4" /> },
    { id: 'team' as const, label: 'Team Mgmt', icon: <Users className="w-4 h-4" /> },
    { id: 'stakeholders' as const, label: 'Stakeholders', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'response' as const, label: 'Response & Review', icon: <FileText className="w-4 h-4" /> },
    { id: 'scoring' as const, label: 'Scoring', icon: <Zap className="w-4 h-4" /> },
    { id: 'glossary' as const, label: 'Glossary', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'kri' as const, label: 'KRIs', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'value' as const, label: 'Value Metrics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'pipeline' as const, label: 'Pipeline', icon: <Activity className="w-4 h-4" /> },
  ];

  const glossaryTerms = [
    {
      term: 'AAR',
      definition:
        'After-Action Review — Structured debrief to capture lessons learned after an incident or exercise',
    },
    {
      term: 'ACS',
      definition:
        'Access Control System — Electronic system that manages physical entry to secured areas',
    },
    {
      term: 'BMS',
      definition:
        'Building Management System — Centralized system controlling HVAC, lighting, and other building functions',
    },
    {
      term: 'COP',
      definition:
        'Common Operating Picture — Shared situational awareness display showing facts, assumptions, and unknowns',
    },
    {
      term: 'ESRM',
      definition:
        'Enterprise Security Risk Management — Holistic approach where security advises asset owners who own risk decisions',
    },
    {
      term: 'ETA',
      definition: 'Estimated Time of Arrival — Projected time for resource or personnel arrival',
    },
    {
      term: 'GSOC',
      definition:
        'Global Security Operations Center — Centralized facility for monitoring and coordinating security operations',
    },
    {
      term: 'IR',
      definition: 'Incident Response — Coordinated approach to managing security incidents',
    },
    {
      term: 'MFA',
      definition:
        'Multi-Factor Authentication — Security requiring multiple verification methods for access',
    },
    {
      term: 'OSINT',
      definition: 'Open-Source Intelligence — Information gathered from publicly available sources',
    },
    {
      term: 'SIEM',
      definition:
        'Security Information and Event Management — Platform aggregating and analyzing security logs',
    },
    {
      term: 'SLA',
      definition:
        'Service Level Agreement — Contractual commitment defining expected service standards',
    },
    {
      term: 'SOP',
      definition:
        'Standard Operating Procedure — Documented step-by-step instructions for routine operations',
    },
    {
      term: 'T×V×I',
      definition:
        'Threat × Vulnerability × Impact — Risk calculation formula: likelihood of threat exploiting vulnerability times potential impact',
    },
    {
      term: 'VMS',
      definition:
        'Video Management System — Software platform for managing surveillance camera feeds and recordings',
    },
    {
      term: 'RPD',
      definition:
        'Recognition-Primed Decision — Decision model where experts recognize patterns and mentally simulate outcomes',
    },
    {
      term: 'ICS',
      definition:
        'Incident Command System — Standardized management structure for emergency response',
    },
    {
      term: 'CISA',
      definition:
        'Cybersecurity and Infrastructure Security Agency — US federal agency for cyber and physical security',
    },
    {
      term: 'NIST',
      definition:
        'National Institute of Standards and Technology — US agency developing security frameworks and standards',
    },
    {
      term: 'ASIS',
      definition:
        'ASIS International — Global organization for security professionals, publisher of ESRM guidelines',
    },
    {
      term: 'SOC',
      definition:
        'Security Operations Center — Facility for monitoring and responding to security threats',
    },
    {
      term: 'IOC',
      definition: 'Indicator of Compromise — Artifact indicating potential security breach',
    },
    {
      term: 'TTPs',
      definition: 'Tactics, Techniques, and Procedures — Patterns describing adversary behavior',
    },
    {
      term: 'BCP',
      definition:
        'Business Continuity Plan — Strategy for maintaining operations during disruptions',
    },
    {
      term: 'DR',
      definition: 'Disaster Recovery — Process for restoring systems after major incidents',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-2xl sm:rounded-3xl w-full max-w-[calc(100vw-16px)] sm:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-gray-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                ESRM Field Guide
              </h2>
              <p className="text-2xs sm:text-xs text-gray-500 truncate">
                Enterprise Security Risk Management Training
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation - horizontal scroll on mobile */}
        <div className="flex border-b border-gray-800/60 overflow-x-auto scrollbar-thin overscroll-x-contain">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={clsx(
                'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                activeSection === section.id
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
              )}
            >
              {section.icon}
              <span className="hidden xs:inline">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Hourglass Command</h3>
                  <p className="text-xs text-gray-500">ESRM Training Simulation</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/50">
                <p className="text-gray-300 text-sm leading-relaxed">
                  This simulation trains first-hour decision-making using{' '}
                  <strong className="text-emerald-400">
                    Enterprise Security Risk Management (ESRM)
                  </strong>{' '}
                  principles from ASIS International guidelines and industry best practices.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <h4 className="text-violet-400 font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Core ESRM Principle
                </h4>
                <p className="text-sm text-gray-300 italic">
                  &ldquo;Security serves as trusted advisor to asset owners who own the risk.&rdquo;
                </p>
                <p className="text-xs text-gray-500 mt-2">— ASIS ESRM Guidelines; Allen & Loyear</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">What You&apos;ll Practice:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Asset identification & prioritization',
                    'Risk assessment (Threat × Vulnerability × Impact)',
                    'Treatment selection (Accept/Mitigate/Transfer/Avoid)',
                    'Advisor → Owner communication',
                    'Residual risk documentation',
                    'Post-incident review',
                  ].map((item) => (
                    <div
                      key={item}
                      className="p-2 rounded-lg bg-gray-800/40 text-xs text-gray-400 flex items-center gap-2"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-200">
                  <strong>Fast-Casual Tempo:</strong> Intel arrives every 15-45 seconds. Make
                  decisions under pressure—ESRM discipline keeps you grounded.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'cycle' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">The ESRM Cycle</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                ESRM follows a continuous cycle. In this simulation, you&apos;ll practice each step
                under time pressure, building muscle memory for real incidents.
              </p>

              <div className="relative">
                <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-red-500 opacity-30" />
                <div className="space-y-4">
                  {[
                    {
                      num: 1,
                      title: 'Establish Context',
                      desc: 'Understand the scenario, mission, and stakeholders',
                      color: 'emerald',
                      detail: 'Each scenario frames the business context and key stakeholders',
                    },
                    {
                      num: 2,
                      title: 'Identify & Prioritize Assets',
                      desc: "What's at risk? Who owns it? What's the criticality?",
                      color: 'cyan',
                      detail: 'Select the affected asset before making treatment decisions',
                    },
                    {
                      num: 3,
                      title: 'Identify & Prioritize Risks',
                      desc: 'Assess threats, vulnerabilities, and potential impact',
                      color: 'amber',
                      detail: 'Each inject presents risk indicators for rapid assessment',
                    },
                    {
                      num: 4,
                      title: 'Treat the Risk',
                      desc: 'Accept, Mitigate, Transfer, or Avoid',
                      color: 'orange',
                      detail: 'Choose your treatment and operational posture',
                    },
                    {
                      num: 5,
                      title: 'Advise Asset Owner',
                      desc: 'Brief the owner; document their acknowledgment',
                      color: 'violet',
                      detail: 'Owner briefing earns ESRM bonus points',
                    },
                    {
                      num: 6,
                      title: 'Response & Review',
                      desc: 'Execute, monitor residual risk, debrief',
                      color: 'red',
                      detail: 'AAR export captures lessons learned',
                    },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-4 pl-1">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 z-10',
                          `bg-${step.color}-500/20 text-${step.color}-400 border border-${step.color}-500/40`
                        )}
                      >
                        {step.num}
                      </div>
                      <div className="flex-1 pb-2">
                        <h4 className={`text-${step.color}-400 font-semibold`}>{step.title}</h4>
                        <p className="text-sm text-gray-300 mt-0.5">{step.desc}</p>
                        <p className="text-xs text-gray-500 mt-1 italic">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mt-4">
                <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                  <Activity className="w-4 h-4" />
                  <strong>Continuous Improvement</strong>
                </div>
                <p className="text-xs text-gray-300">
                  The cycle repeats. Lessons from each response feed back into better context and
                  risk understanding for future incidents.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'intake' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                How Data Arrives on the Floor
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Injects don&apos;t just &quot;appear&quot; — they arrive through believable{' '}
                <strong className="text-cyan-400">intake channels</strong> with channel-faithful
                metadata, urgency, noise, and routing. Understanding your source systems helps you
                assess confidence and prioritize response.
              </p>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
                <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Real GSOC Floor Operations
                </h4>
                <p className="text-sm text-gray-300">
                  This simulation mirrors how data actually flows into a Global Security Operations
                  Center. Each channel has distinct characteristics that affect confidence,
                  completeness, and urgency.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Intake Channels</h4>
                <div className="grid gap-2">
                  {[
                    {
                      id: 'ACS',
                      icon: <DoorOpen className="w-4 h-4" />,
                      name: 'Access Control',
                      desc: 'Badge denies, forced doors, anti-passback, visitor timeouts',
                      confidence: 'HIGH',
                      color: 'cyan',
                    },
                    {
                      id: 'VMS',
                      icon: <Video className="w-4 h-4" />,
                      name: 'Video Management',
                      desc: 'Motion alerts, analytics, camera offline, operator call-ups',
                      confidence: 'MEDIUM',
                      color: 'purple',
                    },
                    {
                      id: 'ALARM',
                      icon: <AlertTriangle className="w-4 h-4" />,
                      name: 'Alarm & Intrusion',
                      desc: 'Zone alarms, duress, panic, supervisory signals',
                      confidence: 'HIGH',
                      color: 'red',
                    },
                    {
                      id: 'SIEM',
                      icon: <Cpu className="w-4 h-4" />,
                      name: 'SIEM / Cyber',
                      desc: 'Phishing, identity anomalies, endpoint, VPN issues',
                      confidence: 'MEDIUM',
                      color: 'orange',
                    },
                    {
                      id: 'OSINT',
                      icon: <Brain className="w-4 h-4" />,
                      name: 'OSINT / Intel Desk',
                      desc: 'Dark web, media, travel advisories, threat intel',
                      confidence: 'MEDIUM',
                      color: 'violet',
                    },
                    {
                      id: 'TIP',
                      icon: <MessageSquare className="w-4 h-4" />,
                      name: 'Tips & Human Reports',
                      desc: 'Hotline calls, email reports, employee observations',
                      confidence: 'LOW',
                      color: 'blue',
                    },
                    {
                      id: 'RADIO',
                      icon: <Radio className="w-4 h-4" />,
                      name: 'Radio / Dispatch',
                      desc: 'Officer status, ETA, on-scene reports, patrol observations',
                      confidence: 'HIGH',
                      color: 'emerald',
                    },
                    {
                      id: 'FACILITIES',
                      icon: <Building className="w-4 h-4" />,
                      name: 'Facilities / BMS',
                      desc: 'Elevator, HVAC, fire supervisory, environmental',
                      confidence: 'HIGH',
                      color: 'amber',
                    },
                  ].map((channel) => (
                    <div
                      key={channel.id}
                      className={`p-3 rounded-lg bg-${channel.color}-500/10 border border-${channel.color}-500/30`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-${channel.color}-400`}>{channel.icon}</span>
                        <span className={`text-${channel.color}-400 font-semibold text-sm`}>
                          {channel.name}
                        </span>
                        <span
                          className={`text-2xs px-1.5 py-0.5 rounded bg-${channel.color}-500/20 text-${channel.color}-300 ml-auto`}
                        >
                          {channel.confidence}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{channel.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold text-gray-300">Inject Metadata</h4>
                <p className="text-xs text-gray-400 mb-2">
                  Each inject carries metadata that affects how you should prioritize and respond:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: 'Confidence',
                      desc: 'VERIFIED → HIGH → MEDIUM → LOW → UNVERIFIED → CONFLICTING',
                      icon: <Signal className="w-3 h-3" />,
                    },
                    {
                      label: 'Completeness',
                      desc: 'COMPLETE → PARTIAL → MINIMAL → FRAGMENT',
                      icon: <CircleDot className="w-3 h-3" />,
                    },
                    {
                      label: 'Corrections',
                      desc: 'UPDATE badge indicates new info on prior inject',
                      icon: <RefreshCw className="w-3 h-3" />,
                    },
                    {
                      label: 'Attachments',
                      desc: 'Stills, video clips, map pins, documents, logs',
                      icon: <Paperclip className="w-3 h-3" />,
                    },
                  ].map((meta) => (
                    <div
                      key={meta.label}
                      className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50"
                    >
                      <div className="flex items-center gap-1.5 text-gray-300 text-xs font-medium mb-1">
                        {meta.icon}
                        {meta.label}
                      </div>
                      <p className="text-2xs text-gray-500">{meta.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
                <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                  <EyeOff className="w-4 h-4" />
                  <strong>Signal vs. Noise</strong>
                </div>
                <p className="text-xs text-gray-300">
                  Not every inject requires action. &quot;Routine&quot; items (maintenance events,
                  verified deliveries, scheduled activities) appear but should be deprioritized.
                  Triage discipline means focusing on high-value signals while acknowledging noise.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'assets' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Asset Identification & Prioritization
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Before treating risk, identify <strong>what&apos;s at risk</strong>. Assets have
                owners, criticality levels, and current exposure status.
              </p>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Criticality Levels</h4>
                {[
                  {
                    level: 'CRITICAL',
                    desc: 'Loss causes severe business impact, regulatory breach, or life safety risk',
                    color: 'red',
                  },
                  {
                    level: 'HIGH',
                    desc: 'Significant operational disruption or financial loss',
                    color: 'orange',
                  },
                  {
                    level: 'MEDIUM',
                    desc: 'Moderate impact; workarounds exist but costly',
                    color: 'amber',
                  },
                  {
                    level: 'LOW',
                    desc: 'Minimal impact; easily recoverable',
                    color: 'gray',
                  },
                ].map((item) => (
                  <div
                    key={item.level}
                    className={clsx(
                      'p-3 rounded-xl border flex items-center gap-3',
                      `bg-${item.color}-500/10 border-${item.color}-500/30`
                    )}
                  >
                    <span
                      className={clsx(
                        'text-xs font-bold px-2 py-1 rounded',
                        `bg-${item.color}-500/20 text-${item.color}-400`
                      )}
                    >
                      {item.level}
                    </span>
                    <p className="text-xs text-gray-300">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
                <h4 className="text-amber-400 font-semibold mb-2">Asset Owner Model</h4>
                <p className="text-sm text-gray-300 mb-2">
                  Each asset has a designated <strong>owner</strong> who bears ultimate
                  accountability for risk decisions affecting that asset.
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>
                    • <strong>Owner&apos;s Role:</strong> Accept or reject recommended treatment
                  </p>
                  <p>
                    • <strong>Security&apos;s Role:</strong> Advise on risk, recommend treatment,
                    document
                  </p>
                  <p>
                    • <strong>Risk Tolerance:</strong> Owner&apos;s threshold for acceptable risk
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <p className="text-sm text-violet-200">
                  <strong>In-Sim:</strong> Select the affected asset before choosing treatment.
                  Briefing the asset owner earns +75 bonus points.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'risks' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Risk Assessment</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                ESRM uses a structured approach: <strong>Threat × Vulnerability × Impact</strong>{' '}
                determines risk level and informs treatment selection.
              </p>

              <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">5×5 Risk Matrix</h4>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-6 gap-1 text-center min-w-[320px]">
                    <div className="text-2xs text-gray-500 p-1"></div>
                    {['Insignif.', 'Minor', 'Moderate', 'Major', 'Catastrophic'].map((h) => (
                      <div key={h} className="text-2xs text-gray-500 p-1 font-medium">
                        {h}
                      </div>
                    ))}

                    {[
                      { label: 'Almost Certain', cells: ['M', 'H', 'H', 'C', 'C'] },
                      { label: 'Likely', cells: ['M', 'M', 'H', 'H', 'C'] },
                      { label: 'Possible', cells: ['L', 'M', 'M', 'H', 'H'] },
                      { label: 'Unlikely', cells: ['L', 'L', 'M', 'M', 'H'] },
                      { label: 'Rare', cells: ['L', 'L', 'L', 'M', 'M'] },
                    ].map((row) => (
                      <>
                        <div key={row.label} className="text-2xs text-gray-400 p-1 text-right">
                          {row.label}
                        </div>
                        {row.cells.map((cell, i) => (
                          <div
                            key={`${row.label}-${i}`}
                            className={clsx(
                              'text-2xs font-bold p-1.5 rounded',
                              cell === 'C' && 'bg-red-500/30 text-red-400',
                              cell === 'H' && 'bg-orange-500/30 text-orange-400',
                              cell === 'M' && 'bg-amber-500/30 text-amber-400',
                              cell === 'L' && 'bg-emerald-500/30 text-emerald-400'
                            )}
                          >
                            {cell === 'C'
                              ? 'CRIT'
                              : cell === 'H'
                                ? 'HIGH'
                                : cell === 'M'
                                  ? 'MED'
                                  : 'LOW'}
                          </div>
                        ))}
                      </>
                    ))}
                  </div>
                </div>
                <p className="text-2xs text-gray-500 mt-2 text-center">
                  Rows: Likelihood • Columns: Impact
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <h5 className="text-cyan-400 font-semibold text-xs mb-1">Threat</h5>
                  <p className="text-2xs text-gray-400">Actor capability and intent to exploit</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h5 className="text-amber-400 font-semibold text-xs mb-1">Vulnerability</h5>
                  <p className="text-2xs text-gray-400">Weakness that can be exploited</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <h5 className="text-red-400 font-semibold text-xs mb-1">Impact</h5>
                  <p className="text-2xs text-gray-400">Consequence if risk materializes</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 mt-4">
                <p className="text-sm text-violet-200">
                  <strong>In-Sim:</strong> Each inject signals risk level through urgency badges
                  (IMMEDIATE/URGENT/ROUTINE) and domain indicators.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'treatments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Risk Treatment Options</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                ESRM provides four treatment options. Each maps to an operational posture. All four
                are first-class choices—select based on risk level and context.
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">ACCEPT</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        → CONTINUE
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    Risk is within tolerance. Proceed with awareness and monitoring.
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>When:</strong> Low risk, cost of treatment exceeds impact, business
                    opportunity outweighs concern
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">MITIGATE</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        → DEGRADE
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    Apply compensating controls to reduce likelihood and/or impact.
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>When:</strong> Risk exceeds tolerance but elimination not feasible;
                    controls exist that reduce exposure
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">TRANSFER</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        → DEGRADE
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    Shift risk to third party via insurance, contracts, or outsourcing.
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>When:</strong> Insurance coverage exists; vendor can better manage risk;
                    contractual shift appropriate
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-bold">AVOID</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                        → PAUSE
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">
                    Eliminate the risk source entirely. Most protective but highest business impact.
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>When:</strong> CRITICAL risk; life safety at stake; no adequate
                    mitigation exists
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 mt-4">
                <h4 className="text-gray-300 font-semibold text-sm mb-2">Residual Risk</h4>
                <p className="text-xs text-gray-400">
                  No treatment eliminates all risk. Document what remains after your decision. This
                  is critical for owner acknowledgment and audit trail.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'advisor' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">The Advisor → Owner Model</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                ESRM&apos;s core governance principle: Security advises, asset owners decide. This
                model ensures accountability and prevents security overreach.
              </p>

              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-600/5 border border-violet-500/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-violet-400 font-semibold">The Handoff</h4>
                    <p className="text-xs text-gray-400">Security → Asset Owner</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span className="text-gray-300">
                      <strong>Assess:</strong> Evaluate threat, vulnerability, impact
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <span className="text-gray-300">
                      <strong>Recommend:</strong> Propose treatment based on assessment
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">3.</span>
                    <span className="text-gray-300">
                      <strong>Brief:</strong> Communicate risk clearly to asset owner
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-violet-400 font-bold">4.</span>
                    <span className="text-gray-300">
                      <strong>Affirm:</strong> Owner acknowledges and accepts (or modifies)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">5.</span>
                    <span className="text-gray-300">
                      <strong>Document:</strong> Record decision and residual risk
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <h5 className="text-emerald-400 font-semibold text-sm mb-1">
                    Security&apos;s Authority
                  </h5>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Risk assessment</li>
                    <li>• Treatment recommendations</li>
                    <li>• Control implementation</li>
                    <li>• Monitoring & escalation</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h5 className="text-amber-400 font-semibold text-sm mb-1">
                    Owner&apos;s Authority
                  </h5>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Accept/reject treatment</li>
                    <li>• Own residual risk</li>
                    <li>• Resource decisions</li>
                    <li>• Business tradeoffs</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
                <p className="text-sm text-amber-200">
                  <strong>In-Sim:</strong> Click &ldquo;Brief Now&rdquo; to notify the asset owner.
                  This earns +75 ESRM bonus points and demonstrates proper governance.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'team' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Team Management</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Global GSOC/CMIC leadership requires managing operators across regions, ensuring
                coverage, quality, and effective handoffs.
              </p>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Follow-the-Sun Model</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { region: 'AMERICAS', short: 'AMER', tz: 'EST/PST', color: 'blue' },
                    { region: 'EMEA', short: 'EMEA', tz: 'GMT/CET', color: 'violet' },
                    { region: 'APAC', short: 'APAC', tz: 'SGT/JST', color: 'emerald' },
                  ].map((r) => (
                    <div
                      key={r.region}
                      className={clsx(
                        'p-2.5 rounded-lg border text-center',
                        `bg-${r.color}-500/10 border-${r.color}-500/30`
                      )}
                    >
                      <span className={`text-${r.color}-400 font-bold text-sm`}>{r.short}</span>
                      <p className="text-2xs text-gray-500 mt-0.5">{r.tz}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/15 to-cyan-600/5 border border-cyan-500/40">
                <h4 className="text-cyan-400 font-semibold mb-2">Shift Handoff Quality</h4>
                <p className="text-sm text-gray-300 mb-2">
                  Quality handoffs ensure continuity. Brief the incoming lead on:
                </p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>
                    • <strong>Open incidents</strong> — current status and next actions
                  </li>
                  <li>
                    • <strong>Active escalations</strong> — who has been notified
                  </li>
                  <li>
                    • <strong>Pending decisions</strong> — awaiting stakeholder input
                  </li>
                  <li>
                    • <strong>Watch items</strong> — emerging situations to monitor
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Coverage Management</h4>
                <p className="text-xs text-gray-400 mb-2">
                  Monitor for gaps caused by PTO, sick leave, training, or surge demand. Mitigation
                  options include overtime, cross-training, or mutual aid.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'Overtime', desc: 'Extend current shift', cost: 'MEDIUM' },
                    { type: 'Cross-Train', desc: 'Adjacent region support', cost: 'LOW' },
                    { type: 'Contractor', desc: 'Surge staffing', cost: 'HIGH' },
                    { type: 'Defer', desc: 'Non-critical work only', cost: 'LOW' },
                  ].map((m) => (
                    <div key={m.type} className="p-2 rounded-lg bg-gray-800/40 text-xs">
                      <span className="text-gray-300 font-medium">{m.type}</span>
                      <p className="text-gray-500 text-2xs">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <p className="text-sm text-violet-200">
                  <strong>Leadership Moment:</strong> Coaching operators under pressure builds
                  resilience. Balance immediate incident needs with development.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'stakeholders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Stakeholder Management</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Effective GSOC leadership requires managing relationships with executives, business
                units, and cross-functional partners.
              </p>

              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-600/5 border border-violet-500/40">
                <h4 className="text-violet-400 font-semibold mb-2">Stakeholder Map Quadrant</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Prioritize engagement based on power and interest:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                    <span className="text-red-400 font-bold">High Power / High Interest</span>
                    <p className="text-gray-500 mt-0.5">Manage closely (CSO, GC, CISO)</p>
                  </div>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                    <span className="text-amber-400 font-bold">High Power / Low Interest</span>
                    <p className="text-gray-500 mt-0.5">Keep satisfied (CEO, Board)</p>
                  </div>
                  <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
                    <span className="text-cyan-400 font-bold">Low Power / High Interest</span>
                    <p className="text-gray-500 mt-0.5">Keep informed (Site managers)</p>
                  </div>
                  <div className="p-2 rounded bg-gray-800 border border-gray-700">
                    <span className="text-gray-400 font-bold">Low Power / Low Interest</span>
                    <p className="text-gray-500 mt-0.5">Monitor (General staff)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Escalation Framework</h4>
                <p className="text-xs text-gray-400 mb-2">
                  Know who to notify and when. Each level has different authority and response
                  times.
                </p>
                {[
                  { level: 1, name: 'Watch Desk', notify: 'Watch Commander', time: '60m' },
                  { level: 2, name: 'Team Lead', notify: 'Regional Lead', time: '30m' },
                  { level: 3, name: 'Management', notify: 'Director + Legal', time: '15m' },
                  { level: 4, name: 'Executive', notify: 'CSO + CEO Office', time: '10m' },
                  { level: 5, name: 'Crisis Team', notify: 'Full CMT + Board', time: '5m' },
                ].map((esc) => (
                  <div
                    key={esc.level}
                    className={clsx(
                      'p-2 rounded-lg border flex items-center justify-between',
                      esc.level >= 4
                        ? 'bg-red-500/10 border-red-500/30'
                        : esc.level >= 3
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-gray-800/40 border-gray-700/40'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'w-5 h-5 rounded flex items-center justify-center text-2xs font-bold',
                          esc.level >= 4
                            ? 'bg-red-500/20 text-red-400'
                            : esc.level >= 3
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-700 text-gray-400'
                        )}
                      >
                        {esc.level}
                      </span>
                      <div>
                        <span className="text-gray-300 text-xs font-medium">{esc.name}</span>
                        <p className="text-2xs text-gray-500">{esc.notify}</p>
                      </div>
                    </div>
                    <span className="text-2xs text-gray-500">{esc.time}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-200">
                  <strong>Executive Presence:</strong> When briefing executives, lead with the
                  bottom line. State the situation, your assessment, and recommendation clearly.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'response' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Response & Post-Incident Review
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                ESRM includes structured incident response and After-Action Review (AAR) to close
                the cycle and feed continuous improvement.
              </p>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">60-Minute Playbook Phases</h4>
                {[
                  {
                    name: 'Assessment',
                    time: '0-10m',
                    desc: 'Establish scope, initial posture',
                    color: 'emerald',
                  },
                  {
                    name: 'Bridge',
                    time: '10-20m',
                    desc: 'Stakeholder coordination',
                    color: 'cyan',
                  },
                  {
                    name: 'Continuity',
                    time: '20-35m',
                    desc: 'Compensating controls',
                    color: 'amber',
                  },
                  {
                    name: 'Information',
                    time: '35-50m',
                    desc: 'Data exposure assessment',
                    color: 'violet',
                  },
                  {
                    name: 'Checkpoint',
                    time: '50-60m',
                    desc: 'Review, validate, plan',
                    color: 'blue',
                  },
                ].map((phase) => (
                  <div
                    key={phase.name}
                    className={clsx(
                      'p-2.5 rounded-lg border flex items-center justify-between',
                      `bg-${phase.color}-500/10 border-${phase.color}-500/30`
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-${phase.color}-400 font-semibold text-sm`}>
                        {phase.name}
                      </span>
                      <span className="text-xs text-gray-500">{phase.desc}</span>
                    </div>
                    <span className="text-2xs text-gray-500 font-mono">{phase.time}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 mt-4">
                <h4 className="text-gray-300 font-semibold text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  After-Action Review (AAR)
                </h4>
                <div className="text-xs text-gray-400 space-y-1.5">
                  <p>
                    • <strong>What was supposed to happen?</strong> — Learning objective
                  </p>
                  <p>
                    • <strong>What actually happened?</strong> — Decisions made, outcomes
                  </p>
                  <p>
                    • <strong>What went well?</strong> — Sustains to continue
                  </p>
                  <p>
                    • <strong>What can improve?</strong> — Lessons learned
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mt-4">
                <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                  <Activity className="w-4 h-4" />
                  <strong>Continuous Improvement</strong>
                </div>
                <p className="text-xs text-gray-300">
                  AAR findings feed back into the ESRM cycle—improving asset identification, risk
                  assessment, and treatment selection for future incidents.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'scoring' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">How Scoring Works</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Your score reflects ESRM discipline: decision quality, stakeholder engagement, and
                risk documentation—not just speed.
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Point Values</h4>
                {[
                  { label: 'Correct treatment decision', value: '+150', color: 'emerald' },
                  { label: 'Time bonus (faster = more)', value: '+2/sec', color: 'amber' },
                  { label: 'Asset owner briefed', value: '+75', color: 'violet' },
                  { label: 'Residual risk documented', value: '+50', color: 'blue' },
                  { label: 'Early phase bonus', value: '+25', color: 'cyan' },
                  { label: 'Entity linking bonus', value: '+20', color: 'orange' },
                  { label: 'Decision timeout', value: '-50', color: 'red' },
                  { label: 'Resource contention', value: '-30', color: 'red' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-2.5 rounded-lg bg-gray-800/50 flex items-center justify-between"
                  >
                    <span className="text-gray-300 text-sm">{item.label}</span>
                    <span className={`text-${item.color}-400 font-mono font-bold`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 mt-4">
                <h4 className="text-gray-300 font-semibold text-sm mb-2">Multipliers</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-gray-800/60">
                    <span className="text-amber-400">Decision Streak</span>
                    <span className="text-gray-400 block">up to 2.5×</span>
                  </div>
                  <div className="p-2 rounded bg-gray-800/60">
                    <span className="text-red-400">Escalation Level</span>
                    <span className="text-gray-400 block">1.0× → 1.5×</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mt-4">
                <h4 className="text-emerald-400 font-semibold text-sm mb-2">Grade Scale</h4>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {[
                    { grade: 'S', title: 'Legend', color: 'purple' },
                    { grade: 'A', title: 'Commander', color: 'emerald' },
                    { grade: 'B', title: 'Operator', color: 'blue' },
                    { grade: 'C', title: 'Learning', color: 'amber' },
                    { grade: 'D', title: 'Needs Work', color: 'orange' },
                    { grade: 'F', title: 'Failed', color: 'red' },
                  ].map((g) => (
                    <div key={g.grade} className="p-1.5">
                      <div className={`text-${g.color}-400 font-black text-lg`}>{g.grade}</div>
                      <div className="text-2xs text-gray-500">{g.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'glossary' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Acronym Glossary</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Quick reference for security operations terminology used throughout the simulation.
              </p>

              <div className="space-y-2 max-h-[45vh] overflow-y-auto scrollbar-thin pr-2">
                {glossaryTerms.map((item) => (
                  <div
                    key={item.term}
                    className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40 hover:border-gray-600/60 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded flex-shrink-0">
                        {item.term}
                      </span>
                      <p className="text-sm text-gray-300 leading-relaxed">{item.definition}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 mt-4">
                <p className="text-sm text-violet-200">
                  <strong>Tip:</strong> Tap any underlined term in the simulation to see its
                  definition. ESRM-specific concepts are explained in context throughout gameplay.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'kri' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Key Risk Indicators (KRIs)</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                KRIs provide glanceable, traffic-light health metrics. Leading indicators predict
                issues; lagging indicators measure outcomes.
              </p>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
                <h4 className="text-cyan-400 font-semibold text-sm mb-2">Traffic Light System</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs text-gray-300">GREEN = Within tolerance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-xs text-gray-300">AMBER = Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="text-xs text-gray-300">RED = Critical</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Leading Indicators</h4>
                {[
                  {
                    name: 'MTTA',
                    desc: 'Mean Time To Acknowledge — seconds from inject reveal to decision',
                    target: '< 30s',
                  },
                  {
                    name: 'Open Critical',
                    desc: 'Unhandled IMMEDIATE priority injects',
                    target: '0',
                  },
                  {
                    name: 'Dispatch Contention',
                    desc: 'Resource strain across guards/analysts/responders',
                    target: '< 25%',
                  },
                  {
                    name: 'Escalation Level',
                    desc: 'Activity (1) → Incident (2) → Investigation (3)',
                    target: 'Match threat',
                  },
                  {
                    name: 'Channel Signal',
                    desc: 'Ratio of verified facts to assumptions/unknowns',
                    target: '> 70%',
                  },
                ].map((kri) => (
                  <div
                    key={kri.name}
                    className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-cyan-400">{kri.name}</span>
                      <span className="text-2xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                        {kri.target}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{kri.desc}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold text-gray-300">Lagging Indicators</h4>
                {[
                  {
                    name: 'MTTR',
                    desc: 'Mean Time To Resolve — seconds from first inject to stability',
                    target: '< 300s',
                  },
                  {
                    name: 'Residual Rate',
                    desc: 'Decisions with explicit residual risk documentation',
                    target: '> 80%',
                  },
                  {
                    name: 'Owner Briefing',
                    desc: 'Decisions with asset owner engagement',
                    target: '> 80%',
                  },
                  {
                    name: 'Treatment Diversity',
                    desc: 'Use of multiple treatment options (accept/mitigate/transfer/avoid)',
                    target: '> 50%',
                  },
                ].map((kri) => (
                  <div
                    key={kri.name}
                    className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-violet-400">{kri.name}</span>
                      <span className="text-2xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 font-mono">
                        {kri.target}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{kri.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
                <p className="text-xs text-amber-200">
                  <strong>Musk 5-Step:</strong> Only metrics that change judgment. KRIs surface
                  decision-useful signals, not vanity dashboards.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'value' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">ESRM Value Metrics</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Track security&apos;s underlying business value created — not vanity SaaS metrics.
                These show real impact from your decisions.
              </p>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
                <h4 className="text-emerald-400 font-semibold text-sm mb-2">
                  Core Value Categories
                </h4>
                <p className="text-xs text-gray-300">
                  Protected mission continuity • Residual risk reduced vs accepted • Owner-affirmed
                  decisions • Avoided loss proxies • Advisor effectiveness
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Mission Continuity',
                    desc: 'Operational state maintained during incident: OPERATIONAL → DEGRADED → DISRUPTED → HALTED',
                    icon: '🛡️',
                    color: 'cyan',
                  },
                  {
                    name: 'Residual Risk',
                    desc: 'Explicit documentation of risk remaining after treatment. Shows ESRM discipline.',
                    icon: '⚠️',
                    color: 'amber',
                  },
                  {
                    name: 'Owner Affirmation',
                    desc: 'Asset owners briefed and risk acknowledged. Core ESRM governance requirement.',
                    icon: '👥',
                    color: 'violet',
                  },
                  {
                    name: 'Avoided Loss',
                    desc: 'Proxy measures of losses prevented: safety incidents, breaches, disruptions.',
                    icon: '✓',
                    color: 'emerald',
                  },
                  {
                    name: 'Advisor Effectiveness',
                    desc: 'Recommendations provided, accepted, time to decision, information quality.',
                    icon: '🧠',
                    color: 'blue',
                  },
                ].map((metric) => (
                  <div
                    key={metric.name}
                    className={`p-3 rounded-xl bg-${metric.color}-500/10 border border-${metric.color}-500/30`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{metric.icon}</span>
                      <span className={`text-sm font-semibold text-${metric.color}-400`}>
                        {metric.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{metric.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 mt-4">
                <h4 className="text-violet-400 font-semibold text-sm mb-2">
                  Composite Value Score
                </h4>
                <p className="text-xs text-gray-300">
                  Weighted combination of all value categories. Shows overall security value
                  delivered during the incident response.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'pipeline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Data Pipeline</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Realistic pipeline stages based on top software providers&apos; designs — generic
                names, no trademark cosplay.
              </p>

              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/40 mb-4">
                <h4 className="text-gray-300 font-semibold text-sm mb-3">Pipeline Flow</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {[
                    'Source',
                    '→',
                    'Normalize',
                    '→',
                    'Enrich',
                    '→',
                    'Correlate',
                    '→',
                    'Triage',
                    '→',
                    'Case',
                    '→',
                    'Decision',
                    '→',
                    'AAR',
                  ].map((stage, idx) => (
                    <span
                      key={idx}
                      className={
                        stage === '→'
                          ? 'text-gray-600'
                          : 'px-2 py-1 rounded bg-gray-800 text-gray-300'
                      }
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Stage Definitions</h4>
                {[
                  {
                    name: 'Source Intake',
                    desc: 'Raw event ingestion from ACS/VMS/SIEM/alarm/OSINT/tip/dispatch',
                  },
                  {
                    name: 'Normalize',
                    desc: 'Schema standardization, field mapping to common taxonomy',
                  },
                  {
                    name: 'Enrich',
                    desc: 'Context addition: asset info, threat intel, geo, identity',
                  },
                  {
                    name: 'Correlate',
                    desc: 'Cross-source correlation, entity linking, pattern detection',
                  },
                  {
                    name: 'Triage Queue',
                    desc: 'Priority sorting (IMMEDIATE/URGENT/ROUTINE), analyst routing',
                  },
                  {
                    name: 'Case/Activity',
                    desc: 'Incident bundling, workflow assignment, status tracking',
                  },
                  { name: 'COP/Decision', desc: 'Common Operating Picture, ESRM posture decision' },
                  {
                    name: 'AAR Feedback',
                    desc: 'After-action review, lessons learned, continuous improvement',
                  },
                ].map((stage) => (
                  <div
                    key={stage.name}
                    className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40"
                  >
                    <span className="text-sm font-semibold text-gray-200">{stage.name}</span>
                    <p className="text-xs text-gray-400 mt-1">{stage.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
                <h4 className="text-amber-400 font-semibold text-sm mb-2">Health Metrics</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-xs text-gray-400">Latency</span>
                    <p className="text-2xs text-gray-500 mt-0.5">Processing delay (ms)</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Drop Rate</span>
                    <p className="text-2xs text-gray-500 mt-0.5">Events lost (%)</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Enrich Miss</span>
                    <p className="text-2xs text-gray-500 mt-0.5">Context gaps (%)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800/60 flex items-center justify-between">
          <p className="text-xs text-gray-600">Based on ASIS ESRM Guidelines • Allen & Loyear</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold hover:bg-emerald-500/25 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

function CoachMarks({ onDismiss }: { onDismiss: () => void }): JSX.Element {
  return (
    <div className="fixed bottom-24 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:w-80 z-[45] animate-slide-in">
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-amber-400 font-semibold mb-1">Quick Start</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Press <strong>Play</strong> to start. Intel arrives fast—select an item to make a
              posture decision.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={onDismiss}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={onDismiss}
                className="text-xs text-amber-400 font-medium hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Open Field Guide
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EntityLinkPanel({
  entities,
  injects,
  highlightedEntityId,
  onHighlightEntity,
  onClose,
}: {
  entities: LinkedEntity[];
  injects: ScenarioInject[];
  highlightedEntityId: string | null;
  onHighlightEntity: (id: string | null) => void;
  onClose: () => void;
}): JSX.Element {
  const getEntityAppearances = (entityId: string): number => {
    return injects.filter((i) => {
      const linkedIds = (i as unknown as { linkedEntityIds?: string[] }).linkedEntityIds || [];
      return linkedIds.includes(entityId);
    }).length;
  };

  const getRelatedEntities = (entityId: string): LinkedEntity[] => {
    const entity = entities.find((e) => e.id === entityId);
    if (!entity?.relatedEntityIds) return [];
    return entities.filter((e) => entity.relatedEntityIds?.includes(e.id));
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-5 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Entity Link Map</h2>
              <p className="text-xs text-gray-500">{entities.length} entities across injects</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity) => {
              const config = ENTITY_TYPE_CONFIG[entity.type];
              const appearances = getEntityAppearances(entity.id);
              const related = getRelatedEntities(entity.id);
              const isHighlighted = highlightedEntityId === entity.id;

              return (
                <button
                  key={entity.id}
                  onClick={() => onHighlightEntity(isHighlighted ? null : entity.id)}
                  className={clsx(
                    'p-4 rounded-2xl border-2 text-left transition-all duration-200',
                    isHighlighted
                      ? 'bg-cyan-500/15 border-cyan-500/50 ring-2 ring-cyan-500/30'
                      : 'bg-gray-800/30 border-gray-700/40 hover:border-gray-600/60'
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        config.bgColor
                      )}
                    >
                      <config.icon className={clsx('w-5 h-5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-200 truncate">
                        {entity.shortName || entity.name}
                      </h4>
                      <span className={clsx('text-2xs font-medium', config.color)}>
                        {config.label}
                      </span>
                    </div>
                    {entity.criticality && (
                      <span
                        className={clsx(
                          'text-2xs px-1.5 py-0.5 rounded font-bold',
                          entity.criticality === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400'
                            : entity.criticality === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-700 text-gray-400'
                        )}
                      >
                        {entity.criticality}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{entity.description}</p>

                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-gray-500">
                      Appears in <span className="text-cyan-400 font-bold">{appearances}</span>{' '}
                      injects
                    </span>
                    {related.length > 0 && (
                      <span className="text-gray-500">
                        <span className="text-violet-400 font-bold">{related.length}</span> links
                      </span>
                    )}
                  </div>

                  {isHighlighted && related.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <p className="text-2xs text-gray-500 mb-2">Related entities:</p>
                      <div className="flex flex-wrap gap-1">
                        {related.map((r) => (
                          <span
                            key={r.id}
                            className="text-2xs px-2 py-0.5 rounded bg-gray-800 text-gray-300"
                          >
                            {r.shortName || r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaybookPhaseTracker({
  currentPhase,
  phaseProgress,
}: {
  currentPhase: number;
  phaseProgress: Record<number, number>;
}): JSX.Element {
  return (
    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700/40">
      <div className="flex items-center gap-2 mb-3">
        <Hourglass className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-gray-300">Playbook Phase</span>
      </div>
      <div className="space-y-2">
        {PLAYBOOK_PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isActive = idx === currentPhase;
          const isComplete = idx < currentPhase;
          const progress = phaseProgress[idx] || 0;

          return (
            <div key={phase.name} className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0',
                  isComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-gray-800 text-gray-600'
                )}
              >
                {isComplete ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={clsx(
                      'text-2xs font-medium truncate',
                      isActive
                        ? 'text-amber-400'
                        : isComplete
                          ? 'text-emerald-400'
                          : 'text-gray-500'
                    )}
                  >
                    {phase.name}
                  </span>
                  <span className="text-2xs text-gray-600">{phase.duration}m</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full transition-all duration-500',
                      isComplete ? 'bg-emerald-500' : isActive ? 'bg-amber-500' : 'bg-gray-700'
                    )}
                    style={{ width: isComplete ? '100%' : isActive ? `${progress}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TacticalActionsPanel({
  tacticalState,
  availableResources,
  onDeploy,
  onClose,
  lastFeedback,
  reducedMotion,
}: {
  tacticalState: TacticalState;
  availableResources: { guards: number; analysts: number; responders: number };
  onDeploy: (actionId: string) => void;
  onClose: () => void;
  lastFeedback: DeploymentFeedback | null;
  reducedMotion: boolean;
}): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const availableActions = getAvailableActions(tacticalState);

  const categories = Object.entries(TACTICAL_CATEGORY_CONFIG) as [
    string,
    { label: string; color: string; bgColor: string },
  ][];

  const filteredActions = selectedCategory
    ? availableActions.filter((a) => a.category === selectedCategory)
    : availableActions;

  const activeDeployments = tacticalState.deployedActions.filter((d) => d.status === 'ACTIVE');

  const canDeploy = (action: TacticalAction): boolean => {
    if ((action.resourceCost.guards || 0) > availableResources.guards) return false;
    if ((action.resourceCost.analysts || 0) > availableResources.analysts) return false;
    if ((action.resourceCost.responders || 0) > availableResources.responders) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={clsx(
          'w-full max-w-3xl max-h-[85vh] bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl',
          !reducedMotion && 'animate-scale-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tactical Actions</h2>
              <p className="text-xs text-gray-500">
                Deploy security measures • Residual Risk: {tacticalState.residualRisk}%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {lastFeedback && (
          <div
            className={clsx(
              'mx-4 mt-4 p-3 rounded-xl border',
              lastFeedback.success && lastFeedback.effectiveness === 'HIGH'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : lastFeedback.success &&
                    (lastFeedback.effectiveness === 'MEDIUM' ||
                      lastFeedback.effectiveness === 'LOW')
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-red-500/15 border-red-500/40 text-red-400'
            )}
          >
            <div className="flex items-start gap-2">
              {lastFeedback.success ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">{lastFeedback.message}</p>
                {lastFeedback.unintendedEffect && (
                  <p className="text-xs mt-1 opacity-80">⚠️ {lastFeedback.unintendedEffect}</p>
                )}
                <p className="text-2xs mt-1 opacity-60">
                  {lastFeedback.businessImpactIncurred}
                  {lastFeedback.pointsAwarded > 0 && ` • +${lastFeedback.pointsAwarded} pts`}
                  {lastFeedback.pointsPenalty > 0 && ` • -${lastFeedback.pointsPenalty} pts`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resources Status Bar */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-800/40 bg-gray-900/30">
          <span className="text-2xs text-gray-500 uppercase tracking-wider">Available:</span>
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm font-mono text-amber-400">{availableResources.guards}</span>
            <span className="text-2xs text-gray-600">guards</span>
          </div>
          <div className="flex items-center gap-1">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-sm font-mono text-violet-400">{availableResources.analysts}</span>
            <span className="text-2xs text-gray-600">analysts</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm font-mono text-cyan-400">{availableResources.responders}</span>
            <span className="text-2xs text-gray-600">responders</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-2xs text-gray-500">Score:</span>
            <span className="text-sm font-mono text-emerald-400">
              +{tacticalState.tacticalScore}
            </span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-thin border-b border-gray-800/40">
          <button
            onClick={() => setSelectedCategory(null)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0',
              selectedCategory === null
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            )}
          >
            All ({availableActions.length})
          </button>
          {categories.map(([key, config]) => {
            const count = availableActions.filter((a) => a.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0',
                  selectedCategory === key
                    ? `${config.bgColor} ${config.color}`
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                )}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Active Deployments */}
        {activeDeployments.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-800/40 bg-cyan-500/5">
            <p className="text-2xs text-cyan-400 uppercase tracking-wider mb-2">
              Active Deployments
            </p>
            <div className="flex flex-wrap gap-2">
              {activeDeployments.map((deployment) => {
                const action = TACTICAL_ACTIONS.find((a) => a.id === deployment.actionId);
                if (!action) return null;
                const catConfig = TACTICAL_CATEGORY_CONFIG[action.category];
                return (
                  <div
                    key={deployment.actionId}
                    className={clsx(
                      'px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5',
                      catConfig.bgColor,
                      catConfig.color
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {action.shortName}
                    <span className="opacity-60">-{deployment.riskReductionApplied}%</span>
                    {deployment.effectiveness !== 'HIGH' && (
                      <span className="opacity-60">({deployment.effectiveness})</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions List */}
        <div className="p-4 overflow-y-auto max-h-[45vh] scrollbar-thin">
          {filteredActions.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No actions available in this category</p>
              <p className="text-gray-600 text-xs mt-1">
                Actions may have prerequisites or be on cooldown
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredActions.map((action) => {
                const catConfig = TACTICAL_CATEGORY_CONFIG[action.category];
                const deployable = canDeploy(action);

                return (
                  <div
                    key={action.id}
                    className={clsx(
                      'p-4 rounded-xl border-2 transition-all',
                      deployable
                        ? 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600'
                        : 'bg-gray-900/30 border-gray-800/30 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={clsx(
                              'text-2xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider',
                              catConfig.bgColor,
                              catConfig.color
                            )}
                          >
                            {catConfig.label}
                          </span>
                          <span className="text-sm font-semibold text-white">{action.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{action.description}</p>

                        <div className="flex flex-wrap items-center gap-3 text-2xs">
                          <span className="text-emerald-400">-{action.riskReduction}% risk</span>
                          {action.businessImpact !== 'NONE' && (
                            <span
                              className={clsx(
                                action.businessImpact === 'CRITICAL'
                                  ? 'text-red-400'
                                  : action.businessImpact === 'HIGH'
                                    ? 'text-orange-400'
                                    : action.businessImpact === 'MEDIUM'
                                      ? 'text-amber-400'
                                      : 'text-gray-500'
                              )}
                            >
                              {action.businessImpact} business impact
                            </span>
                          )}
                          {action.duration > 0 && (
                            <span className="text-gray-500">{action.duration}m duration</span>
                          )}
                          {(action.resourceCost.guards ||
                            action.resourceCost.analysts ||
                            action.resourceCost.responders) && (
                            <span className="text-gray-500">
                              Needs:
                              {action.resourceCost.guards && ` ${action.resourceCost.guards}G`}
                              {action.resourceCost.analysts && ` ${action.resourceCost.analysts}A`}
                              {action.resourceCost.responders &&
                                ` ${action.resourceCost.responders}R`}
                            </span>
                          )}
                        </div>

                        {action.unintendedConsequences &&
                          action.unintendedConsequences.length > 0 && (
                            <p className="text-2xs text-amber-400/70 mt-1">
                              ⚠️ May cause: {action.unintendedConsequences[0].description}
                            </p>
                          )}
                      </div>

                      <button
                        onClick={() => onDeploy(action.id)}
                        disabled={!deployable}
                        className={clsx(
                          'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0',
                          deployable
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30'
                            : 'bg-gray-800/30 text-gray-600 border border-gray-700/30 cursor-not-allowed'
                        )}
                      >
                        Deploy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800/40 bg-gray-900/30">
          <p className="text-2xs text-gray-600 text-center">
            Tactical actions reduce residual risk but may have business impact and unintended
            consequences. Choose wisely based on threat severity.
          </p>
        </div>
      </div>
    </div>
  );
}

function ResourceContentionWarning({ message }: { message: string }): JSX.Element {
  return (
    <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
      <div className="px-6 py-4 rounded-2xl bg-red-500/20 border-2 border-red-500/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-red-400">Resource Contention</p>
            <p className="text-xs text-red-300/80">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MicroTaskCard({
  task,
  timer,
  onSubmitAnswer,
  onDismiss,
  onSkip,
  reducedMotion,
  animating,
  currentAnswer,
  result,
  showExplanation,
}: {
  task: MicroTask;
  timer: number;
  onSubmitAnswer: (answer: string | string[]) => void;
  onDismiss: () => void;
  onSkip: () => void;
  reducedMotion: boolean;
  animating: boolean;
  currentAnswer: string | string[] | null;
  result: 'pending' | 'correct' | 'wrong' | 'partial' | null;
  showExplanation: boolean;
}): JSX.Element {
  const [localSelection, setLocalSelection] = useState<string | null>(
    typeof currentAnswer === 'string' ? currentAnswer : null
  );
  const [rankingOrder, setRankingOrder] = useState<string[]>([]);

  useEffect(() => {
    if (task.type === 'RANKING' && task.options) {
      if (Array.isArray(currentAnswer) && currentAnswer.length > 0) {
        setRankingOrder(currentAnswer);
      } else {
        setRankingOrder(task.options.map((o) => o.id));
      }
    }
  }, [task, currentAnswer]);

  const getIcon = (): JSX.Element => {
    switch (task.icon) {
      case 'Target':
        return <Target className="w-5 h-5" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-5 h-5" />;
      case 'FileQuestion':
        return <FileQuestion className="w-5 h-5" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5" />;
      case 'Shuffle':
        return <Shuffle className="w-5 h-5" />;
      case 'Eye':
        return <Eye className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'ClipboardList':
        return <ClipboardList className="w-5 h-5" />;
      case 'Radar':
        return <Radar className="w-5 h-5" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Clock':
        return <Clock className="w-5 h-5" />;
      case 'Activity':
        return <Activity className="w-5 h-5" />;
      default:
        return <ListChecks className="w-5 h-5" />;
    }
  };

  const categoryColors: Record<string, string> = {
    ESRM: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    COMMUNICATION: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
    TRIAGE: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    AWARENESS: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    INTELLIGENCE: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  };

  const isUrgent = timer <= 5;
  const hasAnswered = result !== null;

  const moveRankItem = (index: number, direction: 'up' | 'down'): void => {
    if (hasAnswered) return;
    const newOrder = [...rankingOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setRankingOrder(newOrder);
  };

  const handleSubmit = (): void => {
    if (task.type === 'RANKING') {
      onSubmitAnswer(rankingOrder);
    } else if (localSelection) {
      onSubmitAnswer(localSelection);
    }
  };

  const canSubmit =
    !hasAnswered &&
    ((task.type === 'RANKING' && rankingOrder.length > 0) ||
      ((task.type === 'MULTIPLE_CHOICE' || task.type === 'SCENARIO' || task.type === 'TRADEOFF') &&
        localSelection !== null));

  const resultColors = {
    correct: 'border-emerald-500/60 bg-emerald-500/10',
    partial: 'border-amber-500/60 bg-amber-500/10',
    wrong: 'border-red-500/60 bg-red-500/10',
    pending: 'border-gray-700/60 bg-gray-800/90',
  };

  return (
    <div
      className={clsx(
        'fixed bottom-24 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:w-[420px] z-[45]',
        !reducedMotion && animating && 'animate-microtask-enter'
      )}
    >
      <div
        className={clsx(
          'p-4 rounded-2xl border-2 backdrop-blur-xl shadow-xl transition-all max-h-[70vh] overflow-y-auto scrollbar-thin',
          hasAnswered
            ? resultColors[result || 'pending']
            : isUrgent
              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/50'
              : 'bg-gradient-to-br from-gray-800/90 to-gray-900/80 border-gray-700/60'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                categoryColors[task.category] || 'bg-gray-700 text-gray-400'
              )}
            >
              {getIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={clsx(
                    'text-2xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider flex-shrink-0',
                    categoryColors[task.category] || 'bg-gray-700 text-gray-400'
                  )}
                >
                  {task.category}
                </span>
                <span className="text-2xs text-emerald-400 font-semibold flex-shrink-0">
                  +{task.points} pts
                </span>
                {task.wrongPenalty < 0 && (
                  <span className="text-2xs text-red-400/70 font-medium flex-shrink-0">
                    {task.wrongPenalty} wrong
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-white mt-0.5 truncate">{task.title}</h4>
            </div>
          </div>

          {!hasAnswered && (
            <div
              className={clsx(
                'text-lg font-mono font-bold tabular-nums flex-shrink-0',
                isUrgent ? 'text-amber-400 animate-pulse' : 'text-gray-400'
              )}
            >
              {timer}s
            </div>
          )}
          {hasAnswered && (
            <div
              className={clsx(
                'text-sm font-bold px-2 py-1 rounded-lg flex-shrink-0',
                result === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : result === 'partial'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
              )}
            >
              {result === 'correct' ? '✓ Correct' : result === 'partial' ? '~ Partial' : '✗ Wrong'}
            </div>
          )}
        </div>

        {/* Progress bar (only when not answered) */}
        {!hasAnswered && (
          <div className="h-1 bg-gray-800 rounded-full mb-3 overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-1000 rounded-full',
                isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ width: `${(timer / task.duration) * 100}%` }}
            />
          </div>
        )}

        {/* Question */}
        <p className="text-sm text-gray-200 mb-4 leading-relaxed">{task.question}</p>

        {/* Challenge Content based on type */}
        {(task.type === 'MULTIPLE_CHOICE' || task.type === 'SCENARIO') && task.options && (
          <div className="space-y-2 mb-4">
            {task.options.map((option) => {
              const isSelected = localSelection === option.id;
              const isCorrect = option.isCorrect;
              const showCorrectWrong = hasAnswered;

              return (
                <button
                  key={option.id}
                  onClick={() => !hasAnswered && setLocalSelection(option.id)}
                  disabled={hasAnswered}
                  className={clsx(
                    'w-full p-3 rounded-xl text-left text-sm transition-all border-2',
                    hasAnswered
                      ? isCorrect
                        ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                        : isSelected && !isCorrect
                          ? 'border-red-500/60 bg-red-500/15 text-red-300'
                          : 'border-gray-700/40 bg-gray-800/30 text-gray-500'
                      : isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-white'
                        : 'border-gray-700/50 bg-gray-800/40 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={clsx(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
                        hasAnswered && isCorrect
                          ? 'bg-emerald-500/30 text-emerald-400'
                          : hasAnswered && isSelected && !isCorrect
                            ? 'bg-red-500/30 text-red-400'
                            : isSelected
                              ? 'bg-emerald-500/30 text-emerald-400'
                              : 'bg-gray-700/50 text-gray-500'
                      )}
                    >
                      {showCorrectWrong && isCorrect
                        ? '✓'
                        : showCorrectWrong && isSelected && !isCorrect
                          ? '✗'
                          : option.id.toUpperCase()}
                    </span>
                    <span className="flex-1">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {task.type === 'RANKING' && task.options && (
          <div className="space-y-2 mb-4">
            <p className="text-2xs text-gray-500 uppercase tracking-wider mb-2">
              Drag or use arrows to reorder (1 = highest)
            </p>
            {rankingOrder.map((optionId, index) => {
              const option = task.options?.find((o) => o.id === optionId);
              if (!option) return null;
              const correctIndex = task.correctOrder?.indexOf(optionId) ?? -1;
              const isCorrectPosition = hasAnswered && correctIndex === index;

              return (
                <div
                  key={optionId}
                  className={clsx(
                    'flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all',
                    hasAnswered
                      ? isCorrectPosition
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-red-500/40 bg-red-500/5'
                      : 'border-gray-700/50 bg-gray-800/40'
                  )}
                >
                  <span
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      hasAnswered && isCorrectPosition
                        ? 'bg-emerald-500/30 text-emerald-400'
                        : hasAnswered
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-700 text-gray-400'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-200 truncate">{option.text}</span>
                  {!hasAnswered && (
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveRankItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4 -rotate-90 text-gray-400" />
                      </button>
                      <button
                        onClick={() => moveRankItem(index, 'down')}
                        disabled={index === rankingOrder.length - 1}
                        className="p-1 rounded hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4 rotate-90 text-gray-400" />
                      </button>
                    </div>
                  )}
                  {hasAnswered && !isCorrectPosition && (
                    <span className="text-2xs text-amber-400/80">→ #{correctIndex + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {task.type === 'TRADEOFF' && task.tradeoffOptions && (
          <div className="space-y-2 mb-4">
            {task.tradeoffOptions.map((option) => {
              const isSelected = localSelection === option.id;
              const isBest = option.points === task.points;

              return (
                <button
                  key={option.id}
                  onClick={() => !hasAnswered && setLocalSelection(option.id)}
                  disabled={hasAnswered}
                  className={clsx(
                    'w-full p-3 rounded-xl text-left transition-all border-2',
                    hasAnswered && isSelected
                      ? isBest
                        ? 'border-emerald-500/60 bg-emerald-500/15'
                        : option.points > 0
                          ? 'border-amber-500/60 bg-amber-500/15'
                          : 'border-red-500/60 bg-red-500/15'
                      : hasAnswered && isBest
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : hasAnswered
                          ? 'border-gray-700/30 bg-gray-800/20'
                          : isSelected
                            ? 'border-emerald-500/50 bg-emerald-500/15'
                            : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600'
                  )}
                >
                  <div className="text-sm text-gray-200 mb-1">{option.text}</div>
                  {hasAnswered && isSelected && (
                    <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700/50">
                      <span className="text-gray-500">Consequence:</span> {option.consequence}
                    </div>
                  )}
                  {hasAnswered && (
                    <div
                      className={clsx(
                        'text-2xs mt-1 font-semibold',
                        isBest
                          ? 'text-emerald-400'
                          : option.points > 0
                            ? 'text-amber-400'
                            : 'text-red-400'
                      )}
                    >
                      {option.points > 0 ? `+${option.points}` : option.points} pts
                      {isBest && ' (best)'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Explanation (after answering) */}
        {showExplanation && task.explanation && (
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Explanation
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{task.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!hasAnswered ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl font-semibold text-sm border transition-all animate-press flex items-center justify-center gap-2',
                  canSubmit
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-gray-800/40 text-gray-600 border-gray-700/40 cursor-not-allowed'
                )}
              >
                <CheckCircle className="w-4 h-4" />
                Submit Answer
              </button>
              <button
                onClick={onSkip}
                className="px-4 py-2.5 rounded-xl bg-gray-800/60 text-gray-400 font-medium text-sm border border-gray-700/50 hover:bg-gray-800 transition-all animate-press"
              >
                Skip
              </button>
            </>
          ) : (
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-xl bg-gray-700/50 text-gray-300 font-semibold text-sm border border-gray-600/50 hover:bg-gray-700 transition-all animate-press"
            >
              Continue
            </button>
          )}
        </div>

        {/* Label */}
        <p className="text-2xs text-gray-600 text-center mt-3">
          {hasAnswered ? 'Review your answer above' : 'Select an answer to continue'}
        </p>
      </div>
    </div>
  );
}
