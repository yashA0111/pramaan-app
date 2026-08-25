import { Injectable } from "@nestjs/common";
import { BiometricPort } from "./biometric.port";
import {
  IdentityVerificationInputDto,
  IdentityVerificationResult,
} from "./identity.types";

const MODEL_VERSION = "pramaan-onnx-yunet-sface-1.0.0";

@Injectable()
export class DeterministicBiometricAdapter implements BiometricPort {
  async verifyIdentity(
    credentialReference: string,
    input: IdentityVerificationInputDto,
  ): Promise<IdentityVerificationResult> {
    const timestamp = new Date().toISOString();
    const cleanRef = credentialReference.trim().toUpperCase();

    if (input.observation === "no_face") {
      return {
        status: "no_face",
        matchResult: "not_performed",
        confidence: null,
        modelVersion: MODEL_VERSION,
        timestamp,
        reason: "No face was detected in the captured frames.",
      };
    }

    if (input.observation === "multiple_faces") {
      return {
        status: "multiple_faces",
        matchResult: "not_performed",
        confidence: null,
        modelVersion: MODEL_VERSION,
        timestamp,
        reason: "More than one face was present — capture a single subject.",
      };
    }

    if (cleanRef === "PRM-DEMO-0005") {
      return {
        status: "offline",
        matchResult: "not_performed",
        confidence: null,
        modelVersion: MODEL_VERSION,
        timestamp,
        reason: "The matching service could not be reached.",
      };
    }

    if (cleanRef === "PRM-DEMO-0006") {
      return {
        status: "mismatch",
        matchResult: "mismatch",
        confidence: 0.21,
        modelVersion: MODEL_VERSION,
        timestamp,
        reason: "The presented face did not match the credential reference photograph.",
      };
    }

    if (cleanRef === "PRM-DEMO-0007") {
      return {
        status: "requires_review",
        matchResult: "inconclusive",
        confidence: 0.58,
        modelVersion: MODEL_VERSION,
        timestamp,
        reason: "The comparison was inconclusive and needs a human decision.",
      };
    }

    // Default match for valid credentials
    return {
      status: "match",
      matchResult: "match",
      confidence: 0.94,
      modelVersion: MODEL_VERSION,
      timestamp,
      reason: "The presented face matched the credential reference photograph.",
    };
  }
}
