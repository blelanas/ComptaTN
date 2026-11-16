import { describe, expect, it } from 'vitest';
import {
  companyCode,
  currentExercice,
  emailKey,
  exerciceCalendaire,
  formatDate,
  invitationId,
  makeExercice,
  nextExercice,
  normalizeMatricule,
  validateCompanyInfo,
  validateExercice,
  validateInvite,
  EMPTY_COMPANY_INFO,
  type Company,
} from './model';

describe('matricule fiscal', () => {
  it('accepts the short and the full form, with or without separators', () => {
    expect(normalizeMatricule('1234567a')).toBe('1234567A');
    expect(normalizeMatricule('1234567A/A/M/000')).toBe('1234567A/A/M/000');
    expect(normalizeMatricule('1234567 a a m 000')).toBe('1234567A/A/M/000');
    expect(normalizeMatricule('1234567AAM000')).toBe('1234567A/A/M/000');
    expect(normalizeMatricule('')).toBe('');
  });

  it('rejects anything else', () => {
    expect(normalizeMatricule('123456A')).toBeNull();
    expect(normalizeMatricule('1234567A/A/M')).toBeNull();
    expect(normalizeMatricule('ABCDEFGH')).toBeNull();
  });
});

describe('company info', () => {
  it('only requires the raison sociale', () => {
    expect(validateCompanyInfo(EMPTY_COMPANY_INFO)).toHaveProperty('raisonSociale');
    expect(validateCompanyInfo({ ...EMPTY_COMPANY_INFO, raisonSociale: 'Atlas' })).toEqual({});
  });

  it('checks the matricule format and lengths', () => {
    const errors = validateCompanyInfo({ ...EMPTY_COMPANY_INFO, raisonSociale: 'x'.repeat(121), matriculeFiscal: '12' });
    expect(errors.raisonSociale).toBeDefined();
    expect(errors.matriculeFiscal).toBeDefined();
  });

  it('builds a two-letter code, ignoring legal forms and small words', () => {
    expect(companyCode('Atlas Conseil SARL')).toBe('AC');
    expect(companyCode('Société de Transport du Sahel')).toBe('TS');
    expect(companyCode('Kairouan')).toBe('KA');
    expect(companyCode('SARL')).toBe('?');
  });
});

describe('exercices', () => {
  it('names an exercice after its closing year', () => {
    expect(makeExercice('2025-07-01', '2026-06-30').annee).toBe(2026);
    expect(exerciceCalendaire(2026)).toEqual({ annee: 2026, debut: '2026-01-01', fin: '2026-12-31', statut: 'ouvert' });
  });

  it('validates dates, length and overlaps', () => {
    const y2026 = exerciceCalendaire(2026);
    expect(validateExercice('2026-01-01', '2026-12-31', [])).toBeNull();
    expect(validateExercice('', '2026-12-31', [])).toMatch(/date/);
    expect(validateExercice('2026-02-30', '2026-12-31', [])).toMatch(/date/);
    expect(validateExercice('2026-12-31', '2026-01-01', [])).toMatch(/après/);
    expect(validateExercice('2025-01-01', '2026-12-31', [])).toBeNull(); // 24 months: allowed
    expect(validateExercice('2025-01-01', '2027-01-01', [])).toMatch(/24 mois/);
    expect(validateExercice('2026-06-01', '2027-05-31', [y2026])).toMatch(/chevauchent/);
    expect(validateExercice('2027-01-01', '2027-12-31', [y2026])).toBeNull();
  });

  it('proposes the next exercice right after the latest one', () => {
    expect(nextExercice([exerciceCalendaire(2026)])).toEqual(exerciceCalendaire(2027));
    expect(nextExercice([makeExercice('2025-07-01', '2026-06-30')])).toEqual(makeExercice('2026-07-01', '2027-06-30'));
    // A first exercice ending on 28 February, then a leap year.
    expect(nextExercice([makeExercice('2027-03-01', '2028-02-29')])).toEqual(makeExercice('2028-03-01', '2029-02-28'));
  });

  it('picks the exercice containing today, else the latest', () => {
    const list = [exerciceCalendaire(2025), exerciceCalendaire(2026)];
    expect(currentExercice(list, '2025-05-10')?.annee).toBe(2025);
    expect(currentExercice(list, '2030-01-01')?.annee).toBe(2026);
    expect(currentExercice([], '2026-01-01')).toBeUndefined();
  });

  it('formats dates the French way', () => {
    expect(formatDate('2026-03-09')).toBe('09/03/2026');
  });
});

describe('invitations', () => {
  const company: Company = {
    id: 'c1',
    code: 'AC',
    raisonSociale: 'Atlas Conseil',
    matriculeFiscal: '',
    activite: '',
    adresse: '',
    ville: '',
    devise: 'TND',
    exercices: [exerciceCalendaire(2026)],
    ownerId: 'u1',
    memberIds: ['u1'],
    members: { u1: { nom: 'Amira', email: 'amira@atlas.tn', role: 'proprietaire' } },
    invites: { 'sami@cabinet.tn': { date: '2026-11-16', par: 'Amira' } },
  };

  it('normalizes e-mails in ids', () => {
    expect(emailKey('  Sami@Cabinet.TN ')).toBe('sami@cabinet.tn');
    expect(invitationId('c1', 'Sami@Cabinet.tn')).toBe('c1__sami@cabinet.tn');
  });

  it('refuses invalid, existing or already invited addresses', () => {
    expect(validateInvite(company, 'pas-un-email')).toMatch(/invalide/);
    expect(validateInvite(company, 'AMIRA@atlas.tn')).toMatch(/déjà accès/);
    expect(validateInvite(company, 'sami@cabinet.tn')).toMatch(/en attente/);
    expect(validateInvite(company, 'nour@cabinet.tn')).toBeNull();
  });
});
