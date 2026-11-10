import type { DashboardSeriesPoint } from '../../types/dashboard';

export function MiniBarChart({ data }: { data: DashboardSeriesPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  if (!data.length) return <p className="py-14 text-center text-sm text-slate-400">Sem dados para o período.</p>;
  return (
    <div className="flex h-52 items-end gap-2 pt-6">
      {data.slice(-10).map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <span className="text-[10px] font-bold text-slate-400">{item.value}</span>
          <div className="w-full rounded-t-lg bg-brand-100" style={{ height: `${Math.max(8, (item.value / max) * 145)}px` }}>
            <div className="h-full w-full rounded-t-lg bg-brand-600/80" />
          </div>
          <span className="max-w-full truncate text-[10px] font-medium text-slate-500" title={item.label}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
