import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { LoginDemoDto, UserProfileDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@ApiTags("Authentication")
@Controller("auth")
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser | null): Promise<UserProfileDto> {
    return this.authService.getCurrentUser(user);
  }

  @Post("login-demo")
  @ApiOperation({ summary: "Switch user role in demo environment" })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async loginDemo(@Body() body: LoginDemoDto): Promise<UserProfileDto> {
    return this.authService.loginDemo(body.role, body.userId);
  }

  @Post("logout")
  @ApiOperation({ summary: "Terminate current session" })
  async logout(): Promise<{ success: boolean }> {
    return { success: true };
  }
}
