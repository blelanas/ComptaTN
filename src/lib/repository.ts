import type { Account } from '@/features/plan-comptable/accounts';
import type { Company, CompanyInfo, Exercice, Invitation } from '@/features/societes/model';

/**
 * Everything the app reads or writes. Two implementations:
 * - `repository.local.ts`: demo mode, browser storage only;
 * - `repository.firestore.ts`: signed-in users, Cloud Firestore.
 */
export interface Repository {
  kind: 'demo' | 'cloud';

  listCompanies(): Promise<Company[]>;
  createCompany(info: CompanyInfo, exercice: Exercice): Promise<Company>;
  updateCompany(companyId: string, patch: Partial<CompanyInfo> & { exercices?: Exercice[] }): Promise<void>;

  /** Null when the company still uses the untouched SCE reference chart. */
  loadPlan(companyId: string): Promise<Account[] | null>;
  savePlan(companyId: string, accounts: Account[]): Promise<void>;

  invite(company: Company, email: string): Promise<void>;
  cancelInvite(company: Company, email: string): Promise<void>;
  removeMember(company: Company, uid: string): Promise<void>;
  listMyInvitations(): Promise<Invitation[]>;
  acceptInvitation(invitation: Invitation): Promise<void>;
  declineInvitation(invitation: Invitation): Promise<void>;
}

export class DemoLimitError extends Error {
  constructor() {
    super('Les invitations sont disponibles avec un compte. Créez un compte gratuit pour inviter votre équipe.');
  }
}
