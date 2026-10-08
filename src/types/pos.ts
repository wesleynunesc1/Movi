import type { Product, ProductVariant } from './products';
import type { Customer, PaymentMethod } from './sales';

export interface CartItem {
  id: string; // único no carrinho (ex: prodId ou prodId_varId)
  product: Product;
  variant?: ProductVariant | null;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  discountAmount: number; // valor monetário calculado do desconto
  lineTotal: number;
  trackInventory: boolean;
  maxAvailableStock: number;
}

export interface CheckoutPayment {
  method: PaymentMethod;
  amount: number;
  installments?: number;
  receivedAmount?: number; // em dinheiro para troco
  changeAmount?: number;
}

export interface POSCartState {
  items: CartItem[];
  customer: Customer | null;
  globalDiscountType: 'fixed' | 'percent';
  globalDiscountValue: number;
  subtotal: number;
  itemDiscountsTotal: number;
  globalDiscountAmount: number;
  totalDiscount: number;
  total: number;
  payments: CheckoutPayment[];
}
