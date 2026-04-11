import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

@Injectable()
export class DailyReportsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDailyReportDto, userId: string) {
    const profitLoss = dto.totalDeposit - dto.totalWithdrawal;
    try {
      return await this.prisma.dailyReport.create({
        data: {
          date: new Date(dto.date),
          totalDeposit: dto.totalDeposit,
          totalWithdrawal: dto.totalWithdrawal,
          playerBalance: dto.playerBalance,
          profitLoss,
          branchId: dto.branchId,
          createdById: userId,
        },
        include: {
          createdBy: { select: { id: true, fullName: true, username: true } },
        },
      });
    } catch (error) {
      // FIX #14: Friendly error for duplicate daily report date
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A daily report already exists for this date in this branch.');
      }
      throw error;
    }
  }

  async findByBranch(branchId: string) {
    return this.prisma.dailyReport.findMany({
      where: { branchId },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.dailyReport.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  async update(id: string, dto: UpdateDailyReportDto) {
    const existing = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Daily report not found');
    }

    const totalDeposit = dto.totalDeposit !== undefined ? dto.totalDeposit : existing.totalDeposit;
    const totalWithdrawal = dto.totalWithdrawal !== undefined ? dto.totalWithdrawal : existing.totalWithdrawal;
    const profitLoss = totalDeposit - totalWithdrawal;

    return this.prisma.dailyReport.update({
      where: { id },
      data: {
        totalDeposit,
        totalWithdrawal,
        playerBalance: dto.playerBalance !== undefined ? dto.playerBalance : existing.playerBalance,
        profitLoss,
      },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Daily report not found');
    }
    return this.prisma.dailyReport.delete({ where: { id } });
  }
}
