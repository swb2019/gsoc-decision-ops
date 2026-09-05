# GSOC Decision Ops — Training Methodology

> **Version:** 1.0  
> **Effective:** September 2026  
> **Purpose:** Document the pedagogical foundations that make this first-hour decision training effective.

---

## Training Philosophy

GSOC Decision Ops is built on **enterprise incident management patterns**, **SOTA ESRM (ASIS) risk methodology**, and **evidence-based decision training** — not gamification or engagement farming. The goal is skill transfer: what you practice here should improve your judgment in actual first-hour incidents.

**Foundation stack:**

1. Enterprise workflow fidelity (decision log, timeline, ownership, escalation, COP)
2. ASIS ESRM risk principles (asset owner owns risk, security as trusted advisor)
3. Evidence-based pedagogy (Klein RPD, military AAR, tabletop design)

This document maps each feature to its pedagogical foundation, enabling trainers to understand _why_ the tool works, not just _how_ to use it.

---

## §1 Foundation Stack

### 1.1 Enterprise Incident Management Patterns

**Source:** Enterprise Security Risk Management (ESRM) platforms; incident management workflow design

**Workflow elements trained (pedagogy, not feature parity):**

| Element                      | Training Implementation                                     |
| ---------------------------- | ----------------------------------------------------------- |
| **Decision log**             | Timestamped decision capture with posture, rationale, owner |
| **Timeline**                 | Chronological event tracking with type classification       |
| **Ownership**                | Explicit owner/role on every decision and action            |
| **Escalation cues**          | Inject system surfaces escalation triggers                  |
| **Common Operating Picture** | Facts/Assumptions/Unknowns panels with shared language      |
| **Case structure**           | Scenario → Assessment → Decision → Export flow              |

**What this does NOT train (belongs in full platform):**

- Case creation and dispatch
- Multi-incident triage
- Risk assessments (formal, scored)
- Third-party integrations
- Audit trails and compliance reporting

---

### 1.2 ASIS ESRM Risk Principles

**Source:** ASIS International _Enterprise Security Risk Management_ (2019); ISO 31000 risk management framework

**Core ESRM principles applied:**

| ESRM Principle                 | Training Implementation                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| **Asset owner owns the risk**  | Decision framing: "Advising [asset owner] on residual risk"        |
| **Security = trusted advisor** | GSOC posture is recommendation to business, not unilateral control |
| **Residual risk explicit**     | Every posture includes "risk remaining after this treatment"       |
| **Treatment options**          | CONTINUE/DEGRADE/PAUSE map to accept/mitigate/avoid                |

**ESRM treatment → Posture mapping:**

| ESRM Treatment | Posture             | When Applied                                     |
| -------------- | ------------------- | ------------------------------------------------ |
| **Accept**     | CONTINUE            | Risk within tolerance; proceed with awareness    |
| **Mitigate**   | DEGRADE             | Reduce exposure through compensating controls    |
| **Avoid**      | PAUSE               | Halt activity to eliminate exposure              |
| **Transfer**   | (Context-dependent) | Insurance, vendor liability — noted in rationale |

**Key insight:** GSOC doesn't own business risk — we advise asset owners on security implications. Training should reinforce this advisory role, not security overreach.

**Residual risk language in decisions:**

```
Posture: DEGRADE
Treatment: Mitigate
Residual Risk: Manual visitor process introduces 15-30 minute delays;
               temporary credential issuance gap at remote sites.
Recommendation to: Facilities Director (asset owner)
```

---

## §2 Pedagogical Approaches

### 2.1 Tabletop Exercise Design

**Source:** FEMA Homeland Security Exercise and Evaluation Program (HSEEP); industry tabletop facilitation best practices

**Principles applied:**

| Principle                                 | How Applied                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| **Single learning objective per session** | Each scenario has a declared learning objective visible at start                      |
| **Escalating injects**                    | 3–5 timed injects reveal new information, forcing posture reconsideration             |
| **Force specific decisions**              | Posture buttons (CONTINUE/DEGRADE/PAUSE) require commitment—no "we'd just coordinate" |
| **Communication/coordination pressure**   | Joint-bridge checklist surfaces stakeholder coordination requirements                 |
| **Immediate debrief**                     | Export AAR provides structured reflection within the session                          |

**Key insight:** Effective tabletop exercises don't test knowledge—they force decisions under uncertainty, then examine the decision process.

---

### 2.2 Recognition-Primed Decision (RPD) Model

**Source:** Gary Klein, _Sources of Power: How People Make Decisions_ (1998); naturalistic decision-making research

**The RPD cycle:**

```
Situation → Cue Recognition → Pattern Match → Mental Simulation → Action
```

**How applied in GSOC Decision Ops:**

| RPD Element              | Feature Implementation                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Cue recognition**      | COP (Common Operating Picture) separates Facts/Assumptions/Unknowns as explicit cues |
| **Pattern matching**     | Scenario context provides vendor type and impact categories for pattern activation   |
| **Mental simulation**    | RPD prompts ask "What do you expect to happen?" before posture selection             |
| **Satisficing**          | Three postures (CONTINUE/DEGRADE/PAUSE) enforce satisficing over optimization        |
| **Situation assessment** | Injects trigger reassessment—"Is my current posture still appropriate?"              |

**Key insight:** Experts don't optimize—they recognize patterns and simulate forward. Training should develop pattern libraries and simulation fluency.

---

### 2.3 Military/Organizational After-Action Review (AAR)

**Source:** U.S. Army Center for Army Lessons Learned; organizational learning research

**AAR structure applied:**

| AAR Question                 | Export Section                                              |
| ---------------------------- | ----------------------------------------------------------- |
| What was supposed to happen? | Intended outcomes (learning objective + expected decisions) |
| What actually happened?      | Chronology + actual decisions made                          |
| What went well? (Sustains)   | Sustains section with specific behaviors to continue        |
| What can improve? (Improves) | Improves section with identified gaps                       |
| Who owns what next?          | Action items with owner and due date                        |

**Key insight:** Learning happens in reflection, not execution. The AAR export is where decision patterns are examined and encoded.

---

### 2.4 NIST/CISA-Aligned First-Hour Discipline

**Source:** NIST Cybersecurity Framework; CISA Incident Response guidance; adapted for GSOC operational posture (not full IR forensics)

**First-hour phases (GSOC operational lens):**

| Phase       | Focus                                        | Duration  |
| ----------- | -------------------------------------------- | --------- |
| **Declare** | Confirm incident, establish initial posture  | 0–10 min  |
| **Assess**  | Scope impact, identify dependencies          | 10–20 min |
| **Bridge**  | Stakeholder notification, joint coordination | 20–35 min |
| **Brief**   | Executive communication, documentation       | 35–50 min |
| **Learn**   | First checkpoint, assumption validation      | 50–60 min |

**GSOC vs. IR distinction:** GSOC focuses on _operational continuity_ and _physical security posture_. Technical investigation remains with IT Security/IR teams. This tool trains the GSOC decision layer, not forensics.

---

### 2.5 Common Operating Picture (COP)

**Source:** Military command and control doctrine; crisis management research

**COP principles applied:**

| Principle                              | Implementation                                                         |
| -------------------------------------- | ---------------------------------------------------------------------- |
| **Facts vs. Assumptions vs. Unknowns** | Three distinct UI panels, not merged lists                             |
| **Required risk-if-wrong**             | Assumptions require explicit risk statement before entry               |
| **Source attribution**                 | Facts require source for credibility assessment                        |
| **Priority on unknowns**               | Unknowns carry priority (CRITICAL/HIGH/MEDIUM/LOW)                     |
| **Visual hierarchy**                   | Color-coded panels: green (facts), amber (assumptions), red (unknowns) |

**Key insight:** Decision quality depends on information quality awareness. Conflating facts with assumptions causes preventable failures.

---

### 2.6 Joint Bridge Coordination

**Source:** Incident Command System (ICS); corporate crisis management practices

**Joint-bridge checklist categories:**

| Stakeholder Group           | Coordination Items                                                         |
| --------------------------- | -------------------------------------------------------------------------- |
| **GSOC ↔ IR/IT Security**   | Technical lead handoff, evidence preservation, access suspension decisions |
| **GSOC ↔ Facilities**       | Building systems status, backup procedures, physical access impacts        |
| **GSOC ↔ Communications**   | Internal messaging, executive briefing schedule, external notification     |
| **GSOC ↔ Legal/Compliance** | Regulatory notification triggers, documentation requirements               |
| **GSOC ↔ Vendor**           | Vendor contact, status updates, SLA documentation                          |

**Key insight:** First-hour failures often occur at organizational seams. The joint-bridge checklist makes coordination explicit and trackable.

---

## §3 Feature-to-Pedagogy Mapping

| Feature                           | Primary Foundation     | Secondary Foundations               |
| --------------------------------- | ---------------------- | ----------------------------------- |
| Decision log with timestamp/owner | Enterprise workflow    | Military AAR                        |
| Timeline event tracking           | Enterprise workflow    | NIST first-hour discipline          |
| Learning objective per scenario   | Tabletop design        | —                                   |
| Timed injects                     | Tabletop design        | RPD (situation reassessment)        |
| Facts/Assumptions/Unknowns panels | COP                    | RPD (cue recognition)               |
| Required risk-if-wrong            | COP                    | ESRM (residual risk explicit)       |
| CONTINUE/DEGRADE/PAUSE postures   | ESRM treatment mapping | RPD (satisficing)                   |
| Residual risk in decisions        | ESRM principles        | Enterprise workflow                 |
| Asset owner framing               | ESRM principles        | ASIS ESRM guidelines                |
| RPD decision prompts              | RPD                    | Tabletop design (force decisions)   |
| Playbook phases                   | NIST first-hour        | Tabletop design (structure)         |
| Joint-bridge checklist            | Joint coordination     | NIST (communication requirements)   |
| AAR export (sustains/improves)    | Military AAR           | Tabletop design (immediate debrief) |
| Action items with owner/due       | Military AAR           | ESRM (ownership)                    |

---

## §4 What This Training Is NOT

| Not This                  | Because                                                                    |
| ------------------------- | -------------------------------------------------------------------------- |
| **SIEM/SOAR simulation**  | No log parsing, alert triage, or detection logic—this is decision training |
| **IR forensics training** | GSOC doesn't lead technical investigation; we train operational posture    |
| **Certification prep**    | Not mapped to CISSP/CISM domains; teaches judgment, not recall             |
| **Policy generator**      | Export is for reflection, not production incident documentation            |
| **Gamified learning**     | No points, badges, or leaderboards—decision quality is the reward          |

---

## §4 References

### Primary Sources

1. Klein, G. (1998). _Sources of Power: How People Make Decisions._ MIT Press.
2. Klein, G. (2017). _Seeing What Others Don't: The Remarkable Ways We Gain Insights._ PublicAffairs.
3. U.S. Army. (2020). _A Leader's Guide to After-Action Reviews._ Center for Army Lessons Learned.
4. FEMA. (2020). _Homeland Security Exercise and Evaluation Program (HSEEP)._ Department of Homeland Security.
5. NIST. (2018). _Framework for Improving Critical Infrastructure Cybersecurity._ NIST Cybersecurity Framework 1.1.
6. CISA. (2021). _Federal Government Cybersecurity Incident and Vulnerability Response Playbooks._

### Supporting Research

- Kahneman, D. (2011). _Thinking, Fast and Slow._ Farrar, Straus and Giroux.
- Weick, K. E., & Sutcliffe, K. M. (2015). _Managing the Unexpected._ Wiley.
- Woods, D. D., & Hollnagel, E. (2006). _Joint Cognitive Systems: Patterns in Cognitive Systems Engineering._ CRC Press.

---

## §5 Trainer Notes

### Recommended Session Flow

1. **Pre-brief (2 min):** Review scenario learning objective, explain synthetic nature
2. **Exercise (15–25 min):** Work through scenario, injects auto-reveal or facilitator-triggered
3. **Hot wash (5 min):** Immediate verbal debrief while memory is fresh
4. **Export AAR (2 min):** Generate structured after-action report
5. **Review (10 min):** Examine AAR, identify patterns, document action items

### Facilitator Anti-Patterns

| Anti-Pattern                 | Why Harmful                | Instead                  |
| ---------------------------- | -------------------------- | ------------------------ |
| Giving hints                 | Removes decision pressure  | Ask clarifying questions |
| Accepting "we'd coordinate"  | Avoids commitment          | Force specific posture   |
| Rushing injects              | Doesn't allow processing   | Let discomfort build     |
| Skipping AAR                 | Misses learning moment     | Always export and review |
| Adding scenarios mid-session | Dilutes learning objective | One scenario per session |

---

_GSOC Decision Ops — Training Methodology v1.0_
