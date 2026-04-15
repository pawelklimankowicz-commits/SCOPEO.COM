DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MembershipStatus') THEN
    CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
  END IF;
END$$;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'KSEF_LIMIT_WARNING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'USER_LIMIT_WARNING';

ALTER TABLE "Membership"
ADD COLUMN IF NOT EXISTS "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Membership_organizationId_status_idx"
ON "Membership"("organizationId", "status");

CREATE TABLE IF NOT EXISTS "KsefConnection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "taxId" TEXT NOT NULL,
  "tokenEncrypted" TEXT,
  "tokenMasked" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KsefConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KsefConnection_organizationId_taxId_key"
ON "KsefConnection"("organizationId", "taxId");

CREATE INDEX IF NOT EXISTS "KsefConnection_organizationId_idx"
ON "KsefConnection"("organizationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'KsefConnection_organizationId_fkey'
      AND table_name = 'KsefConnection'
  ) THEN
    ALTER TABLE "KsefConnection"
      ADD CONSTRAINT "KsefConnection_organizationId_fkey"
      FOREIGN KEY ("organizationId")
      REFERENCES "Organization"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END$$;
