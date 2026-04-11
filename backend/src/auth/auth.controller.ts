import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
    };
  }
}
