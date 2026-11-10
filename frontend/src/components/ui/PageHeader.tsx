import type { ReactNode } from 'react';

type PageHeaderProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode };

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="w-full shrink-0 sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{actions}</div> : null}
    </div>
  );
}
