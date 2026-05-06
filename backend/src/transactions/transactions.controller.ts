import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.transactionsService.create(dto, req.user.sub);
  }

  @Get('branch/:branchId')
  async findByBranch(
    @Param('branchId') branchId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findByBranch(
      branchId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Get('account/:accountId')
  async findByAccount(
    @Param('accountId') accountId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findByAccount(
      accountId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Post(':id/reverse')
  async reverse(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() body: { reason?: string },
  ) {
    return this.transactionsService.reverse(id, req.user.sub, body.reason);
  }

  @Get()
  async findAll() {
    return this.transactionsService.findAll();
  }
}
