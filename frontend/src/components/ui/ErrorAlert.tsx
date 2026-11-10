import { useMemo, useState } from 'react';
import type { ApiErrorInfo } from '../../utils/httpError';
import { toApiError } from '../../utils/httpError';

type ErrorAlertProps = {
  error: unknown | ApiErrorInfo;
  fallback?: string;
  showTechnicalDetails?: boolean;
  onRetry?: () => void;
};

const isApiErrorInfo = (value: unknown): value is ApiErrorInfo =>
  Boolean(value && typeof value === 'object' && 'title' in value && 'message' in value && 'fieldErrors' in value);

const fieldLabels: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  password: 'Senha',
  newPassword: 'Nova senha',
  confirmPassword: 'Confirmação da senha',
  roleIds: 'Perfis de acesso',
  members: 'Membros da equipe',
  userId: 'Usuário',
  teamId: 'Equipe',
  categoryId: 'Categoria',
  unitId: 'Unidade',
  relationshipType: 'Relacionamento',
  immediateRisk: 'Risco imediato',
  reason: 'Motivo',
  notes: 'Observações',
  retentionDays: 'Prazo de guarda',
  appliesToStatus: 'Situação da denúncia',
  targetUserId: 'Usuário responsável',
  targetTeamId: 'Equipe responsável',
};

const friendlyFieldName = (field?: string) => {
  if (!field) return undefined;
  const last = field.split('.').at(-1) ?? field;
  return fieldLabels[last] ?? fieldLabels[field] ?? undefined;
};

export function ErrorAlert({ error, fallback, showTechnicalDetails = false, onRetry }: ErrorAlertProps) {
  const [copied, setCopied] = useState(false);
  const parsed = useMemo(
    () => (isApiErrorInfo(error) ? error : toApiError(error, fallback)),
    [error, fallback],
  );

  const displayMessage = fallback || parsed.message;

  const diagnostic = [
    parsed.title,
    parsed.message,
    parsed.code ? `Código: ${parsed.code}` : '',
    parsed.requestId ? `Referência: ${parsed.requestId}` : '',
    parsed.method ? `Método: ${parsed.method}` : '',
    parsed.url ? `Endereço interno: ${parsed.url}` : '',
    ...parsed.fieldErrors.map((item) => `${item.field ? `${item.field}: ` : ''}${item.message}`),
    ...parsed.details,
  ].filter(Boolean).join('\n');

  const copyDiagnostic = async () => {
    try {
      await navigator.clipboard.writeText(diagnostic);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{parsed.title}</p>
          </div>

          <p className="mt-1 text-sm leading-6 text-red-900">{displayMessage}</p>

          {parsed.fieldErrors.length ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-white/70 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-red-800">O que precisa ser corrigido</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {parsed.fieldErrors.map((item, index) => (
                  <li key={`${item.field ?? 'field'}-${index}`} className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span><strong>{friendlyFieldName(item.field) ? `${friendlyFieldName(item.field)}: ` : ''}</strong>{item.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {parsed.hint ? (
            <p className="mt-3 text-sm"><strong>Como resolver:</strong> {parsed.hint}</p>
          ) : null}

          {parsed.requestId ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-red-800">
              <span><strong>Código para suporte:</strong> {parsed.requestId}</span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry ? (
              <button type="button" onClick={onRetry} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-800">
                <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Tentar novamente
              </button>
            ) : null}
            {(parsed.requestId || showTechnicalDetails) ? (
              <button type="button" onClick={() => void copyDiagnostic()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-800 hover:bg-red-100">
                <i className={`bi ${copied ? 'bi-check2' : 'bi-copy'}`} aria-hidden="true" /> {copied ? 'Copiado' : 'Copiar informações para suporte'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
