import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { salesService, type SalesListResponse } from '@/services/salesService';
import type { Sale, SaleStatus, PaymentMethod } from '@/types/sales';
import { SaleDetailsModal } from './SaleDetailsModal';
import { ReceiptModal } from '@/features/pos/ReceiptModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  PlusCircle,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

export const SalesPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || 'default_company';

  // Estados de listagem e KPIs
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesListResponse>({
    sales: [],
    total: 0,
    summary: {
      todaySalesCount: 0,
      todaySalesTotal: 0,
      monthSalesTotal: 0,
      averageTicket: 0,
      completedCount: 0,
    },
  });

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modais de detalhes e recibo
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesService.list(companyId, {
        search,
        status: statusFilter,
        paymentMethod: paymentFilter,
        page: currentPage,
        limit: itemsPerPage,
      });
      setSalesData(res);
    } catch (e) {
      console.error('Erro ao carregar vendas:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId, search, statusFilter, paymentFilter, currentPage]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleOpenDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailsOpen(true);
  };

  const handleOpenReceipt = (sale: Sale) => {
    setReceiptSale(sale);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Poppins'] text-[#111111] tracking-tight">
            Vendas Realizadas
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-['Inter']">
            Acompanhe o faturamento, histórico comercial e emissão de comprovantes da sua empresa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/app/pos">
            <Button className="bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] font-bold text-sm border-none shadow-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>Nova Venda (PDV)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Quatro Indicadores Comerciais Reais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas de Hoje */}
        <Card className="p-4 border-border hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Vendas de hoje</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-['Poppins'] text-[#111111]">
              {formatCurrency(salesData.summary.todaySalesTotal)}
            </span>
            <span className="text-xs text-neutral-400">
              ({salesData.summary.todaySalesCount})
            </span>
          </div>
        </Card>

        {/* Faturamento do Mês */}
        <Card className="p-4 border-border hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Faturamento do mês</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-['Poppins'] text-[#111111]">
              {formatCurrency(salesData.summary.monthSalesTotal)}
            </span>
          </div>
        </Card>

        {/* Ticket Médio */}
        <Card className="p-4 border-border hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-['Poppins'] text-[#111111]">
              {formatCurrency(salesData.summary.averageTicket)}
            </span>
          </div>
        </Card>

        {/* Vendas Concluídas */}
        <Card className="p-4 border-border hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Vendas Concluídas</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-[#111111]">
              {salesData.summary.completedCount}
            </span>
            <span className="text-xs text-neutral-400">transações</span>
          </div>
        </Card>
      </div>

      {/* 3. Barra de Busca e Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por número da venda (ex: VD-0001) ou cliente..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none text-neutral-700"
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Concluídas</option>
            <option value="canceled">Canceladas</option>
          </select>

          {/* Filtro por Pagamento */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none text-neutral-700"
          >
            <option value="all">Todas as Formas</option>
            <option value="money">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="debit_card">Cartão de Débito</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadSales}
            className="p-2 border-neutral-200 text-neutral-600"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 4. Tabela de Vendas */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-neutral-50/80 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Número</th>
                <th className="py-3.5 px-4">Data & Hora</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4 text-center">Itens</th>
                <th className="py-3.5 px-4">Pagamento</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                    Carregando histórico de vendas...
                  </td>
                </tr>
              ) : salesData.sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    Nenhuma venda registrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                salesData.sales.map((sale) => {
                  const itemsCount = sale.items?.length || 1;
                  const primaryPayment = sale.payments?.[0];
                  const paymentLabel =
                    primaryPayment?.method === 'money'
                      ? 'Dinheiro'
                      : primaryPayment?.method === 'pix'
                      ? 'Pix'
                      : primaryPayment?.method === 'credit_card'
                      ? 'Crédito'
                      : primaryPayment?.method === 'debit_card'
                      ? 'Débito'
                      : 'Misto';

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-neutral-50/70 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetails(sale)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        {sale.sale_number}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-600 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-700">
                        {sale.customer ? (
                          <span className="font-medium">{sale.customer.name}</span>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">Não informado</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-neutral-600">
                        {itemsCount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
                          {paymentLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#111111] font-mono">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            sale.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {sale.status === 'completed' ? 'Concluída' : 'Cancelada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(sale)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(sale)}
                            className="p-1.5 text-neutral-500 hover:text-[#111111] hover:bg-neutral-100 rounded-lg transition"
                            title="Comprovante"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border gap-3 text-xs text-neutral-500">
          <span>
            Mostrando{' '}
            <strong className="text-neutral-700">
              {salesData.sales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </strong>{' '}
            a{' '}
            <strong className="text-neutral-700">
              {Math.min(currentPage * itemsPerPage, salesData.total)}
            </strong>{' '}
            de <strong className="text-neutral-700">{salesData.total}</strong> vendas
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Anterior
            </Button>
            <span className="px-2 font-medium text-neutral-700">
              Página {currentPage} de {Math.ceil(salesData.total / itemsPerPage) || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= Math.ceil(salesData.total / itemsPerPage)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2.5 py-1 text-xs"
            >
              Próxima
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Venda */}
      <SaleDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        companyId={companyId}
        onSaleCancelled={() => {
          loadSales();
        }}
        onOpenReceipt={(s) => {
          setIsDetailsOpen(false);
          handleOpenReceipt(s);
        }}
      />

      {/* Modal de Comprovante Não-Fiscal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setReceiptSale(null);
        }}
        sale={receiptSale}
        companyName={currentCompany?.name || 'MOVI'}
      />
    </div>
  );
};
