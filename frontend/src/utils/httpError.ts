import axios from 'axios';

export type ApiFieldError = {
  field?: string;
  message: string;
};

export type ApiErrorInfo = {
  title: string;
  message: string;
  status?: number;
  code?: string;
  requestId?: string;
  fieldErrors: ApiFieldError[];
  details: string[];
  retryable: boolean;
  hint?: string;
  method?: string;
  url?: string;
  raw?: unknown;
};

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
  errorCode?: unknown;
  requestId?: unknown;
  request_id?: unknown;
  details?: unknown;
  errors?: unknown;
  issues?: unknown;
  fieldErrors?: unknown;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const toUserMessage = (value: unknown): string | undefined => {
  const message = asString(value);
  if (!message) return undefined;

  const withoutHttpStatus = message
    .replace(/\brequest failed with status code\s+\d{3}\b[\s:;,.\-]*/gi, '')
    .replace(/^http(?: error)?\s*\d{3}\b[\s:;,.\-]*/gi, '')
    .trim();

  if (!withoutHttpStatus) return undefined;
  if (/^(network error|failed to fetch|load failed)$/i.test(withoutHttpStatus)) return undefined;
  if (/^timeout of \d+ms exceeded$/i.test(withoutHttpStatus)) return undefined;
  if (/^(bad request|unauthorized|forbidden|not found|internal server error|service unavailable)$/i.test(withoutHttpStatus)) return undefined;

  return withoutHttpStatus;
};

const flattenMessages = (value: unknown, prefix?: string): ApiFieldError[] => {
  if (!value) return [];

  if (typeof value === 'string') {
    return [{ field: prefix, message: value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return [{ field: prefix, message: item }];
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const field = asString(obj.field) ?? asString(obj.path) ?? prefix;
        const message = asString(obj.message) ?? asString(obj.error);
        if (message) return [{ field, message }];
        return flattenMessages(item, field);
      }
      return [];
    });
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
      if (key === 'message' || key === 'error' || key === 'code' || key === 'requestId' || key === 'request_id') {
        return [];
      }
      const field = prefix ? `${prefix}.${key}` : key;
      return flattenMessages(item, field);
    });
  }

  return [];
};

const toDetails = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return [item];
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const message = asString(obj.message) ?? asString(obj.error);
        return message ? [message] : [];
      }
      return [];
    });
  }
  return [];
};

const statusMeta = (status?: number) => {
  switch (status) {
    case 400:
      return { title: 'Confira as informações', hint: 'Revise os campos preenchidos e tente novamente.', retryable: false };
    case 401:
      return { title: 'Não foi possível confirmar o acesso', hint: 'Confira seu e-mail e senha e tente novamente. Se o acesso expirou, entre novamente.', retryable: false };
    case 403:
      return { title: 'Acesso negado', hint: 'Seu usuário não possui permissão para esta operação. Se precisar desse acesso, solicite-o ao administrador.', retryable: false };
    case 404:
      return { title: 'Registro não encontrado', hint: 'Atualize a página. Se o registro continuar indisponível, volte à tela anterior e faça uma nova consulta.', retryable: false };
    case 409:
      return { title: 'Não foi possível salvar a alteração', hint: 'Atualize a tela, confira as informações atuais e tente novamente.', retryable: true };
    case 413:
      return { title: 'Arquivo muito grande', hint: 'Reduza o tamanho do arquivo e tente novamente.', retryable: false };
    case 415:
      return { title: 'Formato não suportado', hint: 'Use um tipo de arquivo aceito pelo sistema.', retryable: false };
    case 422:
      return { title: 'Confira os campos', hint: 'Corrija os campos indicados abaixo e tente novamente.', retryable: false };
    case 429:
      return { title: 'Muitas tentativas', hint: 'Aguarde alguns instantes antes de tentar novamente.', retryable: true };
    case 500:
      return { title: 'Não foi possível concluir a operação', hint: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.', retryable: true };
    case 502:
    case 503:
    case 504:
      return { title: 'Serviço temporariamente indisponível', hint: 'Aguarde alguns instantes e tente novamente.', retryable: true };
    default:
      return status && status >= 500
        ? { title: 'Não foi possível concluir a operação', hint: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.', retryable: true }
        : status && status >= 400
          ? { title: 'Não foi possível concluir a operação', hint: 'Confira as informações e tente novamente. Se o problema persistir, entre em contato com o suporte.', retryable: false }
          : { title: 'Não foi possível concluir a operação', hint: undefined, retryable: false };
  }
};

export function toApiError(error: unknown, fallback = 'Não foi possível concluir a operação. Tente novamente.'): ApiErrorInfo {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return {
      title: 'Erro inesperado',
      message: fallback,
      fieldErrors: [],
      details: [],
      retryable: true,
      hint: 'Tente novamente. Se o erro persistir, informe esta mensagem ao suporte.',
      raw: error,
    };
  }

  const status = error.response?.status;
  const meta = statusMeta(status);
  const payload = error.response?.data;
  const payloadRecord = payload && typeof payload === 'object' ? payload as ApiErrorPayload : undefined;
  const nestedError = payloadRecord?.error && typeof payloadRecord.error === 'object'
    ? payloadRecord.error as Record<string, unknown>
    : undefined;

  if (!error.response) {
    const timeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    return {
      title: timeout ? 'O sistema demorou para responder' : 'Sem conexão com o sistema',
      message: timeout
        ? 'O sistema demorou mais do que o esperado para responder.'
        : 'Não foi possível se conectar ao sistema.',
      code: error.code,
      fieldErrors: [],
      details: [],
      retryable: true,
      hint: timeout
        ? 'Aguarde alguns instantes e tente novamente.'
        : 'Confira sua conexão com a internet e tente novamente.',
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      raw: error,
    };
  }

  const payloadMessages = [
    ...toDetails(payloadRecord?.message),
    ...toDetails(nestedError?.message),
  ].map(toUserMessage).filter((item): item is string => Boolean(item));

  const message = toUserMessage(payload)
    ?? toUserMessage(payloadRecord?.message)
    ?? payloadMessages[0]
    ?? toUserMessage(payloadRecord?.error)
    ?? toUserMessage(nestedError?.message)
    ?? fallback;

  const code = asString(payloadRecord?.code)
    ?? asString(payloadRecord?.errorCode)
    ?? asString(nestedError?.code);
  const requestId = asString(payloadRecord?.requestId)
    ?? asString(payloadRecord?.request_id)
    ?? asString(nestedError?.requestId)
    ?? asString(error.response.headers?.['x-request-id']);

  const fieldErrors = [
    ...flattenMessages(payloadRecord?.fieldErrors),
    ...flattenMessages(payloadRecord?.errors),
    ...flattenMessages(payloadRecord?.issues),
    ...flattenMessages(nestedError?.errors),
    ...flattenMessages(nestedError?.issues),
  ].map((item) => ({ ...item, message: toUserMessage(item.message) }))
    .filter((item): item is ApiFieldError => Boolean(item.message));

  const details = [
    ...payloadMessages,
    ...toDetails(payloadRecord?.details),
    ...toDetails(nestedError?.details),
  ].map(toUserMessage)
    .filter((item): item is string => Boolean(item && item !== message));

  const hint = requestId && status && status >= 500
    ? 'Tente novamente. Se o problema persistir, informe o código abaixo ao suporte.'
    : meta.hint;

  return {
    title: meta.title,
    message,
    status,
    code,
    requestId,
    fieldErrors,
    details,
    retryable: meta.retryable,
    hint,
    method: error.config?.method?.toUpperCase(),
    url: error.config?.url,
    raw: payload,
  };
}

export const getHttpErrorMessage = (
  error: unknown,
  fallback = 'Não foi possível concluir a operação. Tente novamente.',
) => {
  const parsed = toApiError(error, fallback);
  const parts = [fallback];
  if (parsed.hint && !fallback.includes(parsed.hint)) parts.push(parsed.hint);
  if (parsed.requestId) parts.push(`Código para suporte: ${parsed.requestId}`);
  return parts.filter(Boolean).join(' ');
};
