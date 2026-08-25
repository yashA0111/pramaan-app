import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetSafetyStore,
  cancelSOS,
  createSOS,
  getNearbyPoliceStations,
  getSOSStatus,
  requestLocation,
} from "./safety-service";

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(1_000);
  return promise;
}

async function settleStatus<T>(promise: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(300);
  return promise;
}

beforeEach(() => {
  vi.useFakeTimers();
  __resetSafetyStore();
});

afterEach(() => vi.useRealTimers());

describe("nearby police", () => {
  it("returns a denied location state", async () => {
    const result = await settle(requestLocation({ state: "denied" }));
    expect(result.state).toBe("denied");
    expect(result.coordinates).toBeNull();
  });

  it("returns an unavailable location state", async () => {
    const result = await settle(requestLocation({ state: "unavailable" }));
    expect(result.state).toBe("unavailable");
  });

  it("returns synthetic stations", async () => {
    const stations = await settle(getNearbyPoliceStations());
    expect(stations.length).toBeGreaterThan(0);
    expect(stations[0]?.distanceKm).toBe(1.8);
  });

  it("supports an empty station result", async () => {
    await expect(settle(getNearbyPoliceStations({ outcome: "empty" }))).resolves.toEqual([]);
  });

  it("supports a station service failure", async () => {
    await expect(settle(getNearbyPoliceStations({ outcome: "failure" }))).rejects.toThrow(
      "station directory is unavailable",
    );
  });
});

describe("SOS", () => {
  it("moves from sending to sent to acknowledged", async () => {
    const created = await settle(createSOS());
    expect(created.state).toBe("sending");

    vi.advanceTimersByTime(400);
    expect((await settleStatus(getSOSStatus(created.requestId))).state).toBe("sent");

    vi.advanceTimersByTime(800);
    const acknowledged = await settleStatus(getSOSStatus(created.requestId));
    expect(acknowledged.state).toBe("acknowledged");
    expect(acknowledged.detail).toMatch(/No emergency service was contacted/i);
  });

  it("cancels a request before acknowledgment", async () => {
    const created = await settle(createSOS());
    const cancelled = await settle(cancelSOS(created.requestId));
    expect(cancelled.state).toBe("cancelled");
    expect(cancelled.detail).toMatch(/cancelled/i);
  });

  it("exposes a deterministic failure outcome", async () => {
    const created = await settle(createSOS({ outcome: "failed" }));
    vi.advanceTimersByTime(2_000);
    const failed = await settleStatus(getSOSStatus(created.requestId));
    expect(failed.state).toBe("failed");
  });
});
