export type ConfirmationState =
  | "request_ready"
  | "request_sent"
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "timeout"
  | "failed";

export type ConfirmationResolution = Extract<
  ConfirmationState,
  "accepted" | "rejected" | "expired" | "timeout" | "failed"
>;

export interface OfficialConfirmationModel {
  state: ConfirmationState;
  routedTo: string | null;
  requestedAt: string | null;
  respondedAt: string | null;
  reason: string | null;
}
