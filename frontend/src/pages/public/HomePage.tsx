import { Link } from 'react-router';

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 px-5 py-20 text-white sm:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(90,163,187,0.28),transparent_28%),radial-gradient(circle_at_15%_90%,rgba(43,132,163,0.18),transparent_24%)]" />
        <div className="absolute -right-24 top-10 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-8 top-28 h-64 w-64 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <i className="bi bi-shield-check" /> Canal de Denúncias Novacki
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Um canal seguro para situações que precisam ser ouvidas.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Registre uma denúncia de forma anônima ou identificada e acompanhe o andamento usando seu protocolo e senha de acompanhamento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/denunciar/orientacoes"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
              >
                Fazer uma denúncia <i className="bi bi-arrow-right" />
              </Link>
              <Link
                to="/acompanhar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <i className="bi bi-search" /> Acompanhar denúncia
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 lg:py-18">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: 'bi-person-lock',
                title: 'Você escolhe como se identificar',
                text: 'O fluxo permite denúncia anônima ou identificada, com explicação clara antes do envio.',
              },
              {
                icon: 'bi-shield-lock',
                title: 'Acompanhamento protegido',
                text: 'Após o envio, guarde o protocolo e a senha de acompanhamento. Eles serão necessários para consultar o andamento.',
              },
              {
                icon: 'bi-chat-square-text',
                title: 'Comunicação segura',
                text: 'Durante a análise, você pode receber perguntas e enviar informações complementares pelo próprio canal.',
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <i className={`bi ${item.icon} text-xl`} />
                </span>
                <h2 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Antes de começar</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Quanto mais claro o relato, melhor a análise.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Se possível, informe quando e onde ocorreu, quem estava envolvido, o que aconteceu e se existem documentos, fotos ou outras evidências que ajudem a compreender a situação.
              </p>
              <Link to="/denunciar/orientacoes" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                Ver orientações <i className="bi bi-arrow-right" />
              </Link>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="flex gap-3">
                <i className="bi bi-info-circle mt-0.5 text-brand-700" />
                <div>
                  <strong className="text-sm text-slate-900">Importante</strong>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Este canal não substitui serviços de emergência. Em situações de perigo imediato, procure também os canais públicos apropriados da sua região.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
