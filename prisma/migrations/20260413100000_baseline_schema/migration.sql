-- CreateEnum
CREATE TYPE "BoundaryApproach" AS ENUM ('operational_control', 'financial_control', 'equity_share');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'ANALYST', 'REVIEWER', 'APPROVER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ScopeKind" AS ENUM ('SCOPE1', 'SCOPE2', 'SCOPE3');

-- CreateEnum
CREATE TYPE "CalculationMethod" AS ENUM ('ACTIVITY', 'SPEND');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('ASSIGNED', 'SENT_TO_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'OVERRIDDEN', 'COMMENTED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('STARTED', 'VALIDATED', 'FAILED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "GdprRequestType" AS ENUM ('ACCESS', 'ERASURE');

-- CreateEnum
CREATE TYPE "GdprRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KsefImportJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RETRY', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "analyticsCookies" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "regionCode" TEXT DEFAULT 'PL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarbonProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "reportingYear" INTEGER NOT NULL,
    "baseYear" INTEGER NOT NULL,
    "boundaryApproach" "BoundaryApproach" NOT NULL,
    "industry" TEXT NOT NULL,
    "ksefTokenMasked" TEXT NOT NULL,
    "ksefTokenEncrypted" TEXT,
    "supportsMarketBased" BOOLEAN NOT NULL DEFAULT false,
    "hasGreenContracts" BOOLEAN NOT NULL DEFAULT false,
    "businessTravelIncluded" BOOLEAN NOT NULL DEFAULT false,
    "employeeCommutingIncluded" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarbonProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplierId" TEXT,
    "externalId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL,
    "netValue" DOUBLE PRECISION NOT NULL,
    "grossValue" DOUBLE PRECISION NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionSource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "methodology" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "validFromYear" INTEGER NOT NULL,
    "validToYear" INTEGER,
    "region" TEXT,
    "notes" TEXT,

    CONSTRAINT "EmissionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "emissionSourceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "ScopeKind" NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "factorValue" DOUBLE PRECISION NOT NULL,
    "factorUnit" TEXT NOT NULL,
    "region" TEXT,
    "regionPriority" INTEGER NOT NULL DEFAULT 100,
    "activityKind" TEXT,
    "year" INTEGER NOT NULL,
    "tags" TEXT,
    "metadataJson" JSONB,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "scope" "ScopeKind" NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "factorCode" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "ruleMatched" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerComment" TEXT,
    "tokensJson" JSONB NOT NULL,
    "currentAssigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MappingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mappingDecisionId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "Role",
    "action" "ReviewAction" NOT NULL,
    "fromStatus" "ReviewStatus",
    "toStatus" "ReviewStatus",
    "fromCategoryCode" TEXT,
    "toCategoryCode" TEXT,
    "fromFactorId" TEXT,
    "toFactorId" TEXT,
    "diffJson" JSONB NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactorImportRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "sourceCode" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "validationJson" JSONB NOT NULL,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactorImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "emissionFactorId" TEXT,
    "mappingDecisionId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "netValue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "scope" "ScopeKind" NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "calculationMethod" "CalculationMethod" NOT NULL,
    "activityValue" DOUBLE PRECISION,
    "activityUnit" TEXT,
    "estimated" BOOLEAN NOT NULL DEFAULT false,
    "overrideCategoryCode" TEXT,
    "overrideFactorId" TEXT,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionCalculation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scope1Kg" DOUBLE PRECISION NOT NULL,
    "scope2Kg" DOUBLE PRECISION NOT NULL,
    "scope3Kg" DOUBLE PRECISION NOT NULL,
    "totalKg" DOUBLE PRECISION NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
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

-- CreateTable
CREATE TABLE "LeadMarketingConsent" (
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

    CONSTRAINT "LeadMarketingConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "inviterUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KsefImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserConsent_userId_key" ON "UserConsent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CarbonProfile_organizationId_key" ON "CarbonProfile"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_name_taxId_key" ON "Supplier"("organizationId", "name", "taxId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_issueDate_idx" ON "Invoice"("organizationId", "issueDate");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_createdAt_idx" ON "Invoice"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_externalId_key" ON "Invoice"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "EmissionSource_organizationId_code_version_key" ON "EmissionSource"("organizationId", "code", "version");

-- CreateIndex
CREATE INDEX "EmissionFactor_organizationId_categoryCode_year_idx" ON "EmissionFactor"("organizationId", "categoryCode", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EmissionFactor_organizationId_code_year_key" ON "EmissionFactor"("organizationId", "code", "year");

-- CreateIndex
CREATE INDEX "MappingDecision_organizationId_status_createdAt_idx" ON "MappingDecision"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewEvent_organizationId_createdAt_idx" ON "ReviewEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "FactorImportRun_organizationId_createdAt_idx" ON "FactorImportRun"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_scope_categoryCode_idx" ON "InvoiceLine"("invoiceId", "scope", "categoryCode");

-- CreateIndex
CREATE INDEX "InvoiceLine_mappingDecisionId_idx" ON "InvoiceLine"("mappingDecisionId");

-- CreateIndex
CREATE INDEX "EmissionCalculation_organizationId_createdAt_idx" ON "EmissionCalculation"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadMarketingConsent_leadId_channel_grantedAt_idx" ON "LeadMarketingConsent"("leadId", "channel", "grantedAt");

-- CreateIndex
CREATE INDEX "GdprRequest_organizationId_status_createdAt_idx" ON "GdprRequest"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GdprRequest_subjectEmail_idx" ON "GdprRequest"("subjectEmail");

-- CreateIndex
CREATE INDEX "ProcessingRecord_organizationId_createdAt_idx" ON "ProcessingRecord"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessingRecord_eventType_createdAt_idx" ON "ProcessingRecord"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_status_createdAt_idx" ON "Invitation"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Invitation_email_status_idx" ON "Invitation"("email", "status");

-- CreateIndex
CREATE INDEX "KsefImportJob_organizationId_status_nextAttemptAt_createdAt_idx" ON "KsefImportJob"("organizationId", "status", "nextAttemptAt", "createdAt");

-- CreateIndex
CREATE INDEX "KsefImportJob_organizationId_referenceNumber_createdAt_idx" ON "KsefImportJob"("organizationId", "referenceNumber", "createdAt");

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarbonProfile" ADD CONSTRAINT "CarbonProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionSource" ADD CONSTRAINT "EmissionSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionFactor" ADD CONSTRAINT "EmissionFactor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionFactor" ADD CONSTRAINT "EmissionFactor_emissionSourceId_fkey" FOREIGN KEY ("emissionSourceId") REFERENCES "EmissionSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingDecision" ADD CONSTRAINT "MappingDecision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_mappingDecisionId_fkey" FOREIGN KEY ("mappingDecisionId") REFERENCES "MappingDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactorImportRun" ADD CONSTRAINT "FactorImportRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_emissionFactorId_fkey" FOREIGN KEY ("emissionFactorId") REFERENCES "EmissionFactor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_mappingDecisionId_fkey" FOREIGN KEY ("mappingDecisionId") REFERENCES "MappingDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionCalculation" ADD CONSTRAINT "EmissionCalculation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMarketingConsent" ADD CONSTRAINT "LeadMarketingConsent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GdprRequest" ADD CONSTRAINT "GdprRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingRecord" ADD CONSTRAINT "ProcessingRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KsefImportJob" ADD CONSTRAINT "KsefImportJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
