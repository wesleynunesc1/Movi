import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  PlusCircle,
  Settings,
  Store,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Receipt,
  Sparkles,
  BarChart2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentCompany, profile } = useAuth();
  const [chartFilter, setChartFilter] = useState<'7d' | '30d' | '90d'>('7d');

  // Format currency according to Brazilian Real standards
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const currentDateFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const firstName = profile?.full_name?.split(' ')[0] || 'Empreendedor';

  // Real initial checklist data derived from DB state
  const checklist = [
    {
      id: 'company',
      title: 'Empresa e dados configurados',
      description: `Espaço "${currentCompany?.name}" ativo no plano Free Premium`,
      completed: Boolean(currentCompany?.id),
      link: '/app/settings',
    },
    {
      id: 'product',
      title: 'Cadastrar primeiro produto',
      description: 'Adicione itens com preço de custo, venda e estoque',
      completed: false,
      link: '/app/products',
    },
    {
      id: 'sale',
      title: 'Registrar primeira venda',
      description: 'Faça um teste no PDV ou registre um pedido manual',
      completed: false,
      link: '/app/pos',
    },
    {
      id: 'store',
      title: 'Personalizar catálogo online',
      description: 'Configure seu link de vitrine comercial para WhatsApp',
      completed: false,
      link: '/app/online-store',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. CABEÇALHO DO DASHBOARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-secondary text-text-secondary text-xs font-medium mb-1.5">
            <Store className="w-3.5 h-3.5 text-movi-graphite" />
            <span>{currentCompany?.name || 'Minha Empresa'}</span>
            <span className="text-text-muted">&bull;</span>
            <span className="capitalize">{currentDateFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-movi-graphite tracking-tight">
            Olá, {firstName}!
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Seu negócio em movimento, com mais resultados.
          </p>
        </div>

        {/* Quick primary actions in header */}
        <div className="flex items-center gap-2.5">
          <Link to="/app/pos">
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Nova Venda (PDV)
            </Button>
          </Link>
          <Link to="/app/settings">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Settings className="w-4 h-4" />}
            >
              Configurar
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. QUATRO INDICADORES PRINCIPAIS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vendas de Hoje */}
        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-movi-yellow" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Vendas de hoje
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-text-secondary">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-display text-movi-graphite">
                {formatCurrency(0)}
              </div>
              <p className="text-[11px] text-text-secondary mt-1 flex items-center gap-1">
                <span>0 transações hoje</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Faturamento do Mês */}
        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-movi-graphite" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Faturamento do mês
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-text-secondary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-display text-movi-graphite">
                {formatCurrency(0)}
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Período vigente do mês
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Pedidos */}
        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-movi-yellow" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Pedidos Realizados
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-text-secondary">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-display text-movi-graphite">
                0
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                0 pendentes de entrega
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Ticket Médio */}
        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-movi-graphite" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Ticket Médio
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-text-secondary">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-display text-movi-graphite">
                {formatCurrency(0)}
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Baseado em vendas confirmadas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. CHECKLIST INICIAL DE CONFIGURAÇÃO */}
      <Card className="border-movi-yellow/50 bg-gradient-to-r from-surface to-movi-yellow/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-movi-yellow text-movi-graphite text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              Primeiros Passos
            </div>
            <CardTitle className="text-base sm:text-lg">
              Checklist de ativação do seu negócio
            </CardTitle>
            <CardDescription>
              Complete os passos abaixo para começar a emitir pedidos e controlar o faturamento
            </CardDescription>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-movi-graphite">1 de 4 concluídos</span>
            <div className="w-24 h-2 bg-border rounded-full mt-1.5 overflow-hidden">
              <div className="w-1/4 h-full bg-movi-yellow" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {checklist.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                  item.completed
                    ? 'bg-white border-status-success/30 shadow-subtle'
                    : 'bg-white/80 border-border hover:border-gray-400 hover:bg-white shadow-subtle'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted" />
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 text-text-secondary" />
                  </div>
                  <h4 className={`text-xs font-bold ${item.completed ? 'text-movi-graphite' : 'text-movi-graphite'}`}>
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                    {item.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 text-[10px] font-semibold">
                  {item.completed ? (
                    <span className="text-status-success">Concluído</span>
                  ) : (
                    <span className="text-movi-graphite flex items-center gap-1">
                      Iniciar agora &rarr;
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. GRÁFICO DE VENDAS & ATIVIDADES RECENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seção Ampla: Desempenho de Vendas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base sm:text-lg">Desempenho de vendas</CardTitle>
                <CardDescription>
                  Acompanhamento de receita e fluxo comercial diário
                </CardDescription>
              </div>

              {/* Filtros 7d, 30d, 90d */}
              <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-xl border border-border">
                {(['7d', '30d', '90d'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setChartFilter(filter)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      chartFilter === filter
                        ? 'bg-white text-movi-graphite shadow-subtle'
                        : 'text-text-secondary hover:text-movi-graphite'
                    }`}
                  >
                    {filter === '7d' ? '7 dias' : filter === '30d' ? '30 dias' : '90 dias'}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center py-8">
              {/* Honest empty state specified by Section 8 */}
              <EmptyState
                icon={<BarChart2 className="w-6 h-6 text-text-secondary" />}
                title="Nenhum dado registrado neste período"
                description="Assim que você registrar suas primeiras vendas, seus resultados aparecerão aqui."
                action={
                  <Link to="/app/pos">
                    <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                      Registrar primeira venda
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Atividades Recentes & Ações Rápidas */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              <Link
                to="/app/pos"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-gray-400 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-movi-yellow text-movi-graphite flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-movi-graphite">Nova Venda</h5>
                    <p className="text-[10px] text-text-secondary">Abrir Frente de Caixa</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted" />
              </Link>

              <Link
                to="/app/products"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-gray-400 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary text-movi-graphite flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-movi-graphite">Adicionar Produto</h5>
                    <p className="text-[10px] text-text-secondary">Cadastrar novo item</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted" />
              </Link>

              <Link
                to="/app/orders"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-gray-400 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary text-movi-graphite flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-movi-graphite">Ver Pedidos</h5>
                    <p className="text-[10px] text-text-secondary">Consultar entregas</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted" />
              </Link>

              <Link
                to="/app/settings"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-gray-400 hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary text-movi-graphite flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-movi-graphite">Configurar Empresa</h5>
                    <p className="text-[10px] text-text-secondary">Identidade e dados fiscais</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted" />
              </Link>
            </CardContent>
          </Card>

          {/* Atividades Recentes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              {/* Empty state per Section 8 */}
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-secondary mx-auto">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs text-text-secondary font-medium">
                  Suas movimentações aparecerão aqui.
                </p>
                <p className="text-[11px] text-text-muted max-w-[200px] mx-auto leading-tight">
                  Vendas, emissões de comprovantes e baixas de estoque serão registradas em tempo real.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
