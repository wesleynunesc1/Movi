import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Insira um e-mail válido'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
    email: z.string().email('Insira um e-mail válido'),
    password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Insira um e-mail válido'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua nova senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
