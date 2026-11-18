/**
 * Companies (sociétés), fiscal years (exercices) and members.
 * Pure logic only: no storage, no React. Covered by model.test.ts.
 */

export interface Exercice {
  /** Year the exercice closes in, used as its name (« Exercice 2026 »). */
  annee: number;
  /** ISO dates (YYYY-MM-DD), both inclusive. */
  debut: string;
  fin: string;
  statut: 'ouvert' | 'cloture';
}

export type Role = 'proprietaire' | 'membre';

export interface MemberInfo {
  nom: string;
  email: string;
  role: Role;
}

export interface PendingInvite {
  /** ISO date of the invitation. */
  date: string;
  /** Name of the person who invited. */
  par: string;
}

export interface Company {
  id: string;
  /** Two-letter badge shown in the company switcher. */
  code: string;
  raisonSociale: string;
  matriculeFiscal: string;
  activite: string;
  adresse: string;
  ville: string;
  devise: 'TND';
  exercices: Exercice[];
  ownerId: string;
  memberIds: string[];
  members: Record<string, MemberInfo>;
  /** Pending invitations, keyed by lower-case e-mail. */
  invites: Record<string, PendingInvite>;
}

export type CompanyInfo = Pick<Company, 'raisonSociale' | 'matriculeFiscal' | 'activite' | 'adresse' | 'ville'>;

/** An invitation addressed to the signed-in user. */
export interface Invitation {
  id: string;
  companyId: string;
  raisonSociale: string;
  email: string;
  invitedByName: string;
}

export const RAISON_SOCIALE_MAX = 120;
export const TEXT_MAX = 160;
export const EXERCICE_MAX_MONTHS = 24;

export const EMPTY_COMPANY_INFO: CompanyInfo = {
  raisonSociale: '',
  matriculeFiscal: '',
  activite: '',
  adresse: '',
  ville: '',
};

// ───────────────────────────── Company info ─────────────────────────────

/**
 * Tunisian matricule fiscal: 7 digits + control letter, optionally followed by
 * the VAT code, category and establishment number (« 1234567A/A/M/000 »).
 * Spaces and slashes are optional when typing; the result is canonical.
 * Returns null when the value cannot be a matricule fiscal.
 */
export function normalizeMatricule(value: string): string | null {
  const compact = value.toUpperCase().replace(/[\s/.-]+/g, '');
  if (compact === '') return '';
  if (/^\d{7}[A-Z]$/.test(compact)) return compact;
  const full = /^(\d{7}[A-Z])([A-Z])([A-Z])(\d{3})$/.exec(compact);
  if (full) return `${full[1]}/${full[2]}/${full[3]}/${full[4]}`;
  return null;
}

export type CompanyErrors = Partial<Record<keyof CompanyInfo, string>>;

export function validateCompanyInfo(info: CompanyInfo): CompanyErrors {
  const errors: CompanyErrors = {};
  const raison = info.raisonSociale.trim();
  if (!raison) errors.raisonSociale = 'La raison sociale est obligatoire.';
  else if (raison.length > RAISON_SOCIALE_MAX) errors.raisonSociale = `${RAISON_SOCIALE_MAX} caractères au maximum.`;
  if (normalizeMatricule(info.matriculeFiscal) === null) {
    errors.matriculeFiscal = 'Format attendu : 1234567A ou 1234567A/A/M/000.';
  }
  for (const key of ['activite', 'adresse', 'ville'] as const) {
    if (info[key].trim().length > TEXT_MAX) errors[key] = `${TEXT_MAX} caractères au maximum.`;
  }
  return errors;
}

/** Trims every field and puts the matricule in canonical form. Call after validation. */
export function cleanCompanyInfo(info: CompanyInfo): CompanyInfo {
  return {
    raisonSociale: info.raisonSociale.trim(),
    matriculeFiscal: normalizeMatricule(info.matriculeFiscal) ?? info.matriculeFiscal.trim(),
    activite: info.activite.trim(),
    adresse: info.adresse.trim(),
    ville: info.ville.trim(),
  };
}

const LEGAL_FORMS = new Set(['SARL', 'SUARL', 'SA', 'SAS', 'SNC', 'SCS', 'STE', 'SOCIETE', 'STÉ', 'SOCIÉTÉ', 'ETS', 'EURL']);
const STOP_WORDS = new Set(['DE', 'DES', 'DU', 'LA', 'LE', 'LES', 'ET', 'D', 'L', 'AU', 'AUX', 'POUR']);

/** Two-letter badge: initials of the first meaningful words (« Atlas Conseil SARL » → « AC »). */
export function companyCode(raisonSociale: string): string {
  const words = raisonSociale
    .toUpperCase()
    .split(/[^0-9A-ZÀ-ÖØ-Ý]+/)
    .filter((w) => w && !LEGAL_FORMS.has(w) && !STOP_WORDS.has(w));
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

// ───────────────────────────── Dates & exercices ─────────────────────────────

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseIso(iso: string): Date | null {
  if (!ISO_RE.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : d;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = parseIso(iso)!;
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Same day N months later, clamped to the end of the month. */
function addMonths(iso: string, months: number): string {
  const d = parseIso(iso)!;
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toIso(d);
}

export function todayIso(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** 01/01/2026 → displayed French date. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function exerciceCalendaire(annee: number): Exercice {
  return { annee, debut: `${annee}-01-01`, fin: `${annee}-12-31`, statut: 'ouvert' };
}

/** Builds an exercice from free dates; its name is the closing year. */
export function makeExercice(debut: string, fin: string): Exercice {
  return { annee: Number(fin.slice(0, 4)), debut, fin, statut: 'ouvert' };
}

export function sortExercices(exercices: Exercice[]): Exercice[] {
  return [...exercices].sort((a, b) => b.debut.localeCompare(a.debut));
}

/** Returns an error message, or null when the dates are acceptable. */
export function validateExercice(debut: string, fin: string, others: Exercice[]): string | null {
  const d = parseIso(debut);
  const f = parseIso(fin);
  if (!d || !f) return 'Indiquez une date de début et une date de fin.';
  if (fin <= debut) return 'La date de fin doit être après la date de début.';
  if (fin > addDays(addMonths(debut, EXERCICE_MAX_MONTHS), -1)) {
    return `Un exercice ne peut pas dépasser ${EXERCICE_MAX_MONTHS} mois.`;
  }
  const overlap = others.find((o) => debut <= o.fin && fin >= o.debut);
  if (overlap) return `Ces dates chevauchent l’exercice ${overlap.annee}.`;
  const sameName = others.find((o) => o.annee === Number(fin.slice(0, 4)));
  if (sameName) return `Un exercice se termine déjà en ${sameName.annee}.`;
  return null;
}

/** The exercice that follows the latest one: starts the next day, lasts 12 months. */
export function nextExercice(exercices: Exercice[]): Exercice {
  if (exercices.length === 0) return exerciceCalendaire(new Date().getFullYear());
  const last = sortExercices(exercices)[0];
  const debut = addDays(last.fin, 1);
  return makeExercice(debut, addDays(addMonths(debut, 12), -1));
}

/** The exercice containing today, otherwise the most recent one. */
export function currentExercice(exercices: Exercice[], today = todayIso()): Exercice | undefined {
  return exercices.find((e) => e.debut <= today && today <= e.fin) ?? sortExercices(exercices)[0];
}

// ───────────────────────────── Members & invitations ─────────────────────────────

export const emailKey = (email: string) => email.trim().toLowerCase();

export const invitationId = (companyId: string, email: string) => `${companyId}__${emailKey(email)}`;

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Indiquez une adresse e-mail.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Adresse e-mail invalide.';
  return null;
}

/** Checks an invitation before sending it. */
export function validateInvite(company: Company, email: string): string | null {
  const error = validateEmail(email);
  if (error) return error;
  const key = emailKey(email);
  if (Object.values(company.members).some((m) => emailKey(m.email) === key)) return 'Cette personne a déjà accès à la société.';
  if (company.invites[key]) return 'Une invitation est déjà en attente pour cette adresse.';
  return null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
