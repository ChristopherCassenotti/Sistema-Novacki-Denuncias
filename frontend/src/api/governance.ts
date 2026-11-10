import { api } from './client';
import { asRecord, booleanValue, collectionFromPayload, namedReference, numberValue, stringValue, unwrapData } from './normalizers';
import type {
  AuditLogFilters,
  AuditLogItem,
  PaginatedAuditLogs,
  PaginatedRetentionExecutions,
  RetentionExecution,
  RetentionPolicy,
  RetentionPolicyFormData,
} from '../types/governance';

function paginate<T>(payload: unknown, items: T[], requestedPage = 1, requestedLimit = 20) {
  const data = unwrapData(payload);
  const record = asRecord(data) ?? {};
  const meta = asRecord(record.meta ?? record.pagination) ?? {};
  const total = numberValue(record.total, record.count, meta.total) ?? items.length;
  const page = numberValue(record.page, meta.page, meta.currentPage, meta.current_page) ?? requestedPage;
  const limit = numberValue(record.limit, meta.limit, meta.perPage, meta.per_page) ?? requestedLimit;
  const totalPages = numberValue(record.totalPages, record.total_pages, meta.totalPages, meta.total_pages)
    ?? Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  return { items, page, limit, total, totalPages };
}

function parseMetadata(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function normalizeAuditLog(value: unknown): AuditLogItem | null {
  const item = asRecord(value);
  if (!item) return null;
  const actor = asRecord(item.actor ?? item.user ?? item.adminUser ?? item.admin_user);
  const id = stringValue(item.id, item.uuid, item.auditLogId, item.audit_log_id);
  if (!id) return null;
  const result = stringValue(item.result, item.outcome, item.status);
  const unitRef = namedReference(item.unit);
  const unitId = stringValue(item.unitId, item.unit_id, unitRef?.id);
  const unitName = stringValue(item.unitName, item.unit_name, unitRef?.name);
  return {
    id,
    createdAt: stringValue(item.createdAt, item.created_at, item.timestamp, item.date) ?? null,
    actorName: stringValue(item.actorName, item.actor_name, actor?.name, actor?.email),
    actorId: stringValue(item.actorId, item.actor_id, actor?.id, actor?.uuid),
    action: stringValue(item.action, item.event, item.operation),
    entity: stringValue(item.entity, item.entityType, item.entity_type, item.resource),
    entityId: stringValue(item.entityId, item.entity_id, item.resourceId, item.resource_id),
    unit: unitId ? { id: unitId, name: unitName ?? 'Unidade' } : null,
    success: booleanValue(item.success, item.succeeded, result === 'SUCCESS' ? true : undefined, result === 'FAILURE' || result === 'FAILED' ? false : undefined),
    requestId: stringValue(item.requestId, item.request_id, item.correlationId, item.correlation_id),
    metadata: parseMetadata(item.metadata ?? item.metadataJson ?? item.metadata_json ?? item.details ?? item.meta),
  };
}

function normalizePolicy(value: unknown): RetentionPolicy | null {
  const item = asRecord(value);
  if (!item) return null;
  const id = stringValue(item.id, item.uuid, item.policyId, item.policy_id);
  const name = stringValue(item.name, item.nome, item.title);
  if (!id || !name) return null;
  const category = namedReference(item.category);
  const categoryId = stringValue(item.categoryId, item.category_id, category?.id);
  const categoryName = stringValue(item.categoryName, item.category_name, category?.name);
  const unitsRaw = Array.isArray(item.units) ? item.units : Array.isArray(item.policyUnits) ? item.policyUnits : Array.isArray(item.policy_units) ? item.policy_units : [];
  const units = unitsRaw.flatMap((entry) => {
    const record = asRecord(entry);
    const source = asRecord(record?.unit) ?? record;
    const id = stringValue(source?.id, record?.unitId, record?.unit_id);
    const name = stringValue(source?.name, source?.code);
    return id && name ? [{ id, name }] : [];
  });

  return {
    id,
    name,
    category: categoryId ? { id: categoryId, name: categoryName ?? 'Categoria' } : undefined,
    units,
    applicableStatus: stringValue(
      item.appliesToStatus,
      item.applies_to_status,
      item.applicableStatus,
      item.applicable_status,
      item.reportStatus,
      item.report_status,
      item.status,
    ),
    retentionDays: numberValue(item.retentionDays, item.retention_days, item.days, item.daysToRetain, item.days_to_retain) ?? 0,
    action: stringValue(item.action, item.retentionAction, item.retention_action) ?? 'DELETE',
    active: booleanValue(item.active, item.isActive, item.is_active, item.enabled) ?? true,
    createdAt: stringValue(item.createdAt, item.created_at) ?? null,
    updatedAt: stringValue(item.updatedAt, item.updated_at) ?? null,
    raw: value,
  };
}

function normalizeExecution(value: unknown): RetentionExecution | null {
  const item = asRecord(value);
  if (!item) return null;
  const report = asRecord(item.report);
  const unitRef = namedReference(item.unit ?? report?.unit);
  const id = stringValue(item.id, item.uuid, item.executionId, item.execution_id);
  if (!id) return null;
  return {
    id,
    reportId: stringValue(item.reportId, item.report_id, report?.id, report?.uuid),
    reportProtocol: stringValue(item.reportProtocol, item.report_protocol, report?.protocol),
    unit: unitRef ? { id: unitRef.id, name: unitRef.name } : null,
    scheduledAt: stringValue(item.scheduledAt, item.scheduled_at, item.runAt, item.run_at, item.retentionUntil, item.retention_until) ?? null,
    action: stringValue(item.action, item.retentionAction, item.retention_action),
    status: stringValue(item.status),
    attempts: numberValue(item.attempts, item.attemptCount, item.attempt_count),
    startedAt: stringValue(item.startedAt, item.started_at) ?? null,
    completedAt: stringValue(item.completedAt, item.completed_at, item.finishedAt, item.finished_at) ?? null,
    error: stringValue(item.error, item.errorMessage, item.error_message, item.lastError, item.last_error),
    raw: value,
  };
}

const auditPath = import.meta.env.VITE_AUDIT_LOGS_PATH?.trim() || '/api/admin/audit-logs';

export const auditApi = {
  configured: true,

  async list(filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 30;

    const response = await api.get(auditPath, {
      params: {
        page,
        limit,
        dateFrom: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
        dateTo: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
        actorUserId: filters.actor || undefined,
        action: filters.action || undefined,
        entityType: filters.entity || undefined,
        unitId: filters.unitId || undefined,
        success: filters.success === '' || filters.success == null ? undefined : filters.success === 'true',
      },
    });
    const items = collectionFromPayload(response.data)
      .map(normalizeAuditLog)
      .filter((item): item is AuditLogItem => Boolean(item));
    return paginate(response.data, items, page, limit);
  },

  async get(id: string): Promise<AuditLogItem> {
    const response = await api.get(`${auditPath}/${id}`);
    const data = asRecord(unwrapData(response.data)) ?? {};
    const item = normalizeAuditLog(data.log ?? data);
    if (!item) throw new Error('A API retornou um registro de auditoria em formato não reconhecido.');
    return item;
  },
};

const toCreatePolicyPayload = (data: RetentionPolicyFormData) => ({
  name: data.name.trim(),
  categoryId: data.categoryId || null,
  unitIds: data.unitIds,
  appliesToStatus: data.applicableStatus,
  retentionDays: data.retentionDays,
  action: data.action,
  isActive: data.active,
});

const toUpdatePolicyPayload = (data: RetentionPolicyFormData) => ({
  name: data.name.trim(),
  categoryId: data.categoryId || null,
  unitIds: data.unitIds,
  appliesToStatus: data.applicableStatus,
  retentionDays: data.retentionDays,
  action: data.action,
});

export const retentionApi = {
  async policies(): Promise<RetentionPolicy[]> {
    const response = await api.get('/api/admin/retention-policies');
    return collectionFromPayload(response.data)
      .map(normalizePolicy)
      .filter((item): item is RetentionPolicy => Boolean(item));
  },

  async policy(id: string): Promise<RetentionPolicy> {
    const response = await api.get(`/api/admin/retention-policies/${id}`);
    const data = asRecord(unwrapData(response.data)) ?? {};
    const item = normalizePolicy(data.policy ?? data);
    if (!item) throw new Error('A API retornou uma política de retenção em formato não reconhecido.');
    return item;
  },

  async createPolicy(data: RetentionPolicyFormData): Promise<void> {
    await api.post('/api/admin/retention-policies', toCreatePolicyPayload(data));
  },

  async updatePolicy(id: string, data: RetentionPolicyFormData): Promise<void> {
    await api.patch(`/api/admin/retention-policies/${id}`, toUpdatePolicyPayload(data));
  },

  async setPolicyStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/api/admin/retention-policies/${id}/status`, { isActive: active });
  },

  async runScheduler(): Promise<unknown> {
    const response = await api.post('/api/admin/retention-scheduler/run');
    return response.data;
  },

  async rescheduleReport(reportId: string): Promise<unknown> {
    const response = await api.post(`/api/admin/retention-scheduler/reports/${reportId}`);
    return response.data;
  },

  async runExecutor(): Promise<unknown> {
    const response = await api.post('/api/admin/retention-executor/run');
    return response.data;
  },

  async runExecution(id: string): Promise<unknown> {
    const response = await api.post(`/api/admin/retention-executor/${id}/run`);
    return response.data;
  },

  async executions(page = 1, limit = 30): Promise<PaginatedRetentionExecutions> {
    const path = import.meta.env.VITE_RETENTION_EXECUTIONS_PATH?.trim() || '/api/admin/retention-executions';
    const response = await api.get(path, { params: { page, limit } });
    const items = collectionFromPayload(response.data)
      .map(normalizeExecution)
      .filter((item): item is RetentionExecution => Boolean(item));
    return paginate(response.data, items, page, limit);
  },
};
