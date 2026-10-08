import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from './schemas';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/app/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { success } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    const { error } = await signUp(data.fullName, data.email, data.password);
    if (error) {
      setAuthError(error.message || 'Não foi possível criar a conta. Tente novamente.');
      return;
    }

    success('Conta criada com sucesso!', 'Vamos agora configurar sua empresa.');
    navigate('/onboarding');
  };

  return (
    <AuthLayout
      title="Comece gratuitamente"
      subtitle="Crie seu acesso e transforme a gestão do seu comércio com o MOVI Free Premium."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="p-3.5 rounded-xl bg-status-danger-bg border border-status-danger-border flex items-start gap-2.5 text-xs text-status-danger">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{authError}</p>
          </div>
        )}

        <Input
          label="Nome completo"
          placeholder="Ex: Wesley Nunes"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="E-mail profissional"
          type="email"
          placeholder="seu@comercio.com.br"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha de acesso"
          type={showPassword ? 'text' : 'password'}
          placeholder="Mínimo de 6 caracteres"
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

        <Input
          label="Confirme a senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repita a senha"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border/80 flex items-start gap-2 text-[11px] text-text-secondary">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
          <span>Ao criar sua conta, você ganha acesso imediato ao plano <strong>MOVI Free Premium</strong> sem necessidade de cartão de crédito.</span>
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
            Criar conta e Iniciar Onboarding
          </Button>
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs text-text-secondary">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-movi-graphite hover:underline ml-1"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
