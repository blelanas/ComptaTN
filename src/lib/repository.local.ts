import { sortAccounts, type Account } from '@/features/plan-comptable/accounts';
import { companyCode, exerciceCalendaire, type Company } from '@/features/societes/model';
import { DemoLimitError, type Repository } from './repository';

/** Demo mode: data stays in this browser (localStorage). */

const COMPANIES_KEY = 'qayd.demo.societes.v1';
const planKey = (companyId: string) => `qayd.plan-comptable.v1.${companyId}`;
export const DEMO_UID = 'demo';

function demoCompany(): Company {
  return {
    id: 'demo',
    code: 'SD',
    raisonSociale: 'Société de démonstration',
    matriculeFiscal: '0000000A/A/M/000',
    activite: 'Commerce de détail',
    adresse: 'Avenue Habib Bourguiba',
    ville: 'Tunis',
    devise: 'TND',
    exercices: [exerciceCalendaire(new Date().getFullYear())],
    ownerId: DEMO_UID,
    memberIds: [DEMO_UID],
    members: { [DEMO_UID]: { nom: 'Compte démo', email: 'demo@qayd.tn', role: 'proprietaire' } },
    invites: {},
  };
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Keeps a copy in memory so the demo still works when storage is blocked. */
const memory = new Map<string, unknown>();

function write(key: string, value: unknown) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode…): the in-memory copy is used.
  }
}

function get<T>(key: string): T | null {
  return read<T>(key) ?? ((memory.get(key) as T | undefined) ?? null);
}

function companies(): Company[] {
  const list = get<Company[]>(COMPANIES_KEY);
  if (Array.isArray(list) && list.length > 0) return list;
  const seeded = [demoCompany()];
  write(COMPANIES_KEY, seeded);
  return seeded;
}

export function createLocalRepository(): Repository {
  return {
    kind: 'demo',

    async listCompanies() {
      return companies();
    },

    async createCompany(info, exercice) {
      const company: Company = {
        ...demoCompany(),
        ...info,
        id: `demo-${Date.now().toString(36)}`,
        code: companyCode(info.raisonSociale),
        exercices: [exercice],
      };
      write(COMPANIES_KEY, [...companies(), company]);
      return company;
    },

    async updateCompany(companyId, patch) {
      write(
        COMPANIES_KEY,
        companies().map((c) =>
          c.id === companyId
            ? { ...c, ...patch, code: patch.raisonSociale ? companyCode(patch.raisonSociale) : c.code }
            : c,
        ),
      );
    },

    async loadPlan(companyId) {
      const accounts = get<Account[]>(planKey(companyId));
      return Array.isArray(accounts) && accounts.length > 0 ? sortAccounts(accounts) : null;
    },

    async savePlan(companyId, accounts) {
      write(planKey(companyId), accounts);
    },

    async invite() {
      throw new DemoLimitError();
    },
    async cancelInvite() {
      throw new DemoLimitError();
    },
    async removeMember() {
      throw new DemoLimitError();
    },
    async listMyInvitations() {
      return [];
    },
    async acceptInvitation() {
      throw new DemoLimitError();
    },
    async declineInvitation() {
      throw new DemoLimitError();
    },
  };
}
