import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId?: string | null;
      organizationSlug?: string | null;
      role?: string | null;
    } & DefaultSession['user'];
  }
}
