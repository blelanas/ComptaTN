import { ArrowRight, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';

/**
 * Sign-in screen. Authentication is not wired yet (next iteration):
 * the form and the demo button both open the demo workspace.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -left-20 top-1/3 size-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 right-0 size-80 rounded-full bg-clay-500/25 blur-3xl" />
        <Link to="/" className="relative">
          <Logo inverted />
        </Link>
        <div className="relative mt-auto">
          <p className="font-arabic text-5xl text-white/90" lang="ar" dir="rtl">
            قيد
          </p>
          <p className="mt-6 max-w-md text-3xl font-extrabold leading-tight tracking-tight">
            L’écriture comptable, au cœur d’un outil simple.
          </p>
          <p className="mt-4 max-w-md text-white/70">Plan SCE, saisie rapide, TVA et retenue à la source : tout est prêt dès la création de votre société.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden">
            <Logo />
          </Link>
          <h1 className="mt-8 text-2xl font-extrabold tracking-tight lg:mt-0">Connexion</h1>
          <p className="mt-1 text-sm text-muted">Accédez à votre espace comptable.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/app');
            }}
          >
            <div>
              <label className="label" htmlFor="email">
                Adresse e-mail
              </label>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="vous@societe.tn" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">
                  Mot de passe
                </label>
                <span className="mb-1.5 text-xs font-semibold text-brand-600">Mot de passe oublié ?</span>
              </div>
              <input id="password" type="password" autoComplete="current-password" className="input" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full">
              Se connecter <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
          </div>
          <Link to="/app" className="btn btn-secondary btn-lg w-full">
            Explorer la démo
          </Link>

          <p className="mt-6 flex gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
            <Info className="mt-px size-3.5 shrink-0" />
            Version de démonstration : l’authentification arrive dans une prochaine étape. Les données restent dans votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
