import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class ScheduledReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createSchedule(data: {
    name: string;
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
    branchIds?: string;
    createdById: string;
  }) {
    return this.prisma.scheduledReport.create({ data });
  }

  async findAll() {
    return this.prisma.scheduledReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    frequency: string;
    dayOfWeek: number;
    dayOfMonth: number;
    time: string;
    branchIds: string;
    isActive: boolean;
  }>) {
    return this.prisma.scheduledReport.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.scheduledReport.delete({ where: { id } });
  }

  // Check every hour if any scheduled reports need to run
  @Cron('0 * * * *')
  async processScheduledReports() {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = '00'; // Only check on the hour
    const currentTime = `${currentHour}:${currentMinute}`;
    const currentDay = now.getDay(); // 0=Sunday
    const currentDate = now.getDate(); // 1-31

    const schedules = await this.prisma.scheduledReport.findMany({
      where: { isActive: true },
    });

    for (const schedule of schedules) {
      if (schedule.time !== currentTime) continue;

      let shouldRun = false;
      if (schedule.frequency === 'daily') {
        shouldRun = true;
      } else if (schedule.frequency === 'weekly' && schedule.dayOfWeek === currentDay) {
        shouldRun = true;
      } else if (schedule.frequency === 'monthly' && schedule.dayOfMonth === currentDate) {
        shouldRun = true;
      }

      if (!shouldRun) continue;

      // Check if already ran today
      if (schedule.lastRun) {
        const lastRunDate = new Date(schedule.lastRun);
        if (lastRunDate.toDateString() === now.toDateString()) continue;
      }

      try {
        await this.generateScheduledReport(schedule);
        await this.prisma.scheduledReport.update({
          where: { id: schedule.id },
          data: { lastRun: now },
        });
      } catch (error) {
        console.error(`Failed to run scheduled report ${schedule.id}:`, error);
      }
    }
  }

  private async generateScheduledReport(schedule: { id: string; name: string; branchIds: string | null; createdById: string }) {
    const branchFilter = schedule.branchIds
      ? { id: { in: schedule.branchIds.split(',') } }
      : {};

    const branches = await this.prisma.branch.findMany({
      where: { isActive: true, ...branchFilter },
      include: {
        bankAccounts: { select: { bankBalance: true, status: true } },
      },
    });

    const summary = branches.map((b) => ({
      name: b.name,
      accounts: b.bankAccounts.length,
      totalBalance: b.bankAccounts.reduce((sum, a) => sum + Number(a.bankBalance), 0),
    }));

    await this.notificationService.create({
      title: `Scheduled Report: ${schedule.name}`,
      message: `Report generated for ${branches.length} branches. Total balance: ₹${summary.reduce((s, b) => s + b.totalBalance, 0).toLocaleString('en-IN')}`,
      type: 'info',
      entity: 'report',
    });
  }
}
