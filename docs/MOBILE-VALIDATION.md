# Mobile optimization and validation

The game supports phone and tablet play in portrait and landscape. Mobile scenario entry now opens mission setup directly. Decision, Intel and COP navigation remain available, with the sent-response receipt positioned above them. Extra audio controls remain accessible in More options instead of crowding the phone header.

Touch controls have a minimum 44 CSS-pixel target, including menu actions and audio switches. Form controls use at least 16px text, preserving browser zoom and avoiding automatic input zoom. Audio settings scroll within the dynamic viewport; safe-area padding protects controls near screen edges. Landscape navigation becomes shorter to preserve working space. Glasshouse retains its complete schematic and optional, demand-rendered 3D view with capped pixel density.

## Ongoing voice on phones

The final voice pack **3212711aa9d7316215e75406** has fresh real-model conversation checks on both physical phones. Phones use installed local English speech output when available; the four-gigabyte device keeps the smaller quantized recognition path. Voice starts once, automatically sends a finished spoken decision, reads the result and listens again. Missing legacy choices become spoken follow-up questions. A floating stop control remains above phone navigation.

Both devices executed successive decisions, recognized spoken stop and released all microphone tracks, with no horizontal overflow. The final S21 run was portrait and the A14 run was landscape. See [voice timings, evidence scope and human-review limits](TWO-WAY-AUDIO.md). The complete earlier offline, keyboard and graphics run below retains its original artifact identifier.

## Mobile base qualification

Both connected devices ran the mobile base artifact, **d65b92a2831889f378266f40**, preserved in release `e1d5ef5`. These results retain that artifact identifier; they are not relabeled as tests of a later voice update. Evidence is in `qa-output/android-mobile/` and the corresponding validation archive.

| Check                                                                          | SM-G998U1                       | SM-A146U1                       |
| ------------------------------------------------------------------------------ | ------------------------------- | ------------------------------- |
| Native keyboard opened through touch                                           | Passed                          | Passed                          |
| Focused input / browser zoom                                                   | 16px / 1×                       | 16px / 1×                       |
| Layout with keyboard open                                                      | 384px content in 384px viewport | 384px content in 384px viewport |
| Offline three-decision mission and controlled handoff                          | Passed                          | Passed                          |
| Portrait, landscape and 200% text                                              | Passed                          | Passed                          |
| Ten optional-scene mount/dispose cycles                                        | Passed                          | Passed                          |
| Maximum sampled JavaScript heap growth                                         | 5,370,560 bytes                 | 5,412,376 bytes                 |
| Physical WebGL loss/recovery and generated JSON/HTML/PDF                       | Passed                          | Passed                          |
| Legacy mission setup, audio settings, decision and report through native touch | Passed                          | Passed                          |

Device testing preserved prior journals and unrelated browser tabs, restored rotation settings, and used synthetic engineering decisions. The separate legacy test used a dedicated test origin and closed its own tab. Keyboard text was entered by automation after native touch focus; no human typing, dictation accuracy, accessibility signoff, OS sharing or thermal endurance result is claimed.

## Browser coverage

The mobile suite exercises 320×740, 390×844, 768×1024 and 844×390 layouts; rotated review, shortened viewport entry and 200% text; readable inputs; settled touch-target geometry; audio settings; and automatic spoken-response sending, cancellation and failures. Speech tests use synthetic audio through native browser recording and deterministic recognition fixtures.

The delivery manifest reports the final Chrome, Firefox and Windows WebKit checks. WebKit engine layout coverage does not replace native iPhone/Safari qualification. Existing unit, architecture and desktop regression checks remain part of the delivery.

Run `npm exec playwright test -- --config=playwright.mobile.config.mjs` with the local browser installation configured. Physical-device scripts take a private device configuration; serials and debugging addresses are excluded from published evidence. Public release remains held for the final human qualification packet.
