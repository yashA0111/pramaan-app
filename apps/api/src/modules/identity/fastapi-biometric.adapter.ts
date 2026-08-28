import { Injectable, Logger } from "@nestjs/common";
import { config } from "../../config/env.config";
import { BiometricPort } from "./biometric.port";
import { DeterministicBiometricAdapter } from "./deterministic-biometric.adapter";
import {
  FaceIdentificationInputDto,
  FaceIdentificationResult,
  IdentityVerificationInputDto,
  IdentityVerificationResult,
} from "./identity.types";

@Injectable()
export class FastApiBiometricAdapter implements BiometricPort {
  private readonly logger = new Logger(FastApiBiometricAdapter.name);

  constructor(private readonly fallbackAdapter: DeterministicBiometricAdapter) {}

  async verifyIdentity(
    credentialReference: string,
    input: IdentityVerificationInputDto,
  ): Promise<IdentityVerificationResult> {
    const serviceUrl = config.biometricServiceUrl;

    if (!serviceUrl || serviceUrl === "mock" || serviceUrl === "disabled") {
      return this.fallbackAdapter.verifyIdentity(credentialReference, input);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.biometricServiceToken) {
        headers["Authorization"] = `Bearer ${config.biometricServiceToken}`;
      }

      const response = await fetch(`${serviceUrl}/verify-face`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          credential_reference: credentialReference,
          observation: input.observation,
          quality: input.quality ?? 1.0,
          captured_frame: input.capturedFrameBase64,
          reference_path: input.referencePhotoPath,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status,
          matchResult: data.match_result,
          confidence: data.confidence ?? null,
          modelVersion: data.model_version || "yunet_sface_onnx",
          timestamp: data.timestamp || new Date().toISOString(),
          reason: data.reason || "Biometric comparison completed.",
        };
      }
    } catch (err: any) {
      this.logger.debug(
        `FastAPI biometric service unreachable (${err.message}). Using deterministic fallback adapter.`,
      );
    }

    return this.fallbackAdapter.verifyIdentity(credentialReference, input);
  }

  async identifyFace(input: FaceIdentificationInputDto): Promise<FaceIdentificationResult> {
    const serviceUrl = config.biometricServiceUrl;
    const timestamp = new Date().toISOString();

    if (!serviceUrl || serviceUrl === "mock" || serviceUrl === "disabled") {
      return {
        status: "not_configured",
        candidate: null,
        confidence: null,
        modelVersion: "identity-search-not-configured",
        timestamp,
        reason:
          "Face-first identification requires a biometric search service. The current deterministic adapter only supports comparison against a known credential.",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.biometricServiceToken) {
        headers["Authorization"] = `Bearer ${config.biometricServiceToken}`;
      }

      const response = await fetch(`${serviceUrl}/identify-face`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          observation: input.observation,
          quality: input.quality ?? 1.0,
          captured_frame: input.capturedFrameBase64,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status,
          candidate: data.candidate ?? null,
          confidence: data.confidence ?? null,
          modelVersion: data.model_version || "yunet_sface_onnx",
          timestamp: data.timestamp || timestamp,
          reason: data.reason || "Face identification completed.",
        };
      }

      return {
        status: response.status === 408 || response.status === 504 ? "timeout" : "error",
        candidate: null,
        confidence: null,
        modelVersion: "yunet_sface_onnx",
        timestamp,
        reason: "The biometric identification service rejected the request.",
      };
    } catch (err: any) {
      this.logger.debug(`FastAPI identity identification unavailable (${err.message}).`);
      return {
        status: "offline",
        candidate: null,
        confidence: null,
        modelVersion: "yunet_sface_onnx",
        timestamp,
        reason: "The biometric identification service could not be reached.",
      };
    }
  }
}
