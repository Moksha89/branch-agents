import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';

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

    return this.prisma.bankAccount.create({
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
        branchId: dto.branchId,
        createdById: userId,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  async findByBranch(branchId: string) {
    return this.prisma.bankAccount.findMany({
      where: { branchId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

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
    return account;
  }

  async findAll() {
    return this.prisma.bankAccount.findMany({
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
