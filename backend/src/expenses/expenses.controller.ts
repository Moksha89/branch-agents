import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  async create(
    @Body() dto: CreateExpenseDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.expensesService.create(dto, req.user.sub);
  }

  @Get()
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.expensesService.findAll(branchId, dateFrom, dateTo);
  }

  @Get('branch/:branchId')
  async findByBranch(
    @Param('branchId') branchId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.expensesService.findByBranch(branchId, dateFrom, dateTo);
  }

  @Get('account/:accountId')
  async findByAccount(@Param('accountId') accountId: string) {
    return this.expensesService.findByAccount(accountId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.expensesService.update(id, body);
  }
}
