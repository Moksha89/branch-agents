import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBankAccountDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  aadharLinkedNumber?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  ifscCode?: string;

  @IsString()
  @IsOptional()
  bankBranch?: string;

  @IsString()
  @IsOptional()
  aadharNumber?: string;

  @IsString()
  @IsOptional()
  panCardNumber?: string;

  @IsString()
  @IsOptional()
  debitCardNumber?: string;

  @IsString()
  @IsOptional()
  debitCardExpiry?: string;

  @IsString()
  @IsOptional()
  debitCardCvv?: string;

  @IsString()
  @IsOptional()
  netbankingUsername?: string;

  @IsString()
  @IsOptional()
  netbankingPassword?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  bankBalance?: number;
}
