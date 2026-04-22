import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        branchAccess: {
          include: {
            branch: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      branchAccess: u.branchAccess.map((ba) => ({
        id: ba.id,
        branchId: ba.branchId,
        branchName: ba.branch.name,
        branchCode: ba.branch.code,
        accessLevel: ba.accessLevel,
      })),
    }));
  }

  async findOneWithAccess(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        branchAccess: {
          include: {
            branch: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      branchAccess: user.branchAccess.map((ba) => ({
        id: ba.id,
        branchId: ba.branchId,
        branchName: ba.branch.name,
        branchCode: ba.branch.code,
        accessLevel: ba.accessLevel,
      })),
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }
    if (dto.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        fullName: dto.fullName,
        email: dto.email || null,
        phone: dto.phone || null,
        role: dto.role,
      },
    });

    // Create branch access records
    if (dto.branchAccess && dto.branchAccess.length > 0) {
      await this.prisma.branchAccess.createMany({
        data: dto.branchAccess.map((ba) => ({
          userId: user.id,
          branchId: ba.branchId,
          accessLevel: ba.accessLevel,
        })),
      });
    }

    return this.findOneWithAccess(user.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent modifying the super admin sarkar account's role/status
    if (user.username === 'sarkar') {
      if (dto.role && dto.role !== user.role) {
        throw new BadRequestException('Cannot change the primary admin role');
      }
      if (dto.status && dto.status !== user.status) {
        throw new BadRequestException('Cannot change the primary admin status');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.email !== undefined) updateData.email = dto.email || null;
    if (dto.phone !== undefined) updateData.phone = dto.phone || null;
    if (dto.role) updateData.role = dto.role;
    if (dto.status) updateData.status = dto.status;
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12);
    }

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update branch access if provided
    if (dto.branchAccess !== undefined) {
      // Delete existing access
      await this.prisma.branchAccess.deleteMany({ where: { userId: id } });
      // Create new access
      if (dto.branchAccess.length > 0) {
        await this.prisma.branchAccess.createMany({
          data: dto.branchAccess.map((ba) => ({
            userId: id,
            branchId: ba.branchId,
            accessLevel: ba.accessLevel,
          })),
        });
      }
    }

    return this.findOneWithAccess(id);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.username === 'sarkar') {
      throw new BadRequestException('Cannot delete the primary admin account');
    }

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // Get branch IDs a user has access to (SUPER_ADMIN/ADMIN get all)
  async getUserBranchIds(userId: string, minAccess?: 'READ' | 'WRITE' | 'FULL'): Promise<string[] | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    // SUPER_ADMIN and ADMIN get access to all branches
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return null; // null means all branches
    }

    const accessLevels = minAccess === 'FULL'
      ? ['FULL']
      : minAccess === 'WRITE'
        ? ['WRITE', 'FULL']
        : ['READ', 'WRITE', 'FULL'];

    const access = await this.prisma.branchAccess.findMany({
      where: {
        userId,
        accessLevel: { in: accessLevels as ('READ' | 'WRITE' | 'FULL')[] },
      },
      select: { branchId: true },
    });

    return access.map((a) => a.branchId);
  }
}
