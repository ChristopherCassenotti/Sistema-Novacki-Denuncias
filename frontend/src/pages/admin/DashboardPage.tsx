import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { dashboardApi } from '../../api/dashboard';
import { reportsApi } from '../../api/reports';
import { MiniBarChart } from '../../components/dashboard/MiniBarChart';
import { ReportPriorityBadge, ReportStatusBadge } from '../../components/reports/ReportBadges';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';
import { useAuth } from '../../context/AuthContext';
import type { DashboardData } from '../../types/dashboard';
import type { ReportListItem } from '../../types/reports';
import { formatDateTime } from '../../utils/format';
import { reportStatusLabel } from '../../utils/reportLabels';

const emptyDashboard: DashboardData = {
  open: 0, initialReview: 0, investigating: 0, waitingReporter: 0, concluded: 0, immediateRisk: 0,
  byMonth: [], byStatus: [], byCategory: [], byUnit: [], attention: [], raw: null,
};

export function DashboardPage() {
  const { user } = useAuth();
  const canListReports = useCan(ACCESS.reports);
  const firstName = user?.name?.split(' ')[0] ?? 'Usuário';
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [recent, setRecent] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [dashboardResult, reportsResult] = await Promise.allSettled([
      dashboardApi.get(), canListReports ? reportsApi.list({ page: 1, limit: 6 }) : Promise.resolve({ items: [] }),
    ]);
    if (dashboardResult.status === 'fulfilled') setData(dashboardResult.value);
    else setError(dashboardResult.reason);
    if (reportsResult.status === 'fulfilled') setRecent(reportsResult.value.items);
    else if (dashboardResult.status === 'fulfilled') setError(reportsResult.reason);
    setLoading(false);
  }, [canListReports]);

  useEffect(() => { void load(); }, [load]);

  const cards = [
    { label: 'Denúncias abertas', value: data.open, icon: 'bi-inbox', className: 'bg-brand-50 text-brand-700' },
    { label: 'Em triagem', value: data.initialReview, icon: 'bi-funnel', className: 'bg-amber-50 text-amber-700' },
    { label: 'Em investigação', value: data.investigating, icon: 'bi-search', className: 'bg-sky-50 text-sky-700' },
    { label: 'Aguardando denunciante', value: data.waitingReporter, icon: 'bi-chat-left-dots', className: 'bg-violet-50 text-violet-700' },
    { label: 'Concluídas', value: data.concluded, icon: 'bi-check2-circle', className: 'bg-emerald-50 text-emerald-700' },
    { label: 'Risco imediato', value: data.immediateRisk, icon: 'bi-exclamation-triangle', className: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Visão geral"
        title={`Olá, ${firstName}`}
        description="Acompanhe volume, risco e itens que precisam de atenção no Canal de Denúncias."
        actions={<Button variant="secondary" size="sm" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button>}
      />

      {error ? <ErrorAlert error={error} fallback="Não foi possível carregar todas as informações da visão geral." onRetry={() => void load()} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((item) => (
          <Card key={item.label} className="p-5">
            {loading ? <><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-9 w-16" /></> : (
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-medium leading-5 text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p></div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.className}`}><i className={`bi ${item.icon}`} /></span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-bold text-slate-900">Denúncias por categoria</h2><p className="mt-1 text-sm text-slate-500">Veja quais categorias concentram mais denúncias.</p></div>
            <div className="flex flex-wrap justify-end gap-2"><Badge tone="brand">Anônimas: {data.anonymous ?? 0}</Badge><Badge tone="info">Identificadas: {data.identified ?? 0}</Badge></div>
          </div>
          {loading ? <Skeleton className="mt-6 h-52 w-full" /> : <MiniBarChart data={data.byCategory} />}
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-slate-900">Distribuição por situação</h2>
          <p className="mt-1 text-sm text-slate-500">Leitura rápida do estágio das denúncias.</p>
          <div className="mt-6 space-y-4">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />) : data.byStatus.length ? data.byStatus.slice(0, 7).map((item) => {
              const max = Math.max(...data.byStatus.map((entry) => entry.value), 1);
              return <div key={item.label}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-600">{reportStatusLabel(item.label)}</span><span className="font-bold text-slate-800">{item.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(4, item.value / max * 100)}%` }} /></div></div>;
            }) : <EmptyState title="Sem distribuição disponível" description="Ainda não há dados suficientes para mostrar esta distribuição." />}
          </div>
        </Card>
      </div>

      {canListReports ? <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="font-bold text-slate-900">Denúncias recentes</h2><p className="mt-1 text-sm text-slate-500">Acesse rapidamente os últimos registros disponíveis.</p></div>
          <Link to="/admin/denuncias" className="text-sm font-bold text-brand-700 hover:text-brand-900">Ver todas <i className="bi bi-arrow-right ml-1" /></Link>
        </div>
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : recent.length ? (
          <div className="divide-y divide-slate-100">{recent.map((report) => (
            <Link key={report.id} to={`/admin/denuncias/${report.id}`} className="flex flex-col gap-3 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900">{report.protocol}</span><ReportStatusBadge status={report.status} /><ReportPriorityBadge priority={report.priority} />{report.immediateRisk ? <Badge tone="danger">Risco imediato</Badge> : null}</div><p className="mt-1 truncate text-sm text-slate-500">{report.category?.name ?? 'Sem categoria'} · {report.unit?.name ?? 'Sem unidade'}</p></div>
              <span className="shrink-0 text-xs text-slate-400">{formatDateTime(report.updatedAt ?? report.createdAt)}</span>
            </Link>
          ))}</div>
        ) : <EmptyState title="Nenhuma denúncia encontrada" description="Assim que houver registros acessíveis, eles aparecerão aqui." />}
      </Card> : null}
    </div>
  );
}
