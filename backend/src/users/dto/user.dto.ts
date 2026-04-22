import { IsString, IsOptional, IsEnum, MinLength, IsEmail, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus, AccessLevel } from '@prisma/client';

export class BranchAccessDto {
  @IsString()
  branchId: string;

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;
}

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchAccessDto)
  branchAccess?: BranchAccessDto[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchAccessDto)
  branchAccess?: BranchAccessDto[];
}
