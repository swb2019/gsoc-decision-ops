'use client';

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

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

interface ChannelIcon3DProps {
  channel: IntakeChannel;
  size?: number;
  isUrgent?: boolean;
  className?: string;
}

const CHANNEL_COLORS: Record<IntakeChannel, string> = {
  ACS: '#22d3ee',
  VMS: '#a78bfa',
  ALARM: '#f87171',
  SIEM: '#60a5fa',
  OSINT: '#fbbf24',
  TIP: '#34d399',
  RADIO: '#f472b6',
  FACILITIES: '#94a3b8',
  VENDOR: '#fb923c',
  EXECUTIVE: '#facc15',
  LE: '#6366f1',
};

const CHANNEL_GEOMETRIES: Record<
  IntakeChannel,
  'box' | 'sphere' | 'octahedron' | 'torus' | 'cone'
> = {
  ACS: 'box',
  VMS: 'octahedron',
  ALARM: 'cone',
  SIEM: 'box',
  OSINT: 'sphere',
  TIP: 'torus',
  RADIO: 'sphere',
  FACILITIES: 'box',
  VENDOR: 'octahedron',
  EXECUTIVE: 'cone',
  LE: 'box',
};

const MODEL_PATHS: Partial<Record<IntakeChannel, string>> = {
  VMS: '/models/channel_vms.glb',
  ALARM: '/models/channel_alarm.glb',
  ACS: '/models/channel_acs.glb',
  SIEM: '/models/channel_siem.glb',
  OSINT: '/models/channel_osint.glb',
  RADIO: '/models/channel_radio.glb',
  TIP: '/models/channel_tip.glb',
};

function FallbackGeometry({
  channel,
  isUrgent,
}: {
  channel: IntakeChannel;
  isUrgent?: boolean;
}): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = CHANNEL_COLORS[channel];
  const geometryType = CHANNEL_GEOMETRIES[channel];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      if (isUrgent) {
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
      }
    }
  });

  const geometry = useMemo(() => {
    switch (geometryType) {
      case 'sphere':
        return <sphereGeometry args={[0.4, 16, 16]} />;
      case 'octahedron':
        return <octahedronGeometry args={[0.4]} />;
      case 'torus':
        return <torusGeometry args={[0.3, 0.12, 12, 24]} />;
      case 'cone':
        return <coneGeometry args={[0.35, 0.6, 16]} />;
      case 'box':
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  }, [geometryType]);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
      <mesh ref={meshRef}>
        {geometry}
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isUrgent ? 0.8 : 0.3}
          distort={isUrgent ? 0.2 : 0.1}
          speed={isUrgent ? 4 : 2}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function GLBModel({ modelPath, isUrgent }: { modelPath: string; isUrgent?: boolean }): JSX.Element {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      if (isUrgent) {
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.08);
      }
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.2}>
      <group ref={meshRef} scale={0.5}>
        <primitive object={clonedScene} />
      </group>
    </Float>
  );
}

function ChannelModel({
  channel,
  isUrgent,
}: {
  channel: IntakeChannel;
  isUrgent?: boolean;
}): JSX.Element {
  const modelPath = MODEL_PATHS[channel];

  if (!modelPath) {
    return <FallbackGeometry channel={channel} isUrgent={isUrgent} />;
  }

  return (
    <Suspense fallback={<FallbackGeometry channel={channel} isUrgent={isUrgent} />}>
      <GLBModel modelPath={modelPath} isUrgent={isUrgent} />
    </Suspense>
  );
}

function LoadingFallback(): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshBasicMaterial color="#4b5563" wireframe />
    </mesh>
  );
}

export default function ChannelIcon3D({
  channel,
  size = 48,
  isUrgent = false,
  className = '',
}: ChannelIcon3DProps): JSX.Element {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 2, 2]} intensity={1} color="#ffffff" />
        <pointLight position={[-2, -2, -2]} intensity={0.5} color="#4f46e5" />

        <Suspense fallback={<LoadingFallback />}>
          <ChannelModel channel={channel} isUrgent={isUrgent} />
        </Suspense>
      </Canvas>
    </div>
  );
}

Object.values(MODEL_PATHS).forEach((path) => {
  if (path) {
    useGLTF.preload(path);
  }
});
