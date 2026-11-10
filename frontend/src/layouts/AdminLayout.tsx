import { useState } from 'react';
import { Outlet } from 'react-router';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="fixed left-3 top-3 z-[130] -translate-y-20 rounded-lg bg-brand-800 px-3 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0">Pular para o conteúdo</a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[var(--sidebar-width)]">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-76px)] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
