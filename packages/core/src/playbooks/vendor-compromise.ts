/**
 * GSOC Decision Operations - Vendor Compromise First-Hour Playbook
 *
 * Structured response framework for corporate GSOC leaders when
 * a critical vendor experiences a security incident or operational
 * disruption that may impact physical security operations.
 *
 * Built on enterprise incident management patterns and ASIS ESRM methodology.
 * GSOC serves as trusted advisor to asset owners; asset owners own the risk.
 */

import type { Playbook, PlaybookPhase, ChecklistItem } from '../types.js';
import { generateId } from '../utils.js';

/**
 * Create a checklist item with consistent structure
 */
function createChecklistItem(
  description: string,
  required: boolean = true,
  owner?: string
): ChecklistItem {
  return {
    id: generateId('CHK'),
    description,
    required,
    owner,
    completed: false,
  };
}

/**
 * First-Hour Vendor Compromise Response Playbook
 *
 * Designed for scenarios where a vendor providing critical services
 * to physical security operations (access control, video management,
 * alarm monitoring, etc.) reports or exhibits signs of compromise.
 *
 * This playbook focuses on the OPERATIONS lens - protecting your
 * security program's ability to function while IT/Security teams
 * handle the technical investigation.
 */
export const vendorCompromisePlaybook: Playbook = {
  id: 'PB_VENDOR_COMPROMISE_V1',
  name: 'Vendor Compromise First-Hour Response',
  version: '1.0.0',
  description:
    'Structured first-hour response for corporate GSOC when a critical vendor experiences a security incident. ' +
    'Built on ESRM principles: asset owners own the risk; GSOC advises on residual risk and compensating controls. ' +
    'Phases: Declare → Assess → Bridge → Brief → Learn.',
  applicableScenarios: [
    'Vendor announces security breach',
    'Vendor system unavailability with suspected security cause',
    'Third-party notification of vendor compromise',
    'Anomalous behavior in vendor-provided systems',
    'Vendor ransomware incident',
    'Supply chain attack affecting vendor',
  ],
  totalDurationMinutes: 60,

  phases: [
    // Phase 1: Initial Assessment (0-10 minutes)
    {
      id: 'PHASE_1_ASSESSMENT',
      name: 'Initial Assessment',
      description:
        'Rapidly assess the scope and potential impact of the vendor incident on GSOC operations. Establish initial facts and identify critical unknowns.',
      durationMinutes: 10,
      objectives: [
        'Confirm the incident report and source credibility',
        'Identify which vendor services are affected',
        'Map affected services to GSOC operational dependencies',
        'Establish initial posture (CONTINUE/DEGRADE/PAUSE)',
      ],
      keyQuestions: [
        'What vendor and which specific services are affected?',
        'How did we learn of this incident (vendor notification, third party, internal detection)?',
        'What GSOC operations depend on this vendor?',
        'Are there immediate safety implications?',
        'What is the current operational status of vendor systems?',
        'Do we have alternate means to perform critical functions?',
      ],
      checklistItems: [
        createChecklistItem('Verify incident report source and credibility', true, 'GSOC Manager'),
        createChecklistItem(
          'Document initial notification time and method',
          true,
          'GSOC Supervisor'
        ),
        createChecklistItem(
          'Identify specific vendor services/products affected',
          true,
          'GSOC Manager'
        ),
        createChecklistItem(
          'Pull vendor contract and SLA documentation',
          false,
          'GSOC Administrator'
        ),
        createChecklistItem('Check vendor status page and communications', true, 'GSOC Supervisor'),
        createChecklistItem(
          'List all GSOC systems/processes using this vendor',
          true,
          'GSOC Manager'
        ),
        createChecklistItem(
          'Assess current operational status of each dependent system',
          true,
          'GSOC Operator'
        ),
        createChecklistItem('Document any immediate safety concerns', true, 'GSOC Manager'),
        createChecklistItem(
          'Make initial CONTINUE/DEGRADE/PAUSE decision for each affected operation',
          true,
          'GSOC Manager'
        ),
      ],
      escalationTriggers: [
        'Immediate safety risk identified',
        'Multiple critical systems affected',
        'Evidence of active compromise of GSOC data',
        'Complete loss of critical security function',
      ],
    },

    // Phase 2: Bridge & Coordination (10-20 minutes)
    {
      id: 'PHASE_2_NOTIFICATION',
      name: 'Bridge & Coordination',
      description:
        'Establish joint bridge with stakeholders. GSOC coordinates but does not own all decisions — ' +
        'asset owners (Facilities, IT, Business Units) own their risk. Frame GSOC role as trusted advisor.',
      durationMinutes: 10,
      objectives: [
        'Establish joint bridge with required stakeholders',
        'Clarify decision authority (who owns which risk)',
        'Set communication cadence',
        'Coordinate with IT Security on technical response',
      ],
      keyQuestions: [
        'Who is the asset owner for affected systems?',
        'Is IT Security leading technical response? What do they need from GSOC?',
        'What is the vendor communication protocol?',
        'What is the executive briefing requirement?',
        'What is the bridge call cadence?',
      ],
      checklistItems: [
        createChecklistItem(
          'GSOC ↔ IT Security: Confirm technical lead, share COP',
          true,
          'GSOC Manager'
        ),
        createChecklistItem(
          'GSOC ↔ Facilities: Building systems status, backup procedures',
          true,
          'GSOC Supervisor'
        ),
        createChecklistItem(
          'GSOC ↔ Communications: Internal messaging plan, executive brief schedule',
          false,
          'GSOC Manager'
        ),
        createChecklistItem(
          'GSOC ↔ Legal/Compliance: Regulatory notification triggers',
          false,
          'GSOC Manager'
        ),
        createChecklistItem(
          'GSOC ↔ Vendor: Account team contact, status update schedule',
          true,
          'GSOC Administrator'
        ),
        createChecklistItem('Set up incident bridge line', true, 'GSOC Supervisor'),
        createChecklistItem('Identify asset owners for each affected system', true, 'GSOC Manager'),
        createChecklistItem('Document stakeholder notification times', true, 'GSOC Administrator'),
        createChecklistItem(
          'Establish bridge call schedule (recommend 30-min cadence)',
          true,
          'GSOC Manager'
        ),
      ],
      escalationTriggers: [
        'Unable to reach vendor contacts',
        'IT Security requests immediate GSOC action',
        'Executive briefing required within the hour',
        'Asset owner unavailable for risk decision',
      ],
    },

    // Phase 3: Operational Continuity (20-35 minutes)
    {
      id: 'PHASE_3_CONTINUITY',
      name: 'Operational Continuity',
      description:
        'Implement operational workarounds and backup procedures. Document degraded operations and compensating controls.',
      durationMinutes: 15,
      objectives: [
        'Implement backup/manual procedures for affected operations',
        'Document degraded operational status',
        'Establish compensating controls',
        'Communicate operational changes to field teams',
      ],
      keyQuestions: [
        'What manual or backup procedures exist for affected operations?',
        'Can we switch to alternate vendors or systems?',
        'What increased monitoring or staffing is needed?',
        'How do we communicate changes to security officers and site teams?',
        'What documentation is needed for compliance/audit?',
      ],
      checklistItems: [
        createChecklistItem(
          'Activate backup procedures for affected operations',
          true,
          'GSOC Supervisor'
        ),
        createChecklistItem(
          'Document which operations are in degraded mode',
          true,
          'GSOC Administrator'
        ),
        createChecklistItem(
          'Implement compensating controls for security gaps',
          true,
          'GSOC Manager'
        ),
        createChecklistItem(
          'Notify field security officers of operational changes',
          true,
          'GSOC Supervisor'
        ),
        createChecklistItem(
          'Adjust staffing levels if increased monitoring required',
          false,
          'GSOC Manager'
        ),
        createChecklistItem(
          'Test backup systems/procedures if not recently validated',
          false,
          'GSOC Operator'
        ),
        createChecklistItem(
          'Document all workarounds and compensating controls',
          true,
          'GSOC Administrator'
        ),
        createChecklistItem(
          'Update security console displays to reflect degraded status',
          false,
          'GSOC Operator'
        ),
        createChecklistItem(
          'Confirm critical alarms can still be received/processed',
          true,
          'GSOC Supervisor'
        ),
      ],
      escalationTriggers: [
        'Backup procedures inadequate for operational needs',
        'Critical security function cannot be maintained',
        'Compensating controls require additional resources',
      ],
    },

    // Phase 4: Information Management (35-50 minutes)
    {
      id: 'PHASE_4_INFORMATION',
      name: 'Information Management',
      description:
        'Assess data exposure risk. Coordinate with IT Security on credential and access reviews. Document facts vs. assumptions.',
      durationMinutes: 15,
      objectives: [
        'Assess potential data exposure from vendor systems',
        'Review credentials and access shared with vendor',
        'Support IT Security investigation as needed',
        'Maintain clear separation of facts vs. assumptions',
      ],
      keyQuestions: [
        'What GSOC data resides in or transits through vendor systems?',
        'What credentials or API keys does the vendor have access to?',
        'Should vendor access to our systems be suspended?',
        'What does IT Security need from us for their investigation?',
        'What can we confirm vs. what are we assuming?',
      ],
      checklistItems: [
        createChecklistItem(
          'Inventory data shared with/accessible by vendor',
          true,
          'GSOC Manager'
        ),
        createChecklistItem(
          'List credentials and API keys used by vendor systems',
          true,
          'GSOC Administrator'
        ),
        createChecklistItem(
          'Coordinate with IT on credential rotation decisions',
          true,
          'GSOC Manager'
        ),
        createChecklistItem('Review vendor remote access to GSOC systems', true, 'GSOC Supervisor'),
        createChecklistItem(
          'Document what we know as FACTS with sources',
          true,
          'GSOC Administrator'
        ),
        createChecklistItem('Document what we are ASSUMING and why', true, 'GSOC Administrator'),
        createChecklistItem(
          'List critical UNKNOWNS and who is resolving',
          true,
          'GSOC Administrator'
        ),
        createChecklistItem('Provide requested information to IT Security', false, 'GSOC Manager'),
        createChecklistItem('Assess video/access log preservation needs', false, 'GSOC Supervisor'),
      ],
      escalationTriggers: [
        'Evidence of GSOC data compromise',
        'Credential exposure confirmed',
        'IT Security requests immediate access suspension',
      ],
    },

    // Phase 5: First Hour Checkpoint (50-60 minutes)
    {
      id: 'PHASE_5_CHECKPOINT',
      name: 'First Hour Checkpoint',
      description:
        'Conduct first major checkpoint. Review decisions, validate assumptions, and establish ongoing cadence.',
      durationMinutes: 10,
      objectives: [
        'Review all decisions made in first hour',
        'Validate or update assumptions',
        'Establish ongoing bridge and reporting cadence',
        'Set criteria for posture changes',
      ],
      keyQuestions: [
        'Are our initial decisions still appropriate?',
        'Have any assumptions been validated or invalidated?',
        'What is the vendor saying about resolution timeline?',
        'What is the ongoing bridge/update cadence?',
        'What would cause us to change our posture?',
      ],
      checklistItems: [
        createChecklistItem('Conduct first-hour bridge call', true, 'GSOC Manager'),
        createChecklistItem('Review and confirm/update all decisions', true, 'GSOC Manager'),
        createChecklistItem('Update facts/assumptions/unknowns log', true, 'GSOC Administrator'),
        createChecklistItem('Confirm operational continuity status', true, 'GSOC Supervisor'),
        createChecklistItem('Set next bridge call time and attendees', true, 'GSOC Manager'),
        createChecklistItem('Document decision review triggers', true, 'GSOC Administrator'),
        createChecklistItem('Prepare executive summary if required', false, 'GSOC Manager'),
        createChecklistItem('Assign ongoing monitoring responsibilities', true, 'GSOC Supervisor'),
        createChecklistItem('Schedule after-action review date', false, 'GSOC Manager'),
      ],
      escalationTriggers: [
        'Situation significantly worse than initial assessment',
        'Vendor timeline extends beyond acceptable threshold',
        'New information requires major decision revision',
      ],
    },
  ],

  governanceNotes: [
    "TRAINING ONLY: This playbook is an exercise framework. Actual incidents should follow your organization's established procedures.",
    'ESRM PRINCIPLE: Asset owners own the risk. GSOC advises on residual risk and compensating controls; asset owners approve posture changes affecting their operations.',
    'DECISION AUTHORITY: GSOC Manager has authority for GSOC operational decisions. Enterprise-wide decisions require CISO/CSO or asset owner approval.',
    'DOCUMENTATION: All decisions must capture timestamp, owner, rationale, and residual risk for audit and AAR purposes.',
    'HUMAN JUDGMENT: Automated systems support but do not replace human decision-making. GSOC serves as trusted advisor, not autonomous controller.',
    'IT COORDINATION: IT Security typically leads technical investigation. GSOC provides operational continuity and physical security perspective.',
    'VENDOR RELATIONSHIPS: Balance urgent response with maintaining productive long-term vendor partnership.',
  ],
};

/**
 * Get the vendor compromise playbook
 */
export function getVendorCompromisePlaybook(): Playbook {
  return vendorCompromisePlaybook;
}

/**
 * Get a specific phase from the playbook
 */
export function getPlaybookPhase(phaseId: string): PlaybookPhase | undefined {
  return vendorCompromisePlaybook.phases.find((phase) => phase.id === phaseId);
}

/**
 * Get all checklist items for a phase
 */
export function getPhaseChecklist(phaseId: string): ChecklistItem[] {
  const phase = getPlaybookPhase(phaseId);
  return phase?.checklistItems ?? [];
}

/**
 * Calculate phase completion percentage
 */
export function calculatePhaseCompletion(
  phaseId: string,
  completedItems: Set<string>
): { total: number; completed: number; percentage: number } {
  const checklist = getPhaseChecklist(phaseId);
  const total = checklist.length;
  const completed = checklist.filter((item) => completedItems.has(item.id)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}
