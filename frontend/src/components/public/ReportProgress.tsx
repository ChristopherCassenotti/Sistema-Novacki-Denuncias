const steps = ['Tipo', 'Relato', 'Pessoas', 'Risco', 'Anexos', 'Revisão'];

export function ReportProgress({ current }: { current: number }) {
  const clamped = Math.min(Math.max(current, 1), steps.length);
  const progress = Math.round((clamped / steps.length) * 100);

  return (
    <div className="mb-7" aria-label={`Etapa ${clamped} de ${steps.length}: ${steps[clamped - 1]}`}>
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">Etapa {clamped} de {steps.length}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{steps[clamped - 1]}</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{progress}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-700 transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="hidden items-center sm:flex" aria-label="Etapas da denúncia">
        {steps.map((step, index) => {
          const number = index + 1;
          const complete = number < clamped;
          const active = number === clamped;
          return (
            <li key={step} className="flex flex-1 items-center last:flex-none" aria-current={active ? 'step' : undefined}>
              <div className="flex items-center gap-2">
                <span className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  complete || active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-500',
                ].join(' ')}>
                  {complete ? <i className="bi bi-check-lg" aria-hidden="true" /> : number}
                </span>
                <span className={active ? 'text-sm font-bold text-slate-900' : 'text-sm font-medium text-slate-500'}>{step}</span>
              </div>
              {index < steps.length - 1 ? <div className={`mx-3 h-px min-w-5 flex-1 ${complete ? 'bg-brand-300' : 'bg-slate-200'}`} /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
