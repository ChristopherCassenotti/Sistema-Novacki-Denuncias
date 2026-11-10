import { ErrorStatePage } from '../../components/errors/ErrorStatePage';

export function NotFoundPage() {
  return (
    <ErrorStatePage
      code="404"
      icon="bi-signpost-split"
      title="Página não encontrada"
      description="A página solicitada não existe, foi movida ou o endereço informado está incorreto."
      primaryTo="/"
      primaryLabel="Ir para o início"
    />
  );
}
