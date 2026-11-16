import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { sortAccounts, type Account } from '@/features/plan-comptable/accounts';
import {
  companyCode,
  emailKey,
  invitationId,
  todayIso,
  type Company,
  type Invitation,
} from '@/features/societes/model';
import type { Repository } from './repository';

/**
 * Cloud Firestore data model (security rules: firestore.rules):
 *
 *   companies/{companyId}            company info, exercices, members, pending invites
 *   companies/{companyId}/data/plan  the chart of accounts, one document
 *   invitations/{companyId}__{email} lets an invited person find the invitation
 *
 * The chart of accounts is a single document so that opening it costs one read
 * (the free plan allows 50 000 reads a day).
 */

export interface RepositoryUser {
  uid: string;
  email: string;
  nom: string;
}

function toCompany(id: string, data: DocumentData): Company {
  return {
    id,
    code: data.code ?? companyCode(data.raisonSociale ?? ''),
    raisonSociale: data.raisonSociale ?? '',
    matriculeFiscal: data.matriculeFiscal ?? '',
    activite: data.activite ?? '',
    adresse: data.adresse ?? '',
    ville: data.ville ?? '',
    devise: 'TND',
    exercices: Array.isArray(data.exercices) ? data.exercices : [],
    ownerId: data.ownerId,
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    members: data.members ?? {},
    invites: data.invites ?? {},
  };
}

export function createFirestoreRepository(db: Firestore, user: RepositoryUser): Repository {
  const companyRef = (id: string) => doc(db, 'companies', id);
  const planRef = (id: string) => doc(db, 'companies', id, 'data', 'plan');
  const invitationRef = (companyId: string, email: string) => doc(db, 'invitations', invitationId(companyId, email));
  const me = { nom: user.nom, email: emailKey(user.email) };

  return {
    kind: 'cloud',

    async listCompanies() {
      const snap = await getDocs(query(collection(db, 'companies'), where('memberIds', 'array-contains', user.uid)));
      return snap.docs
        .map((d) => toCompany(d.id, d.data()))
        .sort((a, b) => a.raisonSociale.localeCompare(b.raisonSociale, 'fr'));
    },

    async createCompany(info, exercice) {
      const ref = doc(collection(db, 'companies'));
      const data = {
        ...info,
        code: companyCode(info.raisonSociale),
        devise: 'TND',
        exercices: [exercice],
        ownerId: user.uid,
        memberIds: [user.uid],
        members: { [user.uid]: { ...me, role: 'proprietaire' } },
        invites: {},
        createdAt: serverTimestamp(),
      };
      await setDoc(ref, data);
      return toCompany(ref.id, data);
    },

    async updateCompany(companyId, patch) {
      await updateDoc(companyRef(companyId), {
        ...patch,
        ...(patch.raisonSociale ? { code: companyCode(patch.raisonSociale) } : {}),
        updatedAt: serverTimestamp(),
      });
    },

    async loadPlan(companyId) {
      const snap = await getDoc(planRef(companyId));
      const accounts = snap.exists() ? (snap.data().accounts as Account[] | undefined) : undefined;
      return Array.isArray(accounts) && accounts.length > 0 ? sortAccounts(accounts) : null;
    },

    async savePlan(companyId, accounts) {
      await setDoc(planRef(companyId), {
        accounts: accounts.map(({ numero, libelle, actif, origine }) => ({ numero, libelle, actif, origine })),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
    },

    async invite(company, email) {
      const key = emailKey(email);
      const batch = writeBatch(db);
      batch.set(invitationRef(company.id, key), {
        companyId: company.id,
        raisonSociale: company.raisonSociale,
        email: key,
        invitedBy: user.uid,
        invitedByName: user.nom,
        createdAt: serverTimestamp(),
      });
      batch.update(companyRef(company.id), new FieldPath('invites', key), { date: todayIso(), par: user.nom });
      await batch.commit();
    },

    async cancelInvite(company, email) {
      const key = emailKey(email);
      const batch = writeBatch(db);
      batch.delete(invitationRef(company.id, key));
      batch.update(companyRef(company.id), new FieldPath('invites', key), deleteField());
      await batch.commit();
    },

    async removeMember(company, uid) {
      await updateDoc(
        companyRef(company.id),
        new FieldPath('members', uid),
        deleteField(),
        'memberIds',
        arrayRemove(uid),
      );
    },

    async listMyInvitations() {
      const snap = await getDocs(query(collection(db, 'invitations'), where('email', '==', me.email)));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          companyId: data.companyId,
          raisonSociale: data.raisonSociale ?? '',
          email: data.email,
          invitedByName: data.invitedByName ?? '',
        };
      });
    },

    async acceptInvitation(invitation: Invitation) {
      const batch = writeBatch(db);
      batch.update(
        companyRef(invitation.companyId),
        'memberIds',
        arrayUnion(user.uid),
        new FieldPath('members', user.uid),
        { ...me, role: 'membre' },
        new FieldPath('invites', me.email),
        deleteField(),
      );
      batch.delete(doc(db, 'invitations', invitation.id));
      await batch.commit();
    },

    async declineInvitation(invitation: Invitation) {
      const batch = writeBatch(db);
      batch.update(companyRef(invitation.companyId), new FieldPath('invites', me.email), deleteField());
      batch.delete(doc(db, 'invitations', invitation.id));
      await batch.commit();
    },
  };
}
