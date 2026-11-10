import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';

export function ReportsPlaceholderPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Operação"
        title="Denúncias"
        description="Esta área está sendo preparada para facilitar a consulta e o acompanhamento das denúncias."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                disabled
                placeholder="Buscar protocolo..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none"
              />
            </div>
            <Button variant="secondary" disabled>
              <i className="bi bi-funnel" /> Filtros
            </Button>
          </div>
        </div>

        <div className="px-5 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <i className="bi bi-inbox text-xl" />
          </div>
          <p className="mt-4 font-semibold text-slate-700">Estrutura pronta para a Fase 2</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            As informações exibidas aqui respeitarão os acessos e responsabilidades definidos para cada pessoa.
          </p>
        </div>
      </Card>
    </div>
  );
}
