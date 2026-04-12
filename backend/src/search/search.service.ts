import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string) {
    if (!query || query.trim().length < 2) {
      return { accounts: [], transactions: [], branches: [] };
    }
    const q = query.trim();
    const contains = q;

    const [accounts, branches, transactions] = await Promise.all([
      this.prisma.bankAccount.findMany({
        where: {
          OR: [
            { fullName: { contains, mode: 'insensitive' } },
            { bankName: { contains, mode: 'insensitive' } },
            { accountNumber: { contains, mode: 'insensitive' } },
            { mobileNumber: { contains, mode: 'insensitive' } },
            { ifscCode: { contains, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          bankName: true,
          accountNumber: true,
          bankBalance: true,
          status: true,
          branch: { select: { id: true, name: true } },
        },
        take: 20,
      }),
      this.prisma.branch.findMany({
        where: {
          OR: [
            { name: { contains, mode: 'insensitive' } },
            { code: { contains, mode: 'insensitive' } },
            { city: { contains, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          _count: { select: { bankAccounts: true } },
        },
        take: 10,
      }),
      this.prisma.transaction.findMany({
        where: {
          OR: [
            { description: { contains, mode: 'insensitive' } },
            { fromAccount: { fullName: { contains, mode: 'insensitive' } } },
            { toAccount: { fullName: { contains, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          createdAt: true,
          fromAccount: { select: { id: true, fullName: true, branch: { select: { id: true, name: true } } } },
          toAccount: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      accounts: accounts.map((a) => ({ ...a, bankBalance: Number(a.bankBalance) })),
      branches,
      transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
    };
  }
}
