export type SaleStatus =
  | 'draft'
  | 'pending'
  | 'completed'
  | 'partially_returned'
  | 'returned'
  | 'canceled';

export type PaymentMethod =
  | 'money'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'other';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'money', label: 'Dinheiro', icon: 'Banknote' },
  { value: 'pix', label: 'Pix', icon: 'QrCode' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: 'CreditCard' },
  { value: 'debit_card', label: 'Cartão de Débito', icon: 'CreditCard' },
  { value: 'bank_transfer', label: 'Transferência', icon: 'ArrowLeftRight' },
  { value: 'other', label: 'Outro', icon: 'Coins' },
];

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  company_id: string;
  sale_id: string;
  product_id: string;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  sku_snapshot: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  created_at: string;
}

export interface SalePayment {
  id: string;
  company_id: string;
  sale_id: string;
  method: PaymentMethod;
  amount: number;
  installments: number;
  change_amount: number;
  confirmation_source: string;
  created_at: string;
}

export interface Sale {
  id: string;
  company_id: string;
  sale_number: string;
  customer_id: string | null;
  customer?: Customer | null;
  created_by: string | null;
  status: SaleStatus;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  notes: string | null;
  idempotency_key: string | null;
  created_at: string;
  completed_at: string | null;
  canceled_at: string | null;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SalesSummary {
  todaySalesCount: number;
  todaySalesTotal: number;
  monthSalesTotal: number;
  averageTicket: number;
  completedCount: number;
}
