import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { usePublicReportDraft } from '../../context/PublicReportDraftContext';
import type { LastSubmission } from '../../types/public';

const LAST_SUBMISSION_KEY = 'nvk:last-public-submission';

type ReportSentLocationState = {
  submission?: LastSubmission;
};

function isSubmission(value: unknown): value is LastSubmission {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LastSubmission>;
  return typeof candidate.protocol === 'string'
    && typeof candidate.secret === 'string'
    && typeof candidate.createdAt === 'string';
}

function readSubmission(): LastSubmission | null {
  try {
    const value = sessionStorage.getItem(LAST_SUBMISSION_KEY);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    return isSubmission(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function CopyField({ label, value, important = false }: { label: string; value: string; important?: boolean }) {
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <div className={`flex items-center gap-2 rounded-2xl border p-2 pl-4 ${important ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-slate-50'}`}>
        <code className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-black tracking-wide ${important ? 'text-base text-brand-900 sm:text-lg' : 'text-sm text-slate-800'}`}>
          {value}
        </code>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-brand-700 shadow-sm ring-1 ring-slate-200 hover:bg-brand-50"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
        >
          <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} /> {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

function MissingCredential({ label }: { label: string }) {
  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-bold text-amber-900">Informação indisponível</p>
        <p className="mt-1 text-xs text-amber-800/80">Não feche esta página antes de pedir ajuda ao responsável pelo sistema.</p>
      </div>
    </div>
  );
}

export function ReportSentPage() {
  const location = useLocation();
  const { resetDraft } = usePublicReportDraft();
  const stateSubmission = (location.state as ReportSentLocationState | null)?.submission;
  const submission = isSubmission(stateSubmission) ? stateSubmission : readSubmission();
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    // Limpa o formulário somente depois que a rota de confirmação já foi montada.
    // Se o rascunho for apagado na revisão, o guard daquela página redireciona o
    // usuário para o início do fluxo antes que as credenciais sejam exibidas.
    resetDraft();
  }, [resetDraft]);

  const accessComplete = Boolean(submission?.protocol && submission?.secret);
  const missingLabels = useMemo(() => {
    if (!submission) return [];
    const missing: string[] = [];
    if (!submission.protocol) missing.push('protocolo');
    if (!submission.secret) missing.push('senha de acompanhamento');
    return missing;
  }, [submission]);

  const copyAll = async () => {
    if (!submission || !accessComplete) return;
    try {
      await navigator.clipboard.writeText(`Protocolo: ${submission.protocol}\nSenha de acompanhamento: ${submission.secret}`);
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 1800);
    } catch {
      setCopiedAll(false);
    }
  };

  return (
    <PublicPageShell eyebrow="Denúncia registrada" title="Seu relato foi enviado" description="Guarde as informações de acesso abaixo em um local seguro.">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden">
          <div className="bg-emerald-50 px-6 py-7 text-center sm:px-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm"><i className="bi bi-check2 text-3xl" /></span>
            <h2 className="mt-4 text-xl font-bold text-emerald-950">Denúncia recebida com sucesso</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900/70">O acompanhamento será feito pelo próprio Canal de Denúncias.</p>
          </div>

          <div className="p-6 sm:p-8">
            {submission ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Seus dados de acesso</p>
                      <p className="mt-1 text-sm text-slate-500">Somente com os dois dados será possível acompanhar esta denúncia.</p>
                    </div>
                    {accessComplete ? (
                      <button
                        type="button"
                        onClick={copyAll}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <i className={`bi ${copiedAll ? 'bi-check-lg' : 'bi-copy'}`} /> {copiedAll ? 'Dados copiados' : 'Copiar os dois'}
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    {submission.protocol
                      ? <CopyField label="Protocolo" value={submission.protocol} important />
                      : <MissingCredential label="Protocolo" />}
                    {submission.secret
                      ? <CopyField label="Senha de acompanhamento" value={submission.secret} important />
                      : <MissingCredential label="Senha de acompanhamento" />}
                  </div>
                </div>

                {accessComplete ? (
                  <Alert tone="warning">
                    <strong>Guarde o protocolo e a senha de acompanhamento agora.</strong>{' '}
                    Somente com esses dois dados será possível acompanhar a denúncia. Eles não poderão ser recuperados posteriormente.
                    {submission.warning ? <span className="mt-2 block">Se tiver dificuldade para acessar a denúncia depois, procure o responsável pelo canal.</span> : null}
                  </Alert>
                ) : (
                  <Alert tone="danger">
                    <strong>A denúncia foi registrada, mas faltou uma informação para o acompanhamento.</strong>{' '}
                    Faltou {missingLabels.join(' e ')}. Não envie a denúncia novamente, pois isso pode gerar duplicidade. Peça ajuda ao responsável pelo canal.
                  </Alert>
                )}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  {submission.protocol ? (
                    <Link to={`/acompanhar?protocol=${encodeURIComponent(submission.protocol)}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800">
                      Acompanhar denúncia <i className="bi bi-arrow-right" />
                    </Link>
                  ) : (
                    <span className="inline-flex h-11 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 text-sm font-bold text-slate-500">
                      Acompanhamento indisponível
                    </span>
                  )}
                  <Link to="/" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">Voltar ao início</Link>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Alert tone="info">Os dados de acesso desta denúncia não estão mais disponíveis nesta aba. Use as informações que você salvou para acompanhar o relato.</Alert>
                <Link to="/acompanhar" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-bold text-white">Acessar acompanhamento</Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PublicPageShell>
  );
}
