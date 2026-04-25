import { Module, Global } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationsGateway, NotificationService],
  exports: [NotificationsGateway, NotificationService],
})
export class NotificationsModule {}
