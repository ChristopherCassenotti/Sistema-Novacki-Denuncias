import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; block?: boolean }>;

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 focus-visible:ring-brand-200 disabled:bg-brand-300',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-200 disabled:bg-red-300',
};
const sizeClasses: Record<ButtonSize, string> = { sm: 'min-h-9 px-3 py-2 text-sm', md: 'min-h-11 px-4 py-2.5 text-sm', lg: 'min-h-12 px-5 py-3 text-base' };

export function Button({ children, className = '', variant = 'primary', size = 'md', loading = false, block = false, disabled, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 focus:outline-none focus-visible:ring-4',
        'disabled:cursor-not-allowed disabled:opacity-70 active:translate-y-px', variantClasses[variant], sizeClasses[size], block ? 'w-full' : '', className,
      ].join(' ')}
      {...props}
    >
      {loading ? <i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
