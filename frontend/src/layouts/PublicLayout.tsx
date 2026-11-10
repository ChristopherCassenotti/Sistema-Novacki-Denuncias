import { Outlet } from 'react-router';
import { PublicFooter } from '../components/public/PublicFooter';
import { PublicHeader } from '../components/public/PublicHeader';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main-content" className="fixed left-3 top-3 z-[130] -translate-y-20 rounded-lg bg-brand-800 px-3 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0">Pular para o conteúdo</a>
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
