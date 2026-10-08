import type { Product, ProductVariant } from './products';

export type MovementType = 'entry' | 'exit' | 'adjustment' | 'initial' | 'sale' | 'return';

export type StockStatus = 'normal' | 'low_stock' | 'out_of_stock' | 'untracked';

export interface InventoryItem {
  id: string;
  company_id: string;
  product_id: string;
  variant_id: string | null;
  quantity_on_hand: number;
  minimum_quantity: number;
  location: string | null;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface InventoryMovement {
  id: string;
  company_id: string;
  inventory_item_id: string;
  movement_type: MovementType;
  quantity_delta: number;
  quantity_before: number;
  quantity_after: number;
  reason: string;
  notes: string | null;
  performed_by: string | null;
  idempotency_key?: string | null;
  created_at: string;
  product_name?: string;
  variant_combination?: string | null;
}

export interface InventorySummary {
  totalActiveProducts: number;
  totalUnitsInStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCostValue: number;
}

export function getStockStatus(
  quantity: number,
  minimumQuantity: number,
  trackInventory: boolean
): StockStatus {
  if (!trackInventory) return 'untracked';
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= minimumQuantity) return 'low_stock';
  return 'normal';
}

export const MOVEMENT_REASONS: Record<MovementType, string[]> = {
  entry: ['Compra de fornecedor', 'Reposição de estoque', 'Bonificação', 'Outros'],
  exit: ['Avaria / Dano', 'Perda / Extravio', 'Vencimento', 'Uso interno', 'Devolução ao fornecedor', 'Outros'],
  adjustment: ['Conferência de inventário', 'Correção de contagem', 'Ajuste inicial', 'Outros'],
  initial: ['Estoque inicial de implantação'],
  sale: ['Venda balcão / PDV', 'Pedido online'],
  return: ['Devolução de cliente', 'Cancelamento de venda'],
};
