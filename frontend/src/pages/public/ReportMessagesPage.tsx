import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { publicReportsApi } from '../../api/publicReports';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Skeleton } from '../../components/ui/Skeleton';
import { Textarea } from '../../components/ui/Textarea';
import type { PublicMessage } from '../../types/public';
import { formatDateTime } from '../../utils/format';

export function ReportMessagesPage() {
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setMessages(await publicReportsApi.messages()); }
    catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) { setContentError('Digite uma mensagem antes de enviar.'); return; }
    setContentError(''); setSending(true); setError(null);
    try { await publicReportsApi.sendMessage(content.trim()); setContent(''); await load(); }
    catch (err) { setError(err); }
    finally { setSending(false); }
  };

  return (
    <div>
      <div><h2 className="text-lg font-bold text-slate-900">Mensagens</h2><p className="mt-1 text-sm text-slate-500">Converse com a equipe responsável sem sair do canal.</p></div>
      {error ? <div className="mt-4"><ErrorAlert error={error} fallback="Não foi possível carregar ou enviar as mensagens." onRetry={() => void load()} /></div> : null}
      <div className="soft-scrollbar mt-5 max-h-[480px] min-h-48 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4 sm:p-5">
        {loading ? <div className="space-y-4" role="status" aria-label="Carregando mensagens"><div className="flex justify-start"><Skeleton className="h-20 w-[72%]" rounded="lg" /></div><div className="flex justify-end"><Skeleton className="h-16 w-[64%]" rounded="lg" /></div><div className="flex justify-start"><Skeleton className="h-24 w-[78%]" rounded="lg" /></div></div> : null}
        {!loading && !error && messages.length === 0 ? <EmptyState compact icon="bi-chat-square-text" title="Ainda não há mensagens" description="Use o campo abaixo para enviar uma informação complementar à equipe responsável." /> : null}
        {messages.map((message) => { const reporter = message.direction === 'REPORTER'; return <div key={message.id} className={`flex ${reporter ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${reporter ? 'bg-brand-700 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p><p className={`mt-2 text-[11px] ${reporter ? 'text-white/60' : 'text-slate-400'}`}>{reporter ? 'Você' : message.authorName || 'Equipe responsável'} · {formatDateTime(message.createdAt)}</p></div></div>; })}
      </div>
      <form onSubmit={submit} className="mt-5 rounded-2xl border border-slate-200 p-4 sm:p-5" noValidate>
        <Textarea name="message" label="Enviar nova mensagem" value={content} error={contentError} onChange={(e) => { setContent(e.target.value); if (contentError) setContentError(''); }} placeholder="Escreva uma informação complementar ou responda à equipe." className="min-h-28" />
        <div className="mt-3 flex"><Button type="submit" className="w-full sm:ml-auto sm:w-auto" loading={sending}>Enviar mensagem <i className="bi bi-send" /></Button></div>
      </form>
    </div>
  );
}
