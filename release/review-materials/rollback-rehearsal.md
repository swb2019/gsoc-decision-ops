# Static rollback rehearsal record

Blank template. Use the [shared header](README.md#shared-record-header). Operator label: ______. Observer/owner: ______. Staging origin and deployment prefix: ______. Exact candidate and previous known-good source revisions/artifact hashes: ______. Start/end/time source: ______. Elapsed recovery time: ______.

The target is restoration of the previous static build within 15 minutes in a staging exercise while preserving old/new journals and neighboring portfolio data. The [automated local result](../../qa-output/rollback/rehearsal.json) passed in 1.321 seconds for candidate `93781ed04a3f81597bbfbd90` and previous pack `98200f6986b10efa88ee4960`: all eight links, pinned assets and original-save continuation worked; both checkpoint byte hashes remained unchanged after returning to the candidate; offline retirement preserved neighboring data; no page errors were recorded. This evidence is not a named owner or public-host qualification. Keep the fields below blank until that review is actually performed, and distinguish the local origin from the intended hosting environment. The [script](../../scripts/rehearse-static-rollback.mjs) retains the engineering procedure.

## Before interruption

| Item                                                                   | Location / hash / observation |
| ---------------------------------------------------------------------- | ----------------------------- |
| Current candidate static artifact, source and version pins             |                               |
| Previous known-good static artifact, source and version pins           |                               |
| Both offline manifests and scoped worker/cache versions                |                               |
| Recovery copies of legacy original bytes and current journal sessions  |                               |
| Canonical states/hashes for a previous-version and current-version run |                               |
| Namespaced checkpoint count, active pointer and writer state           |                               |
| Neighboring application routes/data sentinel and baseline              |                               |
| Staging prefix matches `/gsoc-decision-ops/`; any deviations           |                               |
| Restore operator, stop conditions and retained evidence destination    |                               |

Use synthetic data. Do not delete, migrate or rewrite a journal merely to make an older shell appear compatible. Older or unsupported sessions must remain identifiable with a safe read-only/export path and truthful limits. A hash detects accidental byte changes, not trusted authorship.

## Execution log

| Step                                                                                              | Timestamp | Actual result and evidence | Failure / recovery copy / issue ID |
| ------------------------------------------------------------------------------------------------- | --------- | -------------------------- | ---------------------------------- |
| Start from candidate and verify previous/current saved records                                    |           |                            |                                    |
| Confirm complete offline pack and perform an offline play/review check                            |           |                            |                                    |
| Interrupt an update; verify a partial pack is not ready and previous complete pack remains usable |           |                            |                                    |
| Begin timed rollback and restore retained previous static artifact                                |           |                            |                                    |
| Retire only the faulty scoped worker/cache                                                        |           |                            |                                    |
| Verify launch, links and assets below                                                             |           |                            |                                    |
| Verify legacy and new journal bytes/state, including newer-version safe handling                  |           |                            |                                    |
| Verify neighbor routes/data and declared cache scope                                              |           |                            |                                    |
| Verify offline cache recovery and full accessible report/export path                              |           |                            |                                    |
| End timed recovery; archive all raw failures and final observations                               |           |                            |                                    |

## Route and asset checks

Use the full deployment prefix for every route. Record result and evidence separately; a single root page success does not cover the rest.

| Route or dependency                                                 | Result / artifact / evidence |
| ------------------------------------------------------------------- | ---------------------------- |
| `/gsoc-decision-ops/`                                               |                              |
| `/gsoc-decision-ops/glasshouse/`                                    |                              |
| `/gsoc-decision-ops/legacy/` and `/gsoc-decision-ops/evidence/`     |                              |
| `/gsoc-decision-ops/scenarios/executive-threat-convergence/`        |                              |
| `/gsoc-decision-ops/scenarios/supply-chain-intrusion/`              |                              |
| `/gsoc-decision-ops/scenarios/insider-threat-external/`             |                              |
| `/gsoc-decision-ops/scenarios/civil-unrest-downtown/`               |                              |
| `/gsoc-decision-ops/scenarios/tech-outage-platform/`                |                              |
| `/gsoc-decision-ops/scenarios/access-control-ransomware/`           |                              |
| `/gsoc-decision-ops/scenarios/video-system-compromise/`             |                              |
| `/gsoc-decision-ops/scenarios/alarm-monitoring-outage/`             |                              |
| Referenced shell, font, optional scene, PDF and offline-pack assets |                              |
| Source/portfolio handoffs and neighboring application sentinel      |                              |

## Disposition and preservation

| Question                                                                                                | Recorded answer and evidence |
| ------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Was previous-build service restored within 15 minutes? Report actual time and any excluded interval.    |                              |
| Do prior/current journal bytes and canonical states reconcile?                                          |                              |
| Can newer or unsupported records be preserved/exported without invented migration?                      |                              |
| Was the bad offline cache/worker retired without clearing unrelated storage?                            |                              |
| Which conditions were local engineering only; which were exercised in the intended staging environment? |                              |
| What remained failed or untested, and which claim is held?                                              |                              |
| Durable archive, reviewer/operator labels and owner go/hold reason                                      |                              |

Do not mark the authoritative qualification record passed from this blank template or solely from automated success. The owner must review the exact artifact, evidence, target-environment limits and remaining gates.
