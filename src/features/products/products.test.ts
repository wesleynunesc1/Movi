import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateProductFinancials,
  generateSuggestedSku,
  type Product,
} from '@/types/products';
import {
  getStockStatus,
  type MovementType,
} from '@/types/inventory';
import { productsService } from '@/services/productsService';
import { inventoryService } from '@/services/inventoryService';

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

describe('Cálculos Financeiros de Produtos (Etapa 02)', () => {
  it('deve calcular corretamente Lucro Bruto, Margem Bruta e Markup para valores normais', () => {
    // Venda: R$ 100,00 | Custo: R$ 60,00
    // Lucro bruto: 100 - 60 = 40
    // Margem bruta: (40 / 100) * 100 = 40.0%
    // Markup: 100 / 60 = 1.67
    const result = calculateProductFinancials(100, 60);

    expect(result.grossProfit).toBe(40);
    expect(result.profitMarginPercent).toBe(40);
    expect(result.markup).toBe(1.67);
  });

  it('deve tratar preço de venda zerado sem divisão por zero', () => {
    const result = calculateProductFinancials(0, 50);

    expect(result.grossProfit).toBe(-50);
    expect(result.profitMarginPercent).toBe(0);
    expect(result.markup).toBe(0);
  });

  it('deve tratar custo zerado sem divisão por zero', () => {
    const result = calculateProductFinancials(100, 0);

    expect(result.grossProfit).toBe(100);
    expect(result.profitMarginPercent).toBe(100);
    expect(result.markup).toBe(0);
  });
});

describe('Geração de SKU Sugerido', () => {
  it('deve gerar SKU limpo sem acentos e em letras maiúsculas baseado no nome', () => {
    const sku = generateSuggestedSku('Camiseta Básica Algodão', 'MOV');
    expect(sku.startsWith('CAMI-')).toBe(true);
    expect(sku).toMatch(/^[A-Z0-9-]+$/);
  });

  it('deve usar o prefixo padrão quando o nome for vazio', () => {
    const sku = generateSuggestedSku('', 'MOV');
    expect(sku.startsWith('MOV-')).toBe(true);
  });
});

describe('Status de Estoque (Alertas)', () => {
  it('deve retornar "untracked" quando o controle de estoque estiver desativado', () => {
    expect(getStockStatus(0, 10, false)).toBe('untracked');
    expect(getStockStatus(50, 10, false)).toBe('untracked');
  });

  it('deve prevalecer "out_of_stock" quando a quantidade for zero ou menor', () => {
    expect(getStockStatus(0, 5, true)).toBe('out_of_stock');
    expect(getStockStatus(-2, 5, true)).toBe('out_of_stock');
  });

  it('deve retornar "low_stock" quando a quantidade for menor ou igual ao estoque mínimo', () => {
    expect(getStockStatus(3, 5, true)).toBe('low_stock');
    expect(getStockStatus(5, 5, true)).toBe('low_stock');
  });

  it('deve retornar "normal" quando a quantidade for superior ao estoque mínimo', () => {
    expect(getStockStatus(15, 5, true)).toBe('normal');
  });
});

describe('Transações de Estoque & Bloqueio de Saldo Negativo', () => {
  const companyId = 'test_comp_inventory';
  const productId = 'prod_test_1';

  beforeEach(() => {
    localStorage.clear();
  });

  it('deve registrar entrada e atualizar o saldo positivamente', async () => {
    const res = await inventoryService.recordMovement({
      company_id: companyId,
      product_id: productId,
      movement_type: 'entry',
      quantity: 25,
      reason: 'Compra inicial',
    });

    expect(res.success).toBe(true);
    expect(res.quantity_after).toBe(25);

    const movs = await inventoryService.listMovements(companyId);
    expect(movs.length).toBe(1);
    expect(movs[0].quantity_delta).toBe(25);
    expect(movs[0].quantity_after).toBe(25);
  });

  it('deve bloquear saída de estoque caso saldo seja insuficiente (impedir saldo negativo)', async () => {
    // 1. Entrada de 10 unidades
    await inventoryService.recordMovement({
      company_id: companyId,
      product_id: productId,
      movement_type: 'entry',
      quantity: 10,
      reason: 'Estoque inicial',
    });

    // 2. Tentar retirar 15 unidades (deve lançar erro)
    await expect(
      inventoryService.recordMovement({
        company_id: companyId,
        product_id: productId,
        movement_type: 'exit',
        quantity: 15,
        reason: 'Uso interno',
      })
    ).rejects.toThrow(/Estoque insuficiente/);
  });

  it('deve registrar ajuste por contagem calculando a diferença real no histórico', async () => {
    // 1. Entrada de 20 unidades
    await inventoryService.recordMovement({
      company_id: companyId,
      product_id: productId,
      movement_type: 'entry',
      quantity: 20,
      reason: 'Entrada inicial',
    });

    // 2. Contagem física encontrou 18 unidades
    const res = await inventoryService.recordMovement({
      company_id: companyId,
      product_id: productId,
      movement_type: 'adjustment',
      quantity: 18,
      reason: 'Conferência física',
    });

    expect(res.quantity_after).toBe(18);

    const movs = await inventoryService.listMovements(companyId);
    expect(movs[0].quantity_delta).toBe(-2);
    expect(movs[0].quantity_before).toBe(20);
    expect(movs[0].quantity_after).toBe(18);
  });
});

describe('Regras do Plano Free (Limite de 200 Produtos)', () => {
  const companyId = 'test_plan_limit';

  beforeEach(() => {
    localStorage.clear();
  });

  it('deve permitir cadastro normal até atingir o limite', async () => {
    const created = await productsService.create(companyId, {
      name: 'Produto Teste',
      sku: 'TEST-001',
      cost_price: 10,
      sale_price: 25,
      unit: 'UN',
      track_inventory: true,
      has_variants: false,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Produto Teste');
  });

  it('deve duplicar produto gerando novo SKU sufixado sem afetar estoque original', async () => {
    const original = await productsService.create(companyId, {
      name: 'Produto Original',
      sku: 'ORIG-001',
      cost_price: 15,
      sale_price: 30,
      unit: 'UN',
      track_inventory: true,
      has_variants: false,
    });

    const duplicate = await productsService.duplicate(original.id, companyId);
    expect(duplicate.name).toBe('Produto Original (Cópia)');
    expect(duplicate.sku).toContain('ORIG-001-COP');
    expect(duplicate.id).not.toBe(original.id);
  });
});
