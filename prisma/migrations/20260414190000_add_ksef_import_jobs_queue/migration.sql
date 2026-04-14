CREATE TYPE "KsefImportJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RETRY', 'SUCCEEDED', 'FAILED');

CREATE TABLE "KsefImportJob" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "referenceNumber" TEXT NOT NULL,
  "status" "KsefImportJobStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "payloadJson" JSONB,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KsefImportJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KsefImportJob_organizationId_status_nextAttemptAt_createdAt_idx"
  ON "KsefImportJob"("organizationId", "status", "nextAttemptAt", "createdAt");
CREATE INDEX "KsefImportJob_organizationId_referenceNumber_createdAt_idx"
  ON "KsefImportJob"("organizationId", "referenceNumber", "createdAt");

ALTER TABLE "KsefImportJob"
  ADD CONSTRAINT "KsefImportJob_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
