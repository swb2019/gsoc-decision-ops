<a href="https://swb2019.github.io/gsoc-decision-ops/"><img src="apps/web/public/brand/hourglass-banner.webp" alt="Hourglass Command — First-hour judgment" width="100%" /></a>

<p align="center">
  <a href="https://swb2019.github.io/gsoc-decision-ops/"><strong>Enter the simulation ↗</strong></a> &nbsp; · &nbsp;
  <a href="docs/TRAINING.md">Training methodology</a> &nbsp; · &nbsp;
  <a href="https://swb2019.github.io/shannon-brown-career/">About Shannon Brown</a>
</p>

[![CI](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/ci.yml)
[![Deploy](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/swb2019/gsoc-decision-ops/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-dbfca9?labelColor=182218)](LICENSE)

## The first hour. Every decision counts.

When physical, cyber, and intelligence signals converge, security leaders have to act with partial facts and contested assumptions. **Hourglass Command** turns that pressure into a repeatable training experience: assess the situation, commit an operating posture, document the reasoning, and examine the outcome.

Built by **Shannon Brown**, a GSOC manager with experience in security operations, commercial risk, and executive communication.

### From signal to defensible decision

| 01 / Read the situation                                                                             | 02 / Make the call                                                                                               | 03 / Learn from the result                                                                  |
| :-------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| Triage converging signals. Separate facts, assumptions, and unknowns in a common operating picture. | Choose **CONTINUE**, **DEGRADE**, or **PAUSE**. Document the treatment, rationale, ownership, and residual risk. | Inspect the decision trail and export an after-action review for discussion and reflection. |

### Choose your training path

- **Six-chapter campaign:** build decision craft through progressive scenarios and chapter unlocks. Progress is saved in your browser.
- **Free play:** open any available scenario directly for a focused practice session.
- **Command interface:** timed injects, posture decisions, operating-picture discipline, and after-action documentation in one workspace.

<p align="center">
  <img src="docs/images/hourglass-readme-hero.png" alt="Hourglass Command training interface with a three-dimensional campus operating picture" width="100%" />
</p>

### Training scope

| Practices                                                         | Boundaries                                                                            |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| Technical GSOC judgment under incomplete information              | Does not reproduce executive relationships or stakeholder politics                    |
| Multi-channel triage: access, video, SIEM, OSINT, tips, and radio | Does not train workforce management or negotiation dynamics                           |
| ESRM-aligned treatment selection and asset-owner risk ownership   | Does not evaluate vendors or replace operational authority                            |
| Defensible decision logs and after-action review                  | A training simulation; unsuitable as a production incident system or system of record |

Spoken Intel Feed, guidance, and optional 3D operating-picture markers support attention. The purpose is to practice decision quality and make the reasoning inspectable. See the [training methodology](docs/TRAINING.md) for the pedagogical foundations and scoring model.

## Run locally

```bash
git clone https://github.com/swb2019/gsoc-decision-ops.git
cd gsoc-decision-ops
npm ci
npm run dev
```

| Command                | Purpose                                                    |
| :--------------------- | :--------------------------------------------------------- |
| `npm run dev`          | Start the Next.js development server                       |
| `npm test`             | Run the core test suite                                    |
| `npm run typecheck`    | Check core and application TypeScript                      |
| `npm run lint`         | Run ESLint                                                 |
| `npm run format:check` | Check source and documentation formatting                  |
| `npm run build`        | Build the workspaces and stage the static export in `out/` |

### Architecture

| Directory        | Responsibility                                                           |
| :--------------- | :----------------------------------------------------------------------- |
| `apps/web/`      | Next.js interface, static routes, campaign progression, and presentation |
| `packages/core/` | Scenarios, scoring, ESRM logic, and arc scheduling                       |
| `docs/`          | Training methodology and product documentation                           |
| `scripts/`       | Build and static-export preparation                                      |

**Stack:** TypeScript · Next.js · React · Tailwind CSS · Three.js · Vitest

The GitHub Pages workflow sets `NEXT_PUBLIC_BASE_PATH=/gsoc-decision-ops` and deploys `apps/web/out/`. A root deployment can use the default empty base path. Manrope and JetBrains Mono are served locally; their font licenses are in `apps/web/public/brand/`.

---

[Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md) · [Code of conduct](CODE_OF_CONDUCT.md) · [MIT license](LICENSE)

[Shannon Brown](https://swb2019.github.io/shannon-brown-career/) · Operational judgment, made tangible.
