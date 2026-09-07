# Hourglass Command

Hourglass Command is a synthetic, account-free security leadership practice application directed by Shannon Brown and implemented with AI-assisted engineering. Glasshouse / 06:10 is the next-generation flagship: establish what was known, make a scoped plan, coordinate accountable action and inspect its consequences.

This branch is an **engineering candidate, not a qualified public release**. Independent content/rubric calibration, formative user studies, manual accessibility/device reviews and the staged rollback exercise remain pending. No learning efficacy, employer endorsement, certification, real loss savings or professional readiness is claimed.

- [Existing public launch](https://swb2019.github.io/gsoc-decision-ops/)
- [Design and invariants](docs/GLASSHOUSE-DESIGN.md)
- [Engineering validation](docs/ENGINEERING-VALIDATION.md)
- [Both physical Android results](docs/DEVICE-VALIDATION.md)
- [Actual application art/audio gallery](qa-output/art-review/index.html)
- [All 55 requirement statuses](docs/REQUIREMENTS-STATUS.md)
- [Human qualification packet](docs/QUALIFICATION-KIT.md)
- [Blank human review templates](release/review-materials/README.md)
- [20 synthetic calibration traces](qa-output/calibration/README.md)
- [Capability and evidence boundaries](docs/TRAINING.md)
- [Release qualification record](release/qualification.json)
- [Operation and capacity policy](docs/OPERATIONS.md)
- [Shannon Brown’s portfolio](https://swb2019.github.io/shannon-brown-career/)

## The playable case

At a fictional research and distribution campus, badge readers disagree, an identity connector is failing, a time-sensitive shipment is due and an entrance image is unverified. You are the watch commander. Protect people, maintain essential operations, establish scope and hand over a controlled situation.

Preview contains one choice and consequence, then continues into the same mission. Guided Practice offers context help; Independent Practice retains accessibility and pausing while removing coaching. Time advances deliberately to the next significant event. Both modes preserve the same rules without a competence multiplier.

The workspace combines a chronological evidence inbox, progressively composed plans, actor briefs and pending commitments with a complete situation schematic. Original optional 3D geometry is a removable enhancement. The debrief links decisions to known-then evidence, exposes eight observation dimensions, separates process from modeled outcomes, and supports a preserved same-seed branch. HTML, JSON, text PDF and full session backups remain local.

Optional sound has separate voice, effects and ambience controls, all initially off. The local handover voice has a speaker/timestamp transcript; original procedural cues and room tone yield to speech, with immediate pause/stop and text summaries. Audio and 3D still require the matched human comparator.

Opening a review preserves a partial run. A separate confirmed End practice action records an abandoned terminal with its reason and unfinished work intact; it does not create a completed handoff. Historical contract versions remain read-only and exportable under their original interpretation.

## Run and verify

Use Node.js 24 and the checked-in npm lockfile.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium firefox webkit
npx playwright test
npx playwright test --config playwright.engines.config.mjs
```

`/` and `/glasshouse/` launch the flagship; `/evidence/` describes its limits. `/legacy/` retains the previous scenario directory, and all eight `/scenarios/.../` URLs are preserved. Legacy records are read-only historical evidence, not silently translated into the new feedback model.

For a GitHub Pages build use `NEXT_PUBLIC_BASE_PATH=/gsoc-decision-ops`. Publication is held by `scripts/check-release-gate.mjs` until the exact artifact revision has documented human qualification. The existing live site is not changed merely by building this branch.

## Engineering evidence

The pure kernel validates authority, scope, references, resources, action lead times, cancellation, expiration and complete causal queues. Stable event-keyed random draws and full-state replay preserve the canonical future after recovery. Semantic tests include the independent USD 90,000 / USD 20,000 accounting fixture, full-range seed encoding, three alternative strategies, 1,000 seeded missions, 20-event bursts, known-then corrections, recommendations versus execution, and complete 100-decision records.

The browser journal uses atomic IndexedDB transactions and writer leases, with explicit takeover, stale-save rejection, corrupt-record quarantine and an honest unsaved fallback. Browser tests exercise interrupted writes, multiple tabs and PDF production. These checks do not replace manual assistive technology testing or independent rubric calibration.

Twelve development and eight engineering-authored held-out candidate traces now provide real serialized sessions, reports, neutral handouts and blank forms. All 20 replay and regenerate deterministically. They remain proposed/unreviewed; candidate independence, human anchors and ratings are not established. Both SM-G998U1 and SM-A146U1 passed the automated offline mission, export, recovery, layout and graphics checks. See the [device report](docs/DEVICE-VALIDATION.md) for measured scope and remaining human qualification.

## Privacy and scope

The flagship requires no account, analytics, microphone, cloud inference or backend. No player decisions are sent to a service. Use fictional, minimal notes; applications on the portfolio’s shared origin are not mutually isolated. Imports are bounded and replay-validated; client-side records remain unsigned and inspectable. A digest is not proof of authorship.

G3 additional cases and facilitated exercises, the consented learning-signal study, and G4 networked roles, enterprise features and AI experiments remain explicitly gated. No paid service or recurring spend is introduced.

## Source and license

Baseline preserved: `94486155e77a6dddd8293900a83e443679361e33`. The source and original procedural Glasshouse geometry/audio are MIT licensed; see [LICENSE](LICENSE) and [the asset register](docs/ASSET-REGISTER.md). Historical methodology is corrected in [the current evidence note](docs/TRAINING.md).
