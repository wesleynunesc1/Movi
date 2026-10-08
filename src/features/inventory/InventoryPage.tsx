import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  DollarSign,
  Search,
  Filter,
  PlusCircle,
  MinusCircle,
  Scale,
  History,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Package,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { productsService } from '@/services/productsService';
import { inventoryService } from '@/services/inventoryService';
import type { Product, ProductVariant } from '@/types/products';
import type { InventoryMovement, InventorySummary } from '@/types/inventory';
import { StockMovementModal } from './StockMovementModal';

interface InventoryRowItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  name: string;
  variantName: string | null;
  sku: string;
  quantityOnHand: number;
  minimumQuantity: number;
  unit: string;
  trackInventory: boolean;
  costPrice: number;
  status: 'normal' | 'low_stock' | 'out_of_stock' | 'untracked';
}

export const InventoryPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || 'default_company';

  // Abas: "items" (Posição de Estoque) ou "history" (Histórico)
  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items');

  // Estados de dados
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<InventorySummary>({
    totalActiveProducts: 0,
    totalUnitsInStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalCostValue: 0,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  // Filtros de busca na lista de estoque
  const [search, setSearch] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'normal'>('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Modal de Movimentação
  const [movementModalState, setMovementModalState] = useState<{
    isOpen: boolean;
    product: Product | null;
    variant: ProductVariant | null;
    mode: 'entry' | 'exit' | 'adjustment';
  }>({
    isOpen: false,
    product: null,
    variant: null,
    mode: 'entry',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Carregar dados gerais
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, prodRes, movs] = await Promise.all([
        inventoryService.getSummary(companyId),
        productsService.list(companyId, { limit: 200 }),
        inventoryService.listMovements(companyId),
      ]);
      setSummary(sum);
      setProducts(prodRes.products);
      setMovements(movs);
    } catch (e) {
      console.error('Erro ao carregar dados de estoque:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Transformar produtos e suas variantes em linhas de estoque
  const inventoryRows = useMemo(() => {
    const rows: InventoryRowItem[] = [];

    products.forEach((p) => {
      if (p.has_variants && p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          const qty = Number(v.quantity_on_hand) || 0;
          const min = Number(v.minimum_quantity) || 0;
          let status: InventoryRowItem['status'] = 'normal';
          if (!p.track_inventory) status = 'untracked';
          else if (qty <= 0) status = 'out_of_stock';
          else if (qty <= min) status = 'low_stock';

          rows.push({
            id: `${p.id}_${v.id}`,
            product: p,
            variant: v,
            name: p.name,
            variantName: v.combination_key,
            sku: v.sku || p.sku,
            quantityOnHand: qty,
            minimumQuantity: min,
            unit: p.unit,
            trackInventory: p.track_inventory,
            costPrice: Number(v.cost_price_override ?? p.cost_price) || 0,
            status,
          });
        });
      } else {
        const qty = Number(p.quantity_on_hand) || 0;
        const min = Number(p.minimum_quantity) || 0;
        let status: InventoryRowItem['status'] = 'normal';
        if (!p.track_inventory) status = 'untracked';
        else if (qty <= 0) status = 'out_of_stock';
        else if (qty <= min) status = 'low_stock';

        rows.push({
          id: p.id,
          product: p,
          variant: undefined,
          name: p.name,
          variantName: null,
          sku: p.sku,
          quantityOnHand: qty,
          minimumQuantity: min,
          unit: p.unit,
          trackInventory: p.track_inventory,
          costPrice: Number(p.cost_price) || 0,
          status,
        });
      }
    });

    return rows;
  }, [products]);

  // Filtragem das linhas de estoque
  const filteredRows = useMemo(() => {
    return inventoryRows.filter((row) => {
      if (search) {
        const s = search.toLowerCase();
        const matchesName = row.name.toLowerCase().includes(s);
        const matchesSku = row.sku.toLowerCase().includes(s);
        const matchesVar = row.variantName?.toLowerCase().includes(s);
        if (!matchesName && !matchesSku && !matchesVar) return false;
      }

      if (stockStatusFilter !== 'all' && row.status !== stockStatusFilter) {
        return false;
      }

      return true;
    });
  }, [inventoryRows, search, stockStatusFilter]);

  // Filtragem do histórico de movimentações
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (movementTypeFilter !== 'all' && m.movement_type !== movementTypeFilter) {
        return false;
      }
      return true;
    });
  }, [movements, movementTypeFilter]);

  const handleOpenMovementModal = (
    product: Product,
    variant: ProductVariant | null,
    mode: 'entry' | 'exit' | 'adjustment'
  ) => {
    setMovementModalState({
      isOpen: true,
      product,
      variant,
      mode,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notificação */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium bg-[#111111] text-white border-emerald-500/30 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-[#FFD600] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 7.1 Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E7E7E7]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Poppins'] text-[#111111] tracking-tight">
            Estoque
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-['Inter']">
            Acompanhe suas quantidades, movimentações e produtos que precisam de atenção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador de Abas */}
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'items'
                  ? 'bg-white text-[#111111] shadow-sm'
                  : 'text-neutral-600 hover:text-[#111111]'
              }`}
            >
              Posição Atual
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-[#111111] shadow-sm'
                  : 'text-neutral-600 hover:text-[#111111]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Histórico ({movements.length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="p-2 border-neutral-200 hover:bg-neutral-100 text-neutral-600"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 7.1 Indicadores no Topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unidades Disponíveis */}
        <Card className="p-4 border-[#E7E7E7] hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Unidades disponíveis</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-[#111111]">
              {loading ? '-' : summary.totalUnitsInStock}
            </span>
            <span className="text-xs text-neutral-400">em estoque</span>
          </div>
        </Card>

        {/* Estoque Baixo */}
        <Card
          className="p-4 border-[#E7E7E7] hover:border-amber-300 transition-colors cursor-pointer"
          onClick={() => {
            setActiveTab('items');
            setStockStatusFilter(stockStatusFilter === 'low_stock' ? 'all' : 'low_stock');
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Estoque baixo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-amber-600">
              {loading ? '-' : summary.lowStockCount}
            </span>
            <span className="text-xs text-neutral-400">abaixo do mínimo</span>
          </div>
        </Card>

        {/* Sem Estoque */}
        <Card
          className="p-4 border-[#E7E7E7] hover:border-rose-300 transition-colors cursor-pointer"
          onClick={() => {
            setActiveTab('items');
            setStockStatusFilter(stockStatusFilter === 'out_of_stock' ? 'all' : 'out_of_stock');
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Sem estoque</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-rose-600">
              {loading ? '-' : summary.outOfStockCount}
            </span>
            <span className="text-xs text-neutral-400">zerados</span>
          </div>
        </Card>

        {/* Valor estimado a custo */}
        <Card className="p-4 border-[#E7E7E7] hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Valor em estoque (Custo)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-['Poppins'] text-[#111111]">
              {loading ? '-' : formatCurrency(summary.totalCostValue)}
            </span>
          </div>
        </Card>
      </div>

      {/* Conteúdo Aba 1: Posição de Estoque */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Barra de Busca e Filtro de Situação */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E7E7E7]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto por nome, variante ou SKU..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600] text-neutral-700"
              >
                <option value="all">Todas as Situações</option>
                <option value="normal">Estoque Normal</option>
                <option value="low_stock">Estoque Baixo</option>
                <option value="out_of_stock">Sem Estoque</option>
              </select>
            </div>
          </div>

          {/* Tabela de Estoque */}
          <div className="bg-white rounded-xl border border-[#E7E7E7] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E7E7] bg-neutral-50/80 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Produto</th>
                    <th className="py-3.5 px-4">Variante</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4 text-center">Estoque Atual</th>
                    <th className="py-3.5 px-4 text-center">Mínimo</th>
                    <th className="py-3.5 px-4 text-center">Situação</th>
                    <th className="py-3.5 px-4 text-right">Movimentar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E7E7] text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                        Carregando itens de estoque...
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-neutral-500">
                        Nenhum item encontrado no estoque com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      let badge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Normal
                        </span>
                      );

                      if (!row.trackInventory) {
                        badge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
                            Sem controle
                          </span>
                        );
                      } else if (row.status === 'out_of_stock') {
                        badge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Sem estoque
                          </span>
                        );
                      } else if (row.status === 'low_stock') {
                        badge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Estoque baixo
                          </span>
                        );
                      }

                      return (
                        <tr key={row.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#111111]">
                            {row.name}
                          </td>
                          <td className="py-3 px-4">
                            {row.variantName ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                {row.variantName}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-neutral-600">
                            {row.sku || '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-[#111111]">
                            {row.trackInventory ? `${row.quantityOnHand} ${row.unit}` : '∞'}
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-neutral-500 font-mono">
                            {row.trackInventory ? `${row.minimumQuantity} ${row.unit}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">{badge}</td>

                          {/* Ações de movimentação rápida */}
                          <td className="py-3 px-4 text-right">
                            {row.trackInventory ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenMovementModal(row.product, row.variant || null, 'entry')}
                                  title="Adicionar estoque (Entrada)"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenMovementModal(row.product, row.variant || null, 'exit')}
                                  title="Retirar estoque (Saída)"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                                >
                                  <MinusCircle className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenMovementModal(row.product, row.variant || null, 'adjustment')}
                                  title="Ajustar estoque (Contagem)"
                                  className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
                                >
                                  <Scale className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">Desativado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 2: Histórico de Movimentações (8. HISTÓRICO DE MOVIMENTAÇÕES) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filtros de Histórico */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#E7E7E7]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">Filtrar por tipo:</span>
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600]"
              >
                <option value="all">Todos os Tipos</option>
                <option value="entry">Entradas (Compras/Reposição)</option>
                <option value="exit">Saídas (Perdas/Avarias)</option>
                <option value="adjustment">Ajustes de Contagem</option>
                <option value="initial">Estoque Inicial</option>
              </select>
            </div>

            <span className="text-xs text-neutral-400">
              Mostrando {filteredMovements.length} registro(s) de auditoria imutável
            </span>
          </div>

          {/* Tabela de Histórico */}
          <div className="bg-white rounded-xl border border-[#E7E7E7] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E7E7] bg-neutral-50/80 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Data & Horário</th>
                    <th className="py-3.5 px-4">Produto</th>
                    <th className="py-3.5 px-4 text-center">Tipo</th>
                    <th className="py-3.5 px-4 text-center">Movimentado</th>
                    <th className="py-3.5 px-4 text-center">Saldo</th>
                    <th className="py-3.5 px-4">Motivo / Obs</th>
                    <th className="py-3.5 px-4 text-right">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E7E7] text-sm font-['Inter']">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        Carregando histórico...
                      </td>
                    </tr>
                  ) : filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-neutral-500">
                        Nenhuma movimentação registrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const isPositive = mov.quantity_delta > 0;
                      const isNegative = mov.quantity_delta < 0;

                      let typeBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                          {mov.movement_type}
                        </span>
                      );

                      if (mov.movement_type === 'entry' || mov.movement_type === 'initial') {
                        typeBadge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownRight className="w-3 h-3" />
                            Entrada
                          </span>
                        );
                      } else if (mov.movement_type === 'exit' || mov.movement_type === 'sale') {
                        typeBadge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowUpRight className="w-3 h-3" />
                            Saída
                          </span>
                        );
                      } else if (mov.movement_type === 'adjustment') {
                        typeBadge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Scale className="w-3 h-3" />
                            Ajuste
                          </span>
                        );
                      }

                      const dateFormatted = new Date(mov.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={mov.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-4 text-xs text-neutral-600 whitespace-nowrap">
                            {dateFormatted}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#111111]">
                            {mov.product_name || 'Produto'}
                          </td>
                          <td className="py-3 px-4 text-center">{typeBadge}</td>
                          <td className="py-3 px-4 text-center font-bold font-mono">
                            <span
                              className={
                                isPositive
                                  ? 'text-emerald-600'
                                  : isNegative
                                  ? 'text-rose-600'
                                  : 'text-neutral-500'
                              }
                            >
                              {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-xs font-mono text-neutral-600">
                            {mov.quantity_before} →{' '}
                            <strong className="text-[#111111]">{mov.quantity_after}</strong>
                          </td>
                          <td className="py-3 px-4 text-xs text-neutral-700">
                            <div className="font-medium text-[#111111]">{mov.reason}</div>
                            {mov.notes && (
                              <div className="text-neutral-400 italic mt-0.5">{mov.notes}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-neutral-500 whitespace-nowrap">
                            {mov.performed_by || 'Admin'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Movimentação */}
      <StockMovementModal
        isOpen={movementModalState.isOpen}
        onClose={() =>
          setMovementModalState((prev) => ({
            ...prev,
            isOpen: false,
            product: null,
            variant: null,
          }))
        }
        onSuccess={() => {
          showToast('Movimentação registrada com sucesso!');
          loadData();
        }}
        product={movementModalState.product}
        variant={movementModalState.variant}
        mode={movementModalState.mode}
      />
    </div>
  );
};
