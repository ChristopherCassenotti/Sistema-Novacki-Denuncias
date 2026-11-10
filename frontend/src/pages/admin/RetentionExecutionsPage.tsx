import { useCallback, useEffect, useMemo, useState } from 'react';
import { retentionApi } from '../../api/governance';
import { usersApi } from '../../api/adminManagement';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import type { PaginatedRetentionExecutions, RetentionExecution } from '../../types/governance';
import { retentionActionLabel, retentionExecutionStatusLabel } from '../../utils/displayLabels';
import { formatDateTime } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';

function statusTone(status?: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED' || status === 'CANCELLED') return 'danger';
  if (status === 'RUNNING') return 'info';
  if (status === 'PENDING') return 'warning';
  return 'neutral';
}

export function RetentionExecutionsPage() {
  const { user: actor } = useAuth();
  const canManage = useCan(ACCESS.retentionExecutions);
  const [result, setResult] = useState<PaginatedRetentionExecutions | null>(null);
  const [actorUnitIds, setActorUnitIds] = useState<Set<string>>(new Set<string>((actor?.units ?? []).map((unit) => unit.id)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [actionError, setActionError] = useState<unknown | null>(null);
  const [busy, setBusy] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState<{ kind: 'BATCH' | 'SPECIFIC'; id?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [executionResult, userResult] = await Promise.allSettled([
      retentionApi.executions(),
      canManage ? Promise.resolve([]) : usersApi.list(),
    ]);

    if (executionResult.status === 'fulfilled') setResult(executionResult.value);
    else { setError(executionResult.reason); setResult(null); }

    if (!canManage) {
      const ids = new Set<string>((actor?.units ?? []).map((unit) => unit.id));
      if (!ids.size && userResult.status === 'fulfilled') {
        userResult.value.find((user) => user.id === actor?.id)?.units.forEach((unit) => ids.add(unit.id));
      }
      setActorUnitIds(ids);
    }
    setLoading(false);
  }, [actor?.id, actor?.units, canManage]);

  useEffect(() => { void load(); }, [load]);

  // Fail closed no frontend: para o RH regional, execuções sem unidade
  // resolvida não são exibidas até o backend devolver o escopo correto.
  const visibleItems = useMemo(
    () => canManage
      ? (result?.items ?? [])
      : (result?.items ?? []).filter((item) => Boolean(item.unit?.id && actorUnitIds.has(item.unit.id))),
    [actorUnitIds, canManage, result?.items],
  );

  const run = async (key: string, action: () => Promise<unknown>, successMessage: string) => {
    setBusy(key); setActionError(null); setSuccess('');
    try { await action(); setSuccess(successMessage); await load(); }
    catch (err) { setActionError(err); }
    finally { setBusy(''); }
  };

  const confirmExecution = async () => {
    if (!confirm) return;
    const current = confirm;
    setConfirm(null);
    if (current.kind === 'BATCH') {
      await run('executor', retentionApi.runExecutor, 'As ações pendentes foram processadas.');
      return;
    }
    if (!current.id) return;
    await run(`execution-${current.id}`, () => retentionApi.runExecution(current.id as string), 'A ação selecionada foi processada.');
  };

  const retry = (item: RetentionExecution) => setConfirm({ kind: 'SPECIFIC', id: item.id });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Controle e segurança" title="Ações automáticas" description={canManage ? 'Verifique e processe ações automáticas de todas as unidades.' : 'Verifique e processe somente ações automáticas das suas unidades.'} />
      {!canManage ? <Alert tone="info"><strong>Escopo regional ativo.</strong> Os comandos desta tela devem atuar somente sobre denúncias das suas unidades.</Alert> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-6"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><i className="bi bi-calendar2-check" /></span><div className="flex-1"><h2 className="font-bold text-slate-900">Verificar denúncias com prazo encerrado</h2><p className="mt-1 text-sm leading-6 text-slate-500">Procura denúncias que já chegaram ao fim do prazo de guarda e prepara o que deve ser feito em seguida.</p><PermissionGuard {...ACCESS.retention}><div className="mt-4"><Button loading={busy === 'scheduler'} onClick={() => void run('scheduler', retentionApi.runScheduler, 'A verificação foi concluída.')}><i className="bi bi-search" />Verificar agora</Button></div></PermissionGuard></div></div></Card>
        <Card className="p-6"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><i className="bi bi-gear-wide-connected" /></span><div className="flex-1"><h2 className="font-bold text-slate-900">Processar ações pendentes</h2><p className="mt-1 text-sm leading-6 text-slate-500">Executa as ações que já estão prontas, como ocultar dados pessoais ou excluir informações conforme as regras definidas.</p><PermissionGuard {...ACCESS.retentionExecutions}><div className="mt-4"><Button variant="secondary" loading={busy === 'executor'} onClick={() => setConfirm({ kind: 'BATCH' })}><i className="bi bi-play-circle" />Processar pendências</Button></div></PermissionGuard></div></div></Card>
      </div>

      {success ? <Alert tone="success"><strong>Concluído.</strong> {success}</Alert> : null}
      {actionError ? <ErrorAlert error={actionError} fallback="Não foi possível concluir esta ação." /> : null}
      {error ? <ErrorAlert error={error} fallback="Não foi possível carregar o histórico das ações automáticas." onRetry={() => void load()} /> : null}

      <Card className="overflow-hidden">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : visibleItems.length ? <div className="soft-scrollbar overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Data prevista</th><th className="px-5 py-3">Denúncia</th><th className="px-5 py-3">Unidade</th><th className="px-5 py-3">O que será feito</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3">Tentativas</th><th className="px-5 py-3">Processamento</th><th className="px-5 py-3" /></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-5 py-4 text-sm text-slate-500">{formatDateTime(item.scheduledAt)}</td><td className="px-5 py-4"><p className="font-bold text-slate-700">{item.reportProtocol ?? 'Protocolo não informado'}</p></td><td className="px-5 py-4 text-sm text-slate-600">{item.unit?.name ?? '—'}</td><td className="px-5 py-4"><Badge tone={item.action === 'DELETE' ? 'danger' : 'info'}>{retentionActionLabel(item.action)}</Badge></td><td className="px-5 py-4"><Badge tone={statusTone(item.status)}>{retentionExecutionStatusLabel(item.status)}</Badge>{item.error ? <p className="mt-2 max-w-72 text-xs text-red-600">Não foi possível concluir esta ação.</p> : null}</td><td className="px-5 py-4 text-sm text-slate-600">{item.attempts ?? 0}</td><td className="px-5 py-4 text-xs leading-5 text-slate-500"><div>Início: {formatDateTime(item.startedAt)}</div><div>Conclusão: {formatDateTime(item.completedAt)}</div></td><td className="px-5 py-4 text-right"><PermissionGuard {...ACCESS.retentionExecutions}><Button variant="ghost" size="sm" loading={busy === `execution-${item.id}`} disabled={item.status === 'RUNNING' || item.status === 'COMPLETED'} onClick={() => retry(item)}><i className="bi bi-arrow-repeat" />Processar</Button></PermissionGuard></td></tr>)}</tbody></table></div> : <EmptyState icon="bi-hourglass-split" title="Nenhuma ação pendente" description="Não há ações automáticas para exibir no momento." />}
      </Card>

      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title={confirm?.kind === 'BATCH' ? 'Processar todas as ações pendentes?' : 'Processar esta ação?'} description="Dependendo da regra de guarda, esta ação pode ocultar dados pessoais ou excluir informações. Confirme somente se deseja continuar." footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancelar</Button><Button variant="danger" loading={busy === 'executor' || busy.startsWith('execution-')} onClick={() => void confirmExecution()}><i className="bi bi-exclamation-triangle" />Confirmar</Button></>}>
        <Alert tone="warning"><strong>Esta ação pode alterar dados de forma permanente.</strong> Confirme somente depois de revisar as regras de guarda.</Alert>
      </Modal>
    </div>
  );
}
