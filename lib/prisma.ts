import './patch-database-url';
import { PrismaClient } from '@prisma/client';
import { createRlsExtension } from '@/lib/prisma-rls-extension';

const globalForPrisma = globalThis as unknown as { basePrisma?: PrismaClient };

const basePrisma = globalForPrisma.basePrisma ?? new PrismaClient({ log: ['error', 'warn'] });
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.basePrisma = basePrisma;
}

/** Rozszerzony klient z RLS (transakcja + set_config). */
export const prisma = basePrisma.$extends(createRlsExtension(basePrisma)) as unknown as PrismaClient;
