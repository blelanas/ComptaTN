import clsx from 'clsx';
import { FileUp } from 'lucide-react';
import { useMemo, useState, type ChangeEvent } from 'react';
import { Badge, Modal } from '@/components/ui';
import { parseCsv, planImport, type ImportStatus } from './accounts';
import { usePlanComptable } from './store';

const STATUS: Record<ImportStatus, { label: string; tone: 'success' | 'brand' | 'neutral' | 'danger' }> = {
  nouveau: { label: 'Nouveau', tone: 'success' },
  modifie: { label: 'Libellé modifié', tone: 'brand' },
  identique: { label: 'Déjà présent', tone: 'neutral' },
  erreur: { label: 'Erreur', tone: 'danger' },
};

export function ImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: (count: number) => void }) {
  const { accounts, importLines } = usePlanComptable();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const lines = useMemo(() => (text.trim() ? planImport(parseCsv(text), accounts) : []), [text, accounts]);
  const counts = useMemo(() => {
    const c: Record<ImportStatus, number> = { nouveau: 0, modifie: 0, identique: 0, erreur: 0 };
    lines.forEach((l) => c[l.status]++);
    return c;
  }, [lines]);
  const toApply = counts.nouveau + counts.modifie;

  const close = () => {
    setText('');
    setFileName(null);
    onClose();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
    e.target.value = '';
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Importer des comptes"
      description="Un compte par ligne : numéro puis libellé, séparés par « ; », une tabulation ou une virgule. Depuis Excel : Enregistrer sous → CSV. Les numéros de 4 à 7 chiffres sont complétés à 8 (4011 → 40110000)."
      footer={
        <>
          <button className="btn btn-secondary" onClick={close}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            disabled={toApply === 0}
            onClick={() => {
              importLines(lines);
              onImported(toApply);
              close();
            }}
          >
            {toApply > 0 ? `Importer ${toApply} compte${toApply > 1 ? 's' : ''}` : 'Importer'}
          </button>
        </>
      }
    >
      {lines.length === 0 ? (
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-paper px-6 py-8 text-center hover:border-brand-400">
            <FileUp className="size-7 text-brand-600" />
            <span className="text-sm font-semibold">Choisir un fichier CSV</span>
            <span className="text-xs text-muted">ou collez vos lignes ci-dessous</span>
            <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={onFile} />
          </label>
          <textarea
            className="input h-36 resize-y py-2 font-mono text-[13px]"
            placeholder={'40100001;Fournisseur Sahel Équipements\n41100001;Client Carthage Services\n53210001;Banque BIAT'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {fileName && <span className="mr-2 font-semibold">{fileName}</span>}
            {(Object.keys(STATUS) as ImportStatus[]).map((s) =>
              counts[s] > 0 ? (
                <Badge key={s} tone={STATUS[s].tone}>
                  {counts[s]} · {STATUS[s].label}
                </Badge>
              ) : null,
            )}
            <button className="ml-auto text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={() => { setText(''); setFileName(null); }}>
              Changer de fichier
            </button>
          </div>
          <div className="max-h-[45vh] overflow-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Ligne</th>
                  <th className="px-3 py-2">Numéro</th>
                  <th className="px-3 py-2">Libellé</th>
                  <th className="px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.line} className={clsx('border-t border-line', l.status === 'identique' && 'text-faint')}>
                    <td className="num px-3 py-2 text-faint">{l.line}</td>
                    <td className="num px-3 py-2 font-mono">{l.numero || '—'}</td>
                    <td className="px-3 py-2">
                      {l.libelle || '—'}
                      {l.message && <span className="block text-xs text-muted">{l.message}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {counts.erreur > 0 && <p className="text-xs text-muted">Les lignes en erreur seront ignorées.</p>}
        </div>
      )}
    </Modal>
  );
}
