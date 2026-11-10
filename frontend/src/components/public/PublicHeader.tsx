import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Logo } from '../ui/Logo';

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  ].join(' ');

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" aria-label="Página inicial" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          <NavLink to="/denunciar/orientacoes" className={navClass}>
            Fazer denúncia
          </NavLink>
          <NavLink to="/acompanhar" className={navClass}>
            Acompanhar denúncia
          </NavLink>
          <Link
            to="/admin/login"
            className="ml-2 inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Acesso administrativo
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'} text-xl`} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Navegação móvel">
            <NavLink to="/denunciar/orientacoes" className={navClass} onClick={() => setOpen(false)}>
              Fazer denúncia
            </NavLink>
            <NavLink to="/acompanhar" className={navClass} onClick={() => setOpen(false)}>
              Acompanhar denúncia
            </NavLink>
            <Link
              to="/admin/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
            >
              Acesso administrativo
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
