DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketingChannel') THEN
    CREATE TYPE "MarketingChannel" AS ENUM ('EMAIL', 'PHONE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "invoices" TEXT NOT NULL,
  "message" TEXT,
  "phone" TEXT,
  "acceptPrivacy" BOOLEAN NOT NULL DEFAULT true,
  "marketingEmail" BOOLEAN NOT NULL DEFAULT false,
  "marketingPhone" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeadMarketingConsent" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "channel" "MarketingChannel" NOT NULL,
  "consentText" TEXT NOT NULL,
  "consentVersion" TEXT NOT NULL,
  "legalBasis" TEXT NOT NULL DEFAULT 'art. 6 ust. 1 lit. a RODO',
  "formPath" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadMarketingConsent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeadMarketingConsent_leadId_fkey" FOREIGN KEY ("leadId")
    REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LeadMarketingConsent_leadId_channel_grantedAt_idx"
  ON "LeadMarketingConsent"("leadId", "channel", "grantedAt");
