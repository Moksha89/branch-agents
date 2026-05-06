import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum AccountStatusDto {
  ACTIVE = 'ACTIVE',
  DEBIT_FREEZE = 'DEBIT_FREEZE',
  CREDIT_FREEZE = 'CREDIT_FREEZE',
  CYBER = 'CYBER',
  CLOSED = 'CLOSED',
}

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @IsString()
  @IsNotEmpty()
  aadharLinkedNumber: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  @IsString()
  @IsNotEmpty()
  bankBranch: string;

  @IsString()
  @IsNotEmpty()
  aadharNumber: string;

  @IsString()
  @IsNotEmpty()
  panCardNumber: string;

  @IsString()
  @IsNotEmpty()
  debitCardNumber: string;

  @IsString()
  @IsNotEmpty()
  debitCardExpiry: string;

  @IsString()
  @IsNotEmpty()
  debitCardCvv: string;

  @IsString()
  @IsNotEmpty()
  netbankingUsername: string;

  @IsString()
  @IsNotEmpty()
  netbankingPassword: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  bankBalance?: number;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsEnum(AccountStatusDto)
  @IsOptional()
  status?: AccountStatusDto;

  // JSON string of merchants to create with the account
  @IsString()
  @IsOptional()
  merchants?: string;
}
