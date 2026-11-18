import clsx from 'clsx';
import {
  BookOpen,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  CloudOff,
  Download,
  Pencil,
  Plus,
  Power,
  Printer,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog, useToast } from '@/components/ui';
import { useCompany } from '@/lib/company';
import { canDelete, matchesQuery, suggestChildNumero, toCsv, validateNumero, type AccountNode } from './accounts';
import { AccountModal, type AccountModalState } from './AccountModal';
import { ImportDialog } from './ImportDialog';
import { usePlanComptable } from './store';

/** Class filter of the right panel. Sub-filters give one-click access to the busiest groups. */
const FILTERS = [
  { id: 'all', label: 'Toutes les classes', prefix: '', sub: false },
  { id: '1', label: '1 · Capitaux propres', prefix: '1', sub: false },
  { id: '2', label: '2 · Immobilisations', prefix: '2', sub: false },
  { id: '3', label: '3 · Stocks', prefix: '3', sub: false },
  { id: '4', label: '4 · Tiers', prefix: '4', sub: false },
  { id: '40', label: 'Fournisseurs (40)', prefix: '40', sub: true },
  { id: '41', label: 'Clients (41)', prefix: '41', sub: true },
  { id: '43', label: 'État, TVA, retenues (43)', prefix: '43', sub: true },
  { id: '5', label: '5 · Financiers', prefix: '5', sub: false },
  { id: '6', label: '6 · Charges', prefix: '6', sub: false },
  { id: '7', label: '7 · Produits', prefix: '7', sub: false },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

const PANEL_KEY = 'raqib.plan-comptable.panneau';

function readPanelPref(): boolean {
  try {
    return localStorage.getItem(PANEL_KEY) !== 'masque';
  } catch {
    return true;
  }
}

function writePanelPref(open: boolean) {
  try {
    localStorage.setItem(PANEL_KEY, open ? 'visible' : 'masque');
  } catch {
    // Storage blocked: the choice lasts until the page is reloaded.
  }
}

export default function PlanComptablePage() {
  const { status, loadError, retry } = usePlanComptable();
  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6" aria-busy="true">
        <p className="mb-5 text-xl font-extrabold">Plan comptable</p>
        <div className="space-y-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-ink/[0.06]" style={{ width: `${92 - (i % 4) * 12}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-10 text-center">
        <CloudOff className="size-8 text-danger-600" />
        <p className="font-semibold">Impossible de charger le plan comptable</p>
        <p className="text-sm text-muted">{loadError}</p>
        <button className="btn btn-primary mt-2" onClick={retry}>
          Réessayer
        </button>
      </div>
    );
  }
  return <PlanComptableView />;
}

/** Background-save status, in the table footer. */
function SaveIndicator() {
  const { saveStatus, saveError, retry } = usePlanComptable();
  if (saveStatus === 'saving') {
    return (
      <span className="inline-flex items-center gap-1">
        <Cloud className="size-3.5 animate-pulse" /> Enregistrement…
      </span>
    );
  }
  if (saveStatus === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 text-success-600">
        <Check className="size-3.5" /> Enregistré
      </span>
    );
  }
  if (saveStatus === 'error') {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-danger-600" title={saveError ?? undefined}>
        <CloudOff className="size-3.5" /> Non enregistré.{' '}
        <button className="underline underline-offset-2" onClick={retry}>
          Réessayer
        </button>
      </span>
    );
  }
  return null;
}

function PlanComptableView() {
  const { accounts, tree, remove, update, reset } = usePlanComptable();
  const { company } = useCompany();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [filter, setFilter] = useState<FilterId>('all');
  const [showGroups, setShowGroups] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(readPanelPref);
  const [modal, setModal] = useState<AccountModalState>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AccountNode | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
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
  const prefix = FILTERS.find((f) => f.id === filter)!.prefix;
  const q = query.trim();

  const rows = useMemo(
    () => nodes.filter((n) => n.numero.startsWith(prefix) && (showGroups || !n.isGroup) && matchesQuery(n, q)),
    [nodes, prefix, showGroups, q],
  );

  const stats = useMemo(
    () => ({
      mouvements: nodes.filter((n) => !n.isGroup).length,
      groupes: nodes.filter((n) => n.isGroup).length,
      fermes: nodes.filter((n) => !n.actif).length,
    }),
    [nodes],
  );

  const countFor = (p: string) => nodes.filter((n) => n.numero.startsWith(p) && (showGroups || !n.isGroup)).length;

  const current = selected ? tree.get(selected) : undefined;
  // "Nouveau compte" proposes the next free number in the selected group (401 → 401xxxxx)
  // or in the family of the selected account (40100000 → 40100001).
  const suggestPrefix = current ? (current.isGroup ? current.numero : current.numero.slice(0, 3)) : null;
  const deleteCheck = current ? canDelete(current.numero, tree) : null;

  const select = (numero: string) => setSelected((s) => (s === numero ? null : numero));

  const openCreate = (numero?: string) => setModal({ mode: 'create', numero });
  const openCreateInGroup = () => openCreate(suggestPrefix ? suggestChildNumero(suggestPrefix, accounts) : undefined);

  const reveal = (numero: string) => {
    setSelected(numero);
    setTimeout(() => document.getElementById(`acc-${numero}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(accounts)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-comptable-${company.code}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Plan comptable exporté (CSV, s’ouvre dans Excel)');
  };

  const togglePanel = (open: boolean) => {
    setPanelOpen(open);
    writePanelPref(open);
  };

  const queryIsNewNumero = /^\d+$/.test(q) && !validateNumero(q, new Set(accounts.map((a) => a.numero)));

  return (
    <div className="flex flex-wrap items-start gap-5">
      {/* ───────────── Table ───────────── */}
      <section className="flex min-w-0 flex-[999_1_600px] flex-col overflow-hidden rounded-2xl border border-line bg-surface print:border-0">
        <div className="flex flex-wrap items-center gap-3.5 border-b border-line px-[18px] py-4">
          <div className="mr-1.5">
            <h1 className="text-xl font-extrabold tracking-tight">Plan comptable</h1>
            <p className="text-[12.5px] text-muted">
              Référentiel SCE tunisien · comptes à 8 chiffres
              <span className="hidden print:inline"> · {company.raisonSociale}</span>
            </p>
          </div>
          <label className="flex h-10 max-w-[380px] flex-[1_1_240px] items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-100 print:hidden">
            <Search className="size-4 shrink-0 text-muted" />
            <span className="sr-only">Rechercher un compte</span>
            <input
              ref={searchRef}
              type="search"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
              placeholder="Numéro ou libellé"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="grid size-6 place-items-center rounded text-muted hover:text-ink"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                aria-label="Effacer la recherche"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
          <button
            role="switch"
            aria-checked={showGroups}
            onClick={() => setShowGroups((s) => !s)}
            className="flex items-center gap-2.5 px-1 py-1.5 text-sm font-medium text-ink-soft print:hidden"
          >
            <span className={clsx('relative h-[22px] w-[38px] rounded-full transition-colors', showGroups ? 'bg-brand-900' : 'bg-line-strong')}>
              <span
                className={clsx(
                  'absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-[left]',
                  showGroups ? 'left-[19px]' : 'left-[3px]',
                )}
              />
            </span>
            Afficher les regroupements
          </button>
          {!panelOpen && (
            <button className="btn btn-secondary ml-auto h-[38px] rounded-[10px] print:hidden" onClick={() => togglePanel(true)}>
              Actions <ChevronsLeft className="size-4" />
            </button>
          )}
        </div>

        <div className="max-h-[calc(100vh-232px)] min-h-80 overflow-auto print:max-h-none print:overflow-visible">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {['Numéro', 'Libellé', 'Type', 'Options'].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      'sticky top-0 z-[1] whitespace-nowrap border-b border-line bg-[#F7F9FC] px-4 py-[11px] text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted',
                      h === 'Options' && 'hidden sm:table-cell',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((node) => (
                <AccountRow
                  key={node.numero}
                  node={node}
                  indent={showGroups && !q}
                  selected={node.numero === selected}
                  onSelect={() => select(node.numero)}
                  onEdit={() => setModal({ mode: 'edit', numero: node.numero })}
                />
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
              <p className="text-[15px] font-bold">{q ? `Aucun compte ne correspond à « ${q} »` : 'Aucun compte dans cette classe'}</p>
              <p className="text-sm text-muted">
                {q ? 'Vérifiez le numéro ou cherchez par libellé.' : 'Créez-en un depuis le panneau Actions.'}
              </p>
              {queryIsNewNumero && (
                <button className="btn btn-primary mt-1.5 h-10 rounded-[10px]" onClick={() => openCreate(q)}>
                  <Plus className="size-4" /> Créer le compte {q}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t border-line bg-[#FBFCFE] px-[18px] py-3 text-[12.5px] text-muted print:hidden">
          <span>
            <span className="num">{rows.length}</span> compte{rows.length > 1 ? 's' : ''} affiché{rows.length > 1 ? 's' : ''}
            {!showGroups && ' · regroupements masqués'}
            <span className="ml-3">
              <SaveIndicator />
            </span>
          </span>
          <span>
            {current
              ? `Sélection : ${current.numero} · ${current.libelle}`
              : 'Cliquez sur une ligne pour la sélectionner, double-cliquez pour la modifier.'}
          </span>
        </div>
      </section>

      {/* ───────────── Actions panel ───────────── */}
      {panelOpen && (
        <aside className="flex max-w-full flex-[1_1_290px] flex-col gap-[18px] rounded-2xl border border-line bg-surface p-4 print:hidden">
          <div className="flex items-center justify-between">
            <PanelTitle>Actions</PanelTitle>
            <button className="btn btn-secondary h-8 rounded-lg px-2.5 text-[13px]" onClick={() => togglePanel(false)}>
              Masquer <ChevronsRight className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="btn btn-primary h-11 rounded-[11px] font-bold shadow-[0_6px_16px_-8px_rgb(11_31_68/0.8)]"
              onClick={openCreateInGroup}
              title={suggestPrefix ? `Propose le prochain numéro libre commençant par ${suggestPrefix}` : undefined}
            >
              <Plus className="size-[18px]" strokeWidth={2.4} />
              {suggestPrefix ? `Nouveau compte ${suggestPrefix}…` : 'Nouveau compte'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={Pencil} disabled={!current} onClick={() => current && setModal({ mode: 'edit', numero: current.numero })}>
                Modifier
              </ActionButton>
              <ActionButton
                icon={Trash2}
                danger
                disabled={!current || !deleteCheck?.ok}
                title={deleteCheck && !deleteCheck.ok ? deleteCheck.reason : undefined}
                onClick={() => current && setConfirmDelete(current)}
              >
                Supprimer
              </ActionButton>
            </div>
            <ActionButton
              icon={Power}
              align="left"
              disabled={!current || current.isGroup}
              title={current?.isGroup ? 'Seuls les comptes de mouvement se ferment.' : undefined}
              onClick={() => {
                if (!current) return;
                update(current.numero, { actif: !current.actif });
                toast(current.actif ? `Compte ${current.numero} fermé` : `Compte ${current.numero} rouvert`);
              }}
            >
              {current && !current.actif ? 'Rouvrir le compte' : 'Fermer le compte'}
            </ActionButton>
            {current && deleteCheck && !deleteCheck.ok && <p className="text-xs text-muted">{deleteCheck.reason}</p>}

            <div className="my-0.5 h-px bg-line" />
            <ActionButton
              icon={BookOpen}
              align="left"
              title="Remettre le plan au référentiel SCE d’origine"
              onClick={() => setConfirmReset(true)}
            >
              Plan de référence SCE
            </ActionButton>
            <ActionButton icon={Upload} align="left" onClick={() => setImportOpen(true)}>
              <span className="flex-1 whitespace-nowrap text-left">Importer mon plan</span>
              <span className="whitespace-nowrap rounded-md bg-gold-50 px-1.5 py-0.5 text-[11px] font-bold text-gold-700">CSV · Excel</span>
            </ActionButton>
            <ActionButton icon={Download} align="left" onClick={exportCsv}>
              Exporter (Excel)
            </ActionButton>
            <ActionButton icon={Printer} align="left" onClick={() => window.print()}>
              Imprimer le plan
            </ActionButton>
          </div>

          <div>
            <PanelTitle className="mb-1.5">Plan</PanelTitle>
            <Stat label="Comptes de mouvement" value={stats.mouvements} />
            <Stat label="Regroupements" value={stats.groupes} />
            <Stat label="Fermés" value={stats.fermes} />
            <Stat label="Affichés" value={rows.length} highlight />
          </div>

          <div className="flex flex-col gap-0.5">
            <PanelTitle className="mb-1.5">Classes</PanelTitle>
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  aria-pressed={active}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-lg py-[7px] pr-2 text-left text-sm transition-colors',
                    f.sub ? 'pl-9' : 'pl-2',
                    active ? 'bg-brand-50' : 'hover:bg-paper',
                  )}
                >
                  <span
                    className={clsx(
                      'grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px]',
                      active ? 'border-brand-900 bg-brand-900' : 'border-line-strong bg-surface',
                    )}
                  >
                    {active && <Check className="size-[11px] text-white" strokeWidth={3.4} />}
                  </span>
                  <span className={clsx('flex-1', active ? 'font-bold' : f.sub ? 'text-ink-soft' : 'font-medium')}>{f.label}</span>
                  <span className="num text-xs text-muted">{countFor(f.prefix)}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      <AccountModal
        state={modal}
        onClose={() => setModal(null)}
        onSaved={(numero, created) => {
          toast(created ? `Compte ${numero} créé` : `Compte ${numero} enregistré`);
          if (created) {
            setQuery('');
            if (numero.length <= 3) setShowGroups(true);
            if (!numero.startsWith(prefix)) setFilter('all');
            reveal(numero);
          }
        }}
      />
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(n) => toast(`${n} compte${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}`)}
      />
      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          remove(confirmDelete.numero);
          setSelected(null);
          toast(`Compte ${confirmDelete.numero} supprimé`);
        }}
        title={`Supprimer le compte ${confirmDelete?.numero ?? ''} ?`}
        message={<>« {confirmDelete?.libelle} » sera retiré du plan comptable. Pour le garder dans l’historique, fermez-le plutôt.</>}
        confirmLabel="Supprimer"
        danger
      />
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          setSelected(null);
          toast('Plan comptable remis au référentiel SCE');
        }}
        title="Revenir au plan de référence SCE ?"
        message="Vos comptes personnalisés et vos modifications de libellés seront perdus. Le plan revient au référentiel SCE d’origine."
        confirmLabel="Revenir au référentiel"
        danger
      />
    </div>
  );
}

function AccountRow({
  node,
  indent,
  selected,
  onSelect,
  onEdit,
}: {
  node: AccountNode;
  indent: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const cell = clsx('border-b border-[#EEF1F6] px-4 py-2.5 transition-colors', selected ? 'bg-brand-50' : 'group-hover:bg-[#F5F8FE]');
  return (
    <tr id={`acc-${node.numero}`} className="group cursor-pointer" onClick={onSelect} onDoubleClick={onEdit} aria-selected={selected}>
      <td
        className={clsx(cell, 'whitespace-nowrap', selected && 'shadow-[inset_3px_0_0_var(--color-gold-500)]')}
        style={indent ? { paddingLeft: 16 + node.depth * 18 } : undefined}
      >
        <button
          className={clsx('num font-mono text-[13px] tracking-[0.01em]', node.isGroup ? 'font-bold' : 'font-medium')}
          aria-pressed={selected}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {node.numero}
        </button>
      </td>
      <td className={clsx(cell, node.isGroup && 'font-bold', !node.actif && 'text-faint')}>{node.libelle}</td>
      <td className={clsx(cell, 'whitespace-nowrap')}>
        {node.isGroup ? (
          <span className="inline-flex rounded-full bg-ink/[0.06] px-2.5 py-[3px] text-xs font-semibold text-ink-soft">Regroupement</span>
        ) : (
          <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-[3px] text-xs font-semibold text-brand-700">Mouvement</span>
        )}
      </td>
      <td className={clsx(cell, 'hidden sm:table-cell')}>
        <div className="flex flex-wrap gap-1.5">
          {node.lettrable && !node.isGroup && <Tag tone="gold">Tiers · lettrable</Tag>}
          {node.origine === 'perso' && <Tag tone="success">Personnalisé</Tag>}
          {!node.actif && <Tag tone="danger">Fermé</Tag>}
        </div>
      </td>
    </tr>
  );
}

const TAG_TONES = {
  gold: 'bg-gold-50 text-gold-700',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
};

function Tag({ tone, children }: { tone: keyof typeof TAG_TONES; children: ReactNode }) {
  return <span className={clsx('whitespace-nowrap rounded-md px-2 py-[3px] text-[11.5px] font-semibold', TAG_TONES[tone])}>{children}</span>;
}

function PanelTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx('text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-muted', className)}>{children}</p>;
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-[5px] text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={clsx('num font-bold', highlight && 'text-brand-600')}>{value}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
  onClick,
  disabled,
  danger,
  title,
  align = 'center',
}: {
  icon: typeof Plus;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
  align?: 'center' | 'left';
}) {
  return (
    <button
      className={clsx(
        'flex h-10 items-center gap-2.5 rounded-[10px] border bg-surface px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        align === 'center' ? 'justify-center' : 'justify-start text-left',
        danger
          ? 'border-danger-600/30 text-danger-600 enabled:hover:bg-danger-50'
          : 'border-line-strong text-ink enabled:hover:border-brand-200 enabled:hover:bg-[#F7F9FC]',
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.8} />
      {children}
    </button>
  );
}
