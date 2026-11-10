import { useNavigate } from 'react-router';
import { Card } from '../../components/ui/Card';
import { FormActions } from '../../components/public/FormActions';
import { PeopleEditor } from '../../components/public/PeopleEditor';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { ReportProgress } from '../../components/public/ReportProgress';

export function PeoplePage() {
  const navigate = useNavigate();
  return (
    <PublicPageShell eyebrow="Nova denúncia" title="Pessoas envolvidas e testemunhas" description="Informe apenas o que souber. Você pode avançar mesmo sem preencher esta etapa.">
      <div className="mx-auto max-w-4xl">
        <ReportProgress current={3} />
        <form onSubmit={(event) => { event.preventDefault(); navigate('/denunciar/risco'); }}>
          <div className="space-y-5">
            <PeopleEditor kind="involvedPeople" title="Pessoas envolvidas" description="Pessoas diretamente relacionadas aos fatos relatados." />
            <PeopleEditor kind="witnesses" title="Testemunhas" description="Pessoas que podem ter presenciado ou ter conhecimento relevante sobre o ocorrido." />
          </div>
          <Card className="mt-5 px-5 pb-5 sm:px-7 sm:pb-6">
            <FormActions backTo="/denunciar" />
          </Card>
        </form>
      </div>
    </PublicPageShell>
  );
}
