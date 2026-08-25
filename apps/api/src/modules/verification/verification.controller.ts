import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import {
  CreateSessionDto,
  DecodeQrDto,
  VerifyIdentityDto,
} from "./verification.dto";
import { VerificationService } from "./verification.service";
import {
  QrScanResult,
  TrustReceiptViewModel,
  VerificationSession,
} from "./verification.types";

@ApiTags("Verification Session")
@Controller("verification")
@UseGuards(AuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post("qr/decode")
  @ApiOperation({ summary: "Decode and validate raw QR payload" })
  @ApiResponse({ status: 200 })
  async decodeQr(@Body() body: DecodeQrDto): Promise<QrScanResult> {
    return this.verificationService.decodeQr(body.raw, {
      demo: body.demo,
      offline: body.offline,
    });
  }

  @Post("sessions")
  @ApiOperation({ summary: "Create a new verification session" })
  @ApiResponse({ status: 201 })
  async createSession(
    @Body() body: CreateSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VerificationSession> {
    return this.verificationService.createSession(
      body.credentialReference,
      { demo: body.demo },
      user?.id,
    );
  }

  @Get("sessions/:id")
  @ApiOperation({ summary: "Get verification session state" })
  @ApiResponse({ status: 200 })
  async getSession(@Param("id") id: string): Promise<VerificationSession> {
    return this.verificationService.getSession(id);
  }

  @Post("sessions/:id/advance-stage")
  @ApiOperation({ summary: "Advance credential stage by one step" })
  @ApiResponse({ status: 200 })
  async advanceStage(@Param("id") id: string): Promise<VerificationSession> {
    return this.verificationService.advanceCredentialStage(id);
  }

  @Post("sessions/:id/identity")
  @ApiOperation({ summary: "Run biometric identity matching" })
  @ApiResponse({ status: 200 })
  async verifyIdentity(
    @Param("id") id: string,
    @Body() body: VerifyIdentityDto,
  ): Promise<VerificationSession> {
    return this.verificationService.verifyIdentity(id, {
      observation: body.observation,
      quality: body.quality,
      capturedFrameBase64: body.capturedFrameBase64,
    });
  }

  @Post("sessions/:id/confirmation/request")
  @ApiOperation({ summary: "Request official confirmation" })
  @ApiResponse({ status: 200 })
  async requestConfirmation(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VerificationSession> {
    return this.verificationService.requestOfficialConfirmation(id, user?.id);
  }

  @Get("sessions/:id/confirmation/poll")
  @ApiOperation({ summary: "Poll official confirmation status" })
  @ApiResponse({ status: 200 })
  async pollConfirmation(@Param("id") id: string): Promise<VerificationSession> {
    return this.verificationService.pollOfficialConfirmation(id);
  }

  @Post("sessions/:id/confirmation/skip")
  @ApiOperation({ summary: "Skip official confirmation stage" })
  @ApiResponse({ status: 200 })
  async skipConfirmation(@Param("id") id: string): Promise<VerificationSession> {
    return this.verificationService.skipOfficialConfirmation(id);
  }

  @Get("sessions/:id/receipt")
  @ApiOperation({ summary: "Get finalized Trust Receipt" })
  @ApiResponse({ status: 200 })
  async getReceipt(@Param("id") id: string): Promise<TrustReceiptViewModel> {
    return this.verificationService.getTrustReceipt(id);
  }
}
