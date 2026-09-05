import Link from 'next/link';
import { Check, Sparkles, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';
import { PRICING_PLANS } from '@/lib/demo-data';

export default function PricingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-ops-dark-950">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Demo Notice */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-ops-accent-amber/10 border border-ops-accent-amber/20">
              <Sparkles className="w-5 h-5 text-ops-accent-amber flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-ops-accent-amber">
                  Portfolio Demo Pricing
                </span>
                <p className="text-xs text-ops-dark-400 mt-0.5">
                  This pricing page is a UI demonstration only. No real subscriptions or payments
                  are processed. All features are available in demo mode.
                </p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-ops-dark-50 mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-ops-dark-400 max-w-2xl mx-auto">
              Choose the plan that fits your security operations team. All plans include synthetic
              training scenarios and after-action reporting.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${
                  plan.highlighted
                    ? 'border-ops-accent-green bg-gradient-to-b from-ops-accent-green/10 to-transparent'
                    : 'border-ops-dark-700 bg-ops-dark-900/50'
                } p-8`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-ops-accent-green text-ops-dark-950 text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-ops-dark-100 mb-2">{plan.name}</h3>
                  <p className="text-sm text-ops-dark-400">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-ops-dark-50">${plan.price}</span>
                      <span className="text-ops-dark-400">/month</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-ops-dark-50">Custom</div>
                  )}
                </div>

                <Link
                  href="/signin"
                  className={`block w-full text-center px-4 py-3 rounded-lg font-semibold transition-colors mb-8 ${
                    plan.highlighted
                      ? 'bg-ops-accent-green text-ops-dark-950 hover:bg-ops-accent-green/90'
                      : 'border border-ops-dark-700 text-ops-dark-200 hover:bg-ops-dark-800'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-5 h-5 text-ops-accent-green flex-shrink-0" />
                      <span className="text-ops-dark-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Demo Disclaimer */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="flex items-start gap-3 px-6 py-4 rounded-xl bg-ops-dark-800/50 border border-ops-dark-700">
              <AlertTriangle className="w-5 h-5 text-ops-dark-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-ops-dark-200 mb-1">
                  Demo Mode — Not Processing Payments
                </h4>
                <p className="text-sm text-ops-dark-400">
                  This is a portfolio demonstration of SaaS pricing UI patterns. No real billing,
                  subscriptions, or payment processing occurs. All plan features are available in
                  the demo environment.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-ops-dark-100 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Is this a real SaaS product?',
                  a: 'This is a portfolio demonstration showcasing SaaS product design and development skills. All data is synthetic and for training/educational purposes only.',
                },
                {
                  q: 'Can I use the training scenarios?',
                  a: 'Yes! The demo mode provides full access to synthetic vendor compromise scenarios. These are fictional scenarios designed for educational training.',
                },
                {
                  q: 'What technology stack is used?',
                  a: 'Decision Ops Cloud is built with Next.js 14, TypeScript, Tailwind CSS, and follows modern React patterns. The source code is available on GitHub.',
                },
                {
                  q: 'Who built this?',
                  a: 'This project was created by Shannon Brown, a GSOC Manager with Harvard ALM/ALB education and CompTIA CySA+/Security+ certifications.',
                },
              ].map((faq) => (
                <div key={faq.q} className="pb-6 border-b border-ops-dark-800 last:border-0">
                  <h3 className="text-lg font-semibold text-ops-dark-100 mb-2">{faq.q}</h3>
                  <p className="text-ops-dark-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
