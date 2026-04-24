-- Zgłoszenia uwag użytkowników + szkic zadania technicznego (LLM)

CREATE TYPE "ProductFeedbackCategory" AS ENUM ('BUG', 'FEATURE', 'UX', 'DATA', 'INTEGRATION', 'OTHER');
CREATE TYPE "ProductFeedbackStatus" AS ENUM ('NEW', 'SEEN', 'ARCHIVED');

CREATE TABLE "ProductUserFeedback" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "submitterName" TEXT,
    "submitterEmail" TEXT NOT NULL,
    "category" "ProductFeedbackCategory" NOT NULL,
    "userTitle" TEXT NOT NULL,
    "userDescription" TEXT NOT NULL,
    "pageContext" TEXT,
    "status" "ProductFeedbackStatus" NOT NULL DEFAULT 'NEW',
    "technicalTaskTitle" TEXT,
    "technicalTaskBody" TEXT,
    "technicalLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "llmError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductUserFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductUserFeedback_organizationId_createdAt_idx" ON "ProductUserFeedback"("organizationId", "createdAt");
CREATE INDEX "ProductUserFeedback_status_createdAt_idx" ON "ProductUserFeedback"("status", "createdAt");

ALTER TABLE "ProductUserFeedback" ADD CONSTRAINT "ProductUserFeedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductUserFeedback" ADD CONSTRAINT "ProductUserFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductUserFeedback" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "ProductUserFeedback" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "ProductUserFeedback" FORCE ROW LEVEL SECURITY;
