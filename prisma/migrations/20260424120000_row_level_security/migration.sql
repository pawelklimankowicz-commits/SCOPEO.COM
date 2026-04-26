-- Row Level Security: druga warstwa izolacji tenant / użytkownika (GUC: app.tenant, app.user_id, app.rls_bypass)
-- Aplikacja ustawia zmienne przez set_config w transakcji (lib/prisma-rls-extension.ts)

-- Wspólne wyrażenia (TEXT — Prisma cuidy)
-- Tabele z kolumną "organizationId"
-- Tabele: tylko bypass (formularz leadów, tokeny e-mail/reset, import marketingowy)

-- --- EmailVerificationToken, PasswordResetToken, Lead, LeadMarketingConsent: wyłącznie app.rls_bypass
ALTER TABLE "EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "EmailVerificationToken" FOR ALL
  USING (current_setting('app.rls_bypass', true) = 'on')
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on');
ALTER TABLE "EmailVerificationToken" FORCE ROW LEVEL SECURITY;

ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "PasswordResetToken" FOR ALL
  USING (current_setting('app.rls_bypass', true) = 'on')
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on');
ALTER TABLE "PasswordResetToken" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Lead" FOR ALL
  USING (current_setting('app.rls_bypass', true) = 'on')
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on');
ALTER TABLE "Lead" FORCE ROW LEVEL SECURITY;

ALTER TABLE "LeadMarketingConsent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "LeadMarketingConsent" FOR ALL
  USING (current_setting('app.rls_bypass', true) = 'on')
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on');
ALTER TABLE "LeadMarketingConsent" FORCE ROW LEVEL SECURITY;

-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "User" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "id" = current_setting('app.user_id', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "id" = current_setting('app.user_id', true)
  );
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

-- UserConsent
ALTER TABLE "UserConsent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "UserConsent" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "userId" = current_setting('app.user_id', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "userId" = current_setting('app.user_id', true)
  );
ALTER TABLE "UserConsent" FORCE ROW LEVEL SECURITY;

-- Organization: aktywny tenant albo członkostwo użytkownika
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Organization" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "id" = current_setting('app.tenant', true)
    OR EXISTS (
      SELECT 1 FROM "Membership" m
      WHERE m."organizationId" = "Organization"."id"
        AND m."userId" = current_setting('app.user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "id" = current_setting('app.tenant', true)
  );
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;

-- Membership: własne członkostwa lub wiersze w aktywnej organizacji
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Membership" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "userId" = current_setting('app.user_id', true)
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "userId" = current_setting('app.user_id', true)
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "Membership" FORCE ROW LEVEL SECURITY;

-- Prosta izolacja po organizationId
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Subscription" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "Subscription" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Notification" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;

ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "ApiKey" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "ApiKey" FORCE ROW LEVEL SECURITY;

ALTER TABLE "CarbonProfile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "CarbonProfile" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "CarbonProfile" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Supplier" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "Supplier" FORCE ROW LEVEL SECURITY;

ALTER TABLE "KsefConnection" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "KsefConnection" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "KsefConnection" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Invoice" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "Invoice" FORCE ROW LEVEL SECURITY;

ALTER TABLE "EmissionSource" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "EmissionSource" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "EmissionSource" FORCE ROW LEVEL SECURITY;

ALTER TABLE "EmissionFactor" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "EmissionFactor" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "EmissionFactor" FORCE ROW LEVEL SECURITY;

ALTER TABLE "MappingDecision" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "MappingDecision" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "MappingDecision" FORCE ROW LEVEL SECURITY;

ALTER TABLE "ReviewEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "ReviewEvent" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "ReviewEvent" FORCE ROW LEVEL SECURITY;

ALTER TABLE "FactorImportRun" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "FactorImportRun" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "FactorImportRun" FORCE ROW LEVEL SECURITY;

ALTER TABLE "SupplierCategoryHint" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "SupplierCategoryHint" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "SupplierCategoryHint" FORCE ROW LEVEL SECURITY;

ALTER TABLE "EmissionCalculation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "EmissionCalculation" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "EmissionCalculation" FORCE ROW LEVEL SECURITY;

ALTER TABLE "EmissionReportSnapshot" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "EmissionReportSnapshot" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "EmissionReportSnapshot" FORCE ROW LEVEL SECURITY;

ALTER TABLE "BaseYearRecalculationLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "BaseYearRecalculationLog" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "BaseYearRecalculationLog" FORCE ROW LEVEL SECURITY;

ALTER TABLE "FaqAssistantQuery" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "FaqAssistantQuery" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
    OR "organizationId" IS NULL
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
    OR "organizationId" IS NULL
  );
ALTER TABLE "FaqAssistantQuery" FORCE ROW LEVEL SECURITY;

ALTER TABLE "GdprRequest" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "GdprRequest" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "GdprRequest" FORCE ROW LEVEL SECURITY;

ALTER TABLE "ProcessingRecord" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "ProcessingRecord" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "ProcessingRecord" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "Invitation" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "Invitation" FORCE ROW LEVEL SECURITY;

ALTER TABLE "KsefImportJob" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "KsefImportJob" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR "organizationId" = current_setting('app.tenant', true)
  );
ALTER TABLE "KsefImportJob" FORCE ROW LEVEL SECURITY;

-- InvoiceLine: przez fakturę
ALTER TABLE "InvoiceLine" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_rls_all" ON "InvoiceLine" FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM "Invoice" i
      WHERE i."id" = "InvoiceLine"."invoiceId"
        AND i."organizationId" = current_setting('app.tenant', true)
    )
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM "Invoice" i
      WHERE i."id" = "InvoiceLine"."invoiceId"
        AND i."organizationId" = current_setting('app.tenant', true)
    )
  );
ALTER TABLE "InvoiceLine" FORCE ROW LEVEL SECURITY;
