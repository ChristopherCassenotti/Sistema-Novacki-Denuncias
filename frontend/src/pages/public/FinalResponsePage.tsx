import { useCallback, useEffect, useMemo, useState } from 'react';
import { publicReportsApi } from '../../api/publicReports';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Skeleton } from '../../components/ui/Skeleton';
import type { PublicMessage } from '../../types/public';
import { formatDateTime } from '../../utils/format';

export function FinalResponsePage() {
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [error, setError] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setMessages(await publicReportsApi.messages()); }
    catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const finalMessage = useMemo(() => [...messages].reverse().find((message) => message.type === 'FINAL_RESPONSE'), [messages]);
  const finalText = finalMessage?.content;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">Resposta final</h2>
      <p className="mt-1 text-sm text-slate-500">A conclusão destinada ao denunciante será exibida nesta área quando estiver disponível.</p>
      {error ? <div className="mt-4"><ErrorAlert error={error} fallback="Não foi possível consultar a resposta final." onRetry={() => void load()} /></div> : null}
      {loading ? <div className="mt-5 rounded-2xl border border-slate-100 p-6" role="status" aria-label="Carregando resposta final"><Skeleton className="h-10 w-10" rounded="full" /><Skeleton className="mt-5 h-4 w-44" /><Skeleton className="mt-4 h-3 w-full" /><Skeleton className="mt-2 h-3 w-5/6" /><Skeleton className="mt-2 h-3 w-2/3" /></div> : null}
      {!loading && finalText ? <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600"><i className="bi bi-check2-circle" /></span><div><p className="font-bold text-emerald-950">Conclusão disponível</p>{finalMessage?.createdAt ? <p className="text-xs text-emerald-900/60">{formatDateTime(finalMessage.createdAt)}</p> : null}</div></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-emerald-950/80">{finalText}</p></div> : null}
      {!loading && !error && !finalText ? <div className="mt-5"><EmptyState compact icon="bi-hourglass-split" title="Resposta final ainda não publicada" description="Quando a equipe concluir o atendimento e publicar uma resposta final, ela aparecerá nesta área." /></div> : null}
    </div>
  );
}
