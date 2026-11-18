import clsx from 'clsx';
import { ArrowLeft, CalendarDays, ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { CompanySwitcher } from '@/features/societes/CompanySwitcher';
import { VerifyEmailHint } from '@/features/societes/InvitationCard';
import { formatDate, initials, sortExercices } from '@/features/societes/model';
import { CommandPalette } from '@/layout/CommandPalette';
import { useCompany } from '@/lib/company';
import { NAV, type NavEntry, type NavItem } from '@/lib/navigation';
import { useCurrentUser, useSession } from '@/lib/session';

const isActivePath = (pathname: string, item: NavItem) =>
  item.path === '/app' ? pathname === '/app' : pathname === item.path || pathname.startsWith(`${item.path}/`);

function groupContains(entry: NavEntry, pathname: string) {
  return (entry.items ?? []).some((item) => isActivePath(pathname, item));
}

// ───────────────────────────── Sidebar ─────────────────────────────

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  // Groups the user opened; the group of the current page is always open.
  const [opened, setOpened] = useState<Set<string>>(() => new Set(['Comptabilité']));

  useEffect(() => {
    const current = NAV.find((entry) => groupContains(entry, pathname));
    if (current) setOpened((prev) => (prev.has(current.label) ? prev : new Set(prev).add(current.label)));
  }, [pathname]);

  const toggle = (label: string) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  return (
    <nav
      className="flex h-full flex-col bg-[linear-gradient(180deg,#081633_0%,#0B1F44_60%,#0C2747_100%)] text-brand-200"
      aria-label="Navigation principale"
    >
      <div className="px-6 pb-5 pt-6">
        <Link to="/app" onClick={onNavigate} aria-label="Raqib, tableau de bord">
          <Logo inverted tagline />
        </Link>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 [scrollbar-color:rgb(255_255_255/0.15)_transparent]">
        {NAV.map((entry) => {
          if (entry.item) {
            const item = entry.item;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                onClick={onNavigate}
                className={({ isActive }: { isActive: boolean }) =>
                  clsx(
                    'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-colors',
                    isActive
                      ? 'bg-white/[0.09] font-semibold text-white shadow-[inset_3px_0_0_var(--color-gold-500)]'
                      : 'hover:bg-white/[0.06] hover:text-white',
                  )
                }
              >
                <entry.icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                <span className="flex-1">{entry.label}</span>
              </NavLink>
            );
          }
          const containsCurrent = groupContains(entry, pathname);
          const open = opened.has(entry.label) || containsCurrent;
          return (
            <div key={entry.label}>
              <button
                className={clsx(
                  'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-white/[0.06] hover:text-white',
                  containsCurrent ? 'font-semibold text-white' : 'font-medium',
                )}
                aria-expanded={open}
                onClick={() => toggle(entry.label)}
              >
                <entry.icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                <span className="flex-1">{entry.label}</span>
                <ChevronDown className={clsx('size-4 transition-transform', open ? 'rotate-0' : '-rotate-90')} />
              </button>
              {open && (
                <ul className="space-y-0.5 pb-1.5 pl-[31px] pt-0.5">
                  {entry.items!.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onNavigate}
                        className={({ isActive }: { isActive: boolean }) =>
                          clsx(
                            'flex items-center gap-2 rounded-[9px] px-3 py-[7px] text-[13.5px] transition-colors',
                            isActive
                              ? 'bg-white/[0.09] font-bold text-white shadow-[inset_3px_0_0_var(--color-gold-500)]'
                              : 'text-brand-200/90 hover:text-white',
                          )
                        }
                      >
                        <span className="flex-1">{item.label}</span>
                        {item.status === 'soon' && <span className="size-1.5 rounded-full bg-white/20" title="Bientôt" />}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <UserCard />
    </nav>
  );
}

function useRole() {
  const { user } = useCurrentUser();
  const { company } = useCompany();
  return company.members[user.uid]?.role === 'proprietaire' ? 'Propriétaire' : 'Membre';
}

function UserCard() {
  const { user, isDemo } = useCurrentUser();
  const role = useRole();
  const { signOut } = useSession();
  const navigate = useNavigate();
  return (
    <div className="m-3 mt-0 flex items-center gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.06] p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-500 text-[13px] font-extrabold text-brand-950">
        {initials(user.nom)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-bold text-white">{user.nom}</span>
        <span className="flex items-center gap-1.5 truncate text-xs text-brand-200">
          {isDemo ? 'Mode local' : role}
          <span className="inline-block size-1.5 rounded-full bg-gold-500" />
          Actif
        </span>
      </span>
      <button
        className="grid size-8 shrink-0 place-items-center rounded-lg text-brand-200 hover:bg-white/10 hover:text-white"
        title="Se déconnecter"
        aria-label="Se déconnecter"
        onClick={async () => {
          await signOut();
          navigate('/');
        }}
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

// ───────────────────────────── Top bar ─────────────────────────────

/** Unverified e-mail and local-mode notices, above the top bar. */
function SessionBanner() {
  const { user, isDemo } = useCurrentUser();
  if (isDemo) {
    return (
      <div className="bg-gold-50 px-4 py-1.5 text-center text-[12.5px] text-gold-700">
        Mode local (développement) : Firebase n’est pas configuré, les données restent dans ce navigateur.
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

function ExerciceSelect() {
  const { company, exercice, setExercice } = useCompany();
  const exercices = sortExercices(company.exercices);
  return (
    <label
      className="relative flex h-10 shrink-0 items-center rounded-[10px] border border-line-strong bg-surface pl-3 pr-2.5 hover:bg-paper"
      title={`Du ${formatDate(exercice.debut)} au ${formatDate(exercice.fin)}`}
    >
      <span className="sr-only">Exercice</span>
      <select
        className="cursor-pointer appearance-none bg-transparent pr-7 text-sm font-semibold focus:outline-none"
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
      <CalendarDays className="pointer-events-none absolute right-2.5 size-4 text-muted" />
    </label>
  );
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { user } = useCurrentUser();
  const role = useRole();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2.5 border-b border-line bg-surface px-4 py-3 md:px-7">
      <button
        className="grid size-10 shrink-0 place-items-center rounded-[10px] text-ink-soft hover:bg-paper"
        onClick={onMenu}
        aria-label="Afficher ou masquer le menu"
      >
        <Menu className="size-5" />
      </button>
      <button
        className="hidden h-10 shrink-0 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm font-semibold hover:bg-paper sm:flex"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="size-4" /> Retour
      </button>
      <CompanySwitcher />
      <ExerciceSelect />

      <div className="ml-auto flex items-center gap-2.5">
        <button
          onClick={onSearch}
          className="flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-muted hover:bg-paper xl:w-64"
          aria-label="Rechercher"
        >
          <Search className="size-4" />
          <span className="hidden flex-1 truncate text-left xl:block">Rechercher…</span>
          <span className="kbd hidden xl:inline-flex">Ctrl K</span>
        </button>
        <Link to="/app/parametres" className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-paper" title="Paramètres">
          <span className="grid size-10 place-items-center rounded-full bg-brand-900 text-[13px] font-extrabold text-white shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-gold-500)]">
            {initials(user.nom)}
          </span>
          <span className="hidden flex-col leading-tight md:flex">
            <span className="max-w-40 truncate text-sm font-bold">{user.nom}</span>
            <span className="text-xs text-muted">{role}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}

// ───────────────────────────── Layout ─────────────────────────────

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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

  // Large screens: the menu button folds the sidebar away. Small screens: it opens it.
  const onMenu = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) setCollapsed((c) => !c);
    else setMobileOpen(true);
  };

  return (
    <>
      <div className={clsx('min-h-screen bg-paper', !collapsed && 'lg:pl-[272px]', 'print:pl-0')}>
        {!collapsed && (
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] lg:block print:hidden">
            <Sidebar />
          </aside>
        )}

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-brand-950/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[284px] max-w-[85vw] shadow-pop">
              <button
                className="absolute right-3 top-5 z-10 grid size-9 place-items-center rounded-lg text-brand-200 hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="size-5" />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="print:hidden">
          <SessionBanner />
          <Topbar onMenu={onMenu} onSearch={() => setPaletteOpen(true)} />
        </div>
        <main className="px-4 py-6 md:px-7">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
