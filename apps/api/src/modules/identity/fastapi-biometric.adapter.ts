import { Injectable, Logger } from "@nestjs/common";
import { config } from "../../config/env.config";
import { BiometricPort } from "./biometric.port";
import { DeterministicBiometricAdapter } from "./deterministic-biometric.adapter";
import {
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

    // Explicit mock/test mode only
    if (serviceUrl === "mock" || serviceUrl === "disabled") {
      return this.fallbackAdapter.verifyIdentity(credentialReference, input);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

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
          reference_photo: input.referencePhotoPath,
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
          modelVersion: data.model_version || "pramaan-onnx-yunet-sface-1.0.0",
          timestamp: data.timestamp || new Date().toISOString(),
          reason: data.reason || "Biometric comparison completed.",
        };
      } else {
        this.logger.warn(`Biometric microservice returned HTTP ${response.status}`);
        return {
          status: "offline",
          matchResult: "not_performed",
          confidence: null,
          modelVersion: "pramaan-onnx-yunet-sface-1.0.0",
          timestamp: new Date().toISOString(),
          reason: `Biometric microservice returned status ${response.status}.`,
        };
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        this.logger.error("Biometric microservice request timed out.");
        return {
          status: "timeout",
          matchResult: "not_performed",
          confidence: null,
          modelVersion: "pramaan-onnx-yunet-sface-1.0.0",
          timestamp: new Date().toISOString(),
          reason: "The biometric verification microservice timed out.",
        };
      }

      this.logger.warn(
        `FastAPI biometric service unreachable: ${err.message}. Reporting service unavailable honestly.`,
      );
      return {
        status: "offline",
        matchResult: "not_performed",
        confidence: null,
        modelVersion: "pramaan-onnx-yunet-sface-1.0.0",
        timestamp: new Date().toISOString(),
        reason: "The biometric verification microservice is unreachable.",
      };
    }
  }
}
