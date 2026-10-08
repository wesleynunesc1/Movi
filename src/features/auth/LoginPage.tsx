import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from './schemas';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/app/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, currentCompany } = useAuth();
  const { success } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      setAuthError(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      return;
    }

    success('Bem-vindo de volta!', 'Sessão iniciada com sucesso.');
    if (currentCompany) {
      navigate('/app/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <AuthLayout
      title="Acesse sua conta"
      subtitle="Digite seus dados de acesso para gerenciar sua empresa."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="p-3.5 rounded-xl bg-status-danger-bg border border-status-danger-border flex items-start gap-2.5 text-xs text-status-danger">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{authError}</p>
          </div>
        )}

        <Input
          label="E-mail profissional"
          type="email"
          placeholder="exemplo@suaempresa.com.br"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1">
          <Input
            label="Senha de acesso"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-movi-graphite transition-colors p-1"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-text-secondary hover:text-movi-graphite hover:underline transition-colors"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Entrar no MOVI
          </Button>
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs text-text-secondary">
            Ainda não tem conta na MOVI?{' '}
            <Link
              to="/register"
              className="font-semibold text-movi-graphite hover:underline ml-1"
            >
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
