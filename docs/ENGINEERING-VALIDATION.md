# Engineering validation — 6 September 2026

The [ongoing two-way voice update](TWO-WAY-AUDIO.md) adds speech-driven decisions and automatic listening between replies in Glasshouse and legacy scenarios. Actual Whisper recognition and speech playback were exercised on desktop Chrome and both connected Android phones. [Mobile results](MOBILE-VALIDATION.md) distinguish the current voice checks from the earlier full offline/keyboard/graphics qualification. The delivery manifest pins source, static pack, test results and archive checksums.

The Glasshouse engineering candidate passes the automated checks below. These establish specific software behavior, not completed human qualification or learning efficacy. The delivery manifest identifies the exact source revision and archive checksums. The tested static pack is **93781ed04a3f81597bbfbd90**, scoped to `/gsoc-decision-ops/`.

## Completed checks

| Check                    | Result and meaningful scope                                                                                                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and semantic        | **430 passed across 18 files**. Covers deterministic replay, 1,000 seeds, event bursts, three defensible strategies, known-then evidence, original-version reconstruction, truthful abandonment, authority/resources, complete reports, bounded imports and preserved legacy accounting.                         |
| Architecture and release | **12 passed**. Pure-domain dependency boundary and release-record validation; empty gates, missing evidence, version mismatches and unqualified publication cannot silently pass.                                                                                                                                |
| Chrome journeys          | **33 passed** against the final production static artifact. Full mission/handoff, preview continuation, modes, same-horizon fork, active time, transactional storage, quarantine, multi-tab takeover, opt-in audio, historical records, failed assets and offline exports.                                       |
| Supplemental engines     | **54 passed; 2 explicitly skipped** across Windows Firefox and WebKit. WebKit lacks native AudioContext in this runtime, so two native-output checks are skipped; text/failure fallback remains tested. These are engine checks, not native iPhone/Safari qualification.                                         |
| Physical Android         | **Both SM-G998U1 and SM-A146U1 passed** the full offline mission, controlled handoff, generated JSON/HTML/text-PDF exports, real WebGL loss/recovery, ten scene cycles, portrait/landscape and 200% text. See [measurements and limits](DEVICE-VALIDATION.md).                                                   |
| Accessibility/layout     | No axe violations on tested launch, command and completed review journeys. Keyboard, reduced motion, 320px/390px and 200% text checks pass. A Firefox narrow-layout issue was repaired without hiding content. Manual assistive technology remains pending.                                                      |
| Reports and recovery     | Searchable text-PDF and complete HTML/JSON preserve 100-decision fixtures. Old-version reports retain their original rubric; corrupt/unsupported bytes are quarantined. Denied deletion does not claim success. HTML is the canonical accessible export; PDF tagging and OS sharing remain unqualified.          |
| Art and sound evidence   | **Six actual application clips**: quiet handover, constrained operation and causal debrief at desktop and emulated-mobile sizes. Original procedural audio, equivalent schematic/3D stills, exact sessions and hashes are retained. All clips decode, play and seek; human voice/art comparator remains pending. |
| Local rollback           | Final-to-previous artifact swap, eight legacy routes, pinned assets and save continuation passed in **1.321 seconds**. Old/new journal bytes and neighboring storage survived. Named owner/intended-host qualification remains pending.                                                                          |
| Build hygiene            | Production export, core/web TypeScript, ESLint (**0 errors, 128 return-type warnings**), formatting and whitespace checks pass. Dependency audit: **0 known advisories across 393 dependencies**.                                                                                                                |

The WebKit offline adapter uses actual origin shutdown after a minimal cache-only control showed that this runtime's network-emulation toggle also blocks cached service-worker navigation. An uncached request must fail while the complete cached mission and PDF remain available. This test-driver limitation and the two native-audio skips are preserved in the evidence.

## Artifact and local performance

The complete static export is **19,094,594 bytes** including preserved legacy assets. The flagship offline pack is **55 files / 4,034,663 bytes**. Statically referenced entry bodies total **1,053,542 bytes**; reproducible per-file compression estimates are **300,661 gzip / 251,042 Brotli bytes**. These estimates are not real-host transferred bytes.

Five fresh desktop Chrome contexts per route produced the following localhost LCP observations; all measured CLS values were zero and no page errors occurred.

| Route          | LCP observations (ms)   | Median |
| -------------- | ----------------------- | ------ |
| `/`            | 340, 168, 124, 104, 148 | 148    |
| `/glasshouse/` | 108, 92, 92, 160, 116   | 108    |
| `/evidence/`   | 108, 104, 128, 104, 120 | 108    |

The desktop uses Chrome 152 and an NVIDIA RTX 4070 SUPER; it does not substitute for the PRD integrated-GPU tier. Phone cache-disabled route observations ranged from 64–144 ms. The largest of three click-to-DOM samples per phone was 22.1 ms / 37.1 ms. These small USB-localhost lab samples are not field INP, radio-network transfer or robust population p95 estimates. [Raw lab data](../qa-output/glasshouse-lab.json) and [device evidence](DEVICE-VALIDATION.md) retain the methods.

Planning 10,000 sessions, each freshly loading the entry and entire offline pack with 25% headroom, yields **63,602,570,000 bytes**. Other portfolio use is additional. See the [operating policy](OPERATIONS.md).

## Human qualification remains

The [qualification packet](QUALIFICATION-KIT.md) and [blank review records](../release/review-materials/README.md) prepare three independent content/rubric disciplines, ten intended users, NVDA/VoiceOver and remaining device/native export checks, the art/audio comparator, and owner review of intended-host rollback. Twenty engineering-authored calibration traces are ready; no independent ratings or participant results are claimed. [All 55 requirements](REQUIREMENTS-STATUS.md) distinguish implementation, pending qualification and G3/G4 work gated by the PRD.

The [release record](../release/qualification.json) remains on hold. No public deployment or participant contact occurred.
