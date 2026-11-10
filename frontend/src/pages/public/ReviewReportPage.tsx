import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { publicReportsApi } from '../../api/publicReports';
import { referencesApi } from '../../api/references';
import { Alert } from '../../components/ui/Alert';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Card } from '../../components/ui/Card';
import { FormActions } from '../../components/public/FormActions';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { ReportProgress } from '../../components/public/ReportProgress';
import { usePublicReportDraft } from '../../context/PublicReportDraftContext';
import type { NamedReference } from '../../types/reports';
import type { CreatePublicReportPayload, LastSubmission } from '../../types/public';
import { formatDate, formatFileSize } from '../../utils/format';
import { relationshipLabel } from '../../utils/displayLabels';
import { isValidEmail, type FieldErrors } from '../../utils/validation';

const LAST_SUBMISSION_KEY = 'nvk:last-public-submission';

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[190px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm leading-6 text-slate-800">{value || 'Não informado'}</dd>
    </div>
  );
}

export function ReviewReportPage() {
  const navigate = useNavigate();
  const { draft, attachments } = usePublicReportDraft();
  const [categories, setCategories] = useState<NamedReference[]>([]);
  const [units, setUnits] = useState<NamedReference[]>([]);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<unknown | null>(null);

  useEffect(() => {
    void Promise.all([referencesApi.categories(), referencesApi.units()]).then(([c, u]) => {
      setCategories(c);
      setUnits(u);
    }).catch((currentError) => {
      setApiError(currentError);
    });
  }, []);

  const categoryName = useMemo(() => categories.find((item) => item.id === draft.categoryId)?.name ?? 'Não informado', [categories, draft.categoryId]);
  const unitName = useMemo(() => units.find((item) => item.id === draft.unitId)?.name ?? 'Não informado', [units, draft.unitId]);

  if (!draft.mode) return <Navigate to="/denunciar/tipo" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setApiError(null);
    const nextErrors: FieldErrors = {};
    if (!draft.relationship) nextErrors.relationship = 'Relacionamento com a empresa não informado.';
    if (!draft.unitId) nextErrors.unitId = 'Unidade não informada.';
    if (!draft.categoryId) nextErrors.categoryId = 'Categoria não informada.';
    if (draft.description.trim().length < 20) nextErrors.description = 'A descrição precisa ter pelo menos 20 caracteres.';
    if (draft.immediateRisk === null) nextErrors.immediateRisk = 'Informe se existe risco imediato.';
    if (draft.immediateRisk && draft.immediateRiskDetails.trim().length < 5) nextErrors.immediateRiskDetails = 'Descreva o risco imediato antes de enviar.';
    if (draft.mode === 'IDENTIFIED' && !draft.reporterName.trim()) nextErrors.reporterName = 'Nome do denunciante não informado.';
    if (draft.mode === 'IDENTIFIED' && draft.reporterEmail && !isValidEmail(draft.reporterEmail)) nextErrors.reporterEmail = 'O e-mail informado é inválido.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (!draft.mode || draft.immediateRisk === null) return;

    const payload: CreatePublicReportPayload = {
      mode: draft.mode,
      relationship: draft.relationship,
      unitId: draft.unitId,
      categoryId: draft.categoryId,
      occurrenceDate: draft.occurrenceDate || undefined,
      occurrenceLocation: draft.occurrenceLocation || undefined,
      description: draft.description.trim(),
      additionalInformation: draft.additionalInformation.trim() || undefined,
      involvedPeople: draft.involvedPeople
        .filter(({ name, role, details }) => Boolean(name.trim() || role.trim() || details.trim()))
        .map(({ name, role, details }) => ({ name: name.trim(), role: role.trim(), details: details.trim() })),
      witnesses: draft.witnesses
        .filter(({ name, role, details }) => Boolean(name.trim() || role.trim() || details.trim()))
        .map(({ name, role, details }) => ({ name: name.trim(), role: role.trim(), details: details.trim() })),
      immediateRisk: draft.immediateRisk,
      immediateRiskDetails: draft.immediateRiskDetails.trim() || undefined,
      reporter: draft.mode === 'IDENTIFIED'
        ? {
            name: draft.reporterName.trim(),
            email: draft.reporterEmail.trim() || undefined,
            phone: draft.reporterPhone.trim() || undefined,
            consentToContact: draft.consentToContact,
          }
        : undefined,
    };

    setSending(true);
    try {
      const result = await publicReportsApi.create(payload, attachments);
      const lastSubmission: LastSubmission = {
        protocol: result.protocol,
        secret: result.secret,
        createdAt: result.createdAt ?? new Date().toISOString(),
        warning: result.warning,
        accessComplete: result.accessComplete,
        missingAccessFields: result.missingAccessFields,
      };

      // O envio já foi confirmado pela API. Falhas de storage/limpeza não podem fazer o
      // usuário reenviar a denúncia e criar duplicidade. O state da rota é a fonte
      // imediata; sessionStorage funciona apenas como fallback ao atualizar a página.
      try {
        sessionStorage.setItem(LAST_SUBMISSION_KEY, JSON.stringify(lastSubmission));
      } catch {
        // A tela seguinte ainda recebe os dados via navigate state.
      }

      navigate('/denuncia/enviada', { replace: true, state: { submission: lastSubmission } });
    } catch (currentError) {
      setApiError(currentError);
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicPageShell eyebrow="Nova denúncia" title="Revise antes de enviar" description="Confira as informações abaixo. Depois do envio, o relato original não poderá ser editado por este fluxo.">
      <div className="mx-auto max-w-4xl">
        <ReportProgress current={6} />
        <form onSubmit={submit}>
          {Object.keys(errors).length ? <div className="mb-5"><FormErrorSummary errors={errors} title="Há informações que precisam ser corrigidas antes do envio" /></div> : null}
          {apiError ? <div className="mb-5"><ErrorAlert error={apiError} fallback="Não foi possível enviar a denúncia. Revise os dados e tente novamente." /></div> : null}
          <div className="space-y-5">
            <Card className="p-5 sm:p-7">
              <h2 className="text-lg font-bold text-slate-900">Informações principais</h2>
              <dl className="mt-3">
                <SummaryRow label="Tipo da denúncia" value={draft.mode === 'ANONYMOUS' ? 'Anônima' : 'Identificada'} />
                <SummaryRow label="Relacionamento" value={relationshipLabel(draft.relationship)} />
                <SummaryRow label="Unidade" value={unitName} />
                <SummaryRow label="Categoria" value={categoryName} />
                <SummaryRow label="Data da ocorrência" value={formatDate(draft.occurrenceDate)} />
                <SummaryRow label="Local" value={draft.occurrenceLocation} />
                <SummaryRow label="Risco imediato" value={draft.immediateRisk ? 'Sim' : 'Não'} />
              </dl>
            </Card>

            <Card className="p-5 sm:p-7">
              <h2 className="text-lg font-bold text-slate-900">Relato</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{draft.description}</p>
              {draft.additionalInformation ? (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Informações complementares</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{draft.additionalInformation}</p>
                </div>
              ) : null}
            </Card>

            <Card className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">Pessoas e arquivos</h2>
                <span className="text-xs font-semibold text-slate-400">{attachments.length} anexo(s)</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-800">Envolvidos: {draft.involvedPeople.length}</p>
                  <p className="mt-1 text-xs text-slate-500">Testemunhas: {draft.witnesses.length}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  {attachments.length === 0 ? <p className="text-sm text-slate-500">Nenhum anexo selecionado.</p> : attachments.map((file) => <p key={`${file.name}-${file.lastModified}`} className="truncate text-xs leading-6 text-slate-600">{file.name} · {formatFileSize(file.size)}</p>)}
                </div>
              </div>
            </Card>
          </div>
          <Card className="mt-5 px-5 pb-5 sm:px-7 sm:pb-6">
            <FormActions backTo="/denunciar/anexos" nextLabel="Enviar denúncia" loading={sending} />
          </Card>
        </form>
      </div>
    </PublicPageShell>
  );
}
