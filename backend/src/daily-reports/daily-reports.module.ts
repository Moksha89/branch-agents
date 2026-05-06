import { Module } from '@nestjs/common';
import { DailyReportsController } from './daily-reports.controller';
import { DailyReportsService } from './daily-reports.service';
import { ReportImageService } from './report-image.service';

@Module({
  controllers: [DailyReportsController],
  providers: [DailyReportsService, ReportImageService],
  exports: [DailyReportsService],
})
export class DailyReportsModule {}
