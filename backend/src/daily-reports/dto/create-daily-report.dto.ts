import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDailyReportDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @Type(() => Number)
  totalDeposit: number;

  @IsNumber()
  @Type(() => Number)
  totalWithdrawal: number;

  @IsNumber()
  @Type(() => Number)
  playerBalance: number;

  @IsString()
  @IsNotEmpty()
  branchId: string;
}
