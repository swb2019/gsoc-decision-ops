'use client';

import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ZoneData {
  id: string;
  name: string;
  heat: number;
  position: [number, number];
}

interface COPMarkers3DProps {
  zones: ZoneData[];
  width?: number;
  height?: number;
  onZoneClick?: (zoneId: string) => void;
  className?: string;
}

const HEAT_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

function getHeatColor(heat: number): string {
  if (heat >= 80) return HEAT_COLORS.critical;
  if (heat >= 60) return HEAT_COLORS.high;
  if (heat >= 40) return HEAT_COLORS.medium;
  return HEAT_COLORS.low;
}

function HeatPulse({ heat, position }: { heat: number; position: [number, number, number] }): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = getHeatColor(heat);
  const intensity = heat / 100;

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 0.3 + Math.sin(state.clock.elapsedTime * (2 + intensity * 3)) * 0.1 * intensity;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2 * intensity;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry args={[0.2, 0.35, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ZoneMarker({
  zone,
  position,
  onClick,
}: {
  zone: ZoneData;
  position: [number, number, number];
  onClick?: () => void;
}): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = getHeatColor(zone.heat);
  const isCritical = zone.heat >= 80;

  useFrame((state) => {
    if (groupRef.current) {
      if (isCritical) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      }
      if (hovered) {
        groupRef.current.scale.setScalar(1.2);
      } else {
        groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <Float speed={isCritical ? 4 : 2} rotationIntensity={0.2} floatIntensity={isCritical ? 0.3 : 0.1}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isCritical ? 0.8 : 0.3}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>

        <mesh position={[0, -0.2, 0]}>
          <coneGeometry args={[0.08, 0.15, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      </Float>

      <HeatPulse heat={zone.heat} position={[0, 0, 0]} />

      {hovered && (
        <Html position={[0, 0.4, 0]} center distanceFactor={10}>
          <div className="bg-gray-900/95 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-700 shadow-xl whitespace-nowrap">
            <div className="text-xs font-semibold text-white">{zone.name}</div>
            <div className="text-xs" style={{ color }}>
              Heat: {zone.heat}%
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function COPModel(): JSX.Element | null {
  const modelPath = '/models/cop_markers.glb';

  try {
    const { scene } = useGLTF(modelPath);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
      <group scale={0.5}>
        <primitive object={clonedScene} />
      </group>
    );
  } catch {
    return null;
  }
}

function GridFloor(): JSX.Element {
  return (
    <group>
      <gridHelper args={[4, 20, '#1e293b', '#1e293b']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function LoadingIndicator(): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.3, 0.4, 32]} />
      <meshBasicMaterial color="#4f46e5" wireframe />
    </mesh>
  );
}

export default function COPMarkers3D({
  zones,
  width = 300,
  height = 200,
  onZoneClick,
  className = '',
}: COPMarkers3DProps): JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedPositions = useMemo(() => {
    return zones.map((zone) => {
      const x = (zone.position[0] / 100 - 0.5) * 3;
      const y = (zone.position[1] / 100 - 0.5) * 2;
      return { ...zone, pos3d: [x, y, 0] as [number, number, number] };
    });
  }, [zones]);

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900/50 rounded-xl ${className}`}
        style={{ width, height }}
      >
        <div className="text-gray-500 text-sm">Loading 3D view...</div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ width, height }}
      aria-label="3D COP markers visualization"
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'linear-gradient(to bottom, #0f172a, #1e293b)' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, -3, 2]} intensity={0.4} color="#3b82f6" />

        <GridFloor />

        <Suspense fallback={<LoadingIndicator />}>
          <COPModel />
          {normalizedPositions.map((zone) => (
            <ZoneMarker
              key={zone.id}
              zone={zone}
              position={zone.pos3d}
              onClick={onZoneClick ? () => onZoneClick(zone.id) : undefined}
            />
          ))}
        </Suspense>
      </Canvas>

      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Low
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Med
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          High
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/cop_markers.glb');
