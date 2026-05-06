-- AlterTable: Convert Float columns to Decimal(15,2) for monetary precision

-- BankAccount.bankBalance
ALTER TABLE "bank_accounts" ALTER COLUMN "bank_balance" TYPE DECIMAL(15, 2);

-- Transaction.amount, balanceBefore, balanceAfter
ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE DECIMAL(15, 2);
ALTER TABLE "transactions" ALTER COLUMN "balance_before" TYPE DECIMAL(15, 2);
ALTER TABLE "transactions" ALTER COLUMN "balance_after" TYPE DECIMAL(15, 2);

-- DailyReport.totalDeposit, totalWithdrawal, playerBalance, profitLoss
ALTER TABLE "daily_reports" ALTER COLUMN "total_deposit" TYPE DECIMAL(15, 2);
ALTER TABLE "daily_reports" ALTER COLUMN "total_withdrawal" TYPE DECIMAL(15, 2);
ALTER TABLE "daily_reports" ALTER COLUMN "player_balance" TYPE DECIMAL(15, 2);
ALTER TABLE "daily_reports" ALTER COLUMN "profit_loss" TYPE DECIMAL(15, 2);
