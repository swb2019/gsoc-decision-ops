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
  return (
    <div
      className="flex items-center justify-center bg-gray-800/20 rounded-lg border border-gray-700/30"
      style={{ width: width || 48, height: height || 48 }}
      title="3D not available"
    >
      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowPower = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 2 : false;
    return !isMobile || !isLowPower;
  };

  return checkWebGLSupport() && !checkReducedMotion() && checkMobilePerformance();
}

export function Lazy3DWrapper<P extends object>({
  component,
  fallback,
  noWebGLFallback,
  props,
}: Lazy3DWrapperProps<P>): JSX.Element | null {
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

      componentRef.current()
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
    return noWebGLFallback ? <>{noWebGLFallback}</> : null;
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

interface LazyChannelIcon3DWrapperProps {
  channel:
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
  size?: number;
  isUrgent?: boolean;
  className?: string;
}

export function ChannelIcon3DWrapper(props: LazyChannelIcon3DWrapperProps): JSX.Element | null {
  return (
    <Lazy3DWrapper
      component={() => import('./ChannelIcon3D')}
      props={props}
      fallback={<DefaultFallback width={props.size} height={props.size} />}
      noWebGLFallback={<NoWebGLFallback width={props.size} height={props.size} />}
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

export function COPMarkers3DWrapper(props: LazyCOPMarkers3DWrapperProps): JSX.Element | null {
  return (
    <Lazy3DWrapper
      component={() => import('./COPMarkers3D')}
      props={props}
      fallback={<DefaultFallback width={props.width} height={props.height} />}
      noWebGLFallback={<NoWebGLFallback width={props.width} height={props.height} />}
    />
  );
}
