import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { MoviLogo } from '@/components/brand/MoviLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import {
  Sparkles,
  Building2,
  Palette,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Store,
  Phone,
  MapPin,
  Check,
} from 'lucide-react';

const SEGMENTS = [
  { value: 'Varejo', label: 'Comércio / Varejo em Geral' },
  { value: 'Alimentacao', label: 'Alimentação e Bebidas / Restaurante' },
  { value: 'Moda', label: 'Moda, Roupas e Acessórios' },
  { value: 'Beleza', label: 'Beleza e Cosméticos' },
  { value: 'Eletronicos', label: 'Eletrônicos e Informática' },
  { value: 'Servicos', label: 'Prestação de Serviços' },
  { value: 'Outro', label: 'Outro segmento comercial' },
];

const PRESET_COLORS = [
  { name: 'Amarelo MOVI', value: '#FFD600' },
  { name: 'Azul Conexão', value: '#2563EB' },
  { name: 'Verde Crescimento', value: '#16A34A' },
  { name: 'Laranja Energia', value: '#EA580C' },
  { name: 'Roxo Moderno', value: '#7C3AED' },
  { name: 'Grafite Elegante', value: '#111111' },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompany, createCompany, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    business_type: 'Varejo',
    whatsapp: '',
    city: '',
    state: '',
    primary_color: '#FFD600',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // If user already has an active company, prevent duplicate onboarding
  useEffect(() => {
    if (currentCompany && step !== 4) {
      navigate('/app/dashboard');
    }
  }, [currentCompany, navigate, step]);

  const handleNextFromStep2 = () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setValidationError('Por favor, informe o nome comercial da sua empresa.');
      return;
    }
    setValidationError(null);
    setStep(3);
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const { company, error } = await createCompany({
        name: formData.name.trim(),
        business_type: formData.business_type,
        whatsapp: formData.whatsapp.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        primary_color: formData.primary_color,
      });

      if (error) {
        toastError('Não foi possível salvar', error.message);
        setValidationError(error.message);
        setIsSubmitting(false);
        return;
      }

      if (company) {
        success('Empresa configurada!', 'Seu ambiente MOVI está pronto.');
        setStep(4);
      }
    } catch (err: any) {
      toastError('Erro ao finalizar', err?.message || 'Falha de comunicação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsHeader = [
    { num: 1, label: 'Boas-vindas' },
    { num: 2, label: 'Sua empresa' },
    { num: 3, label: 'Personalização' },
    { num: 4, label: 'Tudo pronto' },
  ];

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border">
        <MoviLogo variant="horizontal" theme="graphite" size="md" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary hidden sm:inline">
            Configuração do Espaço MOVI
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-movi-yellow text-movi-graphite">
            Passo {step} de 4
          </span>
        </div>
      </header>

      {/* Progress Stepper Bar */}
      <div className="max-w-xl mx-auto w-full my-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-movi-yellow -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {stepsHeader.map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.num
                    ? 'bg-movi-graphite text-white'
                    : step === s.num
                    ? 'bg-movi-yellow text-movi-graphite ring-4 ring-movi-yellow/30'
                    : 'bg-white border border-border text-text-secondary'
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[11px] font-medium text-text-secondary mt-1.5 hidden sm:block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto w-full my-auto py-4">
        {/* STEP 1: Boas-vindas */}
        {step === 1 && (
          <Card className="animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-8 sm:p-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-movi-yellow/20 border border-movi-yellow/40 text-movi-graphite flex items-center justify-center mx-auto shadow-subtle">
                <Sparkles className="w-8 h-8 text-movi-graphite" />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary text-text-secondary text-xs font-medium">
                  <span>Olá, {profile?.full_name?.split(' ')[0] || 'Empreendedor'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-movi-graphite tracking-tight">
                  Seu negócio começa a se mover agora.
                </h2>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-md mx-auto">
                  Vamos preparar seu espaço de gestão. É rápido, simples e feito para o seu negócio crescer com segurança.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Começar configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Sua empresa */}
        {step === 2 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-movi-yellow/20 text-movi-graphite flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-movi-graphite">
                    02 — Sua empresa
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Identifique seu estabelecimento comercial
                  </p>
                </div>
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-status-danger-bg text-status-danger text-xs font-medium">
                  {validationError}
                </div>
              )}

              <Input
                label="Nome da empresa *"
                placeholder="Ex: Mercadinho Central ou Loja Silva"
                value={formData.name}
                leftIcon={<Store className="w-4 h-4" />}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Select
                label="Segmento de atuação"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                options={SEGMENTS}
              />

              <Input
                label="WhatsApp comercial (opcional)"
                placeholder="(00) 90000-0000"
                value={formData.whatsapp}
                leftIcon={<Phone className="w-4 h-4" />}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Cidade (opcional)"
                  placeholder="Ex: Fortaleza"
                  value={formData.city}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="Estado / UF (opcional)"
                  placeholder="Ex: CE ou Ceará"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextFromStep2}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Personalização */}
        {step === 3 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-movi-yellow/20 text-movi-graphite flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-movi-graphite">
                    03 — Personalização
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Defina a cor de destaque para seu catálogo de loja
                  </p>
                </div>
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-status-danger-bg text-status-danger text-xs font-medium">
                  {validationError}
                </div>
              )}

              {/* Informative Note required by Section 6 */}
              <div className="p-4 rounded-xl bg-surface-secondary border border-border/80 text-xs text-text-secondary space-y-1.5">
                <p className="font-semibold text-movi-graphite flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-movi-yellow" />
                  Identidade do Software vs. Loja
                </p>
                <p className="leading-relaxed">
                  O amarelo MOVI é a identidade visual exclusiva da plataforma administrativa. A cor escolhida abaixo será aplicada futuramente no catálogo público da sua loja virtual e em comprovantes para seus clientes.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-movi-graphite block mb-2.5">
                  Cor principal da sua loja:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = formData.primary_color === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, primary_color: c.value })}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-movi-graphite ring-2 ring-movi-graphite/20 bg-surface'
                            : 'border-border hover:border-gray-300'
                        }`}
                      >
                        <span
                          className="w-7 h-7 rounded-full shadow-subtle border border-black/10 shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: c.value }}
                        >
                          {isSelected && (
                            <Check className={`w-3.5 h-3.5 ${c.value === '#FFD600' || c.value === '#FFFFFF' ? 'text-movi-graphite' : 'text-white'}`} />
                          )}
                        </span>
                        <span className="text-[10px] font-medium text-text-secondary truncate w-full">
                          {c.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prévia da Loja */}
              <div className="p-4 rounded-xl border border-border bg-white space-y-2">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                  Prévia do Cabeçalho da sua Loja
                </span>
                <div className="p-3 rounded-lg border border-border/60 flex items-center justify-between" style={{ borderLeftColor: formData.primary_color, borderLeftWidth: 4 }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: formData.primary_color, color: formData.primary_color === '#FFD600' ? '#111111' : '#FFFFFF' }}>
                      {formData.name.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-movi-graphite">{formData.name || 'Nome da sua Loja'}</h4>
                      <span className="text-[10px] text-text-secondary">{formData.business_type}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-success-bg text-status-success font-medium">
                    Aberta
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleFinishOnboarding}
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Concluir e Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Tudo pronto */}
        {step === 4 && (
          <Card className="animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-8 sm:p-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto shadow-subtle border border-status-success-border">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-movi-yellow text-movi-graphite text-xs font-semibold">
                  <span>Empresa Ativa: {formData.name}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-movi-graphite tracking-tight">
                  Pronto! Seu negócio já pode começar.
                </h2>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-md mx-auto">
                  Seu espaço de gestão está preparado. Agora é hora de organizar e vender mais.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/app/dashboard')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Ir para meu painel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-border text-center text-xs text-text-secondary">
        MOVI — Gestão Comercial Inteligente &bull; Plano Free Premium Ativo
      </footer>
    </div>
  );
};

export default OnboardingPage;
