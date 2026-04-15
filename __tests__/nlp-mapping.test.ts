import { describe, it, expect } from 'vitest';
import { classifyInvoiceLine } from '@/lib/nlp-mapping';

describe('classifyInvoiceLine', () => {
  it('klasyfikuje energię elektryczną po jednostce kWh', () => {
    const result = classifyInvoiceLine({
      description: 'Sprzedaz energii',
      quantity: 500,
      unit: 'kWh',
      netValue: 300,
    });
    expect(result.scope).toBe('SCOPE2');
    expect(result.categoryCode).toBe('scope2_electricity');
    expect(result.confidence).toBeGreaterThan(0.95);
    expect(result.activityValue).toBe(500);
  });

  it('klasyfikuje diesel po jednostce l', () => {
    const result = classifyInvoiceLine({
      description: 'Tankowanie pojazdu',
      quantity: 50,
      unit: 'l',
      netValue: 350,
    });
    expect(result.scope).toBe('SCOPE1');
    expect(result.categoryCode).toBe('scope1_fuel');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('klasyfikuje gaz po jednostce m3', () => {
    const result = classifyInvoiceLine({
      description: 'Dostawa gazu ziemnego',
      quantity: 200,
      unit: 'm3',
      netValue: 800,
    });
    expect(result.scope).toBe('SCOPE1');
    expect(result.categoryCode).toBe('scope1_fuel_gas');
  });

  it('klasyfikuje transport/kurier jako Scope 3 Cat 4', () => {
    const result = classifyInvoiceLine({
      description: 'Usluga kurierska DHL',
      quantity: null,
      unit: null,
      netValue: 50,
    });
    expect(result.scope).toBe('SCOPE3');
    expect(result.categoryCode).toBe('scope3_cat4_transport');
  });

  it('klasyfikuje hotel/delegacja jako Scope 3 Cat 6', () => {
    const result = classifyInvoiceLine({
      description: 'Hotel Delegacja Warszawa',
      quantity: 2,
      unit: null,
      netValue: 400,
    });
    expect(result.scope).toBe('SCOPE3');
    expect(result.categoryCode).toBe('scope3_cat6_business_travel');
  });

  it('klasyfikuje leasing jako Scope 3 Cat 1', () => {
    const result = classifyInvoiceLine({
      description: 'Koszt leasingu floty',
      quantity: null,
      unit: null,
      netValue: 1200,
    });
    expect(result.scope).toBe('SCOPE3');
    expect(result.ruleMatched).toBe('lease_rule');
  });

  it('fallback dla nieznanej kategorii ma niski confidence', () => {
    const result = classifyInvoiceLine({
      description: 'Usługa XYZ-123 ABC',
      quantity: null,
      unit: null,
      netValue: 100,
    });
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.ruleMatched).toBe('fallback_services_rule');
  });

  it('normalizuje polskie znaki prawidłowo', () => {
    const result = classifyInvoiceLine({
      description: 'Zakup paliwa napędowego',
      quantity: 100,
      unit: 'l',
      netValue: 700,
    });
    expect(result.scope).toBe('SCOPE1');
    expect(result.categoryCode).toBe('scope1_fuel');
  });
});
