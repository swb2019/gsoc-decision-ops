'use client';

import { useState } from 'react';
import { Plus, Search, MoreVertical, Mail, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DEMO_TEAM_MEMBERS } from '@/lib/demo-data';
import { ROLE_PERMISSIONS } from '@/lib/types';

export default function TeamPage(): JSX.Element {
  const { user, organization } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const userPermissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const filteredMembers = DEMO_TEAM_MEMBERS.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatLastActive = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ops-dark-50 mb-1">Team</h1>
          <p className="text-ops-dark-400">
            Manage team members and roles for {organization?.name}.
          </p>
        </div>
        {userPermissions?.canManageTeam && (
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 font-medium hover:bg-ops-accent-green/90 transition-colors">
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ops-dark-500" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 placeholder-ops-dark-500 focus:outline-none focus:border-ops-accent-green"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-200 focus:outline-none focus:border-ops-accent-green"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="manager">GSOC Manager</option>
          <option value="supervisor">GSOC Supervisor</option>
          <option value="analyst">GSOC Analyst</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* Team List */}
      <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-ops-dark-800/50 text-xs font-medium text-ops-dark-400 uppercase tracking-wider">
          <div className="col-span-4">Member</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Last Active</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-ops-dark-800">
          {filteredMembers.map((member) => {
            const roleInfo = ROLE_PERMISSIONS[member.role];
            const isOnline =
              member.lastActive && Date.now() - new Date(member.lastActive).getTime() < 300000;

            return (
              <div
                key={member.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-ops-dark-800/30 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ops-accent-blue to-indigo-600 flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0)}
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-ops-accent-green border-2 border-ops-dark-900" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-ops-dark-100">{member.name}</div>
                    <div className="text-sm text-ops-dark-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-ops-dark-500" />
                    <span className="text-sm text-ops-dark-200">{roleInfo.label}</span>
                  </div>
                  <div className="text-xs text-ops-dark-500 mt-0.5">{roleInfo.description}</div>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                      isOnline
                        ? 'bg-ops-accent-green/20 text-ops-accent-green'
                        : 'bg-ops-dark-700 text-ops-dark-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-ops-accent-green' : 'bg-ops-dark-500'}`}
                    />
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-1.5 text-sm text-ops-dark-400">
                    <Clock className="w-4 h-4" />
                    {formatLastActive(member.lastActive)}
                  </div>
                </div>

                <div className="col-span-1 flex justify-end">
                  {userPermissions?.canManageTeam && (
                    <button className="p-1.5 rounded-lg hover:bg-ops-dark-700 text-ops-dark-500 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Legend */}
      <div className="mt-8 p-6 rounded-xl bg-ops-dark-900 border border-ops-dark-800">
        <h3 className="font-semibold text-ops-dark-100 mb-4">Role Permissions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
            <div key={role} className="p-3 rounded-lg bg-ops-dark-800/50">
              <div className="font-medium text-ops-dark-200 mb-1">{perms.label}</div>
              <p className="text-xs text-ops-dark-500">{perms.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
