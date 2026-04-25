import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }

  @Get('export')
  async exportBranches(
    @Request() req: { user: { sub: string; role: string; branchAccess: { branchId: string; accessLevel: string }[] } },
    @Query('format') format: string,
  ) {
    return this.branchesService.exportData(req.user, format || 'json');
  }

  @Get()
  async findAll(@Request() req: { user: { sub: string; role: string; branchAccess: { branchId: string; accessLevel: string }[] } }) {
    return this.branchesService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: { user: { sub: string; role: string; branchAccess: { branchId: string; accessLevel: string }[] } }) {
    return this.branchesService.findOne(id, req.user);
  }
}
