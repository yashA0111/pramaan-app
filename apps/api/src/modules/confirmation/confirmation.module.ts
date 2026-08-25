import { Module } from "@nestjs/common";
import { ConfirmationController } from "./confirmation.controller";
import { ConfirmationService } from "./confirmation.service";
import { MockNotificationAdapter } from "./mock-notification.adapter";

@Module({
  controllers: [ConfirmationController],
  providers: [MockNotificationAdapter, ConfirmationService],
  exports: [ConfirmationService],
})
export class ConfirmationModule {}
