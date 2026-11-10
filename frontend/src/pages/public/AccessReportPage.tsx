import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { FormErrorSummary } from '../../components/ui/FormErrorSummary';
import { Input } from '../../components/ui/Input';
import { PublicPageShell } from '../../components/public/PublicPageShell';
import { SecurityCard } from '../../components/public/SecurityCard';
import { useReporter } from '../../context/ReporterContext';
import type { FieldErrors } from '../../utils/validation';

export function AccessReportPage() {
  const [searchParams] = useSearchParams();
  const [protocol, setProtocol] = useState(searchParams.get('protocol') ?? '');
  const [secret, setSecret] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<unknown | null>(null);
  const navigate = useNavigate();
  const { accessReport, loading } = useReporter();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setApiError(null);
    const next: FieldErrors = {};
    if (!protocol.trim()) next.protocol = 'Informe o protocolo recebido no envio da denúncia.';
    if (!secret.trim()) next.secret = 'Informe a senha de acompanhamento.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const report = await accessReport(protocol, secret);
      navigate(`/acompanhar/${encodeURIComponent(report.protocol || protocol.trim())}`, { replace: true });
    } catch (currentError) {
      setApiError(currentError);
    }
  };

  return (
    <PublicPageShell eyebrow="Acompanhamento" title="Acesse sua denúncia" description="Use o protocolo e a senha de acompanhamento fornecidos no momento do envio." aside={<SecurityCard />}>
      <Card className="p-5 sm:p-8">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {Object.keys(errors).length ? <FormErrorSummary errors={errors} title="Preencha os dados de acesso" /> : null}
          {apiError ? <ErrorAlert error={apiError} fallback="Protocolo ou senha de acompanhamento inválidos. Confira os dados e tente novamente." /> : null}
          <Input name="protocol" label="Protocolo" value={protocol} error={errors.protocol} onChange={(e) => { setProtocol(e.target.value); setErrors((v) => ({ ...v, protocol: '' })); }} placeholder="Digite o protocolo" autoComplete="off" spellCheck={false} />
          <Input name="secret" label="Senha de acompanhamento" type="password" value={secret} error={errors.secret} onChange={(e) => { setSecret(e.target.value); setErrors((v) => ({ ...v, secret: '' })); }} placeholder="Digite sua senha de acompanhamento" autoComplete="current-password" />
          <Button type="submit" block size="lg" loading={loading}>Acessar denúncia <i className="bi bi-arrow-right" /></Button>
          <p className="text-center text-xs leading-5 text-slate-400">Por segurança, essa senha não é exibida novamente pelo sistema.</p>
        </form>
      </Card>
    </PublicPageShell>
  );
}
