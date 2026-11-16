import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Company {
  id: string;
  code: string;
  raisonSociale: string;
  matriculeFiscal: string;
  exercice: number;
}

/** Demo company until authentication and multi-company land. */
export const DEMO_COMPANY: Company = {
  id: 'demo',
  code: '1',
  raisonSociale: 'Société de démonstration',
  matriculeFiscal: '0000000A/A/M/000',
  exercice: new Date().getFullYear(),
};

interface CompanyContextValue {
  company: Company;
  setExercice: (year: number) => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [exercice, setExercice] = useState(DEMO_COMPANY.exercice);
  const value = useMemo(() => ({ company: { ...DEMO_COMPANY, exercice }, setExercice }), [exercice]);
  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used inside <CompanyProvider>');
  return ctx;
}
