import { Module } from "@nestjs/common";
import { DeterministicBiometricAdapter } from "./deterministic-biometric.adapter";
import { FastApiBiometricAdapter } from "./fastapi-biometric.adapter";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";

@Module({
  controllers: [IdentityController],
  providers: [
    DeterministicBiometricAdapter,
    FastApiBiometricAdapter,
    IdentityService,
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
