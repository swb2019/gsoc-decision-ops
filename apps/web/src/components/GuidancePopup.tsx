'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lightbulb, X, ChevronRight, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import type { GuidanceTip, GuidanceSurface } from '../lib/guidance';
import {
  loadGuidanceState,
  getNextTip,
  dismissActiveTip,
  getQueuedTipCount,
  isGuidanceEnabled,
  setGuidanceEnabled,
  queueFirstVisitTip,
  queueTipByTrigger,
  getActiveTip,
} from '../lib/guidance';

interface GuidancePopupProps {
  reducedMotion?: boolean;
  onNavigateToSurface?: (surface: GuidanceSurface) => void;
}

const SURFACE_LABELS: Record<GuidanceSurface, string> = {
  INTEL_FEED: 'Intel Feed',
  COP_LAYERS: 'COP / Layers',
  DECISION_POSTURE: 'Decision Panel',
  RISK_TREATMENTS: 'Risk Treatments',
  TACTICAL: 'Tactical Actions',
  TEAM_STAKEHOLDERS: 'Team & Stakeholders',
  KRI_VALUE: 'KRIs & Value',
  FIELD_GUIDE: 'Field Guide',
  MICRO_TASKS: 'Knowledge Checks',
  AAR_EXPORT: 'AAR Export',
};

export default function GuidancePopup({
  reducedMotion = false,
  onNavigateToSurface,
}: GuidancePopupProps): JSX.Element | null {
  const [activeTip, setActiveTip] = useState<GuidanceTip | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showDontShowAgain, setShowDontShowAgain] = useState(false);

  useEffect(() => {
    loadGuidanceState();
  }, []);

  useEffect(() => {
    const checkForTips = (): void => {
      if (!isGuidanceEnabled()) {
        setActiveTip(null);
        return;
      }

      const tip = getActiveTip() || getNextTip();
      if (tip && tip.id !== activeTip?.id) {
        setActiveTip(tip);
        setIsVisible(true);
        setShowDontShowAgain(false);
      }
    };

    checkForTips();
    const interval = setInterval(checkForTips, 500);
    return () => clearInterval(interval);
  }, [activeTip?.id]);

  const handleDismiss = useCallback(
    (permanent: boolean = false) => {
      if (!activeTip) return;

      setIsExiting(true);
      setTimeout(
        () => {
          dismissActiveTip(permanent);
          setActiveTip(null);
          setIsVisible(false);
          setIsExiting(false);
        },
        reducedMotion ? 0 : 200
      );
    },
    [activeTip, reducedMotion]
  );

  const handleDisableAll = useCallback(() => {
    setGuidanceEnabled(false);
    setActiveTip(null);
    setIsVisible(false);
  }, []);

  const handleNavigateToRelated = useCallback(
    (surface: GuidanceSurface) => {
      onNavigateToSurface?.(surface);
      handleDismiss(false);
    },
    [onNavigateToSurface, handleDismiss]
  );

  if (!activeTip || !isVisible) return null;

  const queueCount = getQueuedTipCount();

  return (
    <div
      role="dialog"
      aria-labelledby="guidance-title"
      aria-describedby="guidance-content"
      className={clsx(
        'fixed z-50 pointer-events-auto',
        'bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96',
        'transform transition-all duration-200 ease-out',
        isExiting && !reducedMotion && 'opacity-0 translate-y-2',
        !isExiting && !reducedMotion && 'opacity-100 translate-y-0'
      )}
    >
      <div
        className={clsx(
          'relative overflow-hidden rounded-xl',
          'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95',
          'backdrop-blur-xl',
          'border border-amber-500/30',
          'shadow-2xl shadow-amber-500/10',
          'ring-1 ring-white/5'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-600/5 pointer-events-none" />

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        <div className="relative p-4">
          <div className="flex items-start gap-3">
            <div
              className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-xl',
                'bg-gradient-to-br from-amber-500/20 to-amber-600/20',
                'border border-amber-500/30',
                'flex items-center justify-center',
                'shadow-lg shadow-amber-500/10'
              )}
            >
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 id="guidance-title" className="text-sm font-semibold text-amber-100 truncate">
                  {activeTip.title}
                </h3>
                <button
                  onClick={() => handleDismiss(false)}
                  className={clsx(
                    'flex-shrink-0 p-1.5 rounded-lg',
                    'text-slate-400 hover:text-white',
                    'bg-slate-800/50 hover:bg-slate-700/50',
                    'border border-slate-700/50 hover:border-slate-600/50',
                    'transition-colors duration-150'
                  )}
                  aria-label="Dismiss tip"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p id="guidance-content" className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                {activeTip.content}
              </p>

              {activeTip.actionHint && (
                <p className="mt-2 text-xs text-amber-400/80 font-medium">{activeTip.actionHint}</p>
              )}

              {activeTip.relatedSurfaces && activeTip.relatedSurfaces.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Related:
                  </span>
                  {activeTip.relatedSurfaces.map((surface) => (
                    <button
                      key={surface}
                      onClick={() => handleNavigateToRelated(surface)}
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
                        'text-[10px] font-medium',
                        'bg-slate-800/50 hover:bg-amber-500/10',
                        'text-slate-400 hover:text-amber-300',
                        'border border-slate-700/50 hover:border-amber-500/30',
                        'transition-colors duration-150'
                      )}
                    >
                      {SURFACE_LABELS[surface]}
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {queueCount > 0 && (
                  <span className="text-[10px] text-slate-500">
                    +{queueCount} more tip{queueCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {showDontShowAgain ? (
                  <>
                    <button
                      onClick={() => handleDismiss(true)}
                      className={clsx(
                        'px-2.5 py-1 rounded-md text-[10px] font-medium',
                        'bg-amber-500/10 hover:bg-amber-500/20',
                        'text-amber-400 hover:text-amber-300',
                        'border border-amber-500/30 hover:border-amber-500/50',
                        'transition-colors duration-150'
                      )}
                    >
                      Don&apos;t show this again
                    </button>
                    <button
                      onClick={handleDisableAll}
                      className={clsx(
                        'px-2.5 py-1 rounded-md text-[10px] font-medium',
                        'bg-slate-700/50 hover:bg-slate-600/50',
                        'text-slate-400 hover:text-slate-300',
                        'border border-slate-600/50',
                        'transition-colors duration-150'
                      )}
                    >
                      Disable all tips
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowDontShowAgain(true)}
                      className={clsx(
                        'p-1.5 rounded-md',
                        'text-slate-500 hover:text-slate-300',
                        'hover:bg-slate-700/50',
                        'transition-colors duration-150'
                      )}
                      aria-label="Don't show again options"
                      title="Don't show again"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDismiss(false)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-medium',
                        'bg-gradient-to-r from-amber-500/20 to-amber-600/20',
                        'hover:from-amber-500/30 hover:to-amber-600/30',
                        'text-amber-300 hover:text-amber-200',
                        'border border-amber-500/30 hover:border-amber-500/50',
                        'shadow-lg shadow-amber-500/5',
                        'transition-all duration-150'
                      )}
                    >
                      Got it
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useGuidance(): {
  triggerFirstVisit: (surface: GuidanceSurface) => void;
  triggerCondition: (
    trigger: 'LOW_TRUST' | 'HIGH_HEAT' | 'RESOURCE_CONTENTION' | 'STREAK_LOST' | 'TIMER_WARNING',
    surface?: GuidanceSurface
  ) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
  const [isEnabled, setIsEnabledState] = useState(true);

  useEffect(() => {
    loadGuidanceState();
    setIsEnabledState(isGuidanceEnabled());
  }, []);

  const triggerFirstVisit = useCallback((surface: GuidanceSurface) => {
    queueFirstVisitTip(surface);
  }, []);

  const triggerCondition = useCallback(
    (
      trigger: 'LOW_TRUST' | 'HIGH_HEAT' | 'RESOURCE_CONTENTION' | 'STREAK_LOST' | 'TIMER_WARNING',
      surface?: GuidanceSurface
    ) => {
      queueTipByTrigger(trigger, surface);
    },
    []
  );

  const setEnabled = useCallback((enabled: boolean) => {
    setGuidanceEnabled(enabled);
    setIsEnabledState(enabled);
  }, []);

  return {
    triggerFirstVisit,
    triggerCondition,
    isEnabled,
    setEnabled,
  };
}
