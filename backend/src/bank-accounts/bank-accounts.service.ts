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
  aadharPhotoBack: true,
  panCardNumber: false,
  panCardPhoto: true,
  panCardPhotoBack: true,
  debitCardNumber: false,
  debitCardExpiry: false,
  debitCardCvv: false,
  debitCardPhoto: true,
  debitCardPhotoBack: true,
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
    files: {
      aadharPhoto?: string;
      aadharPhotoBack?: string;
      panCardPhoto?: string;
      panCardPhotoBack?: string;
      debitCardPhoto?: string;
      debitCardPhotoBack?: string;
    },
    otherDocs?: { filename: string; originalname: string; mimetype: string; size: number; path: string }[],
    merchantQrFiles?: { filename: string; path: string }[],
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Parse merchants JSON if provided
    let merchantsData: { name: string; type: string; merchantId?: string; mobileNumber?: string; balance?: number }[] = [];
    if (dto.merchants) {
      try {
        merchantsData = JSON.parse(dto.merchants);
      } catch {
        // ignore parse errors
      }
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
        aadharPhotoBack: files.aadharPhotoBack || null,
        panCardNumber: dto.panCardNumber,
        panCardPhoto: files.panCardPhoto || null,
        panCardPhotoBack: files.panCardPhotoBack || null,
        debitCardNumber: dto.debitCardNumber,
        debitCardExpiry: dto.debitCardExpiry,
        debitCardCvv: dto.debitCardCvv,
        debitCardPhoto: files.debitCardPhoto || null,
        debitCardPhotoBack: files.debitCardPhotoBack || null,
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

    // Create merchants if provided
    if (merchantsData.length > 0) {
      for (let i = 0; i < merchantsData.length; i++) {
        const m = merchantsData[i];
        const qrPath = merchantQrFiles && merchantQrFiles[i] ? merchantQrFiles[i].path : null;
        await this.prisma.merchant.create({
          data: {
            name: m.name,
            type: m.type,
            merchantId: m.merchantId || null,
            mobileNumber: m.mobileNumber || null,
            balance: m.balance || 0,
            qrCodePhoto: qrPath,
            bankAccountId: account.id,
          },
        });
      }
    }

    // Create other documents if provided
    if (otherDocs && otherDocs.length > 0) {
      for (const doc of otherDocs) {
        await this.prisma.document.create({
          data: {
            name: doc.originalname,
            type: 'Other',
            filePath: doc.path,
            fileSize: doc.size,
            mimeType: doc.mimetype,
            bankAccountId: account.id,
          },
        });
      }
    }

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
    const photoFields = [account.aadharPhoto, account.aadharPhotoBack, account.panCardPhoto, account.panCardPhotoBack, account.debitCardPhoto, account.debitCardPhotoBack];
    for (const photo of photoFields) {
      if (photo) {
        const filePath = join(__dirname, '..', '..', photo);
        if (existsSync(filePath)) unlinkSync(filePath);
      }
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

  async bulkStatusChange(accountIds: string[], status: string) {
    const validStatuses = ['ACTIVE', 'DEBIT_FREEZE', 'CREDIT_FREEZE', 'CYBER', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    if (!accountIds || accountIds.length === 0) {
      throw new BadRequestException('No account IDs provided');
    }

    const result = await this.prisma.bankAccount.updateMany({
      where: { id: { in: accountIds } },
      data: { status: status as 'ACTIVE' | 'DEBIT_FREEZE' | 'CREDIT_FREEZE' | 'CYBER' | 'CLOSED' },
    });
    return { updated: result.count, status };
  }

  async transferToBranch(accountId: string, targetBranchId: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: accountId },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }
    if (account.branchId === targetBranchId) {
      throw new BadRequestException('Account is already in this branch');
    }
    const targetBranch = await this.prisma.branch.findUnique({
      where: { id: targetBranchId },
    });
    if (!targetBranch) {
      throw new NotFoundException('Target branch not found');
    }

    const updated = await this.prisma.bankAccount.update({
      where: { id: accountId },
      data: { branchId: targetBranchId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });

    return {
      ...maskSensitive(updated as unknown as Record<string, unknown>),
      previousBranch: account.branch.name,
      newBranch: targetBranch.name,
    };
  }

  async checkDuplicate(accountNumber: string) {
    if (!accountNumber || accountNumber.trim().length < 4) {
      return { isDuplicate: false, accounts: [] };
    }
    const existing = await this.prisma.bankAccount.findMany({
      where: { accountNumber: { contains: accountNumber.trim(), mode: 'insensitive' } },
      select: {
        id: true,
        fullName: true,
        accountNumber: true,
        bankName: true,
        branch: { select: { id: true, name: true } },
      },
      take: 10,
    });
    return { isDuplicate: existing.length > 0, accounts: existing };
  }
}
