import { Link } from 'react-router';
import { Logo } from '../components/ui/Logo';

export function PublicPlaceholderPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <Link to="/admin/login" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Acesso administrativo
          </Link>
        </div>
      </header>

      <main className="relative overflow-hidden bg-brand-950 px-5 py-24 text-white sm:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(90,163,187,0.25),transparent_30%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            Canal de Denúncias Novacki
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Um canal seguro para comunicar situações que precisam de atenção.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">
            A área pública completa será construída na Fase 3. Esta tela mantém a rota raiz preparada sem misturar o fluxo público com o painel administrativo.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/admin/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Acessar painel administrativo
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
