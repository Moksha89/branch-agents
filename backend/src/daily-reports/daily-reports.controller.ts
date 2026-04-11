import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

@Controller('daily-reports')
@UseGuards(JwtAuthGuard)
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post()
  async create(@Body() dto: CreateDailyReportDto, @Request() req: any) {
    return this.dailyReportsService.create(dto, req.user.sub);
  }

  @Get('branch/:branchId')
  async findByBranch(@Param('branchId') branchId: string) {
    return this.dailyReportsService.findByBranch(branchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dailyReportsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDailyReportDto) {
    return this.dailyReportsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.dailyReportsService.remove(id);
  }
}
