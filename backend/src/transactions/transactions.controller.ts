import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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

  @Get('account/:accountId')
  async findByAccount(@Param('accountId') accountId: string) {
    return this.transactionsService.findByAccount(accountId);
  }

  @Get()
  async findAll() {
    return this.transactionsService.findAll();
  }
}
