import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async create(data: {
    title: string;
    message: string;
    type?: string;
    entity?: string;
    entityId?: string;
    userId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
      },
    });

    // Also emit via WebSocket for real-time
    this.gateway.notifyGeneral({
      title: data.title,
      message: data.message,
      type: data.type || 'info',
    });

    return notification;
  }

  async getForUser(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      OR: [{ userId }, { userId: null }],
    };
    if (params.unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { OR: [{ userId }, { userId: null }], isRead: false },
      }),
    ]);

    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
  }
}
