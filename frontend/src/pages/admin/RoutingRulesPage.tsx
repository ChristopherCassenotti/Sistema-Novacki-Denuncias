import { useCallback, useEffect, useMemo, useState } from 'react';
import { rolesApi, routingRulesApi, teamsApi, usersApi } from '../../api/adminManagement';
import { referencesApi } from '../../api/references';
import { Alert } from '../../components/ui/Alert';
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
import type { NamedReference } from '../../types/reports';
import type { AdminUserListItem, RoleReference, RoutingRuleFormData, RoutingRuleListItem, TeamListItem } from '../../types/management';
import type { FieldErrors } from '../../utils/validation';
import { relationshipLabel } from '../../utils/displayLabels';
import { useAuth } from '../../context/AuthContext';
import { isFullyWithinUnitScope } from '../../utils/accessScope';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';

const emptyForm: RoutingRuleFormData = {
  name: '', priority: 100, categoryId: '', unitId: '', reportMode: '', relationship: '', immediateRisk: '', restrictedRoleId: '', targetType: '', targetId: '', setPriority: '', stopProcessing: true,
};

const modeLabel = (value?: string) => value === 'ANONYMOUS' ? 'Anônima' : value === 'IDENTIFIED' ? 'Identificada' : value || 'Qualquer';
const priorityLabel = (value?: string) => ({ LOW: 'Baixa', NORMAL: 'Média', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica' }[value ?? ''] ?? value ?? 'Não altera');

export function RoutingRulesPage() {
  const { user: actor } = useAuth();
  const canManage = useCan(ACCESS.routing);
  const canUsers = useCan(ACCESS.users);
  const canTeams = useCan(ACCESS.teams);
  const canRoles = useCan({ permission: 'ROLE_MANAGE' });
  const [rules, setRules] = useState<RoutingRuleListItem[]>([]);
  const [categories, setCategories] = useState<NamedReference[]>([]);
  const [units, setUnits] = useState<NamedReference[]>([]);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [roles, setRoles] = useState<RoleReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [referenceWarning, setReferenceWarning] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoutingRuleListItem | null>(null);
  const [form, setForm] = useState<RoutingRuleFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null); setReferenceWarning(false);
    const results = await Promise.allSettled([
      routingRulesApi.list(),
      referencesApi.categories(),
      referencesApi.units(),
      canUsers ? usersApi.list() : Promise.resolve([]),
      canTeams ? teamsApi.list() : Promise.resolve([]),
      canRoles ? rolesApi.list() : Promise.resolve([]),
    ]);
    const [rulesResult, categoriesResult, unitsResult, usersResult, teamsResult, rolesResult] = results;
    const categoryItems = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
    const unitItems = unitsResult.status === 'fulfilled' ? unitsResult.value : [];
    const userItems = usersResult.status === 'fulfilled' ? usersResult.value.filter((user) => user.active) : [];
    const teamItems = teamsResult.status === 'fulfilled' ? teamsResult.value.filter((team) => team.active) : [];
    const roleItems = rolesResult.status === 'fulfilled' ? rolesResult.value.filter((role) => role.active !== false) : [];

    setCategories(categoryItems);
    setUnits(unitItems);
    setUsers(userItems);
    setTeams(teamItems);
    setRoles(roleItems);
    if ([categoriesResult, unitsResult, usersResult, teamsResult, rolesResult].some((result) => result.status === 'rejected')) setReferenceWarning(true);

    if (rulesResult.status === 'fulfilled') {
      setRules(rulesResult.value.map((rule) => ({
        ...rule,
        category: rule.category ? { ...rule.category, name: categoryItems.find((item) => item.id === rule.category?.id)?.name ?? rule.category.name } : undefined,
        unit: rule.unit ? { ...rule.unit, name: unitItems.find((item) => item.id === rule.unit?.id)?.name ?? rule.unit.name } : undefined,
        restrictedRole: rule.restrictedRole ? { ...rule.restrictedRole, name: roleItems.find((item) => item.id === rule.restrictedRole?.id)?.name ?? rule.restrictedRole.name } : undefined,
        target: rule.target ? {
          ...rule.target,
          name: rule.targetType === 'TEAM'
            ? teamItems.find((item) => item.id === rule.target?.id)?.name ?? rule.target.name
            : userItems.find((item) => item.id === rule.target?.id)?.name ?? rule.target.name,
        } : undefined,
      })));
    } else setError(rulesResult.reason);
    setLoading(false);
  }, [canUsers, canTeams, canRoles]);

  useEffect(() => { void load(); }, [load]);

  const actorUnitIds = useMemo(() => {
    const ids = new Set<string>((actor?.units ?? []).map((unit) => unit.id));
    if (ids.size || canManage) return ids;
    users.find((item) => item.id === actor?.id)?.units.forEach((unit) => ids.add(unit.id));
    return ids;
  }, [actor?.id, actor?.units, canManage, users]);

  const scopedUnits = useMemo(
    () => canManage ? units : units.filter((unit) => actorUnitIds.has(unit.id)),
    [actorUnitIds, canManage, units],
  );
  const scopedUsers = useMemo(
    () => canManage ? users : users.filter((user) => isFullyWithinUnitScope(actorUnitIds, user.units.map((unit) => unit.id))),
    [actorUnitIds, canManage, users],
  );
  const scopedTeams = useMemo(
    () => canManage ? teams : teams.filter((team) => isFullyWithinUnitScope(actorUnitIds, team.units.map((unit) => unit.id))),
    [actorUnitIds, canManage, teams],
  );
  const scopedRoles = useMemo(
    () => roles,
    [canManage, roles],
  );
  const scopedRules = useMemo(
    () => canManage ? rules : rules.filter((rule) => Boolean(rule.unit?.id && actorUnitIds.has(rule.unit.id))),
    [actorUnitIds, canManage, rules],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scopedRules.filter((rule) => {
      const matchesText = !term || [rule.name, rule.category?.name, rule.unit?.name, rule.target?.name].some((value) => value?.toLowerCase().includes(term));
      const matchesStatus = !statusFilter || (statusFilter === 'active' ? rule.active : !rule.active);
      return matchesText && matchesStatus;
    });
  }, [scopedRules, search, statusFilter]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, unitId: !canManage && scopedUnits.length === 1 ? scopedUnits[0].id : '' }); setFormErrors({}); setError(null); setSuccess(''); setFormOpen(true); };
  const openEdit = async (rule: RoutingRuleListItem) => {
    if (!canManage && (!rule.unit?.id || !actorUnitIds.has(rule.unit.id))) return;
    setEditing(rule); setFormErrors({}); setError(null); setSuccess(''); setFormOpen(true);
    const fill = (item: RoutingRuleListItem) => setForm({
      name: item.name,
      priority: item.order ?? 100,
      categoryId: item.category?.id ?? '',
      unitId: item.unit?.id ?? '',
      reportMode: item.reportMode ?? '',
      relationship: item.relationship ?? '',
      immediateRisk: item.immediateRisk == null ? '' : String(item.immediateRisk) as 'true' | 'false',
      restrictedRoleId: item.restrictedRole?.id ?? '',
      targetType: item.targetType === 'USER' || item.targetType === 'TEAM' ? item.targetType : '',
      targetId: item.target?.id ?? '',
      setPriority: item.setPriority ?? '',
      stopProcessing: item.stopProcessing ?? true,
    });
    fill(rule);
    try { const detail = await routingRulesApi.get(rule.id); setEditing(detail); fill(detail); }
    catch (err) { setError(err); }
  };

  const save = async () => {
    const nextErrors: FieldErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome da regra.';
    if (!canManage && !form.unitId) nextErrors.unitId = 'Selecione a unidade da regra.';
    if (!canManage && form.unitId && !actorUnitIds.has(form.unitId)) nextErrors.unitId = 'Você só pode criar regras para suas próprias unidades.';
    if (!Number.isInteger(form.priority) || form.priority < 0 || form.priority > 100000) nextErrors.priority = 'Informe uma prioridade entre 0 e 100000.';
    if (form.targetType && !form.targetId) nextErrors.targetId = 'Selecione o destino da atribuição automática.';
    if (!form.targetType && form.targetId) nextErrors.targetType = 'Selecione o tipo de destino.';
    if (!form.targetId && !form.setPriority) nextErrors.action = 'Defina um destino ou uma prioridade para a regra executar ao menos uma ação.';
    if (form.restrictedRoleId && form.targetType === 'TEAM' && form.targetId) {
      const selectedTeam = scopedTeams.find((team) => team.id === form.targetId);
      if (selectedTeam && !selectedTeam.isIndependent) nextErrors.targetId = 'Para evitar conflito de interesse, escolha uma equipe apta a receber casos com restrição.';
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true); setError(null); setSuccess('');
    try {
      if (editing) { await routingRulesApi.update(editing.id, form); setSuccess('Regra atualizada com sucesso.'); }
      else { await routingRulesApi.create(form); setSuccess('Regra criada com sucesso.'); }
      setFormOpen(false); await load();
    } catch (err) { setError(err); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (rule: RoutingRuleListItem) => {
    setActionId(rule.id); setError(null); setSuccess('');
    try { await routingRulesApi.setStatus(rule.id, !rule.active); setSuccess(rule.active ? 'Regra desativada.' : 'Regra ativada.'); await load(); }
    catch (err) { setError(err); }
    finally { setActionId(null); }
  };

  const destinationOptions = form.targetType === 'USER'
    ? scopedUsers
        .filter((item) => !form.unitId || item.units.some((unit) => unit.id === form.unitId))
        .map((item) => ({ id: item.id, name: `${item.name} — ${item.email}` }))
    : form.targetType === 'TEAM'
      ? scopedTeams
          .filter((item) => (!form.unitId || item.units.some((unit) => unit.id === form.unitId)) && (!form.restrictedRoleId || item.isIndependent))
          .map((item) => ({ id: item.id, name: `${item.name}${item.isIndependent ? ' — apta a casos com restrição' : ''}` }))
      : [];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administração" title="Regras de direcionamento" description={canManage ? 'Crie regras globais ou por unidade.' : 'Crie e edite somente regras das suas unidades; destinos de outras regiões não aparecem.'} actions={<div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button><Button size="sm" onClick={openCreate}><i className="bi bi-plus-lg" />Nova regra</Button></div>} />
      {!canManage ? <Alert tone="info"><strong>Escopo regional ativo.</strong> Toda regra do Responsável RH precisa estar vinculada a uma das suas unidades.</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}
      {error ? <ErrorAlert error={error} fallback="Não foi possível concluir a alteração nas regras de direcionamento." onRetry={() => void load()} /> : null}
      {referenceWarning ? <Alert tone="warning">Algumas opções não puderam ser carregadas agora. Atualize a página antes de criar ou editar uma regra.</Alert> : null}

      <Card className="p-5"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, categoria, unidade ou destino..." icon={<i className="bi bi-search" />} /><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="active">Ativas</option><option value="inactive">Inativas</option></Select></div></Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500"><strong className="text-slate-800">{filtered.length}</strong> regra(s)</div>
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : filtered.length ? (
          <div className="soft-scrollbar overflow-x-auto"><table className="min-w-[1200px] w-full text-left"><thead className="bg-slate-50"><tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400"><th className="px-5 py-3">Ordem</th><th className="px-5 py-3">Regra</th><th className="px-5 py-3">Quando usar</th><th className="px-5 py-3">Encaminhar para</th><th className="px-5 py-3">Prioridade da denúncia</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((rule, index) => (
            <tr key={rule.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{rule.order ?? index + 1}</span></td><td className="px-5 py-4"><div className="font-bold text-slate-900">{rule.name}</div>{rule.stopProcessing ? <div className="mt-1 text-xs font-semibold text-amber-700"><i className="bi bi-stop-circle mr-1" />Para após esta regra</div> : null}</td><td className="px-5 py-4"><div className="flex max-w-sm flex-wrap gap-1.5">{rule.category ? <Badge>{rule.category.name}</Badge> : null}{rule.unit ? <Badge>{rule.unit.name}</Badge> : null}{rule.reportMode ? <Badge tone="info">{modeLabel(rule.reportMode)}</Badge> : null}{rule.relationship ? <Badge>{relationshipLabel(rule.relationship)}</Badge> : null}{rule.restrictedRole ? <Badge tone="warning">Não encaminhar para: {rule.restrictedRole.name}</Badge> : null}{rule.immediateRisk === true ? <Badge tone="danger">Com risco imediato</Badge> : null}{rule.immediateRisk === false ? <Badge>Sem risco imediato</Badge> : null}{!rule.category && !rule.unit && !rule.reportMode && !rule.relationship && !rule.restrictedRole && rule.immediateRisk == null ? <span className="text-sm text-slate-400">Aplica-se a todas</span> : null}</div></td><td className="px-5 py-4"><div className="text-sm font-semibold text-slate-700">{rule.target?.name ?? '—'}</div>{rule.targetType ? <div className="mt-1 text-xs text-slate-400">{rule.targetType === 'TEAM' ? 'Equipe' : rule.targetType === 'USER' ? 'Pessoa' : 'Destino automático'}</div> : null}</td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{priorityLabel(rule.setPriority)}</td><td className="px-5 py-4"><Badge tone={rule.active ? 'success' : 'neutral'}>{rule.active ? 'Ativa' : 'Inativa'}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => void openEdit(rule)} title="Editar"><i className="bi bi-pencil" /></button><button disabled={actionId === rule.id} className={`flex h-9 w-9 items-center justify-center rounded-lg ${rule.active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => void toggleStatus(rule)} title={rule.active ? 'Desativar' : 'Ativar'}><i className={`bi ${rule.active ? 'bi-pause-circle' : 'bi-play-circle'}`} /></button></div></td></tr>
          ))}</tbody></table></div>
        ) : <EmptyState title="Nenhuma regra encontrada" description="Crie uma regra para automatizar o direcionamento das denúncias." />}
      </Card>

      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)} title={editing ? 'Editar regra de direcionamento' : 'Nova regra de direcionamento'} description="Escolha quando a regra deve ser usada e o que o sistema deve fazer automaticamente." size="lg" footer={<><Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} loading={saving} disabled={!form.name.trim() || (!form.targetId && !form.setPriority)}>Salvar regra</Button></>}>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]"><Input name="routingRuleName" label="Nome da regra" value={form.name} error={formErrors.name} onChange={(event) => { setFormErrors((current) => ({ ...current, name: '' })); setForm((current) => ({ ...current, name: event.target.value })); }} placeholder="Ex.: Assédio da unidade industrial" /><Input name="routingRulePriority" label="Ordem de execução" type="number" min={0} max={100000} value={form.priority} error={formErrors.priority} onChange={(event) => { setFormErrors((current) => ({ ...current, priority: '' })); setForm((current) => ({ ...current, priority: Number(event.target.value) })); }} hint="Quanto menor o número, mais cedo esta regra será verificada." /></div>
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Quando esta regra deve ser usada</p><div className="grid gap-4 sm:grid-cols-2"><Select label="Categoria" value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Qualquer categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label={canManage ? "Unidade" : "Unidade *"} value={form.unitId} error={formErrors.unitId} onChange={(event) => { setFormErrors((current) => ({ ...current, unitId: '', targetId: '' })); setForm((current) => ({ ...current, unitId: event.target.value, targetId: '' })); }}><option value="">{canManage ? 'Qualquer unidade' : 'Selecione a unidade'}</option>{scopedUnits.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label="Modo da denúncia" value={form.reportMode} onChange={(event) => setForm((current) => ({ ...current, reportMode: event.target.value }))}><option value="">Qualquer modo</option><option value="ANONYMOUS">Anônima</option><option value="IDENTIFIED">Identificada</option></Select><Select label="Relacionamento" value={form.relationship} onChange={(event) => setForm((current) => ({ ...current, relationship: event.target.value }))}><option value="">Qualquer relacionamento</option><option value="EMPLOYEE">Colaborador(a)</option><option value="FORMER_EMPLOYEE">Ex-colaborador(a)</option><option value="SUPPLIER">Fornecedor(a)</option><option value="CUSTOMER">Cliente</option><option value="OTHER">Outro</option></Select><Select label="Risco imediato" value={form.immediateRisk} onChange={(event) => setForm((current) => ({ ...current, immediateRisk: event.target.value as '' | 'true' | 'false' }))}><option value="">Qualquer</option><option value="true">Sim</option><option value="false">Não</option></Select><Select label="Perfil que não deve receber" value={form.restrictedRoleId} onChange={(event) => setForm((current) => ({ ...current, restrictedRoleId: event.target.value }))}><option value="">Nenhum</option>{scopedRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></div></div>
          <div className="border-t border-slate-100 pt-5"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">O que o sistema deve fazer</p>{formErrors.action ? <span className="text-xs font-semibold text-red-600">{formErrors.action}</span> : null}</div><div className="grid gap-4 sm:grid-cols-2"><Select name="targetType" label="Encaminhar para" value={form.targetType} error={formErrors.targetType} onChange={(event) => { setFormErrors((current) => ({ ...current, targetType: '', targetId: '', action: '' })); setForm((current) => ({ ...current, targetType: event.target.value as '' | 'USER' | 'TEAM', targetId: '' })); }}><option value="">Sem atribuição automática</option><option value="USER">Pessoa</option><option value="TEAM">Equipe</option></Select><Select name="targetId" label="Pessoa ou equipe" value={form.targetId} error={formErrors.targetId} disabled={!form.targetType} onChange={(event) => { setFormErrors((current) => ({ ...current, targetId: '', action: '' })); setForm((current) => ({ ...current, targetId: event.target.value })); }}><option value="">Selecione...</option>{destinationOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label="Prioridade a definir" value={form.setPriority} onChange={(event) => { setFormErrors((current) => ({ ...current, action: '' })); setForm((current) => ({ ...current, setPriority: event.target.value })); }}><option value="">Não alterar prioridade</option><option value="LOW">Baixa</option><option value="NORMAL">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></Select><label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-slate-200 px-4 py-2.5"><input type="checkbox" checked={form.stopProcessing} onChange={(event) => setForm((current) => ({ ...current, stopProcessing: event.target.checked }))} /><span><span className="block text-sm font-semibold text-slate-700">Parar após aplicar esta regra</span><span className="block text-xs text-slate-500">Quando esta opção estiver marcada, o sistema não verificará as regras seguintes.</span></span></label></div></div>
          <Alert tone="info">Escolha pelo menos uma ação: encaminhar a denúncia para alguém ou alterar sua prioridade. Se houver um perfil com restrição, somente equipes aptas a receber casos com restrição poderão ser escolhidas.</Alert>
        </div>
      </Modal>
    </div>
  );
}
