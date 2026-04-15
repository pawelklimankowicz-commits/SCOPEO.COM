WITH duplicate_suppliers AS (
  SELECT
    "organizationId",
    "name",
    COALESCE("taxId", '') AS normalized_tax_id,
    MIN("id") AS keep_id,
    ARRAY_REMOVE(ARRAY_AGG("id"), MIN("id")) AS remove_ids
  FROM "Supplier"
  GROUP BY 1, 2, 3
  HAVING COUNT(*) > 1
),
repoint_invoices AS (
  UPDATE "Invoice" i
  SET "supplierId" = d.keep_id
  FROM duplicate_suppliers d
  WHERE i."supplierId" = ANY(d.remove_ids)
  RETURNING i."id"
)
DELETE FROM "Supplier" s
USING duplicate_suppliers d
WHERE s."id" = ANY(d.remove_ids);

UPDATE "Supplier"
SET "taxId" = ''
WHERE "taxId" IS NULL;

ALTER TABLE "Supplier"
ALTER COLUMN "taxId" SET DEFAULT '',
ALTER COLUMN "taxId" SET NOT NULL;
