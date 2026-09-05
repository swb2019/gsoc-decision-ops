# GSOC Decision Ops

First-hour decision training for corporate security operations leaders.

[![CI](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/ci.yml/badge.svg)](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/ci.yml)
[![Deploy](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/deploy.yml/badge.svg)](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

[**Play Now →**](https://swb2019.github.io/gsoc-decision-ops/)

---

## What

A first-hour decision simulation for GSOC leaders. Practice structured decision-making under time pressure through realistic vendor compromise scenarios. Document facts vs. assumptions, make posture calls (CONTINUE/DEGRADE/PAUSE), follow a 60-minute playbook, and export after-action reports.

_Training simulation — not a production system of record._

## Why

When a critical vendor reports a security incident, GSOC leaders must make rapid decisions with incomplete information. This skill is difficult to practice in production. GSOC Decision Ops provides a structured training environment to build first-hour judgment.

## Who

GSOC managers and security operations leads who want to practice:

- Separating facts from assumptions under time pressure
- Making defensible posture calls with explicit rationale
- Following structured response frameworks
- Generating after-action documentation

---

## Foundation

Built on **enterprise incident management patterns** and **ASIS ESRM risk methodology**:

| Foundation                  | Application                                               |
| --------------------------- | --------------------------------------------------------- |
| Decision log with ownership | Every decision captures timestamp, owner, role, rationale |
| Common Operating Picture    | Facts / Assumptions / Unknowns as distinct categories     |
| ESRM risk framing           | Asset owner owns risk; GSOC advises on residual risk      |
| Treatment mapping           | CONTINUE (accept) · DEGRADE (mitigate) · PAUSE (avoid)    |

See [TRAINING.md](docs/TRAINING.md) for pedagogy details.

---

## Quickstart

```bash
git clone https://github.com/swb2019/gsoc-decision-ops.git
cd gsoc-decision-ops
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command             | Description           |
| ------------------- | --------------------- |
| `npm run dev`       | Development server    |
| `npm run build`     | Production build      |
| `npm test`          | Run tests (109 tests) |
| `npm run typecheck` | TypeScript checking   |

---

## Architecture

```
gsoc-decision-ops/
├── apps/web/              # Next.js application (static export)
│   └── src/
│       ├── app/           # Routes: / (home), /scenarios/[id]
│       └── lib/           # Client utilities
├── packages/core/         # Domain logic library
│   └── src/
│       ├── scenarios/     # Training scenarios
│       ├── playbooks/     # Response frameworks
│       ├── decision-log.ts
│       ├── export.ts
│       └── types.ts
├── docs/                  # Documentation
└── examples/              # Sample exports
```

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Vitest

---

## Decision Framework

### Postures

| Posture      | ESRM Treatment | When to Use                                    |
| ------------ | -------------- | ---------------------------------------------- |
| **CONTINUE** | Accept         | Risk within tolerance; proceed with monitoring |
| **DEGRADE**  | Mitigate       | Reduce exposure via compensating controls      |
| **PAUSE**    | Avoid          | Halt operations to eliminate exposure          |

### Information Categories

| Category       | Definition               | Required Fields                   |
| -------------- | ------------------------ | --------------------------------- |
| **Fact**       | Verified information     | Description, source, confidence   |
| **Assumption** | Working belief           | Description, basis, risk-if-wrong |
| **Unknown**    | Gap requiring resolution | Question, priority, assignee      |

### 60-Minute Playbook Phases

| Phase   | Duration  | Focus                                   |
| ------- | --------- | --------------------------------------- |
| Declare | 0–10 min  | Confirm incident, initial posture       |
| Assess  | 10–20 min | Scope impact, map dependencies          |
| Bridge  | 20–35 min | Stakeholder notification, coordination  |
| Brief   | 35–50 min | Executive communication, documentation  |
| Learn   | 50–60 min | First checkpoint, assumption validation |

---

## Documentation

| Document                           | Purpose                                            |
| ---------------------------------- | -------------------------------------------------- |
| [PRD 1.1](docs/PRD.md)             | Product definition, invariants, release gates      |
| [TRAINING](docs/TRAINING.md)       | Pedagogy: Klein RPD, military AAR, ESRM principles |
| [ENGINEERING](docs/ENGINEERING.md) | Technical approach and decisions                   |
| [CONTRIBUTING](CONTRIBUTING.md)    | Contribution guidelines                            |
| [SECURITY](SECURITY.md)            | Security policy                                    |

---

## Author

**Shannon Brown** — GSOC Manager · Harvard ALM/ALB · CompTIA CySA+

---

## License

MIT — See [LICENSE](LICENSE)
