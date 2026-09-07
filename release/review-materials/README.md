# Review materials and recording queue

These are blank preparation templates, not completed reviews or authorization to recruit, contact, enroll, record or compensate anyone. The owner can review the complete candidate and this consolidated queue at the end of engineering work. No human gate is passed here.

Copy a template to a separately authorized review workspace before completing it. Use pseudonymous participant/reviewer labels in shared evidence. Keep consent, identities and any identifying recordings outside the app, public repository and published artifact. Never fill the checked-in blank templates with participant data. Preserve independent submissions before discussion or adjudication.

| Work                                         | Prepared material                                                                                                                                       | Required execution and decision                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent case and rubric review           | [Domain/calibration record](domain-calibration-review.md); [12 development packets](../../qa-output/calibration/development/reviewer/README.md)         | Three independent reviewers spanning GSOC/physical security, cyber response and exercise/learning design; review actual opportunities, anchors and material defects.                                                                       |
| Second-set scoring                           | [8 candidate packets](../../qa-output/calibration/heldout-candidates/reviewer/README.md); [issue/adjudication record](issue-and-adjudication-record.md) | Engineering touched all candidates. After development anchor agreement, approve or replace and freeze the second set before independent scoring. Do not describe the present set as independent held-out evidence.                         |
| First use and causal comprehension           | [Per-person observer sheet](formative-observer.md)                                                                                                      | Ten intended users across analyst, supervisor and leader perspectives, including accessibility accommodations. Preserve assistance, failures, reading time and withdrawals.                                                                |
| Essential accessibility, devices and exports | [Accessibility/device sheet](accessibility-device-review.md)                                                                                            | Complete keyboard, NVDA and VoiceOver/Safari journeys; required physical tiers; full mission, review and export; measured performance and failure recovery.                                                                                |
| Purposeful visual/audio layer                | [Art/audio comparator sheet](art-audio-comparison.md)                                                                                                   | Review quiet handover, constrained operation and causal debrief on desktop/mobile. Compare optional 3D with equivalent schematic and audio with equivalent text; retain enhancements only with supported benefit and no task-success loss. |
| Recovery and publication                     | [Rollback rehearsal sheet](rollback-rehearsal.md)                                                                                                       | Named staging rehearsal on the exact artifact/prefix, within 15 minutes, preserving journals and neighboring applications. Record go/hold only after evidence review.                                                                      |
| Disagreements and defects                    | [Issue/adjudication record](issue-and-adjudication-record.md)                                                                                           | Preserve original ratings, reasons, material authority/safety disagreements and recheck evidence; never replace independent scores with consensus before reliability analysis.                                                             |

The [calibration manifest](../../qa-output/calibration/generation-manifest.json) pins the actual generated scenario/rules/rubric/assets versions and hashes. Check it against the final candidate before handing out packets. A subsequent lifecycle or rubric change requires regeneration and affected review; these templates intentionally do not hard-code a candidate revision. Full sessions, automated reports and engineering interpretations are in separate facilitator directories and must stay out of independent rating packets.

## Workload and order

1. Freeze the engineering candidate, evidence manifest, reference devices and review scope. Assign human roles without presenting an AI reviewer as an independent practitioner.
2. Three reviewers independently inspect the 12 development traces and complete case walkthroughs. This is 36 trace-review records if every reviewer reviews every trace; it is planned work, not 36 completed reviews. Opportunity judgments and critical flags come before any score.
3. Discuss development anchors and material model errors. Revise the source when needed. Preserve all original submissions and use a new version for changed content. Approve or replace the eight second-set candidates and freeze anchors, scoring rules, reviewer design and missing-data handling before opening them for scoring. Three reviewers on eight cases would create 24 independent records; a research mean-of-two-raters design must be separately specified and appropriate.
4. Run the ten-user first-use protocol without prior exposure to trace answers. Collect the primary unassisted journey before introducing any comparator demonstration. The same ten may participate in later visual/audio comparisons when separately included in the approved session plan; report order, carryover, skipped comparisons and added burden. Do not substitute these comparisons for primary first-use observations.
5. Complete manual assistive-technology/device/export checks and the three-state art/audio review. Both physical Android engineering runs passed their automated scope; the [device report](../../docs/DEVICE-VALIDATION.md) preserves methods, limits and retries. They do not replace iPhone/Safari, integrated-GPU desktop or manual assistive-technology qualification.
6. Review the [completed local rollback evidence](../../qa-output/rollback/rehearsal.json) and complete the named owner/intended-host staging scope; local automated recovery passed in 1.321 seconds with both journal byte hashes retained. Assemble the durable evidence index. The owner reviews one consolidated disposition with unresolved issues and proposed claims. Human signatures and exact candidate evidence determine the remaining go/hold decision.

No participant-duration or reviewer-effort estimate is presented as measured. Agree session burden and accommodations before observation, allow stopping, and record actual durations. G3 unfamiliar-case forms, spaced practice and the separately authorized 24-person learning study remain outside this flagship qualification exercise.

## Shared record header

Copy this header into each completed record. Blank values mean not recorded.

| Field                                                                   | Value |
| ----------------------------------------------------------------------- | ----- |
| Record ID / date                                                        |       |
| Reviewer or observer label / discipline                                 |       |
| Product owner disposition reference                                     |       |
| Source revision / static artifact SHA-256                               |       |
| Scenario / rules / rubric / assets / schema versions                    |       |
| Route and deployment prefix                                             |       |
| Calibration/evidence manifest path and hash                             |       |
| Device, OS, browser and assistive technology                            |       |
| Mode, seed/session ID and assistance                                    |       |
| Evidence archive location and access scope                              |       |
| Status: not started / in progress / complete for stated scope / blocked |       |

For every result distinguish observation, inference and decision. Attach raw evidence to the exact build. A screenshot, green job or artifact hash does not establish participant performance, authorship, accessibility conformance, content validity or independence.
