import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyImport, buildTree, referenceAccounts, sortAccounts, type Account, type AccountNode, type ImportLine } from './accounts';
import { useCompany } from '@/lib/company';

/**
 * Chart-of-accounts state for the current company.
 *
 * Persistence is local (browser storage) for this first iteration. The
 * component API (add / update / remove / importLines / reset) is the
 * contract the future backend API will implement.
 */
interface PlanComptableContextValue {
  accounts: Account[];
  tree: Map<string, AccountNode>;
  add: (account: Pick<Account, 'numero' | 'libelle'>) => void;
  update: (numero: string, patch: Partial<Pick<Account, 'libelle' | 'actif'>>) => void;
  remove: (numero: string) => void;
  importLines: (lines: ImportLine[]) => void;
  reset: () => void;
}

const PlanComptableContext = createContext<PlanComptableContextValue | null>(null);

const storageKey = (companyId: string) => `qayd.plan-comptable.v1.${companyId}`;

function load(companyId: string): Account[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (raw) {
      const parsed = JSON.parse(raw) as Account[];
      if (Array.isArray(parsed) && parsed.length > 0) return sortAccounts(parsed);
    }
  } catch {
    // Storage unavailable or corrupted: fall back to the reference chart.
  }
  return referenceAccounts();
}

function save(companyId: string, accounts: Account[]) {
  try {
    localStorage.setItem(storageKey(companyId), JSON.stringify(accounts));
  } catch {
    // Storage unavailable (private mode…): changes stay in memory for this session.
  }
}

export function PlanComptableProvider({ children }: { children: ReactNode }) {
  const { company } = useCompany();
  const [accounts, setAccounts] = useState<Account[]>(() => load(company.id));

  useEffect(() => {
    setAccounts(load(company.id));
  }, [company.id]);

  const commit = useCallback(
    (next: (prev: Account[]) => Account[]) => {
      setAccounts((prev) => {
        const value = sortAccounts(next(prev));
        save(company.id, value);
        return value;
      });
    },
    [company.id],
  );

  const value = useMemo<PlanComptableContextValue>(
    () => ({
      accounts,
      tree: buildTree(accounts),
      add: ({ numero, libelle }) =>
        commit((prev) => [...prev, { numero: numero.trim(), libelle: libelle.trim(), actif: true, origine: 'perso' }]),
      update: (numero, patch) =>
        commit((prev) =>
          prev.map((a) =>
            a.numero === numero ? { ...a, ...patch, libelle: (patch.libelle ?? a.libelle).trim() } : a,
          ),
        ),
      remove: (numero) => commit((prev) => prev.filter((a) => a.numero !== numero)),
      importLines: (lines) => commit((prev) => applyImport(prev, lines)),
      reset: () => commit(() => referenceAccounts()),
    }),
    [accounts, commit],
  );

  return <PlanComptableContext.Provider value={value}>{children}</PlanComptableContext.Provider>;
}

export function usePlanComptable() {
  const ctx = useContext(PlanComptableContext);
  if (!ctx) throw new Error('usePlanComptable must be used inside <PlanComptableProvider>');
  return ctx;
}
