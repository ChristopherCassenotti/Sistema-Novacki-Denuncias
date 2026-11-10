import type { ReactNode } from 'react';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ icon = 'bi-inbox', title, description, action, compact = false }: Props) {
  return (
    <div className={`flex items-center justify-center px-5 text-center ${compact ? 'min-h-36 py-7' : 'min-h-52 py-10 sm:py-12'}`}>
      <div className="max-w-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg text-slate-400">
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
        {description ? <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">{description}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
