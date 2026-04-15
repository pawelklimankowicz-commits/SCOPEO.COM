ALTER TABLE "InvoiceLine"
ADD COLUMN IF NOT EXISTS "classificationReasoning" TEXT;

CREATE TABLE IF NOT EXISTS "SupplierCategoryHint" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "categoryCode" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "sampleCount" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierCategoryHint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SupplierCategoryHint_organizationId_supplierId_categoryCode_key"
ON "SupplierCategoryHint"("organizationId", "supplierId", "categoryCode");

CREATE INDEX IF NOT EXISTS "SupplierCategoryHint_supplierId_idx"
ON "SupplierCategoryHint"("supplierId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'SupplierCategoryHint_supplierId_fkey'
      AND table_name = 'SupplierCategoryHint'
  ) THEN
    ALTER TABLE "SupplierCategoryHint"
      ADD CONSTRAINT "SupplierCategoryHint_supplierId_fkey"
      FOREIGN KEY ("supplierId")
      REFERENCES "Supplier"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END$$;
