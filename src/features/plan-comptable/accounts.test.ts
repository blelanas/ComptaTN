import { describe, expect, it } from 'vitest';
import {
  applyImport,
  buildTree,
  canDelete,
  matchesQuery,
  needsEightDigitMigration,
  parseCsv,
  planImport,
  referenceAccounts,
  suggestChildNumero,
  toCsv,
  toEightDigits,
  validateNewAccount,
  type Account,
} from './accounts';

const acc = (numero: string, libelle = `Compte ${numero}`): Account => ({ numero, libelle, actif: true, origine: 'sce' });

describe('reference chart', () => {
  it('has unique numbers, all within classes 1–7', () => {
    const accounts = referenceAccounts();
    const numeros = accounts.map((a) => a.numero);
    expect(new Set(numeros).size).toBe(numeros.length);
    expect(numeros.every((n) => /^[1-7]\d+$/.test(n))).toBe(true);
  });

  it('uses 2–3 digit groups and 8-digit accounts only', () => {
    const lengths = new Set(referenceAccounts().map((a) => a.numero.length));
    expect([...lengths].sort()).toEqual([2, 3, 8]);
  });

  it('attaches every account except the 2-digit groups to a parent', () => {
    const tree = buildTree(referenceAccounts());
    const orphans = [...tree.values()].filter((n) => n.numero.length > 2 && !n.parent);
    expect(orphans.map((o) => o.numero)).toEqual([]);
  });
});

describe('toEightDigits', () => {
  it('keeps groups that have sub-accounts and pads the rest', () => {
    const out = toEightDigits([acc('40'), acc('401'), acc('4011'), acc('411'), acc('4366'), acc('43661'), acc('17')]);
    expect(out.map((a) => a.numero)).toEqual([
      '17',
      '17000000',
      '40',
      '401',
      '40110000',
      '41100000',
      '43660000',
      '43661000',
    ]);
  });

  it('detects plans that still need converting, and is stable on converted ones', () => {
    expect(needsEightDigitMigration([acc('40'), acc('4011')])).toBe(true);
    const converted = referenceAccounts();
    expect(needsEightDigitMigration(converted)).toBe(false);
  });
});

describe('buildTree', () => {
  it('derives parent, depth and type from the number', () => {
    const tree = buildTree([acc('40110000'), acc('40'), acc('401'), acc('41100000'), acc('405')]);
    expect(tree.get('401')!.parent).toBe('40');
    expect(tree.get('40110000')!.parent).toBe('401');
    expect(tree.get('40110000')!.depth).toBe(2);
    expect(tree.get('40')!.isGroup).toBe(true);
    expect(tree.get('405')!.isGroup).toBe(true); // a group even before it has accounts
    expect(tree.get('40110000')!.isGroup).toBe(false);
    expect(tree.get('41100000')!.parent).toBeNull();
  });

  it('flags supplier and customer accounts as lettrable', () => {
    const tree = buildTree([acc('40100000'), acc('41100000'), acc('53200000')]);
    expect(tree.get('40100000')!.lettrable).toBe(true);
    expect(tree.get('41100000')!.lettrable).toBe(true);
    expect(tree.get('53200000')!.lettrable).toBe(false);
  });
});

describe('validateNewAccount', () => {
  const accounts = [acc('401'), acc('40100000')];
  it('accepts 8-digit accounts and 2–3 digit groups', () => {
    expect(validateNewAccount({ numero: '40100186', libelle: 'Fournisseur Sahel' }, accounts)).toEqual({});
    expect(validateNewAccount({ numero: '405', libelle: 'Fournisseurs d’immobilisations' }, accounts)).toEqual({});
  });
  it('rejects duplicates, bad lengths, bad classes and non-digits', () => {
    expect(validateNewAccount({ numero: '401', libelle: 'x' }, accounts).numero).toMatch(/existe déjà/);
    expect(validateNewAccount({ numero: '4011', libelle: 'x' }, accounts).numero).toMatch(/8 chiffres/);
    expect(validateNewAccount({ numero: '80100000', libelle: 'x' }, accounts).numero).toMatch(/classe/);
    expect(validateNewAccount({ numero: '40A', libelle: 'x' }, accounts).numero).toMatch(/chiffres/);
    expect(validateNewAccount({ numero: '4', libelle: 'x' }, accounts).numero).toMatch(/Au moins/);
    expect(validateNewAccount({ numero: '40100001', libelle: '  ' }, accounts).libelle).toBeDefined();
  });
});

describe('suggestChildNumero', () => {
  it('starts at the padded group number', () => {
    expect(suggestChildNumero('405', [acc('405')])).toBe('40500000');
  });
  it('follows the highest existing account', () => {
    expect(suggestChildNumero('401', [acc('401'), acc('40100000'), acc('40100186')])).toBe('40100187');
  });
  it('stays inside the group', () => {
    expect(suggestChildNumero('40', [acc('40'), acc('40999999')])).toBe('40000000');
  });
});

describe('canDelete', () => {
  it('refuses groups that contain accounts', () => {
    const tree = buildTree([acc('401'), acc('40110000')]);
    expect(canDelete('401', tree).ok).toBe(false);
    expect(canDelete('40110000', tree).ok).toBe(true);
  });
});

describe('search', () => {
  it('matches number prefixes and accent-insensitive labels', () => {
    const a = acc('43650000', 'TVA collectée');
    expect(matchesQuery(a, '436')).toBe(true);
    expect(matchesQuery(a, '365')).toBe(false);
    expect(matchesQuery(a, 'collectee')).toBe(true);
    expect(matchesQuery(a, 'TVA')).toBe(true);
  });
});

describe('CSV import/export', () => {
  it('round-trips through CSV, including quotes and semicolons', () => {
    const accounts = [acc('40100000', 'Fournisseurs; "locaux"'), acc('411', 'Clients')];
    const rows = parseCsv(toCsv(accounts));
    expect(rows.map((r) => [r.numero, r.libelle])).toEqual([
      ['40100000', 'Fournisseurs; "locaux"'],
      ['411', 'Clients'],
    ]);
  });

  it('detects tab and comma delimiters, skips headers and pads short numbers', () => {
    expect(parseCsv('Compte\tIntitulé\n4011\tFournisseurs')).toEqual([{ line: 2, numero: '40110000', libelle: 'Fournisseurs' }]);
    expect(parseCsv('401,Fournisseurs\n411,Clients')).toHaveLength(2);
  });

  it('classifies import lines and applies only new/changed ones', () => {
    const existing = [acc('40100000', 'Fournisseurs'), acc('41100000', 'Clients')];
    const lines = planImport(
      [
        { line: 1, numero: '40100000', libelle: 'Fournisseurs' },
        { line: 2, numero: '41100000', libelle: 'Clients locaux' },
        { line: 3, numero: '40110000', libelle: 'Fournisseurs étrangers' },
        { line: 4, numero: '99990000', libelle: 'Hors plan' },
        { line: 5, numero: '40110000', libelle: 'Doublon' },
      ],
      existing,
    );
    expect(lines.map((l) => l.status)).toEqual(['identique', 'modifie', 'nouveau', 'erreur', 'erreur']);

    const result = applyImport(existing, lines);
    expect(result.map((a) => a.numero)).toEqual(['40100000', '40110000', '41100000']);
    expect(result.find((a) => a.numero === '41100000')!.libelle).toBe('Clients locaux');
    expect(result.find((a) => a.numero === '40110000')!.origine).toBe('perso');
  });
});
