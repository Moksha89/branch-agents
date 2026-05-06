import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDailyReportDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  totalWithdrawal?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  playerBalance?: number;
}
