import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Info } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/Logo';
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

function SidePanel() {
  return (
    <div className="relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col">
      <div aria-hidden className="absolute -left-20 top-1/3 size-96 rounded-full bg-brand-600/40 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 right-0 size-80 rounded-full bg-clay-500/25 blur-3xl" />
      <Link to="/" className="relative">
        <Logo inverted />
      </Link>
      <div className="relative mt-auto">
        <p className="font-arabic text-5xl text-white/90" lang="ar" dir="rtl">
          رقيب
        </p>
        <p className="mt-6 max-w-md text-3xl font-extrabold leading-tight tracking-tight">
          Vos comptes, sous bonne garde.
        </p>
        <p className="mt-4 max-w-md text-white/70">
          Plan SCE, saisie rapide, TVA et retenue à la source : tout est prêt dès la création de votre société.
        </p>
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <SidePanel />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <h1 className="mt-8 text-2xl font-extrabold tracking-tight lg:mt-0">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>

          {unavailable && (
            <div className="mt-6">
              <Alert tone="info">
                La connexion n’est pas disponible sur cette version (Firebase n’est pas configuré ici). Vous pouvez
                explorer la démo.
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

          {mode !== 'reset' && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-faint">
                <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
              </div>
              <button type="button" onClick={startDemo} className="btn btn-secondary btn-lg w-full">
                Explorer la démo
              </button>
              <p className="mt-3 text-center text-xs text-faint">La démo garde les données dans ce navigateur.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
