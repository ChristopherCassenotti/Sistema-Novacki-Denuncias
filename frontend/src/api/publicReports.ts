import { api } from './client';
import { asRecord, collectionFromPayload, numberValue, stringValue, unwrapData } from './normalizers';
import type {
  CreatePublicReportPayload,
  PublicAttachment,
  PublicHistoryEvent,
  PublicMessage,
  PublicReport,
  ReportSubmissionResult,
} from '../types/public';
import type { ReportAttachment, ReportMessage } from '../types/reports';
import { publicHistoryEventLabel } from '../utils/displayLabels';

const normalizedKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const findDeepString = (payload: unknown, aliases: string[]): string | undefined => {
  const wanted = new Set(aliases.map(normalizedKey));
  const queue: Array<{ value: unknown; depth: number }> = [{ value: payload, depth: 0 }];
  const visited = new Set<object>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth > 6) continue;

    const record = asRecord(current.value);
    if (!record || visited.has(record)) continue;
    visited.add(record);

    for (const [key, value] of Object.entries(record)) {
      if (wanted.has(normalizedKey(key))) {
        const found = stringValue(value);
        if (found) return found;
      }
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          value.slice(0, 20).forEach((item) => queue.push({ value: item, depth: current.depth + 1 }));
        } else {
          queue.push({ value, depth: current.depth + 1 });
        }
      }
    }
  }

  return undefined;
};

const headerValue = (headers: unknown, aliases: string[]): string | undefined => {
  const record = asRecord(headers);
  if (!record) return undefined;
  const wanted = new Set(aliases.map(normalizedKey));

  for (const [key, value] of Object.entries(record)) {
    if (wanted.has(normalizedKey(key))) {
      const found = stringValue(value);
      if (found) return found;
    }
  }

  return undefined;
};

const normalizeSubmission = (payload: unknown, headers?: unknown): ReportSubmissionResult => {
  // A API pode devolver as credenciais no nível raiz, em `data`, `report`, `access`,
  // `credentials`, `reporterAccess` ou outros envelopes. A busca profunda evita que
  // uma denúncia criada com sucesso seja tratada como falha apenas por variação do JSON.
  const protocolAliases = [
    'protocol',
    'protocolo',
    'reportProtocol',
    'report_protocol',
    'protocolNumber',
    'protocol_number',
    'trackingProtocol',
    'tracking_protocol',
    'reportCode',
    'report_code',
  ];

  const secretAliases = [
    'accessSecret',
    'access_secret',
    'secret',
    'segredo',
    'reportSecret',
    'report_secret',
    'reporterSecret',
    'reporter_secret',
    'reporterAccessSecret',
    'reporter_access_secret',
    'trackingSecret',
    'tracking_secret',
    'accessKey',
    'access_key',
    'reportAccessKey',
    'report_access_key',
  ];

  const protocol = findDeepString(payload, protocolAliases)
    ?? headerValue(headers, ['x-report-protocol', 'x-protocol', 'report-protocol']);
  const secret = findDeepString(payload, secretAliases)
    ?? headerValue(headers, ['x-report-secret', 'x-access-secret', 'report-secret', 'access-secret']);
  const createdAt = findDeepString(payload, ['createdAt', 'created_at']);
  const warning = findDeepString(payload, ['warning', 'aviso']);

  const missingAccessFields: Array<'protocol' | 'secret'> = [];
  if (!protocol) missingAccessFields.push('protocol');
  if (!secret) missingAccessFields.push('secret');

  return {
    protocol: protocol ?? '',
    secret: secret ?? '',
    createdAt,
    warning,
    accessComplete: missingAccessFields.length === 0,
    missingAccessFields,
    raw: payload,
  };
};

const normalizePublicReport = (payload: unknown): PublicReport => {
  const container = asRecord(unwrapData(payload)) ?? {};
  const data = asRecord(container.report) ?? container;

  return {
    protocol: stringValue(data.protocol),
    status: stringValue(data.status) ?? 'RECEIVED',
    createdAt: stringValue(data.createdAt, data.created_at) ?? null,
    updatedAt: stringValue(data.lastActivityAt, data.last_activity_at) ?? null,
    concludedAt: stringValue(data.concludedAt, data.concluded_at) ?? null,
    archivedAt: stringValue(data.archivedAt, data.archived_at) ?? null,
    raw: payload,
  };
};

const normalizeMessages = (payload: unknown): PublicMessage[] =>
  collectionFromPayload(payload).map((value, index) => {
    const item = asRecord(value) ?? {};
    const senderType = stringValue(item.senderType, item.sender_type, item.direction, item.authorType, item.source, item.origin);
    const normalized: ReportMessage = {
      id: stringValue(item.id, item.uuid) ?? `message-${index}`,
      type: stringValue(item.type, item.messageType, item.message_type),
      content: stringValue(item.body, item.content, item.message, item.text) ?? '',
      authorName: stringValue(item.authorName, item.author_name, item.senderName, item.sender_name, item.author),
      direction:
        senderType === 'REPORTER' || senderType === 'ADMIN'
          ? senderType
          : senderType?.toUpperCase().includes('REPORT')
            ? 'REPORTER'
            : senderType?.toUpperCase().includes('ADMIN')
              ? 'ADMIN'
              : senderType,
      createdAt: stringValue(item.createdAt, item.created_at, item.sentAt, item.sent_at),
    };
    return normalized;
  });

const normalizeAttachments = (payload: unknown): PublicAttachment[] =>
  collectionFromPayload(payload).map((value, index) => {
    const item = asRecord(value) ?? {};
    const normalized: ReportAttachment = {
      id: stringValue(item.id, item.uuid) ?? `attachment-${index}`,
      name: stringValue(item.originalName, item.original_name, item.fileName, item.file_name, item.filename, item.name) ?? 'Arquivo',
      mimeType: stringValue(item.mimeType, item.mime_type, item.mimetype, item.contentType, item.content_type),
      size: numberValue(item.sizeBytes, item.size_bytes, item.size, item.fileSize, item.file_size),
      createdAt: stringValue(item.createdAt, item.created_at),
      scanStatus: stringValue(item.scanStatus, item.scan_status, item.status),
      source: stringValue(item.uploadedByType, item.uploaded_by_type, item.source, item.origin, item.uploaderType, item.uploader_type),
    };
    return normalized;
  });

const normalizeHistory = (payload: unknown): PublicHistoryEvent[] =>
  collectionFromPayload(payload).map((value, index) => {
    const item = asRecord(value) ?? {};
    const eventType = stringValue(item.type, item.eventType, item.event_type, item.action);
    const status = stringValue(item.newStatus, item.new_status, item.status);

    return {
      id: stringValue(item.id, item.uuid) ?? `history-${index}`,
      title: stringValue(item.title, item.label, item.eventName, item.event_name)
        ?? publicHistoryEventLabel(eventType)
        ?? (status ? `Status: ${status}` : 'Atualização da denúncia'),
      description: stringValue(item.description, item.details, item.publicMessage, item.public_message, item.message),
      status,
      createdAt: stringValue(item.createdAt, item.created_at, item.occurredAt, item.occurred_at),
    };
  });

const personToText = (person: CreatePublicReportPayload['involvedPeople'][number]) =>
  [person.name, person.role, person.details].map((value) => value?.trim()).filter(Boolean).join(' — ');

function buildApiPayload(payload: CreatePublicReportPayload) {
  // O backend só persiste as chaves documentadas de `content`. Informações que ainda
  // não possuem campo próprio no schema são incorporadas à descrição para não serem
  // descartadas silenciosamente pelo Zod.
  const relationshipType = payload.relationship === 'THIRD_PARTY' ? 'OTHER' : payload.relationship;
  const description = [
    payload.description.trim(),
    payload.additionalInformation?.trim()
      ? `Informações complementares:
${payload.additionalInformation.trim()}`
      : '',
    payload.immediateRiskDetails?.trim()
      ? `Detalhes sobre o risco imediato:
${payload.immediateRiskDetails.trim()}`
      : '',
    payload.relationship === 'THIRD_PARTY'
      ? 'Relacionamento informado pelo denunciante: Terceiro(a).'
      : '',
  ].filter(Boolean).join('\n\n');

  const content: Record<string, unknown> = {
    occurrenceDateApprox: payload.occurrenceDate?.trim() || undefined,
    location: payload.occurrenceLocation?.trim() || undefined,
    description,
    involvedPeople: payload.involvedPeople.map(personToText).filter(Boolean),
    witnesses: payload.witnesses.map(personToText).filter(Boolean),
  };

  return {
    mode: payload.mode,
    relationshipType,
    unitId: payload.unitId,
    categoryId: payload.categoryId,
    immediateRisk: payload.immediateRisk,
    content,
    ...(payload.mode === 'IDENTIFIED' && payload.reporter
      ? {
          identity: {
            name: payload.reporter.name,
            email: payload.reporter.email || undefined,
            phone: payload.reporter.phone || undefined,
            consentToContact: payload.reporter.consentToContact,
          },
        }
      : {}),
  };
}

export const publicReportsApi = {
  async create(payload: CreatePublicReportPayload, attachments: File[] = []): Promise<ReportSubmissionResult> {
    const apiPayload = buildApiPayload(payload);

    if (attachments.length > 0) {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(apiPayload));
      attachments.slice(0, 5).forEach((file) => formData.append('files', file));
      const response = await api.post('/api/public/reports/with-attachments', formData);
      return normalizeSubmission(response.data, response.headers);
    }

    const response = await api.post('/api/public/reports', apiPayload);
    return normalizeSubmission(response.data, response.headers);
  },

  async access(protocol: string, secret: string): Promise<void> {
    await api.post('/api/public/reports/access', { protocol, accessSecret: secret });
  },

  async logout(): Promise<void> {
    await api.post('/api/public/reports/logout');
  },

  async current(): Promise<PublicReport> {
    const response = await api.get('/api/public/reports/current');
    return normalizePublicReport(response.data);
  },

  async history(): Promise<PublicHistoryEvent[]> {
    const response = await api.get('/api/public/reports/current/history');
    return normalizeHistory(response.data);
  },

  async messages(): Promise<PublicMessage[]> {
    const response = await api.get('/api/public/reports/current/messages');
    return normalizeMessages(response.data);
  },

  async sendMessage(content: string): Promise<void> {
    await api.post('/api/public/reports/current/messages', { body: content });
  },

  async attachments(): Promise<PublicAttachment[]> {
    const response = await api.get('/api/public/reports/current/attachments');
    return normalizeAttachments(response.data);
  },

  async uploadAttachment(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/api/public/reports/current/attachments', formData);
  },

  async downloadAttachment(attachmentId: string, fileName: string): Promise<void> {
    const response = await api.get(`/api/public/reports/current/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data as Blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};
