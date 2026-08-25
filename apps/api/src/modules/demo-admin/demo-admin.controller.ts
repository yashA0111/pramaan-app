import {
  BadRequestException,
  Body,
  Controller,
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
  @ApiOperation({ summary: "Enable / disable / revoke credential status" })
  async updateStatus(
    @Param("id") id: string,
    @Body() body: UpdateCredentialStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.demoAdminService.updateCredentialStatus(id, body, user?.id);
  }

  @Post("officials/:id/assets")
  @Roles("demo_admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload portrait, QR code, or reference face asset" })
  async uploadAsset(
    @Param("id") id: string,
    @UploadedFile() file: any,
    @Body("assetType") assetType: "portrait" | "qr" | "reference_face",
    @Body("qrReference") qrReference: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException("File is required for asset upload");
    }
    if (!["portrait", "qr", "reference_face"].includes(assetType)) {
      throw new BadRequestException("Invalid assetType. Must be 'portrait', 'qr', or 'reference_face'");
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
      qrReference,
    );
  }
}

@ApiTags("Demo Assets")
@Controller("demo/assets")
export class DemoAssetFilesController {
  constructor(private readonly storageService: StorageService) {}

  @Get("files/:folder/:filename")
  @ApiOperation({ summary: "Serve public demo asset files (portraits, QRs)" })
  async getPublicFile(
    @Param("folder") folder: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ) {
    if (filename.startsWith("reference_face")) {
      throw new ForbiddenException("Reference face images are protected biometric assets.");
    }

    const storagePath = `${folder}/${filename}`;
    try {
      const file = await this.storageService.getFile(storagePath);
      res.setHeader("Content-Type", file.mimeType);
      res.send(file.buffer);
    } catch {
      res.status(404).send("File not found");
    }
  }
}
