import { Module } from "@nestjs/common";
import { ConfirmationModule } from "../confirmation/confirmation.module";
import { CredentialsModule } from "../credentials/credentials.module";
import { IdentityModule } from "../identity/identity.module";
import { QrPresentationModule } from "../qr-presentation/qr-presentation.module";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

@Module({
  imports: [
    CredentialsModule,
    IdentityModule,
    ConfirmationModule,
    QrPresentationModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
