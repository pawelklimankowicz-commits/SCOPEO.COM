import { checkKsefLimit, checkUserLimit } from '@/lib/billing';

export async function requireUserCapacity(organizationId: string) {
  const check = await checkUserLimit(organizationId);
  if (!check.allowed) {
    throw new Error(
      `Osiagnieto limit uzytkownikow planu (${check.used}/${check.limit}). Zmien plan w Ustawieniach -> Billing.`
    );
  }
}

export async function requireKsefCapacity(organizationId: string) {
  const check = await checkKsefLimit(organizationId);
  if (!check.allowed) {
    throw new Error(
      `Osiagnieto limit polaczen KSeF planu (${check.used}/${check.limit}). Zmien plan w Ustawieniach -> Billing.`
    );
  }
}
