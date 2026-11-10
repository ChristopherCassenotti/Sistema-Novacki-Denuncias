import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/initials';
import { permissionLabel, roleLabel } from '../../utils/displayLabels';
import { isAdminMaster } from '../../utils/accessScope';

export function ProfilePage() {
  const { user, roles, permissions } = useAuth();
  const master = isAdminMaster(roles) && permissions.includes('REPORT_VIEW');

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Conta"
        title="Meu perfil"
        description="Veja seus dados e o que sua conta pode fazer no sistema."
      />

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-sm font-black text-brand-800">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">{user?.name}</p>
              <p className="truncate text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Perfis de acesso</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {roles.length ? roles.map((role) => <Badge key={role}>{roleLabel(role)}</Badge>) : <span className="text-sm text-slate-500">Nenhum perfil informado</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unidades de acesso</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {master ? (
                  <Badge tone="brand">Todas as unidades</Badge>
                ) : user?.units?.length ? (
                  user.units.map((unit) => <Badge key={unit.id}>{unit.name}</Badge>)
                ) : (
                  <span className="text-sm text-slate-500">Nenhuma unidade vinculada</span>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-slate-900">O que você pode fazer</h2>
          <p className="mt-1 text-sm text-slate-500">
            Estas são as ações liberadas para a sua conta.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {permissions.length ? (
              permissions.map((permission) => (
                <Badge key={permission} tone="neutral">{permissionLabel(permission)}</Badge>
              ))
            ) : (
              <p className="text-sm text-slate-400">Nenhuma ação adicional está liberada para esta conta.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
