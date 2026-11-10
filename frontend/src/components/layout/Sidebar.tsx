import { NavLink } from 'react-router';
import { useCan } from '../../hooks/useCan';
import type { NavSection } from '../../types/navigation';
import { ACCESS, can } from '../../utils/authorization';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';


const navigation: NavSection[] = [
  {
    items: [
      { label: 'Visão geral', path: '/admin', icon: 'bi-grid-1x2', ...ACCESS.dashboard },
    ],
  },
  {
    label: 'Denúncias',
    items: [
      { label: 'Denúncias', path: '/admin/denuncias', icon: 'bi-inbox', ...ACCESS.reports },
    ],
  },
  {
    label: 'Administração',
    items: [
      { label: 'Usuários', path: '/admin/usuarios', icon: 'bi-people', ...ACCESS.users },
      { label: 'Equipes', path: '/admin/equipes', icon: 'bi-diagram-3', ...ACCESS.teams },
      { label: 'Categorias', path: '/admin/categorias', icon: 'bi-tags', ...ACCESS.categories },
      { label: 'Unidades', path: '/admin/unidades', icon: 'bi-buildings', ...ACCESS.units },
      {
        label: 'Regras de direcionamento',
        path: '/admin/routing-rules',
        icon: 'bi-signpost-split',
        ...ACCESS.routing,
      },
    ],
  },
  {
    label: 'Controle e segurança',
    items: [
      { label: 'Histórico de atividades', path: '/admin/auditoria', icon: 'bi-shield-check', ...ACCESS.audit },
      {
        label: 'Prazos de guarda',
        path: '/admin/retencao/politicas',
        icon: 'bi-archive',
        ...ACCESS.retention,
      },
      {
        label: 'Ações automáticas',
        path: '/admin/retencao/execucoes',
        icon: 'bi-hourglass-split',
        ...ACCESS.retentionExecutions,
      },
    ],
  },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

function SidebarItem({
  item,
  onNavigate,
}: {
  item: NavSection['items'][number];
  onNavigate: () => void;
}) {
  const allowed = useCan(item);
  if (!allowed) return null;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin'}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-800'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              isActive ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-400 group-hover:text-slate-600',
            ].join(' ')}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
          </span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { permissions } = useAuth();
  const visibleNavigation = navigation.map(section => ({ ...section, items: section.items.filter(item => can(permissions, item)) })).filter(section => section.items.length > 0);
  return (
    <>
      {open ? (
        <button
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col border-r border-slate-200 bg-white',
          'transform transition-transform duration-200 ease-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Logo />
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <nav className="soft-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-6">
            {visibleNavigation.map((section, sectionIndex) => (
              <div key={section.label ?? `section-${sectionIndex}`}>
                {section.label ? (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    {section.label}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarItem key={item.path} item={item} onNavigate={onClose} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
                <i className="bi bi-shield-lock" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Ambiente administrativo</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Acesso protegido e atividades registradas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
