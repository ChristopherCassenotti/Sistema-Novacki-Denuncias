import { Link } from 'react-router';
import { Card } from '../../components/ui/Card';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { SecurityCard } from '../../components/public/SecurityCard';

export function GuidelinesPage() {
  return (
    <PublicPageShell
      eyebrow="Nova denúncia"
      title="Antes de registrar sua denúncia"
      description="Algumas orientações ajudam a tornar o relato mais claro e seguro."
      aside={<SecurityCard />}
    >
      <Card className="p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <i className="bi bi-check2-circle text-lg" />
            </span>
            <h2 className="mt-4 font-bold text-slate-900">Ajuda na análise</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Descrever os fatos com o máximo de clareza possível.</li>
              <li>• Informar datas, locais, pessoas e contexto quando souber.</li>
              <li>• Separar fatos observados de suposições ou opiniões.</li>
              <li>• Anexar documentos que realmente tenham relação com o relato.</li>
            </ul>
          </div>
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <i className="bi bi-exclamation-triangle text-lg" />
            </span>
            <h2 className="mt-4 font-bold text-slate-900">Cuidados importantes</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Evite compartilhar protocolo e senha de acompanhamento com outras pessoas.</li>
              <li>• Não envie arquivos sem relação com a denúncia.</li>
              <li>• Evite incluir dados pessoais desnecessários de terceiros.</li>
              <li>• Use o canal de forma responsável e de boa-fé.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-brand-900">
          Você poderá escolher entre denúncia <strong>anônima</strong> e <strong>identificada</strong> na próxima etapa.
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            <i className="bi bi-arrow-left" /> Voltar
          </Link>
          <Link to="/denunciar/tipo" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800">
            Entendi, continuar <i className="bi bi-arrow-right" />
          </Link>
        </div>
      </Card>
    </PublicPageShell>
  );
}
