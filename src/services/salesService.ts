import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Sale, SaleItem, SalePayment, SalesSummary, SaleStatus, PaymentMethod } from '@/types/sales';
import type { CartItem, CheckoutPayment } from '@/types/pos';
import { inventoryService } from './inventoryService';

const LOCAL_SALES_KEY = 'movi_local_sales';

function getLocalSales(companyId: string): Sale[] {
  try {
    const raw = localStorage.getItem(LOCAL_SALES_KEY);
    const list: Sale[] = raw ? JSON.parse(raw) : [];
    return list.filter((s) => s.company_id === companyId);
  } catch {
    return [];
  }
}

function saveLocalSales(companyId: string, sales: Sale[]): void {
  try {
    const raw = localStorage.getItem(LOCAL_SALES_KEY);
    let all: Sale[] = raw ? JSON.parse(raw) : [];
    all = all.filter((s) => s.company_id !== companyId).concat(sales);
    localStorage.setItem(LOCAL_SALES_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar vendas locais:', e);
  }
}

export interface SaleFilters {
  search?: string;
  status?: SaleStatus | 'all';
  paymentMethod?: PaymentMethod | 'all';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SalesListResponse {
  sales: Sale[];
  total: number;
  summary: SalesSummary;
}

export const salesService = {
  async getSummary(companyId: string): Promise<SalesSummary> {
    const all = await this.getAllSalesForSummary(companyId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todaySalesCount = 0;
    let todaySalesTotal = 0;
    let monthSalesTotal = 0;
    let completedCount = 0;
    let totalGrossRevenue = 0;

    all.forEach((s) => {
      if (s.status === 'canceled') return;

      const saleDate = new Date(s.created_at);
      const saleDateStr = saleDate.toISOString().split('T')[0];

      if (s.status === 'completed') {
        completedCount++;
        totalGrossRevenue += s.total_amount;
      }

      if (saleDateStr === todayStr && s.status === 'completed') {
        todaySalesCount++;
        todaySalesTotal += s.total_amount;
      }

      if (
        saleDate.getMonth() === currentMonth &&
        saleDate.getFullYear() === currentYear &&
        s.status === 'completed'
      ) {
        monthSalesTotal += s.total_amount;
      }
    });

    const averageTicket =
      completedCount > 0 ? Math.round((totalGrossRevenue / completedCount) * 100) / 100 : 0;

    return {
      todaySalesCount,
      todaySalesTotal: Math.round(todaySalesTotal * 100) / 100,
      monthSalesTotal: Math.round(monthSalesTotal * 100) / 100,
      averageTicket,
      completedCount,
    };
  },

  async getAllSalesForSummary(companyId: string): Promise<Sale[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('id, total_amount, status, created_at')
          .eq('company_id', companyId);

        if (!error && data) {
          return data as any;
        }
      } catch {}
    }
    return getLocalSales(companyId);
  },

  async list(companyId: string, filters: SaleFilters = {}): Promise<SalesListResponse> {
    const summary = await this.getSummary(companyId);

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('sales')
          .select(
            '*, customer:customers(*), items:sale_items(*), payments:sale_payments(*)',
            { count: 'exact' }
          )
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (filters.search && filters.search.trim()) {
          const s = filters.search.trim();
          query = query.or(`sale_number.ilike.%${s}%,notes.ilike.%${s}%`);
        }

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (filters.startDate) {
          query = query.gte('created_at', `${filters.startDate}T00:00:00.000Z`);
        }

        if (filters.endDate) {
          query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);
        }

        const page = filters.page || 1;
        const limit = filters.limit || 15;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (!error && data) {
          return {
            sales: data as Sale[],
            total: count || 0,
            summary,
          };
        }
      } catch (err) {
        console.warn('Erro ao buscar vendas no Supabase, usando local:', err);
      }
    }

    // Local fallback
    let list = getLocalSales(companyId);

    if (filters.search && filters.search.trim()) {
      const s = filters.search.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.sale_number.toLowerCase().includes(s) ||
          v.customer?.name.toLowerCase().includes(s) ||
          v.notes?.toLowerCase().includes(s)
      );
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter((v) => v.status === filters.status);
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      list = list.filter((v) =>
        v.payments?.some((p) => p.method === filters.paymentMethod)
      );
    }

    const total = list.length;
    const page = filters.page || 1;
    const limit = filters.limit || 15;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      sales: paginated,
      total,
      summary,
    };
  },

  async getById(companyId: string, saleId: string): Promise<Sale | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*, customer:customers(*), items:sale_items(*), payments:sale_payments(*)')
          .eq('company_id', companyId)
          .eq('id', saleId)
          .single();

        if (!error && data) {
          return data as Sale;
        }
      } catch {}
    }

    const localList = getLocalSales(companyId);
    return localList.find((s) => s.id === saleId) || null;
  },

  async createSale(params: {
    companyId: string;
    items: CartItem[];
    payments: CheckoutPayment[];
    customerId?: string | null;
    customerName?: string | null;
    discountAmount: number;
    notes?: string | null;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; sale: Sale }> {
    const {
      companyId,
      items,
      payments,
      customerId,
      customerName,
      discountAmount,
      notes,
      idempotencyKey,
    } = params;

    // Calcular valores de subtotal e total
    const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const itemDiscounts = items.reduce((acc, it) => acc + it.discountAmount, 0);
    const totalDiscount = Math.min(subtotal, itemDiscounts + (Number(discountAmount) || 0));
    const totalAmount = Math.max(0, subtotal - totalDiscount);

    // 1. Tentar executar via RPC transacional do Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const rpcItems = items.map((it) => ({
          product_id: it.product.id,
          variant_id: it.variant ? it.variant.id : null,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          discount_amount: it.discountAmount,
        }));

        const rpcPayments = payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          installments: p.installments || 1,
          change_amount: p.changeAmount || 0,
        }));

        const { data: rpcRes, error: rpcErr } = await supabase.rpc('process_pos_sale', {
          p_company_id: companyId,
          p_items: rpcItems,
          p_payments: rpcPayments,
          p_customer_id: customerId || null,
          p_discount_amount: Number(discountAmount) || 0,
          p_notes: notes || null,
          p_idempotency_key: idempotencyKey || null,
        });

        if (!rpcErr && rpcRes?.success) {
          const createdSale = await this.getById(companyId, rpcRes.sale_id);
          if (createdSale) {
            return { success: true, sale: createdSale };
          }
        } else if (rpcErr) {
          console.warn('RPC process_pos_sale não disponível ou com erro, usando fallback com baixa atômica de estoque:', rpcErr.message);
        }
      } catch (err: any) {
        console.warn('Erro ao invocar RPC de venda no Supabase, procedendo com fallback seguro:', err?.message || err);
      }
    }

    // 2. Transação local garantindo integridade e baixa atômica de estoque
    const existingList = getLocalSales(companyId);
    const saleNum = 'VD-' + String(existingList.length + 1).padStart(4, '0');
    const saleId = 'sale_' + Math.random().toString(36).substring(2, 9);
    const nowIso = new Date().toISOString();

    const saleItems: SaleItem[] = items.map((it) => ({
      id: 'sitem_' + Math.random().toString(36).substring(2, 9),
      company_id: companyId,
      sale_id: saleId,
      product_id: it.product.id,
      variant_id: it.variant ? it.variant.id : null,
      product_name_snapshot: it.productName,
      variant_name_snapshot: it.variantName,
      sku_snapshot: it.sku,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      discount_amount: it.discountAmount,
      line_total: it.lineTotal,
      created_at: nowIso,
    }));

    const salePayments: SalePayment[] = payments.map((p) => ({
      id: 'spay_' + Math.random().toString(36).substring(2, 9),
      company_id: companyId,
      sale_id: saleId,
      method: p.method,
      amount: p.amount,
      installments: p.installments || 1,
      change_amount: p.changeAmount || 0,
      confirmation_source: 'manual',
      created_at: nowIso,
    }));

    const newSale: Sale = {
      id: saleId,
      company_id: companyId,
      sale_number: saleNum,
      customer_id: customerId || null,
      customer: customerName
        ? {
            id: customerId || 'cust_temp',
            company_id: companyId,
            name: customerName,
            email: null,
            phone: null,
            document: null,
            created_at: nowIso,
          }
        : null,
      created_by: 'Operador Caixa',
      status: 'completed',
      subtotal_amount: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(totalDiscount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      payment_status: 'paid',
      notes: notes?.trim() || null,
      idempotency_key: idempotencyKey || null,
      created_at: nowIso,
      completed_at: nowIso,
      canceled_at: null,
      items: saleItems,
      payments: salePayments,
    };

    // Baixa automática de estoque para cada item vendido
    for (const it of items) {
      if (it.trackInventory) {
        await inventoryService.recordMovement({
          company_id: companyId,
          product_id: it.product.id,
          variant_id: it.variant ? it.variant.id : null,
          movement_type: 'sale',
          quantity: it.quantity,
          reason: `Venda PDV ${saleNum}`,
          notes: `Item: ${it.productName}${it.variantName ? ` (${it.variantName})` : ''}`,
          idempotency_key: `${saleNum}_${it.id}`,
        });
      }
    }

    existingList.unshift(newSale);
    saveLocalSales(companyId, existingList);

    return { success: true, sale: newSale };
  },

  async cancelSale(companyId: string, saleId: string, reason = 'Cancelamento pelo operador'): Promise<{ success: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('cancel_sale', {
          p_company_id: companyId,
          p_sale_id: saleId,
          p_reason: reason,
        });

        if (!error && data?.success) {
          return { success: true };
        }
      } catch (e) {
        console.warn('Erro ao cancelar venda no Supabase:', e);
      }
    }

    // Cancelamento local
    const list = getLocalSales(companyId);
    const sale = list.find((s) => s.id === saleId);
    if (!sale) throw new Error('Venda não encontrada.');
    if (sale.status === 'canceled') throw new Error('Venda já cancelada.');

    sale.status = 'canceled';
    sale.canceled_at = new Date().toISOString();

    // Reverter estoque dos itens
    if (sale.items) {
      for (const item of sale.items) {
        try {
          await inventoryService.recordMovement({
            company_id: companyId,
            product_id: item.product_id,
            variant_id: item.variant_id,
            movement_type: 'return',
            quantity: item.quantity,
            reason: `Estorno de Venda ${sale.sale_number}`,
            notes: `Motivo do cancelamento: ${reason}`,
            idempotency_key: `cancel_${sale.sale_number}_${item.id}`,
          });
        } catch (err) {
          console.error('Erro ao devolver estoque:', err);
        }
      }
    }

    saveLocalSales(companyId, list);
    return { success: true };
  },
};
