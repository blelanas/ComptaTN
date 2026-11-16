import { AlertCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FullPageLoader } from '@/components/FullPageLoader';
import {
  companyCode,
  currentExercice,
  emailKey,
  todayIso,
  type Company,
  type CompanyInfo,
  type Exercice,
  type Invitation,
} from '@/features/societes/model';
import { errorMessage } from './errors';
import { useCurrentUser, useSession } from './session';

export type { Company } from '@/features/societes/model';

/**
 * Companies the user can access, the selected company and its selected
 * exercice. Renders `onboarding` while the user has no company yet.
 */
interface CompaniesContextValue {
  companies: Company[];
  company: Company | null;
  exercice: Exercice | null;
  invitations: Invitation[];
  isOwner: boolean;
  switchCompany: (id: string) => void;
  setExercice: (annee: number) => void;
  createCompany: (info: CompanyInfo, exercice: Exercice) => Promise<Company>;
  updateCompany: (patch: Partial<CompanyInfo> & { exercices?: Exercice[] }) => Promise<void>;
  invite: (email: string) => Promise<void>;
  cancelInvite: (email: string) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  acceptInvitation: (invitation: Invitation) => Promise<void>;
  declineInvitation: (invitation: Invitation) => Promise<void>;
  reload: () => Promise<void>;
}

const CompaniesContext = createContext<CompaniesContextValue | null>(null);

function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preference only: ignore when storage is blocked.
  }
}

const companyPrefKey = (uid: string) => `qayd.societe-courante.${uid}`;
const exercicePrefKey = (companyId: string) => `qayd.exercice.${companyId}`;

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' };

export function CompanyProvider({ children, onboarding }: { children: ReactNode; onboarding: ReactNode }) {
  const { user, repo } = useCurrentUser();
  const { signOut } = useSession();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() => readPref(companyPrefKey(user.uid)));
  const [exerciceByCompany, setExerciceByCompany] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    setLoad({ status: 'loading' });
    try {
      const [list, invites] = await Promise.all([repo.listCompanies(), repo.listMyInvitations().catch(() => [])]);
      setCompanies(list);
      setInvitations(invites);
      setLoad({ status: 'ready' });
    } catch (e) {
      setLoad({ status: 'error', message: errorMessage(e) });
    }
  }, [repo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const company = companies.find((c) => c.id === selectedId) ?? companies[0] ?? null;

  const exercice = useMemo(() => {
    if (!company || company.exercices.length === 0) return null;
    const chosen = exerciceByCompany[company.id] ?? Number(readPref(exercicePrefKey(company.id)));
    return company.exercices.find((e) => e.annee === chosen) ?? currentExercice(company.exercices) ?? null;
  }, [company, exerciceByCompany]);

  const patchCompany = useCallback((id: string, update: (c: Company) => Company) => {
    setCompanies((list) => list.map((c) => (c.id === id ? update(c) : c)));
  }, []);

  const value = useMemo<CompaniesContextValue>(() => {
    const need = () => {
      if (!company) throw new Error('Aucune société sélectionnée.');
      return company;
    };
    return {
      companies,
      company,
      exercice,
      invitations,
      isOwner: !!company && company.ownerId === user.uid,
      reload,

      switchCompany: (id) => {
        setSelectedId(id);
        writePref(companyPrefKey(user.uid), id);
      },

      setExercice: (annee) => {
        if (!company) return;
        setExerciceByCompany((m) => ({ ...m, [company.id]: annee }));
        writePref(exercicePrefKey(company.id), String(annee));
      },

      createCompany: async (info, firstExercice) => {
        const created = await repo.createCompany(info, firstExercice);
        setCompanies((list) => [...list, created].sort((a, b) => a.raisonSociale.localeCompare(b.raisonSociale, 'fr')));
        setSelectedId(created.id);
        writePref(companyPrefKey(user.uid), created.id);
        return created;
      },

      updateCompany: async (patch) => {
        const c = need();
        await repo.updateCompany(c.id, patch);
        patchCompany(c.id, (prev) => ({
          ...prev,
          ...patch,
          code: patch.raisonSociale ? companyCode(patch.raisonSociale) : prev.code,
        }));
      },

      invite: async (email) => {
        const c = need();
        await repo.invite(c, email);
        patchCompany(c.id, (prev) => ({
          ...prev,
          invites: { ...prev.invites, [emailKey(email)]: { date: todayIso(), par: user.nom } },
        }));
      },

      cancelInvite: async (email) => {
        const c = need();
        await repo.cancelInvite(c, email);
        patchCompany(c.id, (prev) => {
          const invites = { ...prev.invites };
          delete invites[emailKey(email)];
          return { ...prev, invites };
        });
      },

      removeMember: async (uid) => {
        const c = need();
        await repo.removeMember(c, uid);
        patchCompany(c.id, (prev) => {
          const members = { ...prev.members };
          delete members[uid];
          return { ...prev, members, memberIds: prev.memberIds.filter((id) => id !== uid) };
        });
      },

      acceptInvitation: async (invitation) => {
        await repo.acceptInvitation(invitation);
        setSelectedId(invitation.companyId);
        writePref(companyPrefKey(user.uid), invitation.companyId);
        await reload();
      },

      declineInvitation: async (invitation) => {
        await repo.declineInvitation(invitation);
        setInvitations((list) => list.filter((i) => i.id !== invitation.id));
      },
    };
  }, [companies, company, exercice, invitations, user, repo, reload, patchCompany]);

  if (load.status === 'loading' && companies.length === 0) return <FullPageLoader label="Chargement de vos sociétés…" />;

  if (load.status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <div className="card max-w-md p-8 text-center">
          <AlertCircle className="mx-auto size-8 text-danger-600" />
          <h1 className="mt-4 text-lg font-bold">Impossible de charger vos sociétés</h1>
          <p className="mt-2 text-sm text-muted">{load.message}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn btn-secondary" onClick={() => void signOut()}>
              Se déconnecter
            </button>
            <button className="btn btn-primary" onClick={() => void reload()}>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CompaniesContext.Provider value={value}>{company && exercice ? children : onboarding}</CompaniesContext.Provider>
  );
}

/** All companies and actions; usable while the user has no company yet (onboarding). */
export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error('useCompanies must be used inside <CompanyProvider>');
  return ctx;
}

/** The selected company and exercice; always set inside the app shell. */
export function useCompany() {
  const ctx = useCompanies();
  if (!ctx.company || !ctx.exercice) throw new Error('useCompany needs a selected company');
  return { ...ctx, company: ctx.company, exercice: ctx.exercice };
}
