'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, Plus, Search, Filter, ArrowRight, Calendar, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DEMO_INCIDENTS } from '@/lib/demo-data';
import { ROLE_PERMISSIONS } from '@/lib/types';

export default function IncidentsPage(): JSX.Element {
  const { user, workspace } = useAuth();
  const userPermissions = user ? ROLE_PERMISSIONS[user.role] : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const workspaceIncidents = DEMO_INCIDENTS.filter((i) => i.workspaceId === workspace?.id);

  const filteredIncidents = workspaceIncidents.filter((incident) => {
    const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ops-dark-50 mb-1">Incidents</h1>
          <p className="text-ops-dark-400">Manage training scenarios and incident decision logs.</p>
        </div>
        {userPermissions?.canCreate && (
          <Link
            href="/app/incidents/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 font-medium hover:bg-ops-accent-green/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Scenario
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ops-dark-500" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 placeholder-ops-dark-500 focus:outline-none focus:border-ops-accent-green"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-ops-dark-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-200 focus:outline-none focus:border-ops-accent-green"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="MONITORING">Monitoring</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 overflow-hidden">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-ops-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ops-dark-200 mb-2">No incidents found</h3>
            <p className="text-ops-dark-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Start a new training scenario to begin.'}
            </p>
            {userPermissions?.canCreate && (
              <Link
                href="/app/incidents/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 font-medium hover:bg-ops-accent-green/90"
              >
                <Plus className="w-4 h-4" />
                New Training Scenario
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-ops-dark-800">
            {filteredIncidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/app/incidents/${incident.id}`}
                className="flex items-center gap-4 p-4 hover:bg-ops-dark-800/50 transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    incident.severity === 'CRITICAL'
                      ? 'bg-ops-accent-red/20'
                      : incident.severity === 'HIGH'
                        ? 'bg-ops-accent-amber/20'
                        : incident.severity === 'MEDIUM'
                          ? 'bg-yellow-500/20'
                          : 'bg-ops-dark-800'
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      incident.severity === 'CRITICAL'
                        ? 'text-ops-accent-red'
                        : incident.severity === 'HIGH'
                          ? 'text-ops-accent-amber'
                          : incident.severity === 'MEDIUM'
                            ? 'text-yellow-500'
                            : 'text-ops-dark-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-ops-dark-100 truncate">
                      {incident.title}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        incident.severity === 'CRITICAL'
                          ? 'bg-ops-accent-red/20 text-ops-accent-red'
                          : incident.severity === 'HIGH'
                            ? 'bg-ops-accent-amber/20 text-ops-accent-amber'
                            : 'bg-ops-dark-700 text-ops-dark-400'
                      }`}
                    >
                      {incident.severity}
                    </span>
                    {incident.isTrainingScenario && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-ops-accent-blue/20 text-ops-accent-blue font-medium">
                        Training
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ops-dark-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {incident.createdBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </span>
                    <span>{incident.decisionCount} decisions</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      incident.status === 'ACTIVE'
                        ? 'bg-ops-accent-green/20 text-ops-accent-green'
                        : incident.status === 'MONITORING'
                          ? 'bg-ops-accent-amber/20 text-ops-accent-amber'
                          : 'bg-ops-dark-700 text-ops-dark-400'
                    }`}
                  >
                    {incident.status}
                  </span>
                  <ArrowRight className="w-5 h-5 text-ops-dark-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
