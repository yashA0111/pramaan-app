import {
  IdentityVerificationInputDto,
  IdentityVerificationResult,
} from "./identity.types";

export interface BiometricPort {
  verifyIdentity(
    credentialReference: string,
    input: IdentityVerificationInputDto,
  ): Promise<IdentityVerificationResult>;
}
