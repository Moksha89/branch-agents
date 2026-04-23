import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface JwtUser {
  sub: string;
  role: string;
  branchAccess: { branchId: string; accessLevel: string }[];
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private isAdminRole(role: string): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  private getAccessibleBranchIds(user: JwtUser): string[] | null {
    if (this.isAdminRole(user.role)) return null;
    return user.branchAccess.map((ba) => ba.branchId);
  }

  async getStats(user: JwtUser) {
    const branchIds = this.getAccessibleBranchIds(user);
    const branchFilter = branchIds !== null ? { id: { in: branchIds } } : {};
    const accountFilter = branchIds !== null ? { branchId: { in: branchIds } } : {};
    const txFilter = branchIds !== null ? { fromAccount: { branchId: { in: branchIds } } } : {};

    const [
      totalBranches,
      totalAccounts,
      totalTransactions,
      branches,
      recentTransactions,
      dailyReports,
      accountsByStatus,
    ] = await Promise.all([
      this.prisma.branch.count({ where: { isActive: true, ...branchFilter } }),
      this.prisma.bankAccount.count({ where: accountFilter }),
      this.prisma.transaction.count({ where: txFilter }),
      this.prisma.branch.findMany({
        where: { isActive: true, ...branchFilter },
        include: {
          bankAccounts: { select: { bankBalance: true, status: true } },
          dailyReports: {
            orderBy: { date: 'desc' },
            take: 30,
            select: { date: true, totalDeposit: true, totalWithdrawal: true, profitLoss: true },
          },
        },
      }),
      this.prisma.transaction.findMany({
        where: txFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          fromAccount: { select: { id: true, fullName: true, accountNumber: true, bankName: true } },
          toAccount: { select: { id: true, fullName: true, accountNumber: true, bankName: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.dailyReport.findMany({
        where: branchIds !== null ? { branchId: { in: branchIds } } : {},
        orderBy: { date: 'desc' },
        take: 30,
        include: { branch: { select: { name: true } } },
      }),
      this.prisma.bankAccount.groupBy({
        by: ['status'],
        where: accountFilter,
        _count: { id: true },
        _sum: { bankBalance: true },
      }),
    ]);

    // Calculate totals
    let totalBalance = 0;
    const branchSummaries = branches.map((b) => {
      const branchBalance = b.bankAccounts.reduce(
        (sum, a) => sum + Number(a.bankBalance),
        0,
      );
      totalBalance += branchBalance;
      return {
        id: b.id,
        name: b.name,
        accountCount: b.bankAccounts.length,
        totalBalance: branchBalance,
        dailyReports: b.dailyReports.map((r) => ({
          date: r.date,
          totalDeposit: Number(r.totalDeposit),
          totalWithdrawal: Number(r.totalWithdrawal),
          profitLoss: Number(r.profitLoss),
        })),
      };
    });

    // Transaction volume by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTxByDay = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { createdAt: { gte: sevenDaysAgo }, ...txFilter },
      _count: { id: true },
      _sum: { amount: true },
    });

    const txVolumeByType = recentTxByDay.map((t) => ({
      type: t.type,
      count: t._count.id,
      totalAmount: Number(t._sum.amount) || 0,
    }));

    // Top accounts by balance
    const topAccounts = await this.prisma.bankAccount.findMany({
      where: accountFilter,
      orderBy: { bankBalance: 'desc' },
      take: 10,
      select: {
        id: true,
        fullName: true,
        bankName: true,
        accountNumber: true,
        bankBalance: true,
        status: true,
        branch: { select: { name: true } },
      },
    });

    // Status summary
    const statusSummary = accountsByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
      totalBalance: Number(s._sum.bankBalance) || 0,
    }));

    // P/L trend from daily reports (last 30 days across all branches)
    const plTrend = dailyReports.map((r) => ({
      date: r.date,
      branch: r.branch.name,
      totalDeposit: Number(r.totalDeposit),
      totalWithdrawal: Number(r.totalWithdrawal),
      profitLoss: Number(r.profitLoss),
    }));

    return {
      overview: {
        totalBranches,
        totalAccounts,
        totalTransactions,
        totalBalance,
      },
      branchSummaries,
      recentTransactions: recentTransactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
      })),
      txVolumeByType,
      topAccounts: topAccounts.map((a) => ({
        ...a,
        bankBalance: Number(a.bankBalance),
      })),
      statusSummary,
      plTrend,
    };
  }
}
