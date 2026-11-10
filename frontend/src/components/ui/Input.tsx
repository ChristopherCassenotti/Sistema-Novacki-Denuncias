import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, required, ...props }, ref) => {
    const inputId = id ?? props.name;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    return (
      <label className="block w-full" htmlFor={inputId}>
        {label ? <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span> : null}
        <span className="relative block">
          {icon ? <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">{icon}</span> : null}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error || hint ? helperId : undefined}
            className={[
              'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition duration-150',
              'placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
              error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100',
              icon ? 'pl-10' : '', className,
            ].join(' ')}
            {...props}
          />
        </span>
        {error ? <span id={helperId} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-red-600"><i className="bi bi-exclamation-circle mt-px" aria-hidden="true" />{error}</span> : null}
        {!error && hint ? <span id={helperId} className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span> : null}
      </label>
    );
  },
);
Input.displayName = 'Input';
