import { describe, expect, it } from "vitest";
import { config, hasSupabaseStorageCredentials } from "../../config/env.config";
import { StoragePort, UploadResult } from "./storage.port";
import { StorageService } from "./storage.service";

class FakeStorageAdapter implements StoragePort {
  constructor(
    private readonly label: string,
    private readonly errorMessage?: string,
  ) {}

  async uploadFile(): Promise<UploadResult> {
    if (this.errorMessage) throw new Error(this.errorMessage);
    return {
      storagePath: this.label,
      mimeType: "text/plain",
      fileSize: 0,
      checksum: this.label,
    };
  }

  async getFile(): Promise<{ buffer: Buffer; mimeType: string }> {
    if (this.errorMessage) throw new Error(this.errorMessage);
    return { buffer: Buffer.from(this.label), mimeType: "text/plain" };
  }

  async deleteFile(): Promise<boolean> {
    if (this.errorMessage) throw new Error(this.errorMessage);
    return true;
  }
}

describe("Supabase storage configuration", () => {
  it("rejects placeholder Supabase credentials", () => {
    expect(
      hasSupabaseStorageCredentials({
        supabaseUrl: "https://[YOUR-PROJECT-REF].supabase.co",
        supabaseServiceRoleKey: "[YOUR-SERVICE-ROLE-KEY]",
      }),
    ).toBe(false);
  });

  it("accepts real Supabase credentials even when deployment env values are quoted", () => {
    expect(
      hasSupabaseStorageCredentials({
        supabaseUrl: ' "https://example-project.supabase.co" ',
        supabaseServiceRoleKey: "'test-service-role-key-not-sensitive'",
      }),
    ).toBe(true);
  });

  it("uses Supabase storage when valid credentials are configured", async () => {
    const original = {
      storageDriver: config.storageDriver,
      supabaseUrl: config.supabaseUrl,
      supabaseServiceRoleKey: config.supabaseServiceRoleKey,
    };

    config.storageDriver = "supabase";
    config.supabaseUrl = "https://example-project.supabase.co";
    config.supabaseServiceRoleKey = "test-service-role-key-not-sensitive";

    try {
      const storage = new StorageService(
        new FakeStorageAdapter("local") as never,
        new FakeStorageAdapter("supabase") as never,
      );

      await expect(
        storage.uploadFile("folder", "file.txt", Buffer.from(""), "text/plain"),
      ).resolves.toMatchObject({
        storagePath: "supabase",
      });
    } finally {
      config.storageDriver = original.storageDriver;
      config.supabaseUrl = original.supabaseUrl;
      config.supabaseServiceRoleKey = original.supabaseServiceRoleKey;
    }
  });

  it("falls back to local storage if the selected Supabase adapter reports missing credentials", async () => {
    const original = {
      storageDriver: config.storageDriver,
      supabaseUrl: config.supabaseUrl,
      supabaseServiceRoleKey: config.supabaseServiceRoleKey,
    };

    config.storageDriver = "supabase";
    config.supabaseUrl = "https://example-project.supabase.co";
    config.supabaseServiceRoleKey = "test-service-role-key-not-sensitive";

    try {
      const storage = new StorageService(
        new FakeStorageAdapter("local") as never,
        new FakeStorageAdapter("supabase", "Supabase credentials not configured") as never,
      );

      await expect(
        storage.uploadFile("folder", "file.txt", Buffer.from(""), "text/plain"),
      ).resolves.toMatchObject({
        storagePath: "local",
      });
    } finally {
      config.storageDriver = original.storageDriver;
      config.supabaseUrl = original.supabaseUrl;
      config.supabaseServiceRoleKey = original.supabaseServiceRoleKey;
    }
  });

  it("uses local storage when Supabase is requested with placeholders", async () => {
    const original = {
      storageDriver: config.storageDriver,
      supabaseUrl: config.supabaseUrl,
      supabaseServiceRoleKey: config.supabaseServiceRoleKey,
    };

    config.storageDriver = "supabase";
    config.supabaseUrl = "https://[YOUR-PROJECT-REF].supabase.co";
    config.supabaseServiceRoleKey = "[YOUR-SERVICE-ROLE-KEY]";

    try {
      const storage = new StorageService(
        new FakeStorageAdapter("local") as never,
        new FakeStorageAdapter("supabase") as never,
      );

      await expect(
        storage.uploadFile("folder", "file.txt", Buffer.from(""), "text/plain"),
      ).resolves.toMatchObject({
        storagePath: "local",
      });
    } finally {
      config.storageDriver = original.storageDriver;
      config.supabaseUrl = original.supabaseUrl;
      config.supabaseServiceRoleKey = original.supabaseServiceRoleKey;
    }
  });
});
