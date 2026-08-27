import { Controller, Get, NotFoundException, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { eq } from "drizzle-orm";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import { QrPresentationService } from "../qr-presentation/qr-presentation.service";

@ApiTags("Official Console")
@Controller("official")
@UseGuards(AuthGuard, RolesGuard)
export class OfficialConsoleController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly qrPresentationService: QrPresentationService,
  ) {}

  @Get("me/credential-qr")
  @Roles("official", "demo_admin")
  @ApiOperation({
    summary: "Return the signed-in official's permanent credential QR",
    description:
      "Returns the stable physical ID card QR (pramaan://credential/<ref>). " +
      "This QR does not expire and does not include an ephemeral presentation token.",
  })
  async getMyPermanentCredentialQr(@CurrentUser() user: AuthenticatedUser) {
    let credentialReference: string | null = null;
    let displayName = user.displayName;
    let designation: string | null = null;
    let department: string | null = null;
    let postingLocation: string | null = null;
    let credentialStatus: string | null = null;

    if (this.dbService.db && this.dbService.isConnected) {
      const rows = await this.dbService.db
        .select({
          cred: schema.credentials,
          official: schema.officials,
          user: schema.users,
        })
        .from(schema.credentials)
        .innerJoin(schema.users, eq(schema.credentials.subjectUserId, schema.users.id))
        .leftJoin(schema.officials, eq(schema.officials.userId, schema.users.id))
        .where(eq(schema.credentials.subjectUserId, user.id))
        .limit(1);

      const row = rows[0];
      if (row) {
        credentialReference = row.cred.credentialReference;
        displayName = row.user.displayName;
        designation = row.official?.designation ?? null;
        department = row.official?.department ?? null;
        postingLocation = row.official?.postingLocation ?? null;
        credentialStatus = row.cred.status;
      }
    }

    if (!credentialReference && user.id === "usr_arjun_mehta") {
      credentialReference = "PRM-DEMO-0001";
      displayName = "Inspector Arjun Mehta";
      designation = "Inspector";
      department = "District Crime Cell, Central District";
      postingLocation = "District Unit III, New Delhi";
      credentialStatus = "valid";
    }

    if (!credentialReference) {
      throw new NotFoundException("No credential is linked to this official.");
    }

    const qr = await this.qrPresentationService.getPermanentCredentialQr(credentialReference);

    return {
      displayName,
      designation,
      department,
      postingLocation,
      credentialReference: qr.credentialReference,
      credentialStatus,
      qrUri: qr.qrUri,
      qrDataUrl: qr.qrDataUrl,
      expires: false,
      scheme: "pramaan://credential/",
    };
  }
}
