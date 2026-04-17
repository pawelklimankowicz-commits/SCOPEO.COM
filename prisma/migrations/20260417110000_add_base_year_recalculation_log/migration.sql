CREATE TABLE "BaseYearRecalculationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "previousBaseYear" INTEGER NOT NULL,
    "newBaseYear" INTEGER NOT NULL,
    "triggerType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "impactSummaryJson" JSONB NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorEmail" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaseYearRecalculationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BaseYearRecalculationLog_organizationId_createdAt_idx"
  ON "BaseYearRecalculationLog"("organizationId", "createdAt");

ALTER TABLE "BaseYearRecalculationLog"
ADD CONSTRAINT "BaseYearRecalculationLog_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
