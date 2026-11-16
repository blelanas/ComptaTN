import { ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Spinner } from '@/components/FullPageLoader';
import { useCompanies } from '@/lib/company';
import { errorMessage } from '@/lib/errors';
import { CompanyFields, ExerciceFields } from './CompanyForm';
import {
  cleanCompanyInfo,
  EMPTY_COMPANY_INFO,
  exerciceCalendaire,
  makeExercice,
  validateCompanyInfo,
  validateExercice,
  type Company,
  type CompanyErrors,
} from './model';

/** Creates a company with its first exercice. The SCE chart of accounts comes with it. */
export function NewCompanyForm({
  onCreated,
  onCancel,
  autoFocus = false,
}: {
  onCreated: (company: Company) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const { createCompany } = useCompanies();
  const [info, setInfo] = useState(EMPTY_COMPANY_INFO);
  const [dates, setDates] = useState(() => {
    const e = exerciceCalendaire(new Date().getFullYear());
    return { debut: e.debut, fin: e.fin };
  });
  const [errors, setErrors] = useState<CompanyErrors>({});
  const [dateError, setDateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateCompanyInfo(info);
    const nextDateError = validateExercice(dates.debut, dates.fin, []);
    setErrors(nextErrors);
    setDateError(nextDateError);
    if (Object.keys(nextErrors).length > 0 || nextDateError) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const company = await createCompany(cleanCompanyInfo(info), makeExercice(dates.debut, dates.fin));
      onCreated(company);
    } catch (err) {
      setSubmitError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <CompanyFields value={info} onChange={setInfo} errors={errors} autoFocus={autoFocus} />
      <ExerciceFields debut={dates.debut} fin={dates.fin} onChange={setDates} error={dateError} />
      {submitError && <p className="rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{submitError}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy && <Spinner />}
          Créer la société
          {!busy && <ArrowRight className="size-4" />}
        </button>
      </div>
    </form>
  );
}
