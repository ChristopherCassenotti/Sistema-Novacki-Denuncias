import { forwardRef, type SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; hint?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = '', id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    const helperId = selectId ? `${selectId}-helper` : undefined;
    return (
      <label className="block w-full" htmlFor={selectId}>
        {label ? <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span> : null}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? helperId : undefined}
          className={[
            'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition duration-150 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100',
            className,
          ].join(' ')}
          {...props}
        >{children}</select>
        {error ? <span id={helperId} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-red-600"><i className="bi bi-exclamation-circle mt-px" aria-hidden="true" />{error}</span> : null}
        {!error && hint ? <span id={helperId} className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span> : null}
      </label>
    );
  },
);
Select.displayName = 'Select';
