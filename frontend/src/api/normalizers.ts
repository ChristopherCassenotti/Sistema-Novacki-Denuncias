type UnknownRecord = Record<string, unknown>;

export const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;

export const unwrapData = (payload: unknown): unknown => {
  const root = asRecord(payload);
  return root && 'data' in root ? root.data : payload;
};

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const stringValue = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
};

export const numberValue = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
};

export const booleanValue = (...values: unknown[]): boolean | undefined => {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    if (value === 0 || value === '0' || value === 'false') return false;
  }
  return undefined;
};

export const namedReference = (value: unknown) => {
  const record = asRecord(value);
  if (!record) return null;
  const id = stringValue(record.id, record.uuid, record.value, record.categoryId, record.category_id, record.unitId, record.unit_id);
  const name = stringValue(record.name, record.nome, record.label, record.title, record.displayName, record.display_name, record.code);
  if (!id && !name) return null;
  return { id: id ?? name ?? '', name: name ?? id ?? '—' };
};

export const collectionFromPayload = (payload: unknown): unknown[] => {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (!record) return [];
  for (const key of [
    'items', 'results', 'rows', 'reports', 'messages', 'notes', 'internalNotes', 'internal_notes',
    'attachments', 'grants', 'accessGrants', 'access_grants', 'restrictions', 'categories',
    'reportCategories', 'report_categories', 'units', 'users', 'teams', 'roles', 'routingRules', 'routing_rules', 'rules', 'history', 'events',
    'auditLogs', 'audit_logs', 'logs', 'retentionPolicies', 'retention_policies', 'policies', 'retentionExecutions', 'retention_executions', 'executions',
    'members', 'dataRows', 'data_rows',
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
};
