-- NextAuth JWT + Credentials: Session/Account/VerificationToken were unused (no PrismaAdapter persistence).
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "VerificationToken";
