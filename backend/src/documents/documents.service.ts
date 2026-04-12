import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocumentDto, filePath: string, fileSize?: number, mimeType?: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    return this.prisma.document.create({
      data: {
        name: dto.name,
        type: dto.type,
        filePath,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        bankAccountId: dto.bankAccountId,
      },
    });
  }

  async findByAccount(bankAccountId: string) {
    return this.prisma.document.findMany({
      where: { bankAccountId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Clean up file
    const filePath = join(__dirname, '..', '..', doc.filePath);
    if (existsSync(filePath)) unlinkSync(filePath);

    await this.prisma.document.delete({ where: { id } });
    return { deleted: true };
  }
}
