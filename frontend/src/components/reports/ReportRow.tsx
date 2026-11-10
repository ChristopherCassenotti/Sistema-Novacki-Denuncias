import { Link } from 'react-router';
import type { ReportListItem } from '../../types/reports';
import { formatDateTime } from '../../utils/format';
import { ReportPriorityBadge, ReportStatusBadge, RiskBadge } from './ReportBadges';

export function ReportRow({ report }: { report: ReportListItem }) {
  return (
    <tr className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
      <td className="whitespace-nowrap px-5 py-4">
        <Link to={`/admin/denuncias/${report.id}`} className="font-bold text-brand-700 hover:text-brand-900 hover:underline">
          {report.protocol}
        </Link>
      </td>
      <td className="px-5 py-4 text-sm text-slate-700">{report.category?.name ?? '—'}</td>
      <td className="px-5 py-4 text-sm text-slate-700">{report.unit?.name ?? '—'}</td>
      <td className="px-5 py-4"><ReportStatusBadge status={report.status} /></td>
      <td className="px-5 py-4"><ReportPriorityBadge priority={report.priority} /></td>
      <td className="px-5 py-4"><RiskBadge immediateRisk={report.immediateRisk} /></td>
      <td className="px-5 py-4 text-sm text-slate-600">{report.assignee?.name ?? report.team?.name ?? 'Não atribuída'}</td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{formatDateTime(report.createdAt)}</td>
      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">{formatDateTime(report.updatedAt)}</td>
      <td className="px-5 py-4 text-right">
        <Link to={`/admin/denuncias/${report.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-brand-700 hover:shadow-sm" aria-label={`Abrir ${report.protocol}`}>
          <i className="bi bi-chevron-right" />
        </Link>
      </td>
    </tr>
  );
}
