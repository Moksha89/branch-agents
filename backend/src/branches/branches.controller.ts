import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard)
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

  @Get()
  async findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }
}
