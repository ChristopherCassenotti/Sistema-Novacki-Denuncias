import type { PropsWithChildren, ReactNode } from 'react';

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}>) {
  return (
    <section className="px-4 py-8 sm:px-8 sm:py-10 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 max-w-3xl sm:mb-8">
          {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p> : null}
          <h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{description}</p> : null}
        </div>

        {aside ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>{children}</div>
            <aside>{aside}</aside>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
