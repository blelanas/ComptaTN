/**
 * Pure logic for the chart of accounts (no React). Everything here is unit-tested.
 *
 * Numbering (same convention as most Tunisian accounting software):
 * - 2 or 3 digits  → *compte de regroupement* (40, 401): groups accounts, no entries;
 * - 8 digits       → *compte de mouvement* (40100186): entries are posted on it.
 * The user never picks a type: it follows from the length of the number, and the
 * parent is the longest group whose number is a prefix (40100186 → 401 → 40).
 */
import { ACCOUNT_CLASSES, SCE_REFERENCE } from './sceReference';

export interface Account {
  numero: string;
  libelle: string;
  actif: boolean;
  /** 'sce' = comes from the reference chart, 'perso' = created or imported by the user. */
  origine: 'sce' | 'perso';
}

export interface AccountNode extends Account {
  classe: string;
  parent: string | null;
  depth: number;
  children: string[];
  isGroup: boolean;
  /** Third-party accounts (suppliers 40x, customers 41x) can be matched (lettrage). */
  lettrable: boolean;
}

/** Length of a compte de mouvement. */
export const MOUVEMENT_LENGTH = 8;
export const LIBELLE_MAX = 120;

export function isGroupNumero(numero: string): boolean {
  return numero.length <= 3;
}

/** 4011 → 40110000. Numbers of 4 to 7 digits are completed with zeros. */
export function padNumero(numero: string): string {
  return numero.length > 3 && numero.length < MOUVEMENT_LENGTH ? numero.padEnd(MOUVEMENT_LENGTH, '0') : numero;
}

/**
 * Converts a chart written with variable-length numbers (1011, 4366, 43661…)
 * to the 8-digit convention:
 * - 2-digit accounts stay groups (one without sub-accounts also gets a 8-digit account);
 * - 3-digit accounts with sub-accounts stay groups, the others become 8-digit accounts;
 * - longer numbers are completed with zeros.
 */
export function toEightDigits(accounts: Account[]): Account[] {
  const numeros = accounts.map((a) => a.numero);
  const hasChildren = (n: string) => numeros.some((other) => other !== n && other.startsWith(n));
  const out = new Map<string, Account>();
  const put = (account: Account) => {
    if (!out.has(account.numero)) out.set(account.numero, account);
  };
  for (const account of sortAccounts(accounts)) {
    const n = account.numero;
    if (n.length === 2) {
      put(account);
      if (!hasChildren(n)) put({ ...account, numero: n.padEnd(MOUVEMENT_LENGTH, '0') });
    } else if (n.length === 3 && hasChildren(n)) {
      put(account);
    } else {
      put({ ...account, numero: n.length < MOUVEMENT_LENGTH ? n.padEnd(MOUVEMENT_LENGTH, '0') : n });
    }
  }
  return sortAccounts([...out.values()]);
}

/** Plans saved before the 8-digit convention contain 4- to 7-digit numbers. */
export function needsEightDigitMigration(accounts: Account[]): boolean {
  return accounts.some((a) => a.numero.length > 3 && a.numero.length < MOUVEMENT_LENGTH);
}

export function referenceAccounts(): Account[] {
  return toEightDigits(SCE_REFERENCE.map(([numero, libelle]) => ({ numero, libelle, actif: true, origine: 'sce' as const })));
}

export function sortAccounts(accounts: Account[]): Account[] {
  // Lexicographic order on digit strings = depth-first order of the prefix tree.
  return [...accounts].sort((a, b) => (a.numero < b.numero ? -1 : a.numero > b.numero ? 1 : 0));
}

export function findParent(numero: string, numeros: Set<string>): string | null {
  for (let len = numero.length - 1; len >= 1; len--) {
    const candidate = numero.slice(0, len);
    if (numeros.has(candidate)) return candidate;
  }
  return null;
}

export function buildTree(accounts: Account[]): Map<string, AccountNode> {
  const sorted = sortAccounts(accounts);
  const numeros = new Set(sorted.map((a) => a.numero));
  const nodes = new Map<string, AccountNode>();

  for (const account of sorted) {
    const parent = findParent(account.numero, numeros);
    const parentNode = parent ? nodes.get(parent) : undefined;
    const node: AccountNode = {
      ...account,
      classe: account.numero[0],
      parent,
      depth: parentNode ? parentNode.depth + 1 : 0,
      children: [],
      isGroup: isGroupNumero(account.numero),
      lettrable: account.numero.startsWith('40') || account.numero.startsWith('41'),
    };
    nodes.set(account.numero, node);
    if (parentNode) parentNode.children.push(account.numero);
  }
  return nodes;
}

export function ancestors(numero: string, tree: Map<string, AccountNode>): AccountNode[] {
  const out: AccountNode[] = [];
  let current = tree.get(numero)?.parent ?? null;
  while (current) {
    const node = tree.get(current);
    if (!node) break;
    out.unshift(node);
    current = node.parent;
  }
  return out;
}

export function classLabel(classe: string): string {
  return ACCOUNT_CLASSES.find((c) => c.id === classe)?.label ?? `Classe ${classe}`;
}

/** Accent- and case-insensitive text used for search. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .toLowerCase()
    .trim();
}

export function matchesQuery(account: Account, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  if (/^\d+$/.test(q)) return account.numero.startsWith(q);
  return normalize(account.libelle).includes(q) || account.numero.startsWith(q);
}

// ───────────────────────────── Validation ─────────────────────────────

export interface AccountDraft {
  numero: string;
  libelle: string;
}

export interface ValidationErrors {
  numero?: string;
  libelle?: string;
}

export function validateNumero(numero: string, existing: Set<string>): string | undefined {
  const n = numero.trim();
  if (!n) return 'Saisissez un numéro de compte.';
  if (!/^\d+$/.test(n)) return 'Le numéro ne doit contenir que des chiffres.';
  if (!/^[1-7]/.test(n)) return 'Le numéro doit commencer par une classe de 1 à 7.';
  if (n.length < 2) return 'Au moins 2 chiffres (ex. 40, 401).';
  if (n.length > 3 && n.length !== MOUVEMENT_LENGTH) {
    return `Un compte de mouvement a ${MOUVEMENT_LENGTH} chiffres (ex. 40100186) ; un regroupement en a 2 ou 3 (ex. 401).`;
  }
  if (existing.has(n)) return `Le compte ${n} existe déjà dans le plan.`;
  return undefined;
}

export function validateLibelle(libelle: string): string | undefined {
  const l = libelle.trim();
  if (!l) return 'Saisissez un libellé.';
  if (l.length > LIBELLE_MAX) return `Au plus ${LIBELLE_MAX} caractères.`;
  return undefined;
}

export function validateNewAccount(draft: AccountDraft, accounts: Account[]): ValidationErrors {
  const existing = new Set(accounts.map((a) => a.numero));
  const errors: ValidationErrors = {};
  const numero = validateNumero(draft.numero, existing);
  const libelle = validateLibelle(draft.libelle);
  if (numero) errors.numero = numero;
  if (libelle) errors.libelle = libelle;
  return errors;
}

/**
 * Next free 8-digit account under a group: 401 → 40100000, then the number
 * following the highest existing one (40100186 → 40100187).
 */
export function suggestChildNumero(parent: string, accounts: Account[]): string {
  const existing = new Set(accounts.map((a) => a.numero));
  const base = parent.padEnd(MOUVEMENT_LENGTH, '0');
  const siblings = accounts
    .map((a) => a.numero)
    .filter((n) => n.length === MOUVEMENT_LENGTH && n.startsWith(parent))
    .map(Number);
  let candidate = siblings.length ? Math.max(...siblings) + 1 : Number(base);
  for (let tries = 0; tries < 10_000; tries++, candidate++) {
    const s = String(candidate).padStart(MOUVEMENT_LENGTH, '0');
    if (!s.startsWith(parent)) break;
    if (!existing.has(s)) return s;
  }
  // The end of the range is taken: look for a gap from the start.
  for (let n = Number(base); ; n++) {
    const s = String(n).padStart(MOUVEMENT_LENGTH, '0');
    if (!s.startsWith(parent)) return base;
    if (!existing.has(s)) return s;
  }
}

export function canDelete(numero: string, tree: Map<string, AccountNode>): { ok: boolean; reason?: string } {
  const node = tree.get(numero);
  if (!node) return { ok: false, reason: 'Compte introuvable.' };
  if (node.children.length > 0) {
    return { ok: false, reason: 'Ce regroupement contient des comptes : supprimez-les d’abord, ou fermez-le.' };
  }
  return { ok: true };
}

// ───────────────────────────── CSV import / export ─────────────────────────────

const CSV_HEADER = ['Numéro', 'Libellé', 'Type', 'Actif'];

function csvCell(value: string): string {
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Semicolon-separated + UTF-8 BOM: opens correctly in French Excel. */
export function toCsv(accounts: Account[]): string {
  const tree = buildTree(accounts);
  const lines = [CSV_HEADER.join(';')];
  for (const node of tree.values()) {
    lines.push(
      [node.numero, node.libelle, node.isGroup ? 'Regroupement' : 'Mouvement', node.actif ? 'Oui' : 'Non']
        .map(csvCell)
        .join(';'),
    );
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

function detectDelimiter(line: string): string {
  const counts = [';', '\t', ','].map((d) => [d, line.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ';';
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      cells.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

export interface CsvRow {
  line: number;
  numero: string;
  libelle: string;
}

export function parseCsv(text: string): CsvRow[] {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/);
  const firstContent = lines.find((l) => l.trim()) ?? '';
  const delimiter = detectDelimiter(firstContent);
  const rows: CsvRow[] = [];
  lines.forEach((raw, index) => {
    if (!raw.trim()) return;
    const [numero = '', libelle = ''] = parseCsvLine(raw, delimiter);
    // Skip a header line (first cell is not a number).
    if (rows.length === 0 && !/\d/.test(numero)) return;
    // Plans exported by other software often use 4 to 7 digits: complete them to 8.
    rows.push({ line: index + 1, numero: padNumero(numero.replace(/[\s.]/g, '')), libelle });
  });
  return rows;
}

export type ImportStatus = 'nouveau' | 'modifie' | 'identique' | 'erreur';

export interface ImportLine extends CsvRow {
  status: ImportStatus;
  message?: string;
}

export function planImport(rows: CsvRow[], accounts: Account[]): ImportLine[] {
  const byNumero = new Map(accounts.map((a) => [a.numero, a]));
  const seen = new Set<string>();
  return rows.map((row) => {
    const numeroError = validateNumero(row.numero, new Set());
    const libelleError = validateLibelle(row.libelle);
    if (numeroError || libelleError) {
      return { ...row, status: 'erreur', message: numeroError ?? libelleError };
    }
    if (seen.has(row.numero)) {
      return { ...row, status: 'erreur', message: 'Numéro en double dans le fichier.' };
    }
    seen.add(row.numero);
    const existing = byNumero.get(row.numero);
    if (!existing) return { ...row, status: 'nouveau' };
    if (existing.libelle.trim() === row.libelle.trim()) return { ...row, status: 'identique' };
    return { ...row, status: 'modifie', message: `Ancien libellé : ${existing.libelle}` };
  });
}

export function applyImport(accounts: Account[], lines: ImportLine[]): Account[] {
  const byNumero = new Map(accounts.map((a) => [a.numero, { ...a }]));
  for (const line of lines) {
    if (line.status === 'nouveau') {
      byNumero.set(line.numero, { numero: line.numero, libelle: line.libelle.trim(), actif: true, origine: 'perso' });
    } else if (line.status === 'modifie') {
      const current = byNumero.get(line.numero)!;
      byNumero.set(line.numero, { ...current, libelle: line.libelle.trim() });
    }
  }
  return sortAccounts([...byNumero.values()]);
}
