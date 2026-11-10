import { Outlet, useNavigate, useParams } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { TrackingTabs } from '../components/public/TrackingTabs';
import { useReporter } from '../context/ReporterContext';
import { reportStatusLabel, reportStatusTone } from '../utils/reportLabels';

export function ReporterAreaLayout() {
  const { report, logoutReporter } = useReporter();
  const { protocolo } = useParams();
  const navigate = useNavigate();
  const currentProtocol = report?.protocol || protocolo || '—';

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border sm:rounded-2xl border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Acompanhamento seguro</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{currentProtocol}</h1>
                <Badge tone={reportStatusTone(report?.status)}>{reportStatusLabel(report?.status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">Consulte atualizações, mensagens, anexos e a conclusão do relato.</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logoutReporter();
                navigate('/acompanhar', { replace: true });
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <i className="bi bi-box-arrow-right" /> Encerrar acesso
            </button>
          </div>
          <TrackingTabs />
          <div className="p-5 sm:p-7"><Outlet /></div>
        </div>
      </div>
    </section>
  );
}
