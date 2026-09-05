'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  Brain,
  Cpu,
  DoorOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Lock,
  Star,
  Trophy,
  GraduationCap,
  Briefcase,
  Crown,
  ChevronRight,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { getAvailableScenarios, getCampaignArcs } from '@gsoc-decision-ops/core';
import type { RecommendedLevel } from '@gsoc-decision-ops/core';
import { clsx } from 'clsx';
import { getUnlockedArcs, getCompletedArcs, resetCampaignProgress } from '../lib/campaign';

/**
 * Difficulty star display
 */
function DifficultyStars({
  difficulty,
  size = 'sm',
}: {
  difficulty: number;
  size?: 'sm' | 'md';
}): JSX.Element {
  const sizeClasses = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={clsx(
            sizeClasses,
            star <= difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Recommended level badge
 */
function LevelBadge({ level }: { level: RecommendedLevel }): JSX.Element {
  const config = {
    ROOKIE: {
      label: 'Rookie',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: GraduationCap,
    },
    OPERATOR: {
      label: 'Operator',
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: Briefcase,
    },
    DIRECTOR: {
      label: 'Director',
      color: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      icon: Crown,
    },
  };
  const { label, color, icon: Icon } = config[level];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium border',
        color
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

type SecurityDomain = 'PHYSICAL' | 'INTELLIGENCE' | 'CYBER';

const DOMAIN_CONFIG: Record<
  SecurityDomain,
  {
    icon: typeof Shield;
    label: string;
    color: string;
    bgGradient: string;
  }
> = {
  PHYSICAL: {
    icon: DoorOpen,
    label: 'Physical',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-cyan-600/5',
  },
  INTELLIGENCE: {
    icon: Brain,
    label: 'Intel',
    color: 'text-violet-400',
    bgGradient: 'from-violet-500/20 to-violet-600/5',
  },
  CYBER: {
    icon: Cpu,
    label: 'Cyber',
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-orange-600/5',
  },
};

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();
  const campaignArcs = getCampaignArcs();
  const fusedScenarios = scenarios.filter((s) => s.domains && s.domains.length > 0);
  const legacyScenarios = scenarios.filter((s) => !s.domains || s.domains.length === 0);

  // Campaign progression state
  const [unlockedArcs, setUnlockedArcs] = useState<Set<string>>(new Set(['arc-1-foundations']));
  const [completedArcs, setCompletedArcs] = useState<Set<string>>(new Set());

  // Load campaign progress from localStorage
  useEffect(() => {
    setUnlockedArcs(getUnlockedArcs());
    setCompletedArcs(getCompletedArcs());
  }, []);

  // Get scenario for a campaign arc
  const getScenarioForArc = (arcId: string) => {
    return scenarios.find((s) => s.campaign?.arcId === arcId);
  };

  // Handle campaign reset
  const handleResetCampaign = () => {
    resetCampaignProgress();
    setUnlockedArcs(new Set(['arc-1-foundations']));
    setCompletedArcs(new Set());
  };

  // Calculate campaign progress
  const campaignProgress = Math.round((completedArcs.size / campaignArcs.length) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Subtle Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative border-b border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40 safe-area-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl sm:rounded-2xl blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="font-bold text-gray-100 text-lg sm:text-xl tracking-tight">
                Hourglass Command
              </span>
              <div className="text-2xs sm:text-xs text-gray-500 mt-0.5">
                Fused GSOC Operations Training
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-gray-800/40 border border-gray-700/50">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-400">
              <span className="hidden sm:inline">60-min simulations</span>
              <span className="sm:hidden">60m</span>
            </span>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5 sm:mb-6">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-medium text-emerald-400">
              Physical • Intelligence • Cyber
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-100 mb-4 sm:mb-6 tracking-tight px-2">
            First-Hour Decision
            <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Simulation
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
            Command a fused Global Security Operations Center. Navigate cross-domain threats
            spanning physical security, intelligence, and cybersecurity in real-time.
          </p>
        </div>

        {/* Posture Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-16">
          {[
            {
              posture: 'CONTINUE',
              color: 'emerald',
              description: 'Risk within tolerance. Proceed with enhanced monitoring.',
              icon: TrendingUp,
            },
            {
              posture: 'DEGRADE',
              color: 'amber',
              description: 'Reduce exposure via compensating controls.',
              icon: Target,
            },
            {
              posture: 'PAUSE',
              color: 'red',
              description: 'Halt affected operations. Eliminate exposure.',
              icon: AlertTriangle,
            },
          ].map(({ posture, color, description, icon: Icon }) => (
            <div
              key={posture}
              className={clsx(
                'p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 active:scale-[0.98]',
                color === 'emerald' &&
                  'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
                color === 'amber' && 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
                color === 'red' && 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
              )}
            >
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    color === 'emerald' && 'bg-emerald-500/15 text-emerald-400',
                    color === 'amber' && 'bg-amber-500/15 text-amber-400',
                    color === 'red' && 'bg-red-500/15 text-red-400'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={clsx(
                    'font-bold text-base sm:text-lg',
                    color === 'emerald' && 'text-emerald-400',
                    color === 'amber' && 'text-amber-400',
                    color === 'red' && 'text-red-400'
                  )}
                >
                  {posture}
                </span>
              </div>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          ))}
        </div>

        {/* Campaign Mode */}
        <div className="mb-10 sm:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-100 tracking-tight">
                  Campaign Mode
                </h2>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">{campaignProgress}%</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Progress through 6 first-hour arcs — unlock scenarios by completing prerequisites
              </p>
            </div>
            <button
              onClick={handleResetCampaign}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-all"
              title="Reset campaign progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Campaign Progress Bar */}
          <div className="mb-6 p-4 rounded-xl bg-gray-800/30 border border-gray-700/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Campaign Progress</span>
              <span className="text-sm font-medium text-emerald-400">
                {completedArcs.size} / {campaignArcs.length} arcs
              </span>
            </div>
            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${campaignProgress}%` }}
              />
            </div>
          </div>

          {/* Campaign Arc Cards */}
          <div className="grid gap-3 sm:gap-4">
            {campaignArcs.map((arc, index) => {
              const scenario = getScenarioForArc(arc.arcId);
              const isUnlocked = unlockedArcs.has(arc.arcId);
              const isCompleted = completedArcs.has(arc.arcId);
              const isNext = !isCompleted && isUnlocked;

              return (
                <div key={arc.arcId} className="relative">
                  {index < campaignArcs.length - 1 && (
                    <div className="absolute left-6 top-full w-0.5 h-3 sm:h-4 bg-gray-700/50 z-0" />
                  )}

                  {isUnlocked && scenario ? (
                    <Link href={`/scenarios/${scenario.id}`} className="group block">
                      <div
                        className={clsx(
                          'relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300',
                          isCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                            : isNext
                              ? 'bg-gradient-to-br from-cyan-500/10 to-violet-500/5 border-cyan-500/30 hover:border-cyan-500/50'
                              : 'bg-gray-800/30 border-gray-700/40 hover:border-gray-600/60',
                          'overflow-hidden'
                        )}
                      >
                        <div
                          className={clsx(
                            'absolute top-4 left-4 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isNext
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-gray-700/50 text-gray-400'
                          )}
                        >
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : arc.campaignOrder}
                        </div>

                        <div className="ml-12 flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3
                                className={clsx(
                                  'text-base sm:text-lg font-semibold transition-colors',
                                  isCompleted
                                    ? 'text-emerald-400'
                                    : isNext
                                      ? 'text-cyan-400'
                                      : 'text-gray-200'
                                )}
                              >
                                {arc.arcTitle}
                              </h3>
                              {isNext && (
                                <span className="px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded bg-cyan-500/20 text-cyan-400">
                                  Next
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{arc.arcBrief}</p>
                            <div className="flex flex-wrap items-center gap-3">
                              <DifficultyStars difficulty={arc.difficulty} />
                              <LevelBadge level={arc.recommendedLevel} />
                              {scenario.domains && scenario.domains.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {scenario.domains.map((domain) => {
                                    const config = DOMAIN_CONFIG[domain];
                                    const Icon = config.icon;
                                    return (
                                      <span
                                        key={domain}
                                        className={clsx(
                                          'p-1 rounded',
                                          `bg-gradient-to-r ${config.bgGradient}`,
                                          config.color
                                        )}
                                        title={config.label}
                                      >
                                        <Icon className="w-3 h-3" />
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center self-center">
                            <div
                              className={clsx(
                                'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300',
                                isCompleted
                                  ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                                  : 'bg-gray-800/60 group-hover:bg-cyan-500/20'
                              )}
                            >
                              {isCompleted ? (
                                <RotateCcw className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div
                      className={clsx(
                        'relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border',
                        'bg-gray-900/50 border-gray-800/50 opacity-60'
                      )}
                    >
                      <div className="absolute top-4 left-4 w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800/50">
                        <Lock className="w-4 h-4 text-gray-600" />
                      </div>

                      <div className="ml-12 flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-500">
                              {arc.arcTitle}
                            </h3>
                            <span className="px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded bg-gray-800/50 text-gray-600">
                              Locked
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{arc.arcBrief}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <DifficultyStars difficulty={arc.difficulty} />
                            <span className="text-2xs text-gray-600">
                              Requires:{' '}
                              {arc.unlockRequirements
                                .map((req) => {
                                  const reqArc = campaignArcs.find((a) => a.arcId === req);
                                  return reqArc?.arcTitle.split(':')[0] || req;
                                })
                                .join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center self-center">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-gray-800/30">
                            <Lock className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fused GSOC Scenarios (Free Play) */}
        <div className="mb-10 sm:mb-16">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-100 tracking-tight">
                Free Play
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Jump into any scenario — no unlock required
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm text-amber-400 font-medium">All Unlocked</span>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {fusedScenarios.map((scenario) => (
              <Link key={scenario.id} href={`/scenarios/${scenario.id}`} className="group block">
                <div
                  className={clsx(
                    'relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300',
                    'bg-gradient-to-br from-gray-800/40 to-gray-900/20',
                    'border-gray-700/50 hover:border-gray-600/80 active:scale-[0.99]',
                    'overflow-hidden'
                  )}
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex items-start gap-3 sm:gap-5">
                    {/* Severity Indicator */}
                    <div
                      className={clsx(
                        'w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
                        scenario.severity === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-amber-500/15 text-amber-400'
                      )}
                    >
                      <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title & Severity */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-100 group-hover:text-white transition-colors">
                          {scenario.name}
                        </h3>
                        <span
                          className={clsx(
                            'px-2 py-0.5 text-2xs sm:text-xs font-bold uppercase tracking-wider rounded',
                            scenario.severity === 'CRITICAL'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                          )}
                        >
                          {scenario.severity}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                        {scenario.description}
                      </p>

                      {/* Domain Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        {scenario.domains?.map((domain) => {
                          const config = DOMAIN_CONFIG[domain];
                          const Icon = config.icon;
                          return (
                            <span
                              key={domain}
                              className={clsx(
                                'inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-2xs sm:text-xs font-medium',
                                `bg-gradient-to-r ${config.bgGradient}`,
                                config.color
                              )}
                            >
                              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {config.label}
                            </span>
                          );
                        })}
                        <span className="text-2xs sm:text-xs text-gray-600 ml-1 sm:ml-2 hidden sm:inline">
                          {scenario.vendorType}
                        </span>
                      </div>
                    </div>

                    {/* Enter Arrow */}
                    <div className="flex items-center self-center">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-800/60 group-hover:bg-emerald-500/20 group-active:bg-emerald-500/30 flex items-center justify-center transition-all duration-300">
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Legacy Scenarios */}
        {legacyScenarios.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-300 tracking-tight">
                  Additional Scenarios
                </h2>
                <p className="text-sm text-gray-600 mt-1">Single-domain training exercises</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {legacyScenarios.map((scenario) => (
                <Link key={scenario.id} href={`/scenarios/${scenario.id}`} className="group block">
                  <div
                    className={clsx(
                      'p-5 rounded-xl border transition-all duration-300',
                      'bg-gray-800/20 border-gray-800/60',
                      'hover:bg-gray-800/40 hover:border-gray-700/80'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          scenario.severity === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        )}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded font-bold uppercase',
                          scenario.severity === 'CRITICAL'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-amber-500/15 text-amber-400'
                        )}
                      >
                        {scenario.severity}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-200 mb-1 group-hover:text-white transition-colors">
                      {scenario.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{scenario.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-gray-800/50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-5 sm:mb-6 text-center">
            How It Works
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: '1', label: 'Receive intel briefing', color: 'emerald' },
              { step: '2', label: 'Live injects arrive', color: 'amber' },
              { step: '3', label: 'Make posture calls', color: 'cyan' },
              { step: '4', label: 'Debrief & export AAR', color: 'violet' },
            ].map(({ step, label, color }) => (
              <div key={step} className="text-center">
                <div
                  className={clsx(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl mx-auto mb-2 sm:mb-3 flex items-center justify-center text-lg sm:text-xl font-bold',
                    color === 'emerald' && 'bg-emerald-500/15 text-emerald-400',
                    color === 'amber' && 'bg-amber-500/15 text-amber-400',
                    color === 'cyan' && 'bg-cyan-500/15 text-cyan-400',
                    color === 'violet' && 'bg-violet-500/15 text-violet-400'
                  )}
                >
                  {step}
                </div>
                <p className="text-xs sm:text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-800/30 safe-area-bottom">
          <p className="text-xs text-gray-600">Training Simulation • Built on ESRM Principles</p>
        </footer>
      </main>
    </div>
  );
}
