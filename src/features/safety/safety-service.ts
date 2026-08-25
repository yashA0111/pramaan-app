import { queryOptions } from "@tanstack/react-query";

import { ApiError, mockRequest } from "@/lib/api/client";

import type {
  CreateSosOptions,
  LocationResult,
  NearbyPoliceOptions,
  PoliceStation,
  SosRequest,
} from "./types";

const LOCATION = { latitude: 28.6139, longitude: 77.209 };

const STATIONS: PoliceStation[] = [
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

const sosRequests = new Map<string, SosRequest>();
const sosOutcomes = new Map<string, "acknowledged" | "failed">();
let requestCounter = 0;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function serviceError(kind: "not_found" | "unavailable", message: string): ApiError {
  return new ApiError(kind === "not_found" ? "unavailable" : "network", message);
}

export function requestLocation(options: { state?: "available" | "denied" | "unavailable" } = {}): Promise<LocationResult> {
  return mockRequest(
    () => {
      switch (options.state) {
        case "denied":
          return {
            state: "denied",
            detail: "Location permission was not granted. You can try again or use a known area.",
            coordinates: null,
          } satisfies LocationResult;
        case "unavailable":
          return {
            state: "unavailable",
            detail: "Your device could not provide a location right now.",
            coordinates: null,
          } satisfies LocationResult;
        default:
          return {
            state: "available",
            detail: "Using a synthetic location for this demonstration.",
            coordinates: LOCATION,
          } satisfies LocationResult;
      }
    },
    { latencyMs: 500 },
  );
}

export function getNearbyPoliceStations(options: NearbyPoliceOptions = {}): Promise<PoliceStation[]> {
  return mockRequest(
    () => {
      const outcome = options.outcome ?? "found";
      if (outcome === "failure") throw serviceError("unavailable", "The station directory is unavailable.");
      return outcome === "empty" ? [] : clone(STATIONS);
    },
    { latencyMs: 650 },
  );
}

export function getPoliceStation(stationId: string): Promise<PoliceStation> {
  return mockRequest(
    () => {
      const station = STATIONS.find((entry) => entry.id === stationId);
      if (!station) throw serviceError("not_found", "That station is not available in this demonstration.");
      return clone(station);
    },
    { latencyMs: 350 },
  );
}

export function createSOS(options: CreateSosOptions = {}): Promise<SosRequest> {
  return mockRequest(
    () => {
      const now = new Date().toISOString();
      const request: SosRequest = {
        requestId: `sos_demo_${String(++requestCounter).padStart(3, "0")}`,
        state: "sending",
        createdAt: now,
        updatedAt: now,
        destination: "Synthetic Pramaan demo dispatch",
        locationShared: true,
        detail: "Simulated emergency request is being sent. No emergency service was contacted.",
      };
      sosRequests.set(request.requestId, request);
      sosOutcomes.set(request.requestId, options.outcome ?? "acknowledged");
      return clone(request);
    },
    { latencyMs: 450 },
  );
}

export function getSOSStatus(requestId: string): Promise<SosRequest> {
  return mockRequest(
    () => {
      const stored = sosRequests.get(requestId);
      if (!stored) throw serviceError("not_found", "That demo SOS request is no longer available.");
      const age = Date.now() - new Date(stored.createdAt).getTime();
      const outcome = sosOutcomes.get(requestId) ?? "acknowledged";
      const state: SosRequest["state"] = age < 700 ? "sending" : age < 1400 ? "sent" : outcome;
      const detail =
        state === "sending"
          ? "Simulated emergency request is being sent."
          : state === "sent"
            ? "The synthetic request reached the demo dispatch boundary."
            : state === "acknowledged"
              ? "Simulated acknowledgment received. No emergency service was contacted."
              : "The synthetic request could not be delivered. No emergency service was contacted.";
      const next = { ...stored, state, updatedAt: new Date().toISOString(), detail };
      sosRequests.set(requestId, next);
      return clone(next);
    },
    { latencyMs: 250 },
  );
}

export function cancelSOS(requestId: string): Promise<SosRequest> {
  return mockRequest(
    () => {
      const stored = sosRequests.get(requestId);
      if (!stored) throw serviceError("not_found", "That demo SOS request is no longer available.");
      const next = {
        ...stored,
        state: "cancelled" as const,
        updatedAt: new Date().toISOString(),
        detail: "The simulated request was cancelled before acknowledgment.",
      };
      sosRequests.set(requestId, next);
      return clone(next);
    },
    { latencyMs: 250 },
  );
}

export const safetyQueries = {
  station: (stationId: string) =>
    queryOptions({
      queryKey: ["safety", "station", stationId],
      queryFn: () => getPoliceStation(stationId),
      retry: false,
    }),
};

export function __resetSafetyStore(): void {
  sosRequests.clear();
  sosOutcomes.clear();
  requestCounter = 0;
}
