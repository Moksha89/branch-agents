import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    BankAccountsModule,
    TransactionsModule,
    DailyReportsModule,
    DashboardModule,
    SearchModule,
    NotificationsModule,
    ScheduledTasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // FIX #4: Global RBAC guard
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
