import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Dla `$executeRaw` / `$queryRaw` — rozszerzenie Prisma obejmuje tylko `$allModels`. */
export async function prismaTxWithRlsBypass<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`select set_config('app.rls_bypass', 'on', true)`;
    return run(tx);
  });
}
