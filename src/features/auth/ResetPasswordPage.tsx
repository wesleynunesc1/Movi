import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from './schemas';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setErrorMessage(null);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) {
        setErrorMessage(error.message);
        toastError('Erro ao atualizar', error.message);
        return;
      }
    }

    success('Senha atualizada!', 'Faça login com sua nova credencial.');
    navigate('/login');
  };

  return (
    <AuthLayout
      title="Criar nova senha"
      subtitle="Defina sua nova senha para acessar com segurança o ecossistema MOVI."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-status-danger-bg text-status-danger text-xs">
            {errorMessage}
          </div>
        )}

        <Input
          label="Nova senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="Mínimo de 6 caracteres"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:text-movi-graphite transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirme a nova senha"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repita a nova senha"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            rightIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Atualizar senha e Entrar
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
