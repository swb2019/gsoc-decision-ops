'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, User, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SignUpPage(): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !name) return;

    setIsLoading(true);
    await signIn(email);
    router.push('/app');
  };

  return (
    <div className="min-h-screen bg-ops-dark-950 flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ops-accent-green to-emerald-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-semibold text-ops-dark-50 text-lg">Decision Ops</span>
              <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-ops-accent-green/20 text-ops-accent-green font-medium">
                Cloud
              </span>
            </div>
          </Link>

          {/* Demo Mode Banner */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-ops-accent-amber/10 border border-ops-accent-amber/20 mb-6">
            <Sparkles className="w-5 h-5 text-ops-accent-amber flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-ops-accent-amber">Demo Mode</span>
              <p className="text-xs text-ops-dark-400 mt-0.5">
                This creates a demo account. No real data is stored.
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-ops-dark-50 mb-2">Create your account</h1>
          <p className="text-ops-dark-400 mb-8">
            Start your free trial with demo training scenarios.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ops-dark-200 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ops-dark-500" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Chen"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 placeholder-ops-dark-500 focus:outline-none focus:border-ops-accent-green focus:ring-1 focus:ring-ops-accent-green"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ops-dark-200 mb-1.5">
                Work email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ops-dark-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 placeholder-ops-dark-500 focus:outline-none focus:border-ops-accent-green focus:ring-1 focus:ring-ops-accent-green"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="organization"
                className="block text-sm font-medium text-ops-dark-200 mb-1.5"
              >
                Organization <span className="text-ops-dark-500">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ops-dark-500" />
                <input
                  id="organization"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 placeholder-ops-dark-500 focus:outline-none focus:border-ops-accent-green focus:ring-1 focus:ring-ops-accent-green"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !name}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-ops-accent-green text-ops-dark-950 font-semibold hover:bg-ops-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-ops-dark-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Demo Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ops-dark-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-ops-accent-green hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-8 text-xs text-ops-dark-600 text-center">
            By signing up, you acknowledge this is a portfolio demonstration with synthetic training
            data only.
          </p>
        </div>
      </div>

      {/* Right Panel - Features */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-ops-dark-900 to-ops-dark-950 border-l border-ops-dark-800 p-12">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-ops-dark-100 mb-6">
            What you get with your trial
          </h2>
          <ul className="space-y-4">
            {[
              'Full access to demo workspaces',
              'Synthetic vendor compromise scenarios',
              'First-hour response playbooks',
              'Decision logging with audit trail',
              'After-action report generation',
              'Team collaboration features',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-ops-dark-300">
                <div className="w-5 h-5 rounded-full bg-ops-accent-green/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-ops-accent-green" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
