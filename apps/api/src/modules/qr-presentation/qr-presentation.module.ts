import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { QrPresentationService } from "./qr-presentation.service";

@Module({
  imports: [DatabaseModule],
  providers: [QrPresentationService],
  exports: [QrPresentationService],
})
export class QrPresentationModule {}
