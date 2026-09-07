# Engineering validation — 6 September 2026

The Glasshouse engineering candidate passes the automated checks below. These results qualify specific software behavior; they do not complete the PRD human gates or establish learning efficacy. The delivery manifest identifies the exact source revision and archive checksums. The tested static pack is `98200f6986b10efa88ee4960`, scoped to `/gsoc-decision-ops/`.

## Completed checks

| Check                    | Result and meaningful scope                                                                                                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and semantic tests  | 425 passed across 18 files. Includes legacy accounting/seed/queue repair, three defensible strategies, 1,000 seeds, a 20-event burst, exact treatments, known-then actor evidence, approval/resources, rejected-action receipts, complete-state restoration, immutable reports, hostile imports and redaction.   |
| Browser journeys         | 26 passed in Windows headless Chrome 152 against the production static build and its published path. Includes all legacy regressions, full Preview continuation and handoff, Guided/Independent modes, same-horizon quick fork, drafts, active-time attribution, multiple tabs and explicit takeover.            |
| Storage and offline      | Real IndexedDB transactions, failed/quota writes, stale writer, corrupt byte recovery, isolated deletion, complete verified pack, cancellation/eviction and network-off reload followed by a decision and PDF export.                                                                                            |
| Reports                  | A 100-decision fixture retains searchable PDF text and complete HTML/JSON semantics. Long decisions continue with their ID; the generated long PDF and representative print-size pages were inspected. PDF accessibility tagging remains unqualified; HTML is the canonical accessible version.                  |
| Accessibility and layout | No automated axe violations on tested launch, command and completed-review journeys. Keyboard, reduced motion, 320px/390px layouts and a 390px journey at 200% text pass. Additional CSS inspection covered 320px enlarged review. Manual assistive technology and physical-device qualification remain pending. |
| Graphics resilience      | Original native Three.js geometry renders. Ten repeated load/exit cycles stay within a bounded 12 MiB JavaScript-heap regression budget. Forced WebGL loss and failed lazy assets preserve the schematic, existing decision and subsequent action. This is not a physical GPU-memory certification.              |
| Build hygiene            | Production static export, core/web TypeScript checks, ESLint with no errors, full repository formatting check and whitespace-diff check pass.                                                                                                                                                                    |

Browser and unit checks include regressions prompted by independent AI-assisted review. Human domain reviewers remain independent of this engineering evidence.

## Measured artifact and local lab

The static export is 19,074,116 bytes, including preserved legacy assets. The complete flagship offline pack contains 55 files totaling 4,014,185 bytes. The statically referenced initial entry is 1,033,064 uncompressed bytes; Next reports 224 kB first-load JavaScript. These are different measures and must not be conflated with transferred compressed bytes on a real host.

Five fresh localhost browser contexts produced LCP observations of 316, 104, 76, 84 and 84 ms (median 84 ms), with CLS 0 and no page errors. The measured resource bodies were approximately 932,842 bytes, excluding the document navigation. These measurements use Windows headless Chrome 152, localhost and software graphics; they are descriptive lab data, not field performance or proof that named phone tiers pass. No INP or physical-device claim is made.

The release budget assumes every one of 10,000 planned sessions freshly loads the entry and downloads the entire offline pack, with 25% headroom: approximately 63.1 GB. Other portfolio/legacy use is additional. See [operating policy and hosting source](OPERATIONS.md).

## Work still required before public qualification

Three independent physical-security/cyber/exercise reviewers, the ten-user formative protocol, named NVDA/VoiceOver and physical-device journeys, the schematic/3D art and audio comparator, and the staged rollback rehearsal remain pending. The [qualification packet](QUALIFICATION-KIT.md) makes those activities concrete. [All 55 requirements](REQUIREMENTS-STATUS.md) distinguish implemented mechanisms, pending qualification and explicitly deferred G3/G4 work.

The [release record](../release/qualification.json) remains on hold. No source was pushed, public site replaced, participant contacted, analytics enabled or paid service provisioned as part of this delivery.
