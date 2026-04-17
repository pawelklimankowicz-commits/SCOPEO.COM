-- Immutable report snapshots for audit-ready closures.
CREATE TABLE "EmissionReportSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportYear" INTEGER,
    "version" INTEGER NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope1Kg" DOUBLE PRECISION NOT NULL,
    "scope2Kg" DOUBLE PRECISION NOT NULL,
    "scope3Kg" DOUBLE PRECISION NOT NULL,
    "totalKg" DOUBLE PRECISION NOT NULL,
    "payloadJson" JSONB NOT NULL,

    CONSTRAINT "EmissionReportSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmissionReportSnapshot_organizationId_version_key" ON "EmissionReportSnapshot"("organizationId", "version");
CREATE UNIQUE INDEX "EmissionReportSnapshot_organizationId_hashSha256_key" ON "EmissionReportSnapshot"("organizationId", "hashSha256");
CREATE INDEX "EmissionReportSnapshot_organizationId_createdAt_idx" ON "EmissionReportSnapshot"("organizationId", "createdAt");

ALTER TABLE "EmissionReportSnapshot"
ADD CONSTRAINT "EmissionReportSnapshot_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
