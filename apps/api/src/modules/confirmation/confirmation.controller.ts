import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ConfirmationService } from "./confirmation.service";

export class OfficialDecisionDto {
  decision: "accepted" | "rejected";
  reason: string;
}

@ApiTags("Official Confirmation")
@Controller("official/requests")
@UseGuards(AuthGuard, RolesGuard)
export class ConfirmationController {
  constructor(private readonly confirmationService: ConfirmationService) {}

  @Get()
  @Roles("official", "demo_admin")
  @ApiOperation({ summary: "List pending confirmation requests for official console" })
  async listPending(): Promise<any[]> {
    return this.confirmationService.listPendingRequestsForOfficial();
  }

  @Post(":id/decision")
  @Roles("official", "demo_admin")
  @ApiOperation({ summary: "Submit official confirmation decision" })
  async submitDecision(
    @Param("id") id: string,
    @Body() body: OfficialDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const success = await this.confirmationService.recordOfficialDecision(
      id,
      body.decision,
      body.reason,
      user.id,
    );
    return { success };
  }
}
