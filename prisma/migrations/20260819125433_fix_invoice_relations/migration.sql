/*
  Warnings:

  - You are about to drop the column `medicalRecordId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `payments` table. All the data in the column will be lost.
  - Added the required column `invoiceId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Made the column `paidAt` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_medicalRecordId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_patientId_fkey";

-- DropIndex
DROP INDEX "payments_medicalRecordId_key";

-- AlterTable
DELETE FROM "payments";
ALTER TABLE "payments" DROP COLUMN "medicalRecordId",
DROP COLUMN "patientId",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "invoiceId" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "paidAt" SET NOT NULL,
ALTER COLUMN "paidAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_medicalRecordId_key" ON "invoices"("medicalRecordId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
