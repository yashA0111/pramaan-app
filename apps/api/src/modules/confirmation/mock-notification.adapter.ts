import { Injectable, Logger } from "@nestjs/common";
import { NotificationPayload, NotificationPort } from "./notification.port";

@Injectable()
export class MockNotificationAdapter implements NotificationPort {
  private readonly logger = new Logger(MockNotificationAdapter.name);

  async sendConfirmationAlert(payload: NotificationPayload): Promise<boolean> {
    this.logger.log(
      `[MOCK NOTIFICATION] Dispatched confirmation alert for request=${payload.requestId}, ref=${payload.credentialReference}, to=${payload.toEmail || "Duty Officer Desk"}`,
    );
    return true;
  }
}
