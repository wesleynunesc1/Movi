import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CategoryModal } from './CategoryModal';
import { ProductImageUploader } from './ProductImageUploader';
import { VariantManager } from './VariantManager';
import { productsService } from '@/services/productsService';
import { categoriesService } from '@/services/categoriesService';
import { useToast } from '@/components/ui/Toast';
import {
  PRODUCT_UNITS,
  calculateProductFinancials,
  generateSuggestedSku,
  type Product,
  type ProductCategory,
  type ProductImage,
  type ProductVariant,
  type ProductUnit,
} from '@/types/products';
import {
  Save,
  DollarSign,
  Boxes,
  Sparkles,
  Info,
  Calculator,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  productToEdit?: Product | null;
  onSaved: (product: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  companyId,
  productToEdit,
  onSaved,
}) => {
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('UN');
  const [isActive, setIsActive] = useState(true);

  // Pricing states
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [promotionalPrice, setPromotionalPrice] = useState<number | undefined>(undefined);

  // Inventory states
  const [trackInventory, setTrackInventory] = useState(true);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(0);

  // Variants & Images
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  // Load categories
  useEffect(() => {
    if (companyId) {
      categoriesService.list(companyId).then(setCategories);
    }
  }, [companyId]);

  // Populate form if editing
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setCategoryId(productToEdit.category_id || '');
      setBrand(productToEdit.brand || '');
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode || '');
      setUnit(productToEdit.unit || 'UN');
      setIsActive(productToEdit.is_active);
      setCostPrice(productToEdit.cost_price);
      setSalePrice(productToEdit.sale_price);
      setPromotionalPrice(productToEdit.promotional_price || undefined);
      setTrackInventory(productToEdit.track_inventory);
      setInitialStock(productToEdit.quantity_on_hand || 0);
      setMinimumStock(productToEdit.minimum_quantity || 0);
      setHasVariants(productToEdit.has_variants);
      setVariants(productToEdit.variants || []);
      setImages(productToEdit.images || []);
    } else {
      // Defaults for new product
      setName('');
      setDescription('');
      setCategoryId('');
      setBrand('');
      setSku(generateSuggestedSku('PRODUTO'));
      setBarcode('');
      setUnit('UN');
      setIsActive(true);
      setCostPrice(0);
      setSalePrice(0);
      setPromotionalPrice(undefined);
      setTrackInventory(true);
      setInitialStock(0);
      setMinimumStock(0);
      setHasVariants(false);
      setVariants([]);
      setImages([]);
    }
  }, [productToEdit, isOpen]);

  // Financial calculations
  const financials = calculateProductFinancials(salePrice, costPrice);

  const handleNameBlur = () => {
    if (!productToEdit && name.trim() && (!sku || sku.startsWith('PROD-'))) {
      setSku(generateSuggestedSku(name));
    }
  };

  const handleCategoryCreated = (newCat: ProductCategory) => {
    setCategories((prev) => [...prev, newCat]);
    setCategoryId(newCat.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Nome obrigatório', 'Informe o nome do produto.');
      return;
    }
    if (!sku.trim()) {
      toastError('SKU obrigatório', 'Informe um código SKU de referência.');
      return;
    }
    if (salePrice < 0 || costPrice < 0) {
      toastError('Preço inválido', 'Os valores monetários não podem ser negativos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Product> & { initialStock?: number; initialMinStock?: number } = {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        brand: brand.trim() || null,
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || null,
        unit,
        cost_price: costPrice,
        sale_price: salePrice,
        promotional_price: promotionalPrice || null,
        track_inventory: trackInventory,
        has_variants: hasVariants,
        is_active: isActive,
        images,
        variants: hasVariants ? variants : [],
        initialStock: hasVariants ? undefined : initialStock,
        initialMinStock: hasVariants ? undefined : minimumStock,
      };

      let savedProduct: Product;
      if (productToEdit) {
        savedProduct = await productsService.update(productToEdit.id, companyId, payload);
        success('Produto atualizado!', `"${savedProduct.name}" foi salvo com sucesso.`);
      } else {
        savedProduct = await productsService.create(companyId, payload);
        success('Produto cadastrado!', `"${savedProduct.name}" foi adicionado ao catálogo.`);
      }

      onSaved(savedProduct);
      onClose();
    } catch (err: any) {
      toastError('Erro ao salvar produto', err?.message || 'Falha de comunicação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto'}
        description="Preencha os dados do item para catálogo, controle de estoque e vendas no PDV."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pr-2">
          {/* 1. SEÇÃO: INFORMAÇÕES BÁSICAS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-movi-graphite uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border">
              <Sparkles className="w-3.5 h-3.5 text-movi-yellow" />
              1. Informações Básicas
            </h4>

            <Input
              label="Nome do Produto *"
              placeholder="Ex: Camiseta Básica Algodão 100%"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-movi-graphite block mb-1.5">
                  Categoria
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1"
                  >
                    <option value="">Sem categoria definida</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setIsCategoryModalOpen(true)}
                    title="Nova Categoria"
                  >
                    + Nova
                  </Button>
                </div>
              </div>

              <Input
                label="Marca / Fabricante (opcional)"
                placeholder="Ex: Nike, MOVI Brand, Própria"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Código SKU *"
                placeholder="Ex: CAM-1049"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                helperText="Código interno único"
                required
              />

              <Input
                label="Código de Barras (EAN / GTIN)"
                placeholder="7890000000000"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                helperText="Compatível com leitor de código"
              />

              <Select
                label="Unidade de Medida"
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                options={PRODUCT_UNITS}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-movi-graphite block mb-1">
                Descrição do Produto
              </label>
              <textarea
                rows={2}
                placeholder="Detalhes, especificações técnicas ou informações visíveis no catálogo online..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-xs bg-white text-movi-graphite border border-border rounded-xl focus:border-movi-graphite focus:outline-none focus:ring-2 focus:ring-movi-yellow/50"
              />
            </div>
          </div>

          {/* 2. SEÇÃO: FOTOS DO PRODUTO */}
          <div className="space-y-2 pt-2 border-t border-border">
            <ProductImageUploader images={images} onChange={setImages} />
          </div>

          {/* 3. SEÇÃO: PREÇOS & CÁLCULOS FINANCEIROS */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-movi-graphite uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border">
              <DollarSign className="w-3.5 h-3.5 text-movi-yellow" />
              2. Preços e Formação de Margem
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Preço de Custo (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={costPrice || ''}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Preço de Venda (R$) *"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={salePrice || ''}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                required
              />

              <Input
                label="Preço Promocional (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
                value={promotionalPrice || ''}
                onChange={(e) => setPromotionalPrice(parseFloat(e.target.value) || undefined)}
              />
            </div>

            {/* Painel de Indicadores Financeiros */}
            <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-movi-graphite flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-movi-yellow" />
                  Margens Comerciais Estimadas
                </span>
                <span className="text-[10px] text-text-secondary">Cálculo Automático</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 bg-white rounded-xl border border-border">
                  <span className="text-[10px] text-text-secondary uppercase block">Lucro Bruto</span>
                  <span className="text-sm font-bold font-display text-movi-graphite">
                    R$ {financials.grossProfit.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-border">
                  <span className="text-[10px] text-text-secondary uppercase block">Margem Bruta</span>
                  <span className={`text-sm font-bold font-display ${financials.profitMarginPercent >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                    {financials.profitMarginPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-border">
                  <span className="text-[10px] text-text-secondary uppercase block">Markup</span>
                  <span className="text-sm font-bold font-display text-movi-graphite">
                    {financials.markup.toFixed(2)}x
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-text-secondary leading-tight pt-1">
                <Info className="w-3 h-3 inline mr-1 text-text-muted" />
                Estes cálculos representam a margem bruta unitária e não incluem tributos, fretes ou despesas fixas da empresa.
              </p>
            </div>
          </div>

          {/* 4. SEÇÃO: CONTROLE DE ESTOQUE & VARIANTES */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-movi-graphite uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border">
              <Boxes className="w-3.5 h-3.5 text-movi-yellow" />
              3. Controle de Estoque e Variações
            </h4>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-border">
              <div>
                <span className="text-xs font-bold text-movi-graphite block">
                  Controlar Estoque deste Produto
                </span>
                <span className="text-[11px] text-text-secondary">
                  Gera histórico auditável de entradas, saídas e alertas de quantidade mínima
                </span>
              </div>
              <input
                type="checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="w-4 h-4 accent-movi-yellow rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-border">
              <div>
                <span className="text-xs font-bold text-movi-graphite block">
                  Este produto possui variações?
                </span>
                <span className="text-[11px] text-text-secondary">
                  Ex: Cores, tamanhos, modelos ou especificações distintas
                </span>
              </div>
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="w-4 h-4 accent-movi-yellow rounded"
              />
            </div>

            {hasVariants ? (
              <VariantManager
                baseSku={sku}
                baseSalePrice={salePrice}
                variants={variants}
                onChange={setVariants}
              />
            ) : (
              trackInventory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-surface-secondary/40 rounded-xl border border-border">
                  <Input
                    label="Quantidade Inicial em Estoque"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={initialStock || ''}
                    onChange={(e) => setInitialStock(parseInt(e.target.value, 10) || 0)}
                    helperText="Lança movimentação de implantação"
                  />

                  <Input
                    label="Estoque Mínimo para Alerta"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minimumStock || ''}
                    onChange={(e) => setMinimumStock(parseInt(e.target.value, 10) || 0)}
                    helperText="Avisa quando o saldo estiver baixo"
                  />
                </div>
              )
            )}
          </div>

          {/* 5. STATUS ATIVO/INATIVO */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-border">
            <span className="text-xs font-bold text-movi-graphite">
              Produto Ativo para Vendas
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-movi-yellow rounded"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border sticky bottom-0 bg-white py-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {productToEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Inline de Nova Categoria */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        companyId={companyId}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
};
