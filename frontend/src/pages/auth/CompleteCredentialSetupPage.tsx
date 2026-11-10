import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from '../../layouts/AuthLayout';
import { completeCredentialSchema, type CompleteCredentialFormData } from '../../schemas/auth';

export function CompleteCredentialSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [serverError, setServerError] = useState<unknown | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteCredentialFormData>({
    resolver: zodResolver(completeCredentialSchema),
    defaultValues: { token: urlToken, password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ token, password, confirmPassword }: CompleteCredentialFormData) => {
    setServerError(null);
    try {
      await authApi.completeCredentialSetup({
        token: token.trim(),
        newPassword: password,
        confirmPassword,
      });
      navigate('/admin/login', {
        replace: true,
        state: { message: 'Senha criada com sucesso. Faça o login para continuar.' },
      });
    } catch (error) {
      setServerError(error);
    }
  };

  return (
    <AuthLayout>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Convite ou redefinição</p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Crie sua senha</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Informe o código que você recebeu e escolha uma nova senha para concluir o acesso.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError ? <ErrorAlert error={serverError} fallback="Não foi possível criar sua senha." /> : null}

        <Input
          label="Código de acesso"
          autoComplete="off"
          placeholder="Cole o código recebido"
          error={errors.token?.message}
          {...register('token')}
        />
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 12 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirme a nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
          Use pelo menos 12 caracteres, com maiúscula, minúscula, número e caractere especial.
        </div>

        <Button type="submit" size="lg" block loading={isSubmitting}>Concluir</Button>
        <p className="text-center text-sm text-slate-500">
          Já possui senha? <Link className="font-semibold text-brand-700 hover:underline" to="/admin/login">Voltar ao login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
