import { Building2, CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useToast } from '@/components/ui';
import { useCompanies } from '@/lib/company';
import { useCurrentUser, useSession } from '@/lib/session';
import { InvitationCard } from './InvitationCard';
import { NewCompanyForm } from './NewCompanyForm';

/** First screen after sign-up: create the first company, or join one you were invited to. */
export default function OnboardingPage() {
  const { invitations } = useCompanies();
  const { user } = useCurrentUser();
  const { signOut } = useSession();
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 md:px-8">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">{user.email}</span>
          <button
            className="btn btn-ghost h-9 px-3"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            <LogOut className="size-4" /> Se déconnecter
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Bienvenue, {user.nom.split(' ')[0]}</h1>
        <p className="mt-2 text-muted">Créez votre société : le plan comptable SCE et le premier exercice sont prêts aussitôt.</p>

        {invitations.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-faint">Invitations reçues</h2>
            <div className="mt-3 space-y-3">
              {invitations.map((inv) => (
                <InvitationCard key={inv.id} invitation={inv} />
              ))}
            </div>
          </section>
        )}

        <section className="card mt-8 p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Building2 className="size-5" />
            </span>
            <div>
              <h2 className="font-bold">{invitations.length > 0 ? 'Ou créez votre société' : 'Votre société'}</h2>
              <p className="text-sm text-muted">Seule la raison sociale est obligatoire. Le reste peut attendre.</p>
            </div>
          </div>
          <NewCompanyForm
            autoFocus={invitations.length === 0}
            onCreated={(company) => {
              toast(`${company.raisonSociale} est prête.`);
              navigate('/app');
            }}
          />
        </section>

        <ul className="mt-6 space-y-2 text-sm text-muted">
          {[
            'Plan comptable SCE installé automatiquement',
            'Vous pourrez ajouter d’autres sociétés à tout moment',
            'Invitez votre comptable ou votre équipe depuis les paramètres',
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success-600" /> {t}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
