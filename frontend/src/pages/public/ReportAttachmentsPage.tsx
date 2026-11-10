import { useCallback, useEffect, useRef, useState } from 'react';
import { publicReportsApi } from '../../api/publicReports';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Skeleton } from '../../components/ui/Skeleton';
import type { PublicAttachment } from '../../types/public';
import { formatDateTime, formatFileSize } from '../../utils/format';
import { attachmentStatusLabel } from '../../utils/displayLabels';

export function ReportAttachmentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PublicAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await publicReportsApi.attachments()); }
    catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-lg font-bold text-slate-900">Anexos</h2><p className="mt-1 text-sm text-slate-500">Consulte arquivos liberados e envie novos documentos para complementar o relato.</p></div>
        <input ref={inputRef} type="file" className="hidden" onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
          setUploading(true); setError(null);
          try { await publicReportsApi.uploadAttachment(file); await load(); }
          catch (err) { setError(err); }
          finally { setUploading(false); }
        }} />
        <Button className="w-full sm:w-auto" variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}><i className="bi bi-paperclip" /> Enviar anexo</Button>
      </div>
      {error ? <div className="mt-4"><ErrorAlert error={error} fallback="Não foi possível concluir a operação com o anexo." onRetry={() => void load()} /></div> : null}
      {loading ? <div className="mt-5 space-y-3" role="status" aria-label="Carregando anexos">{[1,2,3].map((n) => <div key={n} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4"><Skeleton className="h-10 w-10 shrink-0" rounded="lg" /><div className="flex-1"><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-2 h-3 w-1/3" /></div></div>)}</div> : null}
      {!loading && !error && items.length === 0 ? <div className="mt-5"><EmptyState compact icon="bi-paperclip" title="Nenhum anexo disponível" description="Você pode complementar a denúncia enviando um novo arquivo quando necessário." action={<Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Enviar primeiro anexo</Button>} /></div> : null}
      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const blocked = item.scanStatus && !['CLEAN', 'COMPLETED'].includes(item.scanStatus);
          return <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><i className="bi bi-file-earmark" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{item.name}</p><p className="mt-1 text-xs leading-5 text-slate-400">{formatFileSize(item.size)} · {formatDateTime(item.createdAt)}{item.scanStatus ? ` · ${attachmentStatusLabel(item.scanStatus)}` : ''}</p>{blocked ? <p className="mt-1 text-xs font-semibold text-amber-700">O arquivo está sendo verificado por segurança e ainda não pode ser baixado.</p> : null}</div><Button variant="secondary" size="sm" disabled={Boolean(blocked)} onClick={() => void publicReportsApi.downloadAttachment(item.id, item.name).catch((err) => setError(err))}><i className="bi bi-download" /> Baixar</Button></div>;
        })}
      </div>
    </div>
  );
}
