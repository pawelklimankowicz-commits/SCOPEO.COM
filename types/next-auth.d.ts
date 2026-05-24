import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
type SessionOrganization = { id: string; name: string; slug: string; role: string };

declare module 'next-auth' {
  interface User extends DefaultUser {
    organizationId?: string | null;
    organizationSlug?: string | null;
    role?: string | null;
  }

  interface Session {
    organizationId?: string | null;
    activeOrganizationId?: string | null;
    subscriptionStatus?: SubscriptionStatus;
    organizations?: SessionOrganization[];
    user: {
      id: string;
      organizationId?: string | null;
      organizationSlug?: string | null;
      role?: string | null;
      emailVerified?: string | null | Date;
      subscriptionStatus?: SubscriptionStatus;
      onboardingCompletedAt?: string | null;
      onboardingStep?: number;
      organizations?: SessionOrganization[];
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
