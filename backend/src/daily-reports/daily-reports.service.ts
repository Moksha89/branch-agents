import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

// Convert Prisma Decimal fields to plain numbers for JSON serialization
function normalizeReport(report: Record<string, unknown>): Record<string, unknown> {
  return {
    ...report,
    totalDeposit: Number(report.totalDeposit),
    totalWithdrawal: Number(report.totalWithdrawal),
    playerBalance: Number(report.playerBalance),
    profitLoss: Number(report.profitLoss),
  };
}

@Injectable()
export class DailyReportsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDailyReportDto, userId: string) {
    const profitLoss = dto.totalDeposit - dto.totalWithdrawal;
    try {
      const report = await this.prisma.dailyReport.create({
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
      return normalizeReport(report as unknown as Record<string, unknown>);
    } catch (error) {
      // FIX #14: Friendly error for duplicate daily report date
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A daily report already exists for this date in this branch.');
      }
      throw error;
    }
  }

  async findByBranch(branchId: string) {
    const reports = await this.prisma.dailyReport.findMany({
      where: { branchId },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { date: 'desc' },
    });
    return reports.map((r) => normalizeReport(r as unknown as Record<string, unknown>));
  }

  async findOne(id: string) {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    if (!report) return null;
    return normalizeReport(report as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdateDailyReportDto) {
    const existing = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Daily report not found');
    }

    const totalDeposit = dto.totalDeposit !== undefined ? dto.totalDeposit : Number(existing.totalDeposit);
    const totalWithdrawal = dto.totalWithdrawal !== undefined ? dto.totalWithdrawal : Number(existing.totalWithdrawal);
    const profitLoss = totalDeposit - totalWithdrawal;

    const report = await this.prisma.dailyReport.update({
      where: { id },
      data: {
        totalDeposit,
        totalWithdrawal,
        playerBalance: dto.playerBalance !== undefined ? dto.playerBalance : Number(existing.playerBalance),
        profitLoss,
      },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });
    return normalizeReport(report as unknown as Record<string, unknown>);
  }

  async remove(id: string) {
    const existing = await this.prisma.dailyReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Daily report not found');
    }
    return this.prisma.dailyReport.delete({ where: { id } });
  }
}
