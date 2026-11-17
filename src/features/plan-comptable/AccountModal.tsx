import { CornerDownRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from '@/components/ui';
import {
  classLabel,
  findParent,
  isGroupNumero,
  MOUVEMENT_LENGTH,
  validateLibelle,
  validateNewAccount,
  type ValidationErrors,
} from './accounts';
import { usePlanComptable } from './store';

export type AccountModalState = { mode: 'create'; numero?: string } | { mode: 'edit'; numero: string } | null;

/** Create or rename an account. Type, class and parent are shown live from the number. */
export function AccountModal({
  state,
  onClose,
  onSaved,
}: {
  state: AccountModalState;
  onClose: () => void;
  onSaved: (numero: string, created: boolean) => void;
}) {
  const { accounts, tree, add, update } = usePlanComptable();
  const [numero, setNumero] = useState('');
  const [libelle, setLibelle] = useState('');
  const [touched, setTouched] = useState(false);
  const numeroRef = useRef<HTMLInputElement>(null);
  const libelleRef = useRef<HTMLInputElement>(null);
  const isEdit = state?.mode === 'edit';

  useEffect(() => {
    if (!state) return;
    setNumero(state.mode === 'edit' ? state.numero : (state.numero ?? ''));
    setLibelle(state.mode === 'edit' ? (tree.get(state.numero)?.libelle ?? '') : '');
    setTouched(false);
    // Number already known (edit, or suggested) → start on the label.
    const target = state.mode === 'edit' || state.numero ? libelleRef : numeroRef;
    setTimeout(() => target.current?.focus(), 0);
    // Reset only when the dialog opens on a new target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const preview = useMemo(() => {
    const n = numero.trim();
    if (!/^[1-7]\d*$/.test(n)) return null;
    const numeros = new Set(accounts.map((a) => a.numero));
    numeros.delete(n);
    const parent = findParent(n, numeros);
    const type =
      n.length < 2
        ? null
        : isGroupNumero(n)
          ? 'Regroupement'
          : n.length === MOUVEMENT_LENGTH
            ? 'Mouvement'
            : `Mouvement : ${MOUVEMENT_LENGTH} chiffres attendus (${n.length}/${MOUVEMENT_LENGTH})`;
    return {
      classe: n[0],
      parent: parent ? tree.get(parent) : undefined,
      type,
      tiers: n.startsWith('40') || n.startsWith('41'),
    };
  }, [numero, accounts, tree]);

  const errors: ValidationErrors = isEdit
    ? { libelle: validateLibelle(libelle) }
    : validateNewAccount({ numero, libelle }, accounts);
  // Before the first submit, only show number errors once the number is complete enough to judge.
  const numeroError = touched || numero.length >= MOUVEMENT_LENGTH || /\D/.test(numero) ? errors.numero : undefined;
  const libelleError = touched ? errors.libelle : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (errors.numero || errors.libelle || !state) return;
    if (state.mode === 'edit') {
      update(state.numero, { libelle });
      onSaved(state.numero, false);
    } else {
      add({ numero, libelle });
      onSaved(numero.trim(), true);
    }
    onClose();
  };

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={isEdit ? `Modifier le compte ${state.numero}` : 'Nouveau compte'}
      description="Le type (mouvement ou regroupement) et la classe se déduisent du numéro."
      footer={
        <>
          <button type="button" className="btn btn-secondary h-10" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" form="account-form" className="btn btn-primary h-10 px-5">
            {isEdit ? 'Enregistrer' : 'Créer le compte'}
          </button>
        </>
      }
    >
      <form id="account-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-[170px_minmax(0,1fr)]">
          <div>
            <label className="label" htmlFor="numero">
              Numéro
            </label>
            <input
              id="numero"
              ref={numeroRef}
              className="input num h-[42px] rounded-[10px] font-mono text-[15px] tracking-wide disabled:bg-paper disabled:text-muted"
              inputMode="numeric"
              autoComplete="off"
              maxLength={MOUVEMENT_LENGTH}
              placeholder="40100000"
              value={numero}
              disabled={isEdit}
              onChange={(e) => setNumero(e.target.value.replace(/\s/g, ''))}
              aria-invalid={!!numeroError}
              aria-describedby="numero-help"
            />
          </div>
          <div>
            <label className="label" htmlFor="libelle">
              Libellé
            </label>
            <input
              id="libelle"
              ref={libelleRef}
              className="input h-[42px] rounded-[10px]"
              placeholder="Fournisseur Sahel Équipements"
              value={libelle}
              maxLength={120}
              onChange={(e) => setLibelle(e.target.value)}
              aria-invalid={!!libelleError}
            />
          </div>
        </div>

        <div id="numero-help" className="space-y-2 rounded-xl border border-line bg-paper px-3.5 py-3 text-[13px]">
          {preview ? (
            <>
              <p className="flex items-center gap-2 text-ink-soft">
                <CornerDownRight className="size-4 shrink-0 text-faint" />
                {preview.parent ? (
                  <span className="min-w-0 truncate">
                    Rattaché à <span className="num font-mono font-semibold">{preview.parent.numero}</span> · {preview.parent.libelle}
                  </span>
                ) : (
                  <span>Premier niveau de la classe {preview.classe}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="brand">
                  Classe {preview.classe} · {classLabel(preview.classe)}
                </Pill>
                {preview.type && <Pill tone="neutral">{preview.type}</Pill>}
                {preview.tiers && <Pill tone="gold">Tiers · lettrable</Pill>}
              </div>
            </>
          ) : (
            <p className="text-muted">
              Compte de mouvement : {MOUVEMENT_LENGTH} chiffres (ex. 40100186). Regroupement : 2 ou 3 chiffres (ex. 401).
            </p>
          )}
        </div>

        {isEdit && <p className="text-xs text-muted">Le numéro d’un compte ne se modifie pas : créez un nouveau compte si besoin.</p>}

        {(numeroError || libelleError) && (
          <p role="alert" className="rounded-[10px] bg-danger-50 px-3 py-2.5 text-[13px] font-medium text-danger-600">
            {numeroError ?? libelleError}
          </p>
        )}
      </form>
    </Modal>
  );
}

const PILL_TONES = {
  brand: 'bg-brand-50 text-brand-700',
  neutral: 'bg-ink/[0.06] text-ink-soft',
  gold: 'bg-gold-50 text-gold-700',
};

function Pill({ tone, children }: { tone: keyof typeof PILL_TONES; children: ReactNode }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL_TONES[tone]}`}>{children}</span>;
}
