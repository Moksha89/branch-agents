import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  accountId: string;
}
