import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

interface JwtUser {
  sub: string;
  role: string;
  branchAccess: { branchId: string; accessLevel: string }[];
}

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  private isAdminRole(role: string): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  private getAccessibleBranchIds(user: JwtUser): string[] | null {
    // Admins see all branches (return null = no filter)
    if (this.isAdminRole(user.role)) return null;
    return user.branchAccess.map((ba) => ba.branchId);
  }

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

  async findAll(user: JwtUser) {
    const branchIds = this.getAccessibleBranchIds(user);
    return this.prisma.branch.findMany({
      where: {
        isActive: true,
        ...(branchIds !== null && { id: { in: branchIds } }),
      },
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

  async findOne(id: string, user: JwtUser) {
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
    // Check branch access for non-admin users
    if (!this.isAdminRole(user.role)) {
      const hasAccess = user.branchAccess.some((ba) => ba.branchId === id);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this branch');
      }
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

  async exportData(user: JwtUser, format: string) {
    const branchIds = this.getAccessibleBranchIds(user);
    const where = branchIds !== null ? { id: { in: branchIds } } : {};

    const branches = await this.prisma.branch.findMany({
      where: { isActive: true, ...where },
      include: {
        bankAccounts: { select: { id: true, bankBalance: true, status: true, fullName: true, bankName: true } },
      },
    });

    return branches.map((b) => ({
      name: b.name,
      code: b.code,
      address: b.address || '',
      city: b.city || '',
      state: b.state || '',
      pincode: b.pincode || '',
      accountCount: b.bankAccounts.length,
      totalBalance: b.bankAccounts.reduce((sum, a) => sum + Number(a.bankBalance), 0),
      activeAccounts: b.bankAccounts.filter((a) => a.status === 'ACTIVE').length,
      frozenAccounts: b.bankAccounts.filter((a) => ['DEBIT_FREEZE', 'CREDIT_FREEZE', 'CYBER'].includes(a.status)).length,
      closedAccounts: b.bankAccounts.filter((a) => a.status === 'CLOSED').length,
      createdAt: b.createdAt,
    }));
  }
}
