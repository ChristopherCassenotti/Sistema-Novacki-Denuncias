import { useCallback, useEffect, useState } from 'react';
import { publicReportsApi } from '../../api/publicReports';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Skeleton } from '../../components/ui/Skeleton';
import { useReporter } from '../../context/ReporterContext';
import type { PublicHistoryEvent } from '../../types/public';
import { formatDateTime } from '../../utils/format';
import { reportStatusLabel } from '../../utils/reportLabels';

export function ReportTrackingPage() {
  const { report } = useReporter();
  const [history, setHistory] = useState<PublicHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setHistory(await publicReportsApi.history()); }
    catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Situação atual</p>
          <p className="mt-2 text-lg font-bold text-slate-900">{reportStatusLabel(report?.status)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">A equipe responsável atualizará o andamento conforme a análise do relato.</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-5">
          <dl className="space-y-4 text-sm">
            <div><dt className="font-semibold text-slate-400">Protocolo</dt><dd className="mt-1 text-slate-800">{report?.protocol || '—'}</dd></div>
            <div><dt className="font-semibold text-slate-400">Registrada em</dt><dd className="mt-1 text-slate-800">{formatDateTime(report?.createdAt)}</dd></div>
            <div><dt className="font-semibold text-slate-400">Última atividade</dt><dd className="mt-1 text-slate-800">{formatDateTime(report?.updatedAt)}</dd></div>
          </dl>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">Histórico da denúncia</h2>
        <p className="mt-1 text-sm text-slate-500">Aqui aparecem as atualizações que podem ser acompanhadas por você.</p>
        {error ? <div className="mt-4"><ErrorAlert error={error} fallback="Não foi possível carregar o histórico da denúncia." onRetry={() => void load()} /></div> : null}
        {loading ? <div className="mt-5 space-y-4" role="status" aria-label="Carregando histórico">{[1,2,3].map((n) => <div key={n} className="flex gap-4"><Skeleton className="h-8 w-8 shrink-0" rounded="full" /><div className="flex-1 rounded-xl border border-slate-100 p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-2/3" /></div></div>)}</div> : null}
        {!loading && !error && history.length === 0 ? <div className="mt-5"><EmptyState compact icon="bi-clock-history" title="Ainda não há novas atualizações" description="A situação atual permanece disponível e novos eventos aparecerão aqui quando forem publicados." /></div> : null}
        {!loading && history.length ? <div className="mt-5 space-y-0">{history.map((event, index) => (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < history.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-slate-200" /> : null}
            <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><i className="bi bi-check2 text-sm" /></span>
            <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"><strong className="text-sm text-slate-800">{event.title}</strong><span className="text-xs text-slate-400">{formatDateTime(event.createdAt)}</span></div>{event.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{event.description}</p> : null}</div>
          </div>
        ))}</div> : null}
      </div>
    </div>
  );
}
