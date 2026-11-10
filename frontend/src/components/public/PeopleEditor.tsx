import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { usePublicReportDraft } from '../../context/PublicReportDraftContext';

export function PeopleEditor({
  kind,
  title,
  description,
}: {
  kind: 'involvedPeople' | 'witnesses';
  title: string;
  description: string;
}) {
  const { draft, addPerson, updatePerson, removePerson } = usePublicReportDraft();
  const people = draft[kind];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => addPerson(kind)}>
          <i className="bi bi-plus-lg" /> Adicionar
        </Button>
      </div>

      {people.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Nenhuma pessoa informada. Esta etapa pode ser deixada em branco.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {people.map((person, index) => (
            <div key={person.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <strong className="text-sm text-slate-800">Pessoa {index + 1}</strong>
                <button
                  type="button"
                  onClick={() => removePerson(kind, person.id)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Remover
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nome ou identificação"
                  value={person.name}
                  onChange={(event) => updatePerson(kind, person.id, { name: event.target.value })}
                  placeholder="Nome, apelido ou outra referência"
                />
                <Input
                  label="Função / relação"
                  value={person.role}
                  onChange={(event) => updatePerson(kind, person.id, { role: event.target.value })}
                  placeholder="Ex.: gestor, colega, fornecedor"
                />
              </div>
              <div className="mt-4">
                <Textarea
                  label="Informações adicionais"
                  value={person.details}
                  onChange={(event) => updatePerson(kind, person.id, { details: event.target.value })}
                  placeholder="Descreva como essa pessoa se relaciona com o ocorrido."
                  className="min-h-24"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
