import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';

type ModulePlaceholderPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  icon?: string;
};

export function ModulePlaceholderPage({
  title,
  eyebrow,
  description,
  icon = 'bi-grid',
}: ModulePlaceholderPageProps) {
  return (
    <div className="space-y-7">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card className="p-8 sm:p-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-700">
            <i className={`bi ${icon}`} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-800">Rota preparada</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            O módulo já está incluído na navegação e protegido pelas permissões previstas. O conteúdo funcional entra nas próximas fases.
          </p>
        </div>
      </Card>
    </div>
  );
}
