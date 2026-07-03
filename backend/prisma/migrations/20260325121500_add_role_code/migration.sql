-- Add role code column (compatible with DBs where it may already exist).
ALTER TABLE "Role"
  ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);

-- Fill missing codes for existing rows.
UPDATE "Role"
SET "code" = CASE
  WHEN "name" ILIKE 'superadmin' THEN 'SUPERADMIN'
  WHEN "name" ILIKE 'admin%' OR "name" ILIKE 'administrador%' THEN 'ADMIN'
  WHEN "name" ILIKE 'tecnico%' OR "name" ILIKE 'técnico%' OR "name" ILIKE 'tech%' THEN 'TECH'
  ELSE UPPER(REGEXP_REPLACE(COALESCE("name", ''), '[^A-Za-z0-9]+', '_', 'g'))
END
WHERE "code" IS NULL OR BTRIM("code") = '';

-- Fallback in case normalized names are empty.
UPDATE "Role"
SET "code" = CONCAT('ROLE_', UPPER(SUBSTRING("id" FROM 1 FOR 8)))
WHERE "code" IS NULL OR BTRIM("code") = '';

-- Resolve duplicate codes before adding unique index.
WITH ranked_codes AS (
  SELECT
    "id",
    "code",
    ROW_NUMBER() OVER (PARTITION BY "code" ORDER BY "id") AS rn
  FROM "Role"
)
UPDATE "Role" r
SET "code" = CONCAT(ranked_codes."code", '_', ranked_codes.rn)
FROM ranked_codes
WHERE r."id" = ranked_codes."id"
  AND ranked_codes.rn > 1;

ALTER TABLE "Role"
  ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Role_code_key" ON "Role"("code");
