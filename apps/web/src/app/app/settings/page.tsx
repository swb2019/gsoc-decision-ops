'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Key,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage(): JSX.Element {
  const { user, organization } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ops-dark-50 mb-1">Settings</h1>
        <p className="text-ops-dark-400">Manage your account and organization settings.</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-ops-accent-green/10 text-ops-accent-green'
                    : 'text-ops-dark-300 hover:bg-ops-dark-800 hover:text-ops-dark-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6">
                <h2 className="text-lg font-semibold text-ops-dark-100 mb-4">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ops-dark-200 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 focus:outline-none focus:border-ops-accent-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ops-dark-200 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 focus:outline-none focus:border-ops-accent-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ops-dark-200 mb-1.5">
                      Role
                    </label>
                    <input
                      type="text"
                      defaultValue="GSOC Manager"
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg bg-ops-dark-800/50 border border-ops-dark-700 text-ops-dark-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-ops-dark-500 mt-1">
                      Contact an admin to change your role.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 font-medium hover:bg-ops-accent-green/90 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6">
                <h2 className="text-lg font-semibold text-ops-dark-100 mb-4">
                  Organization Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ops-dark-200 mb-1.5">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      defaultValue={organization?.name}
                      className="w-full px-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 focus:outline-none focus:border-ops-accent-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ops-dark-200 mb-1.5">
                      Slug
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-ops-dark-500">app.decision-ops.cloud/</span>
                      <input
                        type="text"
                        defaultValue={organization?.slug}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 focus:outline-none focus:border-ops-accent-green"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6">
                <h2 className="text-lg font-semibold text-ops-dark-100 mb-4">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      label: 'New incident created',
                      description: 'Get notified when a new incident is created in your workspace',
                    },
                    {
                      label: 'Decision recorded',
                      description:
                        'Get notified when a decision is recorded on incidents you follow',
                    },
                    {
                      label: 'Action items assigned',
                      description: 'Get notified when you are assigned an action item',
                    },
                    {
                      label: 'Bridge call reminders',
                      description: 'Get reminders before scheduled bridge calls',
                    },
                  ].map((pref) => (
                    <div
                      key={pref.label}
                      className="flex items-start justify-between gap-4 py-3 border-b border-ops-dark-800 last:border-0"
                    >
                      <div>
                        <div className="font-medium text-ops-dark-200">{pref.label}</div>
                        <div className="text-sm text-ops-dark-500">{pref.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-ops-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ops-accent-green"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6">
                <h2 className="text-lg font-semibold text-ops-dark-100 mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-ops-dark-800">
                    <div>
                      <div className="font-medium text-ops-dark-200">Two-Factor Authentication</div>
                      <div className="text-sm text-ops-dark-500">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-ops-dark-700 text-ops-dark-200 text-sm font-medium hover:bg-ops-dark-800 transition-colors">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-ops-dark-800">
                    <div>
                      <div className="font-medium text-ops-dark-200">SSO Configuration</div>
                      <div className="text-sm text-ops-dark-500">
                        Configure SAML-based single sign-on
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-ops-dark-700 text-ops-dark-400">
                      Enterprise
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-ops-dark-200">Session Management</div>
                      <div className="text-sm text-ops-dark-500">
                        View and manage active sessions
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-ops-dark-700 text-ops-dark-200 text-sm font-medium hover:bg-ops-dark-800 transition-colors">
                      View Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Demo Notice */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-ops-accent-amber/10 border border-ops-accent-amber/20">
                <Sparkles className="w-5 h-5 text-ops-accent-amber flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-ops-accent-amber">
                    Demo Mode — Not Processing Payments
                  </span>
                  <p className="text-xs text-ops-dark-400 mt-0.5">
                    This billing page is a UI demonstration only. No real subscriptions or payments
                    are processed.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6">
                <h2 className="text-lg font-semibold text-ops-dark-100 mb-4">Current Plan</h2>
                <div className="flex items-center justify-between p-4 rounded-lg bg-ops-dark-800/50 border border-ops-dark-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ops-dark-100 text-lg capitalize">
                        {organization?.plan}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-ops-accent-green/20 text-ops-accent-green font-medium">
                        Active
                      </span>
                    </div>
                    <div className="text-sm text-ops-dark-400 mt-1">
                      {organization?.plan === 'enterprise'
                        ? 'Custom pricing'
                        : organization?.plan === 'professional'
                          ? '$99/month'
                          : 'Free'}
                    </div>
                  </div>
                  <Link
                    href="/pricing"
                    className="px-4 py-2 rounded-lg border border-ops-dark-700 text-ops-dark-200 text-sm font-medium hover:bg-ops-dark-800 transition-colors flex items-center gap-2"
                  >
                    Change Plan
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6">
                <h2 className="text-lg font-semibold text-ops-dark-100 mb-4">Payment Method</h2>
                <div className="p-4 rounded-lg bg-ops-dark-800/50 border border-dashed border-ops-dark-700 text-center">
                  <CreditCard className="w-8 h-8 text-ops-dark-500 mx-auto mb-2" />
                  <p className="text-sm text-ops-dark-400">No payment method on file</p>
                  <p className="text-xs text-ops-dark-500 mt-1">
                    Demo accounts don't require payment
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-ops-dark-900 border border-ops-dark-800 p-6">
                <h2 className="text-lg font-semibold text-ops-dark-100 mb-4">API Keys</h2>
                <p className="text-sm text-ops-dark-400 mb-4">
                  API keys allow you to integrate Decision Ops with your existing tools and
                  workflows.
                </p>
                <div className="p-4 rounded-lg bg-ops-dark-800/50 border border-dashed border-ops-dark-700 text-center">
                  <Key className="w-8 h-8 text-ops-dark-500 mx-auto mb-2" />
                  <p className="text-sm text-ops-dark-400">No API keys created yet</p>
                  <button className="mt-3 px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 text-sm font-medium hover:bg-ops-accent-green/90 transition-colors">
                    Generate API Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
