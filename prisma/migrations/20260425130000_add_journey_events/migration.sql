-- Analityka first-party: lejek użytkownika (APP per tenant, MARKETING z organizationId = NULL tylko przez bypass)

CREATE TYPE "JourneyEventSource" AS ENUM ('MARKETING', 'APP');

CREATE TABLE "JourneyEvent" (
    "id" TEXT NOT NULL,
    "source" "JourneyEventSource" NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JourneyEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JourneyEvent_organizationId_name_createdAt_idx" ON "JourneyEvent"("organizationId", "name", "createdAt");
CREATE INDEX "JourneyEvent_source_createdAt_idx" ON "JourneyEvent"("source", "createdAt");
CREATE INDEX "JourneyEvent_name_createdAt_idx" ON "JourneyEvent"("name", "createdAt");

ALTER TABLE "JourneyEvent" ADD CONSTRAINT "JourneyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JourneyEvent" ADD CONSTRAINT "JourneyEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JourneyEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "JourneyEvent" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR (
      "organizationId" IS NOT NULL
      AND "organizationId" = current_setting('app.tenant', true)
    )
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR (
      "organizationId" IS NOT NULL
      AND "organizationId" = current_setting('app.tenant', true)
    )
  );
ALTER TABLE "JourneyEvent" FORCE ROW LEVEL SECURITY;
