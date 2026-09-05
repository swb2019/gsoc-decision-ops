# Hourglass Command — PRD 1.1 (Foolproof)

---

## Document Control

| Field              | Value                   |
| ------------------ | ----------------------- |
| **Document ID**    | PRD-HC-1.1              |
| **Version**        | 1.1 (Foolproof)         |
| **Status**         | Locked                  |
| **Owner**          | Shannon Brown           |
| **Approved By**    | Chief of Staff          |
| **Effective Date** | September 2026          |
| **Review Cycle**   | On material change only |

### Change History

| Version | Date     | Author        | Changes                                                                       |
| ------- | -------- | ------------- | ----------------------------------------------------------------------------- |
| 1.0     | Aug 2026 | Shannon Brown | Initial PRD                                                                   |
| 1.1     | Sep 2026 | Shannon Brown | Foolproof edition: 12 invariants, honesty threat model, closed defaults, RACI |

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

### Phase 2: Depth (Closed Until PRD 1.2)

- ⏸️ Additional scenarios
- ⏸️ Phase timer mode
- ⏸️ Session persistence
- ⏸️ Keyboard shortcuts

### Phase 3: Polish (Closed Until PRD 2.0)

- ⏸️ Custom scenario builder
- ⏸️ Scenario sharing
- ⏸️ Print optimization

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

| Term                | Definition                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **GSOC**            | Global Security Operations Center                                                                                                     |
| **ESRM**            | Enterprise Security Risk Management — ASIS International framework where asset owners own risk and security serves as trusted advisor |
| **Residual Risk**   | Risk remaining after treatment (accept/mitigate/transfer/avoid); must be explicit in decisions                                        |
| **Asset Owner**     | Business stakeholder who owns the risk; GSOC advises, asset owner decides                                                             |
| **Enterprise ESRM** | Category of enterprise platforms providing incident lifecycle management                                                              |
| **Posture**         | Operational stance: CONTINUE (accept), DEGRADE (mitigate), or PAUSE (avoid)                                                           |
| **Treatment**       | Risk response: accept, mitigate, transfer, or avoid — maps to postures                                                                |
| **Wedge**           | Market entry that complements rather than competes                                                                                    |
| **SaaS Theater**    | Non-functional features simulating enterprise software                                                                                |
| **Invariant**       | Rule that must always hold; violation = PR rejection                                                                                  |
| **Closed Default**  | Feature disabled until explicit PRD amendment                                                                                         |
| **RACI**            | Responsibility matrix: Responsible, Accountable, Consulted, Informed                                                                  |
| **P0**              | Priority 0 (must-have for release)                                                                                                    |
| **SOTA**            | State of the Art                                                                                                                      |
| **COP**             | Common Operating Picture — shared situational awareness across stakeholders                                                           |
| **RPD**             | Recognition-Primed Decision — Klein's naturalistic decision-making model                                                              |
| **AAR**             | After-Action Review — structured debrief: intended vs actual, sustains, improves                                                      |

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
