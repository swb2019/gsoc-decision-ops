'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Organization, Workspace } from './types';
import { DEMO_USER, DEMO_ORGANIZATIONS, DEMO_WORKSPACES } from './demo-data';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  organizations: Organization[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => void;
  switchOrganization: (orgId: string) => void;
  switchWorkspace: (workspaceId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'gsoc_demo_auth';

interface StoredAuth {
  user: User;
  organizationId: string;
  workspaceId: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const workspaces = organization
    ? DEMO_WORKSPACES.filter((w) => w.organizationId === organization.id)
    : [];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const auth: StoredAuth = JSON.parse(stored);
        setUser(auth.user);
        const org = DEMO_ORGANIZATIONS.find((o) => o.id === auth.organizationId);
        setOrganization(org || DEMO_ORGANIZATIONS[0]);
        const ws = DEMO_WORKSPACES.find((w) => w.id === auth.workspaceId);
        setWorkspace(ws || DEMO_WORKSPACES[0]);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const saveAuth = useCallback((user: User, orgId: string, wsId: string) => {
    const auth: StoredAuth = { user, organizationId: orgId, workspaceId: wsId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, []);

  const signIn = useCallback(
    async (email: string) => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const demoUser: User = {
        ...DEMO_USER,
        email,
        name: email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      };

      const defaultOrg = DEMO_ORGANIZATIONS[0];
      const defaultWorkspace = DEMO_WORKSPACES[0];

      setUser(demoUser);
      setOrganization(defaultOrg);
      setWorkspace(defaultWorkspace);
      saveAuth(demoUser, defaultOrg.id, defaultWorkspace.id);
      setIsLoading(false);
    },
    [saveAuth]
  );

  const signOut = useCallback(() => {
    setUser(null);
    setOrganization(null);
    setWorkspace(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const org = DEMO_ORGANIZATIONS.find((o) => o.id === orgId);
      if (org && user) {
        setOrganization(org);
        const orgWorkspaces = DEMO_WORKSPACES.filter((w) => w.organizationId === orgId);
        const newWorkspace = orgWorkspaces[0] || null;
        setWorkspace(newWorkspace);
        if (newWorkspace) {
          saveAuth(user, orgId, newWorkspace.id);
        }
      }
    },
    [user, saveAuth]
  );

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = DEMO_WORKSPACES.find((w) => w.id === workspaceId);
      if (ws && user && organization) {
        setWorkspace(ws);
        saveAuth(user, organization.id, workspaceId);
      }
    },
    [user, organization, saveAuth]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        workspace,
        workspaces,
        organizations: DEMO_ORGANIZATIONS,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode: true,
        signIn,
        signOut,
        switchOrganization,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
