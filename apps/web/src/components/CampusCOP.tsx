'use client';

import { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Layers,
  Camera,
  Shield,
  Thermometer,
  Users,
  Radio,
  Eye,
  EyeOff,
  Activity,
  Building,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import type {
  LinkedEntity,
  ScenarioInject,
  Fact,
  Assumption,
  Unknown,
} from '@gsoc-decision-ops/core';

/**
 * Zone definition for the campus layout
 */
interface ZoneConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  iconBgClass: string;
  iconTextClass: string;
  icon: typeof Building;
  svgPath: string;
  labelPosition: { x: number; y: number };
  sensorPositions?: { x: number; y: number; type: 'camera' | 'access' | 'alarm' }[];
}

/**
 * Layer toggle configuration
 */
interface LayerConfig {
  id: string;
  label: string;
  icon: typeof Camera;
  color: string;
}

/**
 * Active inject overlay data
 */
interface InjectOverlay {
  injectId: string;
  zoneId: string;
  title: string;
  urgency: 'IMMEDIATE' | 'URGENT' | 'ROUTINE';
  position: { x: number; y: number };
}

/**
 * Props for CampusCOP component
 */
interface CampusCOPProps {
  zoneHeatLevels: Record<string, number>;
  linkedEntities?: LinkedEntity[];
  revealedInjects?: ScenarioInject[];
  facts?: Fact[];
  assumptions?: Assumption[];
  unknowns?: Unknown[];
  highlightedEntityId?: string | null;
  onEntityClick?: (entityId: string) => void;
  onZoneClick?: (zoneId: string) => void;
  onInjectClick?: (injectId: string) => void;
  consequenceAnimation?: {
    active: boolean;
    type: 'positive' | 'negative' | 'neutral';
    zoneChanges?: { zone: string; delta: number }[];
  } | null;
  reducedMotion?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Zone configurations for the campus layout
 */
const ZONE_CONFIGS: ZoneConfig[] = [
  {
    id: 'executive',
    name: 'Executive Suite',
    shortName: 'EXEC',
    color: 'amber',
    iconBgClass: 'bg-amber-500/20',
    iconTextClass: 'text-amber-400',
    icon: Building,
    svgPath: 'M 20 20 L 120 20 L 120 80 L 20 80 Z',
    labelPosition: { x: 70, y: 50 },
    sensorPositions: [
      { x: 30, y: 30, type: 'camera' },
      { x: 110, y: 30, type: 'access' },
      { x: 70, y: 70, type: 'alarm' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations Center',
    shortName: 'OPS',
    color: 'cyan',
    iconBgClass: 'bg-cyan-500/20',
    iconTextClass: 'text-cyan-400',
    icon: Activity,
    svgPath: 'M 140 20 L 280 20 L 280 100 L 140 100 Z',
    labelPosition: { x: 210, y: 60 },
    sensorPositions: [
      { x: 150, y: 30, type: 'camera' },
      { x: 210, y: 30, type: 'camera' },
      { x: 270, y: 30, type: 'access' },
      { x: 210, y: 90, type: 'alarm' },
    ],
  },
  {
    id: 'perimeter',
    name: 'Perimeter / Entry',
    shortName: 'PERIM',
    color: 'emerald',
    iconBgClass: 'bg-emerald-500/20',
    iconTextClass: 'text-emerald-400',
    icon: Shield,
    svgPath: 'M 20 100 L 120 100 L 120 180 L 20 180 Z',
    labelPosition: { x: 70, y: 140 },
    sensorPositions: [
      { x: 30, y: 110, type: 'access' },
      { x: 110, y: 110, type: 'camera' },
      { x: 70, y: 170, type: 'access' },
    ],
  },
  {
    id: 'cyber',
    name: 'Cyber / IT Infra',
    shortName: 'CYBER',
    color: 'violet',
    iconBgClass: 'bg-violet-500/20',
    iconTextClass: 'text-violet-400',
    icon: Zap,
    svgPath: 'M 140 120 L 280 120 L 280 180 L 140 180 Z',
    labelPosition: { x: 210, y: 150 },
    sensorPositions: [
      { x: 150, y: 130, type: 'camera' },
      { x: 270, y: 130, type: 'access' },
      { x: 210, y: 170, type: 'alarm' },
    ],
  },
];

/**
 * Layer toggle configurations with static Tailwind classes
 */
const LAYER_CONFIGS: (LayerConfig & { activeClass: string })[] = [
  {
    id: 'cameras',
    label: 'Cameras',
    icon: Camera,
    color: 'blue',
    activeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
  {
    id: 'access',
    label: 'Access',
    icon: Shield,
    color: 'emerald',
    activeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    id: 'heat',
    label: 'Heat',
    icon: Thermometer,
    color: 'orange',
    activeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  {
    id: 'entities',
    label: 'Entities',
    icon: Users,
    color: 'cyan',
    activeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  },
  {
    id: 'injects',
    label: 'Intel',
    icon: Radio,
    color: 'purple',
    activeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
];

/**
 * Get heat color based on level
 */
function getHeatColor(level: number): string {
  if (level >= 75) return 'rgb(239, 68, 68)';
  if (level >= 50) return 'rgb(249, 115, 22)';
  if (level >= 25) return 'rgb(251, 191, 36)';
  return 'rgb(34, 197, 94)';
}

/**
 * Get heat class based on level
 */
function getHeatClass(level: number): string {
  if (level >= 75) return 'text-red-400';
  if (level >= 50) return 'text-orange-400';
  if (level >= 25) return 'text-amber-400';
  return 'text-emerald-400';
}

/**
 * Map entity to zone based on type/criticality
 */
function getEntityZone(entity: LinkedEntity): string {
  if (entity.type === 'PERSON' && entity.criticality === 'CRITICAL') return 'executive';
  if (entity.type === 'SYSTEM') return 'cyber';
  if (entity.type === 'PLACE') return 'perimeter';
  return 'operations';
}

/**
 * Campus COP Component - Full spatial visualization
 */
export default function CampusCOP({
  zoneHeatLevels,
  linkedEntities = [],
  revealedInjects = [],
  facts = [],
  assumptions = [],
  unknowns = [],
  highlightedEntityId,
  onEntityClick,
  onZoneClick,
  onInjectClick,
  consequenceAnimation,
  reducedMotion = false,
  className = '',
  compact = false,
}: CampusCOPProps): JSX.Element {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    new Set(['heat', 'entities', 'injects'])
  );
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [expandedFAU, setExpandedFAU] = useState<'facts' | 'assumptions' | 'unknowns' | null>(null);

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleZoneClick = useCallback(
    (zoneId: string) => {
      setSelectedZone((prev) => (prev === zoneId ? null : zoneId));
      onZoneClick?.(zoneId);
    },
    [onZoneClick]
  );

  const entitiesByZone = useMemo(() => {
    const map: Record<string, LinkedEntity[]> = {};
    linkedEntities.forEach((entity) => {
      const zone = getEntityZone(entity);
      if (!map[zone]) map[zone] = [];
      map[zone].push(entity);
    });
    return map;
  }, [linkedEntities]);

  const injectsByZone = useMemo(() => {
    const map: Record<string, InjectOverlay[]> = {};
    revealedInjects.forEach((inject) => {
      const zoneId = inject.linkedEntityIds?.length
        ? getEntityZone(
            linkedEntities.find((e) => inject.linkedEntityIds?.includes(e.id)) ||
              ({ type: 'ASSET' } as LinkedEntity)
          )
        : 'operations';
      if (!map[zoneId]) map[zoneId] = [];
      const zoneConfig = ZONE_CONFIGS.find((z) => z.id === zoneId);
      if (zoneConfig) {
        map[zoneId].push({
          injectId: inject.id,
          zoneId,
          title: inject.title,
          urgency: inject.intake?.isNoise ? 'ROUTINE' : inject.triagePriority || 'ROUTINE',
          position: {
            x: zoneConfig.labelPosition.x + (Math.random() - 0.5) * 40,
            y: zoneConfig.labelPosition.y + (Math.random() - 0.5) * 20,
          },
        });
      }
    });
    return map;
  }, [revealedInjects, linkedEntities]);

  const animatingZones = useMemo(() => {
    if (!consequenceAnimation?.active || !consequenceAnimation.zoneChanges)
      return new Set<string>();
    return new Set(consequenceAnimation.zoneChanges.map((z) => z.zone));
  }, [consequenceAnimation]);

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {/* Layer Toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Layers className="w-3.5 h-3.5" />
          <span className="font-medium uppercase tracking-wider">Layers</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {LAYER_CONFIGS.map((layer) => {
            const isActive = activeLayers.has(layer.id);
            const Icon = layer.icon;
            return (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-medium transition-all border',
                  isActive
                    ? layer.activeClass
                    : 'bg-gray-800/50 text-gray-500 border-gray-700/40 hover:bg-gray-800'
                )}
                title={`Toggle ${layer.label}`}
              >
                {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campus SVG Map */}
      <div
        className={clsx(
          'relative rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-950/80 overflow-hidden',
          compact ? 'h-40' : 'h-56 sm:h-64'
        )}
      >
        <svg viewBox="0 0 300 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Heat gradients */}
            {ZONE_CONFIGS.map((zone) => {
              const heat = zoneHeatLevels[zone.id] || 0;
              const color = getHeatColor(heat);
              return (
                <linearGradient
                  key={`heat-${zone.id}`}
                  id={`heat-${zone.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={color}
                    stopOpacity={activeLayers.has('heat') ? 0.3 : 0.1}
                  />
                  <stop
                    offset="100%"
                    stopColor={color}
                    stopOpacity={activeLayers.has('heat') ? 0.1 : 0.05}
                  />
                </linearGradient>
              );
            })}
            {/* Pulse animation */}
            <filter id="pulse-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid background */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(75, 85, 99, 0.2)"
              strokeWidth="0.5"
            />
          </pattern>
          <rect width="300" height="200" fill="url(#grid)" />

          {/* Zone shapes */}
          {ZONE_CONFIGS.map((zone) => {
            const heat = zoneHeatLevels[zone.id] || 0;
            const isSelected = selectedZone === zone.id;
            const isAnimating = animatingZones.has(zone.id);
            return (
              <g key={zone.id}>
                <path
                  d={zone.svgPath}
                  fill={`url(#heat-${zone.id})`}
                  stroke={isSelected ? 'rgb(59, 130, 246)' : 'rgba(156, 163, 175, 0.3)'}
                  strokeWidth={isSelected ? 2 : 1}
                  className={clsx(
                    'cursor-pointer transition-all duration-300',
                    isAnimating && !reducedMotion && 'animate-pulse'
                  )}
                  onClick={() => handleZoneClick(zone.id)}
                  filter={isAnimating ? 'url(#pulse-glow)' : undefined}
                />
                {/* Zone label */}
                <text
                  x={zone.labelPosition.x}
                  y={zone.labelPosition.y - 8}
                  textAnchor="middle"
                  className="fill-gray-400 text-[8px] font-semibold uppercase tracking-wider pointer-events-none"
                >
                  {zone.shortName}
                </text>
                {/* Heat indicator */}
                {activeLayers.has('heat') && (
                  <text
                    x={zone.labelPosition.x}
                    y={zone.labelPosition.y + 6}
                    textAnchor="middle"
                    className={clsx(
                      'text-[10px] font-bold font-mono pointer-events-none',
                      getHeatClass(heat)
                    )}
                  >
                    {heat}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Sensor markers (cameras, access, alarms) */}
          {ZONE_CONFIGS.map((zone) =>
            zone.sensorPositions?.map((sensor, sensorIdx) => {
              const showCamera = activeLayers.has('cameras') && sensor.type === 'camera';
              const showAccess = activeLayers.has('access') && sensor.type === 'access';
              if (!showCamera && !showAccess) return null;
              return (
                <g key={`${zone.id}-sensor-${sensorIdx}`}>
                  <circle
                    cx={sensor.x}
                    cy={sensor.y}
                    r={4}
                    className={clsx(
                      'transition-opacity duration-300',
                      sensor.type === 'camera' ? 'fill-blue-500/60' : 'fill-emerald-500/60'
                    )}
                  />
                  <circle
                    cx={sensor.x}
                    cy={sensor.y}
                    r={2}
                    className={sensor.type === 'camera' ? 'fill-blue-400' : 'fill-emerald-400'}
                  />
                </g>
              );
            })
          )}

          {/* Entity pins */}
          {activeLayers.has('entities') &&
            ZONE_CONFIGS.map((zone) => {
              const entities = entitiesByZone[zone.id] || [];
              return entities.slice(0, 3).map((entity, idx) => {
                const isHighlighted = highlightedEntityId === entity.id;
                const x = zone.labelPosition.x + (idx - 1) * 15;
                const y = zone.labelPosition.y + 20;
                return (
                  <g
                    key={entity.id}
                    className="cursor-pointer"
                    onClick={() => onEntityClick?.(entity.id)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHighlighted ? 7 : 5}
                      className={clsx(
                        'transition-all duration-200',
                        isHighlighted
                          ? 'fill-cyan-400 stroke-cyan-300 stroke-2'
                          : entity.criticality === 'CRITICAL'
                            ? 'fill-red-500/70'
                            : 'fill-cyan-500/50'
                      )}
                    />
                    {isHighlighted && (
                      <circle
                        cx={x}
                        cy={y}
                        r={10}
                        className="fill-none stroke-cyan-400/50 stroke-1 animate-ping"
                      />
                    )}
                    <title>{entity.name}</title>
                  </g>
                );
              });
            })}

          {/* Active inject overlays */}
          {activeLayers.has('injects') &&
            ZONE_CONFIGS.map((zone) => {
              const injects = injectsByZone[zone.id] || [];
              return injects.slice(0, 2).map((overlay) => {
                const urgencyColors = {
                  IMMEDIATE: 'fill-red-500',
                  URGENT: 'fill-amber-500',
                  ROUTINE: 'fill-gray-500',
                };
                return (
                  <g
                    key={overlay.injectId}
                    className="cursor-pointer"
                    onClick={() => onInjectClick?.(overlay.injectId)}
                  >
                    <circle
                      cx={overlay.position.x}
                      cy={overlay.position.y}
                      r={6}
                      className={clsx(urgencyColors[overlay.urgency], 'opacity-80')}
                    />
                    {overlay.urgency === 'IMMEDIATE' && !reducedMotion && (
                      <circle
                        cx={overlay.position.x}
                        cy={overlay.position.y}
                        r={10}
                        className="fill-none stroke-red-400/60 stroke-1 animate-ping"
                      />
                    )}
                    <circle
                      cx={overlay.position.x}
                      cy={overlay.position.y}
                      r={3}
                      className="fill-white/80"
                    />
                    <title>{overlay.title}</title>
                  </g>
                );
              });
            })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[9px] text-gray-500 bg-gray-900/80 px-2 py-1 rounded-md">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> High
          </span>
        </div>
      </div>

      {/* FAU Strip - Facts/Assumptions/Unknowns */}
      <div className="grid grid-cols-3 gap-2">
        <FAUCard
          type="facts"
          items={facts}
          icon={CheckCircle}
          color="emerald"
          expanded={expandedFAU === 'facts'}
          onToggle={() => setExpandedFAU((prev) => (prev === 'facts' ? null : 'facts'))}
          reducedMotion={reducedMotion}
        />
        <FAUCard
          type="assumptions"
          items={assumptions}
          icon={HelpCircle}
          color="amber"
          expanded={expandedFAU === 'assumptions'}
          onToggle={() => setExpandedFAU((prev) => (prev === 'assumptions' ? null : 'assumptions'))}
          reducedMotion={reducedMotion}
        />
        <FAUCard
          type="unknowns"
          items={unknowns}
          icon={AlertCircle}
          color="red"
          expanded={expandedFAU === 'unknowns'}
          onToggle={() => setExpandedFAU((prev) => (prev === 'unknowns' ? null : 'unknowns'))}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Selected Zone Detail */}
      {selectedZone && (
        <ZoneDetailPanel
          zone={ZONE_CONFIGS.find((z) => z.id === selectedZone)!}
          heat={zoneHeatLevels[selectedZone] || 0}
          entities={entitiesByZone[selectedZone] || []}
          injects={injectsByZone[selectedZone] || []}
          onEntityClick={onEntityClick}
          onInjectClick={onInjectClick}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
}

/**
 * FAU Card Component - Facts/Assumptions/Unknowns
 */
function FAUCard({
  type,
  items,
  icon: Icon,
  color,
  expanded,
  onToggle,
  reducedMotion,
}: {
  type: 'facts' | 'assumptions' | 'unknowns';
  items: Fact[] | Assumption[] | Unknown[];
  icon: typeof CheckCircle;
  color: 'emerald' | 'amber' | 'red';
  expanded: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
}): JSX.Element {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const count = items.length;
  const criticalCount =
    type === 'unknowns'
      ? (items as Unknown[]).filter((u) => u.priority === 'CRITICAL' && !u.resolution).length
      : 0;

  return (
    <div className={clsx('rounded-lg border overflow-hidden', colorClasses[color])}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-2xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold font-mono">{count}</span>
          {criticalCount > 0 && (
            <span className="px-1 py-0.5 bg-red-500/30 text-red-300 text-2xs rounded font-bold">
              {criticalCount}!
            </span>
          )}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </button>
      {expanded && items.length > 0 && (
        <div
          className={clsx(
            'border-t border-white/10 p-2 space-y-1.5 max-h-32 overflow-y-auto',
            !reducedMotion && 'animate-fade-in'
          )}
        >
          {items.slice(0, 5).map((item, idx) => (
            <div key={item.id || idx} className="text-2xs text-gray-300 leading-tight">
              {'description' in item ? item.description : 'question' in item ? item.question : ''}
            </div>
          ))}
          {items.length > 5 && (
            <div className="text-2xs text-gray-500 italic">+{items.length - 5} more...</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Zone Detail Panel - Shows when a zone is selected
 */
function ZoneDetailPanel({
  zone,
  heat,
  entities,
  injects,
  onEntityClick,
  onInjectClick,
  onClose,
}: {
  zone: ZoneConfig;
  heat: number;
  entities: LinkedEntity[];
  injects: InjectOverlay[];
  onEntityClick?: (id: string) => void;
  onInjectClick?: (id: string) => void;
  onClose: () => void;
}): JSX.Element {
  const Icon = zone.icon;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-3 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('p-1.5 rounded-lg', zone.iconBgClass)}>
            <Icon className={clsx('w-4 h-4', zone.iconTextClass)} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-200">{zone.name}</h4>
            <div className={clsx('text-xs font-mono font-bold', getHeatClass(heat))}>
              Heat: {heat}%
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Entities in zone */}
      {entities.length > 0 && (
        <div className="mb-3">
          <div className="text-2xs text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Entities ({entities.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {entities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => onEntityClick?.(entity.id)}
                className={clsx(
                  'px-2 py-0.5 rounded text-2xs font-medium transition-colors',
                  entity.criticality === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                )}
              >
                {entity.shortName || entity.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active injects in zone */}
      {injects.length > 0 && (
        <div>
          <div className="text-2xs text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Radio className="w-3 h-3" /> Active Intel ({injects.length})
          </div>
          <div className="space-y-1">
            {injects.map((inject) => (
              <button
                key={inject.injectId}
                onClick={() => onInjectClick?.(inject.injectId)}
                className={clsx(
                  'w-full text-left px-2 py-1 rounded text-2xs transition-colors',
                  inject.urgency === 'IMMEDIATE'
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : inject.urgency === 'URGENT'
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                )}
              >
                <span className="font-medium">{inject.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {entities.length === 0 && injects.length === 0 && (
        <div className="text-2xs text-gray-500 italic">No active items in this zone</div>
      )}
    </div>
  );
}
