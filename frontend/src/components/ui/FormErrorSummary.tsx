import type { FieldErrors } from '../../utils/validation';

type Props = {
  errors: FieldErrors;
  title?: string;
};

export function FormErrorSummary({ errors, title = 'Revise os campos destacados' }: Props) {
  const items = Object.entries(errors).filter(([, message]) => Boolean(message));
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-red-800">
            {items.map(([field, message]) => <li key={field}>• {message}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
