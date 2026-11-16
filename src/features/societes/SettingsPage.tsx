import clsx from 'clsx';
import { CalendarPlus, Copy, Lock, Mail, Pencil, Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Spinner } from '@/components/FullPageLoader';
import { Badge, ConfirmDialog, Modal, PageHeader, useToast } from '@/components/ui';
import { useCompany } from '@/lib/company';
import { errorMessage } from '@/lib/errors';
import { useCurrentUser } from '@/lib/session';
import { CompanyFields, ExerciceFields } from './CompanyForm';
import {
  cleanCompanyInfo,
  formatDate,
  initials,
  makeExercice,
  nextExercice,
  sortExercices,
  validateCompanyInfo,
  validateExercice,
  validateInvite,
  type CompanyErrors,
  type CompanyInfo,
  type Exercice,
} from './model';

const TABS = [
  { id: 'societe', label: 'Société' },
  { id: 'exercices', label: 'Exercices' },
  { id: 'utilisateurs', label: 'Utilisateurs' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('onglet'))?.id ?? 'societe') as TabId;
  const { company } = useCompany();
  return (
    <div>
      <PageHeader title="Paramètres" description="Informations de la société, exercices et accès de votre équipe." />
      <div className="mb-6 inline-flex rounded-xl border border-line bg-surface p-1 shadow-card" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'societe' ? {} : { onglet: t.id }, { replace: true })}
            className={clsx(
              'rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
              tab === t.id ? 'bg-brand-600 text-white' : 'text-ink-soft hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'societe' && <CompanyTab key={company.id} />}
      {tab === 'exercices' && <ExercicesTab />}
      {tab === 'utilisateurs' && <UsersTab />}
    </div>
  );
}

// ───────────────────────────── Société ─────────────────────────────

function CompanyTab() {
  const { company, updateCompany } = useCompany();
  const toast = useToast();
  const initial: CompanyInfo = {
    raisonSociale: company.raisonSociale,
    matriculeFiscal: company.matriculeFiscal,
    activite: company.activite,
    adresse: company.adresse,
    ville: company.ville,
  };
  const [info, setInfo] = useState(initial);
  const [errors, setErrors] = useState<CompanyErrors>({});
  const [busy, setBusy] = useState(false);
  const dirty = (Object.keys(initial) as (keyof CompanyInfo)[]).some((k) => initial[k] !== info[k]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validateCompanyInfo(info);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      const clean = cleanCompanyInfo(info);
      await updateCompany(clean);
      setInfo(clean);
      toast('Informations enregistrées.');
    } catch (err) {
      toast(errorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="card max-w-3xl p-6">
      <CompanyFields value={info} onChange={setInfo} errors={errors} />
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-xs text-muted">Devise : dinar tunisien (TND, 3 décimales).</p>
        <div className="flex gap-2">
          {dirty && (
            <button type="button" className="btn btn-secondary" onClick={() => setInfo(initial)}>
              Annuler
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={!dirty || busy}>
            {busy && <Spinner />} Enregistrer
          </button>
        </div>
      </div>
    </form>
  );
}

// ───────────────────────────── Exercices ─────────────────────────────

type ExerciceDialog = { mode: 'add'; draft: Exercice } | { mode: 'edit'; original: Exercice; draft: Exercice } | null;

function ExercicesTab() {
  const { company, exercice: selected, updateCompany, setExercice } = useCompany();
  const toast = useToast();
  const [dialog, setDialog] = useState<ExerciceDialog>(null);
  const [busy, setBusy] = useState(false);
  const exercices = sortExercices(company.exercices);
  const next = nextExercice(company.exercices);

  const others = dialog?.mode === 'edit' ? company.exercices.filter((e) => e.annee !== dialog.original.annee) : company.exercices;
  const dateError = dialog ? validateExercice(dialog.draft.debut, dialog.draft.fin, others) : null;

  const save = async () => {
    if (!dialog || dateError) return;
    const updated = makeExercice(dialog.draft.debut, dialog.draft.fin);
    const list =
      dialog.mode === 'add'
        ? [...company.exercices, updated]
        : company.exercices.map((e) => (e.annee === dialog.original.annee ? { ...updated, statut: e.statut } : e));
    setBusy(true);
    try {
      await updateCompany({ exercices: list });
      if (dialog.mode === 'add' || selected.annee === dialog.original.annee) setExercice(updated.annee);
      toast(dialog.mode === 'add' ? `Exercice ${updated.annee} ouvert.` : `Exercice ${updated.annee} modifié.`);
      setDialog(null);
    } catch (err) {
      toast(errorMessage(err), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 sm:px-5">Exercice</th>
              <th className="px-4 py-3 sm:px-5">Période</th>
              <th className="px-4 py-3 sm:px-5">Statut</th>
              <th className="px-2 py-3 sm:px-5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {exercices.map((ex) => (
              <tr key={ex.annee}>
                <td className="px-4 py-3 font-semibold sm:px-5">
                  {ex.annee}
                  {ex.annee === selected.annee && (
                    <span className="block text-xs font-medium text-brand-600 sm:ml-2 sm:inline">affiché</span>
                  )}
                </td>
                <td className="num px-4 py-3 text-ink-soft sm:px-5">
                  <span className="whitespace-nowrap">{formatDate(ex.debut)}</span>{' '}
                  <span className="whitespace-nowrap">→ {formatDate(ex.fin)}</span>
                </td>
                <td className="px-4 py-3 sm:px-5">
                  {ex.statut === 'ouvert' ? <Badge tone="success">Ouvert</Badge> : <Badge>Clôturé</Badge>}
                </td>
                <td className="px-2 py-3 text-right sm:px-5">
                  {ex.statut === 'ouvert' && (
                    <button
                      className="btn btn-ghost h-8 px-2 text-[13px]"
                      aria-label={`Modifier les dates de l’exercice ${ex.annee}`}
                      onClick={() => setDialog({ mode: 'edit', original: ex, draft: ex })}
                    >
                      <Pencil className="size-3.5" /> <span className="hidden sm:inline">Dates</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">La clôture d’un exercice se fera depuis le grand livre (bientôt).</p>
        <button className="btn btn-primary" onClick={() => setDialog({ mode: 'add', draft: next })}>
          <CalendarPlus className="size-4" /> Ouvrir l’exercice {next.annee}
        </button>
      </div>

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? `Dates de l’exercice ${dialog.original.annee}` : 'Nouvel exercice'}
        description="Un exercice dure en général 12 mois. Le premier peut être plus court ou plus long."
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDialog(null)}>
              Annuler
            </button>
            <button className="btn btn-primary" onClick={save} disabled={!!dateError || busy}>
              {busy && <Spinner />} {dialog?.mode === 'edit' ? 'Enregistrer' : 'Ouvrir l’exercice'}
            </button>
          </>
        }
      >
        {dialog && (
          <ExerciceFields
            collapsible={false}
            debut={dialog.draft.debut}
            fin={dialog.draft.fin}
            error={dateError}
            onChange={({ debut, fin }) => setDialog({ ...dialog, draft: { ...dialog.draft, debut, fin } })}
          />
        )}
      </Modal>
    </div>
  );
}

// ───────────────────────────── Utilisateurs ─────────────────────────────

function signupLink(email: string) {
  return `${window.location.origin}/inscription?email=${encodeURIComponent(email)}`;
}

function UsersTab() {
  const { company, isOwner, invite, cancelInvite, removeMember } = useCompany();
  const { user, isDemo } = useCurrentUser();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastInvited, setLastInvited] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'member'; uid: string; nom: string } | { kind: 'invite'; email: string } | null>(null);

  const members = Object.entries(company.members).sort(([, a], [, b]) =>
    a.role === b.role ? a.nom.localeCompare(b.nom, 'fr') : a.role === 'proprietaire' ? -1 : 1,
  );
  const invites = Object.entries(company.invites).sort(([a], [b]) => a.localeCompare(b));

  const copyLink = async (address: string) => {
    try {
      await navigator.clipboard.writeText(signupLink(address));
      toast('Lien copié.');
    } catch {
      toast('Copie impossible : sélectionnez le lien et copiez-le.', 'danger');
    }
  };

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateInvite(company, email);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      const address = email.trim().toLowerCase();
      await invite(address);
      setLastInvited(address);
      setEmail('');
      toast('Invitation créée.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === 'member') {
        await removeMember(confirm.uid);
        toast(`${confirm.nom} n’a plus accès à la société.`);
      } else {
        await cancelInvite(confirm.email);
        if (lastInvited === confirm.email) setLastInvited(null);
        toast('Invitation annulée.');
      }
    } catch (err) {
      toast(errorMessage(err), 'danger');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {isDemo ? (
        <div className="flex gap-3 rounded-xl bg-clay-50 p-4 text-sm text-clay-700">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            Les invitations sont disponibles avec un compte : chaque personne invitée se connecte avec son propre e-mail.{' '}
            <Link to="/inscription" className="font-semibold underline underline-offset-2">
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      ) : isOwner ? (
        <form onSubmit={onInvite} noValidate className="card p-5">
          <label className="label" htmlFor="invite-email">
            Inviter une personne
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="invite-email"
              type="email"
              className="input flex-1"
              placeholder="comptable@cabinet.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <Spinner /> : <UserPlus className="size-4" />} Inviter
            </button>
          </div>
          {error ? (
            <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted">
              La personne verra l’invitation en se connectant avec cette adresse, une fois son e-mail confirmé.
            </p>
          )}
          {lastInvited && (
            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
              <p className="flex items-center gap-2 font-semibold">
                <Mail className="size-4" /> Envoyez ce lien à {lastInvited}
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input readOnly className="input flex-1 bg-surface font-mono text-xs" value={signupLink(lastInvited)} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-secondary" onClick={() => copyLink(lastInvited)}>
                  <Copy className="size-4" /> Copier
                </button>
              </div>
              <p className="mt-2 text-xs">Raqib n’envoie pas encore d’e-mail d’invitation : partagez le lien par e-mail ou messagerie.</p>
            </div>
          )}
        </form>
      ) : (
        <p className="rounded-xl bg-paper p-4 text-sm text-muted">Seul le propriétaire de la société peut inviter ou retirer des personnes.</p>
      )}

      <section className="card overflow-hidden">
        <h2 className="border-b border-line px-5 py-3 text-sm font-bold">Personnes ayant accès ({members.length})</h2>
        <ul className="divide-y divide-line">
          {members.map(([uid, m]) => (
            <li key={uid} className="flex items-center gap-3 px-5 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-clay-100 text-sm font-bold text-clay-700">
                {initials(m.nom)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {m.nom} {uid === user.uid && <span className="font-normal text-muted">(vous)</span>}
                </span>
                <span className="block truncate text-xs text-muted">{m.email}</span>
              </span>
              <Badge tone={m.role === 'proprietaire' ? 'brand' : 'neutral'}>{m.role === 'proprietaire' ? 'Propriétaire' : 'Membre'}</Badge>
              {isOwner && !isDemo && uid !== company.ownerId && (
                <button
                  className="btn btn-ghost h-8 w-8 px-0 text-danger-600"
                  aria-label={`Retirer ${m.nom}`}
                  title="Retirer l’accès"
                  onClick={() => setConfirm({ kind: 'member', uid, nom: m.nom })}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {invites.length > 0 && (
        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-3 text-sm font-bold">Invitations en attente ({invites.length})</h2>
          <ul className="divide-y divide-line">
            {invites.map(([address, inv]) => (
              <li key={address} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <Mail className="size-4 text-faint" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{address}</span>
                  <span className="block text-xs text-muted">
                    Invité le {formatDate(inv.date)} par {inv.par}
                  </span>
                </span>
                {isOwner && (
                  <>
                    <button className="btn btn-ghost h-8 px-2 text-[13px]" onClick={() => copyLink(address)}>
                      <Copy className="size-3.5" /> Lien
                    </button>
                    <button className="btn btn-ghost h-8 px-2 text-[13px] text-danger-600" onClick={() => setConfirm({ kind: 'invite', email: address })}>
                      Annuler
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted">Les rôles détaillés (comptable, assistant, auditeur en lecture seule) arrivent bientôt.</p>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onConfirm}
        danger
        title={confirm?.kind === 'member' ? 'Retirer l’accès ?' : 'Annuler l’invitation ?'}
        message={
          confirm?.kind === 'member'
            ? `${confirm.nom} ne pourra plus ouvrir ${company.raisonSociale}. Vous pourrez l’inviter à nouveau.`
            : `Le lien envoyé à ${confirm?.kind === 'invite' ? confirm.email : ''} ne permettra plus de rejoindre la société.`
        }
        confirmLabel={confirm?.kind === 'member' ? 'Retirer' : 'Annuler l’invitation'}
      />
    </div>
  );
}
