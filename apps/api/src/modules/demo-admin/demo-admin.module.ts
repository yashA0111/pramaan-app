import { Module } from "@nestjs/common";
import { CredentialsModule } from "../credentials/credentials.module";
import { QrPresentationModule } from "../qr-presentation/qr-presentation.module";
import { DemoAdminController, DemoAssetFilesController } from "./demo-admin.controller";
import { DemoAdminService } from "./demo-admin.service";

@Module({
  imports: [CredentialsModule, QrPresentationModule],
  controllers: [DemoAdminController, DemoAssetFilesController],
  providers: [DemoAdminService],
  exports: [DemoAdminService],
})
export class DemoAdminModule {}
