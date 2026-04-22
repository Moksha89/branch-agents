import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsGateway,
  ) {}

  // FIX #2: Enforce account status on transactions
  private validateAccountStatus(account: { status: string; fullName: string }, action: 'debit' | 'credit') {
    const { status, fullName } = account;
    if (status === 'CLOSED') {
      throw new BadRequestException(`Account "${fullName}" is CLOSED. No transactions allowed.`);
    }
    if (status === 'CYBER') {
      throw new BadRequestException(`Account "${fullName}" is under CYBER investigation. No transactions allowed.`);
    }
    if (status === 'DEBIT_FREEZE' && action === 'debit') {
      throw new BadRequestException(`Account "${fullName}" has DEBIT FREEZE. Withdrawals and outgoing transfers are blocked.`);
    }
    if (status === 'CREDIT_FREEZE' && action === 'credit') {
      throw new BadRequestException(`Account "${fullName}" has CREDIT FREEZE. Deposits and incoming transfers are blocked.`);
    }
  }

  // FIX #7: Use interactive transactions to prevent race conditions
  async create(dto: CreateTransactionDto, userId: string) {
    const amount = dto.amount;

    const result = await this.prisma.$transaction(async (tx) => {
      // Lock the source account row with findFirst + select for update behavior
      const fromAccount = await tx.bankAccount.findUnique({
        where: { id: dto.fromAccountId },
        include: { branch: true },
      });
      if (!fromAccount) {
        throw new NotFoundException('Source account not found');
      }

      switch (dto.type) {
        case 'DEPOSIT': {
          this.validateAccountStatus(fromAccount, 'credit');

          const balanceBefore = Number(fromAccount.bankBalance);
          const balanceAfter = balanceBefore + amount;

          const transaction = await tx.transaction.create({
            data: {
              type: 'DEPOSIT',
              amount,
              balanceBefore,
              balanceAfter,
              description: dto.description || `Deposit of ₹${amount.toLocaleString('en-IN')}`,
              fromAccountId: fromAccount.id,
              createdById: userId,
            },
            include: {
              fromAccount: { select: { id: true, fullName: true, accountNumber: true } },
              createdBy: { select: { id: true, fullName: true, username: true } },
            },
          });
          await tx.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: balanceAfter },
          });
          return transaction;
        }

        case 'WITHDRAWAL': {
          this.validateAccountStatus(fromAccount, 'debit');

          if (Number(fromAccount.bankBalance) < amount) {
            throw new BadRequestException(
              `Insufficient balance. Available: ₹${Number(fromAccount.bankBalance).toLocaleString('en-IN')}`,
            );
          }
          const balanceBefore = Number(fromAccount.bankBalance);
          const balanceAfter = balanceBefore - amount;

          const transaction = await tx.transaction.create({
            data: {
              type: 'WITHDRAWAL',
              amount,
              balanceBefore,
              balanceAfter,
              description: dto.description || `Withdrawal of ₹${amount.toLocaleString('en-IN')}`,
              fromAccountId: fromAccount.id,
              createdById: userId,
            },
            include: {
              fromAccount: { select: { id: true, fullName: true, accountNumber: true } },
              createdBy: { select: { id: true, fullName: true, username: true } },
            },
          });
          await tx.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: balanceAfter },
          });
          return transaction;
        }

        case 'TRANSFER': {
          if (!dto.toAccountId) {
            throw new BadRequestException('Destination account is required for internal transfer');
          }
          this.validateAccountStatus(fromAccount, 'debit');

          const toAccount = await tx.bankAccount.findUnique({
            where: { id: dto.toAccountId },
            include: { branch: true },
          });
          if (!toAccount) {
            throw new NotFoundException('Destination account not found');
          }
          this.validateAccountStatus(toAccount, 'credit');

          if (toAccount.branchId !== fromAccount.branchId) {
            throw new BadRequestException(
              'Internal transfer must be within the same branch. Use Out Transfer for cross-branch.',
            );
          }
          if (Number(fromAccount.bankBalance) < amount) {
            throw new BadRequestException(
              `Insufficient balance. Available: ₹${Number(fromAccount.bankBalance).toLocaleString('en-IN')}`,
            );
          }

          const fromBefore = Number(fromAccount.bankBalance);
          const fromAfter = fromBefore - amount;
          const toBefore = Number(toAccount.bankBalance);
          const toAfter = toBefore + amount;

          const senderTx = await tx.transaction.create({
            data: {
              type: 'TRANSFER',
              amount,
              balanceBefore: fromBefore,
              balanceAfter: fromAfter,
              description:
                dto.description ||
                `Transfer to ${toAccount.fullName} (${toAccount.accountNumber})`,
              fromAccountId: fromAccount.id,
              toAccountId: toAccount.id,
              createdById: userId,
            },
            include: {
              fromAccount: { select: { id: true, fullName: true, accountNumber: true } },
              toAccount: { select: { id: true, fullName: true, accountNumber: true } },
              createdBy: { select: { id: true, fullName: true, username: true } },
            },
          });
          await tx.transaction.create({
            data: {
              type: 'DEPOSIT',
              amount,
              balanceBefore: toBefore,
              balanceAfter: toAfter,
              description: `Received from ${fromAccount.fullName} (${fromAccount.accountNumber})`,
              fromAccountId: toAccount.id,
              toAccountId: fromAccount.id,
              createdById: userId,
            },
          });
          await tx.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: fromAfter },
          });
          await tx.bankAccount.update({
            where: { id: toAccount.id },
            data: { bankBalance: toAfter },
          });
          return senderTx;
        }

        case 'OUT_TRANSFER': {
          if (!dto.toAccountId) {
            throw new BadRequestException('Destination account is required for out transfer');
          }
          this.validateAccountStatus(fromAccount, 'debit');

          const toAccount = await tx.bankAccount.findUnique({
            where: { id: dto.toAccountId },
            include: { branch: true },
          });
          if (!toAccount) {
            throw new NotFoundException('Destination account not found');
          }
          this.validateAccountStatus(toAccount, 'credit');

          if (toAccount.branchId === fromAccount.branchId) {
            throw new BadRequestException(
              'Out transfer must be to a different branch. Use Transfer for same branch.',
            );
          }
          if (Number(fromAccount.bankBalance) < amount) {
            throw new BadRequestException(
              `Insufficient balance. Available: ₹${Number(fromAccount.bankBalance).toLocaleString('en-IN')}`,
            );
          }

          const fromBefore = Number(fromAccount.bankBalance);
          const fromAfter = fromBefore - amount;
          const toBefore = Number(toAccount.bankBalance);
          const toAfter = toBefore + amount;

          const senderTx = await tx.transaction.create({
            data: {
              type: 'OUT_TRANSFER',
              amount,
              balanceBefore: fromBefore,
              balanceAfter: fromAfter,
              description:
                dto.description ||
                `Out transfer to ${toAccount.fullName} (${toAccount.branch.name})`,
              fromAccountId: fromAccount.id,
              toAccountId: toAccount.id,
              createdById: userId,
            },
            include: {
              fromAccount: { select: { id: true, fullName: true, accountNumber: true } },
              toAccount: { select: { id: true, fullName: true, accountNumber: true } },
              createdBy: { select: { id: true, fullName: true, username: true } },
            },
          });
          await tx.transaction.create({
            data: {
              type: 'DEPOSIT',
              amount,
              balanceBefore: toBefore,
              balanceAfter: toAfter,
              description: `Received from ${fromAccount.fullName} (${fromAccount.branch.name})`,
              fromAccountId: toAccount.id,
              toAccountId: fromAccount.id,
              createdById: userId,
            },
          });
          await tx.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: fromAfter },
          });
          await tx.bankAccount.update({
            where: { id: toAccount.id },
            data: { bankBalance: toAfter },
          });
          return senderTx;
        }

        default:
          throw new BadRequestException('Invalid transaction type');
      }
    }, { isolationLevel: 'Serializable' });

    // FIX #18: Audit log for transactions
    this.audit.logTransaction(dto.type, userId, result.id, {
      amount,
      fromAccountId: dto.fromAccountId,
      toAccountId: dto.toAccountId || null,
    });

    // Feature 5: Real-time notification
    try {
      const fromAcct = await this.prisma.bankAccount.findUnique({
        where: { id: dto.fromAccountId },
        include: { branch: { select: { name: true } } },
      });
      if (fromAcct) {
        this.notifications.notifyTransaction({
          type: dto.type,
          amount,
          accountName: fromAcct.fullName,
          branchName: fromAcct.branch.name,
        });
      }
    } catch {}

    return result;
  }

  async findByAccount(accountId: string, page = 1, limit = 100) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const where = {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
    };
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          fromAccount: {
            select: { id: true, fullName: true, accountNumber: true, bankName: true },
          },
          toAccount: {
            select: { id: true, fullName: true, accountNumber: true, bankName: true },
          },
          createdBy: { select: { id: true, fullName: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    // Normalize Decimal fields to plain numbers
    const normalizedData = data.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
      balanceBefore: Number(tx.balanceBefore),
      balanceAfter: Number(tx.balanceAfter),
    }));
    return { data: normalizedData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByBranch(branchId: string, page = 1, limit = 100) {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { branchId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const where = {
      OR: [
        { fromAccountId: { in: accountIds } },
        { toAccountId: { in: accountIds } },
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          fromAccount: {
            select: { id: true, fullName: true, accountNumber: true, bankName: true },
          },
          toAccount: {
            select: { id: true, fullName: true, accountNumber: true, bankName: true },
          },
          createdBy: { select: { id: true, fullName: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    // Normalize Decimal fields to plain numbers
    const normalizedData = data.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
      balanceBefore: Number(tx.balanceBefore),
      balanceAfter: Number(tx.balanceAfter),
    }));
    return { data: normalizedData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      include: {
        fromAccount: {
          select: { id: true, fullName: true, accountNumber: true, bankName: true },
        },
        toAccount: {
          select: { id: true, fullName: true, accountNumber: true, bankName: true },
        },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reverse(transactionId: string, userId: string, reason?: string) {
    const original = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fromAccount: { include: { branch: true } },
        toAccount: { include: { branch: true } },
      },
    });
    if (!original) {
      throw new NotFoundException('Transaction not found');
    }
    if (original.isReversal) {
      throw new BadRequestException('Cannot reverse a reversal transaction');
    }
    // Check if already reversed
    const existingReversal = await this.prisma.transaction.findFirst({
      where: { reversedTransactionId: transactionId },
    });
    if (existingReversal) {
      throw new BadRequestException('This transaction has already been reversed');
    }

    const amount = Number(original.amount);
    const desc = reason
      ? `REVERSAL: ${reason} (Original TX: ${transactionId.slice(0, 8)})`
      : `REVERSAL of transaction ${transactionId.slice(0, 8)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      switch (original.type) {
        case 'DEPOSIT': {
          // Reverse deposit = withdrawal from the account
          const account = await tx.bankAccount.findUnique({ where: { id: original.fromAccountId } });
          if (!account) throw new NotFoundException('Account not found');
          const balanceBefore = Number(account.bankBalance);
          if (balanceBefore < amount) {
            throw new BadRequestException(`Insufficient balance to reverse. Available: ₹${balanceBefore.toLocaleString('en-IN')}`);
          }
          const balanceAfter = balanceBefore - amount;
          const reversal = await tx.transaction.create({
            data: {
              type: 'WITHDRAWAL',
              amount,
              balanceBefore,
              balanceAfter,
              description: desc,
              fromAccountId: original.fromAccountId,
              createdById: userId,
              isReversal: true,
              reversedTransactionId: transactionId,
            },
            include: {
              fromAccount: { select: { id: true, fullName: true, accountNumber: true } },
              createdBy: { select: { id: true, fullName: true, username: true } },
            },
          });
          await tx.bankAccount.update({
            where: { id: original.fromAccountId },
            data: { bankBalance: balanceAfter },
          });
          return reversal;
        }

        case 'WITHDRAWAL': {
          // Reverse withdrawal = deposit to the account
          const account = await tx.bankAccount.findUnique({ where: { id: original.fromAccountId } });
          if (!account) throw new NotFoundException('Account not found');
          const balanceBefore = Number(account.bankBalance);
          const balanceAfter = balanceBefore + amount;
          const reversal = await tx.transaction.create({
            data: {
              type: 'DEPOSIT',
              amount,
              balanceBefore,
              balanceAfter,
              description: desc,
              fromAccountId: original.fromAccountId,
              createdById: userId,
              isReversal: true,
              reversedTransactionId: transactionId,
            },
            include: {
              fromAccount: { select: { id: true, fullName: true, accountNumber: true } },
              createdBy: { select: { id: true, fullName: true, username: true } },
            },
          });
          await tx.bankAccount.update({
            where: { id: original.fromAccountId },
            data: { bankBalance: balanceAfter },
          });
          return reversal;
        }

        case 'TRANSFER':
        case 'OUT_TRANSFER': {
          // Reverse transfer: move money back from toAccount to fromAccount
          if (!original.toAccountId) {
            throw new BadRequestException('Cannot reverse: destination account missing');
          }
          const fromAcct = await tx.bankAccount.findUnique({ where: { id: original.fromAccountId } });
          const toAcct = await tx.bankAccount.findUnique({ where: { id: original.toAccountId } });
          if (!fromAcct || !toAcct) throw new NotFoundException('Account(s) not found');

          const toBalanceBefore = Number(toAcct.bankBalance);
          if (toBalanceBefore < amount) {
            throw new BadRequestException(`Insufficient balance in destination to reverse. Available: ₹${toBalanceBefore.toLocaleString('en-IN')}`);
          }
          const toBalanceAfter = toBalanceBefore - amount;
          const fromBalanceBefore = Number(fromAcct.bankBalance);
          const fromBalanceAfter = fromBalanceBefore + amount;

          // Create reversal for the sender (gets money back)
          const reversal = await tx.transaction.create({
            data: {
              type: original.type,
              amount,
              balanceBefore: fromBalanceBefore,
              balanceAfter: fromBalanceAfter,
              description: desc,
              fromAccountId: original.toAccountId,
              toAccountId: original.fromAccountId,
              createdById: userId,
              isReversal: true,
              reversedTransactionId: transactionId,
            },
            include: {
              fromAccount: { select: { id: true, fullName: true, accountNumber: true } },
              toAccount: { select: { id: true, fullName: true, accountNumber: true } },
              createdBy: { select: { id: true, fullName: true, username: true } },
            },
          });

          await tx.bankAccount.update({
            where: { id: original.fromAccountId },
            data: { bankBalance: fromBalanceAfter },
          });
          await tx.bankAccount.update({
            where: { id: original.toAccountId },
            data: { bankBalance: toBalanceAfter },
          });
          return reversal;
        }

        default:
          throw new BadRequestException('Unknown transaction type');
      }
    }, { isolationLevel: 'Serializable' });

    this.audit.logTransaction('REVERSAL', userId, result.id, {
      originalTransactionId: transactionId,
      amount,
      reason: reason || 'No reason provided',
    });

    return result;
  }
}
