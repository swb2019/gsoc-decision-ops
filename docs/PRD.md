# GSOC Decision Ops — PRD 1.1 (Foolproof)

**Version:** 1.1 (Locked with Shannon, Chief of Staff approved)
**Status:** Release-gated
**Last Updated:** September 2026

---

## 1. Product Wedge

### What This Is

GSOC Decision Ops is a **first-hour decision-quality training tool** for corporate security operations leaders. It trains structured judgment under incomplete information through synthetic vendor compromise scenarios.

**Single Job:** Build muscle memory for making defensible decisions in the critical first hour of a vendor-adjacent security incident.

### What This Is NOT

| This Product                  | Is NOT                         |
| ----------------------------- | ------------------------------ |
| Training wedge                | Resolver-class ESRM platform   |
| Skill-building tool           | Production incident management |
| Synthetic scenarios           | Live threat intelligence       |
| Decision methodology practice | SIEM/SOAR replacement          |
| Portfolio demonstration       | Enterprise SaaS product        |

**Explicit positioning:** This sits BESIDE enterprise security tools (Resolver, ServiceNow SecOps, Splunk SOAR) as a training complement. It does not compete with, replace, or claim equivalence to production security platforms.

### The Gap It Fills

GSOC leaders learn first-hour judgment through:

1. **On-the-job exposure** — High stakes, no practice reps
2. **Tabletop exercises** — $5K–$50K per session, quarterly at best
3. **Compliance training** — Checkbox content, not skill-building

**This tool provides:** Zero-cost, on-demand, repeatable practice of the core skill — separating facts from assumptions and documenting CONTINUE/DEGRADE/PAUSE posture decisions.

### Core Loop (Immutable)

```
SELECT scenario → DOCUMENT facts/assumptions/unknowns →
DECIDE posture (CONTINUE/DEGRADE/PAUSE) → FOLLOW playbook → EXPORT report
```

This loop is the product. Everything else is UI around this loop.

---

## 2. Invariants

The following must **always** hold. Any PR that violates an invariant must be rejected.

### 2.1 Truthfulness Invariants

| ID  | Invariant                                    | Violation Example                |
| --- | -------------------------------------------- | -------------------------------- |
| T1  | All scenarios are explicitly synthetic       | Implying real vendor data        |
| T2  | "Portfolio Demo" badge visible on all pages  | Hiding demo nature               |
| T3  | Training mode banner on scenario workspace   | Implying production use          |
| T4  | No production security claims in UI or docs  | "Enterprise-grade security"      |
| T5  | Export watermark indicates training exercise | Clean exports that look official |

### 2.2 Honesty Invariants

| ID  | Invariant                                | Violation Example                        |
| --- | ---------------------------------------- | ---------------------------------------- |
| H1  | Zero job-hunt framing in product UI      | "Hire me" buttons, LinkedIn links in app |
| H2  | Zero "open to work" language in product  | "Looking for opportunities" text         |
| H3  | No inflated metrics or vanity dashboards | "10,000 decisions logged" counters       |
| H4  | No fake social proof                     | "Trusted by Fortune 500" claims          |
| H5  | Author credit is factual only            | Overclaiming SOC/SIEM tenure             |

### 2.3 Architecture Invariants

| ID  | Invariant               | Violation Example                      |
| --- | ----------------------- | -------------------------------------- |
| A1  | No authentication gates | Sign-in/sign-up flows                  |
| A2  | No server-side code     | API routes, database calls             |
| A3  | Static export must work | Features requiring SSR                 |
| A4  | GitHub Pages deployment | Platform-specific hosting              |
| A5  | Core loop preserved     | Removing scenario/decision/export flow |

### 2.4 Anti-Theater Invariants

| ID  | Invariant              | Violation Example                      |
| --- | ---------------------- | -------------------------------------- |
| S1  | No pricing pages       | Tier comparison tables                 |
| S2  | No billing UI          | Payment forms, subscription management |
| S3  | No team management     | Invite flows, role assignment          |
| S4  | No settings dashboards | SSO config, API key panels             |
| S5  | No fake multi-org      | Workspace switchers, org dropdowns     |

---

## 3. Release Gates

Before any merge to `main` or deploy to Pages, **all** gates must pass:

### 3.1 CI Gates (Automated)

| Gate       | Command                | Pass Criteria            |
| ---------- | ---------------------- | ------------------------ |
| TypeScript | `npm run typecheck`    | Exit code 0, no errors   |
| ESLint     | `npm run lint`         | Exit code 0, no errors   |
| Prettier   | `npm run format:check` | Exit code 0, no warnings |
| Tests      | `npm test`             | 109 tests passing        |
| Build      | `npm run build`        | Static export succeeds   |

### 3.2 PRD Gates (Manual)

| Gate              | Verification                                   |
| ----------------- | ---------------------------------------------- |
| PRD present       | `docs/PRD.md` exists and is linked from README |
| PRD version       | Header shows "PRD 1.1" or higher               |
| Invariants listed | Section 2 present with all invariant tables    |

### 3.3 Honesty Gates (Manual)

| Gate                    | Verification                                |
| ----------------------- | ------------------------------------------- |
| No auth added           | No sign-in/sign-up routes or components     |
| No pricing added        | No `/pricing` route or tier UI              |
| No SaaS theater         | No team/settings/billing/org-switcher UI    |
| Demo badge visible      | "Portfolio Demo" or equivalent on home page |
| Training banner visible | Warning banner on scenario workspace        |

### 3.4 UX Gates (Manual)

| Gate             | Verification                                               |
| ---------------- | ---------------------------------------------------------- |
| 2-click decision | Home → Scenario → Record Decision in 2 clicks              |
| 2-min export     | Complete scenario to export in under 2 minutes             |
| Mobile works     | Core loop functional on 375px viewport                     |
| Pages demo loads | `https://swb2019.github.io/gsoc-decision-ops/` returns 200 |

---

## 4. Testable P0s

Concrete acceptance criteria an engineer can verify:

### P0-1: Scenario Selection

```
GIVEN I am on the home page
WHEN the page loads
THEN I see a list of at least 3 synthetic scenarios
AND each scenario shows name, severity badge, and description
AND clicking a scenario navigates to /scenarios/[id]
```

### P0-2: Facts Documentation

```
GIVEN I am on a scenario's Overview tab
WHEN I click the "+" button in the Facts section
THEN a form appears with fields for description and source
WHEN I fill both fields and click "Add Fact"
THEN the fact appears in the list with confidence level shown
```

### P0-3: Assumptions Documentation

```
GIVEN I am on a scenario's Overview tab
WHEN I click the "+" button in the Assumptions section
THEN a form appears with fields for description, basis, and risk-if-wrong
WHEN I fill all fields and click "Add Assumption"
THEN the assumption appears with risk-if-wrong displayed
```

### P0-4: Decision Recording

```
GIVEN I am on a scenario's Decisions tab
WHEN I click "Record Decision"
THEN a form appears with title, posture selection (CONTINUE/DEGRADE/PAUSE), description, and rationale fields
WHEN I select DEGRADE posture and fill all fields
THEN the decision appears in the list with DEGRADE badge and timestamp
AND the posture summary count for DEGRADE increments by 1
```

### P0-5: Playbook Interaction

```
GIVEN I am on a scenario's Playbook tab
WHEN I click on a collapsed phase
THEN the phase expands showing objectives, key questions, and checklist
WHEN I click a checklist item
THEN it toggles between checked and unchecked state
AND the progress counter updates accordingly
```

### P0-6: Export Generation

```
GIVEN I am on a scenario's Export tab
WHEN I click "Download Markdown"
THEN a .md file downloads containing scenario title, decisions, facts, assumptions, and timeline
WHEN I click "Download JSON"
THEN a .json file downloads with structured data matching the same content
```

### P0-7: Two-Click Path

```
GIVEN I am on the home page
WHEN I click on any scenario (click 1)
AND I click "Record Decision" button (click 2)
THEN I can immediately enter a decision
VERIFY: Total clicks from home to decision form = 2
```

### P0-8: Mobile Responsiveness

```
GIVEN viewport width is 375px (iPhone SE)
WHEN I navigate home → scenario → decisions → record decision
THEN all UI is usable without horizontal scrolling
AND tap targets are at least 44x44px
AND text is readable without zooming
```

### P0-9: Demo Visibility

```
GIVEN I am on any page of the application
THEN I can see indication this is a demo/portfolio project
ON home page: "Portfolio Demo" badge in header
ON scenario page: "Training Mode" banner below header
```

### P0-10: Static Export

```
GIVEN I run `npm run build`
WHEN the build completes
THEN /apps/web/out/ contains static HTML files
AND the files can be served by any static host without server-side code
AND all routes are pre-rendered (/, /scenarios/[each-id])
```

---

## 5. Honesty Threat Model

Ways this product/docs/UI could mislead employers, and explicit mitigations:

### Threat 5.1: Fake SaaS Product

| Threat             | How It Misleads                      | Mitigation                                 |
| ------------------ | ------------------------------------ | ------------------------------------------ |
| Auth flows         | Implies production multi-user system | **Invariant A1:** No auth gates, ever      |
| Pricing page       | Implies commercial product           | **Invariant S1:** No pricing UI, ever      |
| Team management    | Implies enterprise deployment        | **Invariant S3:** No team UI, ever         |
| Settings dashboard | Implies configurable SaaS            | **Invariant S4:** No settings panels, ever |

### Threat 5.2: Fake Metrics / Social Proof

| Threat         | How It Misleads                       | Mitigation                                     |
| -------------- | ------------------------------------- | ---------------------------------------------- |
| User counters  | "10K users" implies real adoption     | **Invariant H3:** No vanity metrics in UI      |
| Company logos  | "Trusted by X" implies enterprise use | **Invariant H4:** No fake social proof         |
| Activity feeds | Implies real user activity            | **Invariant H3:** No activity/audit dashboards |
| Star counts    | Implies community validation          | Display only real GitHub stars, unmodified     |

### Threat 5.3: Overclaiming Technical Scope

| Threat                 | How It Misleads                    | Mitigation                                |
| ---------------------- | ---------------------------------- | ----------------------------------------- |
| "Enterprise-grade"     | Implies production security review | **Invariant T4:** No production claims    |
| "SOC 2 compliant"      | Implies audit certification        | Never claim compliance certifications     |
| "Integrates with SIEM" | Implies production capability      | **Invariant T4:** No integration claims   |
| "Real-time monitoring" | Implies live threat data           | **Invariant T1:** All scenarios synthetic |

### Threat 5.4: Overclaiming Author Credentials

| Threat              | How It Misleads                        | Mitigation                       |
| ------------------- | -------------------------------------- | -------------------------------- |
| Inflated tenure     | "10 years SOC experience" when false   | Factual bio only in README       |
| Fake certifications | Listing certs not held                 | Only list verifiable credentials |
| Implied seniority   | "Built enterprise SIEM" when demo only | Clear "Portfolio Demo" framing   |

### Threat 5.5: Job-Hunt Framing in Product

| Threat             | How It Misleads                          | Mitigation                                     |
| ------------------ | ---------------------------------------- | ---------------------------------------------- |
| "Hire me" CTAs     | Turns demo into job ad                   | **Invariant H1:** Zero job-hunt UI             |
| LinkedIn in header | Implies primary purpose is job search    | Contact info in README only, not app           |
| "Open to work"     | Desperate framing undermines credibility | **Invariant H2:** Zero "open to work" language |

### Threat 5.6: UI That Looks Like Production

| Threat                  | How It Misleads                      | Mitigation                          |
| ----------------------- | ------------------------------------ | ----------------------------------- |
| Overly polished UI      | "This must be real software"         | Demo badge always visible           |
| No training watermark   | Exports look like real incident docs | Export includes training disclaimer |
| Production-style domain | Custom domain implies real product   | Use github.io subdomain             |

---

## 6. Non-Goals

The following are **explicitly out of scope** and must never be added:

### 6.1 Authentication & Identity

- ❌ User registration / sign-up
- ❌ User authentication / sign-in
- ❌ Password management
- ❌ Session handling
- ❌ OAuth / SSO integration
- ❌ "Remember me" functionality

**Why:** Authentication adds friction, implies multi-user SaaS, and serves no training purpose.

### 6.2 Pricing & Billing

- ❌ Pricing page or tier comparison
- ❌ Payment processing
- ❌ Subscription management
- ❌ Usage metering
- ❌ Invoice generation
- ❌ "Upgrade to Pro" prompts

**Why:** Pricing implies commercial product. This is a portfolio demonstration.

### 6.3 Team & Organization

- ❌ Team invitations
- ❌ Role-based access control
- ❌ Organization management
- ❌ Workspace switching
- ❌ Permission systems
- ❌ Admin consoles

**Why:** Team features imply enterprise deployment. Single-user demo only.

### 6.4 Settings & Configuration

- ❌ User preferences panel
- ❌ Notification settings
- ❌ Integration configuration
- ❌ API key management
- ❌ Webhook setup
- ❌ Theme customization beyond system default

**Why:** Settings dashboards are enterprise theater with no training value.

### 6.5 Analytics & Dashboards

- ❌ Usage analytics
- ❌ Decision statistics over time
- ❌ Leaderboards or comparisons
- ❌ Activity feeds
- ❌ Audit logs
- ❌ "Insights" features

**Why:** Analytics imply production use and create fake engagement metrics.

### 6.6 Production Security Tooling

- ❌ Real threat intelligence feeds
- ❌ SIEM/SOAR integration
- ❌ Live vendor status monitoring
- ❌ Actual incident management
- ❌ Alert routing
- ❌ Case management workflows

**Why:** This is training, not production tooling. Claiming otherwise is dishonest.

---

## 7. Success Metrics

### Primary Metrics (Measure These)

| Metric                   | Target  | How to Verify                                |
| ------------------------ | ------- | -------------------------------------------- |
| Clicks to first decision | ≤ 2     | Manual test: home → scenario → decision form |
| Time to first posture    | ≤ 2 min | Stopwatch: page load to decision submitted   |
| Time to export           | ≤ 2 min | Stopwatch: scenario load to file downloaded  |
| Build success            | 100%    | CI must pass on every merge                  |
| Test pass rate           | 100%    | All 109 tests green                          |

### Anti-Metrics (Do NOT Measure)

| Anti-Metric          | Why Measuring It Is Harmful             |
| -------------------- | --------------------------------------- |
| User sign-ups        | Implies auth exists (violates A1)       |
| Monthly active users | Implies tracking (violates minimalism)  |
| Session duration     | Optimizing for engagement, not training |
| Feature count        | Encourages bloat over simplicity        |
| Lines of code        | Deletion is often better than addition  |
| Social shares        | Vanity metric with no training value    |

---

## 8. Architecture Constraints

### Must Be True

| Constraint                          | Rationale                               |
| ----------------------------------- | --------------------------------------- |
| Static files only                   | GitHub Pages hosting, zero ops          |
| No database                         | No data persistence = no data liability |
| No API routes                       | Static export compatibility             |
| No environment variables in runtime | Build-time only, if any                 |
| Client-side state only              | React state, no server sync             |

### Build & Deploy

| Aspect    | Specification                         |
| --------- | ------------------------------------- |
| Framework | Next.js 14 with App Router            |
| Export    | `output: 'export'` (static)           |
| Hosting   | GitHub Pages                          |
| CI        | GitHub Actions                        |
| Domain    | `swb2019.github.io/gsoc-decision-ops` |

---

## 9. UI/UX Principles

### Principle 1: Instant Value

Users see training value within 5 seconds. No registration, no tour, no wizard.

### Principle 2: Two-Click Depth

Any training action reachable in ≤ 2 clicks from home.

### Principle 3: Honest Presentation

Demo nature visible at all times. No pretense of production.

### Principle 4: SOTA on Minimal Surface

State-of-the-art visual design applied only to surfaces that serve the core loop. No surfaces added to showcase design.

### Principle 5: Mobile-First

Core training loop works on phone. Desktop is enhancement, not requirement.

---

## 10. Appendix: Invariant Checklist

Quick checklist for PR review:

```
[ ] No sign-in/sign-up routes added
[ ] No pricing routes added
[ ] No team/settings routes added
[ ] No billing UI added
[ ] No analytics dashboards added
[ ] Demo badge visible on home page
[ ] Training banner visible on scenario page
[ ] All scenarios marked synthetic
[ ] Exports include training watermark
[ ] No job-hunt language in UI
[ ] No production security claims
[ ] Static build succeeds
[ ] All 109 tests pass
[ ] Prettier/ESLint clean
```

---

_PRD 1.1 — Locked. Changes require version increment and stakeholder sign-off._
