export function SecurityCard() {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
      <div className="flex items-center gap-3 text-brand-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
          <i className="bi bi-shield-lock text-lg" />
        </span>
        <div>
          <p className="font-bold">Acesso confidencial</p>
          <p className="text-xs text-brand-800/70">Guarde seus dados de acompanhamento</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-brand-900/75">
        O acompanhamento da denúncia depende do protocolo e da senha de acompanhamento. Não envie essas informações por canais públicos.
      </p>
    </div>
  );
}
