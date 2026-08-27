import { Inject, Injectable } from "@nestjs/common";
import { BiometricPort } from "./biometric.port";
import { FastApiBiometricAdapter } from "./fastapi-biometric.adapter";
import {
  IdentityVerificationInputDto,
  IdentityVerificationResult,
} from "./identity.types";

@Injectable()
export class IdentityService {
  constructor(
    @Inject(FastApiBiometricAdapter) private readonly biometricAdapter: BiometricPort,
  ) {}

  async verifyIdentity(
    credentialReference: string,
    input: IdentityVerificationInputDto,
  ): Promise<IdentityVerificationResult> {
    return this.biometricAdapter.verifyIdentity(credentialReference, input);
  }
}
