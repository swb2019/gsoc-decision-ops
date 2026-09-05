'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  Users,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DEMO_INCIDENTS, DEMO_AUDIT_LOG, DEMO_TEAM_MEMBERS } from '@/lib/demo-data';
import { ROLE_PERMISSIONS } from '@/lib/types';

export default function DashboardPage(): JSX.Element {
  const { user, workspace } = useAuth();
  const userPermissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const workspaceIncidents = DEMO_INCIDENTS.filter((i) => i.workspaceId === workspace?.id);
  const activeIncidents = workspaceIncidents.filter((i) => i.status === 'ACTIVE');
  const recentAuditLog = DEMO_AUDIT_LOG.slice(0, 5);

  const stats = [
    {
      label: 'Active Incidents',
      value: activeIncidents.length,
      icon: AlertTriangle,
      color: 'text-ops-accent-amber',
      bgColor: 'bg-ops-accent-amber/10',
    },
    {
      label: 'Total Decisions',
      value: workspaceIncidents.reduce((sum, i) => sum + i.decisionCount, 0),
      icon: CheckCircle,
      color: 'text-ops-accent-green',
      bgColor: 'bg-ops-accent-green/10',
    },
    {
      label: 'Team Members',
      value: DEMO_TEAM_MEMBERS.length,
      icon: Users,
      color: 'text-ops-accent-blue',
      bgColor: 'bg-ops-accent-blue/10',
    },
    {
      label: 'This Month',
      value: workspaceIncidents.length,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      subLabel: 'training scenarios',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ops-dark-50 mb-1">Dashboard</h1>
        <p className="text-ops-dark-400">
          Welcome back, {user?.name}. Here's what's happening in {workspace?.name}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-ops-dark-900 border border-ops-dark-800"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-ops-dark-50 mb-1">{stat.value}</div>
            <div className="text-sm text-ops-dark-400">{stat.label}</div>
            {stat.subLabel && <div className="text-xs text-ops-dark-500">{stat.subLabel}</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <div className="lg:col-span-2 rounded-xl bg-ops-dark-900 border border-ops-dark-800">
          <div className="flex items-center justify-between p-4 border-b border-ops-dark-800">
            <h2 className="font-semibold text-ops-dark-100">Recent Incidents</h2>
            {userPermissions?.canCreate && (
              <Link
                href="/app/incidents/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ops-accent-green/10 text-ops-accent-green text-sm font-medium hover:bg-ops-accent-green/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Scenario
              </Link>
            )}
          </div>
          <div className="divide-y divide-ops-dark-800">
            {workspaceIncidents.length === 0 ? (
              <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-ops-dark-600 mx-auto mb-3" />
                <p className="text-ops-dark-400 mb-4">No incidents in this workspace yet.</p>
                {userPermissions?.canCreate && (
                  <Link
                    href="/app/incidents/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 font-medium hover:bg-ops-accent-green/90"
                  >
                    <Plus className="w-4 h-4" />
                    Start Training Scenario
                  </Link>
                )}
              </div>
            ) : (
              workspaceIncidents.slice(0, 5).map((incident) => (
                <Link
                  key={incident.id}
                  href={`/app/incidents/${incident.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-ops-dark-800/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      incident.severity === 'CRITICAL'
                        ? 'bg-ops-accent-red/20'
                        : incident.severity === 'HIGH'
                          ? 'bg-ops-accent-amber/20'
                          : 'bg-ops-dark-800'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        incident.severity === 'CRITICAL'
                          ? 'text-ops-accent-red'
                          : incident.severity === 'HIGH'
                            ? 'text-ops-accent-amber'
                            : 'text-ops-dark-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ops-dark-100 truncate">
                        {incident.title}
                      </span>
                      {incident.isTrainingScenario && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-ops-accent-blue/20 text-ops-accent-blue font-medium">
                          Training
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-ops-dark-500">
                      {incident.decisionCount} decisions • {incident.createdBy}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        incident.status === 'ACTIVE'
                          ? 'bg-ops-accent-green/20 text-ops-accent-green'
                          : incident.status === 'MONITORING'
                            ? 'bg-ops-accent-amber/20 text-ops-accent-amber'
                            : 'bg-ops-dark-700 text-ops-dark-400'
                      }`}
                    >
                      {incident.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-ops-dark-500" />
                  </div>
                </Link>
              ))
            )}
          </div>
          {workspaceIncidents.length > 5 && (
            <div className="p-4 border-t border-ops-dark-800">
              <Link href="/app/incidents" className="text-sm text-ops-accent-green hover:underline">
                View all incidents →
              </Link>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800">
          <div className="flex items-center justify-between p-4 border-b border-ops-dark-800">
            <h2 className="font-semibold text-ops-dark-100">Activity</h2>
            <Activity className="w-4 h-4 text-ops-dark-500" />
          </div>
          <div className="divide-y divide-ops-dark-800">
            {recentAuditLog.map((entry) => (
              <div key={entry.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ops-accent-blue to-indigo-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {entry.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ops-dark-200">
                      <span className="font-medium">{entry.userName}</span>{' '}
                      <span className="text-ops-dark-400">{entry.action.replace('.', ' ')}</span>
                    </p>
                    {entry.details && (
                      <p className="text-xs text-ops-dark-500 mt-0.5 truncate">{entry.details}</p>
                    )}
                    <p className="text-xs text-ops-dark-600 mt-1">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Link
          href="/app/incidents/new"
          className="flex items-center gap-4 p-4 rounded-xl bg-ops-dark-900 border border-ops-dark-800 hover:border-ops-dark-700 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-ops-accent-green/10 flex items-center justify-center">
            <Plus className="w-6 h-6 text-ops-accent-green" />
          </div>
          <div>
            <div className="font-medium text-ops-dark-100 group-hover:text-ops-accent-green transition-colors">
              New Training Scenario
            </div>
            <div className="text-sm text-ops-dark-500">Start a new exercise</div>
          </div>
        </Link>

        <Link
          href="/app/playbooks"
          className="flex items-center gap-4 p-4 rounded-xl bg-ops-dark-900 border border-ops-dark-800 hover:border-ops-dark-700 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-ops-accent-blue/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-ops-accent-blue" />
          </div>
          <div>
            <div className="font-medium text-ops-dark-100 group-hover:text-ops-accent-blue transition-colors">
              Browse Playbooks
            </div>
            <div className="text-sm text-ops-dark-500">Response frameworks</div>
          </div>
        </Link>

        <Link
          href="/app/reports"
          className="flex items-center gap-4 p-4 rounded-xl bg-ops-dark-900 border border-ops-dark-800 hover:border-ops-dark-700 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-400/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="font-medium text-ops-dark-100 group-hover:text-purple-400 transition-colors">
              View Reports
            </div>
            <div className="text-sm text-ops-dark-500">After-action exports</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
