ALTER TABLE "Role"
  ADD COLUMN IF NOT EXISTS "companyId" TEXT;

ALTER TABLE "Role"
  ALTER COLUMN "description" DROP NOT NULL;

DROP INDEX IF EXISTS "Role_name_key";

CREATE INDEX IF NOT EXISTS "Role_companyId_idx" ON "Role"("companyId");

CREATE UNIQUE INDEX IF NOT EXISTS "Role_companyId_name_key"
  ON "Role"("companyId", "name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Role_companyId_fkey'
  ) THEN
    ALTER TABLE "Role"
      ADD CONSTRAINT "Role_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "CustomerCompany"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
