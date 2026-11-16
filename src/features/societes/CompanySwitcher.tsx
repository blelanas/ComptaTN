import clsx from 'clsx';
import { Check, ChevronDown, Plus, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, useToast } from '@/components/ui';
import { useCompany } from '@/lib/company';
import { InvitationCard } from './InvitationCard';
import { NewCompanyForm } from './NewCompanyForm';

/** Top-bar button: current company, one-click switch, new company, pending invitations. */
export function CompanySwitcher() {
  const { companies, company, switchCompany, invitations } = useCompany();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        className="relative flex min-w-0 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-left shadow-card hover:border-line-strong"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Changer de société"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">
          {company.code}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[14rem] truncate text-sm font-semibold leading-tight">{company.raisonSociale}</span>
          <span className="block truncate text-[11px] text-muted">
            {company.matriculeFiscal ? `MF ${company.matriculeFiscal}` : 'Matricule fiscal à compléter'}
          </span>
        </span>
        <ChevronDown className="size-4 text-faint" />
        {invitations.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-clay-500 text-[10px] font-bold text-white">
            {invitations.length}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-2 shadow-pop">
          <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-faint">Vos sociétés</p>
          <ul className="max-h-72 overflow-y-auto">
            {companies.map((c) => (
              <li key={c.id}>
                <button
                  role="menuitem"
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink/[0.04]',
                    c.id === company.id && 'bg-brand-50',
                  )}
                  onClick={() => {
                    switchCompany(c.id);
                    setOpen(false);
                    if (c.id !== company.id) {
                      navigate('/app');
                      toast(`Société : ${c.raisonSociale}`);
                    }
                  }}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">
                    {c.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.raisonSociale}</span>
                    <span className="block truncate text-[11px] text-muted">{c.matriculeFiscal || 'MF à compléter'}</span>
                  </span>
                  {c.id === company.id && <Check className="size-4 text-brand-600" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-line pt-1">
            <button
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              onClick={() => {
                setOpen(false);
                setCreating(true);
              }}
            >
              <Plus className="size-4" /> Nouvelle société
            </button>
            <Link
              role="menuitem"
              to="/app/parametres"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink-soft hover:bg-ink/[0.04]"
            >
              <Settings className="size-4" /> Paramètres de la société
            </Link>
          </div>
          {invitations.length > 0 && (
            <div className="mt-1 space-y-2 border-t border-line px-1 pb-1 pt-2">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-faint">Invitations</p>
              {invitations.map((inv) => (
                <InvitationCard key={inv.id} invitation={inv} />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nouvelle société"
        description="Le plan comptable SCE et le premier exercice sont créés automatiquement."
        size="lg"
      >
        <NewCompanyForm
          autoFocus
          onCancel={() => setCreating(false)}
          onCreated={(c) => {
            setCreating(false);
            navigate('/app');
            toast(`${c.raisonSociale} est prête.`);
          }}
        />
      </Modal>
    </div>
  );
}
