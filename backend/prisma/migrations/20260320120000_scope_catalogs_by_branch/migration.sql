-- Add branch scope columns to branch-personalized catalogs.
ALTER TABLE "DeviceType" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "DocumentType" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "TypeClient" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

-- Remove old global unique constraints by name.
DROP INDEX IF EXISTS "DeviceType_name_key";
DROP INDEX IF EXISTS "DocumentType_name_key";
DROP INDEX IF EXISTS "TypeClient_name_key";

-- Add unique scope per branch.
CREATE UNIQUE INDEX IF NOT EXISTS "DeviceType_branchId_name_key"
  ON "DeviceType"("branchId", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "DocumentType_branchId_name_key"
  ON "DocumentType"("branchId", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "TypeClient_branchId_name_key"
  ON "TypeClient"("branchId", "name");

-- Create branch foreign keys if they are missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DeviceType_branchId_fkey'
  ) THEN
    ALTER TABLE "DeviceType"
      ADD CONSTRAINT "DeviceType_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentType_branchId_fkey'
  ) THEN
    ALTER TABLE "DocumentType"
      ADD CONSTRAINT "DocumentType_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TypeClient_branchId_fkey'
  ) THEN
    ALTER TABLE "TypeClient"
      ADD CONSTRAINT "TypeClient_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
