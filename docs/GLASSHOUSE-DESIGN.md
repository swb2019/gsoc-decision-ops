# Glasshouse implementation and release contract

This branch implements the next-generation Hourglass public solo architecture and the Glasshouse flagship. It preserves the source history, the `/gsoc-decision-ops/` deployment base and every existing scenario route. The old landing is available at `/legacy/`; old records retain their original interpretation. Nothing in this branch establishes learning efficacy or qualifies a public release by itself.

Product direction and accountability: Shannon Brown. Engineering executor: Shannon Brown’s AI-assisted development workflow. Automated independent review is recorded as engineering evidence, never substituted for the named human domain and exercise reviewers required by the PRD. Those reviewer assignments remain an open qualification dependency. [Twenty generated traces](../qa-output/calibration/README.md) and [blank review templates](../release/review-materials/README.md) make the remaining work concrete. All candidates were engineering-authored; no human calibration or true held-out independence is claimed.

## Architecture

- `packages/core/src/glasshouse/types.ts`: pinned session, event, command, plan, action, evidence, report and finding contracts.
- `content.ts`: original fictional handover, seven controls, ten authored evidence releases, three roles and three dependent assets. Four independent hidden factors use stable event-keyed draws.
- `kernel.ts`: pure validated transitions, monotonic manual time, complete causal queue, resource reservations, authority requests, cancellation, expiry and terminal conditions. UI and 3D never own consequential state.
- `record.ts`: replay-validated import, canonical digest, immutable report, observed-behavior feedback, redaction and historical-version reconstruction. `counterfactual.ts` bounds the next-consequence comparison to a shared horizon.
- `apps/web/src/lib/glasshouse-storage.ts`: namespaced IndexedDB journal and checkpoints, atomic writer lease, stale-prefix protection and quarantine. Wall-time lease metadata stays outside canonical simulation state.
- `apps/web/src/lib/glasshouse-export.ts`: one full frozen report rendered to escaped HTML, structured JSON and paginated selectable-text PDF. HTML remains the canonical accessible alternative.
- `apps/web/src/components/glasshouse/`: launch, chronological evidence, plan composer, actor brief, commitments, accessible situation diagram, optional lazy 3D, controlled audio, handoff, explicit voluntary end and causal review.
- `useGlasshouseAudio.ts` and `AudioControls.tsx`: observation-only sound projection with independent voice/effects/ambience controls; no domain write path.

## Minimum complete mission

Preview uses the same opening and stops after one completed consequence. Continue keeps its choices and evidence and changes to Guided Practice. Guided and Independent both use deliberate, pausable time. Independent disables substantive coaching. No time or mode multiplier changes evaluation.

Investigate the connector and verify the service entrance. Observe the results, image correction, capacity constraint and owner availability. Choose continued monitoring, bounded manual verification or approved isolation. Review dispatch at minute 30 and the relief handover at minute 38. A controlled terminal requires three recorded consequential decisions, at least one completed verification, settled pending actions, at least minute 30 and an explicit summary, owner and review condition. Early handoffs and an expired exercise hour are explicitly incomplete. Unresolved questions and active bounded controls remain visible. A separate confirmed voluntary-end command records `abandoned` and its reason without advancing the clock, changing commitments or claiming a completed handoff. The saved terminal preserves unfinished work; operational commands cannot resume it. Supported historical rules retain their original lifecycle semantics in read-only review.

These are authored teaching paths, not real operational instructions. Narrow fault, scoped compromise, constrained manual capacity and delayed ownership support different defensible choices. A temporary pause is not automatically permanent avoidance. A transfer recommendation does not transfer accountability or silently execute a control.

## Optional sound and presentation

All voice/effects/ambience channels start off and have independent levels. A deliberately selected local browser voice can read the handover; the same speaker/timestamp transcript remains visible. Original procedural WebAudio cues mark received observations or action receipts, and quiet original room tone carries no facts. Voice has priority: effects remain quiet and ambience is reduced, with readable receipt summaries and no replayed backlog. Immediate pause/stop and navigation/background cleanup preserve quiet control; no microphone, downloaded samples/model or remote speech service is added. Missing local voice/output leaves the complete text path.

The current asset contract versions procedural audio separately from historical campus assets. Its [asset provenance](ASSET-REGISTER.md) and [art/audio comparator](../release/review-materials/art-audio-comparison.md) remain reviewable. Mechanism checks do not establish human perceptual quality or a comprehension benefit.

## Model and uncertainty

Every observation has exact claim, source, provenance, limitations, observed time, received time and authorized actors. Sharing updates actor knowledge at its event time; it never grants the actor future knowledge. Decisions retain their complete known-then evidence IDs and explicit references. Corrections append and create a visible obligation to update a recipient who received the old claim.

The synthetic ledger uses USD cents, one exposure ID and one first-hour horizon. The illustrative uncontrolled expected-loss assumption is USD 120,000 with a stated USD 60,000–180,000 range. Each minute uses the strongest active control reduction; overlapping controls never sum the same exposure saving. Costs are committed once when work starts and survive cancellation. The display is an illustrative modeled comparison, not an empirically estimated financial result. The independently specified legacy fixture is USD 90,000 avoided loss minus USD 20,000 cost = USD 70,000 net; ROI = 350%. Zero cost has no defined ROI.

Feedback exposes eight dimensions. Automated rules assess evidence references/corrections, procedural authority, completed verification/recorded triggers, and authored handoff conditions within explicit limits. Uncertainty quality, proportionality, business reasoning and communication quality remain for human review. Text length, keywords, a selected posture and stochastic outcomes never produce quality credit.

## Invariants and failure behavior

1. One validated command ID causes at most one transition. Reusing it for different content is rejected.
2. No effect precedes its causal parent. Equal-time tasks use time, priority, stable order and ID; a whole due burst drains once.
3. A resource cannot serve two concurrent assignments. Acknowledgment, approval, execution and completion are distinct.
4. Manual stepping never skips the next meaningful update or the dispatch deadline. Hidden tab time never catches up.
5. Opening review is a projection. It cannot advance time, create completion or change earlier evidence.
6. Restoring a file replays every validated command against its exact pinned pack, then compares the entire canonical state and digest. Unsupported versions remain read-only instead of being guessed into compatibility.
7. Original branches remain in the journal. Counterfactuals reconstruct a checkpoint before a selected decision and preserve the original seed. Unequal horizons are visibly labeled.
8. Failed storage leaves an honest unsaved in-memory run and backup path. Transactions recover an old complete checkpoint or a new complete checkpoint; corruption is quarantined.
9. Imports enforce 5 MB, bounded depth, bounded notes/rationale, known command types, no executable markup and no prototype keys. HTML escapes all player text.
10. No analytics, network response controls, credentials, real incident ingestion, cloud inference or automatic microphone access are added.

## Feature decisions and removal conditions

| System              | Objective and dependency                                      | Smaller/rejected alternative                                           | Evidence and deletion condition                                                        |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Event kernel        | Faithful decisions and recovery; requires versioned content   | Multiple UI effect authorities rejected                                | Replay/causal tests; retain only rules with a scenario effect                          |
| Plan composer       | Scope, treatment and authority survive end to end             | One posture button rejected                                            | Semantic and browser checks; remove optional fields if unused by review                |
| Authored actors     | Make owner availability and agreement legible                 | General AI agents deferred                                             | Approval/knowledge fixtures and human review; remove dialogue that adds no information |
| Local journal       | Durable account-free practice                                 | localStorage partial state rejected                                    | Abort/quota/lease tests; no backend without a distinct approved need                   |
| Schematic and 3D    | Explain dependencies and commitments                          | Free-roaming world rejected                                            | Human comparator pending; ship schematic if graphics do not improve the task           |
| Structured feedback | Inspect observable behavior                                   | Global leadership grade and keyword scorer rejected                    | Held-out independent calibration pending; withdraw unsupported automatic anchors       |
| Counterfactual      | Test another hypothesis from known-then evidence              | Restarting with new random state rejected                              | Checkpoint and same-horizon tests; do not infer retention from immediate replay        |
| Export              | Complete locally held evidence                                | Raster-only primary report rejected                                    | 100-decision HTML/JSON/PDF reconciliation; HTML retained until tagged PDF qualifies    |
| Optional audio      | Communicate observable updates while retaining identical text | Audio off remains complete; remote speech and repeated alarms excluded | Human matched comparator pending; remove any interference or unsupported sound cue     |

## Version and legacy correction policy

Baseline: `94486155e77a6dddd8293900a83e443679361e33`. Legacy fixes repair money multipliers, seed-code truncation, authored ordering, acknowledged queue delivery, selected treatment recording, posture-dependent pre-action likelihood and review-induced completion. Legacy scheduler recovery adds RNG state where available. Already-saved legacy sessions still lack the full canonical contract and are preserved for read-only review; they are never represented as faithfully resumed Glasshouse sessions or rescored as new judgments.

Any change to actor knowledge, authority, valid actions, outcome rules or rubric meaning requires a new pinned version and an interpretation note. Retain previous source and readable exports. Do not silently import the private PRD or other personal source material into the public bundle.

## Release status and human gates

`release/qualification.json` is the authoritative go/hold record. Automated checks are evidence of implementation behavior, not a human qualification pass. Public deployment is held until the record identifies the exact revision and independent reviewer, formative, accessibility/device and rollback evidence. No participant recruitment, employer use, contact, consent collection, compensation or new paid service is performed by this implementation.

G3 unfamiliar cases, spaced practice, facilitator kit and learning study are deferred until the flagship qualifies. G4 networking, enterprise authoring and AI need separate demonstrated demand, cost and privacy/security approval.
