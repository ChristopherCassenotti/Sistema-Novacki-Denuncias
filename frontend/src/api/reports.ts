import { api } from './client';
import {
  asArray,
  asRecord,
  booleanValue,
  collectionFromPayload,
  namedReference,
  numberValue,
  stringValue,
  unwrapData,
} from './normalizers';
import type {
  AccessGrant,
  InternalNote,
  LegalHoldState,
  PaginatedReports,
  ReporterIdentity,
  ReportAttachment,
  ReportDetail,
  ReportListFilters,
  ReportListItem,
  ReportMessage,
  ReportRestriction,
} from '../types/reports';

function normalizeReportListItem(value: unknown): ReportListItem {
  const item = asRecord(value) ?? {};
  const category = namedReference(item.category) ?? (item.categoryName || item.category_name ? { id: stringValue(item.categoryId, item.category_id) ?? '', name: String(item.categoryName ?? item.category_name) } : null);
  const unit = namedReference(item.unit) ?? (item.unitName || item.unit_name ? { id: stringValue(item.unitId, item.unit_id) ?? '', name: String(item.unitName ?? item.unit_name) } : null);
  const assignment = asRecord(item.assignment);
  const assignee = namedReference(item.assigneeUser ?? assignment?.user ?? item.currentAssigneeUser ?? item.current_assignee_user ?? item.assignee ?? item.assignedUser ?? item.responsible);
  const team = namedReference(item.assigneeTeam ?? assignment?.team ?? item.currentAssigneeTeam ?? item.current_assignee_team ?? item.team ?? item.assignedTeam);

  return {
    id: stringValue(item.id, item.uuid) ?? '',
    protocol: stringValue(item.protocol, item.protocolNumber, item.protocol_number, item.code) ?? 'Sem protocolo',
    category,
    unit,
    status: stringValue(item.status) ?? 'RECEIVED',
    priority: stringValue(item.priority) ?? null,
    immediateRisk: booleanValue(item.immediateRisk, item.immediate_risk, item.riskImmediate, item.hasImmediateRisk) ?? false,
    mode: stringValue(item.mode, item.reportMode, item.report_mode) ?? null,
    assignee,
    team,
    createdAt: stringValue(item.createdAt, item.created_at) ?? null,
    updatedAt: stringValue(item.lastActivityAt, item.last_activity_at, item.updatedAt, item.updated_at) ?? null,
  };
}

function normalizeReportDetail(payload: unknown): ReportDetail {
  const data = unwrapData(payload);
  const container = asRecord(data) ?? {};
  const item = asRecord(container.report) ?? container;
  const base = normalizeReportListItem(item);

  const content = asRecord(item.content) ?? {};

  const normalizePeople = (value: unknown) =>
    asArray(value).map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry };
      }

      const person = asRecord(entry) ?? {};
      return {
        name: stringValue(person.name, person.nome),
        role: stringValue(person.role, person.function, person.relationship),
        details: stringValue(person.details, person.description, person.notes),
      };
    });

  return {
    ...base,
    version: numberValue(item.statusVersion, item.status_version, item.version, item.lockVersion, item.lock_version),
    description: stringValue(content.description, item.description, item.report, item.details),
    occurrenceDate: stringValue(
      content.approximateDate,
      content.approximate_date,
      content.occurrenceDateApprox,
      content.occurrence_date_approx,
      item.occurrenceDate,
      item.occurrence_date,
      item.eventDate,
    ) ?? null,
    occurrenceLocation: stringValue(
      content.occurrenceLocation,
      content.occurrence_location,
      content.location,
      item.occurrenceLocation,
      item.occurrence_location,
      item.location,
    ) ?? null,
    relationship: stringValue(item.relationshipType, item.relationship_type, item.relationship, item.relationshipWithCompany, item.relationship_with_company) ?? null,
    additionalInformation: stringValue(item.additionalInformation, item.additional_information, item.complement) ?? null,
    peopleInvolved: normalizePeople(content.involvedPeople ?? content.involved_people ?? item.peopleInvolved ?? item.people_involved ?? item.involvedPeople),
    witnesses: normalizePeople(content.witnesses ?? item.witnesses),
    identityStored: booleanValue(item.identityStored, item.identity_stored, item.hasIdentity, item.has_identity),
    legalHold: booleanValue(item.legalHold, item.legal_hold, item.hasLegalHold),
    raw: payload,
  };
}

function normalizePaginatedReports(payload: unknown, requestedPage = 1, requestedLimit = 20): PaginatedReports {
  const unwrapped = unwrapData(payload);
  const record = asRecord(unwrapped);
  const items = collectionFromPayload(payload).map(normalizeReportListItem);
  const meta = asRecord(record?.meta ?? record?.pagination);
  const total = numberValue(record?.total, meta?.total, record?.count) ?? items.length;
  const page = numberValue(record?.page, meta?.page, meta?.currentPage, meta?.current_page) ?? requestedPage;
  const limit = numberValue(record?.limit, meta?.limit, meta?.perPage, meta?.per_page) ?? requestedLimit;
  const totalPages = numberValue(record?.totalPages, record?.total_pages, meta?.totalPages, meta?.total_pages) ?? Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  return { items, page, limit, total, totalPages };
}

function normalizeMessage(value: unknown): ReportMessage {
  const item = asRecord(value) ?? {};
  const author = asRecord(item.sender ?? item.author ?? item.user);
  return {
    id: stringValue(item.id, item.uuid) ?? crypto.randomUUID(),
    type: stringValue(item.type),
    content: stringValue(item.content, item.message, item.text, item.body) ?? '',
    authorName: stringValue(item.authorName, item.author_name, author?.name),
    direction: stringValue(item.direction, item.origin, item.senderType, item.sender_type),
    createdAt: stringValue(item.createdAt, item.created_at) ?? null,
  };
}

function normalizeNote(value: unknown): InternalNote {
  const item = asRecord(value) ?? {};
  const author = asRecord(item.author ?? item.user);
  return {
    id: stringValue(item.id, item.uuid) ?? crypto.randomUUID(),
    content: stringValue(item.content, item.note, item.text, item.body) ?? '',
    authorName: stringValue(item.authorName, item.author_name, author?.name),
    createdAt: stringValue(item.createdAt, item.created_at) ?? null,
  };
}

function normalizeAttachment(value: unknown): ReportAttachment {
  const item = asRecord(value) ?? {};
  return {
    id: stringValue(item.id, item.uuid) ?? '',
    name: stringValue(item.name, item.fileName, item.filename, item.originalName, item.original_name) ?? 'Arquivo',
    mimeType: stringValue(item.mimeType, item.mime_type, item.type),
    size: numberValue(item.sizeBytes, item.size_bytes, item.size, item.fileSize, item.file_size),
    createdAt: stringValue(item.createdAt, item.created_at) ?? null,
    scanStatus: stringValue(item.scanStatus, item.scan_status, item.status),
    source: stringValue(item.uploadedByType, item.uploaded_by_type, item.source, item.origin, item.uploaderType, item.uploader_type),
  };
}

async function listReportsPage(filters: ReportListFilters = {}): Promise<PaginatedReports> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const params = {
    page,
    limit,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    categoryId: filters.categoryId || undefined,
    unitId: filters.unitId || undefined,
    mode: filters.mode || undefined,
    immediateRisk: typeof filters.immediateRisk === 'boolean' ? filters.immediateRisk : undefined,
  };
  const response = await api.get('/api/admin/reports', { params });
  return normalizePaginatedReports(response.data, page, limit);
}

async function listAllReports(filters: ReportListFilters = {}): Promise<ReportListItem[]> {
  const limit = 100;
  const first = await listReportsPage({ ...filters, page: 1, limit });
  if (first.totalPages <= 1) return first.items;

  const items = [...first.items];
  const batchSize = 5;
  for (let start = 2; start <= first.totalPages; start += batchSize) {
    const pages = Array.from({ length: Math.min(batchSize, first.totalPages - start + 1) }, (_, index) => start + index);
    const responses = await Promise.all(pages.map((page) => listReportsPage({ ...filters, page, limit })));
    responses.forEach((response) => items.push(...response.items));
  }
  return items;
}

export const reportsApi = {
  list: listReportsPage,
  listAll: listAllReports,

  async get(id: string): Promise<ReportDetail> {
    const response = await api.get(`/api/admin/reports/${id}`);
    return normalizeReportDetail(response.data);
  },

  async changeStatus(id: string, status: string, expectedVersion: number): Promise<void> {
    await api.patch(`/api/admin/reports/${id}/status`, { status, expectedVersion });
  },

  async changePriority(id: string, priority: string): Promise<void> {
    await api.patch(`/api/admin/reports/${id}/priority`, { priority });
  },

  async assign(id: string, payload: { targetType: 'USER' | 'TEAM'; targetId: string; reason?: string }): Promise<void> {
    await api.put(`/api/admin/reports/${id}/assignment`, payload);
  },

  async unassign(id: string): Promise<void> {
    await api.delete(`/api/admin/reports/${id}/assignment`);
  },

  async messages(id: string): Promise<ReportMessage[]> {
    const response = await api.get(`/api/admin/reports/${id}/messages`);
    return collectionFromPayload(response.data).map(normalizeMessage);
  },

  async sendMessage(id: string, payload: { type: 'STANDARD' | 'QUESTION' | 'FINAL_RESPONSE'; content: string }): Promise<void> {
    await api.post(`/api/admin/reports/${id}/messages`, {
      type: payload.type,
      body: payload.content,
    });
  },

  async internalNotes(id: string): Promise<InternalNote[]> {
    const response = await api.get(`/api/admin/reports/${id}/internal-notes`);
    return collectionFromPayload(response.data).map(normalizeNote);
  },

  async createInternalNote(id: string, content: string): Promise<void> {
    await api.post(`/api/admin/reports/${id}/internal-notes`, { body: content });
  },

  async attachments(id: string): Promise<ReportAttachment[]> {
    const response = await api.get(`/api/admin/reports/${id}/attachments`);
    return collectionFromPayload(response.data).map(normalizeAttachment);
  },

  async uploadAttachment(id: string, file: File): Promise<void> {
    const data = new FormData();
    data.append('file', file);
    await api.post(`/api/admin/reports/${id}/attachments`, data);
  },

  async downloadAttachment(id: string, attachmentId: string): Promise<Blob> {
    const response = await api.get(`/api/admin/reports/${id}/attachments/${attachmentId}/download`, { responseType: 'blob' });
    return response.data as Blob;
  },

  async restrictions(id: string): Promise<ReportRestriction[]> {
    const response = await api.get(`/api/admin/reports/${id}/restrictions`);
    return collectionFromPayload(response.data).map((value) => {
      const item = asRecord(value) ?? {};
      const user = asRecord(item.user);
      return {
        userId: stringValue(item.userId, item.user_id, user?.id) ?? '',
        userName: stringValue(item.userName, item.user_name, user?.name),
        reason: stringValue(item.reason),
        createdAt: stringValue(item.createdAt, item.created_at) ?? null,
      };
    });
  },

  async addRestriction(
    id: string,
    payload: {
      userId: string;
      reason: 'MENTIONED_IN_REPORT' | 'CONFLICT_OF_INTEREST' | 'HR_INVOLVEMENT' | 'ADMIN_INVOLVEMENT' | 'MANUAL';
      notes?: string;
    },
  ): Promise<void> {
    await api.post(`/api/admin/reports/${id}/restrictions`, payload);
  },

  async removeRestriction(id: string, userId: string): Promise<void> {
    await api.delete(`/api/admin/reports/${id}/restrictions/${userId}`);
  },

  async accessGrants(id: string): Promise<AccessGrant[]> {
    const response = await api.get(`/api/admin/reports/${id}/access-grants`);
    return collectionFromPayload(response.data).map((value) => {
      const item = asRecord(value) ?? {};
      const user = asRecord(item.user);
      return {
        id: stringValue(item.id, item.uuid) ?? '',
        userId: stringValue(item.userId, item.user_id, user?.id),
        userName: stringValue(item.userName, item.user_name, user?.name),
        scope: stringValue(item.scope),
        reason: stringValue(item.reason),
        createdAt: stringValue(item.createdAt, item.created_at) ?? null,
        expiresAt: stringValue(item.expiresAt, item.expires_at) ?? null,
      };
    });
  },

  async addAccessGrant(id: string, payload: { userId: string; scope: 'VIEW' | 'MESSAGE' | 'INVESTIGATE' | 'MANAGE'; reason?: string }): Promise<void> {
    await api.post(`/api/admin/reports/${id}/access-grants`, payload);
  },

  async removeAccessGrant(id: string, grantId: string): Promise<void> {
    await api.delete(`/api/admin/reports/${id}/access-grants/${grantId}`);
  },

  async identity(id: string): Promise<ReporterIdentity> {
    const response = await api.get(`/api/admin/reports/${id}/identity`);
    const data = unwrapData(response.data);
    const container = asRecord(data) ?? {};
    const item = asRecord(container.identity) ?? container;
    return {
      name: stringValue(item.name, item.nome),
      email: stringValue(item.email),
      phone: stringValue(item.phone, item.telephone, item.telefone),
      raw: response.data,
    };
  },

  async applyLegalHold(id: string, reason: string): Promise<void> {
    await api.post(`/api/admin/reports/${id}/legal-hold`, { reason });
  },

  async releaseLegalHold(id: string, reason: string): Promise<void> {
    await api.post(`/api/admin/reports/${id}/legal-hold/release`, { reason });
  },

  async legalHold(id: string): Promise<LegalHoldState> {
    const response = await api.get(`/api/admin/reports/${id}/legal-hold`);
    const data = unwrapData(response.data);
    const container = asRecord(data) ?? {};
    const item = asRecord(container.legalHold ?? container.legal_hold) ?? container;
    return {
      active: booleanValue(item.active, item.isActive, item.is_active, item.legalHold, item.legal_hold) ?? false,
      reason: stringValue(item.reason),
      appliedAt: stringValue(item.appliedAt, item.applied_at, item.createdAt) ?? null,
      appliedBy: stringValue(item.appliedBy, item.applied_by),
      retentionUntil: stringValue(item.retentionUntil, item.retention_until, container.retentionUntil, container.retention_until) ?? null,
      retentionAction: stringValue(item.retentionAction, item.retention_action, container.retentionAction, container.retention_action),
      retentionStatus: stringValue(item.retentionStatus, item.retention_status, container.retentionStatus, container.retention_status),
      raw: response.data,
    };
  },
};

export { normalizeReportListItem };
