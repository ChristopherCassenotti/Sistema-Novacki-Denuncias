import { Link } from 'react-router';
import { Logo } from '../ui/Logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Logo />
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
            Canal destinado ao registro e acompanhamento seguro de relatos. Use as informações de acesso com cuidado e não compartilhe sua senha de acompanhamento.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600 md:justify-end">
          <Link to="/denunciar/orientacoes" className="hover:text-brand-700">Fazer denúncia</Link>
          <Link to="/acompanhar" className="hover:text-brand-700">Acompanhar</Link>
          <Link to="/admin/login" className="hover:text-brand-700">Área administrativa</Link>
        </div>
      </div>
    </footer>
  );
}
