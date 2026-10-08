import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { ordersService } from '@/services/ordersService';
import type { Order, OrderStatus } from '@/types/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  CheckCircle2,
  Truck,
  Package,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  User,
  Sparkles,
} from 'lucide-react';

const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'Novo', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmado', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  preparing: { label: 'Em Preparação', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ready: { label: 'Pronto', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  delivered: { label: 'Entregue', color: 'text-neutral-700', bg: 'bg-neutral-100 border-neutral-300' },
  canceled: { label: 'Cancelado', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export const OrdersPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || 'default_company';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersService.list(companyId, selectedStatus);
      setOrders(data);
    } catch (e) {
      console.error('Erro ao carregar pedidos:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await ordersService.updateStatus(companyId, orderId, nextStatus);
      loadOrders();
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Poppins'] text-[#111111] tracking-tight">
            Gestão de Pedidos
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-['Inter']">
            Acompanhe solicitações comerciais, etapas de separação e fluxo de entrega aos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            className="p-2 border-neutral-200 text-neutral-600"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. Filtros de Status em Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {[
          { id: 'all', label: 'Todos os Pedidos' },
          { id: 'new', label: 'Novos' },
          { id: 'confirmed', label: 'Confirmados' },
          { id: 'preparing', label: 'Em Preparação' },
          { id: 'ready', label: 'Prontos' },
          { id: 'delivered', label: 'Entregues' },
          { id: 'canceled', label: 'Cancelados' },
        ].map((tab) => {
          const isSelected = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'bg-white border border-border text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Listagem de Pedidos ou Estado Vazio Real */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-neutral-300 bg-neutral-50/50 rounded-2xl">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100/60 flex items-center justify-center text-amber-700">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 font-['Poppins']">
              Nenhum pedido pendente de entrega
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-['Inter']">
              Vendas concluídas diretamente no caixa (PDV) são registradas em Vendas. Novas encomendas e pedidos pelo catálogo comercial aparecerão organizados aqui.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((ord) => {
            const statusConfig = ORDER_STATUS_LABELS[ord.status] || ORDER_STATUS_LABELS.new;

            return (
              <Card
                key={ord.id}
                className="p-4 border-border hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {ord.order_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-xs">
                    {ord.customer && (
                      <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{ord.customer.name}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-neutral-400">
                      Origem: <strong className="text-neutral-600 capitalize">{ord.source}</strong> &bull;{' '}
                      {new Date(ord.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Total</span>
                    <span className="text-base font-bold text-[#111111] font-mono">
                      {formatCurrency(ord.total_amount)}
                    </span>
                  </div>

                  {/* Avanço de Status */}
                  {ord.status === 'new' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ord.id, 'confirmed')}
                      className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs py-1"
                    >
                      Confirmar
                    </Button>
                  )}
                  {ord.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                      className="bg-amber-600 text-white hover:bg-amber-700 text-xs py-1"
                    >
                      Iniciar Preparo
                    </Button>
                  )}
                  {ord.status === 'preparing' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ord.id, 'ready')}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs py-1"
                    >
                      Marcar Pronto
                    </Button>
                  )}
                  {ord.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                      className="bg-[#111111] text-white hover:bg-neutral-800 text-xs py-1"
                    >
                      Marcar Entregue
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
