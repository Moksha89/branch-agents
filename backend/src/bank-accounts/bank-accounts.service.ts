import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Fields safe to return in list/summary views (excludes sensitive data)
const SAFE_SELECT = {
  id: true,
  fullName: true,
  mobileNumber: true,
  aadharLinkedNumber: true,
  bankName: true,
  accountNumber: true,
  ifscCode: true,
  bankBranch: true,
  aadharNumber: false,
  aadharPhoto: true,
  panCardNumber: false,
  panCardPhoto: true,
  debitCardNumber: false,
  debitCardExpiry: false,
  debitCardCvv: false,
  netbankingUsername: false,
  netbankingPassword: false,
  bankBalance: true,
  status: true,
  branchId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { id: true, name: true, code: true } },
  createdBy: { select: { id: true, fullName: true, username: true } },
};

// Mask sensitive fields for detail view
function maskSensitive(account: Record<string, unknown>): Record<string, unknown> {
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
    debitCardCvv: '***',
    netbankingUsername: mask(account.netbankingUsername as string),
    netbankingPassword: '********',
  };
}

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateBankAccountDto,
    userId: string,
    files: { aadharPhoto?: string; panCardPhoto?: string },
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const account = await this.prisma.bankAccount.create({
      data: {
        fullName: dto.fullName,
        mobileNumber: dto.mobileNumber,
        aadharLinkedNumber: dto.aadharLinkedNumber,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        ifscCode: dto.ifscCode,
        bankBranch: dto.bankBranch,
        aadharNumber: dto.aadharNumber,
        aadharPhoto: files.aadharPhoto || null,
        panCardNumber: dto.panCardNumber,
        panCardPhoto: files.panCardPhoto || null,
        debitCardNumber: dto.debitCardNumber,
        debitCardExpiry: dto.debitCardExpiry,
        debitCardCvv: dto.debitCardCvv,
        netbankingUsername: dto.netbankingUsername,
        netbankingPassword: dto.netbankingPassword,
        bankBalance: dto.bankBalance || 0,
        status: dto.status || 'ACTIVE',
        branchId: dto.branchId,
        createdById: userId,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    return maskSensitive(account as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdateBankAccountDto) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    // CRITICAL FIX #3: Prevent direct balance editing
    if (dto.bankBalance !== undefined) {
      throw new BadRequestException('Bank balance cannot be edited directly. Use transactions instead.');
    }

    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.mobileNumber !== undefined) data.mobileNumber = dto.mobileNumber;
    if (dto.aadharLinkedNumber !== undefined) data.aadharLinkedNumber = dto.aadharLinkedNumber;
    if (dto.bankName !== undefined) data.bankName = dto.bankName;
    if (dto.accountNumber !== undefined) data.accountNumber = dto.accountNumber;
    if (dto.ifscCode !== undefined) data.ifscCode = dto.ifscCode;
    if (dto.bankBranch !== undefined) data.bankBranch = dto.bankBranch;
    if (dto.aadharNumber !== undefined) data.aadharNumber = dto.aadharNumber;
    if (dto.panCardNumber !== undefined) data.panCardNumber = dto.panCardNumber;
    if (dto.debitCardNumber !== undefined) data.debitCardNumber = dto.debitCardNumber;
    if (dto.debitCardExpiry !== undefined) data.debitCardExpiry = dto.debitCardExpiry;
    if (dto.debitCardCvv !== undefined) data.debitCardCvv = dto.debitCardCvv;
    if (dto.netbankingUsername !== undefined) data.netbankingUsername = dto.netbankingUsername;
    if (dto.netbankingPassword !== undefined) data.netbankingPassword = dto.netbankingPassword;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    return maskSensitive(updated as unknown as Record<string, unknown>);
  }

  // FIX #5: Soft delete — check for transactions before deleting
  // FIX #16: Clean up uploaded files
  async remove(id: string) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    // Check if account has transactions
    const txCount = await this.prisma.transaction.count({
      where: { OR: [{ fromAccountId: id }, { toAccountId: id }] },
    });
    if (txCount > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${txCount} transaction(s). Change status to CLOSED instead.`,
      );
    }

    // Clean up uploaded files
    if (account.aadharPhoto) {
      const filePath = join(__dirname, '..', '..', account.aadharPhoto);
      if (existsSync(filePath)) unlinkSync(filePath);
    }
    if (account.panCardPhoto) {
      const filePath = join(__dirname, '..', '..', account.panCardPhoto);
      if (existsSync(filePath)) unlinkSync(filePath);
    }

    await this.prisma.bankAccount.delete({ where: { id } });
    return { deleted: true };
  }

  async findByBranch(branchId: string) {
    return this.prisma.bankAccount.findMany({
      where: { branchId },
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Detail view: returns masked sensitive data
  async findOne(id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }
    return maskSensitive(account as unknown as Record<string, unknown>);
  }

  async findAll() {
    return this.prisma.bankAccount.findMany({
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}
