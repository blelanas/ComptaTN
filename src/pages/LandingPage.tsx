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
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { CountUp, Reveal, delay, useInView } from '@/components/motion';

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
    text: 'Tiers, montant TTC, taux de TVA : Raqib génère les lignes HT, TVA, timbre et tiers. Un mode folio au clavier pour les gros volumes.',
  },
  {
    icon: Percent,
    title: 'Fiscalité tunisienne intégrée',
    text: 'TVA 19 / 13 / 7 %, droit de timbre, retenue à la source, TFP et FOPROLOS. Des taux datés, mis à jour à chaque loi de finances.',
  },
  {
    icon: Landmark,
    title: 'Banque rapprochée',
    text: 'Importez vos relevés, Raqib propose les rapprochements par montant, date et référence. Vous validez, c’est tout.',
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

/** One colour per feature card (literal class names so Tailwind generates them). */
const FEATURE_COLORS = [
  { icon: 'from-sky-500 to-blue-700', glow: 'bg-sky-200', border: 'hover:border-sky-300' },
  { icon: 'from-violet-500 to-indigo-700', glow: 'bg-violet-200', border: 'hover:border-violet-300' },
  { icon: 'from-emerald-500 to-teal-700', glow: 'bg-emerald-200', border: 'hover:border-emerald-300' },
  { icon: 'from-amber-400 to-gold-600', glow: 'bg-amber-200', border: 'hover:border-amber-300' },
  { icon: 'from-rose-500 to-pink-700', glow: 'bg-rose-200', border: 'hover:border-rose-300' },
  { icon: 'from-brand-600 to-brand-950', glow: 'bg-brand-200', border: 'hover:border-brand-300' },
];

const PILL_COLORS = [
  'bg-sky-50 text-sky-700 ring-sky-200',
  'bg-violet-50 text-violet-700 ring-violet-200',
  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'bg-amber-50 text-amber-700 ring-amber-200',
  'bg-rose-50 text-rose-700 ring-rose-200',
];

const TICKER = [
  'Plan comptable SCE',
  'TVA 19 · 13 · 7 %',
  'Droit de timbre',
  'Retenue à la source',
  'TFP & FOPROLOS',
  'Déclaration mensuelle',
  'Facture El Fatoora',
  'Multi-sociétés',
  'Import Excel',
  'TND à 3 décimales',
];

const STEPS = [
  ['Créez votre société', 'Matricule fiscal, exercice : le plan comptable SCE est installé automatiquement.'],
  ['Reprenez l’existant', 'Importez votre plan, vos tiers et votre balance d’ouverture depuis Excel.'],
  ['Saisissez, Raqib calcule', 'Écritures, TVA, retenues et états se mettent à jour en temps réel.'],
] as const;

const FAQ = [
  [
    'Raqib respecte-t-il le système comptable tunisien ?',
    'Oui. Raqib est construit sur la nomenclature du Système Comptable des Entreprises (SCE) : classes 1 à 7, états financiers au format tunisien, devise TND à trois décimales.',
  ],
  [
    'Puis-je reprendre mon plan comptable actuel ?',
    'Oui. Importez un fichier CSV exporté depuis Excel ou votre ancien logiciel. Raqib vous montre ce qui sera créé ou modifié avant de valider.',
  ],
  [
    'Raqib convient-il aux cabinets comptables ?',
    'Oui. Un cabinet gère plusieurs sociétés, chacune avec son plan, ses exercices et ses droits, et suit les échéances de tous ses clients sur un seul écran.',
  ],
  [
    'Que veut dire « Raqib » ?',
    'رقيب (raqib) désigne en arabe celui qui veille, le contrôleur. Le commissaire aux comptes se dit d’ailleurs مراقب الحسابات. Raqib garde un œil sur vos comptes pour que vous n’ayez pas à le faire.',
  ],
] as const;

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Soft light that follows the pointer over the hero.
  const onHeroMove = (e: MouseEvent<HTMLElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <div className="overflow-x-clip bg-paper">
      {/* ─── Header ─── */}
      <header
        className={clsx(
          'sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300',
          scrolled ? 'border-line/80 bg-paper/85 shadow-[0_8px_24px_-16px_rgb(11_31_68/0.25)] backdrop-blur' : 'border-transparent bg-transparent',
        )}
      >
        {/* Reading progress */}
        <div
          ref={progressRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-gold-500 via-rose-500 to-violet-500"
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" aria-label="Raqib, accueil" className="animate-fade">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
            {NAV.map(([label, href], i) => (
              <a
                key={href}
                href={href}
                className="animate-rise relative py-1 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-gold-500 after:transition-transform hover:text-ink hover:after:scale-x-100"
                style={delay(80 + i * 60)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/connexion" className="btn btn-ghost">
              Se connecter
            </Link>
            <Link to="/inscription" className="btn btn-primary shine">
              Essai gratuit
            </Link>
          </div>
          <button className="btn btn-ghost h-9 w-9 px-0 md:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">
            {menu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menu && (
          <div className="animate-fade border-t border-line bg-paper px-4 py-4 md:hidden">
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
      <section ref={heroRef} onMouseMove={onHeroMove} className="relative -mt-16 overflow-hidden pt-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
          <div className="animate-drift absolute -top-40 left-[20%] h-[480px] w-[720px] rounded-full bg-sky-200/60 blur-3xl" />
          <div className="animate-drift absolute right-[4%] top-36 size-80 rounded-full bg-gold-200/70 blur-3xl" style={delay(-6000)} />
          <div className="animate-drift absolute right-[28%] top-[-6rem] size-72 rounded-full bg-violet-200/60 blur-3xl" style={delay(-3000)} />
          <div className="animate-drift absolute bottom-[-8rem] left-[-6rem] size-96 rounded-full bg-emerald-100/70 blur-3xl" style={delay(-11000)} />
          <div className="animate-drift absolute bottom-10 right-[-4rem] size-72 rounded-full bg-rose-200/50 blur-3xl" style={delay(-14000)} />
          <div
            className="absolute inset-0 opacity-70 transition-opacity"
            style={{
              background:
                'radial-gradient(420px circle at var(--mx, 70%) var(--my, 30%), rgb(212 161 46 / 0.10), transparent 70%)',
            }}
          />
        </div>
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-14 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <span
              className="animate-rise inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/90 px-3 py-1 text-xs font-semibold text-ink-soft shadow-card"
              style={delay(0)}
            >
              <span className="relative flex size-2">
                <span className="animate-ping-soft absolute inset-0 rounded-full bg-success-600" />
                <span className="relative size-2 rounded-full bg-success-600" />
              </span>
              Conforme au SCE tunisien · TVA · Retenue à la source
            </span>
            <h1 className="mt-6 text-[42px] font-extrabold leading-[1.05] tracking-tight text-ink md:text-[58px]">
              <span className="animate-rise block" style={delay(100)}>
                La comptabilité
              </span>
              <span className="animate-rise block" style={delay(200)}>
                tunisienne,{' '}
              </span>
              <span className="animate-rise inline-block" style={delay(300)}>
                <RotatingWord />
                .
              </span>
            </h1>
            <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-muted" style={delay(420)}>
              Raqib réunit saisie, banque, fiscalité et états financiers dans un espace clair, pensé pour les entreprises et les
              cabinets comptables en Tunisie.
            </p>
            <div className="animate-rise mt-8 flex flex-wrap items-center gap-3" style={delay(520)}>
              <Link to="/inscription" className="btn btn-primary btn-lg shine group shadow-[0_10px_24px_-12px_rgb(11_31_68/0.7)]">
                Commencer gratuitement <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/connexion" className="btn btn-secondary btn-lg">
                Se connecter
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {['Sans carte bancaire', 'Plan SCE installé en un clic', 'Import depuis Excel'].map((t, i) => (
                <li key={t} className="animate-rise flex items-center gap-1.5" style={delay(640 + i * 90)}>
                  <Check className="size-4 text-success-600" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <div className="relative border-y border-line bg-surface py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-marquee flex w-max gap-3 hover:[animation-play-state:paused]">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span
              key={i}
              className={clsx(
                'flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1',
                PILL_COLORS[i % PILL_COLORS.length],
              )}
            >
              <Sparkles className="size-3.5" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Audience ─── */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-px px-4 md:grid-cols-3 md:px-6">
          {[
            { icon: Building, title: 'Entreprises', text: 'Tenez votre comptabilité en interne, sans jargon inutile.', c: 'bg-sky-50 text-sky-600 group-hover:bg-sky-600' },
            { icon: Briefcase, title: 'Cabinets comptables', text: 'Tous vos dossiers clients et leurs échéances au même endroit.', c: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600' },
            { icon: Banknote, title: 'Experts-comptables', text: 'Révision, états financiers et piste d’audit complète.', c: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600' },
          ].map((a, i) => (
            <Reveal key={a.title} delay={i * 120} className="group flex items-start gap-4 py-8 md:px-6 first:md:pl-0">
              <span className={clsx('grid size-11 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:-rotate-6 group-hover:text-white', a.c)}>
                <a.icon className="size-5" />
              </span>
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Numbers ─── */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4 md:px-6">
          {[
            { value: 7, label: 'classes du SCE prêtes', suffix: '', g: 'from-sky-500 to-blue-700' },
            { value: 300, label: 'comptes de référence', suffix: '+', g: 'from-violet-500 to-fuchsia-600' },
            { value: 3, label: 'taux de TVA gérés', suffix: '', g: 'from-emerald-500 to-teal-600' },
            { value: 3, label: 'décimales pour le dinar', suffix: '', g: 'from-amber-500 to-rose-500' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 100} className="text-center">
              <p className={clsx('animate-gradient bg-gradient-to-r bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl', s.g)}>
                <CountUp value={s.value} />
                {s.suffix}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-gold-600">Fonctionnalités</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Moins de saisie, plus de contrôle.</h2>
          <p className="mt-4 text-lg text-muted">
            Chaque écran va à l’essentiel. Les calculs fiscaux, la numérotation et les contrôles d’équilibre sont faits pour vous.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 110}>
              <div
                className={clsx(
                  'card group relative h-full overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop',
                  FEATURE_COLORS[i].border,
                )}
              >
                <div
                  aria-hidden
                  className={clsx(
                    'absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-100',
                    FEATURE_COLORS[i].glow,
                  )}
                />
                <div className="relative flex items-center justify-between">
                  <span
                    className={clsx(
                      'grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_8px_18px_-10px_rgb(11_31_68/0.9)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
                      FEATURE_COLORS[i].icon,
                    )}
                  >
                    <f.icon className="size-5" />
                  </span>
                  {f.soon && (
                    <span className="rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-700">
                      Bientôt
                    </span>
                  )}
                </div>
                <h3 className="relative mt-5 text-lg font-bold">{f.title}</h3>
                <p className="relative mt-2 text-[15px] leading-relaxed text-muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Cabinets ─── */}
      <section id="cabinets" className="relative scroll-mt-20 overflow-hidden bg-brand-950 text-white">
        <div aria-hidden className="bg-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div aria-hidden className="animate-drift absolute -left-24 top-10 size-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div aria-hidden className="animate-drift absolute -bottom-24 right-0 size-80 rounded-full bg-gold-500/20 blur-3xl" style={delay(-9000)} />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-24 md:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-gold-400">Pour les cabinets</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Tous vos clients, un seul tableau de bord.</h2>
            <p className="mt-4 text-lg text-white/70">
              Raqib signale ce qui demande votre attention dans chaque dossier : déclarations à déposer, écritures à valider,
              relevés à rapprocher, exercices à clôturer.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Un plan comptable, des exercices et des droits par société',
                'Rôles : chef comptable, comptable, assistant, auditeur',
                'Échéances fiscales de tous les clients sur un écran',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-white/85">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold-500 text-brand-950">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={150}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] backdrop-blur">
              <div className="flex items-center justify-between px-1 pb-3">
                <p className="font-semibold">Portefeuille · 4 sociétés</p>
                <p className="text-xs text-white/50">Exemple illustratif</p>
              </div>
              <PortfolioRows />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Steps ─── */}
      <Steps />

      {/* ─── FAQ ─── */}
      <section id="faq" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-24 md:px-6">
          <Reveal as="h2" className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
            Questions fréquentes
          </Reveal>
          <Reveal delay={100} className="mt-12 divide-y divide-line rounded-2xl border border-line">
            {FAQ.map(([q, a], i) => {
              const open = openFaq === i;
              return (
                <div key={q}>
                  <button
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold transition-colors hover:text-brand-600"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {q}
                    <ChevronDown className={clsx('size-5 shrink-0 text-faint transition-transform duration-300', open && 'rotate-180 text-gold-600')} />
                  </button>
                  <div className={clsx('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted">{a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <Reveal>
          <div className="animate-gradient relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#0B1F44,#1f4285,#4c1d95,#0e7490,#0B1F44)] px-8 py-16 text-center text-white md:px-16">
            <div aria-hidden className="bg-grid-light absolute inset-0" />
            <div aria-hidden className="animate-drift absolute -right-20 -top-20 size-72 rounded-full bg-gold-500/35 blur-3xl" />
            <div aria-hidden className="animate-drift absolute -bottom-24 -left-10 size-72 rounded-full bg-brand-500/40 blur-3xl" style={delay(-7000)} />
            <p className="animate-float relative font-arabic text-4xl text-gold-400" lang="ar" dir="rtl">
              رقيب
            </p>
            <h2 className="relative mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Vos comptes, sous bonne garde.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/75">Créez votre espace en quelques minutes, sans carte bancaire.</p>
            <Link to="/inscription" className="btn btn-gold btn-lg shine group relative mt-8 font-bold">
              Essai gratuit <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted md:flex-row md:px-6">
          <Logo />
          <p>
            <span className="font-arabic" lang="ar">
              رقيب
            </span>{' '}
            · celui qui veille sur vos comptes · © {new Date().getFullYear()} Raqib
          </p>
          <div className="flex gap-5">
            <a href="#faq" className="hover:text-ink">
              FAQ
            </a>
            <Link to="/connexion" className="hover:text-ink">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** The last words of the headline change every few seconds, each with its own colours. */
const WORDS = [
  { text: 'enfin simple', gradient: 'from-brand-700 via-sky-500 to-brand-700', stroke: '#d4a12e' },
  { text: 'automatisée', gradient: 'from-violet-600 via-fuchsia-500 to-rose-500', stroke: '#f43f5e' },
  { text: 'conforme', gradient: 'from-emerald-600 via-teal-500 to-sky-500', stroke: '#10b981' },
  { text: 'partagée', gradient: 'from-gold-600 via-amber-500 to-rose-500', stroke: '#8b5cf6' },
];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2800);
    return () => clearInterval(id);
  }, []);
  const w = WORDS[i];
  return (
    <span className="relative whitespace-nowrap [perspective:600px]">
      <span className="sr-only">enfin simple</span>
      <span
        key={w.text}
        aria-hidden
        className={clsx('animate-word-in animate-gradient bg-gradient-to-r bg-clip-text pb-1 text-transparent', w.gradient)}
      >
        {w.text}
      </span>
      <svg aria-hidden viewBox="0 0 300 12" className="absolute -bottom-1.5 left-0 w-full" preserveAspectRatio="none">
        <path
          key={w.text}
          d="M2 9C60 3 140 2 298 7"
          stroke={w.stroke}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          className="animate-draw [animation-delay:0.15s]"
        />
      </svg>
    </span>
  );
}

/** Small coloured icon bubbles drifting around the product preview. */
function Bubble({ className, children, d }: { className: string; children: ReactNode; d: number }) {
  return (
    <span
      aria-hidden
      className={clsx('animate-bob absolute z-10 hidden size-11 place-items-center rounded-2xl text-white shadow-pop sm:grid', className)}
      style={delay(d)}
    >
      {children}
    </span>
  );
}

/** Product preview built in HTML (no screenshot): a slice of the real plan comptable, gently "alive". */
function HeroPreview() {
  const rows = [
    { n: '40', l: 'Fournisseurs et comptes rattachés', d: 0, g: true },
    { n: '40100000', l: 'Fournisseurs d’exploitation', d: 1, tag: 'Tiers' },
    { n: '40100186', l: 'Fournisseur Sahel Équipements', d: 1, tag: 'Tiers' },
    { n: '43', l: 'État et collectivités publiques', d: 0, g: true },
    { n: '43650000', l: 'TVA collectée', d: 1 },
    { n: '43660000', l: 'TVA déductible', d: 1 },
    { n: '43200000', l: 'Retenues à la source', d: 1 },
  ];
  const movable = rows.map((r, i) => (r.g ? -1 : i)).filter((i) => i >= 0);
  const [active, setActive] = useState(movable[0]);

  // The selection walks down the accounts, like someone reviewing the plan.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let k = 0;
    const id = setInterval(() => {
      k = (k + 1) % movable.length;
      setActive(movable[k]);
    }, 2200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3D tilt toward the pointer.
  const tiltRef = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  };
  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = '';
  };

  return (
    <div className="animate-rise relative sm:mb-20 lg:mb-16" style={delay(350)} onMouseMove={onMove} onMouseLeave={onLeave}>
      <Bubble className="-left-6 top-6 bg-gradient-to-br from-rose-400 to-rose-600" d={-1000}>
        <Percent className="size-5" />
      </Bubble>
      <Bubble className="-right-5 bottom-24 bg-gradient-to-br from-emerald-400 to-teal-600" d={-3500}>
        <TrendingUp className="size-5" />
      </Bubble>
      <Bubble className="left-1/2 -top-10 bg-gradient-to-br from-violet-500 to-indigo-600" d={-5200}>
        <Landmark className="size-5" />
      </Bubble>
      <div className="animate-float" style={{ animationDuration: '9s' }}>
        <div ref={tiltRef} className="glow-border rounded-2xl transition-transform duration-200 ease-out">
        <div className="card overflow-hidden shadow-[0_40px_80px_-40px_rgb(11_31_68/0.45)]">
          <div className="flex items-center gap-2 border-b border-line bg-[#F7F9FC] px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#F87171]/70" />
            <span className="size-2.5 rounded-full bg-gold-400/80" />
            <span className="size-2.5 rounded-full bg-success-600/50" />
            <span className="ml-3 text-xs font-semibold text-muted">Plan comptable · Classe 4 — Tiers</span>
          </div>
          <div className="divide-y divide-line">
            {rows.map((r, i) => (
              <div
                key={r.n}
                className={clsx(
                  'animate-slide-in flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-500',
                  i === active ? 'bg-brand-50 shadow-[inset_3px_0_0_var(--color-gold-500)]' : r.g && 'bg-[#FBFCFE]',
                )}
                style={delay(600 + i * 90)}
              >
                <span
                  className={clsx('num w-[76px] shrink-0 font-mono text-[12.5px]', r.g ? 'font-bold' : 'text-ink-soft')}
                  style={{ paddingLeft: r.d * 10 }}
                >
                  {r.n}
                </span>
                <span className={clsx('flex-1 truncate', r.g && 'font-bold')}>{r.l}</span>
                {r.tag && <span className="rounded-md bg-gold-50 px-1.5 py-0.5 text-[11px] font-semibold text-gold-700">{r.tag}</span>}
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    r.g ? 'bg-ink/[0.05] text-muted' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  {r.g ? 'Regroupement' : 'Mouvement'}
                </span>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      <div
        className="animate-rise absolute -right-3 -top-8 z-20 hidden items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-pop sm:flex md:-right-8"
        style={delay(1300)}
      >
        <span className="relative grid size-8 place-items-center rounded-full bg-success-50 text-success-600">
          <BadgeCheck className="size-4" />
        </span>
        <span className="text-xs leading-tight">
          <span className="block font-bold">Déclaration de mai</span>
          <span className="text-muted">TVA et retenues prêtes</span>
        </span>
      </div>

      <div className="animate-rise absolute -bottom-24 -left-4 z-20 hidden w-64 sm:block md:-left-10" style={delay(1100)}>
        <div className="animate-float overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-pop" style={delay(-3000)}>
          <div aria-hidden className="animate-gradient absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-500 to-violet-500" />
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-faint">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Saisie rapide
          </p>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Montant TTC</span>
              <CountUp value={1191} className="font-semibold" format={money} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted">TVA 19 %</span>
              <CountUp value={190} format={money} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Timbre</span>
              <span className="num">1,000</span>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-success-50">
            <div className="animate-grow-x h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={delay(1500)} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success-600">
            <Check className="size-3.5" /> Écriture équilibrée
          </p>
        </div>
      </div>
    </div>
  );
}

/** 1191 → "1 191,000" (Tunisian dinar, three decimals). */
function money(n: number) {
  return `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')},000`;
}

function PortfolioRows() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const rows = [
    { name: 'Atelier Carthage', task: 'Déclaration mensuelle à déposer', tone: 'urgent' },
    { name: 'Oliveraie du Sahel', task: '12 relevés à rapprocher', tone: 'info' },
    { name: 'Studio Médina', task: 'À jour', tone: 'ok' },
    { name: 'Transports Cap Bon', task: 'Exercice 2025 à clôturer', tone: 'urgent' },
  ];
  return (
    <div ref={ref} className="space-y-2">
      {rows.map((r, i) => (
        <div
          key={r.name}
          className={clsx(
            'flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-4 py-3 transition-colors hover:bg-white/[0.1]',
            inView ? 'animate-slide-in' : 'opacity-0',
          )}
          style={delay(200 + i * 140)}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10 text-sm font-bold">{r.name[0]}</span>
            <span className="font-medium">{r.name}</span>
          </div>
          <span
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              r.tone === 'urgent' && 'bg-gold-500/20 text-gold-200',
              r.tone === 'info' && 'bg-brand-400/20 text-brand-200',
              r.tone === 'ok' && 'bg-emerald-400/15 text-emerald-200',
            )}
          >
            {r.tone === 'urgent' && (
              <span className="relative flex size-1.5">
                <span className="animate-ping-soft absolute inset-0 rounded-full bg-gold-400" />
                <span className="relative size-1.5 rounded-full bg-gold-400" />
              </span>
            )}
            {r.task}
          </span>
        </div>
      ))}
    </div>
  );
}

function Steps() {
  const [ref, inView] = useInView<HTMLOListElement>();
  return (
    <section id="etapes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-6">
      <Reveal className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-gold-600">Comment ça marche</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Opérationnel en une matinée.</h2>
      </Reveal>
      <ol ref={ref} className="relative mt-14 grid gap-6 md:grid-cols-3">
        {/* Line linking the three steps, drawn when the block appears. */}
        <div aria-hidden className="absolute left-[16%] right-[16%] top-[48px] hidden h-0.5 bg-line md:block">
          <div
            className={clsx('h-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500', inView ? 'animate-grow-x' : 'scale-x-0')}
            style={delay(300)}
          />
        </div>
        {STEPS.map(([title, text], i) => (
          <li
            key={title}
            className={clsx(
              'relative rounded-2xl border border-line bg-surface p-7 transition-shadow hover:shadow-pop',
              inView ? 'animate-rise' : 'opacity-0',
            )}
            style={delay(i * 220)}
          >
            <span
              className={clsx(
                'relative z-10 grid size-10 place-items-center rounded-full bg-gradient-to-br font-mono text-sm font-bold text-white ring-4 ring-paper',
                ['from-sky-500 to-blue-700', 'from-violet-500 to-fuchsia-600', 'from-emerald-500 to-teal-600'][i],
              )}
            >
              0{i + 1}
            </span>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-[15px] text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
