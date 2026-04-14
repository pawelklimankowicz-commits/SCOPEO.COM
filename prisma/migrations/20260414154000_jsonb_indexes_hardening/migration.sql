-- Move JSON payload columns to jsonb and add operational indexes.
ALTER TABLE "EmissionFactor"
  ALTER COLUMN "metadataJson" TYPE jsonb USING
    CASE WHEN "metadataJson" IS NULL THEN NULL ELSE "metadataJson"::jsonb END;

ALTER TABLE "MappingDecision"
  ALTER COLUMN "tokensJson" TYPE jsonb USING
    CASE WHEN "tokensJson" IS NULL OR "tokensJson" = '' THEN '{}'::jsonb ELSE "tokensJson"::jsonb END;

ALTER TABLE "ReviewEvent"
  ALTER COLUMN "diffJson" TYPE jsonb USING
    CASE WHEN "diffJson" IS NULL OR "diffJson" = '' THEN '{}'::jsonb ELSE "diffJson"::jsonb END;

ALTER TABLE "FactorImportRun"
  ALTER COLUMN "validationJson" TYPE jsonb USING
    CASE WHEN "validationJson" IS NULL OR "validationJson" = '' THEN '[]'::jsonb ELSE "validationJson"::jsonb END;

ALTER TABLE "EmissionCalculation"
  ALTER COLUMN "summaryJson" TYPE jsonb USING
    CASE WHEN "summaryJson" IS NULL OR "summaryJson" = '' THEN '{}'::jsonb ELSE "summaryJson"::jsonb END;

CREATE INDEX IF NOT EXISTS "Invoice_organizationId_issueDate_idx"
  ON "Invoice" ("organizationId", "issueDate");
CREATE INDEX IF NOT EXISTS "Invoice_organizationId_createdAt_idx"
  ON "Invoice" ("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "EmissionFactor_organizationId_categoryCode_year_idx"
  ON "EmissionFactor" ("organizationId", "categoryCode", "year");
CREATE INDEX IF NOT EXISTS "MappingDecision_organizationId_status_createdAt_idx"
  ON "MappingDecision" ("organizationId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "ReviewEvent_organizationId_createdAt_idx"
  ON "ReviewEvent" ("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "FactorImportRun_organizationId_createdAt_idx"
  ON "FactorImportRun" ("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "InvoiceLine_invoiceId_scope_categoryCode_idx"
  ON "InvoiceLine" ("invoiceId", "scope", "categoryCode");
CREATE INDEX IF NOT EXISTS "InvoiceLine_mappingDecisionId_idx"
  ON "InvoiceLine" ("mappingDecisionId");
CREATE INDEX IF NOT EXISTS "EmissionCalculation_organizationId_createdAt_idx"
  ON "EmissionCalculation" ("organizationId", "createdAt");
