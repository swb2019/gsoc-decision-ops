'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  ArrowLeft,
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
} from 'lucide-react';
import {
  recordDecision,
  calculateStats,
  generateAfterActionReport,
  revealInject,
  getRevealedInjects,
  postureToTreatment,
  type ProtectedAsset,
  type ScenarioESRMConfig,
  type LinkedEntity,
  type EntityType,
} from '@gsoc-decision-ops/core';
import type { DecisionLog, DecisionPosture, ScenarioInject } from '@gsoc-decision-ops/core';
import Link from 'next/link';
import { clsx } from 'clsx';

type SecurityDomain = 'PHYSICAL' | 'INTELLIGENCE' | 'CYBER';
type MobileTab = 'intel' | 'decision' | 'cop';

interface CommandCenterProps {
  initialLog: DecisionLog;
  esrmConfig?: ScenarioESRMConfig;
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

export default function CommandCenter({ initialLog, esrmConfig }: CommandCenterProps): JSX.Element {
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
  const [escalationLevel, setEscalationLevel] = useState<'ACTIVITY' | 'INCIDENT' | 'INVESTIGATION'>(
    'ACTIVITY'
  );
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const decisionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedInjectsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent): void => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Main game timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => {
          const newSeconds = s + 1;
          if (newSeconds >= 3600) {
            setIsRunning(false);
            setShowDebrief(true);
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
  }, [isRunning]);

  // Decision pressure timer
  useEffect(() => {
    if (pendingDecision && isRunning) {
      setDecisionTimer(45);
      decisionTimerRef.current = setInterval(() => {
        setDecisionTimer((t) => {
          if (t <= 1) {
            setUrgentPulse(true);
            setTimeout(() => setUrgentPulse(false), 500);
          }
          if (t <= 0) {
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

        triggerInjectAlert(inject);

        if (!pendingDecision) {
          setPendingDecision(inject);
          setSelectedAsset(null);
          setAssetOwnerBriefed(false);
          setResidualRiskNote('');
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
        setTimeout(() => setUrgentPulse(false), 1000);
      }
    }
  }, [elapsedSeconds, isRunning, lastInjectTime, log, pendingDecision]);

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

  const triggerInjectAlert = (inject: ScenarioInject): void => {
    const urgency = (inject as unknown as { urgencyLevel?: string }).urgencyLevel;
    if (urgency === 'IMMEDIATE') {
      setScreenFlash('red');
    } else if (urgency === 'URGENT') {
      setScreenFlash('amber');
    }
    setTimeout(() => setScreenFlash(null), 300);
  };

  const handleTimeoutDecision = (): void => {
    if (!pendingDecision) return;

    setGameState((prev) => ({
      ...prev,
      score: Math.max(0, prev.score - 50),
      streak: 0,
      comboMultiplier: 1,
    }));

    setShowScorePopup({ points: -50, message: 'Decision timeout!' });
    setTimeout(() => setShowScorePopup(null), 2000);

    setPendingDecision(null);
    setSelectedAsset(null);
    setAssetOwnerBriefed(false);
  };

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
      const isCorrect = expectedPosture === posture;

      // Calculate score components with deepened mechanics
      const baseScore = isCorrect ? 150 : 50;
      const timeBonus = Math.floor(decisionTimer * 2);
      const esrmBonus = assetOwnerBriefed ? 75 : 0;
      const residualBonus = residualRiskNote.length > 20 ? 50 : 0;
      const newStreak = isCorrect ? gameState.streak + 1 : 0;
      const streakMultiplier = Math.min(1 + newStreak * 0.1, 2.5);

      // Phase bonus for completing decisions within the right playbook phase
      const phaseBonus = currentPlaybookPhase < 3 ? 25 : 0;

      // Resource contention penalty
      const contentionPenalty = resourceCheck.canProceed ? 0 : -30;

      // Entity linking bonus - if player identified linked entities
      const linkedEntityIds =
        (pendingDecision as unknown as { linkedEntityIds?: string[] }).linkedEntityIds || [];
      const entityBonus = linkedEntityIds.length > 2 ? 20 : 0;

      // Apply cascade multiplier from escalation level
      const totalPoints = Math.floor(
        (baseScore +
          timeBonus +
          esrmBonus +
          residualBonus +
          phaseBonus +
          entityBonus +
          contentionPenalty) *
          streakMultiplier *
          cascadeMultiplier
      );

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
        timeBonus: prev.timeBonus + timeBonus,
        esrmBonus: prev.esrmBonus + esrmBonus + residualBonus,
        comboMultiplier: streakMultiplier,
      }));

      // Visual feedback
      setScreenFlash(isCorrect ? 'green' : 'amber');
      setTimeout(() => setScreenFlash(null), 200);

      setShowScorePopup({
        points: totalPoints,
        message: isCorrect
          ? newStreak > 2
            ? `${newStreak}x STREAK!`
            : 'Solid call!'
          : 'Documented',
      });
      setTimeout(() => setShowScorePopup(null), 2000);

      // Reset decision state
      setPendingDecision(null);
      setSelectedAsset(null);
      setAssetOwnerBriefed(false);
      setResidualRiskNote('');

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
      decisionTimer,
      revealedInjects,
      checkResourceAvailability,
      deployResources,
      currentPlaybookPhase,
      cascadeMultiplier,
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
      <header className="relative z-40 flex-none border-b border-gray-800/60 bg-[#08080e]/90 backdrop-blur-2xl safe-area-top">
        <div className="flex items-center justify-between px-3 py-2 lg:px-6 lg:py-3">
          {/* Left: Back & Logo */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl hover:bg-gray-800/50 active:bg-gray-800/70 transition-all touch-target flex items-center justify-center"
              aria-label="Exit mission"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>

            <div className="hidden sm:flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-xl blur-xl animate-pulse-slow" />
                <div className="relative w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="text-base font-bold text-gray-100 tracking-tight">
                  Aegis Command
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span
                    className={clsx(
                      'w-2 h-2 rounded-full',
                      isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                    )}
                  />
                  <span className={clsx(isRunning ? 'text-emerald-400' : 'text-gray-500')}>
                    {isRunning ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Timer - Always visible, compact on mobile */}
          <div className="flex items-center">
            {/* Mobile compact timer */}
            <div
              className={clsx(
                'flex lg:hidden items-center gap-2 px-3 py-2 rounded-xl border transition-all',
                isCritical
                  ? 'bg-red-500/10 border-red-500/40'
                  : isUrgent
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-gray-800/40 border-gray-700/50'
              )}
            >
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={clsx(
                  'p-2 rounded-lg transition-all touch-target flex items-center justify-center',
                  isRunning
                    ? 'bg-amber-500/20 text-amber-400 active:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 active:bg-emerald-500/30'
                )}
                aria-label={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div
                className={clsx(
                  'font-mono text-xl font-black tracking-tighter',
                  isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white'
                )}
              >
                {formatTime(elapsedSeconds)}
              </div>
              <Timer
                className={clsx(
                  'w-5 h-5',
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

          {/* Right: Score & Actions */}
          <div className="flex items-center gap-1 lg:gap-3">
            {/* Mobile score badge */}
            <div className="flex lg:hidden items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/40">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-sm font-bold text-emerald-400">
                {gameState.score >= 1000
                  ? `${(gameState.score / 1000).toFixed(1)}k`
                  : gameState.score}
              </span>
            </div>

            {/* Desktop score display */}
            <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-gray-800/60 to-gray-800/40 border border-gray-700/50">
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

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="hidden sm:flex p-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/70 transition-all touch-target items-center justify-center"
              aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Escalation Level Indicator */}
            <div
              className={clsx(
                'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider',
                escalationLevel === 'INVESTIGATION'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : escalationLevel === 'INCIDENT'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-gray-800/60 text-gray-400 border border-gray-700/50'
              )}
              title="Escalation Level"
            >
              <Layers className="w-3.5 h-3.5" />
              {escalationLevel}
            </div>

            {/* Entity Link Button */}
            {log.linkedEntities && log.linkedEntities.length > 0 && (
              <button
                onClick={() => setShowEntityPanel(true)}
                className="p-2.5 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 active:bg-cyan-500/20 transition-all touch-target flex items-center justify-center relative"
                aria-label="Open Entity Map"
              >
                <Link2 className="w-5 h-5" />
                {highlightedEntityId && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            )}

            {/* Field Guide Button */}
            <button
              onClick={() => setShowFieldGuide(true)}
              className="p-2.5 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 active:bg-amber-500/20 transition-all touch-target flex items-center justify-center"
              aria-label="Open Field Guide"
            >
              <BookOpen className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowDebrief(true)}
              className="p-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 active:bg-gray-800/70 transition-all touch-target flex items-center justify-center"
              aria-label="View debrief"
            >
              <FileText className="w-5 h-5" />
            </button>
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

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">
        <div className="flex items-center">
          <button
            onClick={() => setMobileTab('intel')}
            className={clsx(
              'mobile-nav-item',
              mobileTab === 'intel' ? 'mobile-nav-item-active' : 'text-gray-500'
            )}
            aria-current={mobileTab === 'intel' ? 'page' : undefined}
          >
            <div className="relative">
              <Radio className="w-6 h-6" />
              {revealedInjects.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-2xs font-bold text-black flex items-center justify-center">
                  {revealedInjects.length}
                </span>
              )}
            </div>
            <span className="mobile-nav-label">Intel</span>
          </button>
          <button
            onClick={() => setMobileTab('decision')}
            className={clsx(
              'mobile-nav-item',
              mobileTab === 'decision' ? 'mobile-nav-item-active' : 'text-gray-500'
            )}
            aria-current={mobileTab === 'decision' ? 'page' : undefined}
          >
            <Briefcase className="w-6 h-6" />
            <span className="mobile-nav-label">Decision</span>
          </button>
          <button
            onClick={() => setMobileTab('cop')}
            className={clsx(
              'mobile-nav-item',
              mobileTab === 'cop' ? 'mobile-nav-item-active' : 'text-gray-500'
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
              />
            ) : (
              <IdleState
                isRunning={isRunning}
                revealedInjects={revealedInjects}
                decisions={log.decisions}
                onStart={() => setIsRunning(true)}
                onSelectInject={(inject) => {
                  setPendingDecision(inject);
                  setSelectedAsset(null);
                  setAssetOwnerBriefed(false);
                }}
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

            {/* COP Stats */}
            <div className="p-4 border-b border-gray-800/50">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Situation Board</h3>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Facts" value={stats.totalFacts} color="emerald" />
                <MiniStat label="Assumed" value={stats.totalAssumptions} color="amber" />
                <MiniStat label="Unknown" value={stats.totalUnknowns} color="red" />
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

            {/* Dispatch Pressure */}
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-300">Resources</h3>
              </div>
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
            <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
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
            <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
              {pendingDecision ? (
                <DecisionConsole
                  inject={pendingDecision}
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
                />
              ) : (
                <IdleState
                  isRunning={isRunning}
                  revealedInjects={revealedInjects}
                  decisions={log.decisions}
                  onStart={() => setIsRunning(true)}
                  onSelectInject={(inject) => {
                    setPendingDecision(inject);
                    setSelectedAsset(null);
                    setAssetOwnerBriefed(false);
                  }}
                />
              )}
            </div>
          )}

          {/* Mobile COP Tab */}
          {mobileTab === 'cop' && (
            <div className="flex-1 overflow-y-auto animate-fade-in">
              {/* Stats */}
              <div className="p-4 border-b border-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Situation Board</h3>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Facts" value={stats.totalFacts} color="emerald" />
                  <MiniStat label="Assumed" value={stats.totalAssumptions} color="amber" />
                  <MiniStat label="Unknown" value={stats.totalUnknowns} color="red" />
                </div>
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

      {/* Debrief Modal */}
      {showDebrief && (
        <DebriefModal
          log={log}
          gameState={gameState}
          grade={calculateGrade()}
          elapsedSeconds={elapsedSeconds}
          onClose={() => setShowDebrief(false)}
        />
      )}

      {/* Field Guide Modal */}
      {showFieldGuide && <FieldGuideModal onClose={() => setShowFieldGuide(false)} />}

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
    </div>
  );
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
        'w-full text-left p-4 rounded-xl border transition-all duration-200',
        !reducedMotion && index === 0 && 'animate-slide-in',
        hasHighlightedEntity && 'ring-2 ring-cyan-500/50',
        isHandled
          ? 'bg-gray-800/20 border-gray-800/40 opacity-60'
          : isActive
            ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-500/50 ring-2 ring-emerald-500/30'
            : 'bg-gray-800/30 border-gray-700/40 hover:border-gray-600/60 hover:bg-gray-800/50'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {urgency === 'IMMEDIATE' && (
            <span className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              URGENT
            </span>
          )}
          {config && (
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
          {hasResourceRequirement && !isHandled && (
            <span className="flex items-center gap-1 text-2xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-400">
              <Users className="w-3 h-3" />
              {(resourcesNeeded?.guards || 0) +
                (resourcesNeeded?.analysts || 0) +
                (resourcesNeeded?.responders || 0)}
            </span>
          )}
        </div>
        {isHandled && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
      </div>

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

      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-700/30">
        <span className="text-2xs text-gray-500">{inject.source}</span>
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
  residualRiskNote,
  onResidualRiskChange,
  decisionTimer,
  onCommit,
  reducedMotion,
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
}): JSX.Element {
  const extendedInject = inject as unknown as { domain?: SecurityDomain };
  const domain = extendedInject.domain;
  const config = domain ? DOMAIN_CONFIG[domain] : null;
  const isTimeCritical = decisionTimer <= 15;

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
              : 'bg-gradient-to-r from-amber-600 to-amber-400'
          )}
          style={{ width: `${(decisionTimer / 45) * 100}%` }}
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
                <div className="text-right">
                  <div
                    className={clsx(
                      'font-mono text-2xl font-bold',
                      isTimeCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'
                    )}
                  >
                    {decisionTimer}s
                  </div>
                  <div className="text-xs text-gray-500">to decide</div>
                </div>
              </div>

              {inject.decisionPressure && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-4">
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Decision Required
                  </div>
                  <p className="text-amber-200/80">{inject.decisionPressure}</p>
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

          {/* ESRM: Treatment Selection - All 4 Options */}
          {selectedAsset && (
            <div className="p-5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-gray-200">3. Select Risk Treatment</h3>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                  {
                    posture: 'CONTINUE' as DecisionPosture,
                    treatment: 'ACCEPT',
                    desc: 'Risk within tolerance',
                    color: 'emerald',
                    key: 'C',
                    isTransfer: false,
                  },
                  {
                    posture: 'DEGRADE' as DecisionPosture,
                    treatment: 'MITIGATE',
                    desc: 'Apply controls',
                    color: 'amber',
                    key: 'D',
                    isTransfer: false,
                  },
                  {
                    posture: 'DEGRADE' as DecisionPosture,
                    treatment: 'TRANSFER',
                    desc: 'Shift to third party',
                    color: 'blue',
                    key: 'T',
                    isTransfer: true,
                  },
                  {
                    posture: 'PAUSE' as DecisionPosture,
                    treatment: 'AVOID',
                    desc: 'Eliminate exposure',
                    color: 'red',
                    key: 'P',
                    isTransfer: false,
                  },
                ].map((option) => (
                  <button
                    key={option.treatment}
                    onClick={() => onCommit(option.posture)}
                    disabled={!selectedAsset}
                    className={clsx(
                      'relative p-4 rounded-xl border-2 transition-all duration-200 group overflow-hidden text-left',
                      'hover:scale-[1.02] active:scale-[0.98]',
                      option.color === 'emerald' && 'border-emerald-500/40 hover:bg-emerald-500/10',
                      option.color === 'amber' && 'border-amber-500/40 hover:bg-amber-500/10',
                      option.color === 'blue' && 'border-blue-500/40 hover:bg-blue-500/10',
                      option.color === 'red' && 'border-red-500/40 hover:bg-red-500/10',
                      'bg-gradient-to-br from-gray-800/60 to-gray-900/40'
                    )}
                  >
                    <div className="relative z-10">
                      <div
                        className={clsx(
                          'text-lg font-black mb-0.5',
                          option.color === 'emerald' && 'text-emerald-400',
                          option.color === 'amber' && 'text-amber-400',
                          option.color === 'blue' && 'text-blue-400',
                          option.color === 'red' && 'text-red-400'
                        )}
                      >
                        {option.treatment}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">→ {option.posture}</div>
                      <p className="text-2xs text-gray-500">{option.desc}</p>
                      <div className="mt-2 text-2xs text-gray-600 font-mono">[{option.key}]</div>
                    </div>
                    {option.isTransfer && (
                      <div className="absolute top-2 right-2 text-2xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                        NEW
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Residual Risk Note */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Residual Risk Note <span className="text-emerald-400">(+50 pts)</span>
                </label>
                <textarea
                  value={residualRiskNote}
                  onChange={(e) => onResidualRiskChange(e.target.value)}
                  placeholder="Document residual risk accepted with this treatment (e.g., 'Manual processes introduce 15-min delays; vendor SLA invoked for coverage')..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-700/50 text-gray-200 placeholder:text-gray-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
                  rows={2}
                />
              </div>
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
}: {
  isRunning: boolean;
  revealedInjects: ScenarioInject[];
  decisions: { title: string }[];
  onStart: () => void;
  onSelectInject: (inject: ScenarioInject) => void;
}): JSX.Element {
  const unhandled = revealedInjects.filter((i) => !decisions.some((d) => d.title === i.title));

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
          <p className="text-gray-400 mb-8 leading-relaxed">
            You are the GSOC Watch Commander. An incident is developing. Start the clock to begin
            receiving intel and making posture decisions.
          </p>

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

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'emerald' | 'amber' | 'red';
}): JSX.Element {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <div className={clsx('p-2.5 rounded-xl border text-center', colorClasses[color])}>
      <div className={clsx('text-xl font-bold font-mono', colorClasses[color].split(' ')[0])}>
        {value}
      </div>
      <div className="text-2xs text-gray-500 uppercase tracking-wider">{label}</div>
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
}: {
  log: DecisionLog;
  gameState: GameState;
  grade: { grade: string; title: string; color: string };
  elapsedSeconds: number;
  onClose: () => void;
}): JSX.Element {
  const minutes = Math.floor(elapsedSeconds / 60);
  const accuracy =
    gameState.decisionsTotal > 0
      ? Math.round((gameState.decisionsCorrect / gameState.decisionsTotal) * 100)
      : 0;
  const esrmRate =
    gameState.decisionsTotal > 0
      ? Math.round((gameState.assetOwnersBriefed / gameState.decisionsTotal) * 100)
      : 0;

  const handleExport = (): void => {
    generateAfterActionReport(log, [], []);

    const enhancedMarkdown = `# After-Action Report: ${log.incident.title}

## Executive Summary

**Mission Duration:** ${minutes} minutes  
**Final Grade:** ${grade.grade} — ${grade.title}  
**Total Score:** ${gameState.score.toLocaleString()} points  

### Performance Metrics

| Metric | Value |
|--------|-------|
| Decisions Made | ${gameState.decisionsTotal} |
| Decision Accuracy | ${accuracy}% |
| ESRM Discipline (Owner Briefings) | ${esrmRate}% |
| Max Decision Streak | ${gameState.maxStreak} |
| Time Bonus Earned | +${gameState.timeBonus} |
| ESRM Bonus Earned | +${gameState.esrmBonus} |

## Incident Overview

**Severity:** ${log.incident.severity}  
**Description:** ${log.incident.description}

## Decision Timeline

${log.decisions
  .map(
    (d, i) => `
### Decision ${i + 1}: ${d.title}

**Posture:** ${d.posture}  
**Risk Treatment:** ${d.esrmFraming?.treatment || 'Not specified'}  
**Asset Owner:** ${d.esrmFraming?.assetOwner || 'Not documented'}  
**Residual Risk:** ${d.esrmFraming?.residualRisk || 'Not documented'}  
**Rationale:** ${d.rationale}
`
  )
  .join('\n')}

## ESRM Analysis

This simulation applied Enterprise Security Risk Management (ESRM) principles throughout:

- **Asset Identification:** ${gameState.assetsProtected} assets addressed
- **Owner Engagement:** ${gameState.assetOwnersBriefed} asset owner briefings conducted
- **Risk Treatment Alignment:** Posture decisions mapped to ACCEPT/MITIGATE/AVOID framework
- **Residual Risk Documentation:** Explicit residual risk captured per decision

## Key Takeaways

${
  gameState.decisionsCorrect === gameState.decisionsTotal
    ? '✓ All posture decisions aligned with expected outcomes'
    : `• ${gameState.decisionsTotal - gameState.decisionsCorrect} decision(s) diverged from expected posture — review cross-domain impacts`
}
${
  esrmRate >= 80
    ? '✓ Strong ESRM discipline — consistent asset owner engagement'
    : '• Opportunity: Increase asset owner briefings before posture commits'
}
${
  gameState.maxStreak >= 5
    ? '✓ Sustained decision quality under pressure'
    : '• Focus: Build consistent decision rhythm across injects'
}

---

## About This Simulation

**Aegis Command** is a fused GSOC first-hour decision simulation integrating Physical Security, Intelligence, and Cybersecurity domains. Built on ESRM principles where security serves as trusted advisor to asset owners who own the risk.

**Designed by Shannon Brown**  
GSOC Leadership • Crisis Management • Security Intelligence

[View Portfolio](https://github.com/swb2019/gsoc-decision-ops)

---

*Training simulation export • ${new Date().toISOString().split('T')[0]}*
`;

    const blob = new Blob([enhancedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-aar-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
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

        {/* Grade Display */}
        <div className="flex justify-center mb-10">
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
            onClick={() => window.location.reload()}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02]"
          >
            Try Again
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-4 rounded-2xl bg-gray-800 text-gray-200 font-semibold border border-gray-700 hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Report
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

function FieldGuideModal({ onClose }: { onClose: () => void }): JSX.Element {
  const [activeSection, setActiveSection] = useState<
    'overview' | 'cycle' | 'assets' | 'risks' | 'treatments' | 'advisor' | 'response' | 'scoring'
  >('overview');

  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'cycle' as const, label: 'ESRM Cycle', icon: <Hourglass className="w-4 h-4" /> },
    { id: 'assets' as const, label: 'Assets', icon: <Target className="w-4 h-4" /> },
    { id: 'risks' as const, label: 'Risk Assessment', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'treatments' as const, label: 'Treatments', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'advisor' as const, label: 'Advisor Model', icon: <Users className="w-4 h-4" /> },
    { id: 'response' as const, label: 'Response & Review', icon: <FileText className="w-4 h-4" /> },
    { id: 'scoring' as const, label: 'Scoring', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#0d0d14] to-[#08080c] border border-gray-800/80 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ESRM Field Guide</h2>
              <p className="text-xs text-gray-500">Enterprise Security Risk Management Training</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800/60 overflow-x-auto scrollbar-thin">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all',
                activeSection === section.id
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
              )}
            >
              {section.icon}
              {section.label}
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
    <div className="fixed bottom-24 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:w-80 z-40 animate-slide-in">
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
