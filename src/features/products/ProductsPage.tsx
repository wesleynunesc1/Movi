import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  UploadCloud,
  Search,
  MoreVertical,
  Edit2,
  Copy,
  Archive,
  Power,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Boxes,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { productsService, type ProductsResponse } from '@/services/productsService';
import { categoriesService } from '@/services/categoriesService';
import type { Product, ProductCategory } from '@/types/products';
import { ProductFormModal } from './ProductFormModal';
import { ProductCsvImportModal } from './ProductCsvImportModal';

export const ProductsPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || 'default_company';

  // Estados principais
  const [loading, setLoading] = useState<boolean>(true);
  const [productsData, setProductsData] = useState<ProductsResponse>({
    products: [],
    total: 0,
    totalActive: 0,
    totalUnitsInStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Filtros e busca
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'normal' | 'low_stock' | 'out_of_stock'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Seleção em massa
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');

  // Modais de Produto e CSV
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Ações de linha aberta (dropdown menu)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      const cats = await categoriesService.list(companyId);
      setCategories(cats);
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
    }
  }, [companyId]);

  // Carregar produtos
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsService.list(companyId, {
        search: debouncedSearch,
        categoryId: selectedCategory || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        stockStatus: stockFilter === 'all' ? undefined : stockFilter,
        page: currentPage,
        limit: itemsPerPage,
      });
      setProductsData(res);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Falha ao carregar lista de produtos.',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, debouncedSearch, selectedCategory, statusFilter, stockFilter, currentPage]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handlers de Ações
  const handleCreateProduct = () => {
    if (productsData.total >= 200) {
      showToast('error', 'Limite do plano Free atingido (200 produtos).');
      return;
    }
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      await productsService.duplicate(product.id, companyId);
      showToast('success', `Produto "${product.name}" duplicado com sucesso!`);
      loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao duplicar produto.');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await productsService.toggleActive(product.id, companyId, !product.is_active);
      showToast('success', `Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao alterar situação.');
    }
  };

  const handleArchive = async (product: Product) => {
    if (!window.confirm(`Deseja realmente arquivar o produto "${product.name}"?`)) return;
    try {
      await productsService.archive(product.id, companyId);
      showToast('success', 'Produto arquivado com sucesso.');
      loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao arquivar produto.');
    }
  };

  // Ações em massa
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(productsData.products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (!selectedIds.length) return;
    try {
      await productsService.bulkUpdateStatus(companyId, selectedIds, isActive);
      showToast('success', `${selectedIds.length} produto(s) ${isActive ? 'ativados' : 'desativados'}.`);
      setSelectedIds([]);
      loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao atualizar situação em lote.');
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Deseja realmente arquivar os ${selectedIds.length} produtos selecionados?`)) return;
    try {
      await productsService.bulkArchive(companyId, selectedIds);
      showToast('success', `${selectedIds.length} produto(s) arquivados.`);
      setSelectedIds([]);
      loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao arquivar produtos em massa.');
    }
  };

  const handleApplyBulkCategory = async () => {
    if (!selectedIds.length || !bulkCategoryId) return;
    try {
      await productsService.bulkUpdateCategory(companyId, selectedIds, bulkCategoryId);
      showToast('success', `Categoria atualizada para ${selectedIds.length} produtos.`);
      setSelectedIds([]);
      setBulkCategoryModalOpen(false);
      setBulkCategoryId('');
      loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao atualizar categoria.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Estado Vazio
  const isZeroProducts = !loading && productsData.total === 0 && !debouncedSearch && !selectedCategory && statusFilter === 'all' && stockFilter === 'all';

  return (
    <div className="space-y-6">
      {/* Toast Notificação */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in fade-in slide-in-from-bottom-3 ${
            notification.type === 'success'
              ? 'bg-[#111111] text-white border-emerald-500/30'
              : 'bg-rose-950 text-white border-rose-600/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#FFD600] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 3.1 Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E7E7E7]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold font-['Poppins'] text-[#111111] tracking-tight">
              Produtos
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 border border-[#E7E7E7] text-neutral-600 font-medium">
              Plano Free: {productsData.total} de 200
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1 font-['Inter']">
            Organize, cadastre e gerencie os produtos do seu negócio.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 text-sm font-medium border-[#E7E7E7] hover:bg-neutral-50"
          >
            <UploadCloud className="w-4 h-4 text-neutral-600" />
            <span>Importar produtos</span>
          </Button>

          <Button
            onClick={handleCreateProduct}
            className="flex items-center gap-2 text-sm font-semibold bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] border-none shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo produto</span>
          </Button>
        </div>
      </div>

      {/* 3.2 Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ativos */}
        <Card className="p-4 border-[#E7E7E7] hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Produtos ativos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-[#111111]">
              {loading ? '-' : productsData.totalActive}
            </span>
            <span className="text-xs text-neutral-400">cadastrados</span>
          </div>
        </Card>

        {/* Unidades em estoque */}
        <Card className="p-4 border-[#E7E7E7] hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Unidades em estoque</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-[#111111]">
              {loading ? '-' : productsData.totalUnitsInStock}
            </span>
            <span className="text-xs text-neutral-400">itens físicos</span>
          </div>
        </Card>

        {/* Estoque baixo */}
        <Card className="p-4 border-[#E7E7E7] hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Estoque baixo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-amber-600">
              {loading ? '-' : productsData.lowStockCount}
            </span>
            <span className="text-xs text-neutral-400">precisam reposição</span>
          </div>
        </Card>

        {/* Sem estoque */}
        <Card className="p-4 border-[#E7E7E7] hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Sem estoque</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-['Poppins'] text-rose-600">
              {loading ? '-' : productsData.outOfStockCount}
            </span>
            <span className="text-xs text-neutral-400">zerados</span>
          </div>
        </Card>
      </div>

      {/* 3.4 Estado Vazio quando não há nenhum produto cadastrado na empresa */}
      {isZeroProducts ? (
        <Card className="p-12 text-center border-dashed border-2 border-neutral-300 bg-neutral-50/50 rounded-2xl">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFD600]/20 flex items-center justify-center text-[#111111]">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-['Poppins'] text-[#111111]">
              Seu catálogo começa aqui.
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-['Inter']">
              Cadastre seu primeiro produto para começar a organizar suas vendas e seu estoque.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleCreateProduct}
                className="w-full sm:w-auto bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] font-semibold border-none"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Cadastrar primeiro produto
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="w-full sm:w-auto border-[#E7E7E7]"
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Importar por CSV
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* 3.3 Lista e Tabela de Produtos */
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E7E7E7]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, SKU ou código de barras..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600] text-neutral-700"
              >
                <option value="">Todas as Categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Filtro Situação */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600] text-neutral-700"
              >
                <option value="all">Todas as Situações</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>

              {/* Filtro Estoque */}
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600] text-neutral-700"
              >
                <option value="all">Todo o Estoque</option>
                <option value="normal">Estoque Normal</option>
                <option value="low_stock">Estoque Baixo</option>
                <option value="out_of_stock">Sem Estoque</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadProducts}
                className="p-2 border-neutral-200 hover:bg-neutral-100 text-neutral-600"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Barra de Ações em Massa (quando há itens selecionados) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-[#111111] text-white px-4 py-2.5 rounded-xl shadow-md text-sm animate-in fade-in">
              <span className="font-medium text-xs md:text-sm text-neutral-200">
                <span className="text-[#FFD600] font-bold">{selectedIds.length}</span> produto(s) selecionado(s)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatus(true)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Ativar
                </button>
                <button
                  onClick={() => handleBulkStatus(false)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Desativar
                </button>
                <button
                  onClick={() => setBulkCategoryModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Alterar Categoria
                </button>
                <button
                  onClick={handleBulkArchive}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition"
                >
                  Arquivar
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-neutral-400 hover:text-white ml-2 underline"
                >
                  Desmarcar
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Produtos */}
          <div className="bg-white rounded-xl border border-[#E7E7E7] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E7E7] bg-neutral-50/80 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          productsData.products.length > 0 &&
                          selectedIds.length === productsData.products.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-neutral-300 text-[#111111] focus:ring-[#FFD600]"
                      />
                    </th>
                    <th className="py-3.5 px-4">Produto</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4 text-right">Preço de venda</th>
                    <th className="py-3.5 px-4 text-center">Estoque</th>
                    <th className="py-3.5 px-4 text-center">Situação</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E7E7] text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
                        Carregando produtos...
                      </td>
                    </tr>
                  ) : productsData.products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-neutral-500">
                        Nenhum produto encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    productsData.products.map((product) => {
                      const primaryImg = product.images?.find((img) => img.is_primary) || product.images?.[0];
                      const isSelected = selectedIds.includes(product.id);
                      const stockQty = Number(product.quantity_on_hand) || 0;
                      const minQty = Number(product.minimum_quantity) || 0;

                      let stockBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {stockQty} {product.unit}
                        </span>
                      );

                      if (!product.track_inventory) {
                        stockBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
                            Sem controle
                          </span>
                        );
                      } else if (stockQty <= 0) {
                        stockBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Zerado (0)
                          </span>
                        );
                      } else if (stockQty <= minQty) {
                        stockBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Baixo ({stockQty})
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-neutral-50/70 transition-colors ${
                            isSelected ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(product.id)}
                              className="rounded border-neutral-300 text-[#111111] focus:ring-[#FFD600]"
                            />
                          </td>

                          {/* Imagem e Nome */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                                {primaryImg?.storage_path ? (
                                  <img
                                    src={primaryImg.storage_path}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-neutral-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(product)}
                                  className="text-left font-semibold text-[#111111] hover:underline truncate block"
                                >
                                  {product.name}
                                </button>
                                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                                  {product.brand && <span>{product.brand} •</span>}
                                  {product.has_variants ? (
                                    <span className="text-amber-600 font-medium bg-amber-50 px-1 rounded">
                                      Com variações
                                    </span>
                                  ) : (
                                    <span>Simples</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3 px-4 text-neutral-600 font-mono text-xs">
                            {product.sku || '-'}
                          </td>

                          {/* Categoria */}
                          <td className="py-3 px-4">
                            {product.category?.name ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
                                {product.category.name}
                              </span>
                            ) : (
                              <span className="text-neutral-400 text-xs">Sem categoria</span>
                            )}
                          </td>

                          {/* Preço de venda */}
                          <td className="py-3 px-4 text-right font-semibold text-[#111111]">
                            {formatCurrency(product.sale_price)}
                          </td>

                          {/* Estoque */}
                          <td className="py-3 px-4 text-center">
                            {stockBadge}
                          </td>

                          {/* Situação */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(product)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition cursor-pointer ${
                                product.is_active
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  product.is_active ? 'bg-emerald-500' : 'bg-neutral-400'
                                }`}
                              />
                              {product.is_active ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-4 text-right relative">
                            <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(activeMenuId === product.id ? null : product.id)}
                                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMenuId === product.id && (
                                <div className="absolute right-4 mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#E7E7E7] py-1.5 z-30 divide-y divide-neutral-100 text-left animate-in fade-in">
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleEditProduct(product);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                                      Editar produto
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleDuplicateProduct(product);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-neutral-500" />
                                      Duplicar produto
                                    </button>
                                  </div>

                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleToggleActive(product);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                                    >
                                      <Power className="w-3.5 h-3.5 text-neutral-500" />
                                      {product.is_active ? 'Desativar' : 'Ativar'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleArchive(product);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-rose-500" />
                                      Arquivar
                                    </button>
                                  </div>
                                </div>
                              )}
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
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-[#E7E7E7] gap-3 text-xs text-neutral-500">
              <span>
                Mostrando{' '}
                <strong className="text-neutral-700">
                  {productsData.products.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </strong>{' '}
                a{' '}
                <strong className="text-neutral-700">
                  {Math.min(currentPage * itemsPerPage, productsData.total)}
                </strong>{' '}
                de <strong className="text-neutral-700">{productsData.total}</strong> produtos
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 text-xs border-neutral-200"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Anterior
                </Button>
                <span className="px-2 font-medium text-neutral-700">
                  Página {currentPage} de {Math.ceil(productsData.total / itemsPerPage) || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= Math.ceil(productsData.total / itemsPerPage)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2.5 py-1 text-xs border-neutral-200"
                >
                  Próxima
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Produto */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        companyId={companyId}
        productToEdit={editingProduct}
        onSaved={() => {
          showToast(
            'success',
            editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!'
          );
          loadProducts();
          loadCategories();
        }}
      />

      {/* Modal de Importação CSV */}
      <ProductCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        companyId={companyId}
        onImportComplete={() => {
          showToast('success', 'Importação concluída com sucesso!');
          loadProducts();
          loadCategories();
        }}
      />

      {/* Modal de Alteração de Categoria em Massa */}
      {bulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#111111] font-['Poppins']">
              Alterar Categoria em Massa
            </h3>
            <p className="text-xs text-neutral-500">
              Selecione a nova categoria para os {selectedIds.length} produtos selecionados:
            </p>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#FFD600]"
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkCategoryModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={!bulkCategoryId}
                onClick={handleApplyBulkCategory}
                className="bg-[#FFD600] text-[#111111] font-semibold hover:bg-[#e6c100]"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
