import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { InventoryItem, InventoryMovement, InventorySummary, MovementType } from '@/types/inventory';
import type { Product } from '@/types/products';

const LOCAL_INVENTORY_ITEMS_KEY = 'movi_local_inventory_items';
const LOCAL_MOVEMENTS_KEY = 'movi_local_movements';

function getLocalItems(companyId: string): InventoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_INVENTORY_ITEMS_KEY);
    const list: InventoryItem[] = raw ? JSON.parse(raw) : [];
    return list.filter((item) => item.company_id === companyId);
  } catch {
    return [];
  }
}

function saveLocalItems(companyId: string, items: InventoryItem[]): void {
  try {
    const raw = localStorage.getItem(LOCAL_INVENTORY_ITEMS_KEY);
    let all: InventoryItem[] = raw ? JSON.parse(raw) : [];
    all = all.filter((i) => i.company_id !== companyId).concat(items);
    localStorage.setItem(LOCAL_INVENTORY_ITEMS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar itens de estoque locais:', e);
  }
}

function getLocalMovements(companyId: string): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(LOCAL_MOVEMENTS_KEY);
    const list: InventoryMovement[] = raw ? JSON.parse(raw) : [];
    return list.filter((m) => m.company_id === companyId);
  } catch {
    return [];
  }
}

function saveLocalMovement(movement: InventoryMovement): void {
  try {
    const raw = localStorage.getItem(LOCAL_MOVEMENTS_KEY);
    const list: InventoryMovement[] = raw ? JSON.parse(raw) : [];
    list.unshift(movement);
    localStorage.setItem(LOCAL_MOVEMENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar movimentação local:', e);
  }
}

export const inventoryService = {
  async getSummary(companyId: string): Promise<InventorySummary> {
    const rawProducts = localStorage.getItem('movi_local_products');
    const products: Product[] = rawProducts ? JSON.parse(rawProducts).filter((p: any) => p.company_id === companyId && !p.archived_at) : [];
    
    let totalActiveProducts = 0;
    let totalUnitsInStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalCostValue = 0;

    products.forEach((p) => {
      if (p.is_active) totalActiveProducts++;
      if (!p.track_inventory) return;

      const q = Number(p.quantity_on_hand) || 0;
      const min = Number(p.minimum_quantity) || 0;
      const cost = Number(p.cost_price) || 0;

      totalUnitsInStock += q;
      totalCostValue += q * cost;

      if (q <= 0) {
        outOfStockCount++;
      } else if (q <= min) {
        lowStockCount++;
      }
    });

    return {
      totalActiveProducts,
      totalUnitsInStock: Math.round(totalUnitsInStock * 100) / 100,
      lowStockCount,
      outOfStockCount,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
    };
  },

  async recordMovement(params: {
    company_id: string;
    product_id: string;
    variant_id?: string | null;
    movement_type: MovementType;
    quantity: number;
    reason: string;
    notes?: string | null;
    minimum_quantity?: number;
    idempotency_key?: string;
  }): Promise<{ success: boolean; quantity_after: number }> {
    const qty = Number(params.quantity) || 0;

    // 1. Tentar executar via RPC atômica no Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('record_inventory_movement', {
          p_company_id: params.company_id,
          p_product_id: params.product_id,
          p_variant_id: params.variant_id || null,
          p_movement_type: params.movement_type,
          p_quantity: qty,
          p_reason: params.reason,
          p_notes: params.notes || null,
          p_idempotency_key: params.idempotency_key || null,
        });

        if (!error && data?.success) {
          return { success: true, quantity_after: data.quantity_after };
        }
      } catch (e) {
        console.warn('Erro ao chamar RPC record_inventory_movement, executando local:', e);
      }
    }

    // 2. Transação local garantindo integridade e validação de estoque negativo
    const items = getLocalItems(params.company_id);
    let item = items.find(
      (i) => i.product_id === params.product_id && (params.variant_id ? i.variant_id === params.variant_id : !i.variant_id)
    );

    const currentQty = item ? Number(item.quantity_on_hand) || 0 : 0;
    let newQty = currentQty;
    let delta = 0;

    if (params.movement_type === 'entry' || params.movement_type === 'initial' || params.movement_type === 'return') {
      delta = Math.abs(qty);
      newQty = currentQty + delta;
    } else if (params.movement_type === 'exit' || params.movement_type === 'sale') {
      delta = -Math.abs(qty);
      newQty = currentQty + delta;
      if (newQty < 0) {
        throw new Error(`Estoque insuficiente. Saldo atual disponível: ${currentQty}, solicitado: ${Math.abs(qty)}.`);
      }
    } else if (params.movement_type === 'adjustment') {
      newQty = Math.max(0, qty);
      delta = newQty - currentQty;
    }

    if (!item) {
      item = {
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        company_id: params.company_id,
        product_id: params.product_id,
        variant_id: params.variant_id || null,
        quantity_on_hand: newQty,
        minimum_quantity: params.minimum_quantity ?? 0,
        location: null,
        updated_at: new Date().toISOString(),
      };
      items.push(item);
    } else {
      item.quantity_on_hand = newQty;
      if (params.minimum_quantity !== undefined) item.minimum_quantity = params.minimum_quantity;
      item.updated_at = new Date().toISOString();
    }
    saveLocalItems(params.company_id, items);

    // Atualizar produto no array local de produtos para manter sincronizado
    try {
      const rawProd = localStorage.getItem('movi_local_products');
      if (rawProd) {
        const prodList: Product[] = JSON.parse(rawProd);
        const p = prodList.find((prod) => prod.id === params.product_id);
        if (p) {
          p.quantity_on_hand = newQty;
          if (params.minimum_quantity !== undefined) p.minimum_quantity = params.minimum_quantity;
          localStorage.setItem('movi_local_products', JSON.stringify(prodList));
        }
      }
    } catch {}

    // Registrar histórico auditável imutável
    const rawProd = localStorage.getItem('movi_local_products');
    const prodList: Product[] = rawProd ? JSON.parse(rawProd) : [];
    const matchedProd = prodList.find((p) => p.id === params.product_id);

    const movement: InventoryMovement = {
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      company_id: params.company_id,
      inventory_item_id: item.id,
      movement_type: params.movement_type,
      quantity_delta: delta,
      quantity_before: currentQty,
      quantity_after: newQty,
      reason: params.reason,
      notes: params.notes || null,
      performed_by: 'Administrador',
      idempotency_key: params.idempotency_key || null,
      created_at: new Date().toISOString(),
      product_name: matchedProd?.name || 'Produto',
    };
    saveLocalMovement(movement);

    return { success: true, quantity_after: newQty };
  },

  async listMovements(companyId: string): Promise<InventoryMovement[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory_movements')
          .select('*, item:inventory_items(product:products(name))')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          return data.map((d: any) => ({
            ...d,
            product_name: d.item?.product?.name || 'Produto',
          }));
        }
      } catch (e) {
        console.warn('Erro ao buscar movimentações no Supabase:', e);
      }
    }

    return getLocalMovements(companyId);
  },
};
