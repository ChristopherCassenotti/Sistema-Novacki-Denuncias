import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { teamsApi, usersApi } from '../../api/adminManagement';
import { reportsApi } from '../../api/reports';
import { PermissionGuard } from '../../components/auth/PermissionGuard';
import { ReportPriorityBadge, ReportStatusBadge, RiskBadge } from '../../components/reports/ReportBadges';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Textarea } from '../../components/ui/Textarea';
import { useCan } from '../../hooks/useCan';
import type { InternalNote, LegalHoldState, NamedReference, ReportAttachment, ReportDetail, ReportMessage, ReporterIdentity } from '../../types/reports';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/format';
import { getHttpErrorMessage } from '../../utils/httpError';
import { reportStatusLabel } from '../../utils/reportLabels';
import { attachmentStatusLabel, fileTypeLabel, messageTypeLabel, relationshipLabel, retentionActionLabel, retentionExecutionStatusLabel } from '../../utils/displayLabels';

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: 'bi-file-text' },
  { id: 'messages', label: 'Mensagens', icon: 'bi-chat-left-text' },
  { id: 'notes', label: 'Notas internas', icon: 'bi-journal-text' },
  { id: 'attachments', label: 'Anexos', icon: 'bi-paperclip' },
  { id: 'history', label: 'Histórico', icon: 'bi-clock-history' },
  { id: 'access', label: 'Responsáveis', icon: 'bi-person-check' },
  { id: 'legal-hold', label: 'Proteção da denúncia', icon: 'bi-shield-lock' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function InfoItem({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold leading-6 text-slate-700">{children ?? value ?? '—'}</dd>
    </div>
  );
}

function LoadingSection() {
  return <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
}

function ReporterIdentityControl({ reportId }: { reportId: string }) {
  const canViewIdentity = useCan({ permission: 'REPORT_IDENTITY_VIEW' });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState<ReporterIdentity | null>(null);
  const [error, setError] = useState('');
  const requestSequence = useRef(0);

  // Invalida consultas pendentes ao sair da tela ou fechar a janela.
  useEffect(() => () => { requestSequence.current += 1; }, []);

  const close = () => {
    requestSequence.current += 1;
    setOpen(false);
    setLoading(false);
    setIdentity(null);
    setError('');
  };

  const showIdentity = async () => {
    if (!canViewIdentity) return;
    const request = ++requestSequence.current;
    setOpen(true);
    setLoading(true);
    setIdentity(null);
    setError('');

    try {
      const result = await reportsApi.identity(reportId);
      if (request === requestSequence.current) setIdentity(result);
    } catch (err) {
      if (request === requestSequence.current) {
        setError(getHttpErrorMessage(err, 'Não foi possível consultar a identificação do denunciante.'));
      }
    } finally {
      if (request === requestSequence.current) setLoading(false);
    }
  };

  // A API também precisa validar a permissão: ocultar o botão não substitui autorização no servidor.
  if (!canViewIdentity) return null;

  const hasIdentity = Boolean(identity?.name || identity?.email || identity?.phone);

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <Button variant="secondary" size="sm" onClick={() => void showIdentity()}>
        <i className="bi bi-person-vcard" aria-hidden="true" />
        Visualizar identificação do denunciante
      </Button>
      <p className="mt-2 text-xs leading-5 text-slate-500">Informação confidencial. Disponível apenas para usuários autorizados.</p>

      <Modal
        open={open}
        onClose={close}
        title="Identificação do denunciante"
        description="Dados pessoais informados no momento do registro da denúncia."
        footer={<Button variant="secondary" onClick={close}>Fechar</Button>}
      >
        {loading ? (
          <div className="flex items-center gap-3 py-3 text-sm text-slate-600" role="status">
            <i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" />Consultando identificação...
          </div>
        ) : error ? (
          <Alert tone="danger">{error}</Alert>
        ) : hasIdentity ? (
          <dl className="grid gap-5 sm:grid-cols-2">
            <InfoItem label="Nome" value={identity?.name} />
            <InfoItem label="E-mail" value={identity?.email} />
            <InfoItem label="Telefone" value={identity?.phone} />
          </dl>
        ) : (
          <Alert tone="warning">Não há dados de identificação disponíveis para esta denúncia.</Alert>
        )}
      </Modal>
    </div>
  );
}

function OverviewTab({ report }: { report: ReportDetail }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-6">
        <h2 className="text-base font-bold text-slate-900">Relato original</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{report.description || 'Descrição não disponível.'}</p>
        {report.additionalInformation ? <><div className="my-6 border-t border-slate-100" /><h3 className="text-sm font-bold text-slate-800">Informações complementares</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.additionalInformation}</p></> : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-bold text-slate-900">Dados da ocorrência</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <InfoItem label="Categoria" value={report.category?.name} />
          <InfoItem label="Unidade" value={report.unit?.name} />
          <InfoItem label="Data da ocorrência" value={formatDate(report.occurrenceDate)} />
          <InfoItem label="Local" value={report.occurrenceLocation} />
          <InfoItem label="Relação com a empresa" value={relationshipLabel(report.relationship)} />
          <InfoItem label="Modo da denúncia" value={report.mode === 'ANONYMOUS' ? 'Anônima' : report.mode === 'IDENTIFIED' ? 'Identificada' : report.mode} />
        </dl>
        {report.mode === 'IDENTIFIED' ? <ReporterIdentityControl key={report.id} reportId={report.id} /> : null}
      </Card>

      <Card className="p-6 xl:col-span-2">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pessoas envolvidas</h2>
            <div className="mt-4 space-y-3">
              {report.peopleInvolved.length ? report.peopleInvolved.map((person, index) => <div key={`${person.name}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-sm font-bold text-slate-800">{person.name ?? `Pessoa ${index + 1}`}</p>{person.role ? <p className="mt-1 text-xs font-semibold text-brand-700">{person.role}</p> : null}{person.details ? <p className="mt-2 text-sm leading-5 text-slate-500">{person.details}</p> : null}</div>) : <EmptyState icon="bi-person-x" title="Nenhuma pessoa listada" />}
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Testemunhas</h2>
            <div className="mt-4 space-y-3">
              {report.witnesses.length ? report.witnesses.map((person, index) => <div key={`${person.name}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-sm font-bold text-slate-800">{person.name ?? `Testemunha ${index + 1}`}</p>{person.role ? <p className="mt-1 text-xs font-semibold text-brand-700">{person.role}</p> : null}{person.details ? <p className="mt-2 text-sm leading-5 text-slate-500">{person.details}</p> : null}</div>) : <EmptyState icon="bi-people" title="Nenhuma testemunha listada" />}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MessagesTab({ reportId }: { reportId: string }) {
  const [items, setItems] = useState<ReportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'STANDARD' | 'QUESTION' | 'FINAL_RESPONSE'>('STANDARD');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await reportsApi.messages(reportId)); }
    catch (err) { setError(getHttpErrorMessage(err, 'Não foi possível carregar as mensagens.')); }
    finally { setLoading(false); }
  }, [reportId]);

  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    if (!content.trim()) return;
    setSending(true); setError('');
    try { await reportsApi.sendMessage(reportId, { type, content: content.trim() }); setContent(''); await load(); }
    catch (err) { setError(getHttpErrorMessage(err, 'Não foi possível enviar a mensagem.')); }
    finally { setSending(false); }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-bold text-slate-900">Conversa com o denunciante</h2><p className="mt-1 text-sm text-slate-500">Mensagens são parte do histórico e não possuem edição ou exclusão.</p></div>
        {loading ? <LoadingSection /> : items.length ? <div className="soft-scrollbar max-h-[650px] space-y-4 overflow-y-auto p-5 sm:p-6">{items.map((message) => {
          const reporter = ['REPORTER','REPORTER_TO_ADMIN','PUBLIC'].includes(message.direction ?? '');
          return <div key={message.id} className={`flex ${reporter ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${reporter ? 'bg-slate-100 text-slate-700' : 'bg-brand-700 text-white'}`}><div className={`mb-1.5 flex flex-wrap items-center gap-2 text-[11px] ${reporter ? 'text-slate-400' : 'text-brand-100'}`}><span className="font-bold">{message.authorName ?? (reporter ? 'Denunciante' : 'Administração')}</span>{message.type ? <span>• {messageTypeLabel(message.type)}</span> : null}</div><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p><p className={`mt-2 text-[10px] ${reporter ? 'text-slate-400' : 'text-brand-100'}`}>{formatDateTime(message.createdAt)}</p></div></div>;
        })}</div> : <EmptyState icon="bi-chat-left" title="Nenhuma mensagem" description="A conversa aparecerá aqui quando houver interação." />}
      </Card>

      <PermissionGuard permission="REPORT_MESSAGE" fallback={<Card className="p-6"><EmptyState icon="bi-lock" title="Sem permissão para enviar" description="Sua conta pode visualizar as mensagens, mas não está autorizada a enviar novas mensagens nesta denúncia." /></Card>}>
        <Card className="h-fit p-5 xl:sticky xl:top-24">
          <h2 className="font-bold text-slate-900">Enviar mensagem</h2>
          <div className="mt-4 space-y-4">
            <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as typeof type)}><option value="STANDARD">Mensagem</option><option value="QUESTION">Solicitar informação</option><option value="FINAL_RESPONSE">Resposta final</option></Select>
            <Textarea label="Mensagem" value={content} maxLength={5000} onChange={(e) => setContent(e.target.value)} placeholder="Escreva uma mensagem clara e objetiva..." hint={`${content.length}/5000 caracteres`} />
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Button block loading={sending} disabled={!content.trim()} onClick={() => void send()}><i className="bi bi-send" />Enviar</Button>
          </div>
        </Card>
      </PermissionGuard>
    </div>
  );
}

function NotesTab({ reportId }: { reportId: string }) {
  const [items, setItems] = useState<InternalNote[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await reportsApi.internalNotes(reportId)); } catch (err) { setError(getHttpErrorMessage(err)); } finally { setLoading(false); } }, [reportId]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true); setError('');
    try { await reportsApi.createInternalNote(reportId, content.trim()); setContent(''); await load(); }
    catch (err) { setError(getHttpErrorMessage(err, 'Não foi possível criar a nota.')); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><i className="bi bi-eye-slash mr-2" /><strong>Uso interno.</strong> Estas notas ficam visíveis apenas para a equipe responsável e não podem ser alteradas depois de salvas.</div>
      <PermissionGuard permission="REPORT_INTERNAL_NOTE">
        <Card className="p-5"><Textarea label="Nova nota interna" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Registre fatos, decisões ou próximos passos da investigação..." /><div className="mt-3 flex justify-end"><Button loading={saving} disabled={!content.trim()} onClick={() => void save()}><i className="bi bi-plus-lg" />Adicionar nota</Button></div></Card>
      </PermissionGuard>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card className="overflow-hidden">{loading ? <LoadingSection /> : items.length ? <div className="divide-y divide-slate-100">{items.map((note) => <article key={note.id} className="px-5 py-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-800">{note.authorName ?? 'Equipe administrativa'}</p><time className="text-xs text-slate-400">{formatDateTime(note.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.content}</p></article>)}</div> : <EmptyState icon="bi-journal" title="Nenhuma nota interna" description="As anotações da investigação aparecerão aqui." />}</Card>
    </div>
  );
}

function AttachmentsTab({ reportId }: { reportId: string }) {
  const [items, setItems] = useState<ReportAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems(await reportsApi.attachments(reportId)); } catch (err) { setError(getHttpErrorMessage(err)); } finally { setLoading(false); } }, [reportId]);
  useEffect(() => { void load(); }, [load]);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true); setError('');
    try { await reportsApi.uploadAttachment(reportId, file); await load(); }
    catch (err) { setError(getHttpErrorMessage(err, 'Não foi possível enviar o anexo.')); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const download = async (attachment: ReportAttachment) => {
    try {
      const blob = await reportsApi.downloadAttachment(reportId, attachment.id);
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = attachment.name; link.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(getHttpErrorMessage(err, 'O arquivo ainda não está autorizado ou disponível para download.')); }
  };

  const scanTone = (status?: string) => status === 'CLEAN' ? 'success' : status === 'INFECTED' || status === 'QUARANTINED' || status === 'FAILED' ? 'danger' : status === 'SCANNING' || status === 'PENDING' ? 'warning' : 'neutral';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Anexos da denúncia</h2><p className="mt-1 text-sm text-slate-500">Arquivos enviados pelo denunciante e pela equipe. Cada arquivo é verificado antes de ser liberado para download.</p></div><PermissionGuard permission="REPORT_ATTACHMENT"><input ref={fileRef} type="file" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} /><Button loading={uploading} onClick={() => fileRef.current?.click()}><i className="bi bi-cloud-arrow-up" />Enviar anexo</Button></PermissionGuard></div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card className="overflow-hidden">{loading ? <LoadingSection /> : items.length ? <div className="soft-scrollbar overflow-x-auto"><table className="min-w-[820px] w-full"><thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Arquivo</th><th className="px-5 py-3">Origem</th><th className="px-5 py-3">Tamanho</th><th className="px-5 py-3">Verificação</th><th className="px-5 py-3">Data</th><th className="px-5 py-3" /></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><i className="bi bi-file-earmark" /></span><div><p className="max-w-72 truncate text-sm font-bold text-slate-700">{item.name}</p><p className="text-xs text-slate-400">{fileTypeLabel(item.mimeType, item.name)}</p></div></div></td><td className="px-5 py-4 text-sm text-slate-600">{item.source === 'REPORTER' ? 'Denunciante' : item.source === 'ADMIN' ? 'Equipe interna' : item.source === 'SYSTEM' ? 'Sistema' : 'Não informado'}</td><td className="px-5 py-4 text-sm text-slate-500">{formatFileSize(item.size)}</td><td className="px-5 py-4"><Badge tone={scanTone(item.scanStatus)}>{attachmentStatusLabel(item.scanStatus)}</Badge></td><td className="px-5 py-4 text-sm text-slate-500">{formatDateTime(item.createdAt)}</td><td className="px-5 py-4 text-right"><PermissionGuard permission="REPORT_ATTACHMENT"><Button variant="ghost" size="sm" disabled={item.scanStatus !== 'CLEAN'} onClick={() => void download(item)}><i className="bi bi-download" /></Button></PermissionGuard></td></tr>)}</tbody></table></div> : <EmptyState icon="bi-paperclip" title="Nenhum anexo" description="Nenhum arquivo está associado a esta denúncia." />}</Card>
    </div>
  );
}

function HistoryTab() {
  return <Card className="p-6"><EmptyState icon="bi-clock-history" title="Histórico ainda indisponível" description="As atualizações desta denúncia ainda não podem ser exibidas nesta aba." /></Card>;
}

function LegalHoldTab({ reportId }: { reportId: string }) {
  const allowed = useCan({ permission: 'REPORT_LEGAL_HOLD_MANAGE' });
  const [state, setState] = useState<LegalHoldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [confirmAction, setConfirmAction] = useState<'APPLY' | 'RELEASE' | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    if (!allowed) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { setState(await reportsApi.legalHold(reportId)); }
    catch (err) { setError(err); setState(null); }
    finally { setLoading(false); }
  }, [allowed, reportId]);

  useEffect(() => { void load(); }, [load]);

  const execute = async () => {
    if (!confirmAction) return;
    if (reason.trim().length < 10) { setError(new Error('Informe um motivo com pelo menos 10 caracteres.')); return; }
    setSaving(true); setError(null);
    try {
      if (confirmAction === 'APPLY') await reportsApi.applyLegalHold(reportId, reason.trim());
      else await reportsApi.releaseLegalHold(reportId, reason.trim());
      setConfirmAction(null);
      setReason('');
      await load();
    } catch (err) { setError(err); }
    finally { setSaving(false); }
  };

  if (!allowed) {
    return <Card className="p-6"><EmptyState icon="bi-lock" title="Acesso não permitido" description="Sua conta não está autorizada a alterar a proteção desta denúncia." /></Card>;
  }

  if (loading) return <LoadingSection />;

  return (
    <div className="space-y-5">
      {error ? <ErrorAlert error={error} fallback="Não foi possível consultar ou alterar a proteção desta denúncia." onRetry={() => void load()} /> : null}
      <Card className="overflow-hidden">
        <div className={`border-b px-6 py-5 ${state?.active ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50/60'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${state?.active ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}><i className={`bi ${state?.active ? 'bi-shield-lock-fill' : 'bi-shield-check'}`} /></span>
              <div><h2 className="font-bold text-slate-900">{state?.active ? 'Proteção ativa' : 'Proteção desativada'}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{state?.active ? 'Esta denúncia está protegida e não será excluída ou anonimizada automaticamente enquanto a proteção estiver ativa.' : 'Esta denúncia segue normalmente as regras de prazo e descarte definidas no sistema.'}</p></div>
            </div>
            {state?.active ? <Button variant="secondary" onClick={() => { setReason(''); setConfirmAction('RELEASE'); }}><i className="bi bi-unlock" />Remover proteção</Button> : <Button onClick={() => { setReason(''); setConfirmAction('APPLY'); }}><i className="bi bi-lock" />Proteger denúncia</Button>}
          </div>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="Protegida em" value={state?.appliedAt ? formatDateTime(state.appliedAt) : '—'} />
          <InfoItem label="Protegida por" value={state?.appliedBy ?? '—'} />
          <InfoItem label="Próxima ação prevista" value={state?.retentionUntil ? formatDateTime(state.retentionUntil) : '—'} />
          <InfoItem label="Situação da guarda" value={[retentionActionLabel(state?.retentionAction), retentionExecutionStatusLabel(state?.retentionStatus)].filter((value) => value && !value.startsWith('Ação não') && !value.startsWith('Situação não')).join(' · ') || '—'} />
        </div>
        {state?.reason ? <div className="border-t border-slate-100 px-6 py-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Motivo registrado</p><p className="mt-2 text-sm leading-6 text-slate-600">{state.reason}</p></div> : null}
      </Card>

      <Card className="p-6"><div className="flex items-start gap-3"><i className="bi bi-info-circle mt-0.5 text-brand-700" /><div><h3 className="font-bold text-slate-900">Para que serve esta proteção?</h3><p className="mt-1 text-sm leading-6 text-slate-500">Use quando a denúncia precisar ser preservada por investigação, obrigação legal ou outro motivo importante. Enquanto estiver protegida, o sistema não executará exclusão ou ocultação automática dos dados.</p></div></div></Card>

      <Modal open={Boolean(confirmAction)} onClose={() => { setConfirmAction(null); setReason(''); }} title={confirmAction === 'APPLY' ? 'Proteger esta denúncia?' : 'Remover a proteção?'} description={confirmAction === 'APPLY' ? 'Enquanto a proteção estiver ativa, os dados não serão excluídos ou ocultados automaticamente.' : 'A denúncia voltará a seguir as regras normais de prazo e descarte.'} footer={<><Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancelar</Button><Button variant={confirmAction === 'RELEASE' ? 'secondary' : 'primary'} loading={saving} disabled={reason.trim().length < 10} onClick={() => void execute()}>{confirmAction === 'APPLY' ? 'Ativar proteção' : 'Remover proteção'}</Button></>}>
        <div className="space-y-4"><Textarea label="Motivo *" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explique por que esta denúncia precisa ser protegida ou liberada." hint={`${reason.trim().length}/10 caracteres mínimos`} className="min-h-28" /><p className="text-sm leading-6 text-slate-600">O motivo ficará registrado no histórico do sistema.</p></div>
      </Modal>
    </div>
  );
}

function AccessTab({ report, onChanged }: { report: ReportDetail; onChanged: () => Promise<void> }) {
  const canUserList = useCan({ permission: 'USER_MANAGE' });
  const canTeamList = useCan({ permission: 'TEAM_MANAGE' });
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<'USER' | 'TEAM'>('USER');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<NamedReference[]>([]);
  const [teams, setTeams] = useState<NamedReference[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const unitId = report.unit?.id;
    if (canUserList) {
      void usersApi.list()
        .then((items) => setUsers(items
          .filter((item) => item.active && (!unitId || item.units.some((unit) => unit.id === unitId)))
          .map((item) => ({ id: item.id, name: `${item.name} — ${item.email}` }))))
        .catch((err) => { setUsers([]); setError(getHttpErrorMessage(err, 'Não foi possível carregar os usuários desta unidade para atribuição.')); });
    }
    if (canTeamList) {
      void teamsApi.list()
        .then((items) => setTeams(items
          .filter((item) => item.active && (!unitId || item.units.some((unit) => unit.id === unitId)))
          .map((item) => ({ id: item.id, name: item.name }))))
        .catch((err) => { setTeams([]); setError(getHttpErrorMessage(err, 'Não foi possível carregar as equipes desta unidade para atribuição.')); });
    }
  }, [open, canUserList, canTeamList, report.unit?.id]);

  const options = targetType === 'USER' ? users : teams;
  const canChooseList = targetType === 'USER' ? canUserList : canTeamList;

  const assign = async () => {
    if (!targetId.trim()) return;
    setSaving(true); setError('');
    try { await reportsApi.assign(report.id, { targetType, targetId: targetId.trim(), reason: reason.trim() || undefined }); setOpen(false); setTargetId(''); setReason(''); await onChanged(); }
    catch (err) { setError(getHttpErrorMessage(err, 'Não foi possível alterar a atribuição.')); }
    finally { setSaving(false); }
  };

  const unassign = async () => {
    setSaving(true); setError('');
    try { await reportsApi.unassign(report.id); await onChanged(); }
    catch (err) { setError(getHttpErrorMessage(err, 'Não foi possível remover a atribuição.')); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="font-bold text-slate-900">Atribuição atual</h2><p className="mt-1 text-sm text-slate-500">Pessoa ou equipe responsável por acompanhar esta denúncia.</p></div>
          <PermissionGuard permission="REPORT_ASSIGN"><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={!report.assignee && !report.team || saving} onClick={() => void unassign()}><i className="bi bi-person-dash" />Remover</Button><Button size="sm" onClick={() => setOpen(true)}><i className="bi bi-person-plus" />Atribuir</Button></div></PermissionGuard>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Usuário</p><p className="mt-2 font-bold text-slate-800">{report.assignee?.name ?? 'Não atribuído'}</p></div><div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Equipe</p><p className="mt-2 font-bold text-slate-800">{report.team?.name ?? 'Não atribuída'}</p></div></div>
      </Card>
      <Card className="p-6"><h2 className="font-bold text-slate-900">Controle de acesso</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">O sistema controla automaticamente quem pode visualizar e trabalhar nesta denúncia conforme as permissões de cada pessoa.</p></Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Atribuir denúncia" description={`Escolha um usuário ou equipe da unidade ${report.unit?.name ?? 'da denúncia'}. Pessoas de outras regiões não aparecem nesta seleção.`} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={saving} disabled={!targetId.trim()} onClick={() => void assign()}>Confirmar atribuição</Button></>}>
        <div className="space-y-4"><Select label="Destino" value={targetType} onChange={(e) => { setTargetType(e.target.value as 'USER' | 'TEAM'); setTargetId(''); }}><option value="USER">Usuário</option><option value="TEAM">Equipe</option></Select>{canChooseList && options.length ? <Select label={targetType === 'USER' ? 'Usuário' : 'Equipe'} value={targetId} onChange={(e) => setTargetId(e.target.value)}><option value="">Selecione...</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Não foi possível carregar as opções disponíveis para esta atribuição. Tente novamente ou peça ao administrador do sistema para verificar seu acesso.</div>}<Textarea label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: distribuição por especialidade" /></div>
      </Modal>
    </div>
  );
}

export function ReportDetailPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab) ? (requestedTab as TabId) : 'overview';
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [nextPriority, setNextPriority] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try { setReport(await reportsApi.get(id)); }
    catch (err) { setError(getHttpErrorMessage(err, 'Não foi possível carregar a denúncia.')); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (report) { setNextStatus(report.status); setNextPriority(report.priority ?? 'NORMAL'); } }, [report]);

  const changeStatus = async () => {
    if (!report || report.version == null || !nextStatus) { setActionError('Não foi possível preparar esta alteração. Atualize a página e tente novamente.'); return; }
    setSaving(true); setActionError('');
    try { await reportsApi.changeStatus(report.id, nextStatus, report.version); setStatusOpen(false); await load(); }
    catch (err) { setActionError(getHttpErrorMessage(err, 'Não foi possível alterar a situação.')); }
    finally { setSaving(false); }
  };

  const changePriority = async () => {
    if (!report || !nextPriority) return;
    setSaving(true); setActionError('');
    try { await reportsApi.changePriority(report.id, nextPriority); setPriorityOpen(false); await load(); }
    catch (err) { setActionError(getHttpErrorMessage(err, 'Não foi possível alterar a prioridade.')); }
    finally { setSaving(false); }
  };

  const headerMeta = useMemo(() => report ? [
    ['Categoria', report.category?.name ?? '—'],
    ['Unidade', report.unit?.name ?? '—'],
    ['Responsável', report.assignee?.name ?? report.team?.name ?? 'Não atribuída'],
    ['Abertura', formatDateTime(report.createdAt)],
  ] : [], [report]);

  if (loading) return <div className="space-y-5"><Skeleton className="h-8 w-36" /><Card className="p-6"><Skeleton className="h-8 w-72" /><Skeleton className="mt-4 h-20 w-full" /></Card><Skeleton className="h-96 w-full" /></div>;

  if (error || !report) return <div className="space-y-4"><Link to="/admin/denuncias" className="text-sm font-bold text-brand-700"><i className="bi bi-arrow-left mr-2" />Voltar para denúncias</Link><Card className="p-8"><EmptyState icon="bi-exclamation-circle" title="Não foi possível abrir a denúncia" description={error || 'Registro não encontrado.'} action={<Button variant="secondary" onClick={() => void load()}>Tentar novamente</Button>} /></Card></div>;

  return (
    <div className="space-y-6">
      <div><Link to="/admin/denuncias" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-700"><i className="bi bi-arrow-left" />Denúncias</Link></div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black tracking-tight text-slate-900">{report.protocol}</h1><ReportStatusBadge status={report.status} /><ReportPriorityBadge priority={report.priority} /><RiskBadge immediateRisk={report.immediateRisk} />{report.legalHold ? <Badge tone="warning"><i className="bi bi-shield-lock-fill mr-1" />Proteção ativa</Badge> : null}</div><p className="mt-2 text-sm text-slate-500">Denúncia aberta em {formatDateTime(report.createdAt)} · última atualização {formatDateTime(report.updatedAt)}</p></div>
            <div className="flex flex-wrap gap-2"><PermissionGuard anyOf={['REPORT_CHANGE_STATUS','REPORT_CONCLUDE','REPORT_ARCHIVE']}><Button variant="secondary" size="sm" onClick={() => setStatusOpen(true)}><i className="bi bi-arrow-left-right" />Alterar situação</Button></PermissionGuard><PermissionGuard permission="REPORT_CHANGE_PRIORITY"><Button variant="secondary" size="sm" onClick={() => setPriorityOpen(true)}><i className="bi bi-flag" />Prioridade</Button></PermissionGuard></div>
          </div>
          {actionError ? <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div> : null}
          <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">{headerMeta.map(([label,value]) => <InfoItem key={label} label={label} value={value} />)}</dl>
        </div>

        <div className="soft-scrollbar overflow-x-auto border-b border-slate-100 px-2 sm:px-4"><nav className="flex min-w-max gap-1">{tabs.map((tab) => <button key={tab.id} onClick={() => setSearchParams((current) => { const params = new URLSearchParams(current); if (tab.id === 'overview') params.delete('tab'); else params.set('tab', tab.id); return params; }, { replace: true })} className={`flex h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><i className={`bi ${tab.icon}`} />{tab.label}</button>)}</nav></div>
      </Card>

      {activeTab === 'overview' ? <OverviewTab report={report} /> : null}
      {activeTab === 'messages' ? <MessagesTab reportId={report.id} /> : null}
      {activeTab === 'notes' ? <NotesTab reportId={report.id} /> : null}
      {activeTab === 'attachments' ? <AttachmentsTab reportId={report.id} /> : null}
      {activeTab === 'history' ? <HistoryTab /> : null}
      {activeTab === 'access' ? <AccessTab report={report} onChanged={load} /> : null}
      {activeTab === 'legal-hold' ? <LegalHoldTab reportId={report.id} /> : null}

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Alterar situação" description={`Situação atual: ${reportStatusLabel(report.status)}`} footer={<><Button variant="secondary" onClick={() => setStatusOpen(false)}>Cancelar</Button><Button loading={saving} disabled={!nextStatus || nextStatus === report.status} onClick={() => void changeStatus()}>Salvar situação</Button></>}>
        <Select label="Nova situação" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}><option value="RECEIVED">Recebida</option><option value="INITIAL_REVIEW">Em triagem</option><option value="WAITING_REPORTER_INFORMATION">Aguardando denunciante</option><option value="INVESTIGATING">Em investigação</option><option value="FORWARDED">Encaminhada</option><option value="CONCLUDED">Concluída</option><option value="ARCHIVED">Arquivada</option></Select>{report.version == null ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Não foi possível preparar a alteração agora. Atualize a página e tente novamente.</p> : null}
      </Modal>

      <Modal open={priorityOpen} onClose={() => setPriorityOpen(false)} title="Alterar prioridade" footer={<><Button variant="secondary" onClick={() => setPriorityOpen(false)}>Cancelar</Button><Button loading={saving} disabled={!nextPriority || nextPriority === report.priority} onClick={() => void changePriority()}>Salvar prioridade</Button></>}>
        <Select label="Nova prioridade" value={nextPriority} onChange={(e) => setNextPriority(e.target.value)}><option value="LOW">Baixa</option><option value="NORMAL">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></Select>
      </Modal>
    </div>
  );
}
