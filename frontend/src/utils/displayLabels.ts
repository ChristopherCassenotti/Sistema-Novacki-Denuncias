import { reportPriorityLabel, reportStatusLabel } from './reportLabels';

const relationshipLabels: Record<string, string> = {
  EMPLOYEE: 'Colaborador(a)',
  FORMER_EMPLOYEE: 'Ex-colaborador(a)',
  SUPPLIER: 'Fornecedor(a)',
  CUSTOMER: 'Cliente',
  THIRD_PARTY: 'Terceiro(a)',
  OTHER: 'Outro vínculo',
};

const messageTypeLabels: Record<string, string> = {
  STANDARD: 'Mensagem',
  QUESTION: 'Solicitação de informação',
  FINAL_RESPONSE: 'Resposta final',
};

const attachmentStatusLabels: Record<string, string> = {
  CLEAN: 'Arquivo liberado',
  COMPLETED: 'Arquivo liberado',
  PENDING: 'Aguardando verificação',
  SCANNING: 'Em verificação',
  INFECTED: 'Arquivo bloqueado',
  QUARANTINED: 'Arquivo bloqueado',
  FAILED: 'Não foi possível verificar',
};

const auditActionLabels: Record<string, string> = {
  TEAM_CREATED: 'Equipe criada',
  TEAM_UPDATED: 'Equipe atualizada',
  TEAM_DEACTIVATED: 'Equipe desativada',
  TEAM_MEMBERS_REPLACED: 'Membros da equipe atualizados',
  USER_CREATED: 'Usuário criado',
  USER_UPDATED: 'Usuário atualizado',
  USER_ROLES_REPLACED: 'Perfis do usuário atualizados',
  USER_ACTIVATED: 'Usuário ativado',
  USER_DEACTIVATED: 'Usuário desativado',
  USER_PASSWORD_RESET: 'Redefinição de senha solicitada',
  USER_PASSWORD_RESET_COMPLETED: 'Senha redefinida',
  INITIAL_PASSWORD_CHANGED: 'Senha inicial alterada',
  ROLE_CREATED: 'Perfil criado',
  ROLE_ACTIVATED: 'Perfil ativado',
  ROLE_DEACTIVATED: 'Perfil desativado',
  ROLE_UPDATED: 'Perfil atualizado',
  ROLE_PERMISSIONS_REPLACED: 'Permissões do perfil atualizadas',
  REPORT_CREATED: 'Denúncia criada',
  REPORT_STATUS_CHANGED: 'Situação da denúncia alterada',
  REPORT_STATE_CHANGED: 'Andamento da denúncia atualizado',
  REPORT_PRIORITY_CHANGED: 'Prioridade da denúncia alterada',
  REPORT_ASSIGNED: 'Responsável pela denúncia definido',
  REPORT_UNASSIGNED: 'Responsável pela denúncia removido',
  REPORT_MESSAGE_SENT: 'Mensagem enviada na denúncia',
  REPORT_INTERNAL_NOTE_ADDED: 'Nota interna adicionada',
  REPORT_ATTACHMENT_ADDED: 'Anexo adicionado à denúncia',
  REPORT_ATTACHMENT_DOWNLOADED: 'Anexo da denúncia baixado',
  REPORT_IDENTITY_VIEWED: 'Identificação do denunciante consultada',
  REPORT_USER_RESTRICTED: 'Acesso de usuário restringido',
  REPORT_USER_RESTRICTION_REVOKED: 'Restrição de acesso removida',
  REPORT_LEGAL_HOLD_APPLIED: 'Proteção da denúncia ativada',
  REPORT_LEGAL_HOLD_REMOVED: 'Proteção da denúncia removida',
  REPORT_RETENTION_SCHEDULED: 'Ação automática programada',
  REPORT_RETENTION_CANCELLED: 'Ação automática cancelada',
  REPORT_RETENTION_ANONYMIZED: 'Dados pessoais ocultados',
  REPORT_RETENTION_DATABASE_DELETED: 'Dados da denúncia excluídos',
  REPORT_RETENTION_EXECUTED: 'Ação de guarda processada',
  RETENTION_POLICY_CREATED: 'Regra de guarda criada',
  RETENTION_POLICY_UPDATED: 'Regra de guarda atualizada',
  RETENTION_POLICY_ACTIVATED: 'Regra de guarda ativada',
  RETENTION_POLICY_DEACTIVATED: 'Regra de guarda desativada',
  RETENTION_EXECUTION_FAILED: 'Ação automática falhou',
  RETENTION_EXECUTION_CANCELLED: 'Ação automática cancelada',
  ROUTING_RULE_CREATED: 'Regra de direcionamento criada',
  ROUTING_RULE_UPDATED: 'Regra de direcionamento atualizada',
  ROUTING_RULE_ACTIVATED: 'Regra de direcionamento ativada',
  ROUTING_RULE_DEACTIVATED: 'Regra de direcionamento desativada',
  STUCK_RETENTION_EXECUTIONS_RECOVERED: 'Ações automáticas pendentes recuperadas',
  REPORT_ROUTED_AUTOMATICALLY: 'Denúncia encaminhada automaticamente',
  REPORT_ACCESS_GRANTED: 'Acesso à denúncia concedido',
  REPORT_ACCESS_REVOKED: 'Acesso à denúncia removido',
  REPORT_RESTRICTION_ADDED: 'Restrição de acesso adicionada',
  REPORT_RESTRICTION_REMOVED: 'Restrição de acesso removida',
  USER_RESTRICTED: 'Acesso de usuário restringido',
  USER_RESTRICTION_REVOKED: 'Restrição de usuário removida',
  RETENTION_SCHEDULED: 'Ação automática programada',
  ATTACHMENT_ADDED: 'Anexo adicionado',
  ATTACHMENT_SCAN_CLEAN: 'Anexo verificado e liberado',
  ATTACHMENT_SCAN_FAILED: 'Falha na verificação de anexo',
  ATTACHMENT_SCAN_INFECTED: 'Anexo bloqueado por segurança',
  ATTACHMENT_SCAN_RETRY_REQUESTED: 'Nova verificação de anexo solicitada',
  STUCK_R2_PURGES_RECOVERED: 'Limpezas pendentes recuperadas',
  ACCESS_GRANTED: 'Acesso concedido',
  ACCESS_REVOKED: 'Acesso removido',
  DATABASE_DELETE_FAILED: 'Não foi possível excluir os dados',
  INFORMATION_REQUESTED: 'Informações adicionais solicitadas',
  INTERNAL_NOTE_ADDED: 'Nota interna adicionada',
  LEGAL_HOLD_APPLIED: 'Proteção da denúncia ativada',
  LEGAL_HOLD_REMOVED: 'Proteção da denúncia removida',
  MESSAGE_SENT: 'Mensagem enviada',
  ONE_TIME_PASSWORD_RESET: 'Código de redefinição de senha gerado',
  PASSWORD_RESET: 'Redefinição de senha solicitada',
  PRIORITY_CHANGED: 'Prioridade alterada',
  R2_DELETE_FAILED: 'Não foi possível remover um arquivo armazenado',
  RESCHEDULED_OR_CANCELLED: 'Ação reprogramada ou cancelada',
  ROUTING_TARGET_RESTRICTED: 'Direcionamento impedido por restrição',
  STALE_EXECUTION_RECOVERED: 'Ação pendente recuperada',
  STALE_PURGE_RECOVERED: 'Limpeza pendente recuperada',
  STATUS_CHANGED: 'Situação alterada',
  USER_INVITATION_COMPLETED: 'Cadastro de usuário concluído',
};


const publicHistoryEventLabels: Record<string, string> = {
  REPORT_CREATED: 'Denúncia registrada',
  STATUS_CHANGED: 'Andamento atualizado',
  MESSAGE_SENT: 'Nova mensagem da equipe',
  INFORMATION_REQUESTED: 'A equipe solicitou mais informações',
  INFORMATION_RECEIVED: 'Novas informações recebidas',
  REPORT_CONCLUDED: 'Análise concluída',
  REPORT_ARCHIVED: 'Denúncia arquivada',
};

const entityLabels: Record<string, string> = {
  USER: 'Usuário',
  TEAM: 'Equipe',
  REPORT: 'Denúncia',
  ROLE: 'Perfil de acesso',
  ROUTING_RULE: 'Regra de direcionamento',
  RETENTION_POLICY: 'Regra de guarda',
  RETENTION_EXECUTION: 'Ação automática',
  ATTACHMENT: 'Anexo',
  REPORT_ATTACHMENT: 'Anexo da denúncia',
  SYSTEM_JOB: 'Tarefa automática do sistema',
};

const retentionActionLabels: Record<string, string> = {
  DELETE: 'Excluir dados',
  ANONYMIZE: 'Ocultar dados pessoais',
};

const retentionExecutionStatusLabels: Record<string, string> = {
  PENDING: 'Aguardando processamento',
  RUNNING: 'Em processamento',
  FAILED: 'Falhou',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  SCHEDULED: 'Programada',
  ELIGIBLE: 'Pronta para processamento',
  RETRY_PENDING: 'Aguardando nova tentativa',
  SKIPPED: 'Não processada',
};


const roleLabels: Record<string, string> = {
  ADMIN_MASTER: 'Administrador geral',
  ADMIN_TECHNICAL: 'Administrador técnico',
  TRIAGE: 'Responsável pela triagem',
  INVESTIGATOR: 'Responsável pela apuração',
  MANAGER: 'Gestor autorizado',
  AUDITOR: 'Auditor',
};

const permissionLabels: Record<string, string> = {
  REPORT_DASHBOARD_VIEW: 'Ver visão geral',
  REPORT_MESSAGE: 'Enviar mensagens em denúncias',
  REPORT_REQUEST_INFO: 'Solicitar informações ao denunciante',
  REPORT_INTERNAL_NOTE: 'Adicionar notas internas',
  REPORT_ATTACHMENT: 'Gerenciar anexos',
  REPORT_ASSIGN: 'Definir responsáveis',
  REPORT_CHANGE_STATUS: 'Alterar situação de denúncias',
  REPORT_CHANGE_PRIORITY: 'Alterar prioridade de denúncias',
  REPORT_CONCLUDE: 'Concluir denúncias',
  REPORT_ARCHIVE: 'Arquivar denúncias',
  REPORT_LEGAL_HOLD_MANAGE: 'Proteger denúncias contra exclusão automática',
  USER_MANAGE: 'Gerenciar usuários',
  TEAM_MANAGE: 'Gerenciar equipes',
  AUDIT_LOG_VIEW: 'Ver histórico de atividades',
  RETENTION_POLICY_MANAGE: 'Gerenciar prazos de guarda',
  RETENTION_EXECUTE: 'Processar ações automáticas de guarda',
  AUDIT_VIEW: 'Ver histórico de atividades',
  CATEGORY_MANAGE: 'Gerenciar categorias',
  REPORT_IDENTITY_VIEW: 'Ver identificação do denunciante',
  REPORT_LIST: 'Ver lista de denúncias',
  REPORT_MANAGE_ACCESS: 'Gerenciar acessos específicos a denúncias',
  REPORT_RESTRICT_USER: 'Gerenciar restrições e conflitos de acesso',
  REPORT_RESTRICTION_NOTE: 'Registrar restrições de acesso',
  REPORT_EXPORT: 'Exportar relatórios autorizados',
  REPORT_STATS_VIEW: 'Ver indicadores das denúncias',
  REPORT_VIEW: 'Ver denúncias',
  RETENTION_MANAGE: 'Gerenciar prazos de guarda',
  ROLE_MANAGE: 'Gerenciar perfis de acesso',
  ROUTING_MANAGE: 'Gerenciar regras de direcionamento',
  SETTINGS_MANAGE: 'Gerenciar configurações',
  UNIT_MANAGE: 'Gerenciar unidades',
};

const metadataKeyLabels: Record<string, string> = {
  previousStatus: 'Situação anterior',
  currentStatus: 'Situação atual',
  newStatus: 'Nova situação',
  previousPriority: 'Prioridade anterior',
  newPriority: 'Nova prioridade',
  targetType: 'Tipo de responsável',
  targetId: 'Responsável',
  targetUserId: 'Usuário responsável',
  targetTeamId: 'Equipe responsável',
  userId: 'Usuário',
  userIds: 'Usuários',
  memberIds: 'Membros',
  teamId: 'Equipe',
  teamIds: 'Equipes',
  roleId: 'Perfil de acesso',
  roleIds: 'Perfis de acesso',
  previousRoleIds: 'Perfis anteriores',
  currentRoleIds: 'Perfis atuais',
  restrictedRoleId: 'Perfil que não deve receber',
  restrictedUserId: 'Usuário com restrição',
  reportId: 'Denúncia',
  routingRuleId: 'Regra de direcionamento',
  retentionPolicyId: 'Regra de guarda',
  reason: 'Motivo',
  members: 'Membros',
  previousMembers: 'Membros anteriores',
  currentMembers: 'Membros atuais',
  credentialFlow: 'Tipo de acesso',
  scope: 'Nível de acesso',
  visibility: 'Visibilidade',
  expiresAt: 'Validade',
  expiration: 'Validade',
  sessionsRevoked: 'Acessos encerrados',
  mimeType: 'Tipo de arquivo',
  sizeBytes: 'Tamanho do arquivo',
  messageType: 'Tipo de mensagem',
  isIndependent: 'Pode receber casos com restrição',
  name: 'Nome',
  isActive: 'Ativo',
  action: 'Ação',
  retentionDays: 'Prazo de guarda',
  appliesToStatus: 'Situação da denúncia',
};


export const relationshipLabel = (value?: string | null) =>
  value ? relationshipLabels[value] ?? 'Outro vínculo' : 'Não informado';

export const publicHistoryEventLabel = (value?: string | null) =>
  value ? publicHistoryEventLabels[value] ?? 'Atualização da denúncia' : 'Atualização da denúncia';

export const messageTypeLabel = (value?: string | null) =>
  value ? messageTypeLabels[value] ?? 'Mensagem' : 'Mensagem';

export const attachmentStatusLabel = (value?: string | null) =>
  value ? attachmentStatusLabels[value] ?? 'Situação não informada' : 'Situação não informada';


export const fileTypeLabel = (mimeType?: string | null, fileName?: string | null) => {
  const mime = (mimeType ?? '').toLowerCase();
  const name = (fileName ?? '').toLowerCase();
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'Documento PDF';
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(name)) return 'Imagem';
  if (mime.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac)$/i.test(name)) return 'Áudio';
  if (mime.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(name)) return 'Vídeo';
  if (mime.includes('word') || mime.includes('officedocument.wordprocessingml') || /\.(doc|docx)$/i.test(name)) return 'Documento de texto';
  if (mime.includes('excel') || mime.includes('spreadsheetml') || /\.(xls|xlsx|csv)$/i.test(name)) return 'Planilha';
  if (mime.includes('zip') || mime.includes('compressed') || /\.(zip|rar|7z)$/i.test(name)) return 'Arquivo compactado';
  if (mime.startsWith('text/') || /\.(txt|rtf)$/i.test(name)) return 'Arquivo de texto';
  return 'Arquivo';
};

export const auditActionLabel = (value?: string | null) =>
  value ? auditActionLabels[value] ?? 'Atividade registrada' : 'Atividade registrada';

export const auditEntityLabel = (value?: string | null) =>
  value ? entityLabels[value] ?? 'Item do sistema' : 'Item do sistema';

export const retentionActionLabel = (value?: string | null) =>
  value ? retentionActionLabels[value] ?? 'Ação não informada' : 'Ação não informada';

export const retentionExecutionStatusLabel = (value?: string | null) =>
  value ? retentionExecutionStatusLabels[value] ?? 'Situação não informada' : 'Situação não informada';

export const roleLabel = (value: string) =>
  roleLabels[value] ?? value;

export const permissionLabel = (value: string) =>
  permissionLabels[value] ?? 'Permissão adicional';

export const metadataKeyLabel = (value: string) =>
  metadataKeyLabels[value] ?? 'Informação adicional';

const auditScopeLabel = (value: string) => ({
  VIEW: 'Visualização',
  MESSAGE: 'Envio de mensagens',
  INVESTIGATE: 'Análise da denúncia',
  MANAGE: 'Gerenciamento completo',
}[value] ?? 'Acesso definido');

const auditVisibilityLabel = (value: string) => ({
  PUBLIC: 'Visível ao denunciante',
  INTERNAL: 'Somente equipe interna',
  PRIVATE: 'Acesso restrito',
}[value] ?? 'Visibilidade definida');

const credentialFlowLabel = (value: string) => ({
  USER_INVITATION: 'Criação da primeira senha',
  PASSWORD_RESET: 'Redefinição de senha',
  ONE_TIME_PASSWORD_RESET: 'Redefinição de senha',
}[value] ?? 'Acesso de usuário');

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return 'Não informado';
  if (value < 1024) return `${value} bytes`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const displayMetadataValue = (key: string, value: unknown): string => {
  if (value == null) return 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.length ? `${value.length} ${value.length === 1 ? 'item' : 'itens'}` : 'Nenhum';
  if (typeof value === 'object') return 'Informação registrada';
  const text = String(value);
  if (key === 'credentialFlow') return credentialFlowLabel(text);
  if (key === 'scope') return auditScopeLabel(text);
  if (key === 'visibility') return auditVisibilityLabel(text);
  if (key === 'mimeType') return fileTypeLabel(text);
  if (key === 'sizeBytes') return formatBytes(Number(value));
  if (key.toLowerCase().includes('status')) return reportStatusLabel(text);
  if (key.toLowerCase().includes('priority')) return reportPriorityLabel(text);
  if (key === 'action') return retentionActionLabel(text);
  if (key === 'messageType') return messageTypeLabel(text);
  if (key === 'targetType') return text === 'TEAM' ? 'Equipe' : text === 'USER' ? 'Usuário' : 'Responsável definido';
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(text)) return 'Referência interna';
  if (/^[A-Z][A-Z0-9_]+$/.test(text)) return 'Informação registrada';
  return text;
};

export const AUDIT_ACTION_OPTIONS = Object.entries(auditActionLabels)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

export const AUDIT_ENTITY_OPTIONS = Object.entries(entityLabels)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
