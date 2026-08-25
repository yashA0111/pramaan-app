export type LocationState = "requesting" | "available" | "denied" | "unavailable";

export interface LocationResult {
  state: LocationState;
  detail: string;
  coordinates: { latitude: number; longitude: number } | null;
}

export interface PoliceStation {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  phone: string;
  hours: string;
  openNow: boolean;
  note: string;
  coordinates: { latitude: number; longitude: number };
}

export type StationSearchOutcome = "found" | "empty" | "failure";

export interface NearbyPoliceOptions {
  outcome?: StationSearchOutcome;
  latitude?: number;
  longitude?: number;
}

export type SosState = "ready" | "sending" | "sent" | "acknowledged" | "failed" | "cancelled";

export interface SosRequest {
  requestId: string;
  state: SosState;
  createdAt: string;
  updatedAt: string;
  destination: string;
  locationShared: boolean;
  detail: string;
}

export interface CreateSosDto {
  outcome?: "acknowledged" | "failed";
  latitude?: number;
  longitude?: number;
  locationShared?: boolean;
}
