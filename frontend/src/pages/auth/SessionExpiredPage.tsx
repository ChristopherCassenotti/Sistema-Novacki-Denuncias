import { Link } from 'react-router';
import { AuthLayout } from '../../layouts/AuthLayout';

export function SessionExpiredPage() {
  return (
    <AuthLayout>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-700"><i className="bi bi-clock-history" /></div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Segurança da sessão</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Sua sessão expirou</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Por segurança, o acesso administrativo foi encerrado. Entre novamente para continuar.</p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs leading-5 text-slate-500"><i className="bi bi-info-circle mr-2 text-brand-700" />Se você estava preenchendo uma ação administrativa, confirme os dados após entrar novamente antes de reenviar.</div>
        <Link to="/admin/login" className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 sm:w-auto"><i className="bi bi-box-arrow-in-right" />Voltar ao login</Link>
      </div>
    </AuthLayout>
  );
}
