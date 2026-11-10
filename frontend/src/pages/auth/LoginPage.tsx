import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Alert } from '../../components/ui/Alert';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { loginSchema, type LoginFormData } from '../../schemas/auth';

type LocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<unknown | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const routeMessage = (location.state as { message?: string } | null)?.message;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormData) => {
    setServerError(null);

    try {
      const result = await login(values);

      if (result.nextStep === 'CHANGE_PASSWORD') {
        if (!result.preAuthToken) {
          setServerError(new Error('Não foi possível iniciar a troca de senha. Atualize a página e tente novamente.'));
          return;
        }

        sessionStorage.setItem('nvk_pre_auth_token', result.preAuthToken);
        navigate('/admin/trocar-senha', { replace: true });
        return;
      }

      const state = location.state as LocationState | null;
      const destination = state?.from?.pathname
        ? `${state.from.pathname}${state.from.search ?? ''}`
        : '/admin';

      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(error);
    }
  };

  return (
    <AuthLayout>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          Acesso administrativo
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bem-vindo</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Informe seu e-mail e senha para acessar o Canal de Denúncias.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {routeMessage ? <Alert tone="success">{routeMessage}</Alert> : null}
        {serverError ? <ErrorAlert error={serverError} fallback="E-mail ou senha inválidos." /> : null}

        <Input
          label="E-mail"
          type="email"
          autoComplete="username"
          placeholder="nome@novacki.com.br"
          icon={<i className="bi bi-envelope" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <div className="relative">
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              icon={<i className="bi bi-lock" />}
              error={errors.password?.message}
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-[34px] flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} />
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" block loading={isSubmitting}>
          Entrar no painel
          {!isSubmitting ? <i className="bi bi-arrow-right" /> : null}
        </Button>

        <div className="text-center">
          <Link
            className="text-sm font-semibold text-brand-700 hover:underline"
            to="/admin/definir-credencial"
          >
            Recebeu um código de acesso? Definir senha
          </Link>
        </div>
      </form>

      <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
        <div className="flex gap-3">
          <i className="bi bi-info-circle mt-0.5 text-brand-700" />
          <p className="text-xs leading-5 text-slate-500">
            Seu acesso é protegido. Se você tiver dificuldade para entrar, peça ao administrador para gerar uma nova forma de acesso.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
