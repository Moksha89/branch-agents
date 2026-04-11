import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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

          const balanceBefore = fromAccount.bankBalance;
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

          if (fromAccount.bankBalance < amount) {
            throw new BadRequestException(
              `Insufficient balance. Available: ₹${fromAccount.bankBalance.toLocaleString('en-IN')}`,
            );
          }
          const balanceBefore = fromAccount.bankBalance;
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
          if (fromAccount.bankBalance < amount) {
            throw new BadRequestException(
              `Insufficient balance. Available: ₹${fromAccount.bankBalance.toLocaleString('en-IN')}`,
            );
          }

          const fromBefore = fromAccount.bankBalance;
          const fromAfter = fromBefore - amount;
          const toBefore = toAccount.bankBalance;
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
          if (fromAccount.bankBalance < amount) {
            throw new BadRequestException(
              `Insufficient balance. Available: ₹${fromAccount.bankBalance.toLocaleString('en-IN')}`,
            );
          }

          const fromBefore = fromAccount.bankBalance;
          const fromAfter = fromBefore - amount;
          const toBefore = toAccount.bankBalance;
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
  }

  async findByAccount(accountId: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.prisma.transaction.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
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

  async findByBranch(branchId: string) {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { branchId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
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
}
