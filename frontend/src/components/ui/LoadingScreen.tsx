import { Logo } from './Logo';
import { Skeleton } from './Skeleton';

export function LoadingScreen({ label = 'Carregando...' }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-12" role="status" aria-live="polite">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-8">
        <div className="flex justify-center"><Logo /></div>
        <div className="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <i className="bi bi-arrow-repeat animate-spin text-xl" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
        <div className="mx-auto mt-5 max-w-52 space-y-2">
          <Skeleton className="h-2.5 w-full" rounded="full" />
          <Skeleton className="mx-auto h-2.5 w-2/3" rounded="full" />
        </div>
      </div>
    </main>
  );
}
