import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/initials';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } finally {
      setLeaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden"
          aria-label="Abrir menu"
        >
          <i className="bi bi-list text-xl" />
        </button>

        <div className="hidden sm:block">
          <p className="text-xs font-medium text-slate-400">Canal de Denúncias</p>
          <p className="text-sm font-semibold text-slate-700">Painel Administrativo</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          aria-label="Notificações"
          title="Notificações — módulo futuro"
        >
          <i className="bi bi-bell" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50"
            aria-expanded={menuOpen}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-xs font-black text-brand-800">
              {getInitials(user?.name)}
            </span>
            <span className="hidden min-w-0 md:block">
              <span className="block max-w-40 truncate text-sm font-semibold text-slate-800">
                {user?.name ?? 'Usuário'}
              </span>
              <span className="block max-w-40 truncate text-xs text-slate-400">{user?.email}</span>
            </span>
            <i className="bi bi-chevron-down hidden text-xs text-slate-400 md:block" />
          </button>

          {menuOpen ? (
            <>
              <button
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu do usuário"
              />
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-3 py-2.5 md:hidden">
                  <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/admin/perfil');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <i className="bi bi-person" />
                  Meu perfil
                </button>
                <button
                  onClick={() => void handleLogout()}
                  disabled={leaving}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <i className={leaving ? 'bi bi-arrow-repeat animate-spin' : 'bi bi-box-arrow-right'} />
                  {leaving ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
