import type { Customer } from './sales';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'canceled';

export type OrderSource = 'pos' | 'online_store' | 'whatsapp' | 'manual';

export interface OrderItem {
  id: string;
  company_id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  sku_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  customer_id: string | null;
  customer?: Customer | null;
  order_number: string;
  source: OrderSource;
  status: OrderStatus;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}
