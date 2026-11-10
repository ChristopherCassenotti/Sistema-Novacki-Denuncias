import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorAlert } from '../ui/ErrorAlert';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PageHeader } from '../ui/PageHeader';
import { Skeleton } from '../ui/Skeleton';
import { Textarea } from '../ui/Textarea';
import type { CatalogItem } from '../../types/management';

type CatalogApi = {
  configured: boolean;
  list: () => Promise<CatalogItem[]>;
  create: (data: { name: string; code?: string; description?: string }) => Promise<void>;
  update: (id: string, data: { name: string; code?: string; description?: string }) => Promise<void>;
  setStatus: (id: string, active: boolean) => Promise<void>;
};

type Props = {
  title: string;
  singular: string;
  description: string;
  icon: string;
  api: CatalogApi;
  canManage?: boolean;
  scopeNote?: string;
};

const emptyForm = { name: '', code: '', description: '' };

export function AdminCatalogPage({ title, singular, description, icon, api, canManage = true, scopeNote }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await api.list()); }
    catch (err) { setError(err); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => !term || [item.name, item.code, item.description].some((value) => value?.toLowerCase().includes(term)));
  }, [items, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setNameError(''); setError(null); setSuccess(''); setFormOpen(true); };
  const openEdit = (item: CatalogItem) => { setEditing(item); setForm({ name: item.name, code: item.code ?? '', description: item.description ?? '' }); setNameError(''); setError(null); setSuccess(''); setFormOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { setNameError(`Informe o nome da ${singular.toLowerCase()}.`); return; }
    setNameError('');
    setSaving(true); setError(null); setSuccess('');
    try {
      const payload = { name: form.name.trim(), code: form.code.trim() || undefined, description: form.description.trim() || undefined };
      if (editing) { await api.update(editing.id, payload); setSuccess(`${singular} atualizada com sucesso.`); }
      else { await api.create(payload); setSuccess(`${singular} criada com sucesso.`); }
      setFormOpen(false); await load();
    } catch (err) { setError(err); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (item: CatalogItem) => {
    setActionId(item.id); setError(null); setSuccess('');
    try { await api.setStatus(item.id, !item.active); setSuccess(`${singular} ${item.active ? 'desativada' : 'ativada'}.`); await load(); }
    catch (err) { setError(err); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administração" title={title} description={description} actions={<div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button>{canManage ? <Button size="sm" onClick={openCreate} disabled={!api.configured || !canManage}><i className="bi bi-plus-lg" />Nova {singular.toLowerCase()}</Button> : null}</div>} />

      {scopeNote ? <Alert tone="info">{scopeNote}</Alert> : null}
      {!api.configured || !canManage ? <Alert tone="info"><strong>Esta área está disponível apenas para consulta.</strong> {canManage ? 'No momento, você pode visualizar os itens, mas o endpoint de edição ainda não está configurado.' : 'Alterações globais ficam reservadas ao Administrador Geral para não afetar outras unidades.'}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}
      {error ? <ErrorAlert error={error} fallback={`Não foi possível concluir a operação de ${title.toLowerCase()}.`} onRetry={() => void load()} /> : null}

      <Card className="p-5"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${title.toLowerCase()}...`} icon={<i className="bi bi-search" />} /></Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500"><strong className="text-slate-800">{filtered.length}</strong> {filtered.length === 1 ? 'registro' : 'registros'}</div>
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div> : filtered.length ? (
          <div className="soft-scrollbar overflow-x-auto"><table className="min-w-[760px] w-full text-left"><thead className="bg-slate-50"><tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400"><th className="px-5 py-3">{singular}</th><th className="px-5 py-3">Código</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><i className={`bi ${icon}`} /></span><div><p className="font-bold text-slate-900">{item.name}</p>{item.description ? <p className="mt-1 max-w-xl text-sm text-slate-500">{item.description}</p> : null}</div></div></td><td className="px-5 py-4 text-sm font-medium text-slate-500">{item.code ?? '—'}</td><td className="px-5 py-4"><Badge tone={item.active ? 'success' : 'neutral'}>{item.active ? 'Ativa' : 'Inativa'}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button disabled={!api.configured || !canManage} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30" onClick={() => openEdit(item)} title="Editar"><i className="bi bi-pencil" /></button><button disabled={!api.configured || !canManage || actionId === item.id} className={`flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-30 ${item.active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => void toggleStatus(item)} title={item.active ? 'Desativar' : 'Ativar'}><i className={`bi ${item.active ? 'bi-slash-circle' : 'bi-check-circle'}`} /></button></div></td></tr>)}</tbody></table></div>
        ) : <EmptyState title={`Nenhuma ${singular.toLowerCase()} encontrada`} description="Os registros disponíveis aparecerão aqui." />}
      </Card>

      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)} title={editing ? `Editar ${singular.toLowerCase()}` : `Nova ${singular.toLowerCase()}`} description="Preencha as informações abaixo." footer={<><Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} loading={saving} disabled={!form.name.trim()}>Salvar</Button></>}>
        <div className="space-y-4"><Input name="catalogName" label="Nome" value={form.name} error={nameError} onChange={(event) => { setNameError(''); setForm((current) => ({ ...current, name: event.target.value })); }} /><Input label="Código interno (opcional)" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} hint="Preencha somente se sua empresa já utiliza um código para este item." /><Textarea label="Descrição" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} /></div>
      </Modal>
    </div>
  );
}
