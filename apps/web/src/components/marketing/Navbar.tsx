'use client';

import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ops-dark-950/80 backdrop-blur-lg border-b border-ops-dark-800">
      <nav className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ops-accent-green to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-ops-dark-50">Decision Ops</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-ops-accent-green/20 text-ops-accent-green font-medium">
              Cloud
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-sm text-ops-dark-300 hover:text-ops-dark-100 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-ops-dark-300 hover:text-ops-dark-100 transition-colors"
            >
              Pricing
            </Link>
            <a
              href="https://github.com/swb2019/gsoc-decision-ops"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-ops-dark-300 hover:text-ops-dark-100 transition-colors"
            >
              GitHub
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/signin"
              className="text-sm text-ops-dark-200 hover:text-ops-dark-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signin"
              className="text-sm px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 font-medium hover:bg-ops-accent-green/90 transition-colors"
            >
              Try Demo
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-ops-dark-300 hover:bg-ops-dark-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-ops-dark-800">
            <div className="flex flex-col gap-4">
              <Link
                href="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-ops-dark-300 hover:text-ops-dark-100 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-ops-dark-300 hover:text-ops-dark-100 transition-colors"
              >
                Pricing
              </Link>
              <a
                href="https://github.com/swb2019/gsoc-decision-ops"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ops-dark-300 hover:text-ops-dark-100 transition-colors"
              >
                GitHub
              </a>
              <hr className="border-ops-dark-800" />
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-ops-dark-200 hover:text-ops-dark-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm px-4 py-2 rounded-lg bg-ops-accent-green text-ops-dark-950 font-medium text-center"
              >
                Try Demo
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
