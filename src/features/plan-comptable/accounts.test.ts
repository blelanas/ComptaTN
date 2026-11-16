import { describe, expect, it } from 'vitest';
import {
  applyImport,
  buildTree,
  canDelete,
  matchesQuery,
  parseCsv,
  planImport,
  referenceAccounts,
  suggestChildNumero,
  toCsv,
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

  it('attaches every 3+ digit account to a parent', () => {
    const tree = buildTree(referenceAccounts());
    const orphans = [...tree.values()].filter((n) => n.numero.length > 2 && !n.parent);
    expect(orphans.map((o) => o.numero)).toEqual([]);
  });
});

describe('buildTree', () => {
  it('derives parent, depth and group status from prefixes', () => {
    const tree = buildTree([acc('4011'), acc('40'), acc('401'), acc('411')]);
    expect(tree.get('401')!.parent).toBe('40');
    expect(tree.get('4011')!.parent).toBe('401');
    expect(tree.get('4011')!.depth).toBe(2);
    expect(tree.get('40')!.isGroup).toBe(true);
    expect(tree.get('4011')!.isGroup).toBe(false);
    expect(tree.get('411')!.parent).toBeNull();
  });

  it('skips missing intermediate levels (40100186 → 401)', () => {
    const tree = buildTree([acc('40'), acc('401'), acc('40100186')]);
    expect(tree.get('40100186')!.parent).toBe('401');
  });

  it('flags supplier and customer accounts as lettrable', () => {
    const tree = buildTree([acc('401'), acc('411'), acc('532')]);
    expect(tree.get('401')!.lettrable).toBe(true);
    expect(tree.get('411')!.lettrable).toBe(true);
    expect(tree.get('532')!.lettrable).toBe(false);
  });
});

describe('validateNewAccount', () => {
  const accounts = [acc('401')];
  it('accepts a valid account', () => {
    expect(validateNewAccount({ numero: '4011', libelle: 'Fournisseurs locaux' }, accounts)).toEqual({});
  });
  it('rejects duplicates, bad classes and non-digits', () => {
    expect(validateNewAccount({ numero: '401', libelle: 'x' }, accounts).numero).toMatch(/existe déjà/);
    expect(validateNewAccount({ numero: '801', libelle: 'x' }, accounts).numero).toMatch(/classe/);
    expect(validateNewAccount({ numero: '40A', libelle: 'x' }, accounts).numero).toMatch(/chiffres/);
    expect(validateNewAccount({ numero: '4', libelle: 'x' }, accounts).numero).toMatch(/Au moins/);
    expect(validateNewAccount({ numero: '4012', libelle: '  ' }, accounts).libelle).toBeDefined();
  });
});

describe('suggestChildNumero', () => {
  it('returns the first free sub-number', () => {
    expect(suggestChildNumero('401', [acc('401'), acc('4011'), acc('4012')])).toBe('4013');
  });
});

describe('canDelete', () => {
  it('refuses accounts that have sub-accounts', () => {
    const tree = buildTree([acc('401'), acc('4011')]);
    expect(canDelete('401', tree).ok).toBe(false);
    expect(canDelete('4011', tree).ok).toBe(true);
  });
});

describe('search', () => {
  it('matches number prefixes and accent-insensitive labels', () => {
    const a = acc('4365', 'TVA collectée');
    expect(matchesQuery(a, '436')).toBe(true);
    expect(matchesQuery(a, '365')).toBe(false);
    expect(matchesQuery(a, 'collectee')).toBe(true);
    expect(matchesQuery(a, 'TVA')).toBe(true);
  });
});

describe('CSV import/export', () => {
  it('round-trips through CSV, including quotes and semicolons', () => {
    const accounts = [acc('401', 'Fournisseurs; "locaux"'), acc('411', 'Clients')];
    const rows = parseCsv(toCsv(accounts));
    expect(rows.map((r) => [r.numero, r.libelle])).toEqual([
      ['401', 'Fournisseurs; "locaux"'],
      ['411', 'Clients'],
    ]);
  });

  it('detects tab and comma delimiters and skips headers', () => {
    expect(parseCsv('Compte\tIntitulé\n401\tFournisseurs')).toEqual([{ line: 2, numero: '401', libelle: 'Fournisseurs' }]);
    expect(parseCsv('401,Fournisseurs\n411,Clients')).toHaveLength(2);
  });

  it('classifies import lines and applies only new/changed ones', () => {
    const existing = [acc('401', 'Fournisseurs'), acc('411', 'Clients')];
    const lines = planImport(
      [
        { line: 1, numero: '401', libelle: 'Fournisseurs' },
        { line: 2, numero: '411', libelle: 'Clients locaux' },
        { line: 3, numero: '4011', libelle: 'Fournisseurs étrangers' },
        { line: 4, numero: '9999', libelle: 'Hors plan' },
        { line: 5, numero: '4011', libelle: 'Doublon' },
      ],
      existing,
    );
    expect(lines.map((l) => l.status)).toEqual(['identique', 'modifie', 'nouveau', 'erreur', 'erreur']);

    const result = applyImport(existing, lines);
    expect(result.map((a) => a.numero)).toEqual(['401', '4011', '411']);
    expect(result.find((a) => a.numero === '411')!.libelle).toBe('Clients locaux');
    expect(result.find((a) => a.numero === '4011')!.origine).toBe('perso');
  });
});
