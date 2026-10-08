export type ProductUnit = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'PCT' | 'CX';

export const PRODUCT_UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'G', label: 'Grama (G)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ML', label: 'Mililitro (ML)' },
  { value: 'M', label: 'Metro (M)' },
  { value: 'PCT', label: 'Pacote (PCT)' },
  { value: 'CX', label: 'Caixa (CX)' },
];

export interface ProductCategory {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface ProductImage {
  id: string;
  company_id: string;
  product_id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  company_id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  combination_key: string;
  cost_price_override: number | null;
  sale_price_override: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  quantity_on_hand?: number;
  minimum_quantity?: number;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string | null;
  category?: ProductCategory;
  name: string;
  description: string | null;
  brand: string | null;
  sku: string;
  barcode: string | null;
  unit: ProductUnit;
  cost_price: number;
  sale_price: number;
  promotional_price: number | null;
  track_inventory: boolean;
  has_variants: boolean;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  quantity_on_hand?: number;
  minimum_quantity?: number;
}

export interface ProductFinancials {
  grossProfit: number;
  profitMarginPercent: number;
  markup: number;
}

export function calculateProductFinancials(salePrice: number, costPrice: number): ProductFinancials {
  const sale = Math.max(0, Number(salePrice) || 0);
  const cost = Math.max(0, Number(costPrice) || 0);
  const grossProfit = sale - cost;
  const profitMarginPercent = sale > 0 ? (grossProfit / sale) * 100 : 0;
  const markup = cost > 0 ? sale / cost : 0;

  return {
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    markup: Math.round(markup * 100) / 100,
  };
}

export function generateSuggestedSku(name: string, companyPrefix = 'MOV'): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 4);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${clean || companyPrefix}-${rand}`;
}
