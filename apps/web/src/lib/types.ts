/**
 * GSOC Decision Ops Cloud - SaaS Data Types
 *
 * Demo/portfolio data models for multi-tenant SaaS architecture.
 * All data is synthetic for demonstration purposes.
 */

export type UserRole = 'owner' | 'manager' | 'supervisor' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise';
  logo?: string;
}

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
  description?: string;
  createdAt: string;
  incidentCount: number;
  activeIncidents: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  lastActive?: string;
}

export interface SavedIncident {
  id: string;
  workspaceId: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'MONITORING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  decisionCount: number;
  isTrainingScenario: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details?: string;
}

export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    label: string;
    description: string;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageTeam: boolean;
    canViewAudit: boolean;
    canExport: boolean;
  }
> = {
  owner: {
    label: 'Owner',
    description: 'Full access to all organization settings and billing',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageTeam: true,
    canViewAudit: true,
    canExport: true,
  },
  manager: {
    label: 'GSOC Manager',
    description: 'Manage incidents, decisions, and team assignments',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageTeam: true,
    canViewAudit: true,
    canExport: true,
  },
  supervisor: {
    label: 'GSOC Supervisor',
    description: 'Create and manage incidents, assign tasks',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageTeam: false,
    canViewAudit: true,
    canExport: true,
  },
  analyst: {
    label: 'GSOC Analyst',
    description: 'Document facts, assumptions, and actions',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageTeam: false,
    canViewAudit: false,
    canExport: true,
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to incidents and reports',
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageTeam: false,
    canViewAudit: false,
    canExport: false,
  },
};
