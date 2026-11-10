import { Badge } from '../ui/Badge';
import { reportPriorityLabel, reportPriorityTone, reportStatusLabel, reportStatusTone } from '../../utils/reportLabels';

export function ReportStatusBadge({ status }: { status?: string | null }) {
  return <Badge tone={reportStatusTone(status)}>{reportStatusLabel(status)}</Badge>;
}

export function ReportPriorityBadge({ priority }: { priority?: string | null }) {
  return <Badge tone={reportPriorityTone(priority)}>{reportPriorityLabel(priority)}</Badge>;
}

export function RiskBadge({ immediateRisk }: { immediateRisk: boolean }) {
  return immediateRisk ? (
    <Badge tone="danger"><i className="bi bi-exclamation-triangle mr-1" />Risco imediato</Badge>
  ) : (
    <Badge tone="neutral">Sem risco imediato</Badge>
  );
}
