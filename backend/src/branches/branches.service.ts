import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

// Mask sensitive fields in bank account data
function maskAccountSensitive(account: Record<string, unknown>): Record<string, unknown> {
  const mask = (val: string | null | undefined) => {
    if (!val || val.length <= 4) return val ? '****' : null;
    return '****' + val.slice(-4);
  };
  return {
    ...account,
    aadharNumber: mask(account.aadharNumber as string),
    panCardNumber: mask(account.panCardNumber as string),
    debitCardNumber: mask(account.debitCardNumber as string),
    debitCardExpiry: account.debitCardExpiry ? '**/**' : null,
    debitCardCvv: account.debitCardCvv ? '***' : null,
    netbankingUsername: mask(account.netbankingUsername as string),
    netbankingPassword: account.netbankingPassword ? '********' : null,
  };
}

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  private generateCode(name: string): string {
    const prefix = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    const suffix = Date.now().toString(36).slice(-4).toUpperCase();
    return `${prefix}-${suffix}`;
  }

  async create(dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findFirst({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Branch with this name already exists');
    }
    const code = this.generateCode(dto.name);
    return this.prisma.branch.create({
      data: { name: dto.name, code },
    });
  }

  // FIX #15: Add branch update
  async update(id: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    if (dto.name) {
      const existing = await this.prisma.branch.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Branch with this name already exists');
      }
    }
    return this.prisma.branch.update({
      where: { id },
      data: { ...(dto.name && { name: dto.name }) },
    });
  }

  // FIX #15: Add branch delete (only if no accounts)
  async remove(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    const accountCount = await this.prisma.bankAccount.count({ where: { branchId: id } });
    if (accountCount > 0) {
      throw new BadRequestException(
        `Cannot delete branch with ${accountCount} account(s). Remove or move accounts first.`,
      );
    }
    await this.prisma.branch.delete({ where: { id } });
    return { deleted: true };
  }

  async findAll() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { bankAccounts: true } },
        bankAccounts: {
          select: { id: true, fullName: true, accountNumber: true },
          orderBy: { fullName: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        bankAccounts: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, fullName: true, username: true } } },
        },
      },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    // Mask sensitive fields and normalize Decimal fields in bank account data
    return {
      ...branch,
      bankAccounts: branch.bankAccounts.map((a) => {
        const masked = maskAccountSensitive(a as unknown as Record<string, unknown>);
        return { ...masked, bankBalance: Number(a.bankBalance) };
      }),
    };
  }

  async compare() {
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      include: {
        bankAccounts: {
          select: { bankBalance: true, status: true },
        },
        dailyReports: {
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            date: true,
            totalDeposit: true,
            totalWithdrawal: true,
            profitLoss: true,
            playerBalance: true,
          },
        },
      },
    });

    return branches.map((b) => {
      const statusBreakdown: Record<string, { count: number; balance: number }> = {};
      let totalBalance = 0;
      for (const a of b.bankAccounts) {
        const bal = Number(a.bankBalance);
        totalBalance += bal;
        if (!statusBreakdown[a.status]) {
          statusBreakdown[a.status] = { count: 0, balance: 0 };
        }
        statusBreakdown[a.status].count++;
        statusBreakdown[a.status].balance += bal;
      }

      const totalDeposit = b.dailyReports.reduce((s, r) => s + Number(r.totalDeposit), 0);
      const totalWithdrawal = b.dailyReports.reduce((s, r) => s + Number(r.totalWithdrawal), 0);
      const totalPL = b.dailyReports.reduce((s, r) => s + Number(r.profitLoss), 0);

      return {
        id: b.id,
        name: b.name,
        accountCount: b.bankAccounts.length,
        totalBalance,
        statusBreakdown,
        totalDeposit,
        totalWithdrawal,
        totalPL,
        dailyReports: b.dailyReports.map((r) => ({
          date: r.date,
          totalDeposit: Number(r.totalDeposit),
          totalWithdrawal: Number(r.totalWithdrawal),
          profitLoss: Number(r.profitLoss),
          playerBalance: Number(r.playerBalance),
        })),
      };
    });
  }
}
