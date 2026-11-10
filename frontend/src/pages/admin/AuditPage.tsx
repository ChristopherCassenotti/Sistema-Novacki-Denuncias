import { useCallback, useEffect, useMemo, useState } from 'react';
import { rolesApi, routingRulesApi, teamsApi, usersApi } from '../../api/adminManagement';
import { auditApi, retentionApi } from '../../api/governance';
import { reportsApi } from '../../api/reports';
import { referencesApi } from '../../api/references';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import type { AuditLogFilters, AuditLogItem, PaginatedAuditLogs } from '../../types/governance';
import type { AdminUserListItem } from '../../types/management';
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_OPTIONS,
  auditActionLabel,
  auditEntityLabel,
  displayMetadataValue,
  metadataKeyLabel,
} from '../../utils/displayLabels';
import { formatDateTime } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { isFullyWithinUnitScope } from '../../utils/accessScope';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';
import type { NamedReference } from '../../types/reports';

const emptyResult: PaginatedAuditLogs = { items: [], page: 1, limit: 30, total: 0, totalPages: 1 };

function visibleMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [] as Array<[string, unknown]>;
  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !/(^id$|entityId$|actorUserId$|attachmentId$|grantId$|identityId$|messageId$|noteId$|uuid|request)/i.test(key));
}

function referenceTypeForMetadataKey(key: string, record?: Record<string, unknown>) {
  if (/^(target)?userId$/i.test(key) || /^restrictedUserId$/i.test(key)) return 'USER';
  if (/^(target)?teamId$/i.test(key)) return 'TEAM';
  if (/^(restricted)?roleId$/i.test(key)) return 'ROLE';
  if (/^(routing)?ruleId$/i.test(key)) return 'ROUTING_RULE';
  if (/^(retention)?policyId$/i.test(key)) return 'RETENTION_POLICY';
  if (/^reportId$/i.test(key)) return 'REPORT';
  if (key === 'targetId') {
    const type = typeof record?.targetType === 'string' ? record.targetType : '';
    return type === 'USER' || type === 'TEAM' ? type : null;
  }
  return null;
}

function friendlyMetadataValue(key: string, value: unknown, entityNames: Record<string, string>, record: Record<string, unknown>) {
  const refType = referenceTypeForMetadataKey(key, record);
  if (refType && typeof value === 'string') {
    return entityNames[`${refType}:${value}`] ?? (refType === 'USER' ? 'Usuário cadastrado' : refType === 'TEAM' ? 'Equipe cadastrada' : 'Item cadastrado');
  }

  if (Array.isArray(value) && /(?:Ids|Members)$/i.test(key)) {
    if (/Members$/i.test(key)) {
      const members = value.flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
        const member = item as Record<string, unknown>;
        const userId = typeof member.userId === 'string' ? member.userId : typeof member.user_id === 'string' ? member.user_id : undefined;
        const name = userId ? entityNames[`USER:${userId}`] : undefined;
        const role = member.role === 'COORDINATOR' ? 'Coordenador(a)' : member.role === 'MEMBER' ? 'Membro' : undefined;
        return name ? [`${name}${role ? ` (${role})` : ''}`] : [];
      });
      return members.length ? members.join(', ') : value.length ? `${value.length} ${value.length === 1 ? 'membro' : 'membros'}` : 'Nenhum';
    }

    const refTypeForArray = /roleIds$/i.test(key) ? 'ROLE' : /teamIds$/i.test(key) ? 'TEAM' : /(?:userIds|memberIds)$/i.test(key) ? 'USER' : null;
    if (!refTypeForArray) return value.length ? `${value.length} ${value.length === 1 ? 'item' : 'itens'}` : 'Nenhum';
    const names = value
      .filter((item): item is string => typeof item === 'string')
      .map((id) => entityNames[`${refTypeForArray}:${id}`])
      .filter(Boolean);
    return names.length ? names.join(', ') : value.length ? `${value.length} ${value.length === 1 ? 'item' : 'itens'}` : 'Nenhum';
  }

  return displayMetadataValue(key, value);
}

function FriendlyMetadata({ value, entityNames }: { value: unknown; entityNames: Record<string, string> }) {
  const entries = visibleMetadata(value);
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  if (!entries.length) return <p className="text-sm text-slate-500">Nenhuma informação adicional para exibir.</p>;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, item]) => (
        <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{metadataKeyLabel(key)}</dt>
          <dd className="mt-1.5 text-sm font-semibold text-slate-700">{friendlyMetadataValue(key, item, entityNames, record)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AuditPage() {
  const { user: actor } = useAuth();
  const canManage = useCan(ACCESS.audit);
  const canUsers = useCan(ACCESS.users);
  const canTeams = useCan(ACCESS.teams);
  const canRoles = useCan({ permission: 'ROLE_MANAGE' });
  const canRouting = useCan(ACCESS.routing);
  const canRetention = useCan(ACCESS.retention);
  const canReportDetail = useCan(ACCESS.reportDetail);
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 30, success: '' });
  const [result, setResult] = useState<PaginatedAuditLogs>(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [units, setUnits] = useState<NamedReference[]>([]);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setResult(await auditApi.list(filters)); }
    catch (err) { setError(err); setResult(emptyResult); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([
      canUsers ? usersApi.list() : Promise.resolve([]),
      canTeams ? teamsApi.list() : Promise.resolve([]),
      canRoles ? rolesApi.list() : Promise.resolve([]),
      canRouting ? routingRulesApi.list() : Promise.resolve([]),
      canRetention ? retentionApi.policies() : Promise.resolve([]),
      referencesApi.units(),
    ]).then(([userResult, teamResult, roleResult, routingResult, retentionResult, unitResult]) => {
      if (!active) return;
      const names: Record<string, string> = {};
      if (userResult.status === 'fulfilled') {
        setUsers(userResult.value);
        userResult.value.forEach((item) => { names[`USER:${item.id}`] = item.name; });
      }
      if (teamResult.status === 'fulfilled') teamResult.value.forEach((item) => { names[`TEAM:${item.id}`] = item.name; });
      if (roleResult.status === 'fulfilled') roleResult.value.forEach((item) => { names[`ROLE:${item.id}`] = item.name; });
      if (routingResult.status === 'fulfilled') routingResult.value.forEach((item) => { names[`ROUTING_RULE:${item.id}`] = item.name; });
      if (retentionResult.status === 'fulfilled') retentionResult.value.forEach((item) => { names[`RETENTION_POLICY:${item.id}`] = item.name; });
      if (unitResult.status === 'fulfilled') setUnits(unitResult.value);
      setEntityNames((current) => ({ ...current, ...names }));
    });
    return () => { active = false; };
  }, [canUsers, canTeams, canRoles, canRouting, canRetention]);

  const actorUnitIds = useMemo(() => {
    const ids = new Set<string>((actor?.units ?? []).map((unit) => unit.id));
    if (ids.size || canManage) return ids;
    users.find((item) => item.id === actor?.id)?.units.forEach((unit) => ids.add(unit.id));
    return ids;
  }, [actor?.id, actor?.units, canManage, users]);

  const userOptions = useMemo(
    () => (canManage ? users : users.filter((user) => isFullyWithinUnitScope(actorUnitIds, user.units.map((unit) => unit.id))))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [actorUnitIds, canManage, users],
  );
  const unitOptions = useMemo(
    () => canManage ? units : units.filter((unit) => actorUnitIds.has(unit.id)),
    [actorUnitIds, canManage, units],
  );

  // Defesa visual adicional: enquanto o backend regional não estiver aplicado,
  // um gerente nunca renderiza registros sem unidade resolvida ou de outra região.
  const visibleItems = useMemo(
    () => canManage
      ? result.items
      : result.items.filter((item) => Boolean(item.unit?.id && actorUnitIds.has(item.unit.id))),
    [actorUnitIds, canManage, result.items],
  );

  useEffect(() => {
    if (!canReportDetail) return;
    const reportIds: string[] = [...new Set<string>(visibleItems
      .filter((item) => item.entity === 'REPORT' && item.entityId && !entityNames[`REPORT:${item.entityId}`])
      .map((item) => item.entityId as string))];
    if (!reportIds.length) return;
    let active = true;
    void Promise.allSettled(reportIds.map((id) => reportsApi.get(id))).then((responses) => {
      if (!active) return;
      const names: Record<string, string> = {};
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled') names[`REPORT:${reportIds[index]}`] = response.value.protocol;
      });
      if (Object.keys(names).length) setEntityNames((current) => ({ ...current, ...names }));
    });
    return () => { active = false; };
  }, [visibleItems, entityNames, canReportDetail]);

  const update = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? Number(value) : 1 }));
  };

  const clear = () => setFilters({ page: 1, limit: 30, success: '' });
  const entityName = (item: AuditLogItem) => item.entityId ? entityNames[`${item.entity ?? ''}:${item.entityId}`] : undefined;
  const actorText = (item: AuditLogItem) => item.actorName ?? (item.actorId ? entityNames[`USER:${item.actorId}`] : undefined) ?? 'Sistema';
  const entityText = (item: AuditLogItem) => {
    const type = auditEntityLabel(item.entity);
    const name = entityName(item);
    return name ? `${type}: ${name}` : type;
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Controle e segurança" title="Histórico de atividades" description={canManage ? 'Veja as atividades administrativas de todas as unidades.' : 'Veja somente as atividades relacionadas às suas unidades.'} actions={<Button variant="secondary" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button>} />
      {!canManage ? <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900"><strong>Auditoria regional.</strong> Usuários e registros de outras regiões não são exibidos.</div> : null}

      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label="Data inicial" type="date" max={filters.to || undefined} value={filters.from ?? ''} onChange={(e) => update('from', e.target.value)} />
          <Input label="Data final" type="date" min={filters.from || undefined} value={filters.to ?? ''} onChange={(e) => update('to', e.target.value)} />
          <Select label="Pessoa" value={filters.actor ?? ''} onChange={(e) => update('actor', e.target.value)}>
            <option value="">Todas as pessoas</option>
            {userOptions.map((user) => <option key={user.id} value={user.id}>{user.name}{user.email ? ` — ${user.email}` : ''}</option>)}
          </Select>
          <Select label="Unidade" value={filters.unitId ?? ''} onChange={(e) => update('unitId', e.target.value)}>
            <option value="">{canManage ? 'Todas as unidades' : 'Todas as minhas unidades'}</option>
            {unitOptions.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </Select>
          <Select label="Atividade" value={filters.action ?? ''} onChange={(e) => update('action', e.target.value)}>
            <option value="">Todas as atividades</option>
            {AUDIT_ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Select label="Área afetada" value={filters.entity ?? ''} onChange={(e) => update('entity', e.target.value)}>
            <option value="">Todas as áreas</option>
            {AUDIT_ENTITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Select label="Resultado" value={filters.success ?? ''} onChange={(e) => update('success', e.target.value as AuditLogFilters['success'])}>
            <option value="">Todos</option><option value="true">Concluída</option><option value="false">Não concluída</option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end"><Button variant="ghost" onClick={clear}><i className="bi bi-x-circle" />Limpar filtros</Button></div>
      </Card>

      {error ? <ErrorAlert error={error} fallback="Não foi possível carregar o histórico de atividades." onRetry={() => void load()} /> : null}

      <Card className="overflow-hidden">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : visibleItems.length ? (
          <div className="soft-scrollbar overflow-x-auto">
            <table className="w-full min-w-[940px]">
              <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Data</th><th className="px-5 py-3">Pessoa</th><th className="px-5 py-3">Atividade</th><th className="px-5 py-3">Unidade</th><th className="px-5 py-3">Item afetado</th><th className="px-5 py-3">Resultado</th><th className="px-5 py-3" /></tr></thead>
              <tbody>{visibleItems.map((item) => <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/60"><td className="px-5 py-4 text-sm text-slate-500">{formatDateTime(item.createdAt)}</td><td className="px-5 py-4 text-sm font-bold text-slate-700">{actorText(item)}</td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{auditActionLabel(item.action)}</td><td className="px-5 py-4 text-sm text-slate-600">{item.unit?.name ?? '—'}</td><td className="px-5 py-4 text-sm text-slate-600">{entityText(item)}</td><td className="px-5 py-4">{item.success == null ? <Badge>Não informado</Badge> : <Badge tone={item.success ? 'success' : 'danger'}>{item.success ? 'Concluída' : 'Não concluída'}</Badge>}</td><td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(item)}><i className="bi bi-eye" />Ver detalhes</Button></td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState icon="bi-shield-check" title="Nenhuma atividade encontrada" description="Tente alterar os filtros ou escolher outro período." />}

        {!loading && (canManage ? result.totalPages > 1 : result.page > 1 || result.items.length >= result.limit) ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-500">
              {canManage
                ? <>Página {result.page} de {result.totalPages} · {result.total} registros</>
                : <>Página {result.page} · {visibleItems.length} registro(s) visível(is) nesta página</>}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={result.page <= 1} onClick={() => update('page', result.page - 1)}>Anterior</Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={canManage ? result.page >= result.totalPages : result.items.length < result.limit}
                onClick={() => update('page', result.page + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Detalhes da atividade" description={selected ? `${auditActionLabel(selected.action)} · ${formatDateTime(selected.createdAt)}` : undefined} size="lg">
        {selected ? <div className="space-y-5"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase text-slate-400">Pessoa</dt><dd className="mt-1 text-sm text-slate-700">{actorText(selected)}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-400">Resultado</dt><dd className="mt-1 text-sm text-slate-700">{selected.success == null ? 'Não informado' : selected.success ? 'Concluída' : 'Não concluída'}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-400">Atividade</dt><dd className="mt-1 text-sm text-slate-700">{auditActionLabel(selected.action)}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-400">Item afetado</dt><dd className="mt-1 text-sm text-slate-700">{entityText(selected)}</dd></div></dl><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Informações adicionais</p><FriendlyMetadata value={selected.metadata} entityNames={entityNames} /></div></div> : null}
      </Modal>
    </div>
  );
}
