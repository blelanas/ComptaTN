import clsx from 'clsx';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { formatDate, type CompanyErrors, type CompanyInfo } from './model';

/** The company fields. Only the raison sociale is required. */
export function CompanyFields({
  value,
  onChange,
  errors,
  autoFocus = false,
}: {
  value: CompanyInfo;
  onChange: (next: CompanyInfo) => void;
  errors: CompanyErrors;
  autoFocus?: boolean;
}) {
  const field = (key: keyof CompanyInfo) => ({
    id: `societe-${key}`,
    value: value[key],
    onChange: (e: { target: { value: string } }) => onChange({ ...value, [key]: e.target.value }),
    className: clsx('input', errors[key] && 'border-danger-600 focus:ring-danger-600/20'),
    'aria-invalid': errors[key] ? true : undefined,
  });
  const error = (key: keyof CompanyInfo) =>
    errors[key] ? <p className="mt-1.5 text-xs font-medium text-danger-600">{errors[key]}</p> : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="societe-raisonSociale">
          Raison sociale
        </label>
        <input {...field('raisonSociale')} placeholder="Atlas Conseil SARL" autoFocus={autoFocus} />
        {error('raisonSociale')}
      </div>
      <div>
        <label className="label" htmlFor="societe-matriculeFiscal">
          Matricule fiscal <span className="font-normal text-faint">(facultatif)</span>
        </label>
        <input {...field('matriculeFiscal')} placeholder="1234567A/A/M/000" className={clsx(field('matriculeFiscal').className, 'font-mono')} />
        {error('matriculeFiscal')}
      </div>
      <div>
        <label className="label" htmlFor="societe-activite">
          Activité <span className="font-normal text-faint">(facultatif)</span>
        </label>
        <input {...field('activite')} placeholder="Conseil, commerce, BTP…" />
        {error('activite')}
      </div>
      <div>
        <label className="label" htmlFor="societe-adresse">
          Adresse <span className="font-normal text-faint">(facultatif)</span>
        </label>
        <input {...field('adresse')} placeholder="12 rue de Marseille" />
        {error('adresse')}
      </div>
      <div>
        <label className="label" htmlFor="societe-ville">
          Ville <span className="font-normal text-faint">(facultatif)</span>
        </label>
        <input {...field('ville')} placeholder="Tunis" />
        {error('ville')}
      </div>
    </div>
  );
}

/** Start and end dates of an exercice. Collapsed to a one-line summary until the user wants other dates. */
export function ExerciceFields({
  debut,
  fin,
  onChange,
  error,
  collapsible = true,
}: {
  debut: string;
  fin: string;
  onChange: (next: { debut: string; fin: string }) => void;
  error: string | null;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible || !!error);
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
        <CalendarDays className="size-4 text-faint" />
        <span>
          Premier exercice : <strong>{fin.slice(0, 4)}</strong>, du {formatDate(debut)} au {formatDate(fin)}
        </span>
        <button type="button" className="ml-auto text-xs font-semibold text-brand-600 hover:underline" onClick={() => setOpen(true)}>
          Autres dates
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="exercice-debut">
            Début de l’exercice
          </label>
          <input id="exercice-debut" type="date" className="input" value={debut} onChange={(e) => onChange({ debut: e.target.value, fin })} />
        </div>
        <div>
          <label className="label" htmlFor="exercice-fin">
            Fin de l’exercice
          </label>
          <input id="exercice-fin" type="date" className="input" value={fin} onChange={(e) => onChange({ debut, fin: e.target.value })} />
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">L’exercice porte le nom de l’année de clôture.</p>
      )}
    </div>
  );
}
