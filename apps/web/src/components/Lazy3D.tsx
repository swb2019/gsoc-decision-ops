'use client';

import { lazy, Suspense, useState, useEffect, ComponentType } from 'react';

interface Lazy3DWrapperProps<P> {
  component: () => Promise<{ default: ComponentType<P> }>;
  fallback?: React.ReactNode;
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

export function Lazy3DWrapper<P extends object>({
  component,
  fallback,
  props,
}: Lazy3DWrapperProps<P>): JSX.Element | null {
  const [isMounted, setIsMounted] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(true);
  const [LazyComponent, setLazyComponent] = useState<ComponentType<P> | null>(null);

  useEffect(() => {
    setIsMounted(true);

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

    const supported = checkWebGLSupport() && !checkReducedMotion() && checkMobilePerformance();
    setIs3DSupported(supported);

    if (supported) {
      component().then((mod) => {
        setLazyComponent(() => mod.default);
      });
    }
  }, [component]);

  if (!isMounted) {
    return fallback ? <>{fallback}</> : <DefaultFallback />;
  }

  if (!is3DSupported) {
    return null;
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
  channel: 'ACS' | 'VMS' | 'ALARM' | 'SIEM' | 'OSINT' | 'TIP' | 'RADIO' | 'FACILITIES' | 'VENDOR' | 'EXECUTIVE' | 'LE';
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
    />
  );
}
