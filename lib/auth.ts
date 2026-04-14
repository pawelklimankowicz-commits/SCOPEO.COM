import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/security';
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [Credentials({
    name: 'credentials',
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      if (!credentials) return null;
      const email = String(credentials.email || '').trim().toLowerCase();
      const password = String(credentials.password || '');
      const loginLimit = await checkRateLimit(`login:${email}`, {
        windowMs: 15 * 60_000,
        max: 10,
        blockMs: 30 * 60_000,
      });
      if (!loginLimit.ok) {
        return null;
      }
      const user = await prisma.user.findUnique({ where: { email }, include: { memberships: { include: { organization: true } } } });
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
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