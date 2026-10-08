import { describe, it, expect, beforeEach } from 'vitest';
import { salesService } from '@/services/salesService';
import { inventoryService } from '@/services/inventoryService';
import { productsService } from '@/services/productsService';
import type { CartItem, CheckoutPayment } from '@/types/pos';
import type { Product } from '@/types/products';

// Mock de localStorage para ambiente de testes Node
const storage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      for (const key of Object.keys(storage)) {
        delete storage[key];
      }
    },
    length: 0,
    key: () => null,
  };
}

describe('PDV & Gestão de Vendas (Etapa 03)', () => {
  const companyId = 'test_comp_pos';
  let testProduct: Product;

  beforeEach(async () => {
    localStorage.clear();

    // 1. Cadastrar produto com estoque controlado de 20 unidades
    testProduct = await productsService.create(companyId, {
      name: 'Camisa Polo Premium',
      sku: 'POLO-001',
      cost_price: 35.0,
      sale_price: 89.9,
      unit: 'UN',
      track_inventory: true,
      has_variants: false,
      initialStock: 20,
    });
  });

  it('deve registrar venda, baixar estoque automaticamente e gerar histórico de auditoria', async () => {
    const cartItem: CartItem = {
      id: testProduct.id,
      product: testProduct,
      variant: null,
      productName: testProduct.name,
      variantName: null,
      sku: testProduct.sku,
      unitPrice: 89.9,
      quantity: 2,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      lineTotal: 179.8,
      trackInventory: true,
      maxAvailableStock: 20,
    };

    const payment: CheckoutPayment = {
      method: 'pix',
      amount: 179.8,
    };

    // 2. Executar venda
    const result = await salesService.createSale({
      companyId,
      items: [cartItem],
      payments: [payment],
      discountAmount: 0,
      notes: 'Venda balcão Pix',
      idempotencyKey: 'idemp_key_1',
    });

    expect(result.success).toBe(true);
    expect(result.sale.sale_number).toBe('VD-0001');
    expect(result.sale.total_amount).toBe(179.8);
    expect(result.sale.status).toBe('completed');

    // 3. Verificar que o estoque baixou de 20 para 18
    const movements = await inventoryService.listMovements(companyId);
    const saleMovement = movements.find((m) => m.movement_type === 'sale');

    expect(saleMovement).toBeDefined();
    expect(saleMovement?.quantity_delta).toBe(-2);
    expect(saleMovement?.quantity_before).toBe(20);
    expect(saleMovement?.quantity_after).toBe(18);
  });

  it('deve calcular corretamente troco em dinheiro e pagamento misto', async () => {
    const totalVenda = 150.0;
    const cartItem: CartItem = {
      id: testProduct.id,
      product: testProduct,
      variant: null,
      productName: testProduct.name,
      variantName: null,
      sku: testProduct.sku,
      unitPrice: 50.0,
      quantity: 3,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      lineTotal: totalVenda,
      trackInventory: true,
      maxAvailableStock: 20,
    };

    // Pagamento misto: R$ 50 em dinheiro (entregue 100 com troco de 50) + R$ 100 no Pix
    const payments: CheckoutPayment[] = [
      {
        method: 'money',
        amount: 50.0,
        receivedAmount: 100.0,
        changeAmount: 50.0,
      },
      {
        method: 'pix',
        amount: 100.0,
      },
    ];

    const result = await salesService.createSale({
      companyId,
      items: [cartItem],
      payments,
      discountAmount: 0,
    });

    expect(result.sale.payments?.length).toBe(2);
    expect(result.sale.payments?.[0].change_amount).toBe(50.0);
    expect(result.sale.total_amount).toBe(150.0);
  });

  it('deve cancelar venda e estornar automaticamente as quantidades para o estoque', async () => {
    const cartItem: CartItem = {
      id: testProduct.id,
      product: testProduct,
      variant: null,
      productName: testProduct.name,
      variantName: null,
      sku: testProduct.sku,
      unitPrice: 89.9,
      quantity: 5,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      lineTotal: 449.5,
      trackInventory: true,
      maxAvailableStock: 20,
    };

    // 1. Criar venda de 5 itens (saldo vai de 20 para 15)
    const { sale } = await salesService.createSale({
      companyId,
      items: [cartItem],
      payments: [{ method: 'credit_card', amount: 449.5 }],
      discountAmount: 0,
    });

    // 2. Cancelar a venda com motivo
    const cancelRes = await salesService.cancelSale(
      companyId,
      sale.id,
      'Cliente desistiu da compra'
    );
    expect(cancelRes.success).toBe(true);

    // 3. Verificar status da venda
    const updatedSale = await salesService.getById(companyId, sale.id);
    expect(updatedSale?.status).toBe('canceled');
    expect(updatedSale?.canceled_at).toBeDefined();

    // 4. Verificar estorno no histórico de estoque (tipo 'return' devolvendo 5 unidades, saldo volta para 20)
    const movements = await inventoryService.listMovements(companyId);
    const returnMovement = movements.find((m) => m.movement_type === 'return');

    expect(returnMovement).toBeDefined();
    expect(returnMovement?.quantity_delta).toBe(5);
    expect(returnMovement?.quantity_after).toBe(20);
  });

  it('deve calcular métricas comerciais e ticket médio com exatidão', async () => {
    // 1. Venda 1: R$ 100,00
    await salesService.createSale({
      companyId,
      items: [
        {
          id: testProduct.id,
          product: testProduct,
          variant: null,
          productName: testProduct.name,
          variantName: null,
          sku: testProduct.sku,
          unitPrice: 100.0,
          quantity: 1,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          lineTotal: 100.0,
          trackInventory: false,
          maxAvailableStock: 999,
        },
      ],
      payments: [{ method: 'pix', amount: 100.0 }],
      discountAmount: 0,
    });

    // 2. Venda 2: R$ 200,00
    await salesService.createSale({
      companyId,
      items: [
        {
          id: testProduct.id,
          product: testProduct,
          variant: null,
          productName: testProduct.name,
          variantName: null,
          sku: testProduct.sku,
          unitPrice: 200.0,
          quantity: 1,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          lineTotal: 200.0,
          trackInventory: false,
          maxAvailableStock: 999,
        },
      ],
      payments: [{ method: 'credit_card', amount: 200.0 }],
      discountAmount: 0,
    });

    const summary = await salesService.getSummary(companyId);
    expect(summary.completedCount).toBe(2);
    expect(summary.todaySalesTotal).toBe(300.0);
    expect(summary.averageTicket).toBe(150.0); // (100 + 200) / 2 = 150
  });
});
