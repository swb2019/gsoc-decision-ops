'use client';

import { Shield, FileText, Users, Clock, CheckCircle, BarChart3, Lock } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Structured Decision Logs',
    description:
      'Capture decisions with explicit postures (CONTINUE/DEGRADE/PAUSE), rationale, and audit trail. No more scattered Slack threads.',
    color: 'text-ops-accent-green',
    bgColor: 'bg-ops-accent-green/10',
  },
  {
    icon: FileText,
    title: 'Facts vs. Assumptions',
    description:
      'Explicitly separate verified facts from working assumptions. Document risk-if-wrong for each assumption to surface hidden vulnerabilities.',
    color: 'text-ops-accent-blue',
    bgColor: 'bg-ops-accent-blue/10',
  },
  {
    icon: Clock,
    title: 'First-Hour Playbooks',
    description:
      'Guided 60-minute response framework with phase-by-phase checklists. Vendor compromise playbook included out of the box.',
    color: 'text-ops-accent-amber',
    bgColor: 'bg-ops-accent-amber/10',
  },
  {
    icon: Users,
    title: 'Multi-Workspace Teams',
    description:
      'Organize by region, function, or incident type. Role-based access for managers, supervisors, analysts, and viewers.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    icon: BarChart3,
    title: 'After-Action Reports',
    description:
      'Auto-generate comprehensive after-action reports. Export to Markdown or JSON for compliance and lessons-learned reviews.',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
  },
  {
    icon: Lock,
    title: 'Training Mode',
    description:
      'Synthetic scenarios clearly marked as training exercises. Practice structured decision-making without production risk.',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
];

export function Features(): JSX.Element {
  return (
    <section className="py-24 bg-ops-dark-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ops-dark-50 mb-4">
            Built for Security Operations Leaders
          </h2>
          <p className="text-lg text-ops-dark-400 max-w-2xl mx-auto">
            Everything you need to run structured incident response training and maintain decision
            quality under pressure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-ops-dark-800/50 border border-ops-dark-700 hover:border-ops-dark-600 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-ops-dark-100 mb-2">{feature.title}</h3>
              <p className="text-ops-dark-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks(): JSX.Element {
  const steps = [
    {
      number: '01',
      title: 'Select Scenario',
      description: 'Choose from synthetic training scenarios or create a new incident workspace.',
    },
    {
      number: '02',
      title: 'Document Facts',
      description:
        'Record verified facts with sources and confidence levels as information arrives.',
    },
    {
      number: '03',
      title: 'Track Assumptions',
      description: 'Explicitly capture assumptions with basis and risk-if-wrong documentation.',
    },
    {
      number: '04',
      title: 'Make Decisions',
      description: 'Record posture decisions (CONTINUE/DEGRADE/PAUSE) with rationale and owner.',
    },
    {
      number: '05',
      title: 'Execute Playbook',
      description: 'Follow phase-by-phase checklists with objectives, questions, and tasks.',
    },
    {
      number: '06',
      title: 'Export & Review',
      description: 'Generate after-action reports for compliance and lessons-learned sessions.',
    },
  ];

  return (
    <section className="py-24 bg-ops-dark-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ops-dark-50 mb-4">How It Works</h2>
          <p className="text-lg text-ops-dark-400 max-w-2xl mx-auto">
            A structured workflow designed for the chaos of first-hour incident response.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-ops-dark-800 border border-ops-dark-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-ops-accent-green">{step.number}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ops-dark-100 mb-1">{step.title}</h3>
                  <p className="text-sm text-ops-dark-400">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && index % 3 !== 2 && (
                <div className="hidden lg:block absolute top-6 left-[52px] w-[calc(100%-52px)] border-t border-dashed border-ops-dark-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComparisonSection(): JSX.Element {
  const comparisons = [
    {
      feature: 'Decision Audit Trail',
      adhoc: 'Scattered across channels',
      ours: 'Centralized, timestamped log',
    },
    {
      feature: 'Facts vs. Assumptions',
      adhoc: 'Often conflated',
      ours: 'Explicitly separated with risk docs',
    },
    {
      feature: 'Posture Clarity',
      adhoc: 'Implicit, verbal',
      ours: 'CONTINUE/DEGRADE/PAUSE with rationale',
    },
    {
      feature: 'Handoff Quality',
      adhoc: 'Dependent on individuals',
      ours: 'Structured log with timeline',
    },
    {
      feature: 'After-Action Review',
      adhoc: 'Manual reconstruction',
      ours: 'Auto-generated reports',
    },
    { feature: 'Training Consistency', adhoc: 'Variable', ours: 'Repeatable synthetic scenarios' },
  ];

  return (
    <section className="py-24 bg-ops-dark-900">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ops-dark-50 mb-4">
            Structured vs. Ad-Hoc Response
          </h2>
          <p className="text-lg text-ops-dark-400">
            See how Decision Ops Cloud compares to Slack/Excel-based incident management.
          </p>
        </div>

        <div className="rounded-xl border border-ops-dark-700 overflow-hidden">
          <div className="grid grid-cols-3 bg-ops-dark-800">
            <div className="p-4 text-sm font-semibold text-ops-dark-100">Aspect</div>
            <div className="p-4 text-sm font-semibold text-ops-dark-400 text-center">Ad-Hoc</div>
            <div className="p-4 text-sm font-semibold text-ops-accent-green text-center">
              Decision Ops
            </div>
          </div>
          {comparisons.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-ops-dark-900' : 'bg-ops-dark-800/50'}`}
            >
              <div className="p-4 text-sm text-ops-dark-200">{row.feature}</div>
              <div className="p-4 text-sm text-ops-dark-500 text-center">{row.adhoc}</div>
              <div className="p-4 text-sm text-ops-dark-200 text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-ops-accent-green flex-shrink-0" />
                {row.ours}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
