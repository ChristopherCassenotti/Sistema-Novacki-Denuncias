import type { PropsWithChildren } from 'react';
import { Logo } from '../components/ui/Logo';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(43,132,163,0.35),transparent_35%),linear-gradient(135deg,#062733_0%,#0a475e_48%,#0b5773_100%)]" />
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -left-8 top-1/3 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 p-12">
          <div className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-xl shadow-slate-950/20">
            <Logo />
          </div>
        </div>

        <div className="relative z-10 max-w-2xl p-12 pb-16 text-white">
          <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            Ambiente seguro e confidencial
          </span>
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Gestão responsável do Canal de Denúncias.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
            Um painel central para receber, analisar, acompanhar e encaminhar denúncias com segurança.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              ['bi-shield-lock', 'Acesso protegido'],
              ['bi-eye-slash', 'Confidencialidade'],
              ['bi-clock-history', 'Ações registradas'],
            ].map(([icon, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <i className={`bi ${icon} text-lg text-white/80`} />
                <p className="mt-3 text-xs font-semibold leading-5 text-white/75">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-white px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-9 lg:hidden">
            <Logo />
          </div>
          {children}
          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Ambiente de uso restrito. As principais ações ficam registradas para segurança.
          </p>
        </div>
      </section>
    </div>
  );
}
