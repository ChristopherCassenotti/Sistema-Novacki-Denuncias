import { useCallback, useEffect, useMemo, useState } from 'react';
import { unitsAdminApi, usersApi } from '../../api/adminManagement';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import type { AdminUnitFormData, AdminUnitListItem } from '../../types/management';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';
import { isValidEmail, type FieldErrors } from '../../utils/validation';

const emptyForm: AdminUnitFormData = { name: '', notificationEmail: '' };

export function UnitsPage() {
  const { user: actor } = useAuth();
  const canManage = useCan(ACCESS.units);
  const [items, setItems] = useState<AdminUnitListItem[]>([]);
  const [actorUnitIds, setActorUnitIds] = useState<Set<string>>(new Set<string>((actor?.units ?? []).map((unit) => unit.id)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUnitListItem | null>(null);
  const [form, setForm] = useState<AdminUnitFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [unitResult, userResult] = await Promise.allSettled([unitsAdminApi.list(), usersApi.list()]);
    if (unitResult.status === 'fulfilled') setItems(unitResult.value); else setError(unitResult.reason);
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

  const scopedItems = useMemo(() => canManage ? items : items.filter((item) => actorUnitIds.has(item.id)), [actorUnitIds, items, canManage]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scopedItems.filter((item) => !term || [item.name, item.code, item.notificationEmail].some((value) => value.toLowerCase().includes(term)));
  }, [scopedItems, search]);

  const openCreate = () => { if (!canManage) return; setEditing(null); setForm(emptyForm); setFormErrors({}); setError(null); setSuccess(''); setFormOpen(true); };
  const openEdit = (item: AdminUnitListItem) => { if (!canManage && !actorUnitIds.has(item.id)) return; setEditing(item); setForm({ name: item.name, notificationEmail: item.notificationEmail }); setFormErrors({}); setError(null); setSuccess(''); setFormOpen(true); };

  const save = async () => {
    const nextErrors: FieldErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome da unidade.';
    if (!form.notificationEmail.trim()) nextErrors.notificationEmail = 'Informe o e-mail responsável pela unidade.';
    else if (!isValidEmail(form.notificationEmail)) nextErrors.notificationEmail = 'Informe um endereço de e-mail válido.';
    setFormErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setSaving(true); setError(null); setSuccess('');
    try {
      if (editing) { await unitsAdminApi.update(editing.id, form); setSuccess('Unidade atualizada com sucesso.'); }
      else if (canManage) { await unitsAdminApi.create(form); setSuccess('Unidade criada com sucesso.'); }
      setFormOpen(false); await load();
    } catch (currentError) { setError(currentError); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (item: AdminUnitListItem) => {
    if (!canManage) return;
    setActionId(item.id); setError(null); setSuccess('');
    try { await unitsAdminApi.setStatus(item.id, !item.active); setSuccess(item.active ? 'Unidade desativada.' : 'Unidade ativada.'); await load(); }
    catch (currentError) { setError(currentError); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administração" title="Unidades" description={canManage ? 'Gerencie toda a estrutura de unidades e os e-mails responsáveis.' : 'Consulte e atualize somente os dados operacionais das unidades sob sua responsabilidade.'} actions={<div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button>{canManage ? <Button size="sm" onClick={openCreate}><i className="bi bi-plus-lg" />Nova unidade</Button> : null}</div>} />
      <Alert tone="info">As unidades e as operações disponíveis seguem suas permissões e o escopo autorizado pelo servidor.</Alert>
      {success ? <Alert tone="success">{success}</Alert> : null}
      {error ? <ErrorAlert error={error} fallback="Não foi possível concluir a operação da unidade." onRetry={() => void load()} /> : null}
      <Card className="p-5"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, código ou e-mail responsável..." icon={<i className="bi bi-search" />} /></Card>
      <Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500"><strong className="text-slate-800">{filtered.length}</strong> unidade(s)</div>{loading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div> : filtered.length ? <div className="soft-scrollbar overflow-x-auto"><table className="min-w-[900px] w-full text-left"><thead className="bg-slate-50"><tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400"><th className="px-5 py-3">Unidade</th><th className="px-5 py-3">Código interno</th><th className="px-5 py-3">E-mail responsável</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><i className="bi bi-buildings" /></span><div className="font-bold text-slate-900">{item.name}</div></div></td><td className="px-5 py-4 text-sm font-medium text-slate-500">{item.code}</td><td className="px-5 py-4 text-sm text-slate-600">{item.notificationEmail || '—'}</td><td className="px-5 py-4"><Badge tone={item.active ? 'success' : 'neutral'}>{item.active ? 'Ativa' : 'Inativa'}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => openEdit(item)} title="Editar"><i className="bi bi-pencil" /></button>{canManage ? <button disabled={actionId === item.id} className={`flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-30 ${item.active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => void toggleStatus(item)} title={item.active ? 'Desativar' : 'Ativar'}><i className={`bi ${item.active ? 'bi-slash-circle' : 'bi-check-circle'}`} /></button> : null}</div></td></tr>)}</tbody></table></div> : <EmptyState title="Nenhuma unidade encontrada" description="Não há unidades disponíveis no seu escopo." />}</Card>
      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)} title={editing ? 'Editar unidade' : 'Nova unidade'} description={canManage ? 'O código interno permanece estável mesmo se o nome mudar.' : 'As alterações afetam somente esta unidade.'} footer={<><Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} loading={saving} disabled={!form.name.trim() || !form.notificationEmail.trim()}>Salvar</Button></>}><div className="space-y-4"><Input name="unitName" label="Nome da unidade *" value={form.name} error={formErrors.name} onChange={(event) => { setFormErrors((current) => ({ ...current, name: '' })); setForm((current) => ({ ...current, name: event.target.value })); }} placeholder="Ex.: M1 Porto União" /><Input name="notificationEmail" type="email" label="E-mail responsável *" value={form.notificationEmail} error={formErrors.notificationEmail} onChange={(event) => { setFormErrors((current) => ({ ...current, notificationEmail: '' })); setForm((current) => ({ ...current, notificationEmail: event.target.value })); }} placeholder="rh@empresa.com.br" hint="Usado nos avisos de nova denúncia e nova mensagem desta unidade." /></div></Modal>
    </div>
  );
}
