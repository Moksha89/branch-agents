-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DEBIT_FREEZE', 'CREDIT_FREEZE', 'CYBER', 'CLOSED');

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
