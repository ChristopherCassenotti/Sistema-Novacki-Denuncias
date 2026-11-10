import { useCallback, useEffect, useMemo, useState } from 'react';
import { referencesApi } from '../../api/references';
import { reportsApi } from '../../api/reports';
import { ReportRow } from '../../components/reports/ReportRow';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import type { NamedReference, PaginatedReports, ReportListFilters, ReportListItem } from '../../types/reports';

const initialData: PaginatedReports = { items: [], page: 1, limit: 20, total: 0, totalPages: 1 };

function isInPeriod(item: ReportListItem, from?: string, to?: string) {
  if (!from && !to) return true;
  if (!item.createdAt) return false;
  const time = new Date(item.createdAt).getTime();
  if (Number.isNaN(time)) return false;
  if (from) {
    const start = new Date(`${from}T00:00:00`).getTime();
    if (time < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`).getTime();
    if (time > end) return false;
  }
  return true;
}

export function ReportsPage() {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<ReportListFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<NamedReference[]>([]);
  const [units, setUnits] = useState<NamedReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (filters.dateFrom || filters.dateTo) {
        const all = await reportsApi.listAll(filters);
        const filteredByDate = all.filter((item) => isInPeriod(item, filters.dateFrom, filters.dateTo));
        const limit = filters.limit ?? 20;
        const totalPages = Math.max(1, Math.ceil(filteredByDate.length / limit));
        const page = Math.min(filters.page ?? 1, totalPages);
        const start = (page - 1) * limit;
        setData({
          items: filteredByDate.slice(start, start + limit),
          page,
          limit,
          total: filteredByDate.length,
          totalPages,
        });
      } else {
        setData(await reportsApi.list(filters));
      }
    }
    catch (err) { setError(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    void Promise.allSettled([referencesApi.categories(), referencesApi.units()]).then(([cats, uns]) => {
      if (cats.status === 'fulfilled') setCategories(cats.value);
      else setError(cats.reason);
      if (uns.status === 'fulfilled') setUnits(uns.value);
      else setError(uns.reason);
    });
  }, []);

  // The API applies unit scope, explicit grants and restrictions.
  const scopedItems = data.items;

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return scopedItems;
    return scopedItems.filter((item) => [item.protocol, item.category?.name, item.unit?.name, item.assignee?.name, item.team?.name].some((value) => value?.toLowerCase().includes(term)));
  }, [scopedItems, search]);

  const scopedUnits = units;

  const setFilter = (key: keyof ReportListFilters, value: unknown) => setFilters((current) => ({ ...current, page: 1, [key]: value || undefined }));
  const clearFilters = () => { setFilters({ page: 1, limit: 20 }); setSearch(''); };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operação" title="Denúncias" description="Encontre denúncias por situação, prioridade, categoria, unidade, tipo, risco ou período." actions={<Button variant="secondary" size="sm" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button>} />

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          <div className="md:col-span-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nesta página por protocolo, categoria, unidade ou responsável..." icon={<i className="bi bi-search" />} /></div>
          <Select value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value)}><option value="">Todas as situações</option><option value="RECEIVED">Recebida</option><option value="INITIAL_REVIEW">Em triagem</option><option value="WAITING_REPORTER_INFORMATION">Aguardando denunciante</option><option value="INVESTIGATING">Em investigação</option><option value="FORWARDED">Encaminhada</option><option value="CONCLUDED">Concluída</option><option value="ARCHIVED">Arquivada</option></Select>
          <Select value={filters.priority ?? ''} onChange={(e) => setFilter('priority', e.target.value)}><option value="">Todas as prioridades</option><option value="LOW">Baixa</option><option value="NORMAL">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></Select>
          <Select value={filters.categoryId ?? ''} onChange={(e) => setFilter('categoryId', e.target.value)}><option value="">Todas as categorias</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select value={filters.unitId ?? ''} onChange={(e) => setFilter('unitId', e.target.value)}><option value="">Todas as unidades</option>{scopedUnits.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select value={filters.mode ?? ''} onChange={(e) => setFilter('mode', e.target.value)}><option value="">Anônima ou identificada</option><option value="ANONYMOUS">Anônima</option><option value="IDENTIFIED">Identificada</option></Select>
          <Select value={typeof filters.immediateRisk === 'boolean' ? String(filters.immediateRisk) : ''} onChange={(e) => setFilter('immediateRisk', e.target.value === '' ? undefined : e.target.value === 'true')}><option value="">Qualquer nível de risco</option><option value="true">Com risco imediato</option><option value="false">Sem risco imediato</option></Select>
          <Input label="Abertas a partir de" type="date" max={filters.dateTo ?? undefined} value={filters.dateFrom ?? ''} onChange={(e) => setFilter('dateFrom', e.target.value)} />
          <Input label="Abertas até" type="date" min={filters.dateFrom ?? undefined} value={filters.dateTo ?? ''} onChange={(e) => setFilter('dateTo', e.target.value)} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-slate-400">A busca por texto considera somente a página exibida. O período considera a data em que a denúncia foi aberta.</p><button onClick={clearFilters} className="text-xs font-bold text-brand-700 hover:text-brand-900">Limpar filtros</button></div>
      </Card>

      {error ? <ErrorAlert error={error} fallback="Não foi possível carregar as denúncias." onRetry={() => void load()} /> : null}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><p className="text-sm text-slate-500"><strong className="text-slate-800">{data.total}</strong> {data.total === 1 ? 'denúncia encontrada' : 'denúncias encontradas'}</p><Select className="h-9 min-w-28" value={filters.limit ?? 20} onChange={(e) => setFilters((current) => ({ ...current, page: 1, limit: Number(e.target.value) }))}><option value={10}>10 por página</option><option value={20}>20 por página</option><option value={50}>50 por página</option></Select></div>
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : visibleItems.length ? (
          <div className="soft-scrollbar overflow-x-auto"><table className="min-w-[1250px] w-full text-left"><thead className="bg-slate-50"><tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{['Protocolo','Categoria','Unidade','Situação','Prioridade','Risco','Responsável','Aberta em','Atualizada em',''].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody>{visibleItems.map((report) => <ReportRow key={report.id} report={report} />)}</tbody></table></div>
        ) : <EmptyState title="Nenhuma denúncia encontrada" description="Altere os filtros para ampliar a busca." />}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-slate-500">Página {data.page} de {data.totalPages}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={data.page <= 1 || loading} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))}><i className="bi bi-chevron-left" />Anterior</Button><Button variant="secondary" size="sm" disabled={data.page >= data.totalPages || loading} onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}>Próxima<i className="bi bi-chevron-right" /></Button></div></div>
      </Card>
    </div>
  );
}
