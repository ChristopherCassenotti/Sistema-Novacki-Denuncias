import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { referencesApi } from '../../api/references';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Textarea } from '../../components/ui/Textarea';
import { FormActions } from '../../components/public/FormActions';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { ReportProgress } from '../../components/public/ReportProgress';
import { usePublicReportDraft } from '../../context/PublicReportDraftContext';
import type { NamedReference } from '../../types/reports';
import { isValidEmail, type FieldErrors } from '../../utils/validation';
import { todayLocalISO } from '../../utils/format';

export function ReportDetailsPage() {
  const navigate = useNavigate();
  const { draft, updateDraft } = usePublicReportDraft();
  const [categories, setCategories] = useState<NamedReference[]>([]);
  const [units, setUnits] = useState<NamedReference[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [referenceError, setReferenceError] = useState<unknown | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let active = true;
    setLoadingReferences(true);
    setReferenceError(null);
    Promise.all([referencesApi.categories(), referencesApi.units()])
      .then(([categoryItems, unitItems]) => {
        if (!active) return;
        setCategories(categoryItems);
        setUnits(unitItems);
      })
      .catch((currentError) => { if (active) setReferenceError(currentError); })
      .finally(() => { if (active) setLoadingReferences(false); });
    return () => { active = false; };
  }, []);

  const descriptionCount = draft.description.trim().length;
  const canUseReferences = !loadingReferences && !referenceError;
  const referenceEmpty = useMemo(() => !loadingReferences && !referenceError && (!categories.length || !units.length), [categories.length, loadingReferences, referenceError, units.length]);

  if (!draft.mode) return <Navigate to="/denunciar/tipo" replace />;

  const clearField = (field: string) => setErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!draft.relationship) next.relationship = 'Selecione seu relacionamento com a empresa.';
    if (!draft.unitId) next.unitId = 'Selecione a unidade relacionada ao relato.';
    if (!draft.categoryId) next.categoryId = 'Selecione uma categoria para a denúncia.';
    if (descriptionCount < 20) next.description = 'Descreva o ocorrido com pelo menos 20 caracteres.';
    if (draft.mode === 'IDENTIFIED' && !draft.reporterName.trim()) next.reporterName = 'Informe seu nome para continuar com a denúncia identificada.';
    if (draft.mode === 'IDENTIFIED' && draft.reporterEmail && !isValidEmail(draft.reporterEmail)) next.reporterEmail = 'Informe um endereço de e-mail válido.';

    setErrors(next);
    if (Object.keys(next).length) {
      window.requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    navigate('/denunciar/pessoas');
  };

  return (
    <PublicPageShell eyebrow="Nova denúncia" title="Conte o que aconteceu" description="Preencha as informações que você souber. Evite incluir dados que não tenham relação com o relato.">
      <div className="mx-auto max-w-4xl">
        <ReportProgress current={2} />
        <Card className="p-5 sm:p-7">
          <form onSubmit={submit} noValidate>
            {referenceError ? <div className="mb-5"><ErrorAlert error={referenceError} fallback="Não foi possível carregar categorias e unidades." onRetry={() => window.location.reload()} /></div> : null}
            {referenceEmpty ? <div className="mb-5"><Alert tone="warning">Não foi possível carregar algumas opções do formulário. Atualize a página e tente novamente antes de continuar.</Alert></div> : null}
            {Object.keys(errors).length ? <div className="mb-5"><FormErrorSummary errors={errors} /></div> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Select name="relationship" label="Seu relacionamento com a empresa *" value={draft.relationship} error={errors.relationship} onChange={(e) => { clearField('relationship'); updateDraft({ relationship: e.target.value }); }}>
                <option value="">Selecione</option><option value="EMPLOYEE">Colaborador(a)</option><option value="FORMER_EMPLOYEE">Ex-colaborador(a)</option><option value="SUPPLIER">Fornecedor(a)</option><option value="CUSTOMER">Cliente</option><option value="THIRD_PARTY">Terceiro(a)</option><option value="OTHER">Outro</option>
              </Select>
              {loadingReferences ? <div><span className="mb-2 block text-sm font-semibold text-slate-700">Unidade *</span><Skeleton className="h-11 w-full" rounded="lg" /></div> : (
                <Select name="unitId" label="Unidade *" value={draft.unitId} disabled={!canUseReferences} error={errors.unitId} onChange={(e) => { clearField('unitId'); updateDraft({ unitId: e.target.value }); }}><option value="">Selecione</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</Select>
              )}
              {loadingReferences ? <div><span className="mb-2 block text-sm font-semibold text-slate-700">Categoria *</span><Skeleton className="h-11 w-full" rounded="lg" /></div> : (
                <Select name="categoryId" label="Categoria *" value={draft.categoryId} disabled={!canUseReferences} error={errors.categoryId} onChange={(e) => { clearField('categoryId'); updateDraft({ categoryId: e.target.value }); }}><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select>
              )}
              <Input name="occurrenceDate" type="date" label="Data aproximada da ocorrência" value={draft.occurrenceDate} max={todayLocalISO()} onChange={(e) => updateDraft({ occurrenceDate: e.target.value })} />
            </div>

            <div className="mt-4"><Input name="occurrenceLocation" label="Local da ocorrência" value={draft.occurrenceLocation} onChange={(e) => updateDraft({ occurrenceLocation: e.target.value })} placeholder="Ex.: setor, área, cidade ou outro local" /></div>
            <div className="mt-4">
              <Textarea name="description" label="Descrição do ocorrido *" value={draft.description} error={errors.description} onChange={(e) => { clearField('description'); updateDraft({ description: e.target.value }); }} placeholder="Descreva o que ocorreu, quando percebeu a situação e quais fatos considera importantes." className="min-h-40" hint={`${descriptionCount} caracteres · mínimo de 20. Procure relatar os fatos de forma objetiva e cronológica.`} />
            </div>
            <div className="mt-4"><Textarea name="additionalInformation" label="Informações complementares" value={draft.additionalInformation} onChange={(e) => updateDraft({ additionalInformation: e.target.value })} placeholder="Inclua aqui qualquer contexto adicional que possa ajudar." /></div>

            {draft.mode === 'IDENTIFIED' ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm"><i className="bi bi-person-badge" /></span><div><h2 className="font-bold text-slate-900">Seus dados de identificação</h2><p className="text-xs text-slate-500">Necessários porque você escolheu denúncia identificada.</p></div></div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input name="reporterName" label="Nome *" value={draft.reporterName} error={errors.reporterName} onChange={(e) => { clearField('reporterName'); updateDraft({ reporterName: e.target.value }); }} autoComplete="name" />
                  <Input name="reporterEmail" type="email" label="E-mail" value={draft.reporterEmail} error={errors.reporterEmail} onChange={(e) => { clearField('reporterEmail'); updateDraft({ reporterEmail: e.target.value }); }} autoComplete="email" />
                  <Input name="reporterPhone" type="tel" label="Telefone" value={draft.reporterPhone} onChange={(e) => updateDraft({ reporterPhone: e.target.value })} autoComplete="tel" />
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <input className="mt-1" type="checkbox" checked={draft.consentToContact} onChange={(e) => updateDraft({ consentToContact: e.target.checked })} />
                  <span><span className="block text-sm font-semibold text-slate-800">Autorizo contato sobre esta denúncia</span><span className="mt-1 block text-xs leading-5 text-slate-500">A autorização é opcional e será registrada junto aos dados de identificação.</span></span>
                </label>
              </div>
            ) : <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-brand-900"><i className="bi bi-person-lock mr-2" />Você escolheu uma denúncia anônima. Nenhum campo de identidade é solicitado nesta etapa.</div>}

            <FormActions backTo="/denunciar/tipo" />
          </form>
        </Card>
      </div>
    </PublicPageShell>
  );
}
