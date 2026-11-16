import { CornerDownRight, Info } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Badge, Drawer } from '@/components/ui';
import { classLabel, findParent, validateLibelle, validateNewAccount, type AccountNode, type ValidationErrors } from './accounts';
import { usePlanComptable } from './store';

export type DrawerState =
  | { mode: 'create'; numero?: string }
  | { mode: 'edit'; numero: string }
  | null;

export function AccountDrawer({
  state,
  onClose,
  onSaved,
}: {
  state: DrawerState;
  onClose: () => void;
  onSaved: (numero: string, created: boolean) => void;
}) {
  const { accounts, tree, add, update } = usePlanComptable();
  const editing: AccountNode | undefined = state?.mode === 'edit' ? tree.get(state.numero) : undefined;

  const [numero, setNumero] = useState('');
  const [libelle, setLibelle] = useState('');
  const [actif, setActif] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState(false);
  const numeroRef = useRef<HTMLInputElement>(null);
  const libelleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;
    setNumero(state.mode === 'edit' ? state.numero : (state.numero ?? ''));
    setLibelle(editing?.libelle ?? '');
    setActif(editing?.actif ?? true);
    setErrors({});
    setTouched(false);
    // Number already known (edit, or suggested by "+") → start on the label.
    const target = state.mode === 'edit' || state.numero ? libelleRef : numeroRef;
    setTimeout(() => target.current?.focus(), 0);
    // Only reset the form when the drawer opens on a new target.
  }, [state]);

  // Live preview: where will this number land in the tree?
  const preview = useMemo(() => {
    const n = numero.trim();
    if (!/^[1-7]\d*$/.test(n)) return null;
    const numeros = new Set(accounts.map((a) => a.numero));
    numeros.delete(n);
    const parent = findParent(n, numeros);
    return { classe: n[0], parent: parent ? tree.get(parent) : undefined };
  }, [numero, accounts, tree]);

  const liveErrors: ValidationErrors =
    state?.mode === 'edit' ? { libelle: validateLibelle(libelle) } : validateNewAccount({ numero, libelle }, accounts);
  const shown = touched ? liveErrors : errors;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setErrors(liveErrors);
    if (liveErrors.numero || liveErrors.libelle) return;
    if (state?.mode === 'edit') {
      update(state.numero, { libelle, actif });
      onSaved(state.numero, false);
    } else {
      add({ numero, libelle });
      onSaved(numero.trim(), true);
    }
    onClose();
  };

  const isEdit = state?.mode === 'edit';

  return (
    <Drawer
      open={state !== null}
      onClose={onClose}
      title={isEdit ? `Modifier le compte ${state.numero}` : 'Nouveau compte'}
      description={isEdit ? undefined : 'Le type est déduit automatiquement : un compte qui a des sous-comptes devient un compte de regroupement.'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" form="account-form" className="btn btn-primary">
            {isEdit ? 'Enregistrer' : 'Créer le compte'}
          </button>
        </>
      }
    >
      <form id="account-form" onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <label className="label" htmlFor="numero">
            Numéro de compte
          </label>
          <input
            id="numero"
            ref={numeroRef}
            className="input num font-mono text-[15px] tracking-wide disabled:bg-paper disabled:text-muted"
            inputMode="numeric"
            autoComplete="off"
            placeholder="ex. 4011"
            value={numero}
            disabled={isEdit}
            onChange={(e) => setNumero(e.target.value.replace(/\s/g, ''))}
            aria-invalid={!!shown.numero}
          />
          {shown.numero ? (
            <p className="mt-1.5 text-sm text-danger-600">{shown.numero}</p>
          ) : isEdit ? (
            <p className="mt-1.5 text-xs text-muted">Le numéro d’un compte ne se modifie pas : créez un nouveau compte si besoin.</p>
          ) : null}

          {preview && (
            <div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                Classe {preview.classe} · {classLabel(preview.classe)}
              </p>
              {preview.parent ? (
                <p className="mt-1.5 flex items-center gap-2 text-ink-soft">
                  <CornerDownRight className="size-4 text-faint" />
                  Rattaché à <span className="num font-mono font-semibold">{preview.parent.numero}</span>
                  <span className="truncate">{preview.parent.libelle}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-ink-soft">Compte de premier niveau dans cette classe.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="libelle">
            Libellé
          </label>
          <input
            id="libelle"
            ref={libelleRef}
            className="input"
            placeholder="ex. Fournisseurs locaux"
            value={libelle}
            maxLength={120}
            onChange={(e) => setLibelle(e.target.value)}
            aria-invalid={!!shown.libelle}
          />
          {shown.libelle && <p className="mt-1.5 text-sm text-danger-600">{shown.libelle}</p>}
        </div>

        {isEdit && editing && (
          <>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-brand-600"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold">Compte actif</span>
                <span className="block text-sm text-muted">Un compte inactif reste dans l’historique mais n’est plus proposé à la saisie.</span>
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge tone={editing.isGroup ? 'neutral' : 'brand'}>{editing.isGroup ? 'Regroupement' : 'Imputable'}</Badge>
              {editing.lettrable && <Badge tone="clay">Compte de tiers · lettrable</Badge>}
              <Badge>{editing.origine === 'sce' ? 'Référentiel SCE' : 'Personnalisé'}</Badge>
            </div>
          </>
        )}

        {!isEdit && (
          <p className="flex gap-2 text-xs text-muted">
            <Info className="mt-px size-3.5 shrink-0" />
            Astuce : depuis le plan, le bouton « + » d’une ligne propose directement le prochain numéro libre.
          </p>
        )}
      </form>
    </Drawer>
  );
}
