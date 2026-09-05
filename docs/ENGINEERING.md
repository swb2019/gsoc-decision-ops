# Engineering Approach

> **Purpose:** Document the engineering methodology used to build this tool.

---

## First-Principles Design

This project was built using Elon Musk's 5-step engineering algorithm, applied to portfolio project design.

### 1. Make the Requirements Less Dumb

**Question:** What is the single job of this portfolio project?

**Answer:** Demonstrate first-hour decision-making methodology for GSOC operations.

**Deleted requirements:**

- Multi-tenant SaaS architecture
- Pricing tiers and billing
- Sign-in/sign-up flows
- RBAC and team management
- Settings panels with SSO/API stubs
- Activity feeds and audit logs

### 2. Delete the Part or Process

**Deleted 13 pages/components:**

- `/pricing`, `/signin`, `/signup`
- `/app/team`, `/app/settings`
- `/app/reports`, `/app/playbooks` (redundant)
- `/app/incidents/*`, `/app/dashboard`
- Sidebar with org/workspace switchers
- Marketing components
- Multi-organization state management
- Complex auth context with localStorage

**Net deletion:** ~2,500 lines of code

### 3. Simplify / Optimize

**Resulting architecture:**

- 1 landing page (lists scenarios directly)
- 1 scenario page (decision log, playbook, export in tabs)
- Zero auth gates
- Zero navigation complexity

### 4. Accelerate Cycle Time

**Before:** Landing → Auth → Dashboard → Incidents → Select → Load → Train → Navigate → Export

**After:** Landing → Select → Train → Export

**Clicks to first decision:** 2

### 5. Automate (Last)

Only after steps 1-4:

- Test suite (109 tests)
- CI pipeline (typecheck + lint + test)
- GitHub Pages deployment

---

## Tech Decisions

| Decision                 | Rationale                                |
| ------------------------ | ---------------------------------------- |
| Next.js 14 static export | Zero server, GitHub Pages compatible     |
| TypeScript strict        | Catch errors at compile time             |
| Tailwind CSS             | Utility-first, no CSS file proliferation |
| Vitest                   | Fast, ESM-native testing                 |
| Monorepo (packages/core) | Separate domain logic from UI            |

---

## What Was NOT Built

Per PRD invariants, these features are permanently out of scope:

- Authentication / identity
- Pricing / billing
- Team / organization management
- Settings / configuration
- Analytics / dashboards
- Production security features (SIEM integration, live monitoring)

See [PRD §11 Non-Goals](PRD.md) for the complete list.
