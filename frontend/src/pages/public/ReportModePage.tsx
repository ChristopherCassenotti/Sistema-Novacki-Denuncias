import { useNavigate } from 'react-router';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { ReportProgress } from '../../components/public/ReportProgress';
import { usePublicReportDraft } from '../../context/PublicReportDraftContext';

export function ReportModePage() {
  const navigate = useNavigate();
  const { draft, updateDraft } = usePublicReportDraft();

  const selectMode = (mode: 'ANONYMOUS' | 'IDENTIFIED') => {
    updateDraft({ mode });
    navigate('/denunciar');
  };

  return (
    <PublicPageShell
      eyebrow="Nova denúncia"
      title="Como você deseja registrar o relato?"
      description="Escolha como deseja fazer a denúncia antes de preencher os detalhes."
    >
      <div className="mx-auto max-w-4xl">
        <ReportProgress current={1} />
        <div className="grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => selectMode('ANONYMOUS')}
            className={[
              'group rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-slate-900/5',
              draft.mode === 'ANONYMOUS' ? 'border-brand-400 ring-4 ring-brand-50' : 'border-slate-200',
            ].join(' ')}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <i className="bi bi-person-lock text-2xl" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">Denúncia anônima</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Você não informa sua identidade no formulário. O acompanhamento continua disponível com o protocolo e a senha de acompanhamento.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
              Escolher anônima <i className="bi bi-arrow-right transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectMode('IDENTIFIED')}
            className={[
              'group rounded-2xl border bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-slate-900/5',
              draft.mode === 'IDENTIFIED' ? 'border-brand-400 ring-4 ring-brand-50' : 'border-slate-200',
            ].join(' ')}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <i className="bi bi-person-badge text-2xl" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">Denúncia identificada</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Você informa seus dados de identificação. O acesso à identidade fica sujeito às regras e permissões do sistema.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
              Escolher identificada <i className="bi bi-arrow-right transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </div>
    </PublicPageShell>
  );
}
