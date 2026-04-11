import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findFirst({
      where: { OR: [{ name: dto.name }, { code: dto.code }] },
    });
    if (existing) {
      throw new ConflictException('Branch with this name or code already exists');
    }
    return this.prisma.branch.create({ data: dto });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      include: { _count: { select: { bankAccounts: true } } },
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
