import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateLimitService {
  constructor(private prisma: PrismaService) {}

  async recordAttempt(username: string, ipAddress: string, success: boolean) {
    return this.prisma.loginAttempt.create({
      data: { username, ipAddress, success },
    });
  }

  async isRateLimited(username: string, ipAddress: string): Promise<{ limited: boolean; retryAfterSeconds?: number }> {
    const windowMinutes = 15;
    const maxAttempts = 5;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    // Check by username
    const usernameAttempts = await this.prisma.loginAttempt.count({
      where: {
        username,
        success: false,
        createdAt: { gte: windowStart },
      },
    });

    if (usernameAttempts >= maxAttempts) {
      const oldest = await this.prisma.loginAttempt.findFirst({
        where: { username, success: false, createdAt: { gte: windowStart } },
        orderBy: { createdAt: 'asc' },
      });
      const retryAfter = oldest
        ? Math.ceil((oldest.createdAt.getTime() + windowMinutes * 60 * 1000 - Date.now()) / 1000)
        : windowMinutes * 60;
      return { limited: true, retryAfterSeconds: Math.max(retryAfter, 0) };
    }

    // Check by IP
    const ipAttempts = await this.prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: windowStart },
      },
    });

    if (ipAttempts >= maxAttempts * 2) {
      return { limited: true, retryAfterSeconds: windowMinutes * 60 };
    }

    return { limited: false };
  }

  async clearOnSuccess(username: string) {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    await this.prisma.loginAttempt.deleteMany({
      where: { username, createdAt: { gte: windowStart } },
    });
  }
}
