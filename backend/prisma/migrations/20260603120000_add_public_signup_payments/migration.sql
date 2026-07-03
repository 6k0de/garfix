CREATE TABLE "PublicSignupPayment" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mercadoPagoStatus" TEXT,
    "mercadoPagoStatusDetail" TEXT,
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "mercadoPagoInitPoint" TEXT,
    "mercadoPagoSandboxInitPoint" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "subscriptionPlan" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "initialBranchName" TEXT,
    "initialBranchAddress" TEXT,
    "companyId" TEXT,
    "userId" TEXT,
    "rawPayment" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicSignupPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicSignupPayment_mercadoPagoPreferenceId_key" ON "PublicSignupPayment"("mercadoPagoPreferenceId");
CREATE UNIQUE INDEX "PublicSignupPayment_mercadoPagoPaymentId_key" ON "PublicSignupPayment"("mercadoPagoPaymentId");
CREATE INDEX "PublicSignupPayment_email_idx" ON "PublicSignupPayment"("email");
CREATE INDEX "PublicSignupPayment_status_idx" ON "PublicSignupPayment"("status");
CREATE INDEX "PublicSignupPayment_createdAt_idx" ON "PublicSignupPayment"("createdAt");
