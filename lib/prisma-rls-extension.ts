import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  getTenantRlsMode,
  isRlsBypassedGlobally,
  isRlsExtensionNoop,
  isRlsRelaxedDefault,
} from '@/lib/tenant-rls-context';

function prismaModelDelegateName(model: string) {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

/**
 * set_config w transakcji — `tx` to nie-extendowany Prisma, więc brak rekurzji.
 */
export function createRlsExtension(base: PrismaClient) {
  return Prisma.defineExtension({
    name: 'tenant_rls',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (isRlsExtensionNoop()) {
            return query(args);
          }
          const mode = getTenantRlsMode();
          const useBypass =
            mode?.kind === 'bypass' ||
            (mode == null && (isRlsBypassedGlobally() || isRlsRelaxedDefault()));
          if (useBypass) {
            return base.$transaction(async (tx) => {
              await tx.$executeRaw`select set_config('app.rls_bypass', 'on', true)`;
              const m = prismaModelDelegateName(model);
              const d = (tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>)[m];
              if (!d?.[operation]) {
                return query(args);
              }
              return d[operation]!(args);
            });
          }
          if (mode?.kind === 'tenant') {
            return base.$transaction(async (tx) => {
              await tx.$executeRaw`select set_config('app.rls_bypass', 'off', true)`;
              await tx.$executeRaw`select set_config('app.tenant', ${mode.organizationId}, true)`;
              await tx.$executeRaw`select set_config('app.user_id', ${mode.userId}, true)`;
              const m = prismaModelDelegateName(model);
              const d = (tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>)[m];
              if (!d?.[operation]) {
                return query(args);
              }
              return d[operation]!(args);
            });
          }
          return query(args);
        },
      },
    },
  });
}
