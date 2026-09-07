# Accessibility, device and export record

Blank template. Use the [shared header](README.md#shared-record-header). Tester label: ______. Exact device/OS/browser/AT: ______. Input method and accommodations: ______. Candidate artifact/hash: ______. Route/mode/session: ______. Recording consent/reference if applicable: ______.

The target is equivalent essential play and WCAG 2.2 AA, with explicit control of optional motion. Automated axe output supplements manual review; it is not a conformance certificate. Record criterion-specific findings where supported and state the manual review's actual scope.

## Physical reference matrix

Name exact hardware before qualification. Both SM-G998U1 and SM-A146U1 passed the documented automated scope; their [raw engineering evidence](../../qa-output/android/summary.json) does not replace the human review below. Cache-disabled reloads in the same browser process must be labeled as such, rather than five independent cold browser starts. Emulation is separately labeled and cannot replace the physical tiers.

The available desktop engineering hardware is NVIDIA RTX 4070 SUPER, a discrete GPU. Its results do not establish the required named integrated-graphics desktop tier.

| Required or additional tier                       | Exact hardware / GPU / OS / browser / AT | Agreed scope and route | Evidence path | Result / unresolved issue |
| ------------------------------------------------- | ---------------------------------------- | ---------------------- | ------------- | ------------------------- |
| Supported integrated-graphics desktop             |                                          |                        |               |                           |
| Mid-range Android handset                         |                                          |                        |               |                           |
| iPhone with Safari and VoiceOver                  |                                          |                        |               |                           |
| Additional physical Android: SM-G998U1            |                                          |                        |               |                           |
| Additional physical Android: SM-A146U1            |                                          |                        |               |                           |
| Windows with NVDA, if distinct from desktop above |                                          |                        |               |                           |

## Essential journey

Run launch → handover → evidence inspection → plan → commitment/receipt → brief/correction → handoff or explicit partial/abandoned exit → review → finding evidence → export → restore/history. Use both Guided and Independent where their controls differ. Record observed behavior, not just a tick mark.

| Check                    | Action / expected access boundary                                                                                    | Actual observation, evidence and issue ID |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Keyboard only            | Reach every decision and equivalent schematic control; no dragging requirement or trap                               |                                           |
| Focus                    | Visible focus, sensible order, modal entry/close/return, and focus after errors or changing views                    |                                           |
| NVDA                     | Complete the full mission and review; verify names, headings, form errors, state changes and reading order           |                                           |
| VoiceOver/Safari         | Complete the same essential path on the named Apple configuration                                                    |                                           |
| Announcements            | New receipts and unsaved state are understandable; no repeated live-region storm or forced focus jump                |                                           |
| Narrow layouts           | 320px and 390px widths and portrait/landscape retain essential controls without panel overlap                        |                                           |
| Text/zoom                | 200% text resizing and 400% browser zoom; text and forms require no two-dimensional scrolling                        |                                           |
| Targets and contrast     | Measure primary targets at least 44×44 CSS px; inspect text, non-text state and visible focus contrast               |                                           |
| Motion off               | Reduced-motion preference and explicit motion-off remove nonessential motion; camera never blocks evidence           |                                           |
| Audio off                | Same facts, speaker/timestamp transcript, receipts and decisions remain available                                    |                                           |
| Audio control            | Pause/stop takes effect immediately; no microphone prompt, unsolicited model download or competing speech channels   |                                           |
| Draft and timing support | Inspection, reading, pause, settings/backgrounding and restore do not penalize reading or silently lose a draft      |                                           |
| Optional failure         | Failed 3D asset, WebGL/context loss, sustained jank and missing voice/model preserve the equivalent usable path      |                                           |
| Storage/recovery         | Denied/quota/corrupt/two-tab cases expose read-only or unsaved status accessibly and preserve recovery/export access |                                           |

## Performance and memory record

Capture five cold lab runs per route/device class and declare cache/process/network/power conditions. Retain all runs, medians and outliers; do not relabel local latency as field INP. Targets are LCP ≤2.5 s, CLS ≤0.1, initial compressed shell ≤1 MB, optional visual pack ≤4 MB and command acknowledgment p95 ≤200 ms on the agreed low-tier device. Field INP p75 ≤200 ms remains a target without privacy-approved field data.

| Route / device / run 1–5 | Cold definition and network | LCP / CLS | Transfer bytes | Interaction/command samples and p95 method | Evidence / failure |
| ------------------------ | --------------------------- | --------- | -------------- | ------------------------------------------ | ------------------ |
|                          |                             |           |                |                                            |                    |

| Full-mission check                                                                       | Observation and raw trace |
| ---------------------------------------------------------------------------------------- | ------------------------- |
| Memory/frame times from launch through mission and review                                |                           |
| Deliberate interaction: desktop 60 fps target / mobile-integrated 30 fps target          |                           |
| Ten load/exit cycles, comparable checkpoints and trend rather than one snapshot          |                           |
| Failed assets, slow frames, GPU loss and lower-tier recovery; canonical state comparison |                           |
| Background/sleep/resume and recorded unsaved interval                                    |                           |

If a hardware target fails, record whether the complete lower tier meets the supported claim. Do not weaken domain integrity to preserve an effect. No field percentile or unbounded-memory conclusion may be inferred from a short emulated run.

## Reports at two reading depths

Use a short report and the [100-decision HTML](../../qa-output/glasshouse-100-decisions.html)/[PDF](../../qa-output/glasshouse-100-decisions.pdf) stress fixture, plus the final candidate's corrected, partial and completed records. Record each artifact/version; a sample generated from an older build is not final-build qualification.

| Check                                                                                                                                                   | Evidence / observation / defect |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Executive brief and detailed evidence are discoverable and accurately bounded                                                                           |                                 |
| Exact TRANSFER and mixed treatments, corrections, timeouts, approvals, unresolved actions and overlapping-control inputs reconcile across HTML/JSON/PDF |                                 |
| Print-size readability, body text at least 10pt, no clipped/omitted record or silent truncation                                                         |                                 |
| Oversized decision continuation retains ID and context; headings/rows stay together when they fit                                                       |                                 |
| Searchable/selectable text, headings, table reading order, page numbering and repeated context                                                          |                                 |
| Manual PDF tag/reading-order review and AT result, or explicit unqualified status                                                                       |                                 |
| HTML remains the canonical accessible alternative until PDF accessibility is manually qualified                                                         |                                 |
| Redacted preview removes intended personal labels/free text and retains the stated evidence boundary                                                    |                                 |

Affected scope usable: ______. Blockers and workarounds: ______. Retest revision/evidence: ______. Manual reviewer recommendation: ______. No blank cell or automated pass establishes conformance.
