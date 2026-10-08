import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { productsService } from '@/services/productsService';
import { categoriesService } from '@/services/categoriesService';
import { customersService } from '@/services/customersService';
import type { Product, ProductCategory, ProductVariant } from '@/types/products';
import type { CartItem } from '@/types/pos';
import type { Customer, Sale } from '@/types/sales';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { QuickCustomerModal } from './QuickCustomerModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Tag,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  RotateCcw,
  Percent,
  Sparkles,
  X,
  CreditCard,
  Banknote,
} from 'lucide-react';

const LOCAL_CART_KEY = 'movi_pos_draft_cart';

export const POSPage: React.FC = () => {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || 'default_company';

  // Estados de catálogo e busca
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Estados do carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_CART_KEY}_${companyId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Desconto geral
  const [globalDiscountType, setGlobalDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Modais
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Modal para escolher variante de produto
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);

  // Mobile cart drawer
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Salvar rascunho de carrinho temporário
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_CART_KEY}_${companyId}`, JSON.stringify(cartItems));
    } catch {}
  }, [cartItems, companyId]);

  // Carregar dados de produtos e categorias
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, cats, custs] = await Promise.all([
        productsService.list(companyId, { limit: 200, isActive: true }),
        categoriesService.list(companyId),
        customersService.list(companyId),
      ]);
      setProducts(prodRes.products);
      setCategories(cats);
      setCustomersList(custs);
    } catch (e) {
      console.error('Erro ao carregar catálogo do PDV:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Atalhos de teclado (F2 foca busca, F4 finaliza, Esc fecha modais)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        if (cartItems.length > 0 && !isCheckoutOpen) {
          e.preventDefault();
          setIsCheckoutOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setIsReceiptOpen(false);
        setIsQuickCustomerOpen(false);
        setVariantModalProduct(null);
        setIsCustomerDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isCheckoutOpen]);

  // Filtragem de produtos por busca e categoria
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
        return false;
      }
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(s);
        const matchesSku = p.sku.toLowerCase().includes(s);
        const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(s) : false;
        if (!matchesName && !matchesSku && !matchesBarcode) return false;
      }
      return true;
    });
  }, [products, selectedCategory, search]);

  // Adicionar produto direto ou abrir seletor de variante
  const handleProductClick = (product: Product) => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      setVariantModalProduct(product);
      return;
    }
    addProductToCart(product, null);
  };

  // Leitor de código de barras ou busca exata ao pressionar Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      const s = search.trim().toLowerCase();
      // 1. Tentar encontrar por barcode exato
      const matchBarcode = products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === s
      );
      if (matchBarcode) {
        handleProductClick(matchBarcode);
        setSearch('');
        return;
      }

      // 2. Tentar encontrar por SKU exato
      const matchSku = products.find((p) => p.sku.toLowerCase() === s);
      if (matchSku) {
        handleProductClick(matchSku);
        setSearch('');
        return;
      }

      // 3. Se houver apenas 1 resultado na lista filtrada, adiciona ele
      if (filteredProducts.length === 1) {
        handleProductClick(filteredProducts[0]);
        setSearch('');
      }
    }
  };

  const addProductToCart = (product: Product, variant: ProductVariant | null) => {
    const itemId = variant ? `${product.id}_${variant.id}` : product.id;
    const unitPrice = Number(variant ? variant.sale_price_override ?? product.sale_price : product.sale_price) || 0;
    const availableStock = Number(variant ? variant.quantity_on_hand ?? product.quantity_on_hand : product.quantity_on_hand) || 0;

    setCartItems((prev) => {
      const existing = prev.find((it) => it.id === itemId);
      if (existing) {
        // Validar estoque disponível
        if (product.track_inventory && existing.quantity >= availableStock) {
          alert(`Estoque máximo atingido para este item (${availableStock} ${product.unit}).`);
          return prev;
        }

        return prev.map((it) => {
          if (it.id !== itemId) return it;
          const newQty = it.quantity + 1;
          const itemSubtotal = newQty * it.unitPrice;
          const discountAmt =
            it.discountType === 'percent'
              ? (itemSubtotal * it.discountValue) / 100
              : it.discountValue;
          return {
            ...it,
            quantity: newQty,
            discountAmount: discountAmt,
            lineTotal: Math.max(0, itemSubtotal - discountAmt),
          };
        });
      }

      // Novo item no carrinho
      if (product.track_inventory && availableStock <= 0) {
        alert('Este produto está sem estoque disponível no momento.');
        return prev;
      }

      const newItem: CartItem = {
        id: itemId,
        product,
        variant,
        productName: product.name,
        variantName: variant ? variant.combination_key : null,
        sku: variant ? variant.sku || product.sku : product.sku,
        unitPrice,
        quantity: 1,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        lineTotal: unitPrice,
        trackInventory: product.track_inventory,
        maxAvailableStock: availableStock,
      };

      return [...prev, newItem];
    });

    setVariantModalProduct(null);
  };

  const updateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        if (it.trackInventory && newQty > it.maxAvailableStock) {
          alert(`Estoque máximo disponível: ${it.maxAvailableStock}`);
          newQty = it.maxAvailableStock;
        }
        const itemSubtotal = newQty * it.unitPrice;
        const discountAmt =
          it.discountType === 'percent'
            ? (itemSubtotal * it.discountValue) / 100
            : it.discountValue;
        return {
          ...it,
          quantity: newQty,
          discountAmount: discountAmt,
          lineTotal: Math.max(0, itemSubtotal - discountAmt),
        };
      })
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const clearCart = () => {
    if (cartItems.length > 0 && window.confirm('Deseja limpar todo o carrinho?')) {
      setCartItems([]);
      setSelectedCustomer(null);
      setGlobalDiscountValue(0);
    }
  };

  // Cálculos financeiros do carrinho
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  }, [cartItems]);

  const itemsDiscountTotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.discountAmount, 0);
  }, [cartItems]);

  const globalDiscountAmount = useMemo(() => {
    if (globalDiscountValue <= 0) return 0;
    if (globalDiscountType === 'percent') {
      return (subtotal * globalDiscountValue) / 100;
    }
    return globalDiscountValue;
  }, [subtotal, globalDiscountType, globalDiscountValue]);

  const totalDiscount = Math.min(subtotal, itemsDiscountTotal + globalDiscountAmount);
  const total = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-2">
      {/* Container Principal Dividido (Desktop: 65% Catálogo / 35% Carrinho) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden">
        {/* ÁREA ESQUERDA — PRODUTOS & CATÁLOGO (65%) */}
        <div className="flex-1 lg:w-[65%] flex flex-col gap-4 overflow-hidden">
          {/* Header do PDV com Busca Inteligente */}
          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold font-['Poppins'] text-[#111111] tracking-tight flex items-center gap-2">
                  <span>Frente de Caixa (PDV)</span>
                  <span className="text-[10px] bg-[#FFD600] text-[#111111] font-bold px-2 py-0.5 rounded-full uppercase">
                    Operacional
                  </span>
                </h1>
                <p className="text-xs text-neutral-500 font-['Inter']">
                  {currentCompany?.name || 'Minha Empresa'} &bull; Leitor de código de barras ativo
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="hidden md:inline-block px-2 py-1 bg-neutral-100 rounded-md border text-[11px] font-mono">
                  F2 Busca
                </span>
                <span className="hidden md:inline-block px-2 py-1 bg-neutral-100 rounded-md border text-[11px] font-mono">
                  F4 Finalizar
                </span>
              </div>
            </div>

            {/* Input de Busca com Ícone de Leitor de Código de Barras */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar produto por nome, SKU ou passe o leitor de código de barras..."
                className="w-full pl-10 pr-24 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-neutral-400">
                <Barcode className="w-4 h-4" />
                <span className="text-[11px] font-mono">USB</span>
              </div>
            </div>

            {/* Filtros Horizontais de Categoria */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#111111] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Produtos */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-44 bg-neutral-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-10 text-center border-dashed border-2 border-neutral-300 bg-neutral-50/50 rounded-2xl">
                <Package className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-neutral-700">Nenhum produto encontrado</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Verifique o termo pesquisado ou cadastre novos itens no menu Produtos.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0];
                  const stock = Number(p.quantity_on_hand) || 0;
                  const isOutOfStock = p.track_inventory && stock <= 0;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleProductClick(p)}
                      className={`group relative text-left bg-white p-3 rounded-2xl border border-border hover:border-[#FFD600] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden ${
                        isOutOfStock ? 'opacity-50 cursor-not-allowed bg-neutral-50' : ''
                      }`}
                    >
                      <div>
                        {/* Imagem do Produto */}
                        <div className="w-full h-24 rounded-xl bg-neutral-100 border border-neutral-200/80 mb-2.5 overflow-hidden flex items-center justify-center relative">
                          {primaryImg?.storage_path ? (
                            <img
                              src={primaryImg.storage_path}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-neutral-300" />
                          )}

                          {/* Badge de Variantes ou Estoque */}
                          {p.has_variants ? (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Variantes
                            </span>
                          ) : isOutOfStock ? (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Esgotado
                            </span>
                          ) : null}
                        </div>

                        {/* Nome e SKU */}
                        <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-tight group-hover:text-neutral-950">
                          {p.name}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                          {p.sku}
                        </span>
                      </div>

                      {/* Preço e Estoque */}
                      <div className="mt-3 pt-2 border-t border-neutral-100 flex items-baseline justify-between">
                        <span className="text-sm font-extrabold text-[#111111] font-mono">
                          {formatCurrency(p.sale_price)}
                        </span>
                        {p.track_inventory && (
                          <span
                            className={`text-[10px] font-mono ${
                              stock <= (p.minimum_quantity || 0)
                                ? 'text-amber-600 font-bold'
                                : 'text-neutral-400'
                            }`}
                          >
                            {stock} {p.unit}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ÁREA DIREITA — CARRINHO DA VENDA (35%) (DESKTOP) */}
        <div className="hidden lg:flex flex-col w-[35%] bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Header do Carrinho */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-neutral-50/60">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#111111]" />
                <h2 className="text-base font-bold font-['Poppins'] text-[#111111]">
                  Venda Atual
                </h2>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                {cartItems.length} item(ns) no carrinho
              </span>
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>

          {/* Seleção de Cliente */}
          <div className="p-3 border-b border-border bg-neutral-50/30 relative">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span>Cliente:</span>
                {selectedCustomer ? (
                  <span className="font-bold text-[#111111]">{selectedCustomer.name}</span>
                ) : (
                  <span className="text-neutral-400 italic">Não identificado</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {selectedCustomer ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Remover
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="text-[11px] text-[#111111] hover:underline font-semibold"
                    >
                      Selecionar
                    </button>
                    <span className="text-neutral-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setIsQuickCustomerOpen(true)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      + Novo
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Dropdown de Clientes */}
            {isCustomerDropdownOpen && (
              <div className="absolute left-3 right-3 top-10 mt-1 bg-white rounded-xl shadow-xl border border-border p-2 z-20 max-h-48 overflow-y-auto space-y-1">
                {customersList.length === 0 ? (
                  <div className="p-2 text-center text-xs text-neutral-400">
                    Nenhum cliente cadastrado.
                  </div>
                ) : (
                  customersList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-neutral-50 text-xs flex justify-between items-center"
                    >
                      <span className="font-semibold text-neutral-800">{c.name}</span>
                      <span className="text-neutral-400 text-[10px] font-mono">{c.phone || ''}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Lista de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                <ShoppingCart className="w-10 h-10 mb-2 text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-neutral-600">O carrinho está vazio</p>
                <p className="text-[11px] text-neutral-400 max-w-[180px] mt-0.5">
                  Clique nos produtos da esquerda ou use o leitor de código de barras.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 leading-tight truncate">
                        {item.productName}
                      </h4>
                      {item.variantName && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                          {item.variantName}
                        </span>
                      )}
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        {formatCurrency(item.unitPrice)} un.
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-[#111111] font-mono">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>

                  {/* Controles de Quantidade */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-neutral-200 text-neutral-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemQuantity(item.id, Number(e.target.value) || 1)
                        }
                        className="w-10 text-center text-xs font-bold font-mono bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-neutral-200 text-neutral-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded transition"
                      title="Remover item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé / Subtotal e Finalização */}
          <div className="p-4 border-t border-border bg-neutral-50 space-y-3">
            {/* Desconto Geral */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium">Desconto Geral:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={globalDiscountValue || ''}
                  onChange={(e) => setGlobalDiscountValue(Number(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs bg-white border border-neutral-200 rounded-lg text-right font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    setGlobalDiscountType(globalDiscountType === 'fixed' ? 'percent' : 'fixed')
                  }
                  className="px-1.5 py-1 text-[10px] font-bold bg-neutral-200 rounded-md text-neutral-700"
                >
                  {globalDiscountType === 'fixed' ? 'R$' : '%'}
                </button>
              </div>
            </div>

            {/* Linhas de Valores */}
            <div className="space-y-1 text-xs pt-1 border-t border-neutral-200/60">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Desconto:</span>
                  <span className="font-mono">-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-base font-extrabold text-[#111111] pt-1">
                <span>Total a Pagar:</span>
                <span className="text-xl font-mono">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Botão Finalizar Venda */}
            <Button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] font-bold text-sm py-3 rounded-xl border-none shadow-md flex items-center justify-center gap-2"
            >
              <span>Finalizar Venda</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* BARRA FLUTUANTE INFERIOR MOBILE */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-border shadow-2xl flex items-center justify-between z-30">
        <div>
          <span className="text-[11px] text-neutral-500 block">
            {cartItems.length} item(ns)
          </span>
          <span className="text-base font-bold font-mono text-[#111111]">
            {formatCurrency(total)}
          </span>
        </div>

        <Button
          size="sm"
          disabled={cartItems.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
          className="bg-[#FFD600] text-[#111111] hover:bg-[#e6c100] font-bold border-none"
        >
          Finalizar ({formatCurrency(total)})
        </Button>
      </div>

      {/* Modal de Escolha de Variante */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 font-['Poppins']">
                  Selecione a Variação
                </h3>
                <p className="text-xs text-neutral-500">{variantModalProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {(variantModalProduct.variants || []).map((v) => {
                const stock = Number(v.quantity_on_hand) || 0;
                const isOut = variantModalProduct.track_inventory && stock <= 0;
                const price = Number(v.sale_price_override ?? variantModalProduct.sale_price) || 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isOut}
                    onClick={() => addProductToCart(variantModalProduct, v)}
                    className={`w-full p-2.5 rounded-xl border text-left flex justify-between items-center transition ${
                      isOut
                        ? 'opacity-40 border-neutral-200 cursor-not-allowed bg-neutral-50'
                        : 'border-neutral-200 hover:border-[#FFD600] hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">
                        {v.combination_key}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        SKU: {v.sku || variantModalProduct.sku}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono block">
                        {formatCurrency(price)}
                      </span>
                      {variantModalProduct.track_inventory && (
                        <span className="text-[10px] text-neutral-400">
                          {stock} em estoque
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        companyId={companyId}
        items={cartItems}
        customer={selectedCustomer}
        subtotal={subtotal}
        discountAmount={totalDiscount}
        total={total}
        onSaleCompleted={(sale) => {
          setIsCheckoutOpen(false);
          setCompletedSale(sale);
          setIsReceiptOpen(true);
          setCartItems([]);
          setSelectedCustomer(null);
          setGlobalDiscountValue(0);
          loadCatalog();
        }}
      />

      {/* Modal de Comprovante Não-Fiscal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setCompletedSale(null);
        }}
        sale={completedSale}
        companyName={currentCompany?.name || 'MOVI'}
      />

      {/* Modal de Cadastro Rápido de Cliente */}
      <QuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        companyId={companyId}
        onCustomerCreated={(c) => {
          setSelectedCustomer(c);
          setCustomersList((prev) => [c, ...prev]);
        }}
      />
    </div>
  );
};
