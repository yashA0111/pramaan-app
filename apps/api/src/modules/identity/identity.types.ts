export type FaceState =
  | "ready"
  | "camera_initializing"
  | "detecting"
  | "no_face"
  | "multiple_faces"
  | "matching"
  | "match"
  | "mismatch"
  | "requires_review"
  | "timeout"
  | "offline"
  | "error";

export type IdentityMatchResult = "match" | "mismatch" | "inconclusive" | "not_performed";

export interface IdentityVerificationInputDto {
  observation: "single_face" | "no_face" | "multiple_faces";
  quality?: number;
  capturedFrameBase64?: string;
  /** Base64-encoded image of the enrolled reference face, fetched server-side from storage */
  referencePhotoBase64?: string;
}


export interface IdentityVerificationResult {
  status: FaceState;
  matchResult: IdentityMatchResult;
  confidence: number | null;
  modelVersion: string;
  timestamp: string;
  reason: string;
}
