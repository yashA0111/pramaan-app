import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RecentVerificationSummary } from "../verification/verification.types";
import { ActivityService } from "./activity.service";

@ApiTags("Activity & History")
@Controller("activity")
@UseGuards(AuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get("verifications")
  @ApiOperation({ summary: "Get verification history for authenticated citizen" })
  @ApiResponse({ status: 200 })
  async listRecent(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RecentVerificationSummary[]> {
    return this.activityService.listRecentVerifications(user?.id);
  }
}
