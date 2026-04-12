import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MerchantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMerchantDto, qrCodePhoto?: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    return this.prisma.merchant.create({
      data: {
        name: dto.name,
        type: dto.type,
        merchantId: dto.merchantId || null,
        mobileNumber: dto.mobileNumber || null,
        balance: dto.balance || 0,
        qrCodePhoto: qrCodePhoto || null,
        bankAccountId: dto.bankAccountId,
      },
    });
  }

  async findByAccount(bankAccountId: string) {
    return this.prisma.merchant.findMany({
      where: { bankAccountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }
    return merchant;
  }

  async update(id: string, dto: UpdateMerchantDto, qrCodePhoto?: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.merchantId !== undefined) data.merchantId = dto.merchantId;
    if (dto.mobileNumber !== undefined) data.mobileNumber = dto.mobileNumber;
    if (dto.balance !== undefined) data.balance = dto.balance;
    if (qrCodePhoto !== undefined) {
      // Clean up old QR photo
      if (merchant.qrCodePhoto) {
        const oldPath = join(__dirname, '..', '..', merchant.qrCodePhoto);
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }
      data.qrCodePhoto = qrCodePhoto;
    }

    return this.prisma.merchant.update({
      where: { id },
      data,
    });
  }

  async updateBalance(id: string, balance: number) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return this.prisma.merchant.update({
      where: { id },
      data: { balance },
    });
  }

  async remove(id: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // Clean up QR photo
    if (merchant.qrCodePhoto) {
      const filePath = join(__dirname, '..', '..', merchant.qrCodePhoto);
      if (existsSync(filePath)) unlinkSync(filePath);
    }

    await this.prisma.merchant.delete({ where: { id } });
    return { deleted: true };
  }
}
