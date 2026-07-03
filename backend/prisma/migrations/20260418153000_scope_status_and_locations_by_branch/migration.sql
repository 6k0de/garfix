-- Scope statuses and locations by branch.
ALTER TABLE "Status" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

DROP INDEX IF EXISTS "Status_name_key";
DROP INDEX IF EXISTS "Location_name_key";

CREATE INDEX IF NOT EXISTS "Status_branchId_idx"
  ON "Status"("branchId");

CREATE UNIQUE INDEX IF NOT EXISTS "Status_branchId_name_key"
  ON "Status"("branchId", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "Location_branchId_name_key"
  ON "Location"("branchId", "name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Status_branchId_fkey'
  ) THEN
    ALTER TABLE "Status"
      ADD CONSTRAINT "Status_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Copy previously global statuses into every existing branch so current data keeps working.
INSERT INTO "Status" ("id", "name", "description", "colorHex", "branchId")
SELECT
  CONCAT(global_status."id", '_', branch."id"),
  global_status."name",
  global_status."description",
  global_status."colorHex",
  branch."id"
FROM "Status" AS global_status
CROSS JOIN "Branch" AS branch
WHERE global_status."branchId" IS NULL
ON CONFLICT ("branchId", "name") DO NOTHING;

-- Repoint existing services to the status row that belongs to their branch.
UPDATE "ServiceRequest" AS service_request
SET "statusId" = (
  SELECT branch_status."id"
  FROM "Status" AS global_status
  JOIN "Status" AS branch_status
    ON branch_status."name" = global_status."name"
   AND branch_status."branchId" = service_request."branchId"
  WHERE global_status."id" = service_request."statusId"
    AND global_status."branchId" IS NULL
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM "Status" AS global_status
  JOIN "Status" AS branch_status
    ON branch_status."name" = global_status."name"
   AND branch_status."branchId" = service_request."branchId"
  WHERE global_status."id" = service_request."statusId"
    AND global_status."branchId" IS NULL
);

UPDATE "StatusHistory" AS history
SET "statusId" = (
  SELECT branch_status."id"
  FROM "ServiceRequest" AS service_request
  JOIN "Status" AS global_status
    ON global_status."id" = history."statusId"
  JOIN "Status" AS branch_status
    ON branch_status."name" = global_status."name"
   AND branch_status."branchId" = service_request."branchId"
  WHERE service_request."id" = history."serviceRequestId"
    AND global_status."branchId" IS NULL
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM "ServiceRequest" AS service_request
  JOIN "Status" AS global_status
    ON global_status."id" = history."statusId"
  JOIN "Status" AS branch_status
    ON branch_status."name" = global_status."name"
   AND branch_status."branchId" = service_request."branchId"
  WHERE service_request."id" = history."serviceRequestId"
    AND global_status."branchId" IS NULL
);

UPDATE "ServiceCancellation" AS cancellation
SET "statusId" = (
  SELECT branch_status."id"
  FROM "ServiceRequest" AS service_request
  JOIN "Status" AS global_status
    ON global_status."id" = cancellation."statusId"
  JOIN "Status" AS branch_status
    ON branch_status."name" = global_status."name"
   AND branch_status."branchId" = service_request."branchId"
  WHERE service_request."id" = cancellation."serviceRequestId"
    AND global_status."branchId" IS NULL
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM "ServiceRequest" AS service_request
  JOIN "Status" AS global_status
    ON global_status."id" = cancellation."statusId"
  JOIN "Status" AS branch_status
    ON branch_status."name" = global_status."name"
   AND branch_status."branchId" = service_request."branchId"
  WHERE service_request."id" = cancellation."serviceRequestId"
    AND global_status."branchId" IS NULL
);
