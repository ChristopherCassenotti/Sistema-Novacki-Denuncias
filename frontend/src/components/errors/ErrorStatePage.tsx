import type { ReactNode } from 'react';
import { Link } from 'react-router';

type Props = {
  code: string;
  title: string;
  description: string;
  icon: string;
  tone?: 'brand' | 'warning' | 'danger';
  primaryTo?: string;
  primaryLabel?: string;
  secondary?: ReactNode;
  reference?: string;
};

const toneClasses = {
  brand: 'bg-brand-50 text-brand-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
};

export function ErrorStatePage({
  code,
  title,
  description,
  icon,
  tone = 'brand',
  primaryTo = '/admin',
  primaryLabel = 'Voltar ao painel',
  secondary,
  reference,
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-12 sm:px-6">
      <section className="w-full max-w-lg text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl ${toneClasses[tone]}`}>
          <i className={`bi ${icon}`} aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Erro {code}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
        {reference ? (
          <div className="mx-auto mt-5 max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
            Referência: <strong className="font-mono text-slate-700">{reference}</strong>
          </div>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to={primaryTo} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100">
            <i className="bi bi-arrow-left" aria-hidden="true" /> {primaryLabel}
          </Link>
          {secondary}
        </div>
      </section>
    </main>
  );
}
