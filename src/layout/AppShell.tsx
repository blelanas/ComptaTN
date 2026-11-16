import clsx from 'clsx';
import { CalendarDays, LogOut, Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { CompanySwitcher } from '@/features/societes/CompanySwitcher';
import { VerifyEmailHint } from '@/features/societes/InvitationCard';
import { formatDate, initials, sortExercices } from '@/features/societes/model';
import { CommandPalette } from '@/layout/CommandPalette';
import { useCompany } from '@/lib/company';
import { NAV_SECTIONS } from '@/lib/navigation';
import { useCurrentUser, useSession } from '@/lib/session';

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col" aria-label="Navigation principale">
      <div className="flex h-16 items-center px-5">
        <Link to="/app" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2">
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.title ?? i}>
            {section.title && (
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-faint">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/app'}
                    onClick={onNavigate}
                    className={({ isActive }: { isActive: boolean }) =>
                      clsx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-ink/[0.04] hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }: { isActive: boolean }) => (
                      <>
                        <item.icon className={clsx('size-[18px]', isActive ? 'text-brand-600' : 'text-faint group-hover:text-muted')} />
                        <span className="flex-1">{item.label}</span>
                        {item.status === 'soon' && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-faint">Bientôt</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <UserBlock />
    </nav>
  );
}

function UserBlock() {
  const { user, isDemo } = useCurrentUser();
  const { company } = useCompany();
  const { signOut } = useSession();
  const navigate = useNavigate();
  const role = company.members[user.uid]?.role === 'proprietaire' ? 'Propriétaire' : 'Membre';
  return (
    <div className="border-t border-line p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-clay-100 text-sm font-bold text-clay-700">
          {initials(user.nom)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.nom}</p>
          <p className="truncate text-xs text-muted">{isDemo ? 'Mode démo' : `${role} · ${user.email}`}</p>
        </div>
        <button
          className="btn btn-ghost h-8 w-8 px-0"
          title={isDemo ? 'Quitter la démo' : 'Se déconnecter'}
          aria-label={isDemo ? 'Quitter la démo' : 'Se déconnecter'}
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Demo and unverified-e-mail notices, above the top bar. */
function SessionBanner() {
  const { user, isDemo } = useCurrentUser();
  if (isDemo) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-clay-50 px-4 py-2 text-center text-[13px] text-clay-700">
        <span>Mode démo : vos données restent dans ce navigateur.</span>
        <Link to="/inscription" className="font-semibold underline underline-offset-2">
          Créer un compte gratuit
        </Link>
      </div>
    );
  }
  if (!user.emailVerified) {
    return (
      <div className="flex justify-center bg-warning-50 px-4 py-2 text-[13px] text-warning-600">
        <VerifyEmailHint compact />
      </div>
    );
  }
  return null;
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { company, exercice, setExercice } = useCompany();
  const exercices = sortExercices(company.exercices);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur md:px-8">
      <button className="btn btn-ghost h-9 w-9 shrink-0 px-0 lg:hidden" onClick={onMenu} aria-label="Ouvrir le menu">
        <Menu className="size-5" />
      </button>

      <CompanySwitcher />

      <label
        className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 shadow-card"
        title={`Du ${formatDate(exercice.debut)} au ${formatDate(exercice.fin)}`}
      >
        <CalendarDays className="size-4 text-faint" />
        <span className="sr-only">Exercice</span>
        <select
          className="cursor-pointer bg-transparent text-sm font-semibold focus:outline-none"
          value={exercice.annee}
          onChange={(e) => setExercice(Number(e.target.value))}
        >
          {exercices.map((ex) => (
            <option key={ex.annee} value={ex.annee}>
              Exercice {ex.annee}
              {ex.statut === 'cloture' ? ' (clôturé)' : ''}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={onSearch}
        className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted shadow-card hover:border-line-strong md:w-72"
      >
        <Search className="size-4" />
        <span className="hidden flex-1 truncate text-left md:block">Rechercher…</span>
        <span className="kbd hidden md:inline-flex">Ctrl K</span>
      </button>
    </header>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div className="min-h-screen lg:pl-64">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-surface lg:block">
          <Sidebar />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-surface shadow-pop">
              <button
                className="btn btn-ghost absolute right-3 top-3.5 h-9 w-9 px-0"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="size-5" />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <SessionBanner />
        <Topbar onMenu={() => setMobileOpen(true)} onSearch={() => setPaletteOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
