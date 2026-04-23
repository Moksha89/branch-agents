import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/otp.dto';

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

    // If user has Telegram 2FA linked, send OTP instead of logging in directly
    if (user.telegramChatId) {
      // Generate and send OTP
      await this.prisma.otp.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await this.prisma.otp.create({
        data: { userId: user.id, code, expiresAt },
      });

      const sent = await this.telegram.sendOtp(user.telegramChatId, code, user.username);

      if (!sent) {
        // If Telegram send fails, fall back to password-only login
        this.audit.logAuth('OTP_SEND_FAILED_FALLBACK', loginDto.username, true);
        await this.usersService.updateLastLogin(user.id);
        return this.generateLoginResponse(user);
      }

      this.audit.logAuth('OTP_SENT_2FA', loginDto.username, true);

      return {
        requireOtp: true,
        message: 'OTP sent to your Telegram. Please enter the code to continue.',
        username: user.username,
      };
    }

    // No 2FA — login directly
    await this.usersService.updateLastLogin(user.id);
    this.audit.logAuth('LOGIN_SUCCESS', loginDto.username, true);

    return this.generateLoginResponse(user);
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

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    await this.usersService.updateLastLogin(user.id);
    this.audit.logAuth('OTP_LOGIN_SUCCESS', dto.username, true);

    return this.generateLoginResponse(user);
  }

  async resendOtp(username: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user || !user.telegramChatId) {
      throw new BadRequestException('Unable to resend OTP');
    }

    // Invalidate existing
    await this.prisma.otp.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otp.create({
      data: { userId: user.id, code, expiresAt },
    });

    const sent = await this.telegram.sendOtp(user.telegramChatId, code, user.username);

    if (!sent) {
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }

    return { message: 'OTP resent to your Telegram', expiresIn: 300 };
  }

  async generateLinkCode(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.telegramChatId) {
      throw new BadRequestException('Telegram is already linked to this account');
    }

    // Invalidate existing unused codes
    await this.prisma.telegramLinkCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    });

    // Generate random code: SW-XXXXXX (6 uppercase alphanumeric chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1 for clarity
    let code = 'SW-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.telegramLinkCode.create({
      data: { userId, code, expiresAt },
    });

    return {
      code,
      expiresIn: 600,
      botUsername: 'Pb_otpbot',
      instructions: `Send this code to @Pb_otpbot on Telegram: ${code}`,
    };
  }

  async getTelegramStatus(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      linked: !!user.telegramChatId,
      chatId: user.telegramChatId ? `***${user.telegramChatId.slice(-4)}` : null,
    };
  }

  async unlinkTelegram(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.telegramChatId) {
      throw new BadRequestException('Telegram is not linked');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: null },
    });

    return { message: 'Telegram 2FA has been unlinked' };
  }

  private async generateLoginResponse(user: { id: string; username: string; fullName: string; role: string; avatar: string | null; telegramChatId?: string | null }) {
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
        telegramLinked: !!user.telegramChatId,
        branchAccess: branchAccess.map((ba) => ({
          branchId: ba.branchId,
          branchName: ba.branch.name,
          accessLevel: ba.accessLevel,
        })),
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const bcrypt = await import('bcrypt');
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.audit.logAuth('PASSWORD_CHANGED', user.username, true);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      telegramLinked: !!user.telegramChatId,
      telegramChatId: user.telegramChatId ? `***${user.telegramChatId.slice(-4)}` : null,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
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
