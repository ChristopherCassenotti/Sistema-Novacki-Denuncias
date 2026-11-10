import type { PropsWithChildren } from 'react';

type AlertTone = 'info' | 'danger' | 'success' | 'warning';

const styles: Record<AlertTone, { box: string; icon: string }> = {
  info: { box: 'border-brand-100 bg-brand-50 text-brand-900', icon: 'bi-info-circle' },
  danger: { box: 'border-red-100 bg-red-50 text-red-800', icon: 'bi-exclamation-circle' },
  success: { box: 'border-emerald-100 bg-emerald-50 text-emerald-800', icon: 'bi-check-circle' },
  warning: { box: 'border-amber-100 bg-amber-50 text-amber-800', icon: 'bi-exclamation-triangle' },
};

export function Alert({ children, tone = 'info' }: PropsWithChildren<{ tone?: AlertTone }>) {
  const current = styles[tone];

  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${current.box}`} role="alert">
      <i className={`bi ${current.icon} mt-0.5 shrink-0`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
