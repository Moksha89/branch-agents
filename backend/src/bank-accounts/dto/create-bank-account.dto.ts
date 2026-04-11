import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
}
