-- El tipo de cliente y el tipo de documento pasan a ser opcionales.
ALTER TABLE "Client" ALTER COLUMN "typeClientId" DROP NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "documentTypeId" DROP NOT NULL;
