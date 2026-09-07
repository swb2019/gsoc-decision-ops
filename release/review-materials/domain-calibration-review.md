# Domain and calibration review record

Blank template. Use the [shared header](README.md#shared-record-header). Reviewer label: ______. Discipline: ______. Date: ______. Candidate revision/hash: ______. Anchor version: ______. Independent submission timestamp and immutable copy: ______.

Reviewers must include GSOC/physical security, cyber incident response and exercise/learning design. Product ownership does not replace the independent reviewer mix. No reviewer assignment, agreement or validation result is recorded by this template.

## Materials and independence

Use [development reviewer packets](../../qa-output/calibration/development/reviewer/README.md) and each case's blank eight-dimension rating form. The [generation manifest](../../qa-output/calibration/generation-manifest.json) contains the actual pins/hashes. Keep facilitator context, hidden state and automated findings separate until independent ratings are retained.

The 12 development traces cover narrowed fault monitoring/manual service, approved scoped compromise, guard constraints, delayed or pending approval, image correction and recipient updating, unsupported emergency action, favorable unsupported monitoring, adverse restoration, and early/controlled handoff. The [eight second-set candidates](../../qa-output/calibration/heldout-candidates/reviewer/README.md) are engineering-authored and inspected. They are candidates for human approval or replacement after development anchor agreement; they are not yet a genuinely independent held-out set.

| Preparation item                                                | Record / evidence / unresolved issue |
| --------------------------------------------------------------- | ------------------------------------ |
| Reviewer discipline, relevant experience and possible conflicts |                                      |
| Previously seen development, facilitator or candidate material  |                                      |
| Assigned neutral trace IDs and randomization/order, if used     |                                      |
| Instructions and supports supplied equally to reviewers         |                                      |
| Exact development source and manifest version                   |                                      |
| Independent submission location before discussion               |                                      |

## Manual case walkthrough

Use the same full mission and authority contract as the candidate. Inspect at least the narrowed fault monitoring strategy, the bounded manual strategy, scoped approved isolation, and a reviewable poor strategy. D01/D02/D03/D09 are concrete development starting points; D10/D12 also contain full handoffs. A generated trace is not independent proof that a strategy is defensible.

| Question                                                                                                                                 | Observation, event/source references and reason |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Are role, objective, essential services and authority legible without external employer knowledge?                                       |                                                 |
| Are the initial conditions, evidence provenance and modeled artificialities plausible within the fictional case?                         |                                                 |
| Does each actor reveal only received knowledge? Are obligations and response times understandable?                                       |                                                 |
| Can at least two alternatives be defensible under the same known-then evidence? Identify their conditions.                               |                                                 |
| Do resource conflicts, lead times, expiry, costs and approval states represent the stated commitments?                                   |                                                 |
| Can a favorable outcome follow weak process, or an adverse outcome follow careful process, without being conflated?                      |                                                 |
| Are emergency authority and proportionality modeled safely? Record every material disagreement.                                          |                                                 |
| Are original reports, corrections and obligations to update earlier recipients preserved?                                                |                                                 |
| Are restoration prerequisites, unsuccessful checks and retained isolation clear?                                                         |                                                 |
| Does every path end in a credible controlled handoff or an explicit partial/abandoned/incomplete state supported by that pinned version? |                                                 |
| Do warnings, content limitations, synthetic assumptions and source/license records cover the actual material?                            |                                                 |

## Opportunity and anchor agreement

Complete one independent rating form per assigned trace. For every scored opportunity cite available evidence, action, consequence, event IDs and known-then snapshot IDs. Do not infer reasoning quality from text length, expected words, a posture label, a favorable result or a populated field. Use not-observed where the trace cannot support a judgment; it is not a zero.

| Dimension or critical task | Observable opportunity and references | Proposed 0 / 1 / 2 or categorical anchors, including acceptable alternatives | Ambiguity / material dispute | Human-agreed version and evidence |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------- | --------------------------------- |
|                            |                                       |                                                                              |                              |                                   |

Keep critical-task misses visible separately from any dimensional score. An authority or safety breach cannot be averaged away. Use the [adjudication record](issue-and-adjudication-record.md) for disagreement and preserve each original rating.

## Second-set freeze and analysis plan

Complete before second-set scoring; do not retroactively choose a statistic or denominator to improve a result.

| Predeclared field                                                                                                                | Value / rationale / approval reference |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Candidate set approved, replaced or revised; who previously saw it                                                               |                                        |
| Frozen case, scenario/rules/rubric/assets, anchor and form hashes                                                                |                                        |
| Reviewer assignment and masking; overlap with development authors                                                                |                                        |
| Unit for critical-task agreement; eligible opportunity list                                                                      |                                        |
| Meaning of met / partly-met / missed / not-observed and treatment of opportunity disagreement                                    |                                        |
| Exact-agreement numerator/denominator and missing-rating handling                                                                |                                        |
| Material authority/safety dispute adjudication rule                                                                              |                                        |
| Intended research cases demonstrably exposing all eight dimensions, or “no research score qualified”                             |                                        |
| Research rater design and justification, analyzed score and missing-opportunity procedure                                        |                                        |
| Absolute-agreement reliability statistic, assumptions, confidence interval method, mean-of-two-raters and single-rater estimates |                                        |
| Preserved pre-adjudication data location                                                                                         |                                        |
| Human approval to freeze; date; hash                                                                                             |                                        |

The critical-task exact-agreement target is at least 90%; report item disagreement and reasons as well as the percentage. Do not silently drop missing ratings or disagreements about whether an opportunity existed. These are planning gates, not universal scientific standards.

For qualified research cases only, the PRD proposes eight 0–2 dimensions and the private index `100 × sum / 16`, analyzed as the mean of two independent raters. An appropriate predeclared absolute-agreement mean-of-two-raters ICC target is 0.75 with its confidence interval; report single-rater reliability separately. Calculate reliability on the score actually analyzed before adjudication. The present engineering traces do not qualify that score or supply human data. Weak reliability or broad intervals requires revision and recalibration, not a validation claim.

## Disposition

Independent records complete for the stated scope: ______. Material disputes unresolved: ______. Required source/rule changes and affected old versions: ______. Second-set status: ______. Evidence paths: ______. Reviewer recommendation with reasons: ______. Owner disposition: ______.

No blank field means passed. Any material unresolved authority or safety error blocks the affected publication claim.
