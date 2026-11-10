import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

const strongPassword = z
  .string()
  .min(12, 'Use pelo menos 12 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.')
  .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
  .regex(/[0-9]/, 'Inclua pelo menos um número.')
  .regex(/[^A-Za-z0-9]/, 'Inclua pelo menos um caractere especial.');

export const changePasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const completeCredentialSchema = z
  .object({
    token: z.string().trim().min(40, 'O código de acesso informado é inválido.').max(200, 'O código de acesso informado é inválido.'),
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export type CompleteCredentialFormData = z.infer<typeof completeCredentialSchema>;
