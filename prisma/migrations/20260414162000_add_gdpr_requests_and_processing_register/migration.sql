CREATE TYPE "GdprRequestType" AS ENUM ('ACCESS', 'ERASURE');
CREATE TYPE "GdprRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

CREATE TABLE "GdprRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requesterUserId" TEXT,
  "subjectEmail" TEXT NOT NULL,
  "type" "GdprRequestType" NOT NULL,
  "status" "GdprRequestStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "processedAt" TIMESTAMP(3),
  "processedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GdprRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcessingRecord" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "eventType" TEXT NOT NULL,
  "subjectRef" TEXT,
  "legalBasis" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcessingRecord_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GdprRequest"
  ADD CONSTRAINT "GdprRequest_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProcessingRecord"
  ADD CONSTRAINT "ProcessingRecord_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "GdprRequest_organizationId_status_createdAt_idx"
  ON "GdprRequest"("organizationId", "status", "createdAt");
CREATE INDEX "GdprRequest_subjectEmail_idx"
  ON "GdprRequest"("subjectEmail");
CREATE INDEX "ProcessingRecord_organizationId_createdAt_idx"
  ON "ProcessingRecord"("organizationId", "createdAt");
CREATE INDEX "ProcessingRecord_eventType_createdAt_idx"
  ON "ProcessingRecord"("eventType", "createdAt");
