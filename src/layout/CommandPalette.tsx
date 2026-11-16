import clsx from 'clsx';
import { CornerDownLeft, Hash, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { matchesQuery, normalize } from '@/features/plan-comptable/accounts';
import { usePlanComptable } from '@/features/plan-comptable/store';
import { NAV_ITEMS, type NavItem } from '@/lib/navigation';

type Result =
  | { kind: 'page'; item: NavItem }
  | { kind: 'account'; numero: string; libelle: string };

/** Ctrl/⌘+K: jump to any page or account without touching the mouse. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { accounts } = usePlanComptable();

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = normalize(query);
    const pages: Result[] = NAV_ITEMS.filter((i) => !q || normalize(i.label).includes(q)).map((item) => ({ kind: 'page', item }));
    const accountResults: Result[] = q
      ? accounts
          .filter((a) => matchesQuery(a, query))
          .slice(0, 8)
          .map((a) => ({ kind: 'account', numero: a.numero, libelle: a.libelle }))
      : [];
    return [...pages.slice(0, q ? 5 : 12), ...accountResults];
  }, [query, accounts]);

  useEffect(() => setActive(0), [query]);

  const select = (r: Result | undefined) => {
    if (!r) return;
    if (r.kind === 'page') navigate(r.item.path);
    else navigate(`/app/comptabilite/plan-comptable?q=${encodeURIComponent(r.numero)}`);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[55] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-pop" role="dialog" aria-label="Recherche rapide">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 text-faint" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                select(results[active]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Page, numéro ou libellé de compte…"
            className="h-14 flex-1 bg-transparent text-[15px] focus:outline-none"
          />
          <span className="kbd">Échap</span>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Aucun résultat</li>}
          {results.map((r, i) => (
            <li key={r.kind === 'page' ? r.item.path : r.numero}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => select(r)}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm',
                  i === active ? 'bg-brand-50 text-brand-800' : 'text-ink-soft',
                )}
              >
                {r.kind === 'page' ? (
                  <>
                    <r.item.icon className="size-4 text-faint" />
                    <span className="flex-1 font-medium">{r.item.label}</span>
                    <span className="text-xs text-faint">Page</span>
                  </>
                ) : (
                  <>
                    <Hash className="size-4 text-faint" />
                    <span className="num font-mono text-[13px] font-medium">{r.numero}</span>
                    <span className="flex-1 truncate">{r.libelle}</span>
                    <span className="text-xs text-faint">Compte</span>
                  </>
                )}
                {i === active && <CornerDownLeft className="size-3.5 text-faint" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
