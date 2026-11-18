import { Check, MailCheck, X } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from '@/components/FullPageLoader';
import { useToast } from '@/components/ui';
import { useCompanies } from '@/lib/company';
import { errorMessage } from '@/lib/errors';
import { useCurrentUser, useSession } from '@/lib/session';
import type { Invitation } from './model';

/**
 * An invitation addressed to the signed-in user. Joining requires a confirmed
 * e-mail address, so nobody can join by signing up with someone else's e-mail.
 */
export function InvitationCard({ invitation }: { invitation: Invitation }) {
  const { acceptInvitation, declineInvitation } = useCompanies();
  const { user } = useCurrentUser();
  const toast = useToast();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  const run = async (kind: 'accept' | 'decline') => {
    setBusy(kind);
    try {
      if (kind === 'accept') {
        await acceptInvitation(invitation);
        toast(`Vous avez rejoint ${invitation.raisonSociale}.`);
      } else {
        await declineInvitation(invitation);
        toast('Invitation refusée.');
      }
    } catch (e) {
      toast(errorMessage(e), 'danger');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm">
        <strong>{invitation.invitedByName || 'Un utilisateur'}</strong> vous invite à rejoindre{' '}
        <strong>{invitation.raisonSociale}</strong>.
      </p>
      {user.emailVerified ? (
        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary h-8 px-3 text-[13px]" onClick={() => run('accept')} disabled={!!busy}>
            {busy === 'accept' ? <Spinner /> : <Check className="size-3.5" />} Rejoindre
          </button>
          <button className="btn btn-secondary h-8 px-3 text-[13px]" onClick={() => run('decline')} disabled={!!busy}>
            {busy === 'decline' ? <Spinner /> : <X className="size-3.5" />} Refuser
          </button>
        </div>
      ) : (
        <VerifyEmailHint />
      )}
    </div>
  );
}

/** Asks the user to confirm their e-mail, with resend and "I did it" actions. */
export function VerifyEmailHint({ compact = false }: { compact?: boolean }) {
  const { resendVerification, refreshUser } = useSession();
  const { user } = useCurrentUser();
  const toast = useToast();
  const [busy, setBusy] = useState<'send' | 'check' | null>(null);

  const resend = async () => {
    setBusy('send');
    try {
      await resendVerification();
      toast(`E-mail de confirmation envoyé à ${user.email}.`);
    } catch (e) {
      toast(errorMessage(e), 'danger');
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setBusy('check');
    try {
      await refreshUser();
    } catch (e) {
      toast(errorMessage(e), 'danger');
    } finally {
      setBusy(null);
    }
  };

  const actions = (
    <span className="inline-flex gap-3">
      <button className="font-semibold underline-offset-2 hover:underline" onClick={resend} disabled={!!busy}>
        {busy === 'send' ? 'Envoi…' : 'Renvoyer l’e-mail'}
      </button>
      <button className="font-semibold underline-offset-2 hover:underline" onClick={check} disabled={!!busy}>
        {busy === 'check' ? 'Vérification…' : 'J’ai confirmé'}
      </button>
    </span>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <MailCheck className="size-4 shrink-0" />
          Confirmez votre adresse e-mail avec le lien que nous vous avons envoyé.
        </span>
        {actions}
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-600">
      <p className="flex gap-1.5">
        <MailCheck className="mt-0.5 size-4 shrink-0" />
        <span>
          Pour rejoindre une société, confirmez d’abord votre adresse <strong>{user.email}</strong> avec le lien reçu
          par e-mail.
        </span>
      </p>
      {actions}
    </div>
  );
}
