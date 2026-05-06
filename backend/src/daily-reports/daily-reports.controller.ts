import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DailyReportsService } from './daily-reports.service';
import { ReportImageService } from './report-image.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

@Controller('daily-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyReportsController {
  constructor(
    private readonly dailyReportsService: DailyReportsService,
    private readonly reportImageService: ReportImageService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE')
  async create(@Body() dto: CreateDailyReportDto, @Request() req: { user: { sub: string } }) {
    return this.dailyReportsService.create(dto, req.user.sub);
  }

  @Get('branch/:branchId')
  async findByBranch(@Param('branchId') branchId: string) {
    return this.dailyReportsService.findByBranch(branchId);
  }

  @Get(':id/png')
  async getReportPNG(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.reportImageService.generateReportPNG(id);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="daily-report-${id}.png"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
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
  @Roles('SUPER_ADMIN', 'ADMIN')
  async remove(@Param('id') id: string) {
    return this.dailyReportsService.remove(id);
  }
}
