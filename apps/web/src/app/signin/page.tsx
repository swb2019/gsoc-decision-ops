'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SignInPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicLinkSent, setShowMagicLinkSent] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    await signIn(email);
    setShowMagicLinkSent(true);

    setTimeout(() => {
      router.push('/app');
    }, 1500);
  };

  const handleDemoAccess = async (): Promise<void> => {
    setIsLoading(true);
    await signIn('demo@gsoc-decision-ops.example');
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
                This is a portfolio demonstration. No real accounts or data.
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-ops-dark-50 mb-2">Sign in to Decision Ops</h1>
          <p className="text-ops-dark-400 mb-8">
            Enter your email for demo access, or use instant demo mode.
          </p>

          {showMagicLinkSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ops-accent-green/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-ops-accent-green" />
              </div>
              <h2 className="text-xl font-semibold text-ops-dark-100 mb-2">Demo Access Granted</h2>
              <p className="text-ops-dark-400 mb-4">Redirecting you to the application...</p>
              <div className="flex justify-center">
                <div className="w-6 h-6 border-2 border-ops-accent-green border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ops-dark-200 mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ops-dark-500" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-ops-dark-800 border border-ops-dark-700 text-ops-dark-100 placeholder-ops-dark-500 focus:outline-none focus:border-ops-accent-green focus:ring-1 focus:ring-ops-accent-green"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-ops-accent-green text-ops-dark-950 font-semibold hover:bg-ops-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-ops-dark-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue with Email
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-ops-dark-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-ops-dark-950 text-sm text-ops-dark-500">or</span>
                </div>
              </div>

              <button
                onClick={handleDemoAccess}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-ops-dark-700 text-ops-dark-200 font-medium hover:bg-ops-dark-800 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-ops-accent-amber" />
                Instant Demo Access
              </button>

              <p className="mt-6 text-center text-sm text-ops-dark-500">
                Don't have an account?{' '}
                <Link href="/signup" className="text-ops-accent-green hover:underline">
                  Sign up for demo
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-ops-dark-900 to-ops-dark-950 border-l border-ops-dark-800 p-12">
        <div className="max-w-lg">
          <blockquote className="text-xl text-ops-dark-200 italic mb-6">
            "In the first hour of a vendor incident, the decisions you make—and how you document
            them—determine whether your response is defensible or chaotic."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ops-accent-blue to-indigo-600 flex items-center justify-center text-white font-medium">
              SB
            </div>
            <div>
              <div className="text-sm font-medium text-ops-dark-100">Shannon Brown</div>
              <div className="text-xs text-ops-dark-500">
                GSOC Manager • Harvard ALM/ALB • CompTIA CySA+
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
