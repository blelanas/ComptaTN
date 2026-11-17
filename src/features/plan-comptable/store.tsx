import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  applyImport,
  buildTree,
  needsEightDigitMigration,
  referenceAccounts,
  sortAccounts,
  toEightDigits,
  type Account,
  type AccountNode,
  type ImportLine,
} from './accounts';
import { useCompany } from '@/lib/company';
import { errorMessage } from '@/lib/errors';
import { useCurrentUser } from '@/lib/session';

/**
 * Chart-of-accounts state for the current company.
 *
 * Changes show at once; saving happens in the background (Firestore for
 * signed-in users, the browser in demo mode). Rapid edits are grouped into
 * one write.
 */
export type LoadStatus = 'loading' | 'ready' | 'error';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface PlanComptableContextValue {
  accounts: Account[];
  tree: Map<string, AccountNode>;
  status: LoadStatus;
  loadError: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  add: (account: Pick<Account, 'numero' | 'libelle'>) => void;
  update: (numero: string, patch: Partial<Pick<Account, 'libelle' | 'actif'>>) => void;
  remove: (numero: string) => void;
  importLines: (lines: ImportLine[]) => void;
  reset: () => void;
  retry: () => void;
}

const PlanComptableContext = createContext<PlanComptableContextValue | null>(null);

const SAVE_DELAY_MS = 600;

export function PlanComptableProvider({ children }: { children: ReactNode }) {
  const { company } = useCompany();
  const { repo } = useCurrentUser();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const current = useRef<Account[]>([]);
  const pending = useRef<{ companyId: string; accounts: Account[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    chain.current = chain.current.then(async () => {
      try {
        await repo.savePlan(job.companyId, job.accounts);
        if (!pending.current) {
          setSaveStatus('saved');
          setSaveError(null);
        }
      } catch (e) {
        // Keep the failed version so "Réessayer" can send it again.
        pending.current ??= job;
        setSaveStatus('error');
        setSaveError(errorMessage(e));
      }
    });
  }, [repo]);

  // Load the plan of the selected company. Pending changes of the previous one are saved first.
  useEffect(() => {
    flush();
    let cancelled = false;
    setStatus('loading');
    setLoadError(null);
    setSaveStatus('idle');
    current.current = [];
    setAccounts([]);
    repo
      .loadPlan(company.id)
      .then((saved) => {
        if (cancelled) return;
        // Plans saved before the 8-digit convention are converted when opened
        // (and written back with the next change).
        const value = !saved ? referenceAccounts() : needsEightDigitMigration(saved) ? toEightDigits(saved) : saved;
        current.current = value;
        setAccounts(value);
        setStatus('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(errorMessage(e));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [company.id, repo, flush, reloadKey]);

  // Save right away when leaving, and warn if a save is still running.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current || timer.current) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      flush();
    };
  }, [flush]);

  const commit = useCallback(
    (next: (prev: Account[]) => Account[]) => {
      if (status !== 'ready') return;
      const value = sortAccounts(next(current.current));
      current.current = value;
      setAccounts(value);
      pending.current = { companyId: company.id, accounts: value };
      setSaveStatus('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [company.id, flush, status],
  );

  const tree = useMemo(() => buildTree(accounts), [accounts]);

  const value = useMemo<PlanComptableContextValue>(
    () => ({
      accounts,
      tree,
      status,
      loadError,
      saveStatus,
      saveError,
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
      retry: () => {
        if (status === 'error') {
          setReloadKey((k) => k + 1);
          return;
        }
        if (!pending.current) pending.current = { companyId: company.id, accounts: current.current };
        setSaveStatus('saving');
        flush();
      },
    }),
    [accounts, tree, status, loadError, saveStatus, saveError, commit, flush, company.id],
  );

  return <PlanComptableContext.Provider value={value}>{children}</PlanComptableContext.Provider>;
}

export function usePlanComptable() {
  const ctx = useContext(PlanComptableContext);
  if (!ctx) throw new Error('usePlanComptable must be used inside <PlanComptableProvider>');
  return ctx;
}
