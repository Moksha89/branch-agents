import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    action: string;
    entity?: string;
    entityId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userId?: string;
    userName?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userId: data.userId,
        userName: data.userName,
      },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
    if (params.entity) where.entity = params.entity;
    if (params.userId) where.userId = params.userId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(params.startDate);
      if (params.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(params.endDate + 'T23:59:59.999Z');
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
