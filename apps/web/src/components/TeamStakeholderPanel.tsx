'use client';

import { useState } from 'react';
import {
  Users,
  Globe,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Phone,
  MessageSquare,
  Shield,
  Briefcase,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { clsx } from 'clsx';
import type {
  GlobalRegion,
  Operator,
  TeamRosterState,
  CoverageGap,
  ShiftHandoff,
  CoachingMoment,
  MappedStakeholder,
  StakeholderMap,
  ExecutiveBriefing,
} from '@gsoc-decision-ops/core';

interface TeamPanelProps {
  roster: TeamRosterState | null;
  _onCoachingAction?: (moment: CoachingMoment, response: string) => void;
  _onHandoffStart?: (toRegion: GlobalRegion) => void;
  onCoverageAction?: (gap: CoverageGap, mitigationId: string) => void;
  expanded?: boolean;
}

interface StakeholderPanelProps {
  stakeholderMap: StakeholderMap | null;
  briefings: ExecutiveBriefing[];
  currentEscalationLevel: number;
  onBriefStakeholder?: (stakeholderId: string) => void;
  _onScheduleBriefing?: (stakeholderIds: string[]) => void;
  expanded?: boolean;
}

const REGION_COLORS: Record<GlobalRegion, { bg: string; text: string; border: string }> = {
  AMERICAS: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  EMEA: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  APAC: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const REGION_LABELS: Record<GlobalRegion, { short: string; full: string; timezone: string }> = {
  AMERICAS: { short: 'AMER', full: 'Americas', timezone: 'EST/PST' },
  EMEA: { short: 'EMEA', full: 'Europe/Middle East/Africa', timezone: 'GMT/CET' },
  APAC: { short: 'APAC', full: 'Asia-Pacific', timezone: 'SGT/JST' },
};

export function TeamPanel({
  roster,
  _onCoachingAction,
  _onHandoffStart,
  onCoverageAction,
  expanded = false,
}: TeamPanelProps): JSX.Element {
  const [expandedSection, setExpandedSection] = useState<'roster' | 'handoff' | 'gaps' | null>(
    expanded ? 'roster' : null
  );
  const [selectedRegion, setSelectedRegion] = useState<GlobalRegion | 'all'>('all');

  if (!roster) {
    return (
      <div className="p-4 text-center">
        <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Team roster unavailable</p>
      </div>
    );
  }

  const utilization = {
    AMERICAS: roster.operators.filter((o) => o.region === 'AMERICAS' && o.availability.currentShift)
      .length,
    EMEA: roster.operators.filter((o) => o.region === 'EMEA' && o.availability.currentShift).length,
    APAC: roster.operators.filter((o) => o.region === 'APAC' && o.availability.currentShift).length,
  };

  const activeRegionOps =
    selectedRegion === 'all'
      ? roster.operators
      : roster.operators.filter((o) => o.region === selectedRegion);

  return (
    <div className="space-y-3">
      {/* Active Shift Indicator */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/40 border border-gray-700/50">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-gray-300">Active Shift:</span>
        </div>
        <div
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-bold',
            REGION_COLORS[roster.activeShift].bg,
            REGION_COLORS[roster.activeShift].text,
            REGION_COLORS[roster.activeShift].border,
            'border'
          )}
        >
          {REGION_LABELS[roster.activeShift].short}
        </div>
      </div>

      {/* Regional Overview */}
      <div className="grid grid-cols-3 gap-2">
        {(['AMERICAS', 'EMEA', 'APAC'] as GlobalRegion[]).map((region) => (
          <button
            key={region}
            onClick={() => setSelectedRegion(selectedRegion === region ? 'all' : region)}
            className={clsx(
              'p-2.5 rounded-xl border text-center transition-all',
              selectedRegion === region
                ? `${REGION_COLORS[region].bg} ${REGION_COLORS[region].border}`
                : 'bg-gray-800/30 border-gray-700/40 hover:bg-gray-800/50',
              roster.activeShift === region && 'ring-2 ring-emerald-500/50'
            )}
          >
            <div className={clsx('text-xs font-bold', REGION_COLORS[region].text)}>
              {REGION_LABELS[region].short}
            </div>
            <div className="text-lg font-mono text-gray-200">{utilization[region]}</div>
            <div className="text-2xs text-gray-500">on shift</div>
          </button>
        ))}
      </div>

      {/* Global Load Indicator */}
      <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Global Load</span>
          <span
            className={clsx(
              'text-xs font-bold',
              roster.loadBalance.globalLoad > 80
                ? 'text-red-400'
                : roster.loadBalance.globalLoad > 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            )}
          >
            {roster.loadBalance.globalLoad}%
          </span>
        </div>
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              roster.loadBalance.globalLoad > 80
                ? 'bg-red-500'
                : roster.loadBalance.globalLoad > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            )}
            style={{ width: `${roster.loadBalance.globalLoad}%` }}
          />
        </div>
      </div>

      {/* Collapsible Sections */}
      {/* Team Roster Section */}
      <CollapsibleSection
        title="Team Roster"
        icon={<Users className="w-4 h-4" />}
        badge={activeRegionOps.filter((o) => o.availability.currentShift).length}
        expanded={expandedSection === 'roster'}
        onToggle={() => setExpandedSection(expandedSection === 'roster' ? null : 'roster')}
      >
        <div className="space-y-2 pt-2">
          {activeRegionOps
            .filter((o) => o.availability.currentShift)
            .map((op) => (
              <OperatorCard key={op.id} operator={op} compact />
            ))}
          {activeRegionOps.filter((o) => o.availability.currentShift).length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">No operators on shift</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Shift Handoff Section */}
      {roster.handoffs.length > 0 && (
        <CollapsibleSection
          title="Shift Handoffs"
          icon={<ArrowRight className="w-4 h-4" />}
          badge={roster.handoffs.length}
          expanded={expandedSection === 'handoff'}
          onToggle={() => setExpandedSection(expandedSection === 'handoff' ? null : 'handoff')}
          badgeColor="amber"
        >
          <div className="space-y-2 pt-2">
            {roster.handoffs.map((handoff) => (
              <HandoffCard key={handoff.id} handoff={handoff} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Coverage Gaps Section */}
      {roster.coverageGaps.length > 0 && (
        <CollapsibleSection
          title="Coverage Gaps"
          icon={<AlertTriangle className="w-4 h-4" />}
          badge={roster.coverageGaps.length}
          expanded={expandedSection === 'gaps'}
          onToggle={() => setExpandedSection(expandedSection === 'gaps' ? null : 'gaps')}
          badgeColor="red"
        >
          <div className="space-y-2 pt-2">
            {roster.coverageGaps.map((gap) => (
              <CoverageGapCard
                key={gap.id}
                gap={gap}
                onMitigate={onCoverageAction ? (mitId) => onCoverageAction(gap, mitId) : undefined}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Team Health Indicator */}
      <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700/40">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium text-gray-300">Team Health</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-2xs">
          <HealthMetric
            label="Morale"
            value={roster.teamHealth.overallMorale}
            color={
              roster.teamHealth.overallMorale === 'HIGH'
                ? 'emerald'
                : roster.teamHealth.overallMorale === 'MODERATE'
                  ? 'amber'
                  : 'red'
            }
          />
          <HealthMetric
            label="Burnout Risk"
            value={roster.teamHealth.burnoutRisk}
            color={
              roster.teamHealth.burnoutRisk === 'LOW'
                ? 'emerald'
                : roster.teamHealth.burnoutRisk === 'MEDIUM'
                  ? 'amber'
                  : 'red'
            }
          />
          <HealthMetric
            label="Training Debt"
            value={`${roster.teamHealth.trainingDebt} pending`}
            color={
              roster.teamHealth.trainingDebt > 5
                ? 'red'
                : roster.teamHealth.trainingDebt > 2
                  ? 'amber'
                  : 'emerald'
            }
          />
          <HealthMetric
            label="Vacancies"
            value={roster.teamHealth.vacancyCount.toString()}
            color={
              roster.teamHealth.vacancyCount > 2
                ? 'red'
                : roster.teamHealth.vacancyCount > 0
                  ? 'amber'
                  : 'emerald'
            }
          />
        </div>
      </div>
    </div>
  );
}

export function StakeholderPanel({
  stakeholderMap,
  briefings,
  currentEscalationLevel,
  onBriefStakeholder,
  _onScheduleBriefing,
  expanded = false,
}: StakeholderPanelProps): JSX.Element {
  const [expandedSection, setExpandedSection] = useState<'key' | 'all' | 'escalation' | null>(
    expanded ? 'key' : null
  );

  if (!stakeholderMap) {
    return (
      <div className="p-4 text-center">
        <Briefcase className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Stakeholder map unavailable</p>
      </div>
    );
  }

  const keyStakeholders = stakeholderMap.stakeholders.filter(
    (s) => s.influence === 'DECISION_MAKER' || s.influence === 'KEY_INFLUENCER'
  );

  const briefedIds = new Set(briefings.map((b) => b.recipientId));
  const unbriefedKey = keyStakeholders.filter((s) => !briefedIds.has(s.id));

  return (
    <div className="space-y-3">
      {/* Current Escalation Level */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/40 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-gray-300">Escalation Level</span>
          </div>
          <span
            className={clsx(
              'px-2.5 py-1 rounded-lg text-xs font-bold border',
              currentEscalationLevel >= 4
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : currentEscalationLevel >= 3
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-gray-800 text-gray-300 border-gray-700'
            )}
          >
            Level {currentEscalationLevel}
          </span>
        </div>
        <EscalationLevelBar level={currentEscalationLevel} />
      </div>

      {/* Briefing Status */}
      {unbriefedKey.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-medium">
              {unbriefedKey.length} key stakeholder{unbriefedKey.length > 1 ? 's' : ''} awaiting
              briefing
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {unbriefedKey.slice(0, 3).map((s) => (
              <span
                key={s.id}
                className="px-2 py-0.5 rounded bg-amber-500/20 text-2xs text-amber-300"
              >
                {s.name.split(' ')[0]}
              </span>
            ))}
            {unbriefedKey.length > 3 && (
              <span className="px-2 py-0.5 rounded bg-gray-800 text-2xs text-gray-400">
                +{unbriefedKey.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Key Stakeholders Section */}
      <CollapsibleSection
        title="Key Stakeholders"
        icon={<UserCheck className="w-4 h-4" />}
        badge={keyStakeholders.length}
        expanded={expandedSection === 'key'}
        onToggle={() => setExpandedSection(expandedSection === 'key' ? null : 'key')}
      >
        <div className="space-y-2 pt-2">
          {keyStakeholders.map((s) => (
            <StakeholderCard
              key={s.id}
              stakeholder={s}
              briefed={briefedIds.has(s.id)}
              onBrief={onBriefStakeholder ? () => onBriefStakeholder(s.id) : undefined}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* All Stakeholders Section */}
      <CollapsibleSection
        title="All Stakeholders"
        icon={<Users className="w-4 h-4" />}
        badge={stakeholderMap.stakeholders.length}
        expanded={expandedSection === 'all'}
        onToggle={() => setExpandedSection(expandedSection === 'all' ? null : 'all')}
      >
        <div className="space-y-2 pt-2">
          {stakeholderMap.stakeholders.map((s) => (
            <StakeholderCard
              key={s.id}
              stakeholder={s}
              briefed={briefedIds.has(s.id)}
              onBrief={onBriefStakeholder ? () => onBriefStakeholder(s.id) : undefined}
              compact
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Critical Relationships */}
      {stakeholderMap.criticalRelationships.length > 0 && (
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
          <div className="flex items-center gap-2 text-violet-400 text-xs mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-medium">Critical Relationships</span>
          </div>
          <div className="space-y-1.5">
            {stakeholderMap.criticalRelationships.slice(0, 3).map((rel) => {
              const stakeholder = stakeholderMap.stakeholders.find(
                (s) => s.id === rel.stakeholderId
              );
              return (
                <div key={rel.stakeholderId} className="text-2xs">
                  <span className="text-gray-300">{stakeholder?.name || 'Unknown'}</span>
                  <span className="text-gray-500"> — {rel.importance}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  badge,
  expanded,
  onToggle,
  children,
  badgeColor = 'gray',
}: {
  title: string;
  icon: React.ReactNode;
  badge?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badgeColor?: 'gray' | 'amber' | 'red' | 'emerald';
}): JSX.Element {
  const badgeColors = {
    gray: 'bg-gray-800 text-gray-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="rounded-xl border border-gray-700/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <span className="text-sm font-medium text-gray-300">{title}</span>
          {badge !== undefined && (
            <span
              className={clsx('px-1.5 py-0.5 rounded text-2xs font-bold', badgeColors[badgeColor])}
            >
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {expanded && <div className="p-3 border-t border-gray-700/40">{children}</div>}
    </div>
  );
}

function OperatorCard({
  operator,
  compact = false,
}: {
  operator: Operator;
  compact?: boolean;
}): JSX.Element {
  const performanceColors = {
    EXCEEDS: 'text-emerald-400',
    MEETS: 'text-blue-400',
    DEVELOPING: 'text-amber-400',
    NEEDS_IMPROVEMENT: 'text-red-400',
  };

  return (
    <div className="p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold',
              REGION_COLORS[operator.region].bg,
              REGION_COLORS[operator.region].text
            )}
          >
            {operator.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">{operator.name}</p>
            <p className="text-2xs text-gray-500">{operator.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
        {!compact && (
          <div className="text-right">
            <p
              className={clsx(
                'text-2xs font-medium',
                performanceColors[operator.performance.overall]
              )}
            >
              {operator.performance.overall.replace('_', ' ')}
            </p>
            <p className="text-2xs text-gray-500">{operator.workload.utilizationPercent}% util</p>
          </div>
        )}
      </div>
      {!compact && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full',
                operator.workload.utilizationPercent > 80
                  ? 'bg-red-500'
                  : operator.workload.utilizationPercent > 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              )}
              style={{ width: `${operator.workload.utilizationPercent}%` }}
            />
          </div>
          <span className="text-2xs text-gray-500 w-8">
            {operator.workload.activeIncidents} inc
          </span>
        </div>
      )}
    </div>
  );
}

function HandoffCard({ handoff }: { handoff: ShiftHandoff }): JSX.Element {
  const qualityColors = {
    EXCELLENT: 'text-emerald-400 bg-emerald-500/10',
    GOOD: 'text-blue-400 bg-blue-500/10',
    ADEQUATE: 'text-amber-400 bg-amber-500/10',
    POOR: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs">
          <span className={REGION_COLORS[handoff.fromRegion].text}>{handoff.fromRegion}</span>
          <ArrowRight className="w-3 h-3 text-gray-500" />
          <span className={REGION_COLORS[handoff.toRegion].text}>{handoff.toRegion}</span>
        </div>
        <span
          className={clsx(
            'px-1.5 py-0.5 rounded text-2xs font-bold',
            qualityColors[handoff.handoffQuality]
          )}
        >
          {handoff.handoffQuality}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-2xs text-center">
        <div>
          <span className="text-amber-400 font-bold">{handoff.openIncidents}</span>
          <p className="text-gray-500">open</p>
        </div>
        <div>
          <span className="text-red-400 font-bold">{handoff.activeEscalations}</span>
          <p className="text-gray-500">escalated</p>
        </div>
        <div>
          <span className="text-violet-400 font-bold">{handoff.pendingDecisions.length}</span>
          <p className="text-gray-500">pending</p>
        </div>
      </div>
      {!handoff.briefingComplete && (
        <div className="mt-2 p-1.5 rounded bg-amber-500/10 text-2xs text-amber-400 text-center">
          Briefing incomplete
        </div>
      )}
    </div>
  );
}

function CoverageGapCard({
  gap,
  onMitigate,
}: {
  gap: CoverageGap;
  onMitigate?: (mitigationId: string) => void;
}): JSX.Element {
  const severityColors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    LOW: 'bg-gray-800 text-gray-400 border-gray-700',
  };

  return (
    <div className={clsx('p-2.5 rounded-lg border', severityColors[gap.severity])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{gap.skill.replace(/_/g, ' ')}</span>
        <span
          className={clsx(
            'px-1.5 py-0.5 rounded text-2xs font-bold',
            REGION_COLORS[gap.region].bg,
            REGION_COLORS[gap.region].text
          )}
        >
          {gap.region}
        </span>
      </div>
      <p className="text-2xs text-gray-500 mb-2">Reason: {gap.reason.replace(/_/g, ' ')}</p>
      {gap.mitigationOptions.length > 0 && onMitigate && (
        <div className="flex flex-wrap gap-1">
          {gap.mitigationOptions.slice(0, 2).map((mit) => (
            <button
              key={mit.id}
              onClick={() => onMitigate(mit.id)}
              className="px-2 py-1 rounded text-2xs bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              {mit.type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StakeholderCard({
  stakeholder,
  briefed,
  onBrief,
  compact = false,
}: {
  stakeholder: MappedStakeholder;
  briefed: boolean;
  onBrief?: () => void;
  compact?: boolean;
}): JSX.Element {
  const influenceColors = {
    DECISION_MAKER: 'text-red-400',
    KEY_INFLUENCER: 'text-amber-400',
    CONTRIBUTOR: 'text-blue-400',
    INFORMED: 'text-gray-400',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    EXECUTIVE: <Briefcase className="w-3 h-3" />,
    CLIENT_SECURITY: <Shield className="w-3 h-3" />,
    BUSINESS_UNIT: <MapPin className="w-3 h-3" />,
    FACILITIES: <MapPin className="w-3 h-3" />,
    CYBER: <Shield className="w-3 h-3" />,
    LEGAL: <Briefcase className="w-3 h-3" />,
    HR: <Users className="w-3 h-3" />,
    COMMUNICATIONS: <MessageSquare className="w-3 h-3" />,
    EXTERNAL_PARTNER: <Globe className="w-3 h-3" />,
    VENDOR: <Briefcase className="w-3 h-3" />,
    REGULATOR: <Shield className="w-3 h-3" />,
  };

  return (
    <div
      className={clsx(
        'p-2.5 rounded-lg border transition-all',
        briefed ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-800/40 border-gray-700/40'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center bg-gray-800',
              influenceColors[stakeholder.influence]
            )}
          >
            {categoryIcons[stakeholder.category] || <Users className="w-3 h-3" />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">{stakeholder.name}</p>
            {!compact && <p className="text-2xs text-gray-500">{stakeholder.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {briefed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
          {onBrief && !briefed && (
            <button
              onClick={onBrief}
              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
              title="Brief stakeholder"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
        </div>
      </div>
      {!compact && (
        <div className="mt-2 flex items-center gap-1.5 text-2xs text-gray-500">
          <span className={influenceColors[stakeholder.influence]}>
            {stakeholder.influence.replace(/_/g, ' ')}
          </span>
          <span>•</span>
          <span>{stakeholder.interest} interest</span>
        </div>
      )}
    </div>
  );
}

function HealthMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'emerald' | 'amber' | 'red';
}): JSX.Element {
  const colorClasses = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className="p-2 rounded-lg bg-gray-900/50">
      <p className="text-gray-500">{label}</p>
      <p className={clsx('font-medium', colorClasses[color])}>{value}</p>
    </div>
  );
}

function EscalationLevelBar({ level }: { level: number }): JSX.Element {
  const levels = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1">
      {levels.map((l) => (
        <div
          key={l}
          className={clsx(
            'flex-1 h-1.5 rounded-full transition-all',
            l <= level
              ? l >= 4
                ? 'bg-red-500'
                : l >= 3
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              : 'bg-gray-800'
          )}
        />
      ))}
    </div>
  );
}
