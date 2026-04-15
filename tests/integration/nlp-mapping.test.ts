import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyInvoiceLine } from '@/lib/nlp-mapping';

test('classifies declined fuel form "paliwa" as scope1 fuel', () => {
  const out = classifyInvoiceLine({
    description: 'Zakup paliwa do floty',
    netValue: 1200,
  });
  assert.equal(out.scope, 'SCOPE1');
  assert.equal(out.categoryCode, 'scope1_fuel');
});

test('classifies natural gas as scope1_fuel_gas', () => {
  const out = classifyInvoiceLine({
    description: 'Gaz ziemny do ogrzewania hali',
    unit: 'm3',
    quantity: 350,
    netValue: 900,
  });
  assert.equal(out.scope, 'SCOPE1');
  assert.equal(out.categoryCode, 'scope1_fuel_gas');
});

test('classifies leasing as purchased services', () => {
  const out = classifyInvoiceLine({
    description: 'Rata leasingowa samochodu',
    netValue: 2000,
  });
  assert.equal(out.scope, 'SCOPE3');
  assert.equal(out.categoryCode, 'scope3_cat1_purchased_services');
});

test('classifies food purchase as purchased goods', () => {
  const out = classifyInvoiceLine({
    description: 'Artykuly spozywcze do biura',
    netValue: 340,
  });
  assert.equal(out.scope, 'SCOPE3');
  assert.equal(out.categoryCode, 'scope3_cat1_purchased_services');
});

