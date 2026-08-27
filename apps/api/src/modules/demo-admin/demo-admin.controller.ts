import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { StorageService } from "../storage/storage.service";
import {
  CreateDemoOfficialDto,
  ExpirePresentationDto,
  GeneratePresentationDto,
  UpdateCredentialStatusDto,
  UpdateDemoOfficialDto,
} from "./demo-admin.dto";
import { DemoAdminService } from "./demo-admin.service";

@ApiTags("Demo Admin")
@Controller("admin/demo")
@UseGuards(AuthGuard, RolesGuard)
export class DemoAdminController {
  constructor(
    private readonly demoAdminService: DemoAdminService,
    private readonly storageService: StorageService,
  ) {}

  @Get("officials")
  @Roles("demo_admin")
  @ApiOperation({ summary: "List all demo officials" })
  async listOfficials(): Promise<any[]> {
    return this.demoAdminService.listOfficials();
  }

  @Post("officials")
  @Roles("demo_admin")
  @ApiOperation({ summary: "Create a new synthetic demo official" })
  async createOfficial(
    @Body() body: CreateDemoOfficialDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.createOfficial(body, user?.id);
  }

  @Get("officials/:id")
  @Roles("demo_admin")
  @ApiOperation({ summary: "Get demo official profile and linked assets" })
  async getOfficial(@Param("id") id: string): Promise<any> {
    return this.demoAdminService.getOfficial(id);
  }

  @Put("officials/:id")
  @Roles("demo_admin")
  @ApiOperation({ summary: "Update demo official profile" })
  async updateOfficial(
    @Param("id") id: string,
    @Body() body: UpdateDemoOfficialDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.updateOfficial(id, body, user?.id);
  }

  @Patch("officials/:id/status")
  @Roles("demo_admin")
  @ApiOperation({ summary: "Update credential status (valid, suspended, revoked, expired, archived)" })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: UpdateCredentialStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.updateCredentialStatus(id, body, user?.id);
  }

  @Get("officials/:id/qr/permanent")
  @Roles("demo_admin")
  @ApiOperation({
    summary: "Get stable permanent credential QR for an official's physical ID card",
    description:
      "Returns the canonical permanent credential QR (pramaan://credential/<ref>). " +
      "This QR is STABLE \u2014 it does not expire and does not change when verification " +
      "presentations are regenerated. Suitable for printing on a physical ID card.",
  })
  async getPermanentQr(@Param("id") id: string): Promise<any> {
    return this.demoAdminService.getCredentialQr(id);
  }

  @Post("officials/:id/qr/generate")
  @Roles("demo_admin")
  @ApiOperation({
    summary: "Generate a new ephemeral verification presentation (short-lived)",
    description:
      "Creates a short-lived ephemeral verification presentation token (pramaan://verify/v1/<token>). " +
      "This is NOT the physical ID card QR \u2014 it is used for monitored verification sessions. " +
      "The permanent credential QR (pramaan://credential/<ref>) is separate and unaffected.",
  })
  async generateQr(
    @Param("id") id: string,
    @Body() body: GeneratePresentationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.generatePresentation(id, body, user?.id);
  }

  @Post("officials/:id/qr/regenerate")
  @Roles("demo_admin")
  @ApiOperation({
    summary: "Regenerate ephemeral verification presentation (invalidates previous)",
    description:
      "Regenerates the short-lived ephemeral verification presentation, invalidating any prior active one. " +
      "The permanent credential QR (pramaan://credential/<ref>) is unaffected.",
  })
  async regenerateQr(
    @Param("id") id: string,
    @Body() body: GeneratePresentationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.regeneratePresentation(id, body, user?.id);
  }

  @Post("officials/:id/qr/expire")
  @Roles("demo_admin")
  @ApiOperation({ summary: "Immediately invalidate current active ephemeral verification presentation" })
  async expireQr(
    @Param("id") id: string,
    @Body() body: ExpirePresentationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.expirePresentation(id, body, user?.id);
  }

  @Delete("officials/:id")
  @Roles("demo_admin")
  @ApiOperation({ summary: "Non-destructively archive official from active registry" })
  async archiveOfficial(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.archiveOfficial(id, user?.id);
  }

  @Post("officials/:id/assets")
  @Roles("demo_admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload portrait or reference face asset" })
  async uploadAsset(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Body("assetType") assetType: "portrait" | "reference_face",
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException("File is required for asset upload");
    }
    if (!["portrait", "reference_face"].includes(assetType)) {
      throw new BadRequestException("Invalid assetType. Must be 'portrait' or 'reference_face'");
    }

    return this.demoAdminService.uploadAsset(
      id,
      assetType,
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      user?.id,
    );
  }
}

@ApiTags("Demo Assets")
@Controller("demo/assets")
export class DemoAssetFilesController {
  constructor(private readonly storageService: StorageService) {}

  @Get("files/:officialId/:filename")
  @ApiOperation({ summary: "Serve public demo asset files (portraits)" })
  async getOfficialAsset(
    @Param("officialId") officialId: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ) {
    if (filename.startsWith("reference_face")) {
      throw new ForbiddenException("Reference face images are protected biometric assets.");
    }

    const storagePath = `officials/${officialId}/${filename}`;
    try {
      const file = await this.storageService.getFile(storagePath);
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(file.buffer);
    } catch {
      res.status(404).send("File not found");
    }
  }
}
