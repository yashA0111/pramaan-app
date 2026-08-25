import { Module } from "@nestjs/common";
import { CredentialsService } from "./credentials.service";
import { GovernmentCredentialAdapter } from "./government-credential.adapter";

@Module({
  providers: [GovernmentCredentialAdapter, CredentialsService],
  exports: [CredentialsService, GovernmentCredentialAdapter],
})
export class CredentialsModule {}
