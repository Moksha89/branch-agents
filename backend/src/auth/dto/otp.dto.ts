import { IsString, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
