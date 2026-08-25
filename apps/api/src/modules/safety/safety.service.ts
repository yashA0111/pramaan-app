import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { AuditService } from "../audit/audit.service";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import {
  CreateSosDto,
  LocationResult,
  NearbyPoliceOptions,
  PoliceStation,
  SosRequest,
  SosState,
} from "./safety.types";

const SYNTHETIC_LOCATION = { latitude: 28.6139, longitude: 77.209 };

const DEFAULT_STATIONS: PoliceStation[] = [
  {
    id: "central-civic-line",
    name: "Civic Lines Police Station",
    address: "12 Shanti Marg, Civic Lines, New Delhi",
    distanceKm: 1.8,
    phone: "+91 11 2381 2200",
    hours: "Open 24 hours",
    openNow: true,
    note: "Synthetic demo location near the centre of the search area.",
    coordinates: { latitude: 28.6315, longitude: 77.2167 },
  },
  {
    id: "kotwali-gate",
    name: "Kotwali Gate Police Station",
    address: "4 Dariba Road, Old Delhi, New Delhi",
    distanceKm: 3.4,
    phone: "+91 11 2327 4100",
    hours: "Open 24 hours",
    openNow: true,
    note: "Synthetic demo station with a public help desk.",
    coordinates: { latitude: 28.6506, longitude: 77.2303 },
  },
  {
    id: "river-road",
    name: "River Road Police Station",
    address: "87 Yamuna Road, East District, New Delhi",
    distanceKm: 5.9,
    phone: "+91 11 2244 1900",
    hours: "Open 24 hours",
    openNow: true,
    note: "Synthetic demo station for the wider search result.",
    coordinates: { latitude: 28.628, longitude: 77.276 },
  },
];

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);
  private readonly sosRequests = new Map<string, SosRequest>();
  private readonly sosOutcomes = new Map<string, "acknowledged" | "failed">();
  private requestCounter = 0;

  constructor(
    private readonly dbService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  /* ------------------------------------------------------------- Location */

  getLocation(state: "available" | "denied" | "unavailable" = "available"): LocationResult {
    switch (state) {
      case "denied":
        return {
          state: "denied",
          detail: "Location permission was not granted. You can try again or use a known area.",
          coordinates: null,
        };
      case "unavailable":
        return {
          state: "unavailable",
          detail: "Your device could not provide a location right now.",
          coordinates: null,
        };
      default:
        return {
          state: "available",
          detail: "Using a synthetic location for this demonstration.",
          coordinates: SYNTHETIC_LOCATION,
        };
    }
  }

  /* ------------------------------------------------------ Police Stations */

  async getNearbyStations(options: NearbyPoliceOptions = {}): Promise<PoliceStation[]> {
    const outcome = options.outcome ?? "found";
    if (outcome === "failure") {
      throw new ServiceUnavailableException("The station directory is unavailable.");
    }
    if (outcome === "empty") {
      return [];
    }

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db.select().from(schema.policeStations);
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            distanceKm: r.distanceKm,
            phone: r.phone,
            hours: r.hours,
            openNow: r.openNow,
            note: r.note,
            coordinates: { latitude: r.latitude, longitude: r.longitude },
          }));
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch police stations from DB: ${err.message}`);
      }
    }

    return structuredClone(DEFAULT_STATIONS);
  }

  async getStation(stationId: string): Promise<PoliceStation> {
    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db
          .select()
          .from(schema.policeStations)
          .where(eq(schema.policeStations.id, stationId))
          .limit(1);

        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            address: r.address,
            distanceKm: r.distanceKm,
            phone: r.phone,
            hours: r.hours,
            openNow: r.openNow,
            note: r.note,
            coordinates: { latitude: r.latitude, longitude: r.longitude },
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch police station from DB: ${err.message}`);
      }
    }

    const station = DEFAULT_STATIONS.find((s) => s.id === stationId);
    if (!station) {
      throw new NotFoundException("That station is not available in this demonstration.");
    }
    return structuredClone(station);
  }

  /* ------------------------------------------------------------------ SOS */

  async createSOS(dto: CreateSosDto = {}, actorUserId?: string): Promise<SosRequest> {
    const now = new Date();
    const requestId = `sos_demo_${String(++this.requestCounter).padStart(3, "0")}`;

    const request: SosRequest = {
      requestId,
      state: "sending",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      destination: "Synthetic Pramaan demo dispatch",
      locationShared: dto.locationShared ?? true,
      detail: "Simulated emergency request is being sent. No emergency service was contacted.",
    };

    this.sosRequests.set(requestId, request);
    this.sosOutcomes.set(requestId, dto.outcome ?? "acknowledged");

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db.insert(schema.sosEvents).values({
          id: requestId,
          requestingUserId: actorUserId || null,
          state: "sending",
          destination: request.destination,
          locationShared: request.locationShared,
          detail: request.detail,
          latitude: dto.latitude || SYNTHETIC_LOCATION.latitude,
          longitude: dto.longitude || SYNTHETIC_LOCATION.longitude,
          createdAt: now,
          updatedAt: now,
          sentAt: now,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to insert SOS event in DB: ${err.message}`);
      }
    }

    await this.auditService.log({
      actorUserId,
      actorRole: "citizen",
      action: "SOS_REQUEST_CREATED",
      resourceType: "sos_event",
      resourceId: requestId,
      outcome: "success",
      metadata: { locationShared: request.locationShared },
    });

    return structuredClone(request);
  }

  async getSOSStatus(requestId: string): Promise<SosRequest> {
    const stored = this.sosRequests.get(requestId);
    if (!stored) {
      throw new NotFoundException("That demo SOS request is no longer available.");
    }

    const age = Date.now() - new Date(stored.createdAt).getTime();
    const outcome = this.sosOutcomes.get(requestId) ?? "acknowledged";

    let state: SosState = stored.state;
    if (stored.state !== "cancelled") {
      state = age < 700 ? "sending" : age < 1400 ? "sent" : outcome;
    }

    const detail =
      state === "sending"
        ? "Simulated emergency request is being sent."
        : state === "sent"
          ? "The synthetic request reached the demo dispatch boundary."
          : state === "acknowledged"
            ? "Simulated acknowledgment received. No emergency service was contacted."
            : state === "cancelled"
              ? "The simulated request was cancelled before acknowledgment."
              : "The synthetic request could not be delivered. No emergency service was contacted.";

    const next: SosRequest = {
      ...stored,
      state,
      updatedAt: new Date().toISOString(),
      detail,
    };

    this.sosRequests.set(requestId, next);

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db
          .update(schema.sosEvents)
          .set({
            state,
            detail,
            updatedAt: new Date(),
            acknowledgedAt: state === "acknowledged" ? new Date() : undefined,
            failedAt: state === "failed" ? new Date() : undefined,
          })
          .where(eq(schema.sosEvents.id, requestId));
      } catch (err: any) {
        this.logger.warn(`Failed to update SOS event in DB: ${err.message}`);
      }
    }

    return structuredClone(next);
  }

  async cancelSOS(requestId: string, actorUserId?: string): Promise<SosRequest> {
    const stored = this.sosRequests.get(requestId);
    if (!stored) {
      throw new NotFoundException("That demo SOS request is no longer available.");
    }

    const next: SosRequest = {
      ...stored,
      state: "cancelled",
      updatedAt: new Date().toISOString(),
      detail: "The simulated request was cancelled before acknowledgment.",
    };

    this.sosRequests.set(requestId, next);

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        await this.dbService.db
          .update(schema.sosEvents)
          .set({
            state: "cancelled",
            detail: next.detail,
            updatedAt: new Date(),
            cancelledAt: new Date(),
          })
          .where(eq(schema.sosEvents.id, requestId));
      } catch (err: any) {
        this.logger.warn(`Failed to cancel SOS event in DB: ${err.message}`);
      }
    }

    await this.auditService.log({
      actorUserId,
      actorRole: "citizen",
      action: "SOS_REQUEST_CANCELLED",
      resourceType: "sos_event",
      resourceId: requestId,
      outcome: "success",
    });

    return structuredClone(next);
  }
}
