'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Check, Clock, Hourglass, Lock, RotateCcw } from 'lucide-react';
import { getAvailableScenarios, getCampaignArcs } from '@gsoc-decision-ops/core';
import { getUnlockedArcs, getCompletedArcs, resetCampaignProgress } from '../lib/campaign';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const levelNames = { ROOKIE: 'Rookie', OPERATOR: 'Operator', DIRECTOR: 'Director' };

export default function HomePage(): JSX.Element {
  const scenarios = getAvailableScenarios();
  const arcs = getCampaignArcs();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(['arc-1-foundations']));
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUnlocked(getUnlockedArcs());
    setCompleted(getCompletedArcs());
  }, []);

  const completedCount = arcs.filter((arc) => completed.has(arc.arcId)).length;
  const progress = arcs.length ? Math.round((completedCount / arcs.length) * 100) : 0;
  const nextArc =
    arcs.find((arc) => unlocked.has(arc.arcId) && !completed.has(arc.arcId)) || arcs[0];
  const nextScenario = scenarios.find((scenario) => scenario.campaign?.arcId === nextArc?.arcId);
  const fusedScenarios = scenarios.filter((scenario) => scenario.domains?.length);
  const standaloneScenarios = scenarios.filter((scenario) => !scenario.domains?.length);

  const resetProgress = (): void => {
    if (
      !window.confirm('Reset campaign progress on this device? Completed chapters will be cleared.')
    )
      return;
    resetCampaignProgress();
    setUnlocked(new Set(['arc-1-foundations']));
    setCompleted(new Set());
  };

  return (
    <div className="hc-home">
      <a className="hc-skip" href="#missions">
        Skip to missions
      </a>
      <header className="hc-header">
        <Link className="hc-brand" href="/" aria-label="Hourglass Command home">
          <span className="hc-symbol">
            <Hourglass size={23} strokeWidth={1.25} aria-hidden="true" />
          </span>
          <span>
            Hourglass <strong>Command</strong>
            <small>DECISION TRAINING</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#missions">Campaign</a>
          <a href="#free-play">Free play</a>
          <a
            href="https://github.com/swb2019/gsoc-decision-ops"
            aria-label="View Hourglass Command source on GitHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main>
        <section className="hc-launch" aria-labelledby="launch-title">
          <div className="hc-launch-intro">
            <p className="hc-kicker">PHYSICAL · INTELLIGENCE · CYBER</p>
            <h1 id="launch-title">
              The first hour.
              <br />
              <em>Every decision counts.</em>
            </h1>
            <p className="hc-launch-description">
              Read converging signals. Make a defensible call. Practice the judgment that turns
              incomplete information into a clear operating posture.
            </p>
            <div className="hc-launch-meta">
              <span>
                <Clock size={15} aria-hidden="true" /> 60-minute scenarios
              </span>
              <span>{arcs.length} campaign chapters</span>
              <span>By Shannon Brown</span>
            </div>
          </div>
          <div className="hc-next-mission">
            <img
              className="hc-launch-art"
              src={`${basePath}/brand/hourglass-banner.webp`}
              alt=""
              width="1983"
              height="793"
              aria-hidden="true"
            />
            <div className="hc-mission-overlay">
              <div className="hc-mission-top">
                <span>
                  {completedCount === arcs.length
                    ? 'CAMPAIGN COMPLETE · REPLAY'
                    : 'YOUR NEXT CHAPTER'}
                </span>
                <span>
                  {String(nextArc?.campaignOrder || 1).padStart(2, '0')} /{' '}
                  {String(arcs.length).padStart(2, '0')}
                </span>
              </div>
              <div>
                <h2>{nextArc?.arcTitle || 'Choose a scenario'}</h2>
                <p>{nextArc?.arcBrief || 'Explore the available training scenarios below.'}</p>
              </div>
              {nextScenario ? (
                <Link className="hc-button" href={`/scenarios/${nextScenario.id}`}>
                  {completed.has(nextArc.arcId) ? 'Replay chapter' : 'Enter the simulation'}
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              ) : (
                <a className="hc-button" href="#free-play">
                  Explore scenarios <ArrowRight size={18} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </section>
        <section className="hc-postures" aria-label="Operating postures">
          <div>
            <span className="hc-posture-label hc-continue">CONTINUE</span>
            <p>Proceed with enhanced monitoring.</p>
          </div>
          <div>
            <span className="hc-posture-label hc-degrade">DEGRADE</span>
            <p>Reduce exposure with compensating controls.</p>
          </div>
          <div>
            <span className="hc-posture-label hc-pause">PAUSE</span>
            <p>Halt affected operations.</p>
          </div>
        </section>
        <section className="hc-section" id="missions" aria-labelledby="campaign-title">
          <div className="hc-section-top">
            <div>
              <p className="hc-kicker">01 / THE CAMPAIGN</p>
              <h2 id="campaign-title">
                Build your <em>decision craft.</em>
              </h2>
              <p>Complete each chapter to unlock the next.</p>
            </div>
            <button
              className="hc-reset"
              onClick={resetProgress}
              aria-label="Reset campaign progress"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset progress
            </button>
          </div>
          <div className="hc-progress">
            <div>
              <span>Campaign progress</span>
              <strong>
                {completedCount} of {arcs.length} chapters
              </strong>
            </div>
            <progress
              value={completedCount}
              max={arcs.length || 1}
              aria-label={`Campaign ${progress}% complete`}
            />
          </div>
          <div className="hc-chapters">
            {arcs.map((arc) => {
              const scenario = scenarios.find((item) => item.campaign?.arcId === arc.arcId);
              const isUnlocked = unlocked.has(arc.arcId) && Boolean(scenario);
              const isCompleted = completed.has(arc.arcId);
              const next = arc.arcId === nextArc?.arcId && !isCompleted;
              const card = (
                <>
                  <div className="hc-chapter-top">
                    <span className="hc-chapter-number">
                      {String(arc.campaignOrder).padStart(2, '0')}
                    </span>
                    <span
                      className={`hc-chapter-state ${isCompleted ? 'completed' : next ? 'next' : ''}`}
                    >
                      {isCompleted ? (
                        <>
                          <Check size={14} aria-hidden="true" />
                          Completed
                        </>
                      ) : isUnlocked ? (
                        next ? (
                          'Up next'
                        ) : (
                          'Available'
                        )
                      ) : (
                        <>
                          <Lock size={13} aria-hidden="true" />
                          Locked
                        </>
                      )}
                    </span>
                  </div>
                  <h3>{arc.arcTitle}</h3>
                  <p>{arc.arcBrief}</p>
                  <div className="hc-chapter-bottom">
                    <span>
                      {levelNames[arc.recommendedLevel]}
                      <span className="hc-difficulty">Difficulty {arc.difficulty}/5</span>
                    </span>
                    {isUnlocked ? (
                      <ArrowUpRight size={23} aria-hidden="true" />
                    ) : (
                      <Lock size={18} aria-hidden="true" />
                    )}
                  </div>
                  {!isUnlocked && (
                    <p className="hc-prerequisite">
                      Complete{' '}
                      {arc.unlockRequirements
                        .map(
                          (id) =>
                            arcs.find((item) => item.arcId === id)?.arcTitle.split(':')[0] || id
                        )
                        .join(', ')}{' '}
                      to unlock.
                    </p>
                  )}
                </>
              );
              return isUnlocked && scenario ? (
                <Link
                  key={arc.arcId}
                  href={`/scenarios/${scenario.id}`}
                  className={`hc-chapter ${next ? 'is-next' : ''} ${isCompleted ? 'is-complete' : ''}`}
                >
                  {card}
                </Link>
              ) : (
                <article
                  key={arc.arcId}
                  className="hc-chapter is-locked"
                  aria-label={`${arc.arcTitle}, locked`}
                >
                  {card}
                </article>
              );
            })}
          </div>
        </section>
        <section className="hc-section hc-freeplay" id="free-play" aria-labelledby="freeplay-title">
          <div className="hc-section-top">
            <div>
              <p className="hc-kicker">02 / FREE PLAY</p>
              <h2 id="freeplay-title">
                Choose your <em>pressure test.</em>
              </h2>
              <p>Every scenario is available here. No campaign unlock required.</p>
            </div>
            <span className="hc-count">{scenarios.length} SCENARIOS</span>
          </div>
          <div className="hc-scenarios">
            {[...fusedScenarios, ...standaloneScenarios].map((scenario, index) => (
              <Link href={`/scenarios/${scenario.id}`} className="hc-scenario" key={scenario.id}>
                <span className="hc-scenario-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="hc-scenario-copy">
                  <div className="hc-scenario-title">
                    <h3>{scenario.name}</h3>
                    <span
                      className={`hc-severity ${scenario.severity === 'CRITICAL' ? 'critical' : ''}`}
                    >
                      {scenario.severity}
                    </span>
                  </div>
                  <p>{scenario.description}</p>
                  <div className="hc-domains">
                    {scenario.domains?.length ? (
                      scenario.domains.map((domain) => <span key={domain}>{domain}</span>)
                    ) : (
                      <span>FOCUSED SCENARIO</span>
                    )}
                    <span className="hc-vendor">{scenario.vendorType}</span>
                  </div>
                </div>
                <ArrowUpRight className="hc-scenario-arrow" size={23} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
        <section className="hc-method" aria-label="Training approach">
          <p className="hc-kicker">THE PRACTICE</p>
          <div>
            <h2>
              Separate facts.
              <br />
              Surface assumptions.
              <br />
              <em>Own the decision.</em>
            </h2>
            <p>
              Work with timed signals, explicit posture calls, and a documented decision trail.
              Finish with an after-action review you can examine and export.
              <br />
              <br />
              <span>
                Hourglass Command is a training simulation, not a live incident-management system.
              </span>
            </p>
          </div>
        </section>
      </main>
      <footer className="hc-footer">
        <Link className="hc-footer-brand" href="/">
          Hourglass Command
        </Link>
        <p>Operational judgment, made tangible.</p>
        <a
          href="https://swb2019.github.io/shannon-brown-career/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Shannon Brown <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
