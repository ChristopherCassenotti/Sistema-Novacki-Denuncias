import type { ReportListItem } from './reports';

export type DashboardMetric = {
  label: string;
  value: number;
};

export type DashboardSeriesPoint = {
  label: string;
  value: number;
};

export type DashboardData = {
  open: number;
  initialReview: number;
  investigating: number;
  waitingReporter: number;
  concluded: number;
  immediateRisk: number;
  averageResolutionHours?: number | null;
  anonymous?: number | null;
  identified?: number | null;
  byMonth: DashboardSeriesPoint[];
  byStatus: DashboardSeriesPoint[];
  byCategory: DashboardSeriesPoint[];
  byUnit: DashboardSeriesPoint[];
  attention: ReportListItem[];
  raw: unknown;
};
