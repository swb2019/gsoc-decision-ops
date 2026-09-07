# Physical Android engineering evidence

Both named phones passed the automated full offline mission on pack **93781ed04a3f81597bbfbd90**. This is engineering evidence, not completed human accessibility/device qualification. The phones were USB connected, visible, and running their actual Chrome/WebGL implementations. No browser profile was reset. All original journal checkpoints were retained, and original free rotation was restored.

- **SM-G998U1**: Android 15; Chrome 152.0.7977.75; ANGLE (Qualcomm, Adreno (TM) 660, OpenGL ES 3.2).
- **SM-A146U1**: Android 15; Chrome 152.0.7977.64; ANGLE (ARM, Mali-G57 MC2, OpenGL ES 3.2).

## Five cache-disabled navigations per route

| Model     | Route        | LCP observations (ms)   | Median | Maximum | Maximum CLS |
| --------- | ------------ | ----------------------- | ------ | ------- | ----------- |
| SM-G998U1 | /            | 72, 76, 76, 72, 72      | 72     | 76      | 0           |
| SM-G998U1 | /glasshouse/ | 80, 72, 80, 64, 72      | 72     | 80      | 0           |
| SM-G998U1 | /evidence/   | 84, 64, 64, 84, 80      | 80     | 84      | 0           |
| SM-A146U1 | /            | 136, 140, 144, 136, 128 | 136    | 144     | 0           |
| SM-A146U1 | /glasshouse/ | 136, 120, 128, 128, 132 | 128    | 136     | 0           |
| SM-A146U1 | /evidence/   | 144, 116, 140, 124, 124 | 124    | 144     | 0           |

These are localhost-over-USB, cache-disabled navigations in the same Chrome process. They are not process-cold launches, mobile-radio transfer measurements, field percentiles or field INP. The initial flagship pack was removed before measurement. Device-local text entry, tab selection and deliberate time controls were automated.

## Mission, resilience and latency

Both phones downloaded and integrity-verified the full pack, failed an uncached target request under network emulation, then completed a three-decision mission through minute 30 and a controlled handoff while offline. Real WebGL rendering, recorded resource commitments, forced WebGL loss, schematic recovery, portrait/landscape, 200% text and completed-review axe checks passed. JSON, HTML and searchable-text PDF were generated offline; repeated JSON exports remained unchanged. Browser download-handoff Blob bytes were verified; OS Downloads-folder persistence and sharing remain unqualified.

| Model     | Actual committed plans measured | Maximum click-to-DOM acknowledgment | Maximum following paint opportunity | Scene load/exit cycles | Maximum JS-heap growth |
| --------- | ------------------------------- | ----------------------------------- | ----------------------------------- | ---------------------- | ---------------------- |
| SM-G998U1 | 3                               | 22.1 ms                             | 66.3 ms                             | 10                     | 5.20 MiB               |
| SM-A146U1 | 3                               | 37.1 ms                             | 105.9 ms                            | 10                     | 5.15 MiB               |

Latency uses the physical page clock from captured click to commitment insertion, excluding USB/driver transport. Three plans per phone provide a small lab sample, not a robust population p95. Every observed acknowledgment and following paint opportunity was below 200 ms. Ten forced-GC scene cycles remained within the declared 16 MiB JavaScript regression bound; this is not physical GPU-memory, thermal or endurance certification. Full-mission frame traces include deliberate scene loads, GC, screenshots, orientation changes and forced GPU loss; do not treat those injected pauses as steady-scene animation measurements.

Earlier attempts exposed Android keyboard/browser-bar geometry changes and USB debugging-service disconnects. The harness now waits for stable viewport geometry and verifies actual click delivery. Interrupted attempts were not counted as passes. The completed lower-memory phone run used a dedicated persistent debugging connection. Those driver corrections did not change the simulation.

## Evidence and remaining scope

- [Exact combined raw results](../qa-output/android/summary.json) and [derived summary](../qa-output/device-summary.json).
- [SM-G998U1 results](../qa-output/android/SM-G998U1/qualification.json), [frame trace](../qa-output/android/SM-G998U1/mission-frame-trace.json), [completed review](../qa-output/android/SM-G998U1/completed-review.png).
- [SM-A146U1 results](../qa-output/android/SM-A146U1/qualification.json), [frame trace](../qa-output/android/SM-A146U1/mission-frame-trace.json), [completed review](../qa-output/android/SM-A146U1/completed-review.png).
- [Repeatable harness](../scripts/android-qualification.mjs). Keep device serials/local tunnel configuration outside published evidence.

Human touch/soft-keyboard, NVDA, VoiceOver/iPhone Safari, OS export/share, native voice/audio perception, and a named integrated-GPU desktop remain in the manual qualification packet. The available desktop has an NVIDIA RTX 4070 SUPER; it does not substitute for the integrated-GPU reference. Supplemental Firefox and Windows WebKit engine checks do not establish native iPhone/Safari qualification.
