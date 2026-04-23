import { Controller, Post, Body, Get, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  async resendOtp(@Body() body: { username: string }) {
    return this.authService.resendOtp(body.username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('telegram/generate-link')
  async generateLinkCode(@Request() req: { user: { sub: string } }) {
    return this.authService.generateLinkCode(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('telegram/status')
  async getTelegramStatus(@Request() req: { user: { sub: string } }) {
    return this.authService.getTelegramStatus(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('telegram/unlink')
  async unlinkTelegram(@Request() req: { user: { sub: string } }) {
    return this.authService.unlinkTelegram(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: { user: { sub: string } }) {
    const user = await this.authService.validateUser(req.user.sub);
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      telegramLinked: !!user.telegramChatId,
    };
  }
}
