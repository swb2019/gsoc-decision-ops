# After-Action Report: Access Control Vendor Ransomware Incident

**Report ID:** AAR_m3k7p9_x2f4h1
**Generated:** September 5, 2026, 14:30 UTC
**Decision Log ID:** DL_m3k7n8_q9w2e3

> **TRAINING EXERCISE** - This report documents a training scenario.

## Executive Summary

On September 5, 2026, a HIGH severity incident was detected: "Access Control Vendor Ransomware Incident". The incident involved SecureAccess Solutions (Physical Access Control System Provider), affecting 4 service(s). Over 1 hour 12 minutes, the response team made 3 documented decisions (1 CONTINUE, 1 DEGRADE, 1 PAUSE). The team tracked 5 facts, 3 assumptions, and 4 unknowns. Current status: MONITORING.

## Incident Overview

| Property     | Value                                                 |
| ------------ | ----------------------------------------------------- |
| Title        | Access Control Vendor Ransomware Incident             |
| Severity     | HIGH                                                  |
| Duration     | 1 hour 12 minutes                                     |
| Impact Areas | ACCESS_CONTROL, VISITOR_MANAGEMENT, PHYSICAL_SECURITY |
| Status       | MONITORING                                            |

### Vendor Context

| Property          | Value                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Vendor            | SecureAccess Solutions                                                                                                  |
| Type              | Physical Access Control System Provider                                                                                 |
| Services Affected | Badge credential management, Access control panel communications, Mobile credential app, Visitor management integration |
| SLA Requirements  | 99.9% uptime, 4-hour response for critical issues                                                                       |

## Incident Timeline

- **09:15:32** [DETECTION] Incident Detected
  - SecureAccess Solutions has notified us of a ransomware attack affecting their cloud infrastructure.
- **09:18:45** [UPDATE] Fact Recorded
  - New fact: Vendor confirmed ransomware attack on their cloud infrastructure
- **09:22:10** [DECISION] Decision: Continue badge reader operations
  - CONTINUE - Local badge readers continue operating with cached credentials
- **09:35:22** [BRIDGE] INITIAL Bridge Call
  - Attendees: 4. Updates: 3
- **09:42:15** [DECISION] Decision: Pause automated provisioning
  - PAUSE - Halt all automated badge provisioning until vendor provides all-clear
- **09:55:30** [DECISION] Decision: Implement manual visitor check-in
  - DEGRADE - Switch to paper-based visitor management at all locations
- **10:15:00** [UPDATE] Status Changed: MONITORING
  - Incident status updated to MONITORING

## Decision Analysis

**Total Decisions:** 3

### Posture Breakdown

| Posture  | Count |
| -------- | ----- |
| CONTINUE | 1     |
| DEGRADE  | 1     |
| PAUSE    | 1     |

### Key Decisions

#### Pause automated provisioning (PAUSE)

- **Owner:** GSOC Manager (Incident Commander)
- **Time:** September 5, 2026, 09:42:15 UTC
- **Description:** Halt all automated badge provisioning until vendor provides all-clear
- **Rationale:** Cannot verify integrity of new credentials being created; conservative posture until vendor confirms no data tampering
- **Review Trigger:** Vendor confirms no compromise of credential database

#### Implement manual visitor check-in (DEGRADE)

- **Owner:** GSOC Manager (Incident Commander)
- **Time:** September 5, 2026, 09:55:30 UTC
- **Description:** Switch to paper-based visitor management at all locations
- **Rationale:** Visitor management integration with vendor system cannot be verified; manual process ensures security while maintaining operations
- **Review Trigger:** Vendor restores visitor management services

## Information Quality Metrics

| Metric                  | Value |
| ----------------------- | ----- |
| Facts Documented        | 5     |
| Assumptions Made        | 3     |
| Assumptions Validated   | 2     |
| Assumptions Invalidated | 0     |
| Unknowns Resolved       | 2     |
| Unknowns Unresolved     | 2     |

### Documented Facts

- **[CONFIRMED]** Vendor confirmed ransomware attack on their cloud infrastructure
  - Source: Vendor emergency notification email
- **[CONFIRMED]** Local badge readers operating normally with cached credentials
  - Source: GSOC operator verification
- **[HIGH]** Vendor claims no evidence of data exfiltration yet
  - Source: Vendor conference call 09:35
- **[CONFIRMED]** Mobile credential app is offline
  - Source: User reports and GSOC testing
- **[UNVERIFIED]** Vendor estimates 4-6 hour restoration time
  - Source: Vendor account manager phone call

### Assumptions Made

- Cached credentials on local panels remain valid and secure [CONFIRMED]
  - Basis: Local panels operate independently of cloud for existing credentials
  - Risk if Wrong: Compromised credentials could grant unauthorized access
- Vendor ransomware did not compromise credential database [UNVALIDATED]
  - Basis: Vendor stated credentials are encrypted at rest
  - Risk if Wrong: All credentials may need to be re-issued
- Paper-based visitor process is sufficient for current visitor volume [CONFIRMED]
  - Basis: Most locations have fewer than 20 visitors per day
  - Risk if Wrong: Delays at reception, potential security gaps

## Lessons Learned

1. Vendor ransomware notification came through non-emergency channel (regular account manager email), causing 15-minute delay in response initiation.
2. Mobile credential app failure created confusion at locations relying heavily on mobile credentials.
3. Paper visitor management procedures were outdated at 3 locations.
4. GSOC team demonstrated strong decision documentation discipline throughout incident.

## Recommendations

1. Establish dedicated emergency notification channel with critical vendors (separate from regular account communications).
2. Maintain backup physical credential issuance capability at all locations with significant mobile credential usage.
3. Conduct quarterly review and drill of manual backup procedures at all locations.
4. Add vendor ransomware response scenario to annual GSOC training curriculum.
5. Review vendor contract SLA for incident notification requirements.

---

_Generated by Hourglass Command_
_Organization: Training Organization_
