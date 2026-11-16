import clsx from 'clsx';
import { CalendarDays, ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ToastProvider } from '@/components/ui';
import { CommandPalette } from '@/layout/CommandPalette';
import { useCompany } from '@/lib/company';
import { NAV_SECTIONS } from '@/lib/navigation';

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
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-clay-100 text-sm font-bold text-clay-700">DM</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Compte démo</p>
            <p className="truncate text-xs text-muted">Administrateur</p>
          </div>
          <Link to="/" className="btn btn-ghost h-8 w-8 px-0" title="Se déconnecter" aria-label="Se déconnecter">
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { company, setExercice } = useCompany();
  const years = [company.exercice + 1, company.exercice, company.exercice - 1, company.exercice - 2]
    .filter((y, i, arr) => arr.indexOf(y) === i)
    .sort((a, b) => b - a);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur md:px-8">
      <button className="btn btn-ghost h-9 w-9 px-0 lg:hidden" onClick={onMenu} aria-label="Ouvrir le menu">
        <Menu className="size-5" />
      </button>

      <button
        className="flex min-w-0 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-left shadow-card hover:border-line-strong"
        title="Changer de société (multi-sociétés bientôt)"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">
          {company.code}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold leading-tight">{company.raisonSociale}</span>
          <span className="block truncate text-[11px] text-muted">MF {company.matriculeFiscal}</span>
        </span>
        <ChevronDown className="size-4 text-faint" />
      </button>

      <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 shadow-card">
        <CalendarDays className="size-4 text-faint" />
        <span className="sr-only">Exercice</span>
        <select
          className="cursor-pointer bg-transparent text-sm font-semibold focus:outline-none"
          value={company.exercice}
          onChange={(e) => setExercice(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              Exercice {y}
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
    <ToastProvider>
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

        <Topbar onMenu={() => setMobileOpen(true)} onSearch={() => setPaletteOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </ToastProvider>
  );
}
