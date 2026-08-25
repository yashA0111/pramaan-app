export interface NotificationPayload {
  toEmail?: string;
  officialId?: string;
  requestId: string;
  credentialReference: string;
  subjectName: string;
  posting: string;
}

export interface NotificationPort {
  sendConfirmationAlert(payload: NotificationPayload): Promise<boolean>;
}
