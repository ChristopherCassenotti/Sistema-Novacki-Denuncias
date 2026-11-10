import { ErrorStatePage } from '../../components/errors/ErrorStatePage';

export function ServerErrorPage() {
  return (
    <ErrorStatePage
      code="500"
      tone="danger"
      icon="bi-exclamation-octagon"
      title="O sistema encontrou um erro"
      description="Não foi possível concluir esta operação por uma falha interna. Tente novamente e, se persistir, informe a referência exibida pela mensagem de erro ao suporte."
      primaryTo="/"
      primaryLabel="Ir para o início"
    />
  );
}
