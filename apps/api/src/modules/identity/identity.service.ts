import { Injectable } from "@nestjs/common";
import { FastApiBiometricAdapter } from "./fastapi-biometric.adapter";
import {
  FaceIdentificationInputDto,
  FaceIdentificationResult,
  IdentityVerificationInputDto,
  IdentityVerificationResult,
} from "./identity.types";

@Injectable()
export class IdentityService {
  constructor(private readonly biometricAdapter: FastApiBiometricAdapter) {}

  async verifyIdentity(
    credentialReference: string,
    input: IdentityVerificationInputDto,
  ): Promise<IdentityVerificationResult> {
    return this.biometricAdapter.verifyIdentity(credentialReference, input);
  }

  async identifyFace(input: FaceIdentificationInputDto): Promise<FaceIdentificationResult> {
    return this.biometricAdapter.identifyFace(input);
  }
}
