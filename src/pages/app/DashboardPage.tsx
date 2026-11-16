import clsx from 'clsx';
import { ArrowRight, Check, Landmark, ListTree, ReceiptText, Scale, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlanComptable } from '@/features/plan-comptable/store';
import { formatDate } from '@/features/societes/model';
import { useCompany } from '@/lib/company';

const KPIS = [
  { label: 'Chiffre d’affaires', hint: 'Classe 7', icon: TrendingUp },
  { label: 'Charges', hint: 'Classe 6', icon: TrendingDown },
  { label: 'Trésorerie', hint: 'Banques et caisse', icon: Wallet },
  { label: 'Résultat provisoire', hint: 'Produits − charges', icon: Scale },
];

export default function DashboardPage() {
  const { company, exercice } = useCompany();
  const { tree, status } = usePlanComptable();
  const nodes = [...tree.values()];
  const imputables = nodes.filter((n) => !n.isGroup).length;
  const personnalises = nodes.filter((n) => n.origine === 'perso').length;
  const loading = status !== 'ready';

  const steps = [
    {
      title: 'Complétez la fiche de la société',
      text: 'Matricule fiscal, activité et adresse : ils apparaîtront sur vos documents.',
      to: '/app/parametres',
      cta: 'Compléter',
      done: !!company.matriculeFiscal && !!company.adresse,
      ready: true,
    },
    {
      title: 'Vérifiez votre plan comptable',
      text: loading
        ? 'Comptes SCE prêts à l’emploi. Ajoutez vos sous-comptes ou importez votre plan.'
        : `${nodes.length} comptes SCE prêts à l’emploi. Ajoutez vos sous-comptes ou importez votre plan.`,
      to: '/app/comptabilite/plan-comptable',
      cta: 'Ouvrir le plan',
      done: personnalises > 0,
      ready: true,
    },
    {
      title: 'Invitez votre équipe',
      text: 'Votre comptable ou vos collaborateurs travaillent sur la même société.',
      to: '/app/parametres?onglet=utilisateurs',
      cta: 'Inviter',
      done: company.memberIds.length > 1 || Object.keys(company.invites).length > 0,
      ready: true,
    },
    { title: 'Saisissez votre première écriture', text: 'Tiers, montant TTC, taux de TVA : Qayd génère les lignes.', to: '/app/saisie', cta: 'Bientôt', done: false, ready: false },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 px-6 py-8 text-white md:px-10">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-600/40 blur-3xl"
        />
        <div aria-hidden className="absolute -bottom-32 right-40 size-72 rounded-full bg-clay-500/25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay-200">Bienvenue</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{company.raisonSociale}</h1>
            <p className="mt-1 text-sm text-white/70">
              Exercice {exercice.annee} · du {formatDate(exercice.debut)} au {formatDate(exercice.fin)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/comptabilite/plan-comptable" className="btn btn-lg bg-white text-brand-900 hover:bg-brand-50">
              <ListTree className="size-4" /> Plan comptable
            </Link>
            <Link to="/app/saisie" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
              Nouvelle écriture
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">{k.label}</p>
              <k.icon className="size-4 text-faint" />
            </div>
            <p className="num mt-3 text-2xl font-extrabold text-faint">
              — <span className="text-sm font-semibold">TND</span>
            </p>
            <p className="mt-1 text-xs text-faint">{k.hint} · dès la première écriture</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Pour bien démarrer</h2>
          <p className="mt-1 text-sm text-muted">Quatre étapes pour tenir la comptabilité de la société dans Qayd.</p>
          <ol className="mt-5 space-y-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-start gap-4 rounded-xl border border-line p-4">
                <span
                  className={clsx(
                    'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold',
                    s.done ? 'bg-success-600 text-white' : 'bg-paper text-ink-soft ring-1 ring-line-strong',
                  )}
                >
                  {s.done ? <Check className="size-4" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{s.text}</p>
                </div>
                {s.ready ? (
                  <Link to={s.to} className="btn btn-secondary shrink-0">
                    {s.cta} <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <span className="shrink-0 self-center text-xs font-semibold uppercase tracking-wide text-faint">{s.cta}</span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Plan comptable</h2>
              <Link to="/app/comptabilite/plan-comptable" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                Ouvrir
              </Link>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                ['Comptes', nodes.length],
                ['Imputables', imputables],
                ['Personnalisés', personnalises],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-paper px-2 py-3">
                  <dd className="num text-xl font-extrabold">{loading ? '…' : value}</dd>
                  <dt className="mt-0.5 text-xs text-muted">{label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold">Prochainement</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { icon: ReceiptText, text: 'Factures avec TVA, timbre et El Fatoora' },
                { icon: Landmark, text: 'Import des relevés et rapprochement automatique' },
                { icon: Scale, text: 'Balance, grand livre et états financiers' },
              ].map((x) => (
                <li key={x.text} className="flex items-center gap-3 text-ink-soft">
                  <span className="grid size-8 place-items-center rounded-lg bg-clay-50 text-clay-600">
                    <x.icon className="size-4" />
                  </span>
                  {x.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
