import { useCallback, useEffect, useMemo, useState } from 'react';
import { retentionApi } from '../../api/governance';
import { referencesApi } from '../../api/references';
import { usersApi } from '../../api/adminManagement';
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
import { useAuth } from '../../context/AuthContext';
import type { RetentionPolicy, RetentionPolicyFormData } from '../../types/governance';
import type { NamedReference } from '../../types/reports';
import { formatDateTime } from '../../utils/format';
import { retentionActionLabel } from '../../utils/displayLabels';
import { reportStatusLabel } from '../../utils/reportLabels';
import { isFullyWithinUnitScope } from '../../utils/accessScope';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';
import type { FieldErrors } from '../../utils/validation';

const initialForm: RetentionPolicyFormData = { name: '', categoryId: '', unitIds: [], applicableStatus: 'CONCLUDED', retentionDays: 1825, action: 'ANONYMIZE', active: true };

export function RetentionPoliciesPage() {
  const { user: actor } = useAuth();
  const canManage = useCan(ACCESS.retention);
  const [items, setItems] = useState<RetentionPolicy[]>([]);
  const [categories, setCategories] = useState<NamedReference[]>([]);
  const [units, setUnits] = useState<NamedReference[]>([]);
  const [actorUnitIds, setActorUnitIds] = useState<Set<string>>(new Set<string>((actor?.units ?? []).map((unit) => unit.id)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [actionError, setActionError] = useState<unknown | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RetentionPolicy | null>(null);
  const [form, setForm] = useState<RetentionPolicyFormData>(initialForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [policyResult, categoryResult, unitResult, userResult] = await Promise.allSettled([
      retentionApi.policies(), referencesApi.categories(), referencesApi.units(), usersApi.list(),
    ]);
    if (policyResult.status === 'fulfilled') setItems(policyResult.value); else { setError(policyResult.reason); setItems([]); }
    if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value);
    if (unitResult.status === 'fulfilled') setUnits(unitResult.value);
    if (!canManage) {
      const ids = new Set<string>((actor?.units ?? []).map((unit) => unit.id));
      if (!ids.size && userResult.status === 'fulfilled') userResult.value.find((user) => user.id === actor?.id)?.units.forEach((unit) => ids.add(unit.id));
      setActorUnitIds(ids);
    }
    setLoading(false);
  }, [actor?.id, actor?.units, canManage]);

  useEffect(() => { void load(); }, [load]);

  const unitOptions = useMemo(() => canManage ? units : units.filter((unit) => actorUnitIds.has(unit.id)), [actorUnitIds, canManage, units]);
  const visibleItems = useMemo(() => canManage ? items : items.filter((item) => !item.units.length || isFullyWithinUnitScope(actorUnitIds, item.units.map((unit) => unit.id))), [actorUnitIds, items, canManage]);
  const canManageItem = (item: RetentionPolicy) => canManage || (item.units.length > 0 && item.units.every((unit) => actorUnitIds.has(unit.id)));

  const create = () => { setEditing(null); setForm({ ...initialForm, unitIds: !canManage && unitOptions.length === 1 ? [unitOptions[0].id] : [] }); setFormErrors({}); setActionError(null); setOpen(true); };
  const edit = (item: RetentionPolicy) => {
    if (!canManageItem(item)) return;
    setEditing(item);
    setForm({ name: item.name, categoryId: item.category?.id ?? '', unitIds: item.units.map((unit) => unit.id), applicableStatus: item.applicableStatus === 'ARCHIVED' ? 'ARCHIVED' : 'CONCLUDED', retentionDays: item.retentionDays, action: item.action === 'DELETE' ? 'DELETE' : 'ANONYMIZE', active: item.active });
    setFormErrors({}); setActionError(null); setOpen(true);
  };
  const toggleUnit = (id: string) => { setFormErrors((v) => ({ ...v, units: '' })); setForm((v) => ({ ...v, unitIds: v.unitIds.includes(id) ? v.unitIds.filter((item) => item !== id) : [...v.unitIds, id] })); };

  const save = async () => {
    const nextErrors: FieldErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome da regra.';
    if (!form.applicableStatus) nextErrors.applicableStatus = 'Selecione a situação da denúncia.';
    if (!Number.isFinite(form.retentionDays) || form.retentionDays <= 0) nextErrors.retentionDays = 'Informe uma quantidade de dias maior que zero.';
    if (!canManage && !form.unitIds.length) nextErrors.units = 'Selecione pelo menos uma unidade.';
    if (!canManage && form.unitIds.some((id) => !actorUnitIds.has(id))) nextErrors.units = 'Você só pode configurar prazos para suas próprias unidades.';
    setFormErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setSaving(true); setActionError(null);
    try {
      if (editing) { await retentionApi.updatePolicy(editing.id, form); if (editing.active !== form.active) await retentionApi.setPolicyStatus(editing.id, form.active); }
      else await retentionApi.createPolicy(form);
      setOpen(false); await load();
    } catch (err) { setActionError(err); }
    finally { setSaving(false); }
  };

  const toggle = async (item: RetentionPolicy) => {
    if (!canManageItem(item)) return;
    setActionError(null);
    try { await retentionApi.setPolicyStatus(item.id, !item.active); await load(); }
    catch (err) { setActionError(err); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Controle e segurança" title="Prazos de guarda" description={canManage ? 'Defina políticas globais ou por unidade.' : 'Gerencie prazos apenas das suas unidades; regras globais aparecem somente para consulta.'} actions={<Button onClick={create}><i className="bi bi-plus-lg" />Nova regra</Button>} />
      {!canManage ? <Alert tone="info"><strong>Escopo regional ativo.</strong> Uma regra criada por você sempre precisa estar vinculada às suas unidades. Regras globais não podem ser alteradas pelo RH regional.</Alert> : null}
      {error ? <ErrorAlert error={error} fallback="Não foi possível carregar os prazos de guarda." onRetry={() => void load()} /> : null}
      {actionError && !open ? <ErrorAlert error={actionError} fallback="Não foi possível atualizar esta regra de guarda." /> : null}

      <Card className="overflow-hidden">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : visibleItems.length ? <div className="soft-scrollbar overflow-x-auto"><table className="w-full min-w-[1120px]"><thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Regra</th><th className="px-5 py-3">Unidades</th><th className="px-5 py-3">Categoria</th><th className="px-5 py-3">Quando se aplica</th><th className="px-5 py-3">Tempo de guarda</th><th className="px-5 py-3">Depois do prazo</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3" /></tr></thead><tbody>{visibleItems.map((item) => { const manageable = canManageItem(item); return <tr key={item.id} className="border-t border-slate-100"><td className="px-5 py-4"><p className="font-bold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-400">Atualizada {formatDateTime(item.updatedAt ?? item.createdAt)}</p></td><td className="px-5 py-4"><div className="flex max-w-64 flex-wrap gap-1.5">{item.units.length ? item.units.map((unit) => <Badge key={unit.id}>{unit.name}</Badge>) : <Badge tone="warning">Regra global</Badge>}</div></td><td className="px-5 py-4 text-sm text-slate-600">{item.category?.name ?? 'Todas'}</td><td className="px-5 py-4"><Badge>{reportStatusLabel(item.applicableStatus)}</Badge></td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{item.retentionDays} dias</td><td className="px-5 py-4"><Badge tone={item.action === 'DELETE' ? 'danger' : 'info'}>{retentionActionLabel(item.action)}</Badge></td><td className="px-5 py-4"><Badge tone={item.active ? 'success' : 'neutral'}>{item.active ? 'Ativa' : 'Inativa'}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1">{manageable ? <><Button variant="ghost" size="sm" onClick={() => edit(item)}><i className="bi bi-pencil" />Editar</Button><Button variant="ghost" size="sm" onClick={() => void toggle(item)}>{item.active ? 'Desativar' : 'Ativar'}</Button></> : <span className="text-xs font-semibold text-slate-400">Somente consulta</span>}</div></td></tr>; })}</tbody></table></div> : <EmptyState icon="bi-archive" title="Nenhuma regra de guarda" description="Crie a primeira regra para suas unidades." action={<Button onClick={create}>Criar regra</Button>} />}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar regra de guarda' : 'Nova regra de guarda'} description="Defina as unidades, o prazo e o que deve acontecer com os dados." footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={saving} disabled={!form.name.trim() || !form.applicableStatus || form.retentionDays <= 0 || (!canManage && !form.unitIds.length)} onClick={() => void save()}>Salvar regra</Button></>}>
        <div className="space-y-4">
          {actionError ? <ErrorAlert error={actionError} fallback="Não foi possível salvar esta regra." /> : null}
          <Input name="policyName" label="Nome da regra" value={form.name} error={formErrors.name} onChange={(e) => { setFormErrors((v) => ({ ...v, name: '' })); setForm((v) => ({ ...v, name: e.target.value })); }} placeholder="Ex.: Denúncias concluídas — 5 anos" />
          <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">Unidades {canManage ? '(vazio = regra global)' : '*'}</p><span className="text-xs text-slate-400">{form.unitIds.length} selecionada(s)</span></div><div className="grid gap-2 sm:grid-cols-2">{unitOptions.map((unit) => <label key={unit.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${form.unitIds.includes(unit.id) ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="checkbox" checked={form.unitIds.includes(unit.id)} onChange={() => toggleUnit(unit.id)} /><span className="text-sm font-semibold text-slate-800">{unit.name}</span></label>)}</div>{formErrors.units ? <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.units}</p> : null}</div>
          <Select label="Categoria" value={form.categoryId} onChange={(e) => setForm((v) => ({ ...v, categoryId: e.target.value }))}><option value="">Todas as categorias</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select label="Situação da denúncia *" value={form.applicableStatus} error={formErrors.applicableStatus} onChange={(e) => { setFormErrors((v) => ({ ...v, applicableStatus: '' })); setForm((v) => ({ ...v, applicableStatus: e.target.value })); }}><option value="CONCLUDED">Concluída</option><option value="ARCHIVED">Arquivada</option></Select>
          <Input name="retentionDays" label="Prazo em dias" type="number" min={1} value={form.retentionDays} error={formErrors.retentionDays} onChange={(e) => { setFormErrors((v) => ({ ...v, retentionDays: '' })); setForm((v) => ({ ...v, retentionDays: Number(e.target.value) })); }} hint="Ex.: 1825 dias = aproximadamente 5 anos." />
          <Select label="O que fazer após o prazo" value={form.action} onChange={(e) => setForm((v) => ({ ...v, action: e.target.value as 'DELETE' | 'ANONYMIZE' }))}><option value="ANONYMIZE">Ocultar dados pessoais</option><option value="DELETE">Excluir dados</option></Select>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><input type="checkbox" checked={form.active} onChange={(e) => setForm((v) => ({ ...v, active: e.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300" /><span><span className="block text-sm font-bold text-slate-800">Regra ativa</span><span className="mt-1 block text-xs leading-5 text-slate-500">Quando ativa, esta regra pode ser aplicada automaticamente às denúncias do escopo selecionado.</span></span></label>
        </div>
      </Modal>
    </div>
  );
}
