import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    BankAccountsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
