import clsx from 'clsx';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Building,
  Check,
  ChevronDown,
  FileSpreadsheet,
  Keyboard,
  Landmark,
  Menu,
  Percent,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

const NAV = [
  ['Fonctionnalités', '#fonctionnalites'],
  ['Cabinets', '#cabinets'],
  ['Comment ça marche', '#etapes'],
  ['FAQ', '#faq'],
] as const;

const FEATURES = [
  {
    icon: Keyboard,
    title: 'Saisie en trois champs',
    text: 'Tiers, montant TTC, taux de TVA : Qayd génère les lignes HT, TVA, timbre et tiers. Un mode folio au clavier pour les gros volumes.',
  },
  {
    icon: Percent,
    title: 'Fiscalité tunisienne intégrée',
    text: 'TVA 19 / 13 / 7 %, droit de timbre, retenue à la source, TFP et FOPROLOS. Des taux datés, mis à jour à chaque loi de finances.',
  },
  {
    icon: Landmark,
    title: 'Banque rapprochée',
    text: 'Importez vos relevés, Qayd propose les rapprochements par montant, date et référence. Vous validez, c’est tout.',
  },
  {
    icon: FileSpreadsheet,
    title: 'États financiers SCE',
    text: 'Plan comptable SCE prêt à l’emploi, grand livre, balance, bilan, état de résultat et flux de trésorerie.',
  },
  {
    icon: ScanLine,
    title: 'Validez au lieu de saisir',
    text: 'Déposez une facture en PDF ou en photo : les montants, le tiers et la TVA sont lus automatiquement.',
    soon: true,
  },
  {
    icon: ShieldCheck,
    title: 'Sécurisé et traçable',
    text: 'Rôles par utilisateur, piste d’audit de chaque modification, exercices clôturés verrouillés.',
  },
];

const STEPS = [
  ['Créez votre société', 'Matricule fiscal, exercice : le plan comptable SCE est installé automatiquement.'],
  ['Reprenez l’existant', 'Importez votre plan, vos tiers et votre balance d’ouverture depuis Excel.'],
  ['Saisissez, Qayd calcule', 'Écritures, TVA, retenues et états se mettent à jour en temps réel.'],
] as const;

const FAQ = [
  [
    'Qayd respecte-t-il le système comptable tunisien ?',
    'Oui. Qayd est construit sur la nomenclature du Système Comptable des Entreprises (SCE) : classes 1 à 7, états financiers au format tunisien, devise TND à trois décimales.',
  ],
  [
    'Puis-je reprendre mon plan comptable actuel ?',
    'Oui. Importez un fichier CSV exporté depuis Excel ou votre ancien logiciel. Qayd vous montre ce qui sera créé ou modifié avant de valider.',
  ],
  [
    'Qayd convient-il aux cabinets comptables ?',
    'Oui. Un cabinet gère plusieurs sociétés, chacune avec son plan, ses exercices et ses droits, et suit les échéances de tous ses clients sur un seul écran.',
  ],
  [
    'Que veut dire « Qayd » ?',
    'قيد (qayd) désigne en arabe l’écriture comptable, l’inscription au registre. C’est le geste de base du métier.',
  ],
] as const;

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-paper">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" aria-label="Qayd, accueil">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/connexion" className="btn btn-ghost">
              Se connecter
            </Link>
            <Link to="/inscription" className="btn btn-primary">
              Essai gratuit
            </Link>
          </div>
          <button className="btn btn-ghost h-9 w-9 px-0 md:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">
            {menu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menu && (
          <div className="border-t border-line bg-paper px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 font-medium hover:bg-ink/5">
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/connexion" className="btn btn-secondary">
                Se connecter
              </Link>
              <Link to="/inscription" className="btn btn-primary">
                Essai gratuit
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="absolute right-[8%] top-40 size-72 rounded-full bg-clay-100/80 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-14 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1 text-xs font-semibold text-ink-soft shadow-card">
              <BadgeCheck className="size-4 text-brand-600" />
              Conforme au SCE tunisien · TVA · Retenue à la source
            </span>
            <h1 className="mt-6 text-[42px] font-extrabold leading-[1.05] tracking-tight text-ink md:text-[58px]">
              La comptabilité tunisienne,{' '}
              <span className="relative whitespace-nowrap text-brand-600">
                enfin simple
                <svg aria-hidden viewBox="0 0 300 12" className="absolute -bottom-1.5 left-0 w-full" preserveAspectRatio="none">
                  <path d="M2 9C60 3 140 2 298 7" stroke="var(--color-clay-400)" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Qayd réunit saisie, banque, fiscalité et états financiers dans un espace clair, pensé pour les entreprises et les
              cabinets comptables en Tunisie.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/inscription" className="btn btn-primary btn-lg">
                Commencer gratuitement <ArrowRight className="size-4" />
              </Link>
              <Link to="/demo" className="btn btn-secondary btn-lg">
                Voir la démo
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {['Sans carte bancaire', 'Plan SCE installé en un clic', 'Import depuis Excel'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success-600" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* ─── Audience strip ─── */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-px px-4 md:grid-cols-3 md:px-6">
          {[
            { icon: Building, title: 'Entreprises', text: 'Tenez votre comptabilité en interne, sans jargon inutile.' },
            { icon: Briefcase, title: 'Cabinets comptables', text: 'Tous vos dossiers clients et leurs échéances au même endroit.' },
            { icon: Banknote, title: 'Experts-comptables', text: 'Révision, états financiers et piste d’audit complète.' },
          ].map((a) => (
            <div key={a.title} className="flex items-start gap-4 py-7 md:px-6 first:md:pl-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <a.icon className="size-5" />
              </span>
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay-600">Fonctionnalités</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Moins de saisie, plus de contrôle.</h2>
          <p className="mt-4 text-lg text-muted">
            Chaque écran va à l’essentiel. Les calculs fiscaux, la numérotation et les contrôles d’équilibre sont faits pour vous.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group p-6 transition-shadow hover:shadow-pop">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                  <f.icon className="size-5" />
                </span>
                {f.soon && (
                  <span className="rounded-full bg-clay-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-clay-600">
                    Bientôt
                  </span>
                )}
              </div>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Cabinets ─── */}
      <section id="cabinets" className="scroll-mt-20 bg-brand-950 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-24 md:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay-200">Pour les cabinets</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Tous vos clients, un seul tableau de bord.</h2>
            <p className="mt-4 text-lg text-white/70">
              Qayd signale ce qui demande votre attention dans chaque dossier : déclarations à déposer, écritures à valider,
              relevés à rapprocher, exercices à clôturer.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Un plan comptable, des exercices et des droits par société',
                'Rôles : chef comptable, comptable, assistant, auditeur',
                'Échéances fiscales de tous les clients sur un écran',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-white/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-clay-500">
                    <Check className="size-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between px-1 pb-3">
              <p className="font-semibold">Portefeuille · 4 sociétés</p>
              <p className="text-xs text-white/50">Exemple illustratif</p>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Atelier Carthage', task: 'Déclaration mensuelle à déposer', tone: 'clay' },
                { name: 'Oliveraie du Sahel', task: '12 relevés à rapprocher', tone: 'brand' },
                { name: 'Studio Médina', task: 'À jour', tone: 'ok' },
                { name: 'Transports Cap Bon', task: 'Exercice 2025 à clôturer', tone: 'clay' },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-white/10 text-sm font-bold">{r.name[0]}</span>
                    <span className="font-medium">{r.name}</span>
                  </div>
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      r.tone === 'clay' && 'bg-clay-500/20 text-clay-200',
                      r.tone === 'brand' && 'bg-brand-400/20 text-brand-200',
                      r.tone === 'ok' && 'bg-emerald-400/15 text-emerald-200',
                    )}
                  >
                    {r.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Steps ─── */}
      <section id="etapes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-6">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay-600">Comment ça marche</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Opérationnel en une matinée.</h2>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="relative rounded-2xl border border-line bg-surface p-7">
              <span className="num font-mono text-sm font-semibold text-clay-600">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-[15px] text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-24 md:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">Questions fréquentes</h2>
          <div className="mt-12 divide-y divide-line rounded-2xl border border-line">
            {FAQ.map(([q, a], i) => (
              <div key={q}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  {q}
                  <ChevronDown className={clsx('size-5 shrink-0 text-faint transition-transform', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && <p className="-mt-1 px-6 pb-5 text-[15px] leading-relaxed text-muted">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-8 py-14 text-center text-white md:px-16">
          <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-clay-400/40 blur-3xl" />
          <p className="relative font-arabic text-3xl text-white/90" lang="ar" dir="rtl">
            قيد
          </p>
          <h2 className="relative mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Chaque écriture compte. Commencez par la première.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/80">Créez votre espace en quelques minutes, sans carte bancaire.</p>
          <Link to="/inscription" className="btn btn-lg relative mt-8 bg-white text-brand-700 hover:bg-brand-50">
            Essai gratuit <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row md:px-6">
          <Logo />
          <p>
            <span className="font-arabic" lang="ar">قيد</span> · l’écriture comptable · © {new Date().getFullYear()} Qayd
          </p>
          <div className="flex gap-5">
            <a href="#faq" className="hover:text-ink">FAQ</a>
            <Link to="/connexion" className="hover:text-ink">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Product preview built in HTML (no screenshot): a slice of the real plan comptable. */
function HeroPreview() {
  const rows = [
    { n: '40', l: 'Fournisseurs et comptes rattachés', d: 0, g: true },
    { n: '401', l: 'Fournisseurs d’exploitation', d: 1, g: true },
    { n: '4011', l: 'Fournisseurs locaux', d: 2, tag: 'Tiers' },
    { n: '4012', l: 'Fournisseurs étrangers', d: 2, tag: 'Tiers' },
    { n: '436', l: 'État, taxes sur le chiffre d’affaires', d: 1, g: true },
    { n: '4365', l: 'TVA collectée', d: 2 },
    { n: '4366', l: 'TVA déductible', d: 2 },
  ];
  return (
    <div className="relative sm:mb-20 lg:mb-16">
      <div className="card overflow-hidden shadow-pop">
        <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-3">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 text-xs font-semibold text-muted">Plan comptable · Classe 4 — Tiers</span>
        </div>
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.n} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className={clsx('num w-14 shrink-0 font-mono text-[13px]', r.g ? 'font-semibold' : 'text-ink-soft')} style={{ paddingLeft: r.d * 8 }}>
                {r.n}
              </span>
              <span className={clsx('flex-1 truncate', r.g && 'font-semibold')}>{r.l}</span>
              {r.tag && <span className="rounded-md bg-clay-50 px-1.5 py-0.5 text-[11px] font-semibold text-clay-700">{r.tag}</span>}
              <span className={clsx('text-xs', r.g ? 'text-faint' : 'text-success-600')}>{r.g ? 'Regroupement' : 'Imputable'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-24 -left-4 hidden w-60 rounded-2xl border border-line bg-surface p-4 shadow-pop sm:block md:-left-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">Saisie rapide</p>
        <div className="mt-2 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted">Montant TTC</span><span className="num font-semibold">1 191,000</span></div>
          <div className="flex justify-between"><span className="text-muted">TVA 19 %</span><span className="num">190,000</span></div>
          <div className="flex justify-between"><span className="text-muted">Timbre</span><span className="num">1,000</span></div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success-600">
          <Check className="size-3.5" /> Écriture équilibrée
        </p>
      </div>
    </div>
  );
}
