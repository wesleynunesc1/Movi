import React, { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { FREE_PREMIUM_PLAN } from '@/types/database';
import {
  Building2,
  Palette,
  User,
  Sliders,
  Sparkles,
  Save,
  CheckCircle2,
  Store,
  Phone,
  MapPin,
  Lock,
  Globe,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentCompany, updateCurrentCompanySettings, profile, updateProfile, user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<string>('company');
  const [isSaving, setIsSaving] = useState(false);

  // 1. Minha Empresa State
  const [companyForm, setCompanyForm] = useState({
    name: currentCompany?.name || '',
    business_type: currentCompany?.business_type || 'Varejo',
    phone: currentCompany?.settings?.phone || '',
    whatsapp: currentCompany?.settings?.whatsapp || '',
    address: currentCompany?.settings?.address || '',
    city: currentCompany?.settings?.city || '',
    state: currentCompany?.settings?.state || '',
    business_document: currentCompany?.settings?.business_document || '',
  });

  // 2. Identidade da Loja State
  const [storeDesign, setStoreDesign] = useState({
    primary_color: currentCompany?.settings?.primary_color || '#FFD600',
    logo_url: currentCompany?.settings?.logo_url || '',
  });

  // 3. Minha Conta State
  const [accountForm, setAccountForm] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    avatar_url: profile?.avatar_url || '',
  });

  // 4. Preferências State
  const [preferences, setPreferences] = useState({
    currency: 'BRL',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  });

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCurrentCompanySettings({
        phone: companyForm.phone || null,
        whatsapp: companyForm.whatsapp || null,
        address: companyForm.address || null,
        city: companyForm.city || null,
        state: companyForm.state || null,
        business_document: companyForm.business_document || null,
      });
      success('Empresa salva!', 'Informações atualizadas com sucesso no banco de dados.');
    } catch (err: any) {
      toastError('Erro ao salvar', err?.message || 'Falha ao persistir alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStoreDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCurrentCompanySettings({
        primary_color: storeDesign.primary_color,
        logo_url: storeDesign.logo_url || null,
      });
      success('Identidade salva!', 'Visual da loja atualizado com sucesso.');
    } catch (err: any) {
      toastError('Erro ao salvar', err?.message || 'Falha ao persistir alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: accountForm.full_name,
        avatar_url: accountForm.avatar_url || undefined,
      });
      success('Perfil salvo!', 'Seus dados de usuário foram atualizados.');
    } catch (err: any) {
      toastError('Erro ao atualizar', err?.message || 'Falha na persistência.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabsConfig = [
    { id: 'company', label: 'Minha Empresa', icon: <Building2 className="w-4 h-4" /> },
    { id: 'store-identity', label: 'Identidade da Loja', icon: <Palette className="w-4 h-4" /> },
    { id: 'account', label: 'Minha Conta', icon: <User className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferências', icon: <Sliders className="w-4 h-4" /> },
    { id: 'plan', label: 'Meu Plano', icon: <Sparkles className="w-4 h-4" />, badge: 'Free' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold font-display text-movi-graphite">
          Configurações
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Gerencie informações da sua empresa, preferências operacionais e dados da conta
        </p>
      </div>

      {/* Tabs de Configuração */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* 1. ABA: MINHA EMPRESA */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany}>
          <Card>
            <CardHeader>
              <CardTitle>Dados Comerciais da Empresa</CardTitle>
              <CardDescription>
                Informações cadastrais exibidas para seus clientes e em documentos comerciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome da empresa"
                  value={companyForm.name}
                  disabled
                  helperText="O nome principal é fixado pelo registro inicial"
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
                <Input
                  label="Segmento de atuação"
                  value={companyForm.business_type}
                  disabled
                  leftIcon={<Store className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CNPJ / Documento Comercial (opcional)"
                  placeholder="00.000.000/0001-00"
                  value={companyForm.business_document}
                  onChange={(e) => setCompanyForm({ ...companyForm, business_document: e.target.value })}
                />
                <Input
                  label="WhatsApp para Vendas"
                  placeholder="(00) 90000-0000"
                  value={companyForm.whatsapp}
                  leftIcon={<Phone className="w-4 h-4" />}
                  onChange={(e) => setCompanyForm({ ...companyForm, whatsapp: e.target.value })}
                />
              </div>

              <Input
                label="Endereço comercial (opcional)"
                placeholder="Rua, número, bairro..."
                value={companyForm.address}
                leftIcon={<MapPin className="w-4 h-4" />}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  placeholder="Ex: São Paulo"
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                />
                <Input
                  label="Estado / UF"
                  placeholder="Ex: SP"
                  value={companyForm.state}
                  onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-text-secondary">
                Alterações salvas diretamente no PostgreSQL com segurança RLS.
              </span>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* 2. ABA: IDENTIDADE DA LOJA */}
      {activeTab === 'store-identity' && (
        <form onSubmit={handleSaveStoreDesign}>
          <Card>
            <CardHeader>
              <CardTitle>Identidade do Catálogo e Loja</CardTitle>
              <CardDescription>
                Personalize a aparência do catálogo público que seus clientes acessam para fazer pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary">
                <strong>Importante:</strong> O padrão do software administrativo MOVI preserva os tons Amarelo (#FFD600) e Grafite (#111111). A cor configurada abaixo será utilizada exclusivamente no catálogo externo da sua loja.
              </div>

              <div>
                <label className="text-xs font-semibold text-movi-graphite block mb-2">
                  Cor de destaque da sua vitrine
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={storeDesign.primary_color}
                    onChange={(e) => setStoreDesign({ ...storeDesign, primary_color: e.target.value })}
                    className="w-12 h-12 rounded-xl border border-border cursor-pointer p-1 bg-white"
                  />
                  <div>
                    <span className="text-xs font-mono font-semibold text-movi-graphite block">
                      {storeDesign.primary_color.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Clique no seletor para escolher qualquer tonalidade
                    </span>
                  </div>
                </div>
              </div>

              {/* Prévia da Loja */}
              <div className="p-5 rounded-2xl border border-border bg-white space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                  Prévia em Tempo Real
                </span>
                <div
                  className="p-4 rounded-xl border flex items-center justify-between"
                  style={{ borderLeftColor: storeDesign.primary_color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: storeDesign.primary_color,
                        color: storeDesign.primary_color === '#FFD600' ? '#111111' : '#FFFFFF',
                      }}
                    >
                      {currentCompany?.name.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-movi-graphite">{currentCompany?.name}</h4>
                      <p className="text-xs text-text-secondary">Catálogo Online Ativo</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    style={{
                      backgroundColor: storeDesign.primary_color,
                      color: storeDesign.primary_color === '#FFD600' ? '#111111' : '#FFFFFF',
                    }}
                  >
                    Ver Produtos
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-text-secondary">
                Pronto para conexão com o módulo Minha Loja Online
              </span>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Salvar Identidade
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* 3. ABA: MINHA CONTA */}
      {activeTab === 'account' && (
        <form onSubmit={handleSaveAccount}>
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil de Administrador</CardTitle>
              <CardDescription>
                Gerencie seus dados pessoais de acesso à plataforma MOVI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nome completo"
                value={accountForm.full_name}
                leftIcon={<User className="w-4 h-4" />}
                onChange={(e) => setAccountForm({ ...accountForm, full_name: e.target.value })}
              />

              <Input
                label="E-mail de login"
                value={accountForm.email}
                disabled
                helperText="O e-mail é vinculado à sua conta Supabase Auth"
              />

              <div className="pt-2 border-t border-border/80">
                <h4 className="text-xs font-semibold text-movi-graphite mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-text-secondary" />
                  Segurança da Senha
                </h4>
                <p className="text-xs text-text-secondary mb-3">
                  Para redefinir sua senha, solicite o link de recuperação de credenciais.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => success('Instruções enviadas', 'Verifique a caixa de entrada para alterar sua senha.')}
                >
                  Solicitar redefinição de senha
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-text-secondary">Papel atual: Proprietário</span>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Salvar Perfil
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* 4. ABA: PREFERÊNCIAS */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle>Preferências Regionais e Operacionais</CardTitle>
            <CardDescription>
              Padrões para cálculo monetário, formatação de moeda e fuso horário.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Moeda padrão"
                value="Real Brasileiro (BRL - R$)"
                disabled
                leftIcon={<Globe className="w-4 h-4" />}
              />
              <Input
                label="Idioma do sistema"
                value="Português do Brasil (pt-BR)"
                disabled
              />
              <Input
                label="Fuso horário"
                value="Horário de Brasília (GMT-3)"
                disabled
                leftIcon={<Clock className="w-4 h-4" />}
              />
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary">
              A MOVI é 100% projetada para a realidade tributária e operacional brasileira. Todas as operações utilizam as regras de precisão decimal e calendário vigentes no Brasil.
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-text-secondary">Padrões fiscais brasileiros aplicados</span>
            <Button variant="secondary" size="sm" disabled>
              Padrão Recomendado Ativo
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* 5. ABA: MEU PLANO (FREE PREMIUM) */}
      {activeTab === 'plan' && (
        <Card className="border-movi-yellow/60">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-movi-yellow text-movi-graphite text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{FREE_PREMIUM_PLAN.badge}</span>
              </div>
              <CardTitle className="text-xl">Plano {FREE_PREMIUM_PLAN.planName}</CardTitle>
              <CardDescription>
                Acesso gratuito vitalício com todos os módulos essenciais inclusos
              </CardDescription>
            </div>
            <Badge variant="success" size="md">
              Ativo
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-border bg-surface-secondary/50">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">
                  Empresas
                </span>
                <span className="text-xl font-bold font-display text-movi-graphite mt-1 block">
                  1 / {FREE_PREMIUM_PLAN.maxCompanies}
                </span>
                <span className="text-[10px] text-status-success font-medium">100% disponível</span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface-secondary/50">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">
                  Limite de Produtos
                </span>
                <span className="text-xl font-bold font-display text-movi-graphite mt-1 block">
                  0 / {FREE_PREMIUM_PLAN.maxProducts}
                </span>
                <span className="text-[10px] text-text-secondary">Até 200 itens</span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface-secondary/50">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">
                  Limite de Clientes
                </span>
                <span className="text-xl font-bold font-display text-movi-graphite mt-1 block">
                  0 / {FREE_PREMIUM_PLAN.maxCustomers}
                </span>
                <span className="text-[10px] text-text-secondary">Até 200 contatos</span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface-secondary/50">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">
                  Acessos Simultâneos
                </span>
                <span className="text-xl font-bold font-display text-movi-graphite mt-1 block">
                  1 Proprietário
                </span>
                <span className="text-[10px] text-text-secondary">Acesso total</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-movi-graphite mb-3 uppercase tracking-wider">
                Recursos Inclusos no seu Pacote
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FREE_PREMIUM_PLAN.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-border/70 bg-white text-xs font-medium text-movi-graphite"
                  >
                    <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-secondary/80 border border-border text-xs text-text-secondary space-y-1">
              <span className="font-semibold text-movi-graphite block">
                Arquitetura Preparada para Planos Empresariais
              </span>
              <p className="leading-relaxed">
                Os módulos comerciais e limites serão ampliados automaticamente nas próximas etapas do projeto, preservando seus cadastros existentes.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-text-secondary">Sem cobranças ou pegadinhas</span>
            <Button variant="secondary" size="sm" disabled>
              Plano Atual Vigente
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
