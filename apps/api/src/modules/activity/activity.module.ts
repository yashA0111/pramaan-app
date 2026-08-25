import { Module } from "@nestjs/common";
import { VerificationModule } from "../verification/verification.module";
import { ActivityController } from "./activity.controller";
import { ActivityService } from "./activity.service";

@Module({
  imports: [VerificationModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
