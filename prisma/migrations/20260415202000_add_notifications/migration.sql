DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'KSEF_IMPORT_DONE',
      'KSEF_IMPORT_FAILED',
      'REVIEW_SUBMITTED',
      'REVIEW_APPROVED',
      'REVIEW_REJECTED',
      'INVOICE_LIMIT_WARNING',
      'GDPR_REQUEST_RECEIVED',
      'FACTOR_IMPORT_DONE',
      'MEMBER_JOINED',
      'MEMBER_ROLE_CHANGED'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "link" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_organizationId_userId_readAt_idx"
ON "Notification"("organizationId", "userId", "readAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Notification_organizationId_fkey'
      AND table_name = 'Notification'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_organizationId_fkey"
      FOREIGN KEY ("organizationId")
      REFERENCES "Organization"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Notification_userId_fkey'
      AND table_name = 'Notification'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END$$;
