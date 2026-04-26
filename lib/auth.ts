import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { assertProductionAuthEnv } from '@/lib/production-env';
import { runWithRlsBypass } from '@/lib/tenant-rls-context';

function resolveAuthSecret(): string {
  assertProductionAuthEnv();
  const explicit = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (explicit && explicit.trim().length >= 32) return explicit;
  // Dev-only fallback keeps local startup easy when .env is incomplete.
  const seed =
    process.env.DATABASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    'scopeo-fallback-secret';
  return createHash('sha256').update(seed).digest('hex');
}

type SessionOrganization = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

async function loadUserOrganizations(userId: string): Promise<SessionOrganization[]> {
  const memberships = await prisma.membership.findMany({
    where: { userId, status: 'ACTIVE' },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { id: 'asc' },
  });
  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));
}

function pickActiveOrganization(
  organizations: SessionOrganization[],
  requestedId?: string | null,
  currentId?: string | null
) {
  if (requestedId && organizations.some((item) => item.id === requestedId)) return requestedId;
  if (currentId && organizations.some((item) => item.id === currentId)) return currentId;
  return organizations[0]?.id ?? null;
}

export const authOptions: NextAuthOptions = {
  secret: resolveAuthSecret(),
  session: { strategy: 'jwt' },
  providers: [Credentials({
    name: 'credentials',
    credentials: { email: {}, password: {} },
    async authorize(credentials, req) {
      if (!credentials) return null;
      const email = String(credentials.email || '').trim().toLowerCase();
      const password = String(credentials.password || '');
      const ip = getClientIp(req.headers);
      const ipLimit = await checkRateLimit(`login-ip:${ip}`, {
        windowMs: 15 * 60_000,
        maxRequests: 30,
      });
      if (!ipLimit.ok) {
        return null;
      }
      const emailLimit = await checkRateLimit(`login:${email}`, {
        windowMs: 15 * 60_000,
        maxRequests: 10,
      });
      if (!emailLimit.ok) {
        return null;
      }
      return runWithRlsBypass(async () => {
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              orderBy: { id: 'asc' },
              include: { organization: true },
            },
          },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        const m = user.memberships[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: m?.organizationId ?? null,
          organizationSlug: m?.organization.slug ?? null,
          role: m?.role ?? null,
        } as any;
      });
    }
  })],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub ?? '';
        (session.user as any).organizationId = token.activeOrganizationId ?? token.organizationId ?? null;
        (session.user as any).organizationSlug = token.organizationSlug ?? null;
        (session.user as any).role = token.role;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).onboardingCompletedAt = token.onboardingCompletedAt ?? null;
        (session.user as any).onboardingStep = Number(token.onboardingStep ?? 0);
        (session.user as any).organizations = token.organizations ?? [];
        (session.user as any).subscriptionStatus = token.subscriptionStatus ?? 'CANCELED';
      }
      (session as any).organizationId = token.activeOrganizationId ?? token.organizationId ?? null;
      (session as any).organizations = token.organizations ?? [];
      (session as any).activeOrganizationId = token.activeOrganizationId ?? token.organizationId ?? null;
      (session as any).subscriptionStatus = token.subscriptionStatus ?? 'CANCELED';
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      return runWithRlsBypass(async () => {
        if (user) {
          token.organizationId = (user as any).organizationId;
          token.organizationSlug = (user as any).organizationSlug;
          token.role = (user as any).role;
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { emailVerified: true },
          });
          token.emailVerified = dbUser?.emailVerified ?? null;
        }

        const shouldRefreshOrganizations =
          Boolean(user) ||
          trigger === 'update' ||
          !Array.isArray(token.organizations) ||
          (token.organizations as any[]).length === 0;
        if (token.sub && shouldRefreshOrganizations) {
          const organizations = await loadUserOrganizations(String(token.sub));
          token.organizations = organizations;
          const requestedOrgId =
            trigger === 'update' ? ((session as any)?.activeOrganizationId as string | undefined) : undefined;
          const activeOrganizationId = pickActiveOrganization(
            organizations,
            requestedOrgId ?? null,
            (token.activeOrganizationId as string | undefined) ?? (token.organizationId as string | undefined)
          );
          token.activeOrganizationId = activeOrganizationId;
          token.organizationId = activeOrganizationId;
          const active = organizations.find((item) => item.id === activeOrganizationId);
          token.organizationSlug = active?.slug ?? null;
          token.role = active?.role ?? null;
        }

        if (Boolean(user) || trigger === 'update') {
          const organizationId =
            (token.activeOrganizationId as string | undefined) ?? (token.organizationId as string | undefined);
          if (organizationId) {
            const [org, sub] = await Promise.all([
              prisma.organization.findUnique({
                where: { id: organizationId },
                select: { onboardingCompletedAt: true, onboardingStep: true },
              }),
              prisma.subscription.findUnique({
                where: { organizationId },
                select: { status: true, trialEndsAt: true },
              }),
            ]);
            token.onboardingCompletedAt = org?.onboardingCompletedAt?.toISOString() ?? null;
            token.onboardingStep = org?.onboardingStep ?? 0;
            token.subscriptionStatus = sub?.status ?? 'CANCELED';
            token.trialEndsAt = sub?.trialEndsAt?.toISOString() ?? null;
          } else {
            token.subscriptionStatus = 'CANCELED';
          }
        } else if (!token.subscriptionStatus) {
          const organizationId =
            (token.activeOrganizationId as string | undefined) ?? (token.organizationId as string | undefined);
          if (!organizationId) {
            token.subscriptionStatus = 'CANCELED';
          } else {
            const sub = await prisma.subscription.findUnique({
              where: { organizationId },
              select: { status: true, trialEndsAt: true },
            });
            token.subscriptionStatus = sub?.status ?? 'CANCELED';
            token.trialEndsAt = sub?.trialEndsAt?.toISOString() ?? null;
          }
        }
        return token;
      });
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}