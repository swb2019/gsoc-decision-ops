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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const decisionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedInjectsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
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

  const triggerInjectAlert = (inject: ScenarioInject) => {
    const urgency = (inject as unknown as { urgencyLevel?: string }).urgencyLevel;
    if (urgency === 'IMMEDIATE') {
      setScreenFlash('red');
    } else if (urgency === 'URGENT') {
      setScreenFlash('amber');
    }
    setTimeout(() => setScreenFlash(null), 300);
  };

  const handleTimeoutDecision = () => {
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
    const handleKeyDown = (e: KeyboardEvent) => {
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

      const expectedPosture = (
        pendingDecision as unknown as { expectedPostureImpact?: DecisionPosture }
      ).expectedPostureImpact;
      const isCorrect = expectedPosture === posture;

      // Calculate score components
      const baseScore = isCorrect ? 150 : 50;
      const timeBonus = Math.floor(decisionTimer * 2);
      const esrmBonus = assetOwnerBriefed ? 75 : 0;
      const residualBonus = residualRiskNote.length > 20 ? 50 : 0;
      const newStreak = isCorrect ? gameState.streak + 1 : 0;
      const streakMultiplier = Math.min(1 + newStreak * 0.1, 2.5);

      const totalPoints = Math.floor(
        (baseScore + timeBonus + esrmBonus + residualBonus) * streakMultiplier
      );

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

            {/* COP Stats */}
            <div className="p-4 border-b border-gray-800/50">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Situation Board</h3>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Facts" value={stats.totalFacts} color="emerald" />
                <MiniStat label="Assumed" value={stats.totalAssumptions} color="amber" />
                <MiniStat label="Unknown" value={stats.totalUnknowns} color="red" />
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
}: {
  inject: ScenarioInject;
  index: number;
  isHandled: boolean;
  isActive: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
}): JSX.Element {
  const extendedInject = inject as unknown as { domain?: SecurityDomain; urgencyLevel?: string };
  const domain = extendedInject.domain;
  const config = domain ? DOMAIN_CONFIG[domain] : null;
  const urgency = extendedInject.urgencyLevel;

  return (
    <button
      onClick={onSelect}
      disabled={isHandled}
      className={clsx(
        'w-full text-left p-4 rounded-xl border transition-all duration-200',
        !reducedMotion && index === 0 && 'animate-slide-in',
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

          {/* ESRM: Asset Owner Communication */}
          {selectedAsset && (
            <div
              className={clsx(
                'p-5 rounded-2xl border transition-all',
                assetOwnerBriefed
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-gray-800/30 border-gray-700/40'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-gray-200">2. Brief Asset Owner</h3>
                </div>
                <span className="text-xs text-emerald-400 font-medium">+75 pts</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/40">
                <div>
                  <p className="font-medium text-gray-200">{selectedAsset.owner.name}</p>
                  <p className="text-xs text-gray-500">{selectedAsset.owner.title}</p>
                </div>
                <button
                  onClick={onToggleBriefed}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                    assetOwnerBriefed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
                  )}
                >
                  <Phone className="w-4 h-4" />
                  {assetOwnerBriefed ? 'Briefed ✓' : 'Brief Now'}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2 italic">
                Security advises; asset owner owns the risk. Document the briefing.
              </p>
            </div>
          )}

          {/* ESRM: Posture Selection with Risk Treatment */}
          {selectedAsset && (
            <div className="p-5 rounded-2xl bg-gray-800/30 border border-gray-700/40">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-gray-200">3. Select Risk Treatment</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {(['CONTINUE', 'DEGRADE', 'PAUSE'] as const).map((posture) => {
                  const cfg = POSTURE_CONFIG[posture];

                  return (
                    <button
                      key={posture}
                      onClick={() => onCommit(posture)}
                      disabled={!selectedAsset}
                      className={clsx(
                        'relative p-6 rounded-2xl border-2 transition-all duration-200 group overflow-hidden',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        cfg.borderColor,
                        'bg-gradient-to-br from-gray-800/60 to-gray-900/40',
                        'hover:from-gray-800/80 hover:to-gray-800/60'
                      )}
                    >
                      <div
                        className={clsx(
                          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                          `bg-gradient-to-br ${cfg.bgColor}`
                        )}
                      />

                      <div className="relative z-10">
                        <div className={clsx('text-2xl font-black mb-1', cfg.color)}>{posture}</div>
                        <div className="text-xs text-gray-400 mb-2">{cfg.treatment}</div>
                        <p className="text-2xs text-gray-500">{cfg.riskAction}</p>
                        <div className="mt-3 text-2xs text-gray-600 font-mono">[{posture[0]}]</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Residual Risk Note */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Residual Risk Note <span className="text-emerald-400">(+50 pts)</span>
                </label>
                <textarea
                  value={residualRiskNote}
                  onChange={(e) => onResidualRiskChange(e.target.value)}
                  placeholder="Document residual risk accepted with this posture..."
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
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
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
