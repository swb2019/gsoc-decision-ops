'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown } from 'lucide-react';
import {
  GLASSHOUSE_CONTROLS,
  type GlasshousePlan as Plan,
  type GlasshouseObservation as Observation,
  type GlasshouseDecision as Decision,
  type GlasshouseAssetId as AssetId,
  type GlasshouseTreatment as Treatment,
} from '@gsoc-decision-ops/core';

export const assetLabels: Record<AssetId, string> = {
  entrance: 'Service entrance',
  connector: 'Identity connector',
  dispatch: 'Dispatch operation',
};
export const actorLabels = {
  commander: 'Watch commander',
  analyst: 'Duty analyst',
  cyber: 'Cyber lead',
  owner: 'Business owner',
};
export const clockLabel = (tick: number) =>
  `${String(6 + Math.floor((10 + tick) / 60)).padStart(2, '0')}:${String((10 + tick) % 60).padStart(2, '0')}`;
export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
export const emptyPlan = (): Plan => ({
  control: 'verify-entrance',
  scope: 'entrance',
  posture: 'CONTINUE',
  treatments: ['MITIGATE'],
  authority: 'delegated',
  evidenceIds: [],
  rationale: '',
  assumption: '',
  hypothesis: '',
  likelihood: 'unknown',
  confidence: 'low',
  alternative: '',
  reviewTrigger: '',
  uncertainty: 'unverified',
  notify: false,
});
function planFromDecision(decision: Decision): Plan {
  const {
    control,
    scope,
    posture,
    treatments,
    authority,
    evidenceIds,
    rationale,
    assumption,
    hypothesis,
    likelihood,
    confidence,
    alternative,
    reviewTrigger,
    uncertainty,
    notify,
  } = decision;
  return {
    control,
    scope,
    posture,
    treatments: [...treatments],
    authority,
    evidenceIds: [...evidenceIds],
    rationale,
    assumption,
    hypothesis,
    likelihood,
    confidence,
    alternative,
    reviewTrigger,
    uncertainty,
    notify,
  };
}

export interface ComposerDraft {
  plan: Plan;
  expanded: boolean;
}

export default function PlanComposer({
  observations,
  onCommit,
  revision,
  onCancelRevision,
  disabled,
  initialDraft,
  onDraftChange,
}: {
  observations: Observation[];
  onCommit: (plan: Plan, revisionOf?: string) => boolean;
  revision?: Decision;
  onCancelRevision: () => void;
  disabled: boolean;
  initialDraft?: ComposerDraft;
  onDraftChange?: (draft: ComposerDraft) => void;
}) {
  const [plan, setPlan] = useState<Plan>(() =>
    initialDraft
      ? structuredClone(initialDraft.plan)
      : revision
        ? planFromDecision(revision)
        : emptyPlan()
  );
  const [committed, setCommitted] = useState(false);
  const [details, setDetails] = useState(initialDraft?.expanded ?? Boolean(revision));
  const selected = GLASSHOUSE_CONTROLS.find((control) => control.id === plan.control)!;
  const changePlan = (next: Plan) => {
    setCommitted(false);
    setPlan(next);
    onDraftChange?.({ plan: next, expanded: details });
  };
  const update = <K extends keyof Plan>(key: K, value: Plan[K]) =>
    changePlan({ ...plan, [key]: value });
  const toggleTreatment = (treatment: Treatment) =>
    update(
      'treatments',
      plan.treatments.includes(treatment)
        ? plan.treatments.filter((value) => value !== treatment)
        : [...plan.treatments, treatment]
    );
  return (
    <section className="gh-panel gh-composer" aria-labelledby="plan-title">
      <div className="gh-panel-heading">
        <div>
          <span className="gh-eyebrow">02 / Decide & coordinate</span>
          <h2 id="plan-title">{revision ? 'Revise your plan' : 'Make a bounded plan'}</h2>
        </div>
        <span className="gh-step-number">02</span>
      </div>
      {revision && (
        <div className="gh-notice">
          Appending a revision to the {clockLabel(revision.at)} decision. Its original evidence and
          rationale remain in the journal.
          <button className="gh-text-button" onClick={onCancelRevision}>
            Cancel revision
          </button>
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (onCommit(plan, revision?.id)) {
            setPlan(emptyPlan());
            setDetails(false);
            setCommitted(true);
          }
        }}
      >
        <label className="gh-field">
          Control
          <select
            value={plan.control}
            disabled={disabled}
            onChange={(event) => {
              const control = GLASSHOUSE_CONTROLS.find((item) => item.id === event.target.value)!;
              changePlan({
                ...plan,
                control: control.id,
                scope: control.scope,
                authority: control.needsApproval ? 'approval' : 'delegated',
              });
            }}
          >
            {GLASSHOUSE_CONTROLS.map((control) => (
              <option key={control.id} value={control.id}>
                {control.label}
              </option>
            ))}
          </select>
        </label>
        <div className="gh-control-description">
          <p>{selected.description}</p>
          <div className="gh-inline-meta">
            <span>{actorLabels[selected.owner]}</span>
            <span>Lead time {selected.leadTime} min</span>
            <span>{money(selected.costCents)}</span>
          </div>
          <dl>
            <div>
              <dt>Service impact</dt>
              <dd>{selected.impact}</dd>
            </div>
            <div>
              <dt>Reversal</dt>
              <dd>{selected.reversal}</dd>
            </div>
            <div>
              <dt>Resources</dt>
              <dd>
                {selected.resources.length
                  ? selected.resources.join(', ').replaceAll('-', ' ')
                  : 'No exclusive assignment'}
              </dd>
            </div>
          </dl>
        </div>
        <div className="gh-form-grid">
          <label className="gh-field">
            Scope
            <select
              value={plan.scope}
              onChange={(event) => update('scope', event.target.value as AssetId)}
            >
              {Object.entries(assetLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="gh-field">
            Service posture
            <select
              value={plan.posture}
              onChange={(event) => update('posture', event.target.value as Plan['posture'])}
            >
              <option value="CONTINUE">CONTINUE</option>
              <option value="DEGRADE">DEGRADE</option>
              <option value="PAUSE">PAUSE</option>
            </select>
          </label>
        </div>
        <fieldset className="gh-treatment">
          <legend>
            Risk treatment <span>Choose one or more</span>
          </legend>
          <div>
            {(['MITIGATE', 'ACCEPT', 'TRANSFER', 'AVOID'] as Treatment[]).map((treatment) => (
              <label
                key={treatment}
                className={plan.treatments.includes(treatment) ? 'is-selected' : ''}
              >
                <input
                  type="checkbox"
                  checked={plan.treatments.includes(treatment)}
                  onChange={() => toggleTreatment(treatment)}
                />
                <span>{treatment}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="gh-field">
          Authority
          <select
            value={plan.authority}
            onChange={(event) => update('authority', event.target.value as Plan['authority'])}
          >
            <option value="delegated">Execute within delegation</option>
            <option value="approval">Request business-owner approval</option>
            <option value="recommendation">Recommendation only</option>
            <option value="emergency">Declared emergency exception</option>
          </select>
        </label>
        <p className="gh-helper">
          {selected.needsApproval
            ? 'This control needs approval. A receipt or notification does not authorize execution.'
            : 'The scenario permits a bounded delegated action, subject to available resources.'}
        </p>
        <button
          type="button"
          className="gh-expand"
          aria-expanded={details}
          onClick={() => {
            setDetails(!details);
            onDraftChange?.({ plan, expanded: !details });
          }}
        >
          Evidence, reasoning & safeguards <span>Optional</span>
          <ChevronDown size={16} className={details ? 'is-rotated' : ''} />
        </button>
        {details && (
          <div className="gh-expanded-fields">
            <fieldset className="gh-evidence-choice">
              <legend>Evidence available now</legend>
              {observations.length ? (
                observations.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={plan.evidenceIds.includes(item.id)}
                      onChange={() =>
                        update(
                          'evidenceIds',
                          plan.evidenceIds.includes(item.id)
                            ? plan.evidenceIds.filter((id) => id !== item.id)
                            : [...plan.evidenceIds, item.id]
                        )
                      }
                    />
                    <span>
                      <b>
                        {item.source} · {clockLabel(item.receivedAt)}
                      </b>
                      {item.claim}
                    </span>
                  </label>
                ))
              ) : (
                <p>No observation has arrived.</p>
              )}
            </fieldset>
            <label className="gh-field">
              Rationale
              <textarea
                aria-label="Rationale"
                aria-describedby="gh-rationale-limit"
                value={plan.rationale}
                maxLength={2000}
                rows={3}
                onChange={(event) => update('rationale', event.target.value)}
                placeholder="Why this control, given what you know?"
              />
              <span className="gh-count" id="gh-rationale-limit">
                {plan.rationale.length}/2,000 characters
              </span>
            </label>
            <label className="gh-field">
              Working hypothesis
              <input
                value={plan.hypothesis}
                maxLength={1000}
                onChange={(event) => update('hypothesis', event.target.value)}
                placeholder="What might explain the reports?"
              />
            </label>
            <div className="gh-form-grid">
              <label className="gh-field">
                Event likelihood
                <select
                  value={plan.likelihood}
                  onChange={(event) =>
                    update('likelihood', event.target.value as Plan['likelihood'])
                  }
                >
                  <option value="unknown">Unknown</option>
                  <option value="unlikely">Unlikely</option>
                  <option value="plausible">Plausible</option>
                  <option value="likely">Likely</option>
                </select>
              </label>
              <label className="gh-field">
                Assessment confidence
                <select
                  value={plan.confidence}
                  onChange={(event) =>
                    update('confidence', event.target.value as Plan['confidence'])
                  }
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <label className="gh-field">
              Uncertainty
              <select
                value={plan.uncertainty}
                onChange={(event) =>
                  update('uncertainty', event.target.value as Plan['uncertainty'])
                }
              >
                <option value="unverified">Unverified</option>
                <option value="conflicting">Conflicting reports</option>
                <option value="bounded">Bounded by evidence</option>
              </select>
            </label>
            <label className="gh-field">
              Assumption
              <input
                value={plan.assumption}
                maxLength={1000}
                onChange={(event) => update('assumption', event.target.value)}
                placeholder="What are you relying on that is not confirmed?"
              />
            </label>
            <label className="gh-field">
              Viable alternative
              <input
                value={plan.alternative}
                maxLength={1000}
                onChange={(event) => update('alternative', event.target.value)}
                placeholder="Another approach you could defend"
              />
            </label>
            <label className="gh-field">
              Review trigger
              <input
                value={plan.reviewTrigger}
                maxLength={1000}
                onChange={(event) => update('reviewTrigger', event.target.value)}
                placeholder="When or under what condition will you revisit this?"
              />
            </label>
            <label className="gh-checkbox">
              <input
                type="checkbox"
                checked={plan.notify}
                onChange={(event) => update('notify', event.target.checked)}
              />
              Notify the business owner (does not grant approval)
            </label>
          </div>
        )}
        <button
          className="gh-button gh-primary gh-full"
          disabled={disabled || committed || !plan.treatments.length}
          type="submit"
        >
          {committed ? (
            <>
              <Check size={17} />
              Plan recorded — view commitment below
            </>
          ) : (
            <>
              {plan.authority === 'approval'
                ? 'Request approval'
                : plan.authority === 'recommendation'
                  ? 'Record recommendation'
                  : revision
                    ? 'Commit revised plan'
                    : 'Commit plan'}
              <ArrowUpRight size={18} />
            </>
          )}
        </button>
        <p className="gh-helper">
          The choice enters an immutable journal. Optional reasoning can remain unrecorded; it will
          be visible as a gap in review.
        </p>
      </form>
    </section>
  );
}
