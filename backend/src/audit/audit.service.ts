import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AuditService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(action: string, userId: string, details?: Record<string, unknown>) {
    this.logger.info(action, {
      userId,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  logTransaction(
    action: string,
    userId: string,
    transactionId: string,
    details?: Record<string, unknown>,
  ) {
    this.logger.info(`TRANSACTION: ${action}`, {
      userId,
      transactionId,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  logAuth(action: string, username: string, success: boolean, ip?: string) {
    this.logger.info(`AUTH: ${action}`, {
      username,
      success,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logError(action: string, error: string, details?: Record<string, unknown>) {
    this.logger.error(action, {
      error,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }
}
