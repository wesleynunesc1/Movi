import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Order, OrderStatus } from '@/types/orders';

const LOCAL_ORDERS_KEY = 'movi_local_orders';

function getLocalOrders(companyId: string): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list: Order[] = raw ? JSON.parse(raw) : [];
    return list.filter((o) => o.company_id === companyId);
  } catch {
    return [];
  }
}

function saveLocalOrders(companyId: string, orders: Order[]): void {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    let all: Order[] = raw ? JSON.parse(raw) : [];
    all = all.filter((o) => o.company_id !== companyId).concat(orders);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar pedidos locais:', e);
  }
}

export const ordersService = {
  async list(companyId: string, status?: OrderStatus | 'all'): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('orders')
          .select('*, customer:customers(*), items:order_items(*)')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data as Order[];
        }
      } catch (e) {
        console.warn('Erro ao consultar pedidos no Supabase, usando local:', e);
      }
    }

    const localList = getLocalOrders(companyId);
    if (!status || status === 'all') return localList;
    return localList.filter((o) => o.status === status);
  },

  async updateStatus(companyId: string, orderId: string, status: OrderStatus): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('company_id', companyId);

        if (!error) return true;
      } catch (e) {
        console.warn('Erro ao atualizar status do pedido no Supabase:', e);
      }
    }

    const list = getLocalOrders(companyId);
    const ord = list.find((o) => o.id === orderId);
    if (ord) {
      ord.status = status;
      ord.updated_at = new Date().toISOString();
      saveLocalOrders(companyId, list);
      return true;
    }
    return false;
  },
};
