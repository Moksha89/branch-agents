import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(data: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    expiresInHours?: number;
  }) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (data.expiresInHours || 24) * 60 * 60 * 1000);

    return this.prisma.userSession.create({
      data: {
        userId: data.userId,
        token,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt,
      },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async getAllActiveSessions() {
    return this.prisma.userSession.findMany({
      where: { isActive: true },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async terminateSession(sessionId: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async terminateAllUserSessions(userId: string, exceptSessionId?: string) {
    const where: Record<string, unknown> = { userId, isActive: true };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }
    return this.prisma.userSession.updateMany({
      where,
      data: { isActive: false },
    });
  }

  async updateActivity(token: string) {
    return this.prisma.userSession.updateMany({
      where: { token, isActive: true },
      data: { lastActivity: new Date() },
    });
  }

  async cleanupExpired() {
    return this.prisma.userSession.updateMany({
      where: { expiresAt: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    });
  }
}
