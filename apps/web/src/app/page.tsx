import Link from 'next/link';
import {
  Shield,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  Brain,
  Cpu,
  DoorOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { getAvailableScenarios } from '@gsoc-decision-ops/core';
import { clsx } from 'clsx';

type SecurityDomain = 'PHYSICAL' | 'INTELLIGENCE' | 'CYBER';

const DOMAIN_CONFIG: Record<
  SecurityDomain,
  {
    icon: typeof Shield;
    label: string;
    color: string;
    bgGradient: string;
  }
> = {
  PHYSICAL: {
    icon: DoorOpen,
    label: 'Physical',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-cyan-600/5',
  },
  INTELLIGENCE: {
    icon: Brain,
    label: 'Intel',
    color: 'text-violet-400',
    bgGradient: 'from-violet-500/20 to-violet-600/5',
  },
  CYBER: {
    icon: Cpu,
    label: 'Cyber',
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-orange-600/5',
  },
};

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();
  const fusedScenarios = scenarios.filter((s) => s.domains && s.domains.length > 0);
  const legacyScenarios = scenarios.filter((s) => !s.domains || s.domains.length === 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Subtle Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative border-b border-gray-800/50 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="font-bold text-gray-100 text-xl tracking-tight">Aegis Command</span>
              <div className="text-xs text-gray-500 mt-0.5">Fused GSOC Operations Training</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/40 border border-gray-700/50">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">60-min simulations</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              Physical • Intelligence • Cyber
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-100 mb-6 tracking-tight">
            First-Hour Decision
            <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Simulation
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Command a fused Global Security Operations Center. Navigate cross-domain threats
            spanning physical security, intelligence, and cybersecurity in real-time.
          </p>
        </div>

        {/* Posture Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          {[
            {
              posture: 'CONTINUE',
              color: 'emerald',
              description: 'Risk within tolerance. Proceed with enhanced monitoring.',
              icon: TrendingUp,
            },
            {
              posture: 'DEGRADE',
              color: 'amber',
              description: 'Reduce exposure via compensating controls.',
              icon: Target,
            },
            {
              posture: 'PAUSE',
              color: 'red',
              description: 'Halt affected operations. Eliminate exposure.',
              icon: AlertTriangle,
            },
          ].map(({ posture, color, description, icon: Icon }) => (
            <div
              key={posture}
              className={clsx(
                'p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02]',
                color === 'emerald' &&
                  'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
                color === 'amber' && 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
                color === 'red' && 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    color === 'emerald' && 'bg-emerald-500/15 text-emerald-400',
                    color === 'amber' && 'bg-amber-500/15 text-amber-400',
                    color === 'red' && 'bg-red-500/15 text-red-400'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={clsx(
                    'font-bold text-lg',
                    color === 'emerald' && 'text-emerald-400',
                    color === 'amber' && 'text-amber-400',
                    color === 'red' && 'text-red-400'
                  )}
                >
                  {posture}
                </span>
              </div>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          ))}
        </div>

        {/* Fused GSOC Scenarios */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-100 tracking-tight">
                Fused GSOC Scenarios
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Cross-domain incidents requiring integrated response
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">Live Simulation</span>
            </div>
          </div>

          <div className="space-y-4">
            {fusedScenarios.map((scenario) => (
              <Link key={scenario.id} href={`/scenarios/${scenario.id}`} className="group block">
                <div
                  className={clsx(
                    'relative p-6 rounded-2xl border transition-all duration-300',
                    'bg-gradient-to-br from-gray-800/40 to-gray-900/20',
                    'border-gray-700/50 hover:border-gray-600/80',
                    'hover:shadow-2xl hover:shadow-emerald-500/5',
                    'overflow-hidden'
                  )}
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex items-start gap-5">
                    {/* Severity Indicator */}
                    <div
                      className={clsx(
                        'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
                        scenario.severity === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-amber-500/15 text-amber-400'
                      )}
                    >
                      <AlertTriangle className="w-7 h-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title & Severity */}
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-colors">
                          {scenario.name}
                        </h3>
                        <span
                          className={clsx(
                            'px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded',
                            scenario.severity === 'CRITICAL'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-amber-500/15 text-amber-400'
                          )}
                        >
                          {scenario.severity}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {scenario.description}
                      </p>

                      {/* Domain Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        {scenario.domains?.map((domain) => {
                          const config = DOMAIN_CONFIG[domain];
                          const Icon = config.icon;
                          return (
                            <span
                              key={domain}
                              className={clsx(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                                `bg-gradient-to-r ${config.bgGradient}`,
                                config.color
                              )}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {config.label}
                            </span>
                          );
                        })}
                        <span className="text-xs text-gray-600 ml-2">{scenario.vendorType}</span>
                      </div>
                    </div>

                    {/* Enter Arrow */}
                    <div className="flex items-center gap-3 self-center">
                      <span className="hidden lg:inline text-sm font-medium text-gray-500 group-hover:text-emerald-400 transition-colors">
                        Enter Sim
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-gray-800/60 group-hover:bg-emerald-500/20 flex items-center justify-center transition-all duration-300">
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Legacy Scenarios */}
        {legacyScenarios.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-300 tracking-tight">
                  Additional Scenarios
                </h2>
                <p className="text-sm text-gray-600 mt-1">Single-domain training exercises</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {legacyScenarios.map((scenario) => (
                <Link key={scenario.id} href={`/scenarios/${scenario.id}`} className="group block">
                  <div
                    className={clsx(
                      'p-5 rounded-xl border transition-all duration-300',
                      'bg-gray-800/20 border-gray-800/60',
                      'hover:bg-gray-800/40 hover:border-gray-700/80'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          scenario.severity === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        )}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded font-bold uppercase',
                          scenario.severity === 'CRITICAL'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-amber-500/15 text-amber-400'
                        )}
                      >
                        {scenario.severity}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-200 mb-1 group-hover:text-white transition-colors">
                      {scenario.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{scenario.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-200 mb-6 text-center">How It Works</h3>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { step: '1', label: 'Receive intel briefing', color: 'emerald' },
              { step: '2', label: 'Live injects arrive', color: 'amber' },
              { step: '3', label: 'Make posture calls', color: 'cyan' },
              { step: '4', label: 'Debrief & export AAR', color: 'violet' },
            ].map(({ step, label, color }) => (
              <div key={step} className="text-center">
                <div
                  className={clsx(
                    'w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-bold',
                    color === 'emerald' && 'bg-emerald-500/15 text-emerald-400',
                    color === 'amber' && 'bg-amber-500/15 text-amber-400',
                    color === 'cyan' && 'bg-cyan-500/15 text-cyan-400',
                    color === 'violet' && 'bg-violet-500/15 text-violet-400'
                  )}
                >
                  {step}
                </div>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t border-gray-800/30">
          <p className="text-xs text-gray-600">Training Simulation • Built on ESRM Principles</p>
        </footer>
      </main>
    </div>
  );
}
