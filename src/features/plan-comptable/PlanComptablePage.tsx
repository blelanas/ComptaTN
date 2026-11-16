import clsx from 'clsx';
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, ConfirmDialog, PageHeader, useToast } from '@/components/ui';
import { useCompany } from '@/lib/company';
import { ancestors, canDelete, matchesQuery, suggestChildNumero, toCsv, type AccountNode } from './accounts';
import { AccountDrawer, type DrawerState } from './AccountDrawer';
import { ImportDialog } from './ImportDialog';
import { ACCOUNT_CLASSES } from './sceReference';
import { usePlanComptable } from './store';

type View = 'arbre' | 'imputables';

export default function PlanComptablePage() {
  const { accounts, tree, remove, reset } = usePlanComptable();
  const { company } = useCompany();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [classe, setClasse] = useState<string | null>(null);
  const [view, setView] = useState<View>('arbre');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AccountNode | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Opened from the command palette with ?q=…
  useEffect(() => {
    const q = params.get('q');
    if (q !== null) {
      setQuery(q);
      params.delete('q');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const nodes = useMemo(() => [...tree.values()], [tree]);
  const stats = useMemo(
    () => ({
      total: nodes.length,
      imputables: nodes.filter((n) => !n.isGroup).length,
      inactifs: nodes.filter((n) => !n.actif).length,
      parClasse: Object.fromEntries(ACCOUNT_CLASSES.map((c) => [c.id, nodes.filter((n) => n.classe === c.id).length])),
    }),
    [nodes],
  );

  const searching = query.trim().length > 0;

  const rows = useMemo(() => {
    const inClass = (n: AccountNode) => !classe || n.classe === classe;
    if (searching) return nodes.filter((n) => inClass(n) && matchesQuery(n, query));
    if (view === 'imputables') return nodes.filter((n) => inClass(n) && !n.isGroup);
    return nodes.filter((n) => {
      if (!inClass(n)) return false;
      let parent = n.parent;
      while (parent) {
        if (!expanded.has(parent)) return false;
        parent = tree.get(parent)?.parent ?? null;
      }
      return true;
    });
  }, [nodes, tree, classe, searching, query, view, expanded]);

  const toggle = (numero: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(numero)) next.delete(numero);
      else next.add(numero);
      return next;
    });

  const expandAll = () => setExpanded(new Set(nodes.filter((n) => n.isGroup).map((n) => n.numero)));
  const collapseAll = () => setExpanded(new Set());

  const reveal = (numero: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      let parent = tree.get(numero)?.parent ?? findParentFromAccounts(numero);
      while (parent) {
        next.add(parent);
        parent = tree.get(parent)?.parent ?? null;
      }
      return next;
    });
    setFlash(numero);
    setTimeout(() => document.getElementById(`acc-${numero}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    setTimeout(() => setFlash((f) => (f === numero ? null : f)), 2200);
  };

  function findParentFromAccounts(numero: string): string | null {
    for (let len = numero.length - 1; len >= 1; len--) {
      if (tree.has(numero.slice(0, len))) return numero.slice(0, len);
    }
    return null;
  }

  const exportCsv = () => {
    const blob = new Blob([toCsv(accounts)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-comptable-${company.code}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Plan comptable exporté (CSV, compatible Excel)');
  };

  return (
    <div>
      <PageHeader
        title="Plan comptable"
        description={
          <>
            Référentiel SCE tunisien · <span className="num">{stats.total}</span> comptes dont{' '}
            <span className="num">{stats.imputables}</span> imputables
            {stats.inactifs > 0 && (
              <>
                {' '}
                · <span className="num">{stats.inactifs}</span> inactif{stats.inactifs > 1 ? 's' : ''}
              </>
            )}
          </>
        }
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" /> Importer
            </button>
            <button className="btn btn-secondary" onClick={exportCsv}>
              <Download className="size-4" /> Exporter
            </button>
            <div className="relative">
              <button className="btn btn-secondary w-9 px-0" onClick={() => setMenuOpen((o) => !o)} aria-label="Plus d’actions">
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-line bg-surface p-1 shadow-pop">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-paper"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmReset(true);
                      }}
                    >
                      <RotateCcw className="size-4 text-muted" /> Réinitialiser au référentiel SCE
                    </button>
                  </div>
                </>
              )}
            </div>
            <button className="btn btn-primary" onClick={() => setDrawer({ mode: 'create' })}>
              <Plus className="size-4" /> Nouveau compte
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-60 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                ref={searchRef}
                className="input pl-9 pr-9"
                placeholder="Rechercher par numéro (ex. 436) ou libellé (ex. TVA)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-faint hover:text-ink"
                  onClick={() => {
                    setQuery('');
                    searchRef.current?.focus();
                  }}
                  aria-label="Effacer la recherche"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex rounded-lg border border-line-strong bg-paper p-0.5 text-sm font-semibold" role="tablist">
              {(
                [
                  ['arbre', 'Arborescence'],
                  ['imputables', 'Comptes imputables'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={clsx('rounded-md px-3 py-1.5', view === v ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}
                >
                  {label}
                </button>
              ))}
            </div>
            {view === 'arbre' && !searching && (
              <div className="flex gap-1">
                <button className="btn btn-ghost h-9 px-2.5 text-[13px]" onClick={expandAll} title="Tout déplier">
                  <ChevronsUpDown className="size-4" /> <span className="hidden xl:inline">Tout déplier</span>
                </button>
                <button className="btn btn-ghost h-9 px-2.5 text-[13px]" onClick={collapseAll} title="Tout replier">
                  <ChevronsDownUp className="size-4" /> <span className="hidden xl:inline">Tout replier</span>
                </button>
              </div>
            )}
          </div>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            <ClassChip active={classe === null} onClick={() => setClasse(null)} label="Toutes les classes" count={stats.total} />
            {ACCOUNT_CLASSES.map((c) => (
              <ClassChip
                key={c.id}
                active={classe === c.id}
                onClick={() => setClasse(classe === c.id ? null : c.id)}
                label={`${c.id} · ${c.short}`}
                title={c.label}
                count={stats.parClasse[c.id]}
              />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="w-44 px-4 py-2.5">Numéro</th>
                <th className="px-4 py-2.5">Libellé</th>
                <th className="w-36 px-4 py-2.5">Nature</th>
                <th className="w-32 px-4 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <p className="font-semibold">Aucun compte ne correspond.</p>
                    <p className="mt-1 text-sm text-muted">
                      Essayez un autre numéro ou libellé
                      {/^[1-7]\d+$/.test(query.trim()) && !tree.has(query.trim()) && (
                        <>
                          , ou{' '}
                          <button
                            className="font-semibold text-brand-600 hover:underline"
                            onClick={() => setDrawer({ mode: 'create', numero: query.trim() })}
                          >
                            créez le compte {query.trim()}
                          </button>
                        </>
                      )}
                      .
                    </p>
                  </td>
                </tr>
              )}
              {rows.map((node, i) => {
                const showClassHeader = !searching && view === 'arbre' && (i === 0 || rows[i - 1].classe !== node.classe);
                return (
                  <FragmentRow
                    key={node.numero}
                    node={node}
                    classHeader={showClassHeader ? node.classe : null}
                    classCount={stats.parClasse[node.classe]}
                    mode={searching ? 'search' : view}
                    path={searching ? ancestors(node.numero, tree) : []}
                    expanded={expanded.has(node.numero)}
                    flash={flash === node.numero}
                    onToggle={() => toggle(node.numero)}
                    onAddChild={() => setDrawer({ mode: 'create', numero: suggestChildNumero(node.numero, accounts) })}
                    onEdit={() => setDrawer({ mode: 'edit', numero: node.numero })}
                    onDelete={() => {
                      const check = canDelete(node.numero, tree);
                      if (!check.ok) toast(check.reason!, 'danger');
                      else setConfirmDelete(node);
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-3 text-xs text-muted">
          {searching
            ? `${rows.length} résultat${rows.length > 1 ? 's' : ''}`
            : view === 'imputables'
              ? `${rows.length} comptes imputables`
              : 'Cliquez sur un compte de regroupement pour afficher ses sous-comptes.'}
        </div>
      </div>

      <AccountDrawer
        state={drawer}
        onClose={() => setDrawer(null)}
        onSaved={(numero, created) => {
          toast(created ? `Compte ${numero} créé` : `Compte ${numero} enregistré`);
          if (created) {
            setQuery('');
            reveal(numero);
          }
        }}
      />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={(n) => toast(`${n} compte${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}`)} />
      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          remove(confirmDelete.numero);
          toast(`Compte ${confirmDelete.numero} supprimé`);
        }}
        title={`Supprimer le compte ${confirmDelete?.numero ?? ''} ?`}
        message={
          <>
            « {confirmDelete?.libelle} » sera retiré du plan comptable. Pour garder l’historique, vous pouvez plutôt le désactiver
            depuis « Modifier ».
          </>
        }
        confirmLabel="Supprimer"
        danger
      />
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          collapseAll();
          toast('Plan comptable réinitialisé au référentiel SCE');
        }}
        title="Réinitialiser le plan comptable ?"
        message="Vos comptes personnalisés et vos modifications de libellés seront perdus. Le plan revient au référentiel SCE d’origine."
        confirmLabel="Réinitialiser"
        danger
      />
    </div>
  );
}

function ClassChip({ active, onClick, label, count, title }: { active: boolean; onClick: () => void; label: string; count: number; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors',
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong bg-surface text-ink-soft hover:border-brand-300',
      )}
    >
      {label}
      <span className={clsx('num text-[11px]', active ? 'text-white/75' : 'text-faint')}>{count}</span>
    </button>
  );
}

function FragmentRow({
  node,
  classHeader,
  classCount,
  mode,
  path,
  expanded,
  flash,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: AccountNode;
  classHeader: string | null;
  classCount: number;
  mode: View | 'search';
  path: AccountNode[];
  expanded: boolean;
  flash: boolean;
  onToggle: () => void;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const indent = mode === 'arbre' ? node.depth * 22 : 0;
  const isRoot = node.depth === 0;
  const classInfo = ACCOUNT_CLASSES.find((c) => c.id === classHeader);

  return (
    <>
      {classInfo && (
        <tr className="border-t border-line bg-paper">
          <td colSpan={4} className="px-4 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-clay-600">Classe {classInfo.id}</span>
            <span className="ml-2 text-[13px] font-semibold text-ink-soft">{classInfo.label}</span>
            <span className="num ml-2 text-xs text-faint">{classCount} comptes</span>
          </td>
        </tr>
      )}
      <tr
        id={`acc-${node.numero}`}
        className={clsx(
          'group border-t border-line transition-colors',
          flash ? 'bg-clay-50' : 'hover:bg-brand-50/40',
          !node.actif && 'text-faint',
        )}
      >
        <td className="px-4 py-2">
          <div className="flex items-center" style={{ paddingLeft: indent }}>
            {mode === 'arbre' && (
              <span className="mr-1 inline-flex w-5 justify-center">
                {node.isGroup && (
                  <button
                    onClick={onToggle}
                    className="grid size-5 place-items-center rounded text-faint hover:bg-ink/5 hover:text-ink"
                    aria-label={expanded ? `Replier ${node.numero}` : `Déplier ${node.numero}`}
                    aria-expanded={expanded}
                  >
                    <ChevronRight className={clsx('size-4 transition-transform', expanded && 'rotate-90')} />
                  </button>
                )}
              </span>
            )}
            <span className={clsx('num font-mono text-[13px]', isRoot || node.isGroup ? 'font-semibold' : 'text-ink-soft')}>
              {node.numero}
            </span>
          </div>
        </td>
        <td className="px-4 py-2">
          <button
            className={clsx('text-left', node.isGroup && mode === 'arbre' ? 'cursor-pointer' : 'cursor-default', (isRoot || node.isGroup) && 'font-semibold')}
            onClick={node.isGroup && mode === 'arbre' ? onToggle : undefined}
            tabIndex={-1}
          >
            {node.libelle}
          </button>
          <span className="ml-2 inline-flex gap-1 align-middle">
            {node.lettrable && !node.isGroup && <Badge tone="clay">Tiers</Badge>}
            {!node.actif && <Badge tone="warning">Inactif</Badge>}
            {node.origine === 'perso' && <Badge tone="brand">Personnalisé</Badge>}
          </span>
          {path.length > 0 && (
            <span className="mt-0.5 block truncate text-xs text-faint">
              {path.map((p) => `${p.numero} ${p.libelle}`).join(' › ')}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          <span className={clsx('text-xs font-medium', node.isGroup ? 'text-muted' : 'text-success-600')}>
            {node.isGroup ? 'Regroupement' : 'Imputable'}
          </span>
        </td>
        <td className="px-4 py-1.5">
          <div className="flex justify-end gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <IconButton label={`Ajouter un sous-compte à ${node.numero}`} onClick={onAddChild}>
              <Plus className="size-4" />
            </IconButton>
            <IconButton label={`Modifier ${node.numero}`} onClick={onEdit}>
              <Pencil className="size-4" />
            </IconButton>
            <IconButton label={`Supprimer ${node.numero}`} onClick={onDelete} danger>
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        </td>
      </tr>
    </>
  );
}

function IconButton({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={clsx(
        'grid size-8 place-items-center rounded-lg text-muted',
        danger ? 'hover:bg-danger-50 hover:text-danger-600' : 'hover:bg-ink/5 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
