# GSOC Decision Ops

[![CI](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/ci.yml/badge.svg)](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/ci.yml)
[![Deploy](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/deploy.yml/badge.svg)](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**A first-hour decision training tool for GSOC leaders. Practice structured judgment under incomplete information.**

[**Live Demo**](https://swb2019.github.io/gsoc-decision-ops/)

> **Portfolio Demo** — All scenarios are synthetic. This demonstrates decision-making methodology, not a production security platform.

---

## What This Does

When a critical vendor experiences a security incident, GSOC leaders must make rapid decisions with incomplete information. This tool trains that skill:

1. **Select a scenario** — Synthetic vendor compromise incidents
2. **Log decisions** — Separate facts from assumptions, record CONTINUE/DEGRADE/PAUSE postures with rationale
3. **Follow playbook** — 60-minute structured response framework
4. **Export after-action** — Markdown/JSON report in under 2 minutes

The core loop: **Open → Decide → Export** in under 2 minutes.

---

## Built with Musk's Algorithm

This project was rebuilt from first principles using Elon Musk's 5-step engineering algorithm:

### 1. Make the Requirements Less Dumb

**Question asked:** What is the single job of this portfolio project?

**Answer:** Prove Shannon can design and ship a sharp GSOC first-hour decision system — not a fake Salesforce clone.

**Deleted requirements that were dumb:**
- Multi-tenant SaaS architecture (no employer cares about fake org switching)
- Pricing tiers and billing stubs (vanity theater)
- Sign-in/sign-up flows (gates that slow the demo)
- RBAC and team management (complexity that proves nothing)
- Settings panels with SSO/API key stubs (enterprise cosplay)
- Activity feeds and audit logs (fake engagement metrics)

### 2. Delete the Part or Process

**Deleted 13 pages/components:**
- `/pricing` — fake pricing page
- `/signin`, `/signup` — auth theater
- `/app/team` — fake team management
- `/app/settings` — 6-tab settings console
- `/app/reports` — redundant (export is on scenario page)
- `/app/playbooks` — redundant (playbook is on scenario page)
- `/app/incidents/*` — fake incident list and CRUD
- `/app/dashboard` — fake stats dashboard
- Sidebar with org/workspace switchers
- Marketing components (Hero, Features, HowItWorks, ComparisonSection)
- Multi-organization/workspace state management
- Complex auth context with localStorage persistence

**Net deletion:** ~2,500 lines of code, 13 route handlers, 6 React components

### 3. Simplify / Optimize

**After deletion, simplified to:**
- **1 landing page** → lists scenarios directly
- **1 scenario page** → decision log, playbook, export in tabs
- **Zero auth gates** — instant demo access
- **Zero navigation complexity** — back arrow goes home

**Information architecture:**
```
/ (home)
└── /scenarios/[id]
    ├── Overview (facts, assumptions, unknowns, actions)
    ├── Decisions (CONTINUE/DEGRADE/PAUSE with rationale)
    ├── Playbook (60-min framework with checklists)
    └── Export (Markdown/JSON download)
```

### 4. Accelerate Cycle Time

**Before:** Landing → Auth → Dashboard → Incidents → Select → Load → Train → Navigate → Export

**After:** Landing → Select → Train → Export

**Clicks to first decision:** 2 (home → scenario → record decision)

**Time to export after-action:** Under 2 minutes

### 5. Automate (Last)

Only after steps 1-4 were complete:
- Tests remain (109 passing)
- CI remains (typecheck + lint + test)
- GitHub Pages deploy remains
- No new automation added — what remains works

---

## Quick Start

```bash
git clone https://github.com/swb2019/gsoc-decision-ops.git
cd gsoc-decision-ops
npm install
npm run dev
# Open http://localhost:3000
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build all packages |
| `npm test` | Run test suite (109 tests) |
| `npm run typecheck` | TypeScript type checking |

---

## Decision Framework

### Decision Postures

| Posture | When to Use |
|---------|-------------|
| **CONTINUE** | No immediate impact identified. Proceed normally. |
| **DEGRADE** | Partial impact. Compensating controls in place. |
| **PAUSE** | Critical impact. Halt affected operations. |

### Facts vs. Assumptions

- **Facts** — Verified information with sources and confidence levels
- **Assumptions** — Working beliefs with explicit "risk if wrong"
- **Unknowns** — Questions requiring resolution, prioritized

### 60-Minute Playbook

| Phase | Duration | Focus |
|-------|----------|-------|
| Initial Assessment | 10 min | Scope, initial posture |
| Stakeholder Notification | 10 min | Communication, bridge setup |
| Operational Continuity | 15 min | Backup procedures |
| Information Management | 15 min | Data assessment, credentials |
| First Hour Checkpoint | 10 min | Decision review, next steps |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, static export)
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS
- **Testing:** Vitest (109 tests)
- **Deploy:** GitHub Pages

---

## Project Structure

```
gsoc-decision-ops/
├── apps/web/                    # Next.js application
│   └── src/
│       ├── app/                 # 2 routes: home + scenario
│       └── lib/                 # Minimal utilities
├── packages/core/               # Decision-making library
│   └── src/
│       ├── decision-log.ts      # Log management
│       ├── playbooks/           # Response frameworks
│       ├── scenarios/           # Synthetic scenarios
│       ├── export.ts            # Report generation
│       └── types.ts             # Type definitions
└── examples/                    # Sample exports
```

---

## Author

**Shannon Brown**  
GSOC Manager | Harvard ALM/ALB | CompTIA CySA+

This project demonstrates structured operational decision-making methodology for corporate security operations.

---

## License

MIT License — See [LICENSE](LICENSE)
