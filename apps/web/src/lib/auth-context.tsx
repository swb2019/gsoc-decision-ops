'use client';

import React, { createContext, useContext } from 'react';

interface DemoContextType {
  isDemoMode: true;
}

const DemoContext = createContext<DemoContextType>({ isDemoMode: true });

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <DemoContext.Provider value={{ isDemoMode: true }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useAuth(): DemoContextType {
  return useContext(DemoContext);
}
