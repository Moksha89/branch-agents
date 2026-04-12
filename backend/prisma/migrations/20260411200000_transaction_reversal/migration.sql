-- Add reversal tracking fields to transactions
ALTER TABLE "transactions" ADD COLUMN "is_reversal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "transactions" ADD COLUMN "reversed_transaction_id" TEXT;
