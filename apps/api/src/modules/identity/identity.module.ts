import { Module } from "@nestjs/common";
import { DeterministicBiometricAdapter } from "./deterministic-biometric.adapter";
import { FastApiBiometricAdapter } from "./fastapi-biometric.adapter";
import { IdentityService } from "./identity.service";

@Module({
  providers: [
    DeterministicBiometricAdapter,
    FastApiBiometricAdapter,
    IdentityService,
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
