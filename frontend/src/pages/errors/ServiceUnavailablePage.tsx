import { ErrorStatePage } from '../../components/errors/ErrorStatePage';

export function ServiceUnavailablePage() {
  return (
    <ErrorStatePage
      code="503"
      tone="warning"
      icon="bi-cloud-slash"
      title="Serviço temporariamente indisponível"
      description="O sistema está temporariamente indisponível. Aguarde alguns instantes e tente novamente."
      primaryTo="/"
      primaryLabel="Ir para o início"
    />
  );
}
