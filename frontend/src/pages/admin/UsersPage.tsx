import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { usersApi } from '../../api/adminManagement';
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
import type { AdminUserListItem, CredentialTokenResult, RoleReference, UserFormData } from '../../types/management';
import { useCan } from '../../hooks/useCan';
import { ACCESS } from '../../utils/authorization';
import { formatDateTime } from '../../utils/format';
import { isValidEmail, type FieldErrors } from '../../utils/validation';

const emptyForm: UserFormData = { name: '', email: '', roleIds: [], unitIds: [] };

function targetIsMaster(user: AdminUserListItem) {
  return user.roles.some((role) => role.code === 'ADMIN_MASTER');
}

export function UsersPage() {
  const canManageUsers = useCan(ACCESS.users);

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [roles, setRoles] = useState<RoleReference[]>([]);
  const [unitOptions, setUnitOptions] = useState<NamedReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [referenceError, setReferenceError] = useState<unknown | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserListItem | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [credential, setCredential] = useState<CredentialTokenResult | null>(null);
  const [credentialTitle, setCredentialTitle] = useState('Código de acesso gerado');
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReferenceError(null);

    const [usersResult, rolesResult, unitsResult] = await Promise.allSettled([
      usersApi.list(),
      usersApi.assignableRoles(),
      referencesApi.units(),
    ]);

    if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
    else setError(usersResult.reason);

    if (rolesResult.status === 'fulfilled') {
      const roleMap = new Map<string, RoleReference>();
      rolesResult.value
        .filter((role) => role.active !== false)
        .forEach((role) => roleMap.set(role.id, role));

      setRoles([...roleMap.values()]);
    } else setReferenceError(rolesResult.reason);

    if (unitsResult.status === 'fulfilled') setUnitOptions(unitsResult.value);
    else setReferenceError((current: unknown) => current ?? unitsResult.reason);

    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Lists and assignable roles are already scoped by the API.
  const availableUnits = unitOptions;
  const scopedUsers = users;
  const selectableRoles = roles;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scopedUsers.filter((user) => {
      const matchesText = !term || [
        user.name,
        user.email,
        ...user.roles.map((role) => role.name),
        ...user.units.map((unit) => unit.name),
      ].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = !statusFilter || (statusFilter === 'active' ? user.active : !user.active);
      return matchesText && matchesStatus;
    });
  }, [scopedUsers, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setError(null);
    setSuccess('');
    setFormOpen(true);
  };

  const openEdit = async (user: AdminUserListItem) => {
    if (!canManageUsers) return;
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      roleIds: user.roles.map((role) => role.id),
      unitIds: user.units.map((unit) => unit.id),
    });
    setFormErrors({});
    setError(null);
    setSuccess('');
    setFormOpen(true);

    try {
      const detail = await usersApi.get(user.id);
      setEditing(detail);
      setForm({
        name: detail.name,
        email: detail.email,
        roleIds: detail.roles.map((role) => role.id),
        unitIds: detail.units.map((unit) => unit.id),
      });
    } catch (err) {
      setError(err);
    }
  };

  const toggleRole = (roleId: string) => {
    setFormErrors((current) => ({ ...current, roles: '' }));
    setForm((current) => ({ ...current, roleIds: current.roleIds.includes(roleId) ? current.roleIds.filter(id => id !== roleId) : [...current.roleIds, roleId] }));
  };

  const toggleUnit = (unitId: string) => {
    if (editing && !canManageUsers) return;
    setFormErrors((current) => ({ ...current, units: '' }));
    setForm((current) => ({
      ...current,
      unitIds: current.unitIds.includes(unitId)
        ? current.unitIds.filter((id) => id !== unitId)
        : [...current.unitIds, unitId],
    }));
  };

  const save = async () => {
    const nextErrors: FieldErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome do usuário.';
    if (!form.email.trim()) nextErrors.email = 'Informe o e-mail do usuário.';
    else if (!isValidEmail(form.email)) nextErrors.email = 'Informe um endereço de e-mail válido.';
    if (!form.roleIds.length) nextErrors.roles = 'Selecione o perfil do usuário.';

    if (!canManageUsers) return;

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setError(null);
    setSuccess('');

    try {
      if (editing) {
        await usersApi.update(editing.id, form, { updateUnits: canManageUsers });
        setSuccess('Usuário atualizado com sucesso.');
      } else {
        const result = await usersApi.create(form);
        setCredentialTitle('Código para criar a senha');
        setCredential(result);
        setSuccess('Usuário criado e vinculado às unidades selecionadas.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: AdminUserListItem) => {
    setActionId(user.id);
    setError(null);
    setSuccess('');
    try {
      await usersApi.setStatus(user.id, !user.active);
      setSuccess(user.active ? 'Usuário desativado.' : 'Usuário ativado.');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setActionId(null);
    }
  };

  const resetPassword = async (user: AdminUserListItem) => {
    if (!window.confirm(`Gerar um novo código para ${user.name} redefinir a senha?`)) return;
    setActionId(user.id);
    setError(null);
    setSuccess('');
    try {
      const result = await usersApi.resetPassword(user.id);
      setCredentialTitle(`Redefinição de senha — ${user.name}`);
      setCredential(result);
      setSuccess('Código para redefinir a senha gerado com sucesso.');
    } catch (err) {
      setError(err);
    } finally {
      setActionId(null);
    }
  };

  const credentialPath = credential?.token
    ? `/admin/definir-credencial?token=${encodeURIComponent(credential.token)}`
    : '';
  const credentialUrl = credentialPath ? `${window.location.origin}${credentialPath}` : '';

  const copyToken = async () => {
    if (credential?.token) await navigator.clipboard.writeText(credential.token);
  };

  const copyCredentialLink = async () => {
    if (credentialUrl) await navigator.clipboard.writeText(credentialUrl);
  };

  const canSave = Boolean(
    form.name.trim()
      && form.email.trim()
      && form.roleIds.length,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description={canManageUsers
          ? 'Cadastre pessoas, defina o perfil e mova usuários entre unidades quando necessário.'
          : 'Gerencie somente as pessoas das suas unidades. Pessoas de outras regiões não aparecem nesta área.'}
        actions={(
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void load()}><i className="bi bi-arrow-clockwise" />Atualizar</Button>
            <Button size="sm" onClick={openCreate}><i className="bi bi-person-plus" />Novo usuário</Button>
          </div>
        )}
      />


      {success ? <Alert tone="success">{success}</Alert> : null}
      {error ? <ErrorAlert error={error} fallback="Não foi possível concluir a alteração do usuário." onRetry={() => void load()} /> : null}
      {referenceError ? (
        <Alert tone="warning"><strong>Não foi possível carregar todos os perfis ou unidades.</strong> Atualize a página antes de criar ou editar alguém.</Alert>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, perfil ou unidade..." icon={<i className="bi bi-search" />} />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Todas as situações</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500"><strong className="text-slate-800">{filtered.length}</strong> usuário(s)</div>
        {loading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
        ) : filtered.length ? (
          <div className="soft-scrollbar overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="bg-slate-50"><tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400"><th className="px-5 py-3">Usuário</th><th className="px-5 py-3">Perfil</th><th className="px-5 py-3">Unidades</th><th className="px-5 py-3">Situação</th><th className="px-5 py-3">Último acesso</th><th className="px-5 py-3 text-right">Ações</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => {
                  const master = targetIsMaster(user);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4"><div className="font-bold text-slate-900">{user.name}</div><div className="mt-0.5 text-sm text-slate-500">{user.email}</div></td>
                      <td className="px-5 py-4"><div className="flex max-w-72 flex-wrap gap-1.5">{user.roles.length ? user.roles.map((role) => <Badge key={role.id} tone="brand">{role.name}</Badge>) : <span className="text-sm text-slate-400">Sem perfil</span>}</div></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{master ? <Badge tone="brand">Todas as unidades</Badge> : user.units.length ? user.units.map((unit) => unit.name).join(', ') : '—'}</td>
                      <td className="px-5 py-4"><Badge tone={user.active ? 'success' : 'neutral'}>{user.active ? 'Ativo' : 'Inativo'}</Badge></td>
                      <td className="px-5 py-4 text-sm text-slate-500">{user.lastAccessAt ? formatDateTime(user.lastAccessAt) : '—'}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-1"><button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Editar" onClick={() => void openEdit(user)}><i className="bi bi-pencil" /></button><button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" title="Redefinir senha" disabled={actionId === user.id} onClick={() => void resetPassword(user)}><i className="bi bi-key" /></button><button className={`flex h-9 w-9 items-center justify-center rounded-lg ${user.active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={user.active ? 'Desativar' : 'Ativar'} disabled={actionId === user.id} onClick={() => void toggleStatus(user)}><i className={`bi ${user.active ? 'bi-person-x' : 'bi-person-check'}`} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Nenhum usuário encontrado" description={canManageUsers ? 'Altere a busca ou cadastre um novo usuário.' : 'Não há usuários acessíveis nas suas unidades para os filtros atuais.'} />}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        description="Informe os dados, escolha entre os perfis atribuíveis e defina as unidades de acesso."
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} loading={saving} disabled={!canSave}>{editing ? 'Salvar alterações' : 'Criar usuário'}</Button></>}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="userName" label="Nome" value={form.name} error={formErrors.name} onChange={(event) => { setFormErrors((current) => ({ ...current, name: '' })); setForm((current) => ({ ...current, name: event.target.value })); }} placeholder="Nome completo" />
            <Input name="userEmail" label="E-mail" type="email" value={form.email} error={formErrors.email} onChange={(event) => { setFormErrors((current) => ({ ...current, email: '' })); setForm((current) => ({ ...current, email: event.target.value })); }} placeholder="usuario@empresa.com.br" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">Perfis *</p><span className="text-xs text-slate-400">{form.roleIds.length} selecionado(s)</span></div>
            {selectableRoles.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {selectableRoles.map((role) => (
                  <label key={role.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${form.roleIds.includes(role.id) ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input className="mt-1" type="checkbox" checked={form.roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} />
                    <span><span className="block text-sm font-bold text-slate-800">{role.name}</span>{role.description ? <span className="mt-0.5 block text-xs leading-5 text-slate-500">{role.description}</span> : null}</span>
                  </label>
                ))}
              </div>
            ) : (
              <Alert tone="warning">
                <strong>Nenhum perfil atribuível disponível.</strong> Atualize a página ou verifique suas permissões.
              </Alert>
            )}
            {formErrors.roles ? <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.roles}</p> : null}
          </div>

          {
            <div>
              <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">Unidades</p><span className="text-xs text-slate-400">{form.unitIds.length} {form.unitIds.length === 1 ? 'selecionada' : 'selecionadas'}</span></div>
              {availableUnits.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableUnits.map((unit) => (
                    <label key={unit.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${form.unitIds.includes(unit.id) ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="checkbox" checked={form.unitIds.includes(unit.id)} onChange={() => toggleUnit(unit.id)} /><span className="text-sm font-semibold text-slate-800">{unit.name}</span></label>
                  ))}
                </div>
              ) : <Alert tone="warning">Nenhuma unidade do seu escopo está disponível para seleção.</Alert>}
              {formErrors.units ? <p className="mt-2 text-xs font-semibold text-red-600">{formErrors.units}</p> : null}
            </div>
          }
        </div>
      </Modal>

      <Modal
        open={Boolean(credential)}
        onClose={() => setCredential(null)}
        title={credentialTitle}
        description="Envie o link ou o código para a pessoa definir uma nova senha. Por segurança, o código pode ser exibido apenas uma vez."
        footer={<Button onClick={() => setCredential(null)}>Concluir</Button>}
      >
        {credential?.token ? (
          <div className="space-y-4">
            <Alert tone="warning">Envie estas informações por um canal seguro. Não compartilhe em grupos ou locais públicos.</Alert>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Link para definir a senha</p>
              <div className="mt-2 flex items-start gap-3">
                <code className="min-w-0 flex-1 break-all text-xs font-semibold text-slate-700">{credentialUrl}</code>
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  onClick={() => void copyCredentialLink()}
                  title="Copiar link"
                >
                  <i className="bi bi-copy" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-950 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Código de acesso</p>
              <div className="mt-2 flex items-start gap-3">
                <code className="min-w-0 flex-1 break-all text-sm font-semibold text-white">{credential.token}</code>
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                  onClick={() => void copyToken()}
                  title="Copiar código"
                >
                  <i className="bi bi-copy" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={credentialPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 active:translate-y-px"
              >
                <i className="bi bi-box-arrow-up-right" />
                Abrir tela de definição de senha
              </Link>
            </div>

            {credential.expiresAt ? (
              <p className="text-sm text-slate-500">
                Expira em: <strong className="text-slate-700">{formatDateTime(credential.expiresAt)}</strong>
              </p>
            ) : null}
          </div>
        ) : (
          <Alert tone="warning">
            <strong>A operação foi concluída, mas o código de acesso não apareceu.</strong> Não feche esta janela e peça ajuda ao responsável pelo sistema.
          </Alert>
        )}
      </Modal>
    </div>
  );
}
