'use client';

import { lazy, Suspense, useState, useEffect, useRef, ComponentType } from 'react';

interface Lazy3DWrapperProps<P> {
  component: () => Promise<{ default: ComponentType<P> }>;
  fallback?: React.ReactNode;
  noWebGLFallback?: React.ReactNode;
  props: P;
}

function DefaultFallback({ width, height }: { width?: number; height?: number }): JSX.Element {
  return (
    <div
      className="flex items-center justify-center bg-gray-800/30 rounded-lg animate-pulse"
      style={{ width: width || 48, height: height || 48 }}
    >
      <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
    </div>
  );
}

function NoWebGLFallback({ width, height }: { width?: number; height?: number }): JSX.Element {
  const size = Math.min(width || 48, height || 48);
  const iconSize = Math.max(16, size * 0.5);
  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl border border-gray-700/40 shadow-inner"
      style={{ width: width || 48, height: height || 48 }}
      title="Simplified view"
    >
      <svg 
        className="text-gray-500" 
        style={{ width: iconSize, height: iconSize }}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
        />
      </svg>
    </div>
  );
}

function check3DSupport(): boolean {
  if (typeof window === 'undefined') return false;

  const checkWebGLSupport = (): boolean => {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl') ||
        canvas.getContext('webgl2');
      return gl !== null;
    } catch {
      return false;
    }
  };

  const checkReducedMotion = (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const checkMobilePerformance = (): boolean => {
    // Allow mobile 3D unless device is clearly constrained (Shannon P0: assets missing on phone)
    const isVeryLowPower = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 1 : false;
    const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    const hasLowMemory = deviceMemory !== undefined && deviceMemory < 2;
    return !isVeryLowPower && !hasLowMemory;
  };

  return checkWebGLSupport() && !checkReducedMotion() && checkMobilePerformance();
}

export function Lazy3DWrapper<P extends object>({
  component,
  fallback,
  noWebGLFallback,
  props,
}: Lazy3DWrapperProps<P>): JSX.Element {
  const [isMounted, setIsMounted] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(true);
  const [LazyComponent, setLazyComponent] = useState<ComponentType<P> | null>(null);
  const [loadError, setLoadError] = useState(false);

  const componentRef = useRef(component);
  const hasStartedLoading = useRef(false);

  useEffect(() => {
    componentRef.current = component;
  }, [component]);

  useEffect(() => {
    let isCancelled = false;
    setIsMounted(true);

    const supported = check3DSupport();
    setIs3DSupported(supported);

    if (supported && !hasStartedLoading.current) {
      hasStartedLoading.current = true;

      componentRef
        .current()
        .then((mod) => {
          if (!isCancelled && mod.default) {
            setLazyComponent(() => mod.default);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            console.warn('[Lazy3DWrapper] Failed to load 3D component:', err);
            setLoadError(true);
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!isMounted) {
    return fallback ? <>{fallback}</> : <DefaultFallback />;
  }

  if (!is3DSupported || loadError) {
    return noWebGLFallback ? <>{noWebGLFallback}</> : <NoWebGLFallback />;
  }

  if (!LazyComponent) {
    return fallback ? <>{fallback}</> : <DefaultFallback />;
  }

  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

export const LazyChannelIcon3D = lazy(() => import('./ChannelIcon3D'));
export const LazyCOPMarkers3D = lazy(() => import('./COPMarkers3D'));

type IntakeChannel =
  | 'ACS'
  | 'VMS'
  | 'ALARM'
  | 'SIEM'
  | 'OSINT'
  | 'TIP'
  | 'RADIO'
  | 'FACILITIES'
  | 'VENDOR'
  | 'EXECUTIVE'
  | 'LE';

const CHANNEL_FALLBACK_COLORS: Record<IntakeChannel, { bg: string; text: string; border: string }> = {
  ACS: { bg: 'from-cyan-500/20 to-cyan-600/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  VMS: { bg: 'from-violet-500/20 to-violet-600/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  ALARM: { bg: 'from-red-500/20 to-red-600/10', text: 'text-red-400', border: 'border-red-500/30' },
  SIEM: { bg: 'from-blue-500/20 to-blue-600/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  OSINT: { bg: 'from-amber-500/20 to-amber-600/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  TIP: { bg: 'from-emerald-500/20 to-emerald-600/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  RADIO: { bg: 'from-pink-500/20 to-pink-600/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  FACILITIES: { bg: 'from-gray-500/20 to-gray-600/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  VENDOR: { bg: 'from-orange-500/20 to-orange-600/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  EXECUTIVE: { bg: 'from-yellow-500/20 to-yellow-600/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  LE: { bg: 'from-indigo-500/20 to-indigo-600/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
};

function ChannelIconFallback({ 
  channel, 
  size = 48,
  isUrgent = false,
}: { 
  channel: IntakeChannel; 
  size?: number;
  isUrgent?: boolean;
}): JSX.Element {
  const colors = CHANNEL_FALLBACK_COLORS[channel];
  const abbrev = channel.slice(0, 2);
  return (
    <div
      className={`flex items-center justify-center rounded-xl border bg-gradient-to-br ${colors.bg} ${colors.border} ${isUrgent ? 'animate-pulse ring-2 ring-red-500/50' : ''}`}
      style={{ width: size, height: size }}
      title={channel}
    >
      <span className={`font-bold text-xs ${colors.text}`} style={{ fontSize: Math.max(10, size * 0.25) }}>
        {abbrev}
      </span>
    </div>
  );
}

interface LazyChannelIcon3DWrapperProps {
  channel: IntakeChannel;
  size?: number;
  isUrgent?: boolean;
  className?: string;
}

export function ChannelIcon3DWrapper(props: LazyChannelIcon3DWrapperProps): JSX.Element {
  return (
    <Lazy3DWrapper
      component={() => import('./ChannelIcon3D')}
      props={props}
      fallback={<DefaultFallback width={props.size} height={props.size} />}
      noWebGLFallback={<ChannelIconFallback channel={props.channel} size={props.size} isUrgent={props.isUrgent} />}
    />
  );
}

interface LazyCOPMarkers3DWrapperProps {
  zones: Array<{
    id: string;
    name: string;
    heat: number;
    position: [number, number];
  }>;
  width?: number;
  height?: number;
  onZoneClick?: (zoneId: string) => void;
  className?: string;
}

export function COPMarkers3DWrapper(props: LazyCOPMarkers3DWrapperProps): JSX.Element {
  return (
    <Lazy3DWrapper
      component={() => import('./COPMarkers3D')}
      props={props}
      fallback={<DefaultFallback width={props.width} height={props.height} />}
      noWebGLFallback={<NoWebGLFallback width={props.width} height={props.height} />}
    />
  );
}
