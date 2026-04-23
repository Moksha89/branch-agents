import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseDto, userId: string) {
    const amount = dto.amount;

    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findUnique({
        where: { id: dto.accountId },
        include: { branch: true },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      if (account.status === 'CLOSED') {
        throw new BadRequestException(
          `Account "${account.fullName}" is CLOSED. No transactions allowed.`,
        );
      }
      if (account.status === 'CYBER') {
        throw new BadRequestException(
          `Account "${account.fullName}" is under CYBER investigation. No transactions allowed.`,
        );
      }
      if (account.status === 'DEBIT_FREEZE') {
        throw new BadRequestException(
          `Account "${account.fullName}" has DEBIT FREEZE. Expenses are blocked.`,
        );
      }

      const balanceBefore = Number(account.bankBalance);
      if (balanceBefore < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ₹${balanceBefore.toLocaleString('en-IN')}`,
        );
      }

      const balanceAfter = balanceBefore - amount;

      const expense = await tx.expense.create({
        data: {
          amount,
          reason: dto.reason,
          balanceBefore,
          balanceAfter,
          accountId: account.id,
          branchId: account.branchId,
          createdById: userId,
        },
        include: {
          account: {
            select: {
              id: true,
              fullName: true,
              accountNumber: true,
              bankName: true,
            },
          },
          branch: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true, username: true } },
        },
      });

      await tx.bankAccount.update({
        where: { id: account.id },
        data: { bankBalance: balanceAfter },
      });

      return expense;
    });

    return {
      ...result,
      amount: Number(result.amount),
      balanceBefore: Number(result.balanceBefore),
      balanceAfter: Number(result.balanceAfter),
    };
  }

  async findAll(branchId?: string) {
    const where = branchId ? { branchId } : {};

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            fullName: true,
            accountNumber: true,
            bankName: true,
          },
        },
        branch: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
      balanceBefore: Number(e.balanceBefore),
      balanceAfter: Number(e.balanceAfter),
    }));
  }

  async findByBranch(branchId: string) {
    return this.findAll(branchId);
  }

  async findByAccount(accountId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { accountId },
      include: {
        account: {
          select: {
            id: true,
            fullName: true,
            accountNumber: true,
            bankName: true,
          },
        },
        branch: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
      balanceBefore: Number(e.balanceBefore),
      balanceAfter: Number(e.balanceAfter),
    }));
  }

  async delete(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Restore the account balance
    await this.prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findUnique({
        where: { id: expense.accountId },
      });

      if (account) {
        const currentBalance = Number(account.bankBalance);
        const restoredBalance = currentBalance + Number(expense.amount);

        await tx.bankAccount.update({
          where: { id: account.id },
          data: { bankBalance: restoredBalance },
        });
      }

      await tx.expense.delete({ where: { id } });
    });

    return { success: true };
  }
}
