# Hourglass Command — PRD 1.4 (ESRM Textbook-Faithful)

---

## Document Control

| Field              | Value                         |
| ------------------ | ----------------------------- |
| **Document ID**    | PRD-HC-1.4                    |
| **Version**        | 1.4 (ESRM Textbook-Faithful)  |
| **Status**         | Locked                        |
| **Owner**          | Shannon Brown                 |
| **Approved By**    | Chief of Staff                |
| **Effective Date** | September 2026                |
| **Review Cycle**   | On material change only       |

### Change History

| Version | Date     | Author        | Changes                                                                                   |
| ------- | -------- | ------------- | ----------------------------------------------------------------------------------------- |
| 1.0     | Aug 2026 | Shannon Brown | Initial PRD                                                                               |
| 1.1     | Sep 2026 | Shannon Brown | Foolproof edition: 12 invariants, honesty threat model, closed defaults, RACI             |
| 1.2     | Sep 2026 | Shannon Brown | Max-port amendment: simulation systems, fast-casual tempo, in-game help                   |
| 1.3     | Sep 2026 | Shannon Brown | Max-depth: all simulation systems implemented, entity linking, playbook phases, Musk algo |
| 1.4     | Sep 2026 | Shannon Brown | ESRM textbook-faithful: complete cycle playable, all 4 treatments, advisor→owner workflow |

### Distribution

This PRD is public (MIT-licensed repository). No confidential information.

---

## §1 Executive Summary

**Hourglass Command** is a first-hour decision-quality training tool for corporate security operations leaders. It teaches structured judgment under incomplete information through synthetic vendor compromise scenarios.

| Attribute      | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| **Single Job** | Train first-hour decision quality                                                  |
| **Core Loop**  | Scenario → Facts/Assumptions/Unknowns → CONTINUE/DEGRADE/PAUSE → Playbook → Export |
| **Deployment** | Static site on GitHub Pages                                                        |
| **Auth**       | None (instant demo access)                                                         |
| **Data**       | Client-side only, no persistence                                                   |

---

## §1.1 Foundation Stack

This product is built on established workflow and risk management principles:

| Layer          | Foundation                              | Application                                                           |
| -------------- | --------------------------------------- | --------------------------------------------------------------------- |
| **Workflow**   | Enterprise incident management patterns | Decision log, timeline, ownership, escalation cues, COP               |
| **Risk**       | ASIS ESRM principles                    | Asset owner owns risk; GSOC = trusted advisor; residual risk explicit |
| **Pedagogy**   | Klein RPD, military AAR, HSEEP tabletop | Injects, structured debrief, treatment framing                        |
| **First-Hour** | NIST/CISA incident guidance             | Declare/Assess/Bridge/Brief/Learn phases                              |

**Training wedge position:** This simulation trains first-hour judgment through realistic scenarios — it complements enterprise incident management and ESRM programs.

---

## §2 Product Wedge

### What This Is

A **simulation game** for practicing first-hour decision-making under pressure:

```
┌────────────────────────────────────────────────────────┐
│             Hourglass Command Simulation               │
├────────────────────────────────────────────────────────┤
│  Briefing → Live Inject Clock → Decision Under         │
│  Pressure → Consequence Feedback → Debrief/AAR         │
└────────────────────────────────────────────────────────┘
```

### What This Is NOT

| NOT This                   | Because                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| Production incident system | Simulation for training; not a system of record                                   |
| Full ESRM suite            | Teaches ESRM principles; does not provide assessments, integrations, or reporting |
| Production SIEM            | No log ingestion, no threat detection                                             |
| Enterprise SaaS            | No auth, no billing, no multi-tenant                                              |

---

## §3 Users & JTBD

### Primary User

**GSOC Manager / Security Operations Lead**

- Manages 24/7 security operations center
- 5–15 years security experience
- Reports to CISO or VP Security

### Jobs to Be Done

| JTBD                             | Success Criteria                               |
| -------------------------------- | ---------------------------------------------- |
| Practice first-hour judgment     | Complete scenario in < 5 min                   |
| Separate facts from assumptions  | Document both with metadata                    |
| Make defensible posture calls    | Record CONTINUE/DEGRADE/PAUSE with rationale   |
| Follow structured playbook       | Complete checklist phases                      |
| Generate after-action docs       | Export in < 2 min                              |
| Frame risk in ESRM terms         | Decisions capture residual risk, asset owner   |
| Train alongside enterprise tools | Language/workflow familiar to enterprise users |

---

## §4 Core Loop (Immutable)

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ SELECT  │───▶│ ASSESS  │───▶│ DECIDE  │───▶│ FOLLOW  │───▶│ EXPORT  │
│Scenario │    │Facts/   │    │Posture  │    │Playbook │    │Report   │
│         │    │Assumps  │    │         │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

This loop is the product. The loop must not be broken.

---

## §5 Information Architecture (Locked)

```
/ (Home)
└── Scenario List
    └── /scenarios/[id]
        ├── Overview    (Facts, Assumptions, Unknowns, Actions, Timeline)
        ├── Decisions   (CONTINUE/DEGRADE/PAUSE with rationale)
        ├── Playbook    (60-min phases with checklists)
        └── Export      (Markdown/JSON download)
```

**IA Constraints:**

- No auth wall
- No sidebar navigation
- No dashboard
- No settings
- No multi-org

---

## §20 Invariants (12 Locks)

The following 12 invariants must **always** hold. Any PR violating an invariant must be rejected.

### Truthfulness Locks

| ID         | Invariant                                            | Violation Example                             |
| ---------- | ---------------------------------------------------- | --------------------------------------------- |
| **INV-01** | All scenarios are training simulations               | Implying real vendor data                     |
| **INV-02** | Quiet honesty: subtle footer/chip indicates training | Loud distracting banners that break immersion |
| **INV-03** | Simulation framing clear without wall of disclaimers | Production UI that implies system of record   |
| **INV-04** | Export includes training watermark                   | Clean exports that look official              |

### Anti-Theater Locks

| ID         | Invariant                | Violation Example                      |
| ---------- | ------------------------ | -------------------------------------- |
| **INV-05** | No authentication gates  | Sign-in/sign-up flows                  |
| **INV-06** | No pricing or billing UI | Tier tables, payment forms             |
| **INV-07** | No team/org management   | Invite flows, RBAC, workspace switcher |
| **INV-08** | No settings dashboards   | SSO config, API keys, preferences      |

### Honesty Locks

| ID         | Invariant                       | Violation Example                     |
| ---------- | ------------------------------- | ------------------------------------- |
| **INV-09** | Zero job-hunt framing in UI     | "Hire me" buttons, LinkedIn in app    |
| **INV-10** | No fake metrics or social proof | "10K users", "Trusted by Fortune 500" |
| **INV-11** | No production security claims   | "Enterprise-grade", "SOC 2 compliant" |
| **INV-12** | Factual author credentials only | Inflated tenure, fake certifications  |

---

## §6 P0 Acceptance Tests

Concrete acceptance criteria an engineer can verify:

### P0-01: Scenario List

```gherkin
GIVEN I am on the home page
WHEN the page loads
THEN I see ≥3 synthetic scenarios with name, severity, description
AND clicking any scenario navigates to /scenarios/[id]
```

### P0-02: Facts Entry

```gherkin
GIVEN I am on Overview tab
WHEN I click "+" in Facts section and submit description + source
THEN the fact appears in list with confidence level
```

### P0-03: Assumptions Entry

```gherkin
GIVEN I am on Overview tab
WHEN I click "+" in Assumptions section and submit description + basis + risk-if-wrong
THEN the assumption appears with risk-if-wrong displayed
```

### P0-04: Unknowns Entry

```gherkin
GIVEN I am on Overview tab
WHEN I click "+" in Unknowns section and submit question + priority
THEN the unknown appears with priority badge
```

### P0-05: Decision Recording

```gherkin
GIVEN I am on Decisions tab
WHEN I click "Record Decision" and select DEGRADE posture with title/description/rationale
THEN decision appears in list with DEGRADE badge
AND posture summary count for DEGRADE increments
```

### P0-06: Playbook Interaction

```gherkin
GIVEN I am on Playbook tab
WHEN I expand a phase and click checklist items
THEN items toggle checked/unchecked
AND progress counter updates
```

### P0-07: Export Download

```gherkin
GIVEN I am on Export tab
WHEN I click "Download Markdown"
THEN .md file downloads with scenario, decisions, facts, assumptions
WHEN I click "Download JSON"
THEN .json file downloads with same structured data
```

### P0-08: Two-Click Path

```gherkin
GIVEN I am on home page
WHEN I click scenario (1) then "Record Decision" (2)
THEN I can enter a decision
VERIFY: clicks from home to decision form = 2
```

### P0-09: Quiet Honesty

```gherkin
GIVEN I am on any page
THEN training nature is clear but not distracting
  - Subtle footer or chip indicates simulation
  - No loud banners breaking immersion
```

### P0-10: Static Build

```gherkin
GIVEN I run `npm run build`
WHEN build completes
THEN /apps/web/out/ contains static HTML
AND all routes pre-rendered without server code
```

---

## §7 Measurable Metrics

### Success Metrics (Measure These)

| Metric                   | Target  | Measurement                                |
| ------------------------ | ------- | ------------------------------------------ |
| Clicks to first decision | ≤ 2     | Manual: home → scenario → decision form    |
| Time to first posture    | ≤ 2 min | Stopwatch: page load → decision submitted  |
| Time to export           | ≤ 2 min | Stopwatch: scenario load → file downloaded |
| CI pass rate             | 100%    | GitHub Actions status                      |
| Test pass rate           | 100%    | 109/109 tests green                        |
| Lighthouse Performance   | ≥ 90    | Chrome DevTools audit                      |
| Lighthouse Accessibility | ≥ 90    | Chrome DevTools audit                      |

### Anti-Metrics (Do NOT Measure)

| Anti-Metric      | Why Harmful                                          |
| ---------------- | ---------------------------------------------------- |
| User sign-ups    | Implies auth exists (violates INV-05)                |
| MAU/DAU          | Implies tracking, optimizes engagement over training |
| Session duration | Engagement farming, not skill-building               |
| Feature count    | Encourages bloat over simplicity                     |
| Lines of code    | Deletion often better than addition                  |

---

## §8 Release Gate Checklist

Before merge to `main` or deploy to Pages, **all** gates must pass:

### Automated Gates (CI)

| Gate         | Command                | Pass Criteria          |
| ------------ | ---------------------- | ---------------------- |
| ☐ Format     | `npm run format:check` | Exit 0                 |
| ☐ Lint       | `npm run lint`         | Exit 0                 |
| ☐ TypeScript | `npm run typecheck`    | Exit 0                 |
| ☐ Tests      | `npm test`             | 109 passing            |
| ☐ Build      | `npm run build`        | Static export succeeds |

### Manual Gates (PR Review)

| Gate                     | Verification                           |
| ------------------------ | -------------------------------------- |
| ☐ PRD present            | `docs/PRD.md` exists, version ≥ 1.1    |
| ☐ PRD linked             | README references PRD                  |
| ☐ No auth added          | No sign-in/sign-up routes              |
| ☐ No pricing added       | No /pricing or tier UI                 |
| ☐ No SaaS theater        | No team/settings/billing/org UI        |
| ☐ Quiet honesty present  | Subtle training indicator visible      |
| ☐ No distracting banners | Immersion not broken by disclaimers    |
| ☐ 2-click path works     | Home → Scenario → Decision in 2 clicks |
| ☐ Mobile works           | Core loop on 375px viewport            |
| ☐ Invariants respected   | All 12 invariants verified             |

---

## §9 Honesty Threat Model

Ways this product could mislead employers, with explicit mitigations:

### Threat 9.1: Fake SaaS Product

| Attack Vector      | Misleading Because                   | Mitigation                |
| ------------------ | ------------------------------------ | ------------------------- |
| Auth flows         | Implies multi-user production system | **INV-05** blocks forever |
| Pricing page       | Implies commercial product           | **INV-06** blocks forever |
| Team management    | Implies enterprise deployment        | **INV-07** blocks forever |
| Settings dashboard | Implies configurable SaaS            | **INV-08** blocks forever |

### Threat 9.2: Fake Metrics

| Attack Vector  | Misleading Because                    | Mitigation        |
| -------------- | ------------------------------------- | ----------------- |
| User counters  | "10K users" implies real adoption     | **INV-10** blocks |
| Company logos  | "Trusted by X" implies enterprise use | **INV-10** blocks |
| Activity feeds | Implies real user activity            | **INV-10** blocks |

### Threat 9.3: Overclaiming Scope

| Attack Vector          | Misleading Because            | Mitigation        |
| ---------------------- | ----------------------------- | ----------------- |
| "Enterprise-grade"     | Implies security audit        | **INV-11** blocks |
| "SOC 2 compliant"      | Implies certification         | **INV-11** blocks |
| "Integrates with SIEM" | Implies production capability | **INV-11** blocks |
| "Real-time monitoring" | Implies live data             | **INV-01** blocks |

### Threat 9.4: Overclaiming Credentials

| Attack Vector           | Misleading Because             | Mitigation                                    |
| ----------------------- | ------------------------------ | --------------------------------------------- |
| Inflated tenure         | "10 years SOC" when false      | **INV-12** requires factual only              |
| Fake certs              | Listing certs not held         | **INV-12** requires factual only              |
| "Built enterprise SIEM" | Simulation ≠ production system | **INV-02, INV-03** make training nature clear |

### Threat 9.5: Job-Hunt Pollution

| Attack Vector      | Misleading Because                    | Mitigation        |
| ------------------ | ------------------------------------- | ----------------- |
| "Hire me" CTAs     | Turns demo into job ad                | **INV-09** blocks |
| LinkedIn in header | Primary purpose looks like job search | **INV-09** blocks |
| "Open to work"     | Desperate framing                     | **INV-09** blocks |

### Threat 9.6: Production-Looking UI

| Attack Vector      | Misleading Because           | Mitigation                                 |
| ------------------ | ---------------------------- | ------------------------------------------ |
| Overly polished UI | "This must be real"          | **INV-02, INV-03** quiet honesty indicator |
| Clean exports      | Look like real incident docs | **INV-04** requires training watermark     |
| Custom domain      | Implies real product         | Use github.io subdomain                    |

---

## §10 Closed Defaults

Features that are **closed by default** — require explicit PRD amendment to open:

| Feature                        | Default | Rationale                     | Open Condition                              |
| ------------------------------ | ------- | ----------------------------- | ------------------------------------------- |
| Production incident management | CLOSED  | Training only, not production | Never (invariant)                           |
| Phase timer / countdown mode   | OPEN    | Core to simulation pressure   | Implemented in 1.2                          |
| "Featured" badge on scenarios  | CLOSED  | Wait until UI SOTA ships      | After UI SOTA merged, demo-appropriate only |
| Local storage persistence      | CLOSED  | Adds state complexity         | PRD 1.2+ if training value proven           |
| Custom scenario builder        | CLOSED  | Scope creep risk              | PRD 2.0+                                    |
| Keyboard shortcuts             | CLOSED  | Nice-to-have                  | PRD 1.2+                                    |
| Print stylesheet               | CLOSED  | Nice-to-have                  | PRD 1.2+                                    |

---

## §10.1 Amendment: Simulation Systems (PRD 1.2)

**Effective:** September 2026  
**Approved by:** Chief of Staff

### Intent

Port **maximum enterprise incident management system functionality** as original Hourglass Command simulation mechanics. These systems create Sim City-class depth while maintaining fast-casual mobile gameplay through progressive disclosure.

### Simulation Systems (All Implemented ✅)

| System                   | Description                                                        | UX Approach                                  | Status  |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------- | ------- |
| **COP / Shared Picture** | Cross-domain situational awareness (Physical + Intel + Cyber)      | Domain badges, fusion indicators, triage     | ✅ Done |
| **Dispatch Pressure**    | Abstracted resource availability, contention, cooldowns            | Resource tokens, NORMAL/STRAINED/CRITICAL    | ✅ Done |
| **Triage & Routing**     | Prioritization queue, urgency sorting, attention allocation        | IMMEDIATE/URGENT/ROUTINE badges, sorted feed | ✅ Done |
| **Guided Playbooks**     | 5-phase progression (Assessment→Bridge→Continuity→Info→Checkpoint) | Phase tracker, time-based progression        | ✅ Done |
| **Entity Links**         | People, places, assets, orgs, systems connected across injects     | Entity map, highlight-on-select, chips       | ✅ Done |
| **ESRM Cascades**        | Advisor/owner model, residual risk, cascade multipliers            | Asset selection, owner briefing, scoring     | ✅ Done |
| **Escalation Path**      | ACTIVITY → INCIDENT → INVESTIGATION with score multipliers         | Header indicator, 1.0x → 1.25x → 1.5x        | ✅ Done |
| **Audit Timeline / AAR** | Chronological decision log, structured debrief, exportable         | Timeline view, grade calculation, MD export  | ✅ Done |

### Systems NOT Ported (Production Scope)

The following remain **permanently closed** per invariants:

| Excluded System       | Reason                                             |
| --------------------- | -------------------------------------------------- |
| Real CAD/PSIM/ACS     | Requires production integrations (violates INV-11) |
| Production case suite | System of record scope (violates INV-01, INV-03)   |
| SSO / billing         | SaaS theater (violates INV-05, INV-06)             |
| Live data connectors  | Production capability claims (violates INV-11)     |

### UI/UX Requirements

| Requirement                | Specification                                                   |
| -------------------------- | --------------------------------------------------------------- |
| **Fast-casual tempo**      | First inject within ~15 seconds, dense cadence every 20-45s     |
| **Glanceable surface**     | "What's urgent?" and "What do I do next?" answered in <1 second |
| **One primary action**     | Single clear CTA per moment; tap targets ≥44px                  |
| **Progressive disclosure** | Depth revealed through play; no tutorial walls                  |
| **In-game Field Guide**    | Help panel covering core loop, postures, ESRM, domains, scoring |
| **Coach marks**            | Dismissible first-run hints; non-blocking                       |
| **Mobile-first**           | Bottom tabs (Intel/Decision/COP); desktop same mental model     |

### Naming Constraint

**CRITICAL:** The product name for these systems is **Hourglass Command**. The term "Resolver" must **never** appear in:

- UI text or labels
- README or documentation
- User-facing help content
- Marketing or descriptive copy

This is an original simulation built on enterprise incident management patterns, not a clone or derivative.

---

## §10.2 Amendment: ESRM Textbook-Faithful Enhancement (PRD 1.4)

**Effective:** September 2026  
**Approved by:** Chief of Staff

### Intent

Elevate Hourglass Command to **leading ESRM textbook-faithful** status by implementing the complete ESRM cycle as playable mechanics, per ASIS guidelines and Allen & Loyear's *Enterprise Security Risk Management* textbooks.

### ESRM Cycle Practiced In-Sim (Must Be Playable)

| Cycle Step | In-Sim Implementation | Status |
| --- | --- | --- |
| 1. Context | Scenario framing, learning objective | ✅ Done |
| 2. Identify & Prioritize Assets | Asset selection with criticality/owner | ✅ Done |
| 3. Identify & Prioritize Risks | T×V×I quick view, risk level calculation | ✅ Done |
| 4. Treat | All 4 treatments playable: Accept/Mitigate/Transfer/Avoid | ✅ Done |
| 5. Advisor → Asset Owner | Briefing workflow, affirmation, governance reminder | ✅ Done |
| 6. Response & Review | AAR with lessons learned, continuous improvement | ✅ Done |

### New Features (PRD 1.4)

| Feature | Description | UX Approach |
| --- | --- | --- |
| **Risk Matrix Quick View** | T×V×I assessment visible before treatment decision | Compact 3-panel display in Decision Console |
| **TRANSFER Treatment** | Fourth ESRM treatment now playable (shift to third party) | Fourth button in treatment grid |
| **Advisor → Owner Workflow** | Explicit handoff steps with affirmation tracking | Stepped workflow with governance reminder |
| **ESRM Field Guide** | Textbook-structured chapters covering full cycle | 8 chapters: Overview, Cycle, Assets, Risks, Treatments, Advisor, Response, Scoring |
| **Lessons Learned AAR** | Continuous improvement tracking in debrief | Sustains/improves with specific ESRM feedback |

### ESRM Textbook References

This implementation draws from:
- ASIS International ESRM Guidelines (2019)
- Allen & Loyear, *Enterprise Security Risk Management: Concepts and Applications*
- Loyear, *Enterprise Security Risk Management in the Real World*

---

## §10.3 Musk 5-Step Algorithm Application (PRD 1.3)

**Effective:** September 2026  
**Approach:** Applied Elon Musk's 5-step engineering algorithm systematically to maximize simulation depth while eliminating waste.

### Step 1: Make Requirements Less Dumb

| Original Requirement      | Challenge Applied                           | Outcome                                            |
| ------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Session persistence       | Does it improve first-hour training?        | DELETED — adds complexity, breaks instant access   |
| User preferences settings | Who asked for this?                         | DELETED — vanity SaaS theater                      |
| Tutorial wizard           | Can players learn by doing?                 | REPLACED with Field Guide + coach marks            |
| Scenario difficulty modes | Does fidelity trump accessibility?          | KEPT — escalation level naturally increases depth  |
| Full checklist management | Is checkbox ticking the training objective? | SIMPLIFIED — phase progression replaces checklists |

### Step 2: Delete

| Deleted Item                | Rationale                                           |
| --------------------------- | --------------------------------------------------- |
| Scenario builder UI         | Scope creep; scenarios are authored, not configured |
| Multi-org / team management | SaaS theater (INV-07)                               |
| Notification preferences    | No auth = no notifications to configure             |
| Analytics dashboard         | Engagement farming (Anti-Metric §7)                 |
| Export format selector      | Markdown + JSON sufficient; no PDF/DOCX generation  |
| Verbose onboarding flow     | Fast-casual tempo means instant engagement          |
| Separate "Learn" mode       | All play is training; no artificial separation      |

### Step 3: Simplify / Optimize

| Original Design                | Simplified To                                          |
| ------------------------------ | ------------------------------------------------------ |
| 5 playbook phases with gates   | Time-based phase progression (no blocking gates)       |
| Complex resource allocation UI | Simple token display with contention states            |
| Entity relationship editor     | Read-only entity map with highlight-on-select          |
| Multi-select asset targeting   | Single asset selection per decision                    |
| Branching playbook paths       | Linear 60-minute timeline                              |
| Detailed scoring breakdown     | Score popup + debrief summary (progressive disclosure) |

### Step 4: Accelerate Cycle Time

| Optimization                      | Impact                                 |
| --------------------------------- | -------------------------------------- |
| First inject at 15 seconds        | Immediate engagement, no waiting       |
| Auto-queue next inject            | No dead air between decisions          |
| 45-second decision timer          | Pressure without paralysis             |
| Phase transitions without prompts | Continuous flow, no interruptions      |
| Entity chips on inject cards      | Context at a glance, no modal required |
| Keyboard shortcuts (C/D/P)        | Power users skip mouse interaction     |

### Step 5: Automate (Last)

| Automation                     | Implemented After Manual Proved Value        |
| ------------------------------ | -------------------------------------------- |
| Triage queue sorting           | Player understands priority; system enforces |
| Resource cooldown regeneration | Predictable timing, no manual tracking       |
| Phase progression              | Time-based, deterministic                    |
| Escalation level calculation   | Automatic based on inject/decision counts    |
| Cascade multiplier application | Score calculation is transparent             |

**NOT Automated (Preserves Human Judgment):**

- Asset selection — player must identify what's at risk
- Asset owner briefing — player chooses when to communicate
- Posture decision — player owns the risk treatment choice
- Residual risk documentation — player articulates remaining risk

---

## §11 Non-Goals (Permanently Closed)

The following are **permanently out of scope** per invariants:

### Authentication & Identity

- ❌ User registration
- ❌ Sign-in / sign-out
- ❌ Password management
- ❌ OAuth / SSO
- ❌ Session management

### Pricing & Billing

- ❌ Pricing pages
- ❌ Payment processing
- ❌ Subscription management
- ❌ Usage metering

### Team & Organization

- ❌ Team invitations
- ❌ RBAC / permissions
- ❌ Org management
- ❌ Workspace switching

### Settings & Configuration

- ❌ User preferences
- ❌ Integration config
- ❌ API key management
- ❌ Webhook setup

### Analytics & Dashboards

- ❌ Usage analytics
- ❌ Decision statistics
- ❌ Activity feeds
- ❌ Audit logs

### Production Security

- ❌ Real threat feeds
- ❌ SIEM integration
- ❌ Live monitoring
- ❌ Case management

---

## §12 RACI Matrix

| Activity              | Shannon (Owner)     | Reviewer            | CI                |
| --------------------- | ------------------- | ------------------- | ----------------- |
| PRD changes           | **A** (Accountable) | **R** (Responsible) | —                 |
| Code changes          | **R**               | **A**               | **C** (Consulted) |
| Invariant enforcement | **A**               | **R**               | **I** (Informed)  |
| Release approval      | **A**               | **R**               | **C**             |
| UI/UX decisions       | **A**               | **C**               | —                 |
| Scenario content      | **A**               | **C**               | —                 |

**Legend:**

- **R** = Responsible (does the work)
- **A** = Accountable (final decision)
- **C** = Consulted (input before decision)
- **I** = Informed (notified after decision)

---

## §13 Roadmap

### Phase 1: Foundation (Complete)

- ✅ Core decision loop
- ✅ Synthetic scenarios (3)
- ✅ Playbook framework
- ✅ Export (Markdown/JSON)
- ✅ Static deployment
- ✅ SOTA UI elevation
- ✅ PRD 1.1 (Foolproof)

### Phase 2: Simulation Systems (PRD 1.3 — Complete)

- ✅ Fused GSOC scenarios (Physical + Intel + Cyber)
- ✅ ESRM framework with asset owners
- ✅ Fast-casual tempo (first inject ~15s)
- ✅ COP / shared picture with domain fusion
- ✅ Dispatch pressure (resource contention, cooldowns, CRITICAL/STRAINED/NORMAL states)
- ✅ Triage & routing (priority queue sorted by IMMEDIATE/URGENT/ROUTINE)
- ✅ Entity links across injects (PERSON/PLACE/ASSET/ORG/SYSTEM with visual graph)
- ✅ Escalation path indicators (ACTIVITY → INCIDENT → INVESTIGATION with cascade multipliers)
- ✅ In-game Field Guide (8 sections: Loop, Playbook, Entities, Resources, Postures, Domains, ESRM, Scoring)
- ✅ Guided playbook phases (5-phase progression: Assessment → Bridge → Continuity → Information → Checkpoint)
- ✅ ESRM cascades (treatment outcomes affect COP, scoring multipliers)
- ⏸️ Session persistence (CLOSED — adds state complexity per §10)
- ⏸️ Keyboard shortcuts (implemented for postures C/D/P, CLOSED for expansion)

### Phase 3: Polish (Closed Until PRD 2.0)

- ⏸️ Custom scenario builder — CLOSED per §10 (scope creep risk)
- ⏸️ Scenario sharing — CLOSED (requires persistence)
- ⏸️ Print optimization — CLOSED (nice-to-have)

---

## §14 Risks

| Risk                       | Likelihood | Impact | Mitigation                        |
| -------------------------- | ---------- | ------ | --------------------------------- |
| Scope creep (SaaS theater) | Medium     | High   | 12 invariants, explicit non-goals |
| Invariant violation in PR  | Low        | High   | Release gate checklist            |
| Performance regression     | Low        | Medium | Lighthouse CI integration         |
| Accessibility regression   | Low        | High   | Manual gate + future automation   |

---

## §15 Glossary

| Term                       | Definition                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **GSOC**                   | Global Security Operations Center                                                                                                     |
| **ESRM**                   | Enterprise Security Risk Management — ASIS International framework where asset owners own risk and security serves as trusted advisor |
| **Residual Risk**          | Risk remaining after treatment (accept/mitigate/transfer/avoid); must be explicit in decisions                                        |
| **Asset Owner**            | Business stakeholder who owns the risk; GSOC advises, asset owner decides                                                             |
| **Enterprise ESRM**        | Category of enterprise platforms providing incident lifecycle management                                                              |
| **Posture**                | Operational stance: CONTINUE (accept), DEGRADE (mitigate), or PAUSE (avoid)                                                           |
| **Treatment**              | Risk response: accept, mitigate, transfer, or avoid — maps to postures                                                                |
| **Wedge**                  | Market entry that complements rather than competes                                                                                    |
| **SaaS Theater**           | Non-functional features simulating enterprise software                                                                                |
| **Invariant**              | Rule that must always hold; violation = PR rejection                                                                                  |
| **Closed Default**         | Feature disabled until explicit PRD amendment                                                                                         |
| **RACI**                   | Responsibility matrix: Responsible, Accountable, Consulted, Informed                                                                  |
| **P0**                     | Priority 0 (must-have for release)                                                                                                    |
| **SOTA**                   | State of the Art                                                                                                                      |
| **COP**                    | Common Operating Picture — shared situational awareness across stakeholders                                                           |
| **RPD**                    | Recognition-Primed Decision — Klein's naturalistic decision-making model                                                              |
| **AAR**                    | After-Action Review — structured debrief: intended vs actual, sustains, improves                                                      |
| **Dispatch Pressure**      | Abstracted resource availability, response times, and attention allocation in simulation                                              |
| **Triage**                 | Prioritization of injects based on urgency and domain impact                                                                          |
| **Entity Link**            | Cross-reference between people, places, and assets across multiple injects                                                            |
| **Escalation Path**        | Activity → Incident → Investigation progression indicating severity                                                                   |
| **Fused GSOC**             | Cross-domain operations integrating Physical Security, Intelligence, and Cybersecurity                                                |
| **Domain**                 | Security lane: PHYSICAL (access, surveillance), INTELLIGENCE (threat intel), or CYBER (network, endpoint)                             |
| **Progressive Disclosure** | UX pattern revealing complexity through play rather than upfront                                                                      |
| **Fast-Casual**            | Game tempo designed for quick engagement without sacrificing depth                                                                    |

---

## §16 References

- Musk's 5-Step Engineering Algorithm (Everyday Astronaut, 2021)
- NIST Cybersecurity Framework
- ASIS International ESRM Guidelines

---

## §17 Approval

| Role           | Name          | Date     | Signature         |
| -------------- | ------------- | -------- | ----------------- |
| Owner          | Shannon Brown | Sep 2026 | /s/ Shannon Brown |
| Chief of Staff | —             | Sep 2026 | Approved          |

---

_PRD 1.1 (Foolproof) — Locked. Changes require version increment, invariant review, and stakeholder sign-off._
