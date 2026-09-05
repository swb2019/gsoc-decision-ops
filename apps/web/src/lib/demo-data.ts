/**
 * GSOC Decision Ops Cloud - Demo Data
 *
 * Synthetic data for portfolio demonstration.
 * All organizations, users, and incidents are fictional.
 */

import type {
  Organization,
  Workspace,
  User,
  TeamMember,
  SavedIncident,
  AuditLogEntry,
} from './types';

export const DEMO_ORGANIZATIONS: Organization[] = [
  {
    id: 'org_demo_acme',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    plan: 'enterprise',
  },
  {
    id: 'org_demo_globex',
    name: 'Globex Industries',
    slug: 'globex',
    plan: 'professional',
  },
];

export const DEMO_USER: User = {
  id: 'user_demo_1',
  email: 'demo@gsoc-decision-ops.example',
  name: 'Alex Chen',
  role: 'manager',
};

export const DEMO_WORKSPACES: Workspace[] = [
  {
    id: 'ws_headquarters',
    name: 'Headquarters GSOC',
    organizationId: 'org_demo_acme',
    description: 'Primary global security operations center',
    createdAt: '2024-01-15T00:00:00Z',
    incidentCount: 12,
    activeIncidents: 2,
  },
  {
    id: 'ws_emea',
    name: 'EMEA Regional SOC',
    organizationId: 'org_demo_acme',
    description: 'Europe, Middle East, and Africa operations',
    createdAt: '2024-02-01T00:00:00Z',
    incidentCount: 8,
    activeIncidents: 1,
  },
  {
    id: 'ws_apac',
    name: 'APAC Regional SOC',
    organizationId: 'org_demo_acme',
    description: 'Asia-Pacific regional operations',
    createdAt: '2024-03-01T00:00:00Z',
    incidentCount: 5,
    activeIncidents: 0,
  },
];

export const DEMO_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member_1',
    userId: 'user_demo_1',
    organizationId: 'org_demo_acme',
    role: 'manager',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    joinedAt: '2024-01-01T00:00:00Z',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'member_2',
    userId: 'user_demo_2',
    organizationId: 'org_demo_acme',
    role: 'supervisor',
    name: 'Jordan Martinez',
    email: 'jordan.martinez@example.com',
    joinedAt: '2024-01-15T00:00:00Z',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'member_3',
    userId: 'user_demo_3',
    organizationId: 'org_demo_acme',
    role: 'analyst',
    name: 'Sam Williams',
    email: 'sam.williams@example.com',
    joinedAt: '2024-02-01T00:00:00Z',
    lastActive: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'member_4',
    userId: 'user_demo_4',
    organizationId: 'org_demo_acme',
    role: 'analyst',
    name: 'Taylor Johnson',
    email: 'taylor.johnson@example.com',
    joinedAt: '2024-03-01T00:00:00Z',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'member_5',
    userId: 'user_demo_5',
    organizationId: 'org_demo_acme',
    role: 'viewer',
    name: 'Casey Brown',
    email: 'casey.brown@example.com',
    joinedAt: '2024-04-01T00:00:00Z',
  },
];

export const DEMO_INCIDENTS: SavedIncident[] = [
  {
    id: 'inc_training_1',
    workspaceId: 'ws_headquarters',
    title: 'Access Control Vendor Ransomware Incident',
    severity: 'HIGH',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Alex Chen',
    decisionCount: 3,
    isTrainingScenario: true,
  },
  {
    id: 'inc_training_2',
    workspaceId: 'ws_headquarters',
    title: 'Video Management Supply Chain Concern',
    severity: 'HIGH',
    status: 'MONITORING',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    createdBy: 'Jordan Martinez',
    decisionCount: 5,
    isTrainingScenario: true,
  },
  {
    id: 'inc_training_3',
    workspaceId: 'ws_headquarters',
    title: 'Alarm Monitoring Service Outage',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'Alex Chen',
    decisionCount: 8,
    isTrainingScenario: true,
  },
  {
    id: 'inc_training_4',
    workspaceId: 'ws_emea',
    title: 'Visitor Management System Compromise',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Sam Williams',
    decisionCount: 2,
    isTrainingScenario: true,
  },
];

export const DEMO_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'audit_1',
    timestamp: new Date().toISOString(),
    userId: 'user_demo_1',
    userName: 'Alex Chen',
    action: 'decision.created',
    resource: 'Access Control Vendor Ransomware Incident',
    details: 'Created decision: Suspend vendor remote access',
  },
  {
    id: 'audit_2',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    userId: 'user_demo_2',
    userName: 'Jordan Martinez',
    action: 'fact.added',
    resource: 'Access Control Vendor Ransomware Incident',
    details: 'Added fact: Vendor confirmed ransomware attack via status page',
  },
  {
    id: 'audit_3',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userId: 'user_demo_1',
    userName: 'Alex Chen',
    action: 'incident.created',
    resource: 'Access Control Vendor Ransomware Incident',
    details: 'Created training scenario incident',
  },
  {
    id: 'audit_4',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    userId: 'user_demo_3',
    userName: 'Sam Williams',
    action: 'export.generated',
    resource: 'Video Management Supply Chain Concern',
    details: 'Generated after-action report (Markdown)',
  },
  {
    id: 'audit_5',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    userId: 'user_demo_1',
    userName: 'Alex Chen',
    action: 'member.invited',
    resource: 'Team',
    details: 'Invited casey.brown@example.com as Viewer',
  },
];

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    description: 'For small security teams getting started',
    features: [
      'Up to 3 team members',
      '1 workspace',
      '10 training scenarios/month',
      'Basic playbooks',
      'Markdown export',
      'Community support',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    description: 'For growing GSOC teams',
    features: [
      'Up to 15 team members',
      '5 workspaces',
      'Unlimited training scenarios',
      'Custom playbooks',
      'JSON + Markdown export',
      'Audit log (30 days)',
      'Email support',
      'SSO (SAML)',
    ],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    description: 'For large security organizations',
    features: [
      'Unlimited team members',
      'Unlimited workspaces',
      'Unlimited training scenarios',
      'Custom playbook builder',
      'API access',
      'Audit log (1 year)',
      'Dedicated support',
      'SSO + SCIM',
      'Custom integrations',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];
