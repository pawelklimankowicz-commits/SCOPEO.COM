import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/security';

export const authOptions: NextAuthOptions = {
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
      /**
       * Product limitation: JWT/session expose a single `organizationId` / role. We take the first
       * membership (stable order: id asc). There is no workspace switcher API or UI — see README.
       */
      const m = user.memberships[0];
      return { id: user.id, email: user.email, name: user.name, organizationId: m?.organizationId ?? null, organizationSlug: m?.organization.slug ?? null, role: m?.role ?? null } as any;
    }
  })],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.organizationId = (user as any).organizationId; token.organizationSlug = (user as any).organizationSlug; token.role = (user as any).role; } return token; },
    async session({ session, token }) { if (session.user) { (session.user as any).id = token.sub; (session.user as any).organizationId = token.organizationId; (session.user as any).organizationSlug = token.organizationSlug; (session.user as any).role = token.role; } return session; },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}