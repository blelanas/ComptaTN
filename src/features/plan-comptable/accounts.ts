/**
 * Pure logic for the chart of accounts (no React). Everything here is unit-tested.
 *
 * UX rule that keeps things simple: the user never picks an account "type".
 * An account that has sub-accounts is automatically a *compte de regroupement*;
 * any other account is *imputable* (entries can be posted on it).
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

export const NUMERO_MIN = 2;
export const NUMERO_MAX = 10;
export const LIBELLE_MAX = 120;

export function referenceAccounts(): Account[] {
  return SCE_REFERENCE.map(([numero, libelle]) => ({ numero, libelle, actif: true, origine: 'sce' as const }));
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
      isGroup: false,
      lettrable: account.numero.startsWith('40') || account.numero.startsWith('41'),
    };
    nodes.set(account.numero, node);
    if (parentNode) {
      parentNode.children.push(account.numero);
      parentNode.isGroup = true;
    }
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
  if (n.length < NUMERO_MIN) return `Au moins ${NUMERO_MIN} chiffres (ex. 40, 401).`;
  if (n.length > NUMERO_MAX) return `Au plus ${NUMERO_MAX} chiffres.`;
  if (existing.has(n)) return 'Ce numéro existe déjà dans le plan.';
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

/** Next free sub-account number under `parent` (4011, 4012… then 40110…). */
export function suggestChildNumero(parent: string, accounts: Account[]): string {
  const existing = new Set(accounts.map((a) => a.numero));
  for (let d = 1; d <= 9; d++) {
    const candidate = `${parent}${d}`;
    if (!existing.has(candidate)) return candidate;
  }
  for (let d = 10; d <= 99; d++) {
    const candidate = `${parent}${d}`;
    if (candidate.length <= NUMERO_MAX && !existing.has(candidate)) return candidate;
  }
  return parent;
}

export function canDelete(numero: string, tree: Map<string, AccountNode>): { ok: boolean; reason?: string } {
  const node = tree.get(numero);
  if (!node) return { ok: false, reason: 'Compte introuvable.' };
  if (node.children.length > 0) {
    return { ok: false, reason: 'Ce compte a des sous-comptes : supprimez-les ou désactivez-le.' };
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
      [node.numero, node.libelle, node.isGroup ? 'Regroupement' : 'Imputable', node.actif ? 'Oui' : 'Non']
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
    rows.push({ line: index + 1, numero: numero.replace(/\s/g, ''), libelle });
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
