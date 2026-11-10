export type AuditLogItem = {
  id: string;
  createdAt?: string | null;
  actorName?: string;
  actorId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  unit?: { id: string; name: string } | null;
  success?: boolean;
  requestId?: string;
  metadata?: unknown;
};

export type AuditLogFilters = {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  actor?: string;
  action?: string;
  entity?: string;
  unitId?: string;
  success?: '' | 'true' | 'false';
};

export type PaginatedAuditLogs = {
  items: AuditLogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RetentionAction = 'DELETE' | 'ANONYMIZE' | string;

export type RetentionPolicy = {
  id: string;
  name: string;
  category?: { id: string; name: string } | null;
  units: Array<{ id: string; name: string }>;
  applicableStatus?: string | null;
  retentionDays: number;
  action: RetentionAction;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw?: unknown;
};

export type RetentionPolicyFormData = {
  name: string;
  categoryId: string;
  unitIds: string[];
  applicableStatus: string;
  retentionDays: number;
  action: 'DELETE' | 'ANONYMIZE';
  active: boolean;
};

export type RetentionExecutionStatus = 'PENDING' | 'RUNNING' | 'FAILED' | 'COMPLETED' | 'CANCELLED' | string;

export type RetentionExecution = {
  id: string;
  reportId?: string;
  reportProtocol?: string;
  unit?: { id: string; name: string } | null;
  scheduledAt?: string | null;
  action?: RetentionAction;
  status?: RetentionExecutionStatus;
  attempts?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string;
  raw?: unknown;
};

export type PaginatedRetentionExecutions = {
  items: RetentionExecution[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
