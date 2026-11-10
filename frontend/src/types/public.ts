import type { ReportAttachment, ReportMessage, ReportStatus } from './reports';

export type PublicReportMode = 'ANONYMOUS' | 'IDENTIFIED';

export type DraftPerson = {
  id: string;
  name: string;
  role: string;
  details: string;
};

export type PublicReportDraft = {
  mode: PublicReportMode | null;
  relationship: string;
  unitId: string;
  categoryId: string;
  occurrenceDate: string;
  occurrenceLocation: string;
  description: string;
  additionalInformation: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  consentToContact: boolean;
  involvedPeople: DraftPerson[];
  witnesses: DraftPerson[];
  immediateRisk: boolean | null;
  immediateRiskDetails: string;
};

export type CreatePublicReportPayload = {
  mode: PublicReportMode;
  relationship: string;
  unitId: string;
  categoryId: string;
  occurrenceDate?: string;
  occurrenceLocation?: string;
  description: string;
  additionalInformation?: string;
  involvedPeople: Array<Omit<DraftPerson, 'id'>>;
  witnesses: Array<Omit<DraftPerson, 'id'>>;
  immediateRisk: boolean;
  immediateRiskDetails?: string;
  reporter?: {
    name: string;
    email?: string;
    phone?: string;
    consentToContact: boolean;
  };
};

export type ReportSubmissionResult = {
  protocol: string;
  secret: string;
  createdAt?: string;
  warning?: string;
  accessComplete: boolean;
  missingAccessFields: Array<'protocol' | 'secret'>;
  raw: unknown;
};

export type PublicReport = {
  protocol?: string;
  status: ReportStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  concludedAt?: string | null;
  archivedAt?: string | null;
  raw: unknown;
};

export type PublicHistoryEvent = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  createdAt?: string | null;
};

export type PublicMessage = ReportMessage;
export type PublicAttachment = ReportAttachment;

export type LastSubmission = {
  protocol: string;
  secret: string;
  createdAt: string;
  warning?: string;
  accessComplete?: boolean;
  missingAccessFields?: Array<'protocol' | 'secret'>;
};
