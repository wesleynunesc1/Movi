import { describe, it, expect } from 'vitest';
import { FREE_PREMIUM_PLAN } from './database';

describe('MOVI Free Premium Plan Configuration', () => {
  it('enforces free plan limits matching specification', () => {
    expect(FREE_PREMIUM_PLAN.planName).toBe('MOVI Free');
    expect(FREE_PREMIUM_PLAN.badge).toBe('Free Premium');
    expect(FREE_PREMIUM_PLAN.maxCompanies).toBe(1);
    expect(FREE_PREMIUM_PLAN.maxProducts).toBe(200);
    expect(FREE_PREMIUM_PLAN.maxCustomers).toBe(200);
    expect(FREE_PREMIUM_PLAN.maxOwners).toBe(1);
  });

  it('contains all planned foundation modules', () => {
    expect(FREE_PREMIUM_PLAN.features).toContain('Dashboard Comercial');
    expect(FREE_PREMIUM_PLAN.features).toContain('Frente de Caixa (PDV)');
    expect(FREE_PREMIUM_PLAN.features).toContain('Controle de Estoque');
    expect(FREE_PREMIUM_PLAN.features).toContain('Histórico de Vendas');
  });
});
