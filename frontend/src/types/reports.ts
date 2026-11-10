export const REPORT_STATUSES = [
  'RECEIVED',
  'INITIAL_REVIEW',
  'WAITING_REPORTER_INFORMATION',
  'INVESTIGATING',
  'FORWARDED',
  'CONCLUDED',
  'ARCHIVED',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number] | string;

export const REPORT_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;
export type ReportPriority = (typeof REPORT_PRIORITIES)[number] | string;

export type ReportMode = 'ANONYMOUS' | 'IDENTIFIED' | string;

export type NamedReference = {
  id: string;
  name: string;
};

export type ReportListItem = {
  id: string;
  protocol: string;
  category?: NamedReference | null;
  unit?: NamedReference | null;
  status: ReportStatus;
  priority?: ReportPriority | null;
  immediateRisk: boolean;
  mode?: ReportMode | null;
  assignee?: NamedReference | null;
  team?: NamedReference | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ReportPerson = {
  name?: string;
  role?: string;
  details?: string;
};

export type ReportDetail = ReportListItem & {
  version?: number;
  description?: string;
  occurrenceDate?: string | null;
  occurrenceLocation?: string | null;
  relationship?: string | null;
  additionalInformation?: string | null;
  peopleInvolved: ReportPerson[];
  witnesses: ReportPerson[];
  identityStored?: boolean;
  legalHold?: boolean;
  raw: unknown;
};

export type PaginatedReports = {
  items: ReportListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ReportListFilters = {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  categoryId?: string;
  unitId?: string;
  mode?: string;
  immediateRisk?: boolean;
  dateFrom?: string;
  dateTo?: string;
};

export type ReportMessage = {
  id: string;
  type?: string;
  content: string;
  authorName?: string;
  direction?: 'REPORTER' | 'ADMIN' | string;
  createdAt?: string | null;
};

export type InternalNote = {
  id: string;
  content: string;
  authorName?: string;
  createdAt?: string | null;
};

export type ReportAttachment = {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
  createdAt?: string | null;
  scanStatus?: string;
  source?: 'REPORTER' | 'ADMIN' | string;
};

export type AccessGrant = {
  id: string;
  userId?: string;
  userName?: string;
  scope?: string;
  reason?: string;
  createdAt?: string | null;
  expiresAt?: string | null;
};

export type ReportRestriction = {
  userId: string;
  userName?: string;
  reason?: string;
  createdAt?: string | null;
};

export type ReporterIdentity = {
  name?: string;
  email?: string;
  phone?: string;
  raw: unknown;
};

export type LegalHoldState = {
  active: boolean;
  reason?: string;
  appliedAt?: string | null;
  appliedBy?: string;
  retentionUntil?: string | null;
  retentionAction?: string;
  retentionStatus?: string;
  raw: unknown;
};
