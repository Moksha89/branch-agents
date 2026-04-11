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

  async create(dto: CreateTransactionDto, userId: string) {
    const fromAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.fromAccountId },
      include: { branch: true },
    });
    if (!fromAccount) {
      throw new NotFoundException('Source account not found');
    }

    const amount = dto.amount;

    switch (dto.type) {
      case 'DEPOSIT': {
        const balanceBefore = fromAccount.bankBalance;
        const balanceAfter = balanceBefore + amount;

        const [transaction] = await this.prisma.$transaction([
          this.prisma.transaction.create({
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
          }),
          this.prisma.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: balanceAfter },
          }),
        ]);
        return transaction;
      }

      case 'WITHDRAWAL': {
        if (fromAccount.bankBalance < amount) {
          throw new BadRequestException(
            `Insufficient balance. Available: ₹${fromAccount.bankBalance.toLocaleString('en-IN')}`,
          );
        }
        const balanceBefore = fromAccount.bankBalance;
        const balanceAfter = balanceBefore - amount;

        const [transaction] = await this.prisma.$transaction([
          this.prisma.transaction.create({
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
          }),
          this.prisma.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: balanceAfter },
          }),
        ]);
        return transaction;
      }

      case 'TRANSFER': {
        if (!dto.toAccountId) {
          throw new BadRequestException('Destination account is required for internal transfer');
        }
        const toAccount = await this.prisma.bankAccount.findUnique({
          where: { id: dto.toAccountId },
          include: { branch: true },
        });
        if (!toAccount) {
          throw new NotFoundException('Destination account not found');
        }
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

        const [senderTx] = await this.prisma.$transaction([
          this.prisma.transaction.create({
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
          }),
          this.prisma.transaction.create({
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
          }),
          this.prisma.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: fromAfter },
          }),
          this.prisma.bankAccount.update({
            where: { id: toAccount.id },
            data: { bankBalance: toAfter },
          }),
        ]);
        return senderTx;
      }

      case 'OUT_TRANSFER': {
        if (!dto.toAccountId) {
          throw new BadRequestException('Destination account is required for out transfer');
        }
        const toAccount = await this.prisma.bankAccount.findUnique({
          where: { id: dto.toAccountId },
          include: { branch: true },
        });
        if (!toAccount) {
          throw new NotFoundException('Destination account not found');
        }
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

        const [senderTx] = await this.prisma.$transaction([
          this.prisma.transaction.create({
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
          }),
          this.prisma.transaction.create({
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
          }),
          this.prisma.bankAccount.update({
            where: { id: fromAccount.id },
            data: { bankBalance: fromAfter },
          }),
          this.prisma.bankAccount.update({
            where: { id: toAccount.id },
            data: { bankBalance: toAfter },
          }),
        ]);
        return senderTx;
      }

      default:
        throw new BadRequestException('Invalid transaction type');
    }
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
