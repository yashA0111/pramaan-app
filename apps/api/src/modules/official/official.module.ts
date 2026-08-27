import { Module } from "@nestjs/common";
import { QrPresentationModule } from "../qr-presentation/qr-presentation.module";
import { OfficialConsoleController } from "./official.controller";

@Module({
  imports: [QrPresentationModule],
  controllers: [OfficialConsoleController],
})
export class OfficialModule {}
