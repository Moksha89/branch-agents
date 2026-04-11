import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum TransactionTypeDto {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  OUT_TRANSFER = 'OUT_TRANSFER',
}

export class CreateTransactionDto {
  @IsEnum(TransactionTypeDto)
  @IsNotEmpty()
  type: TransactionTypeDto;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  fromAccountId: string;

  @IsString()
  @IsOptional()
  toAccountId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
