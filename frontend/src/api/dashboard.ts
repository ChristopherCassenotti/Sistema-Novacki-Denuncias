import { api } from './client';
import { asArray, asRecord, numberValue, stringValue, unwrapData } from './normalizers';
import type { DashboardData, DashboardSeriesPoint } from '../types/dashboard';

function normalizeSeries(value: unknown): DashboardSeriesPoint[] {
  if (Array.isArray(value)) {
    return asArray(value).map((entry, index) => {
      const item = asRecord(entry) ?? {};
      return {
        label:
          stringValue(
            item.label,
            item.name,
            item.month,
            item.status,
            item.mode,
            item.priority,
            item.categoryName,
            item.category_name,
            item.unitName,
            item.unit_name,
            item.category,
            item.unit,
          ) ?? `Item ${index + 1}`,
        value: numberValue(item.value, item.count, item.total, item.quantity) ?? 0,
      };
    });
  }

  const record = asRecord(value);
  if (!record) return [];
  return Object.entries(record)
    .map(([label, rawValue]) => ({ label, value: numberValue(rawValue) ?? 0 }))
    .filter((item) => Number.isFinite(item.value));
}

function seriesMap(value: unknown, key: string): Record<string, number> {
  return Object.fromEntries(
    asArray(value)
      .map((entry) => {
        const item = asRecord(entry) ?? {};
        const label = stringValue(item[key]);
        const total = numberValue(item.total, item.count, item.value);
        return label && total != null ? [label, total] : null;
      })
      .filter((entry): entry is [string, number] => Boolean(entry)),
  );
}

export const dashboardApi = {
  async get(): Promise<DashboardData> {
    const response = await api.get('/api/admin/dashboard');
    const data = unwrapData(response.data);
    const container = asRecord(data) ?? {};
    const root = asRecord(container.dashboard) ?? container;
    const summary = asRecord(root.summary) ?? {};
    const statusCounts = seriesMap(root.byStatus, 'status');
    const modeCounts = seriesMap(root.byMode, 'mode');

    return {
      open: numberValue(summary.open) ?? 0,
      initialReview: statusCounts.INITIAL_REVIEW ?? 0,
      investigating: statusCounts.INVESTIGATING ?? 0,
      waitingReporter: statusCounts.WAITING_REPORTER_INFORMATION ?? 0,
      concluded: numberValue(summary.concluded) ?? statusCounts.CONCLUDED ?? 0,
      immediateRisk: numberValue(summary.immediateRisk, summary.immediate_risk) ?? 0,
      // Estes campos permanecem opcionais porque o backend atual não fornece as séries/métrica.
      averageResolutionHours: null,
      anonymous: modeCounts.ANONYMOUS ?? 0,
      identified: modeCounts.IDENTIFIED ?? 0,
      byMonth: [],
      byStatus: normalizeSeries(root.byStatus),
      byCategory: normalizeSeries(root.byCategory),
      byUnit: normalizeSeries(root.byUnit),
      attention: [],
      raw: response.data,
    };
  },
};
