import Stripe from 'stripe';
import { assertProductionStripeEnv, isProductionRuntime } from '@/lib/production-env';

const isProduction = isProductionRuntime();
assertProductionStripeEnv();

if (!process.env.STRIPE_SECRET_KEY && !isProduction) {
  console.warn('STRIPE_SECRET_KEY is missing; Stripe routes will fail until configured.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_missing', {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

export const PLANS = {
  MIKRO: {
    name: 'Mikro',
    ksefLimit: 1,
    userLimit: 1,
    monthlyPricePLN: 149,
    annualPricePLN: 134,
    priceIdMonthly: process.env.STRIPE_PRICE_ID_MIKRO_MONTHLY,
    priceIdAnnual: process.env.STRIPE_PRICE_ID_MIKRO_ANNUAL,
  },
  STARTER: {
    name: 'Starter',
    ksefLimit: 1,
    userLimit: 5,
    monthlyPricePLN: 279,
    annualPricePLN: 251,
    priceIdMonthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY,
    priceIdAnnual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL,
  },
  GROWTH: {
    name: 'Growth',
    ksefLimit: 3,
    userLimit: 15,
    monthlyPricePLN: 499,
    annualPricePLN: 449,
    priceIdMonthly: process.env.STRIPE_PRICE_ID_GROWTH_MONTHLY,
    priceIdAnnual: process.env.STRIPE_PRICE_ID_GROWTH_ANNUAL,
    recommended: true,
  },
  SCALE: {
    name: 'Scale',
    ksefLimit: 10,
    userLimit: 999,
    monthlyPricePLN: 849,
    annualPricePLN: 764,
    priceIdMonthly: process.env.STRIPE_PRICE_ID_SCALE_MONTHLY,
    priceIdAnnual: process.env.STRIPE_PRICE_ID_SCALE_ANNUAL,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    ksefLimit: 999,
    userLimit: 999,
    monthlyPricePLN: null,
    annualPricePLN: null,
    priceIdMonthly: null,
    priceIdAnnual: null,
  },
} as const;

export const ANNUAL_DISCOUNT = 0.1;
export const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? '7');
