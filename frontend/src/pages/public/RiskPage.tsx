import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { Textarea } from '../../components/ui/Textarea';
import { FormActions } from '../../components/public/FormActions';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { ReportProgress } from '../../components/public/ReportProgress';
import { usePublicReportDraft } from '../../context/PublicReportDraftContext';
import type { FieldErrors } from '../../utils/validation';

export function RiskPage() {
  const navigate = useNavigate();
  const { draft, updateDraft } = usePublicReportDraft();
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: FieldErrors = {};
    if (draft.immediateRisk === null) next.immediateRisk = 'Informe se existe risco imediato para continuar.';
    if (draft.immediateRisk && draft.immediateRiskDetails.trim().length < 5) next.immediateRiskDetails = 'Descreva brevemente qual é o risco imediato identificado.';
    setErrors(next);
    if (Object.keys(next).length) return;
    navigate('/denunciar/anexos');
  };

  const choose = (value: boolean) => {
    setErrors({});
    updateDraft(value ? { immediateRisk: true } : { immediateRisk: false, immediateRiskDetails: '' });
  };

  return (
    <PublicPageShell eyebrow="Nova denúncia" title="Existe risco imediato?" description="Esta informação ajuda a equipe a identificar situações que podem exigir atenção prioritária.">
      <div className="mx-auto max-w-4xl">
        <ReportProgress current={4} />
        <Card className="p-5 sm:p-7">
          <form onSubmit={submit} noValidate>
            {Object.keys(errors).length ? <div className="mb-5"><FormErrorSummary errors={errors} /></div> : null}
            <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Existe risco imediato?">
              <button type="button" role="radio" aria-checked={draft.immediateRisk === true} onClick={() => choose(true)} className={['rounded-2xl border p-5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100', draft.immediateRisk === true ? 'border-red-300 bg-red-50 ring-4 ring-red-50' : 'border-slate-200 bg-white hover:border-red-200'].join(' ')}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"><i className="bi bi-exclamation-triangle" /></span>
                <strong className="mt-4 block text-slate-900">Sim, existe risco atual</strong>
                <span className="mt-1 block text-sm leading-6 text-slate-500">Há possibilidade de dano, ameaça ou situação que exige atenção imediata.</span>
              </button>
              <button type="button" role="radio" aria-checked={draft.immediateRisk === false} onClick={() => choose(false)} className={['rounded-2xl border p-5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100', draft.immediateRisk === false ? 'border-brand-300 bg-brand-50 ring-4 ring-brand-50' : 'border-slate-200 bg-white hover:border-brand-200'].join(' ')}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><i className="bi bi-shield-check" /></span>
                <strong className="mt-4 block text-slate-900">Não há risco imediato</strong>
                <span className="mt-1 block text-sm leading-6 text-slate-500">O fato precisa ser apurado, mas não existe uma situação atual de urgência.</span>
              </button>
            </div>

            {draft.immediateRisk ? <div className="mt-5"><Textarea name="immediateRiskDetails" label="Descreva o risco imediato *" value={draft.immediateRiskDetails} error={errors.immediateRiskDetails} onChange={(e) => { setErrors((v) => ({ ...v, immediateRiskDetails: '' })); updateDraft({ immediateRiskDetails: e.target.value }); }} placeholder="Explique brevemente quem ou o que pode estar em risco." /></div> : null}
            <div className="mt-5"><Alert tone="warning">Se houver perigo imediato à integridade ou segurança de alguém, este canal não substitui os serviços públicos de emergência.</Alert></div>
            <FormActions backTo="/denunciar/pessoas" />
          </form>
        </Card>
      </div>
    </PublicPageShell>
  );
}
