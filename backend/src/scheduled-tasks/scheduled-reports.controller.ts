import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ScheduledReportsService } from './scheduled-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scheduled-reports')
@UseGuards(JwtAuthGuard)
export class ScheduledReportsController {
  constructor(private scheduledReportsService: ScheduledReportsService) {}

  @Get()
  async findAll() {
    return this.scheduledReportsService.findAll();
  }

  @Post()
  async create(
    @Body() body: { name: string; frequency: string; dayOfWeek?: number; dayOfMonth?: number; time?: string; branchIds?: string },
    @Request() req: { user: { sub: string } },
  ) {
    return this.scheduledReportsService.createSchedule({
      ...body,
      createdById: req.user.sub,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; frequency: string; dayOfWeek: number; dayOfMonth: number; time: string; branchIds: string; isActive: boolean }>,
  ) {
    return this.scheduledReportsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.scheduledReportsService.delete(id);
  }
}
