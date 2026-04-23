import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private audit: AuditService,
    private prisma: PrismaService,
    private telegram: TelegramService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user) {
      this.audit.logAuth('LOGIN_FAILED', loginDto.username, false);
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.status !== 'ACTIVE') {
      this.audit.logAuth('LOGIN_BLOCKED_INACTIVE', loginDto.username, false);
      throw new UnauthorizedException('Account is not active');
    }

    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      this.audit.logAuth('LOGIN_FAILED', loginDto.username, false);
      throw new UnauthorizedException('Invalid username or password');
    }

    await this.usersService.updateLastLogin(user.id);
    this.audit.logAuth('LOGIN_SUCCESS', loginDto.username, true);

    return this.generateLoginResponse(user);
  }

  async requestOtp(dto: RequestOtpDto) {
    const user = await this.usersService.findByUsername(dto.username);

    if (!user) {
      // Don't reveal if user exists
      throw new BadRequestException('Unable to send OTP. Please check your username.');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Account is not active');
    }

    if (!user.telegramChatId) {
      throw new BadRequestException(
        'Telegram is not linked to this account. Please contact admin to set up your Telegram Chat ID.',
      );
    }

    // Invalidate any existing unused OTPs for this user
    await this.prisma.otp.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    // Send OTP via Telegram
    const sent = await this.telegram.sendOtp(user.telegramChatId, code, user.username);

    if (!sent) {
      throw new BadRequestException(
        'Failed to send OTP via Telegram. Please ensure you have started a chat with the bot.',
      );
    }

    this.audit.logAuth('OTP_SENT', dto.username, true);

    return {
      message: 'OTP sent to your Telegram',
      expiresIn: 300, // 5 minutes in seconds
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByUsername(dto.username);

    if (!user) {
      this.audit.logAuth('OTP_VERIFY_FAILED', dto.username, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Find valid OTP
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: dto.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      this.audit.logAuth('OTP_VERIFY_FAILED', dto.username, false);
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    await this.usersService.updateLastLogin(user.id);
    this.audit.logAuth('OTP_LOGIN_SUCCESS', dto.username, true);

    return this.generateLoginResponse(user);
  }

  private async generateLoginResponse(user: { id: string; username: string; fullName: string; role: string; avatar: string | null }) {
    const branchAccess = await this.prisma.branchAccess.findMany({
      where: { userId: user.id },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        branchAccess: branchAccess.map((ba) => ({
          branchId: ba.branchId,
          branchName: ba.branch.name,
          accessLevel: ba.accessLevel,
        })),
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
