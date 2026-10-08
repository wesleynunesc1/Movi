import React from 'react';
import { ModulePlaceholderPage } from '@/components/shared/ModulePlaceholderPage';
import {
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Users,
  CircleDollarSign,
  BarChart3,
  Globe,
  HelpCircle,
} from 'lucide-react';

export const POSPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Frente de Caixa (PDV)"
    category="Operações"
    plannedStage="Etapa 02"
    description="Interface de alta velocidade para vendas no balcão, leitor de código de barras, pagamentos instantâneos via PIX e emissão de comprovantes."
    plannedFeatures={[
      'Busca ultra-rápida de produtos por código de barras ou nome',
      'Cálculo automático de troco e descontos promocionais',
      'Múltiplas formas de pagamento em uma única venda',
      'Geração de QR Code PIX dinâmico na tela',
      'Impressão e envio de comprovante digital por WhatsApp',
    ]}
    icon={ShoppingCart}
  />
);

export const SalesPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Vendas Realizadas"
    category="Operações"
    plannedStage="Etapa 02"
    description="Histórico centralizado de vendas com filtros avançados por data, vendedor, forma de pagamento e status de cancelamento/estorno."
    plannedFeatures={[
      'Histórico completo com detalhamento item a item',
      'Filtros por período, forma de pagamento e cliente',
      'Exportação de extrato para contabilidade em CSV/PDF',
      'Reimpressão de comprovantes fiscais e não fiscais',
      'Cancelamento seguro com estorno de estoque auditado',
    ]}
    icon={Receipt}
  />
);

export const OrdersPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Pedidos e Entregas"
    category="Operações"
    plannedStage="Etapa 02"
    description="Gestão de pedidos recebidos pelo catálogo online, WhatsApp e balcão, com fluxo kanban de preparação e entrega."
    plannedFeatures={[
      'Quadro de pedidos: Recebido, Em Preparo, Pronto e Entregue',
      'Integração direta com pedidos recebidos da Loja Online',
      'Notificações em tempo real sobre novos pedidos',
      'Cálculo de taxa de entrega por região ou frete fixo',
      'Rastreamento simplificado para envio ao cliente',
    ]}
    icon={Package}
  />
);

export const ProductsPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Catálogo de Produtos"
    category="Gestão"
    plannedStage="Etapa 02"
    description="Cadastro completo de mercadorias com fotos, variações (tamanho/cor), código de barras (EAN), precificação e margem de lucro calculada."
    plannedFeatures={[
      'Cadastro de produtos com variações de cor e tamanho',
      'Cálculo automático de margem de lucro e markup',
      'Upload de fotos e galeria de produtos',
      'Categorias, marcas e etiquetas organizacionais',
      'Importação e exportação de catálogo via planilha',
    ]}
    icon={Package}
  />
);

export const InventoryPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Controle de Estoque"
    category="Gestão"
    plannedStage="Etapa 02"
    description="Controle rigoroso de entradas, saídas, perdas, inventário físico periódico e alerta de estoque mínimo para reposição."
    plannedFeatures={[
      'Controle de saldo em tempo real com baixa automática nas vendas',
      'Alertas inteligentes de produto próximo ao fim do estoque',
      'Registro de perdas, quebras, validade e devoluções',
      'Histórico de movimentações auditável por usuário',
      'Ajuste rápido de inventário por conferência física',
    ]}
    icon={Boxes}
  />
);

export const CustomersPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Base de Clientes"
    category="Gestão"
    plannedStage="Etapa 02"
    description="Agenda de clientes com histórico de compras, ticket médio individual, data de aniversário e canal direto de WhatsApp."
    plannedFeatures={[
      'Cadastro com WhatsApp, endereço e CPF/CNPJ',
      'Histórico de pedidos e produtos favoritos do cliente',
      'Identificação dos clientes que mais compram no mês',
      'Disparo de mensagens promocionais diretas para o WhatsApp',
      'Segmentação por data da última compra (fidelização)',
    ]}
    icon={Users}
  />
);

export const FinancePage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Gestão Financeira"
    category="Inteligência"
    plannedStage="Etapa 03"
    description="Contas a pagar e receber, fluxo de caixa diário, conciliação e demonstrativo de resultados do exercício (DRE simplificado)."
    plannedFeatures={[
      'Fluxo de caixa diário, semanal e mensal projetado',
      'Controle de contas a pagar com alerta de vencimento',
      'Contas a receber e vendas a prazo / fiado moderno',
      'Categorias de despesas fixas e variáveis',
      'Lucratividade líquida real após custos das mercadorias',
    ]}
    icon={CircleDollarSign}
  />
);

export const ReportsPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Relatórios Gerenciais"
    category="Inteligência"
    plannedStage="Etapa 03"
    description="Relatórios analíticos de produtos mais vendidos, horários de pico, faturamento comparativo e desempenho do comerciante."
    plannedFeatures={[
      'Curva ABC de produtos mais lucrativos',
      'Gráficos de horários e dias de maior movimento',
      'Comparativo de crescimento mês a mês',
      'Relatório de comissões por colaborador',
      'Exportação para relatórios fiscais e contábeis em PDF',
    ]}
    icon={BarChart3}
  />
);

export const OnlineStorePage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Minha Loja Online"
    category="Canais"
    plannedStage="Etapa 02"
    description="Vitrine virtual moderna para você divulgar seus produtos no Instagram e receber pedidos prontos diretamente no WhatsApp."
    plannedFeatures={[
      'Link exclusivo da sua loja: movi.com.br/sualoja',
      'Catálogo responsivo com fotos, descrições e preços',
      'Carrinho de compras que envia pedido formatado ao WhatsApp',
      'Definição de horário de funcionamento e cálculo de frete',
      'Aplicação da cor personalizada da sua marca',
    ]}
    icon={Globe}
  />
);

export const HelpPage: React.FC = () => (
  <ModulePlaceholderPage
    moduleName="Central de Ajuda e Suporte"
    category="Sistema"
    plannedStage="Disponível"
    description="Tutoriais, guias práticos de implantação do sistema comercial e suporte humanizado via WhatsApp para assinantes MOVI."
    plannedFeatures={[
      'Guia passo a passo de como cadastrar seus primeiros produtos',
      'Manual de boas práticas para controle de estoque e caixa',
      'Vídeos curtos de 1 minuto ensinando a operar o sistema',
      'Suporte prioritário via WhatsApp',
      'Comunidade de comerciantes e empreendedores MOVI',
    ]}
    icon={HelpCircle}
  />
);
