import { useCallback, useEffect, useMemo, useState } from 'react';
import { teamsApi, usersApi } from '../../api/adminManagement';
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
import { Textarea } from '../../components/ui/Textarea';
import { useAuth } from '../../context/AuthContext';
import type { NamedReference } from '../../types/reports';
import type { AdminUserListItem, TeamFormData, TeamListItem, TeamMemberRole } from '../../types/management';
import { isFullyWithinUnitScope, sharesUnit } from '../../utils/accessScope';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';

const emptyForm: TeamFormData = { name: '', description: '', isIndependent: false, unitIds: [], members: [] };

export function TeamsPage() {
  const { user: actor } = useAuth();
  const canManage = useCan(ACCESS.teams);
  const canUsers = useCan(ACCESS.users);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [unitOptions, setUnitOptions] = useState<NamedReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamListItem | null>(null);
  const [form, setForm] = useState<TeamFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [unitError, setUnitError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [teamResult, userResult, unitsResult] = await Promise.allSettled([teamsApi.list(), canUsers ? usersApi.list() : Promise.resolve([]), referencesApi.units()]);
    if (teamResult.status === 'fulfilled') setTeams(teamResult.value); else setError(teamResult.reason);
    if (userResult.status === 'fulfilled') setUsers(userResult.value.filter((user) => user.active));
    else if (teamResult.status === 'fulfilled') setError(userResult.reason);
    if (unitsResult.status === 'fulfilled') setUnitOptions(unitsResult.value); else setError((current: unknown) => current ?? unitsResult.reason);
    setLoading(false);
  }, [canUsers]);

  useEffect(() => { void load(); }, [load]);

  const actorUnitIds = useMemo(() => {
    const ids = new Set<string>((actor?.units ?? []).map((unit) => unit.id));
    if (ids.size || canManage) return ids;
    users.find((item) => item.id === actor?.id)?.units.forEach((unit) => ids.add(unit.id));
    return ids;
  }, [actor?.id, actor?.units, canManage, users]);

  const availableUnits = useMemo(
    () => canManage ? unitOptions : unitOptions.filter((unit) => actorUnitIds.has(unit.id)),
    [actorUnitIds, canManage, unitOptions],
  );

  const scopedTeams = useMemo(() => {
    if (canManage) return teams;
    if (!actorUnitIds.size) return [];
    return teams.filter((team) => isFullyWithinUnitScope(actorUnitIds, team.units.map((unit) => unit.id)));
  }, [actorUnitIds, canManage, teams]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scopedTeams.filter((team) => !term || [team.name, ...team.units.map((unit) => unit.name), ...team.members.map((member) => member.name)].some((value) => value.toLowerCase().includes(term)));
  }, [scopedTeams, search]);

  const eligibleUsers = useMemo(() => {
    const selectedUnits = new Set<string>(form.unitIds);
    return users.filter((user) => {
      if (!canManage && !isFullyWithinUnitScope(actorUnitIds, user.units.map((unit) => unit.id))) return false;
      if (!selectedUnits.size) return false;
      return sharesUnit(selectedUnits, user.units.map((unit) => unit.id));
    });
  }, [actorUnitIds, form.unitIds, canManage, users]);

  const visibleUsers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    return eligibleUsers.filter((user) => !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term));
  }, [eligibleUsers, memberSearch]);

  const formFromTeam = (team: TeamListItem): TeamFormData => ({
    name: team.name,
    description: team.description ?? '',
    isIndependent: team.isIndependent,
    unitIds: team.units.map((unit) => unit.id),
    members: team.members.map((member) => ({ userId: member.id, role: member.teamRole })),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setNameError(''); setUnitError(''); setMemberSearch(''); setFormOpen(true); setError(null); setSuccess(''); };
  const openEdit = async (team: TeamListItem) => {
    if (!canManage && !isFullyWithinUnitScope(actorUnitIds, team.units.map((unit) => unit.id))) return;
    setEditing(team); setForm(formFromTeam(team)); setNameError(''); setUnitError(''); setMemberSearch(''); setFormOpen(true); setError(null); setSuccess('');
    try { const detail = await teamsApi.get(team.id); setEditing(detail); setForm(formFromTeam(detail)); }
    catch (err) { setError(err); }
  };

  const toggleUnit = (id: string) => {
    setUnitError('');
    setForm((current) => {
      const unitIds = current.unitIds.includes(id) ? current.unitIds.filter((item) => item !== id) : [...current.unitIds, id];
      const unitSet = new Set<string>(unitIds);
      const members = current.members.filter((member) => {
        const user = users.find((item) => item.id === member.userId);
        return Boolean(user && sharesUnit(unitSet, user.units.map((unit) => unit.id)));
      });
      return { ...current, unitIds, members };
    });
  };

  const selectedMember = (id: string) => form.members.find((member) => member.userId === id);
  const toggleMember = (id: string) => setForm((current) => ({
    ...current,
    members: current.members.some((member) => member.userId === id)
      ? current.members.filter((member) => member.userId !== id)
      : [...current.members, { userId: id, role: 'MEMBER' }],
  }));
  const setMemberRole = (id: string, role: TeamMemberRole) => setForm((current) => ({
    ...current,
    members: current.members.map((member) => member.userId === id ? { ...member, role } : member),
  }));

  const save = async () => {
    if (form.name.trim().length < 3) { setNameError('Informe um nome com pelo menos 3 caracteres.'); return; }
    if (!form.unitIds.length) { setUnitError('Selecione pelo menos uma unidade para esta equipe.'); return; }
    if (!canManage && form.unitIds.some((id) => !actorUnitIds.has(id))) { setUnitError('Você só pode vincular a equipe às suas próprias unidades.'); return; }
    setNameError(''); setUnitError(''); setSaving(true); setError(null); setSuccess('');
    try {
      if (editing) { await teamsApi.update(editing.id, form); setSuccess('Equipe atualizada com sucesso.'); }
      else { await teamsApi.create(form); setSuccess('Equipe criada com sucesso.'); }
      setFormOpen(false); await load();
    } catch (err) { setError(err); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (team: TeamListItem) => {
    setActionId(team.id); setError(null); setSuccess('');
    try { await teamsApi.setStatus(team.id, !team.active); setSuccess(team.active ? 'Equipe desativada.' : 'Equipe ativada.'); await load(); }
    catch (err) { setError(err); }
    finally { setActionId(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administração" title="Equipes" description={canManage ? 'Organize equipes e defina suas unidades.' : 'Organize somente equipes das suas unidades. Membros de outras regiões não aparecem para seleção.'} actions={<div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button><Button size="sm" onClick={openCreate}><i className="bi bi-plus-lg" />Nova equipe</Button></div>} />
      {!canManage ? <Alert tone="info"><strong>Escopo regional ativo.</strong> Equipes e membros ficam limitados às suas unidades.</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}
      {error ? <ErrorAlert error={error} fallback="Não foi possível concluir a alteração na equipe." onRetry={() => void load()} /> : null}
      <Card className="p-5"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar equipe, unidade ou membro..." icon={<i className="bi bi-search" />} /></Card>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {loading ? Array.from({ length: 6 }).map((_, index) => <Card key={index} className="p-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-4 h-16 w-full" /></Card>) : filtered.length ? filtered.map((team) => (
          <Card key={team.id} className="p-5">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold text-slate-900">{team.name}</h2><Badge tone={team.active ? 'success' : 'neutral'}>{team.active ? 'Ativa' : 'Inativa'}</Badge>{team.isIndependent ? <Badge tone="info">Apta a casos com restrição</Badge> : null}</div><div className="mt-2 flex flex-wrap gap-1.5">{team.units.length ? team.units.map((unit) => <Badge key={unit.id}>{unit.name}</Badge>) : <Badge tone="warning">Sem unidade definida</Badge>}</div><p className="mt-2 text-sm text-slate-500">{team.memberCount} {team.memberCount === 1 ? 'membro' : 'membros'}</p>{team.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-500">{team.description}</p> : null}</div><div className="flex gap-1"><button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => void openEdit(team)} title="Editar"><i className="bi bi-pencil" /></button><button className={`flex h-9 w-9 items-center justify-center rounded-lg ${team.active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} disabled={actionId === team.id} onClick={() => void toggleStatus(team)} title={team.active ? 'Desativar' : 'Ativar'}><i className={`bi ${team.active ? 'bi-slash-circle' : 'bi-check-circle'}`} /></button></div></div>
            <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Membros</p>{team.members.length ? <div className="flex flex-wrap gap-2">{team.members.slice(0, 6).map((member) => <span key={member.id} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">{member.name} · {member.teamRole === 'COORDINATOR' ? 'Coordenador' : 'Membro'}</span>)}{team.members.length > 6 ? <span className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700">+{team.members.length - 6}</span> : null}</div> : <p className="text-sm text-slate-400">Nenhum membro atribuído.</p>}</div>
          </Card>
        )) : <div className="lg:col-span-2 2xl:col-span-3"><Card><EmptyState title="Nenhuma equipe encontrada" description="Cadastre uma equipe da sua unidade ou altere a busca." /></Card></div>}
      </div>

      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)} title={editing ? 'Editar equipe' : 'Nova equipe'} description="Defina a unidade da equipe antes de escolher seus integrantes." size="lg" footer={<><Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} loading={saving} disabled={form.name.trim().length < 3 || !form.unitIds.length}>{editing ? 'Salvar alterações' : 'Criar equipe'}</Button></>}>
        <div className="space-y-5">
          <Input name="teamName" label="Nome da equipe" value={form.name} error={nameError} onChange={(event) => { setNameError(''); setForm((current) => ({ ...current, name: event.target.value })); }} placeholder="Ex.: RH M1" />
          <Textarea label="Descrição" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descreva a função desta equipe (opcional)." />

          <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">Unidades *</p><span className="text-xs text-slate-400">{form.unitIds.length} selecionada(s)</span></div><div className="grid gap-2 sm:grid-cols-2">{availableUnits.map((unit) => <label key={unit.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${form.unitIds.includes(unit.id) ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="checkbox" checked={form.unitIds.includes(unit.id)} onChange={() => toggleUnit(unit.id)} /><span className="text-sm font-semibold text-slate-800">{unit.name}</span></label>)}</div>{unitError ? <p className="mt-2 text-xs font-semibold text-red-600">{unitError}</p> : null}</div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><input type="checkbox" checked={form.isIndependent} onChange={(event) => setForm((current) => ({ ...current, isIndependent: event.target.checked }))} className="mt-1" /><span><span className="block text-sm font-bold text-slate-800">Equipe apta para casos com possível conflito de interesse</span><span className="mt-1 block text-xs leading-5 text-slate-500">Use somente para equipes que podem receber denúncias afastadas de determinados responsáveis.</span></span></label>

          <div><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">Membros</p><span className="text-xs text-slate-400">{form.members.length} selecionado(s)</span></div><Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder={form.unitIds.length ? 'Buscar pessoa da unidade selecionada...' : 'Selecione uma unidade primeiro'} disabled={!form.unitIds.length} icon={<i className="bi bi-search" />} /><div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">{form.unitIds.length && visibleUsers.length ? visibleUsers.map((user) => { const selected = selectedMember(user.id); return <div key={user.id} className={`rounded-xl border p-3 ${selected ? 'border-brand-200 bg-brand-50/60' : 'border-slate-200'}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" checked={Boolean(selected)} onChange={() => toggleMember(user.id)} /><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-800">{user.name}</span><span className="block truncate text-xs text-slate-500">{user.email} · {user.units.map((unit) => unit.name).join(', ')}</span></span></label>{selected ? <Select className="sm:w-44" value={selected.role} onChange={(event) => setMemberRole(user.id, event.target.value as TeamMemberRole)}><option value="MEMBER">Membro</option><option value="COORDINATOR">Coordenador</option></Select> : null}</div></div>; }) : <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">{form.unitIds.length ? 'Nenhuma pessoa disponível nas unidades selecionadas.' : 'Selecione ao menos uma unidade para carregar os membros possíveis.'}</p>}</div></div>
        </div>
      </Modal>
    </div>
  );
}
