import type { PropsWithChildren } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
  brand: 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100',
};

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: BadgeTone }>) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
