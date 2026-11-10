import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { FormActions } from '../../components/public/FormActions';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { ReportProgress } from '../../components/public/ReportProgress';
import { usePublicReportDraft } from '../../context/PublicReportDraftContext';
import { formatFileSize } from '../../utils/format';

export function AttachmentsPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { attachments, addAttachments, removeAttachment } = usePublicReportDraft();
  const [notice, setNotice] = useState('');

  return (
    <PublicPageShell eyebrow="Nova denúncia" title="Anexos da denúncia" description="Você pode enviar até 5 arquivos relacionados ao relato. Esta etapa é opcional.">
      <div className="mx-auto max-w-4xl">
        <ReportProgress current={5} />
        <Card className="p-5 sm:p-7">
          <form onSubmit={(event) => { event.preventDefault(); navigate('/denunciar/revisao'); }}>
            {notice ? <div className="mb-5"><Alert tone="warning">{notice}</Alert></div> : null}
            <input
              ref={inputRef}
              className="hidden"
              type="file"
              multiple
              accept="image/*,.pdf,audio/*,video/*,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                const remaining = Math.max(0, 5 - attachments.length);
                if (files.length > remaining) {
                  setNotice(`Você selecionou ${files.length} arquivo(s), mas só há espaço para mais ${remaining}. Apenas os primeiros serão adicionados.`);
                } else {
                  setNotice('');
                }
                addAttachments(files);
                event.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={attachments.length >= 5}
              className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm"><i className="bi bi-cloud-arrow-up text-xl" /></span>
              <strong className="mt-4 text-sm text-slate-900">{attachments.length >= 5 ? 'Limite de arquivos atingido' : 'Selecionar arquivos'}</strong>
              <span className="mt-1 text-xs leading-5 text-slate-500">Fotos, PDF, áudio, vídeo e documentos permitidos</span>
              <span className="mt-2 text-xs font-semibold text-brand-700">{attachments.length}/5 arquivos</span>
            </button>

            {attachments.length > 0 ? (
              <div className="mt-5 space-y-2">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 sm:px-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><i className="bi bi-paperclip" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{file.name}</p><p className="text-xs text-slate-400">{formatFileSize(file.size)}</p></div>
                    <button type="button" onClick={() => { setNotice(''); removeAttachment(index); }} className="flex h-9 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100" aria-label={`Remover ${file.name}`}>Remover</button>
                  </div>
                ))}
              </div>
            ) : <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-xs leading-5 text-slate-500">Nenhum arquivo selecionado. Você pode continuar sem anexos.</div>}

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">Os arquivos enviados podem passar por verificação de segurança antes de ficarem disponíveis para consulta ou download.</div>
            <FormActions backTo="/denunciar/risco" />
          </form>
        </Card>
      </div>
    </PublicPageShell>
  );
}
