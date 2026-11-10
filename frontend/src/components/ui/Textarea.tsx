import { forwardRef, type TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id ?? props.name;
    const helperId = textareaId ? `${textareaId}-helper` : undefined;
    return (
      <label className="block w-full" htmlFor={textareaId}>
        {label ? <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span> : null}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? helperId : undefined}
          className={[
            'min-h-28 w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition duration-150',
            'placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100',
            className,
          ].join(' ')}
          {...props}
        />
        {error ? <span id={helperId} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-red-600"><i className="bi bi-exclamation-circle mt-px" aria-hidden="true" />{error}</span> : null}
        {!error && hint ? <span id={helperId} className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span> : null}
      </label>
    );
  },
);
Textarea.displayName = 'Textarea';
