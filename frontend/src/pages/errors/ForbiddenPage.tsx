import { ErrorStatePage } from '../../components/errors/ErrorStatePage';
export function ForbiddenPage() {
  return <ErrorStatePage code="403" tone="warning" icon="bi-shield-exclamation" title="Acesso não autorizado" description="Sua sessão está ativa, mas seu perfil não possui permissão para acessar este recurso ou executar esta ação." />;
}
