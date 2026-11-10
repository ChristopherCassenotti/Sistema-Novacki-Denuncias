import type { BadgeTone } from '../components/ui/Badge';

const statusLabels: Record<string, string> = {
  RECEIVED: 'Recebida',
  INITIAL_REVIEW: 'Em triagem',
  WAITING_REPORTER_INFORMATION: 'Aguardando denunciante',
  INVESTIGATING: 'Em investigação',
  FORWARDED: 'Encaminhada',
  CONCLUDED: 'Concluída',
  ARCHIVED: 'Arquivada',
};

const statusTones: Record<string, BadgeTone> = {
  RECEIVED: 'brand',
  INITIAL_REVIEW: 'warning',
  WAITING_REPORTER_INFORMATION: 'warning',
  INVESTIGATING: 'info',
  FORWARDED: 'neutral',
  CONCLUDED: 'success',
  ARCHIVED: 'neutral',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Média',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const priorityTones: Record<string, BadgeTone> = {
  LOW: 'neutral',
  NORMAL: 'brand',
  MEDIUM: 'brand',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

export const reportStatusLabel = (status?: string | null) =>
  status ? statusLabels[status] ?? status.replaceAll('_', ' ') : '—';

export const reportStatusTone = (status?: string | null): BadgeTone =>
  status ? statusTones[status] ?? 'neutral' : 'neutral';

export const reportPriorityLabel = (priority?: string | null) =>
  priority ? priorityLabels[priority] ?? priority.replaceAll('_', ' ') : 'Sem prioridade';

export const reportPriorityTone = (priority?: string | null): BadgeTone =>
  priority ? priorityTones[priority] ?? 'neutral' : 'neutral';
