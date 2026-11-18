import clsx from 'clsx';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Info,
  Lock,
  Percent,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo, LogoMark } from '@/components/Logo';
import { CountUp, delay } from '@/components/motion';
import { Spinner } from '@/components/FullPageLoader';
import { validateEmail } from '@/features/societes/model';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';

export type AuthMode = 'connexion' | 'inscription' | 'reset';

const PASSWORD_MIN = 8;

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string }> = {
  connexion: { title: 'Connexion', subtitle: 'Accédez à votre espace comptable.', submit: 'Se connecter' },
  inscription: {
    title: 'Créer un compte',
    subtitle: 'Gratuit, sans carte bancaire. Votre plan comptable SCE est prêt en une minute.',
    submit: 'Créer mon compte',
  },
  reset: {
    title: 'Mot de passe oublié',
    subtitle: 'Indiquez votre e-mail : nous vous envoyons un lien pour choisir un nouveau mot de passe.',
    submit: 'Envoyer le lien',
  },
};

const TIPS = [
  { title: 'Plan SCE prêt à l’emploi', text: 'Le plan comptable tunisien est installé dès la création de votre société.' },
  { title: 'Fiscalité calculée pour vous', text: 'TVA 19 / 13 / 7 %, timbre et retenue à la source, sans calculatrice.' },
  { title: 'Plusieurs sociétés, un seul compte', text: 'Passez d’un dossier à l’autre en un clic, chacun avec ses exercices.' },
  { title: 'Travaillez à plusieurs', text: 'Invitez votre comptable ou vos collaborateurs sur la même société.' },
];

/** Left half of the sign-in pages: brand, a live-looking product preview and rotating highlights. */
function SidePanel() {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative hidden overflow-hidden lg:sticky lg:top-0 lg:h-screen bg-[linear-gradient(160deg,#081633_0%,#0B1F44_55%,#0C2747_100%)] text-white lg:flex lg:flex-col">
      <div aria-hidden className="bg-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_at_60%_45%,black,transparent_75%)]" />
      <div aria-hidden className="animate-drift absolute -left-24 top-1/4 size-[26rem] rounded-full bg-brand-500/30 blur-3xl" />
      <div aria-hidden className="animate-drift absolute -bottom-28 right-[-4rem] size-96 rounded-full bg-gold-500/25 blur-3xl" style={delay(-8000)} />
      {/* The gold curve of the logo, large and faint. */}
      <svg aria-hidden viewBox="0 0 44 37" className="absolute -right-24 top-24 w-[34rem] opacity-[0.07]">
        <path
          fill="var(--color-gold-500)"
          d="M0.2 36.8C5 29.5 16 27 24 24.4 33 21.5 42 15 43.5 4.5 42.6 14.5 35 21.5 25 25.6 16 29.2 6 30.5 0.2 36.8Z"
        />
      </svg>

      <div className="relative flex flex-1 flex-col p-12 xl:p-14">
        <Link to="/" className="animate-fade self-start" aria-label="Raqib, accueil">
          <Logo inverted tagline />
        </Link>

        {/* Product preview */}
        <div className="mx-auto my-6 grid w-full max-w-md flex-1 place-items-center">
        <div className="relative w-full">
          <div className="animate-rise" style={delay(150)}>
            <div className="animate-float rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.7)] backdrop-blur-md" style={{ animationDuration: '8s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-400">Tableau de bord</p>
                  <p className="mt-0.5 font-semibold">Atlas Conseil SARL · 2026</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  <span className="relative flex size-1.5">
                    <span className="animate-ping-soft absolute inset-0 rounded-full bg-emerald-300" />
                    <span className="relative size-1.5 rounded-full bg-emerald-300" />
                  </span>
                  À jour
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Ventes', value: 248650 },
                  { label: 'Charges', value: 171420 },
                  { label: 'Trésorerie', value: 86120 },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl bg-white/[0.06] px-3 py-2.5">
                    <p className="text-[11px] text-white/55">{k.label}</p>
                    <p className="mt-0.5 text-[15px] font-bold">
                      <CountUp value={k.value} format={(n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} />
                    </p>
                    <p className="text-[10px] text-white/40">TND</p>
                  </div>
                ))}
              </div>
              {/* Monthly bars */}
              <div className="mt-4 flex h-24 items-end gap-2 rounded-xl bg-white/[0.04] px-3 pb-3 pt-4">
                {[38, 52, 46, 64, 58, 72, 66, 84, 78, 92].map((h, i) => (
                  <div
                    key={i}
                    className={clsx('animate-grow-y flex-1 rounded-t-md', i === 9 ? 'bg-gold-500' : 'bg-white/25')}
                    style={{ height: `${h}%`, ...delay(500 + i * 70) }}
                  />
                ))}
              </div>
              <p className="mt-2 text-right text-[10px] text-white/35">Exemple illustratif</p>
            </div>
          </div>

          <div className="animate-rise absolute -right-6 -top-7 xl:-right-12" style={delay(900)}>
            <div className="animate-float flex items-center gap-2.5 rounded-xl border border-white/10 bg-brand-950/85 px-3 py-2 shadow-pop backdrop-blur" style={delay(-2000)}>
              <span className="grid size-7 place-items-center rounded-lg bg-gold-500 text-brand-950">
                <FileCheck2 className="size-4" />
              </span>
              <span className="text-xs leading-tight">
                <span className="block font-bold">Déclaration de mai</span>
                <span className="text-white/60">TVA et retenues prêtes</span>
              </span>
            </div>
          </div>

          <div className="animate-rise absolute -bottom-7 -left-6 xl:-left-12" style={delay(1150)}>
            <div className="animate-float rounded-xl border border-white/10 bg-white px-3 py-2 text-ink shadow-pop" style={delay(-4500)}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Compte créé</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs">
                <span className="num font-mono font-bold">40100186</span>
                <span className="text-muted">Fournisseur Sahel</span>
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Headline + rotating highlight */}
        <div className="animate-rise relative" style={delay(300)}>
          <p className="max-w-md text-[34px] font-extrabold leading-[1.1] tracking-tight">
            Vos comptes, <span className="text-gold-400">sous bonne garde.</span>
          </p>
          <div className="mt-6 flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-400">
              <Sparkles className="size-[18px]" />
            </span>
            <div key={tip} className="animate-fade min-h-[42px]">
              <p className="text-sm font-bold">{TIPS[tip].title}</p>
              <p className="mt-0.5 text-[13px] text-white/65">{TIPS[tip].text}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {TIPS.map((_, i) => (
              <span key={i} className={clsx('h-1 rounded-full transition-all duration-500', i === tip ? 'w-6 bg-gold-500' : 'w-2 bg-white/20')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Alert({ tone, children }: { tone: 'danger' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    danger: 'bg-danger-50 text-danger-600',
    success: 'bg-success-50 text-success-600',
    info: 'bg-brand-50 text-brand-800',
  }[tone];
  const Icon = tone === 'danger' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex gap-2 rounded-xl p-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/app';
  const copy = COPY[mode];
  const unavailable = session.cloudAvailable === false;

  if (session.state.status === 'signed-in') return <Navigate to={from} replace />;

  const validate = (): string | null => {
    if (mode === 'inscription' && !nom.trim()) return 'Indiquez votre nom.';
    const emailError = validateEmail(email);
    if (emailError) return emailError;
    if (mode === 'connexion' && !password) return 'Indiquez votre mot de passe.';
    if (mode === 'inscription' && password.length < PASSWORD_MIN) {
      return `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`;
    }
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      if (mode === 'connexion') {
        await session.signIn(email, password);
        navigate(from, { replace: true });
      } else if (mode === 'inscription') {
        await session.signUp(nom, email, password);
        navigate('/app', { replace: true });
      } else {
        await session.resetPassword(email).catch((err: { code?: string }) => {
          // Same answer whether or not the account exists.
          if (err.code !== 'auth/user-not-found') throw err;
        });
        setSent(true);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const startDemo = () => {
    session.startDemo();
    navigate('/app');
  };

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[1.05fr_1fr]">
      <SidePanel />

      <div className="relative flex min-h-screen flex-col overflow-hidden px-4 py-5 sm:px-8">
        <div aria-hidden className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_70%)]" />
        <div aria-hidden className="animate-drift absolute -right-24 -top-24 size-80 rounded-full bg-gold-100/80 blur-3xl" />
        <div aria-hidden className="animate-drift absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-100/70 blur-3xl" style={delay(-6000)} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between gap-3 text-sm">
          <Link to="/" className="flex items-center gap-1.5 font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Retour au site</span>
          </Link>
          <Link to="/" className="lg:hidden" aria-label="Raqib, accueil">
            <Logo />
          </Link>
          <span className="hidden text-muted sm:inline">
            {mode === 'connexion' ? (
              <>
                Nouveau sur Raqib ?{' '}
                <Link to="/inscription" className="font-semibold text-brand-600 hover:underline">
                  Essai gratuit
                </Link>
              </>
            ) : (
              <>
                Déjà inscrit ?{' '}
                <Link to="/connexion" className="font-semibold text-brand-600 hover:underline">
                  Se connecter
                </Link>
              </>
            )}
          </span>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
        <div
          key={mode}
          className="animate-rise w-full max-w-[420px] rounded-3xl border border-line bg-surface/95 p-7 shadow-[0_30px_70px_-35px_rgb(11_31_68/0.35)] backdrop-blur sm:p-9"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
            <LogoMark className="h-6 w-7" />
          </span>
          <h1 className="mt-5 text-[26px] font-extrabold tracking-tight">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>

          {unavailable && (
            <div className="mt-6">
              <Alert tone="info">
                Firebase n’est pas configuré sur cette version de développement : la connexion est indisponible. Vous
                pouvez ouvrir l’application en mode local.
              </Alert>
            </div>
          )}

          {mode === 'reset' && sent ? (
            <div className="mt-8 space-y-6">
              <Alert tone="success">
                Si un compte existe pour <strong>{email.trim()}</strong>, un e-mail vient d’être envoyé. Pensez à
                vérifier les courriers indésirables.
              </Alert>
              <Link to="/connexion" className="btn btn-secondary btn-lg w-full">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
              {mode === 'inscription' && (
                <div>
                  <label className="label" htmlFor="nom">
                    Nom complet
                  </label>
                  <input
                    id="nom"
                    className="input"
                    autoComplete="name"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Amira Ben Salah"
                    autoFocus
                  />
                </div>
              )}
              <div>
                <label className="label" htmlFor="email">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  placeholder="vous@societe.tn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus={mode !== 'inscription'}
                />
              </div>
              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label" htmlFor="password">
                      Mot de passe
                    </label>
                    {mode === 'connexion' && (
                      <Link to="/mot-de-passe-oublie" className="mb-1.5 text-xs font-semibold text-brand-600 hover:underline">
                        Mot de passe oublié ?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
                      className="input pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-faint hover:text-ink"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {mode === 'inscription' && (
                    <p className="mt-1.5 text-xs text-muted">Au moins {PASSWORD_MIN} caractères.</p>
                  )}
                </div>
              )}

              {error && <Alert tone="danger">{error}</Alert>}

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy || unavailable}>
                {busy ? <Spinner /> : null}
                {copy.submit}
                {!busy && <ArrowRight className="size-4" />}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'connexion' ? (
              <>
                Pas encore de compte ?{' '}
                <Link to="/inscription" className="font-semibold text-brand-600 hover:underline">
                  Créer un compte
                </Link>
              </>
            ) : (
              <>
                {mode === 'inscription' ? 'Déjà un compte ?' : 'Vous vous souvenez ?'}{' '}
                <Link to="/connexion" className="font-semibold text-brand-600 hover:underline">
                  Se connecter
                </Link>
              </>
            )}
          </p>

          {/* Local mode exists only for development without Firebase; the deployed site never shows it. */}
          {unavailable && mode !== 'reset' && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-faint">
                <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
              </div>
              <button type="button" onClick={startDemo} className="btn btn-secondary btn-lg w-full">
                Ouvrir en mode local
              </button>
              <p className="mt-3 text-center text-xs text-faint">Les données restent dans ce navigateur.</p>
            </>
          )}
        </div>
        </div>

        {/* Trust row + footer */}
        <div className="relative flex flex-col items-center gap-3 text-xs text-muted">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: BookOpen, label: 'Plan SCE tunisien' },
              { icon: Percent, label: 'TVA · Timbre · Retenue' },
              { icon: Lock, label: 'Connexion sécurisée' },
            ].map((t, i) => (
              <span
                key={t.label}
                className="animate-rise flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1.5 font-medium text-ink-soft"
                style={delay(400 + i * 100)}
              >
                <t.icon className="size-3.5 text-gold-600" /> {t.label}
              </span>
            ))}
          </div>
          <p>
            © {new Date().getFullYear()} Raqib ·{' '}
            <span className="font-arabic" lang="ar">
              رقيب
            </span>{' '}
            · celui qui veille sur vos comptes
          </p>
        </div>
      </div>
    </div>
  );
}
