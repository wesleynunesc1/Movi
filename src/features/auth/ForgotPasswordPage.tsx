import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from './schemas';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setErrorMessage(null);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }
    setIsSuccess(true);
  };

  return (
    <AuthLayout
      title="Recuperar acesso"
      subtitle="Insira o e-mail cadastrado para receber as instruções de redefinição de senha."
    >
      {isSuccess ? (
        <div className="space-y-5 text-center py-6">
          <div className="w-14 h-14 bg-status-success-bg text-status-success rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-display text-movi-graphite">
              E-mail de recuperação enviado!
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
              Verifique sua caixa de entrada e siga as instruções para cadastrar uma nova senha segura.
            </p>
          </div>
          <div className="pt-4">
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                Voltar para o login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-status-danger-bg text-status-danger text-xs">
              {errorMessage}
            </div>
          )}

          <Input
            label="E-mail cadastrado"
            type="email"
            placeholder="seu@comercio.com.br"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Enviar instruções de recuperação
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-movi-graphite"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Lembrou sua senha? Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
