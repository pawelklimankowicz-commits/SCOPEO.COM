import type { DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    organizationId?: string | null;
    activeOrganizationId?: string | null;
    subscriptionStatus?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
    organizations?: { id: string; name: string; slug: string; role: string }[];
    user: {
      id: string;
      organizationId?: string | null;
      organizationSlug?: string | null;
      role?: string | null;
      onboardingCompletedAt?: string | null;
      onboardingStep?: number;
      organizations?: { id: string; name: string; slug: string; role: string }[];
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    organizationId?: string | null;
    activeOrganizationId?: string | null;
    organizationSlug?: string | null;
    role?: string | null;
    onboardingCompletedAt?: string | null;
    onboardingStep?: number;
    organizations?: { id: string; name: string; slug: string; role: string }[];
    emailVerified?: string | null | Date;
    subscriptionStatus?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
    trialEndsAt?: string | null;
  }
}
