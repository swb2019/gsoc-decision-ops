'use client';

import { FileText, Download, Calendar, Filter, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DEMO_INCIDENTS } from '@/lib/demo-data';

export default function ReportsPage(): JSX.Element {
  const { workspace } = useAuth();
  const workspaceIncidents = DEMO_INCIDENTS.filter((i) => i.workspaceId === workspace?.id);

  const reports = workspaceIncidents.map((incident) => ({
    id: `aar_${incident.id}`,
    incidentTitle: incident.title,
    type: 'After-Action Report',
    generatedAt: incident.updatedAt,
    format: 'Markdown',
    status: incident.status === 'RESOLVED' || incident.status === 'CLOSED' ? 'complete' : 'draft',
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ops-dark-50 mb-1">Reports</h1>
          <p className="text-ops-dark-400">
            After-action reports and incident documentation exports.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ops-dark-500" />
          <input
            type="text"
            placeholder="Search reports..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 placeholder-ops-dark-500 focus:outline-none focus:border-ops-accent-green"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-ops-dark-500" />
          <select className="px-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-200 focus:outline-none focus:border-ops-accent-green">
            <option value="all">All Reports</option>
            <option value="complete">Complete</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-ops-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ops-dark-200 mb-2">No reports yet</h3>
            <p className="text-ops-dark-500">
              After-action reports will appear here once you complete training scenarios.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ops-dark-800">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-4 p-4 hover:bg-ops-dark-800/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-ops-accent-blue/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-ops-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-ops-dark-100 truncate">{report.type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        report.status === 'complete'
                          ? 'bg-ops-accent-green/20 text-ops-accent-green'
                          : 'bg-ops-dark-700 text-ops-dark-400'
                      }`}
                    >
                      {report.status === 'complete' ? 'Complete' : 'Draft'}
                    </span>
                  </div>
                  <div className="text-sm text-ops-dark-500 truncate">{report.incidentTitle}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ops-dark-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </span>
                    <span>{report.format}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-ops-dark-700 text-ops-dark-300 text-sm font-medium hover:bg-ops-dark-800 transition-colors flex items-center gap-1.5">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Options Info */}
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-ops-dark-900 border border-ops-dark-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-ops-accent-green/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-ops-accent-green" />
            </div>
            <div className="font-medium text-ops-dark-100">Markdown Export</div>
          </div>
          <p className="text-sm text-ops-dark-500">
            Human-readable format for documentation, wikis, and knowledge bases.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-ops-dark-900 border border-ops-dark-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-ops-accent-blue/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-ops-accent-blue" />
            </div>
            <div className="font-medium text-ops-dark-100">JSON Export</div>
          </div>
          <p className="text-sm text-ops-dark-500">
            Structured format for integrations, analytics, and archival systems.
          </p>
        </div>
      </div>
    </div>
  );
}
