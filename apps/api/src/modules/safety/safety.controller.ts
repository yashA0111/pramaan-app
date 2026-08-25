import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import {
  CreateSosDto,
  LocationResult,
  PoliceStation,
  SosRequest,
} from "./safety.types";
import { SafetyService } from "./safety.service";

@ApiTags("Public Safety")
@Controller("safety")
@UseGuards(AuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get("location")
  @ApiOperation({ summary: "Get synthetic user location" })
  @ApiResponse({ status: 200 })
  getLocation(
    @Query("state") state?: "available" | "denied" | "unavailable",
  ): LocationResult {
    return this.safetyService.getLocation(state);
  }

  @Get("police/stations")
  @ApiOperation({ summary: "Get nearby police stations" })
  @ApiResponse({ status: 200 })
  async getNearbyStations(
    @Query("outcome") outcome?: "found" | "empty" | "failure",
    @Query("latitude") lat?: string,
    @Query("longitude") lng?: string,
  ): Promise<PoliceStation[]> {
    return this.safetyService.getNearbyStations({
      outcome,
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lng ? parseFloat(lng) : undefined,
    });
  }

  @Get("police/stations/:id")
  @ApiOperation({ summary: "Get police station details" })
  @ApiResponse({ status: 200 })
  async getStation(@Param("id") id: string): Promise<PoliceStation> {
    return this.safetyService.getStation(id);
  }

  @Post("sos")
  @ApiOperation({ summary: "Dispatch emergency SOS request" })
  @ApiResponse({ status: 201 })
  async createSOS(
    @Body() body: CreateSosDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SosRequest> {
    return this.safetyService.createSOS(body, user?.id);
  }

  @Get("sos/:id")
  @ApiOperation({ summary: "Get status of SOS emergency request" })
  @ApiResponse({ status: 200 })
  async getSOSStatus(@Param("id") id: string): Promise<SosRequest> {
    return this.safetyService.getSOSStatus(id);
  }

  @Post("sos/:id/cancel")
  @ApiOperation({ summary: "Cancel in-flight SOS emergency request" })
  @ApiResponse({ status: 200 })
  async cancelSOS(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SosRequest> {
    return this.safetyService.cancelSOS(id, user?.id);
  }
}
