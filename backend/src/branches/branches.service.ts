import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

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
    return branch;
  }
}
