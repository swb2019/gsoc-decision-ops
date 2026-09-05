'use client';

import Link from 'next/link';
import { Shield, Github, Linkedin, ExternalLink } from 'lucide-react';

export function Footer(): JSX.Element {
  return (
    <footer className="bg-ops-dark-950 border-t border-ops-dark-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ops-accent-green to-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-ops-dark-50">Decision Ops Cloud</span>
            </div>
            <p className="text-sm text-ops-dark-400 max-w-md mb-4">
              A portfolio demonstration of structured decision-making methodology for corporate
              security operations. All scenarios are synthetic for training purposes.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/swb2019/gsoc-decision-ops"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ops-dark-400 hover:text-ops-dark-200 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/shannon-brown-72baa81"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ops-dark-400 hover:text-ops-dark-200 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-ops-dark-100 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-ops-dark-400 hover:text-ops-dark-200 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/signin"
                  className="text-sm text-ops-dark-400 hover:text-ops-dark-200 transition-colors"
                >
                  Demo Access
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/swb2019/gsoc-decision-ops"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ops-dark-400 hover:text-ops-dark-200 transition-colors inline-flex items-center gap-1"
                >
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-ops-dark-100 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/swb2019/gsoc-decision-ops#architecture"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ops-dark-400 hover:text-ops-dark-200 transition-colors inline-flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/swb2019/gsoc-decision-ops/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ops-dark-400 hover:text-ops-dark-200 transition-colors inline-flex items-center gap-1"
                >
                  Contributing
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/swb2019/gsoc-decision-ops/blob/main/SECURITY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ops-dark-400 hover:text-ops-dark-200 transition-colors inline-flex items-center gap-1"
                >
                  Security
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-ops-dark-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-ops-dark-500">
            © {new Date().getFullYear()} Shannon Brown. Portfolio demonstration project.
          </div>
          <div className="flex items-center gap-6 text-sm text-ops-dark-500">
            <span>MIT License</span>
            <span>•</span>
            <span>Training Data Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
