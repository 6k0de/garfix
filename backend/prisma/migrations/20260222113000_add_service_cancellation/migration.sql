-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('CASH', 'BANK');

-- CreateTable
CREATE TABLE "ServiceCancellation" (
    "id" TEXT NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,
    "statusId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "totalPaid" DOUBLE PRECISION NOT NULL,
    "debt" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "hasRefund" BOOLEAN NOT NULL,
    "refundMethod" "RefundMethod",
    "cashFromBox" BOOLEAN,
    "bankAccount" TEXT,
    "bankFromBox" BOOLEAN,
    "sourceBoxName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCancellation_serviceRequestId_key" ON "ServiceCancellation"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "ServiceCancellation" ADD CONSTRAINT "ServiceCancellation_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCancellation" ADD CONSTRAINT "ServiceCancellation_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
