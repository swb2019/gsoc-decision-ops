'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  BookOpen,
  Settings,
  Users,
  FileText,
  ChevronDown,
  Building2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { ROLE_PERMISSIONS } from '@/lib/types';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Incidents', href: '/app/incidents', icon: AlertTriangle },
  { name: 'Playbooks', href: '/app/playbooks', icon: BookOpen },
  { name: 'Reports', href: '/app/reports', icon: FileText },
];

const secondaryNavigation = [
  { name: 'Team', href: '/app/team', icon: Users, requiresPermission: 'canViewAudit' as const },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const {
    user,
    organization,
    workspace,
    workspaces,
    organizations,
    switchOrganization,
    switchWorkspace,
    signOut,
  } = useAuth();
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);

  const userPermissions = user ? ROLE_PERMISSIONS[user.role] : null;

  return (
    <div className="flex h-full w-64 flex-col bg-ops-dark-900 border-r border-ops-dark-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4 border-b border-ops-dark-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ops-accent-green to-emerald-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-ops-dark-50 text-sm">Decision Ops</span>
          <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-ops-accent-green/20 text-ops-accent-green font-medium">
            Cloud
          </span>
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="px-3 py-3 border-b border-ops-dark-800">
        <div className="relative">
          <button
            onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-ops-dark-800/50 hover:bg-ops-dark-800 transition-colors text-left"
          >
            <Building2 className="w-4 h-4 text-ops-dark-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ops-dark-100 truncate">
                {organization?.name || 'Select Organization'}
              </div>
              <div className="text-xs text-ops-dark-500 capitalize">{organization?.plan} Plan</div>
            </div>
            <ChevronDown className="w-4 h-4 text-ops-dark-400" />
          </button>

          {showOrgSwitcher && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-ops-dark-800 rounded-lg border border-ops-dark-700 shadow-xl z-50">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrganization(org.id);
                    setShowOrgSwitcher(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-ops-dark-700 first:rounded-t-lg last:rounded-b-lg ${
                    org.id === organization?.id ? 'bg-ops-dark-700' : ''
                  }`}
                >
                  <Building2 className="w-4 h-4 text-ops-dark-400" />
                  <span className="text-sm text-ops-dark-100">{org.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-2">
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ops-dark-800 transition-colors text-left"
          >
            <div className="w-2 h-2 rounded-full bg-ops-accent-green" />
            <span className="flex-1 text-sm text-ops-dark-200 truncate">
              {workspace?.name || 'Select Workspace'}
            </span>
            <ChevronDown className="w-4 h-4 text-ops-dark-500" />
          </button>

          {showWorkspaceSwitcher && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-ops-dark-800 rounded-lg border border-ops-dark-700 shadow-xl z-50">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setShowWorkspaceSwitcher(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-ops-dark-700 first:rounded-t-lg last:rounded-b-lg ${
                    ws.id === workspace?.id ? 'bg-ops-dark-700' : ''
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${ws.activeIncidents > 0 ? 'bg-ops-accent-amber' : 'bg-ops-dark-600'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ops-dark-100 truncate">{ws.name}</div>
                    <div className="text-xs text-ops-dark-500">{ws.activeIncidents} active</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-ops-accent-green/10 text-ops-accent-green'
                  : 'text-ops-dark-300 hover:bg-ops-dark-800 hover:text-ops-dark-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-ops-dark-800">
          {secondaryNavigation.map((item) => {
            if (
              item.requiresPermission &&
              userPermissions &&
              !userPermissions[item.requiresPermission]
            ) {
              return null;
            }
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ops-accent-green/10 text-ops-accent-green'
                    : 'text-ops-dark-300 hover:bg-ops-dark-800 hover:text-ops-dark-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Demo Mode Banner */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ops-accent-amber/10 border border-ops-accent-amber/20">
          <Sparkles className="w-4 h-4 text-ops-accent-amber" />
          <span className="text-xs text-ops-accent-amber font-medium">Demo Mode</span>
        </div>
      </div>

      {/* User Menu */}
      <div className="px-3 py-3 border-t border-ops-dark-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ops-accent-blue to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ops-dark-100 truncate">{user?.name}</div>
            <div className="text-xs text-ops-dark-500">{userPermissions?.label}</div>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg hover:bg-ops-dark-800 text-ops-dark-400 hover:text-ops-dark-200 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
