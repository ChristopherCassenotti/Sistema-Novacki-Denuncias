import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { authApi } from '../../api/auth';
import { Alert } from '../../components/ui/Alert';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from '../../layouts/AuthLayout';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../../schemas/auth';

export function ChangeInitialPasswordPage() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('nvk_pre_auth_token');
  const [serverError, setServerError] = useState<unknown | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const onSubmit = async ({ password, confirmPassword }: ChangePasswordFormData) => {
    setServerError(null);

    try {
      await authApi.changeInitialPassword({ token, newPassword: password, confirmPassword });
      sessionStorage.removeItem('nvk_pre_auth_token');
      navigate('/admin/login', {
        replace: true,
        state: { message: 'Senha definida com sucesso. Faça o login novamente.' },
      });
    } catch (error) {
      setServerError(error);
    }
  };

  return (
    <AuthLayout>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          Primeiro acesso
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Defina sua nova senha</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Para continuar, crie uma senha pessoal e segura.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError ? <ErrorAlert error={serverError} fallback="Não foi possível definir a nova senha." /> : null}

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

        <Button type="submit" size="lg" block loading={isSubmitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  );
}
