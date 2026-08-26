import { Injectable, Logger } from "@nestjs/common";
import { config, hasSupabaseStorageCredentials } from "../../config/env.config";
import { LocalStorageAdapter } from "./local-storage.adapter";
import { StoragePort, UploadResult } from "./storage.port";
import { SupabaseStorageAdapter } from "./supabase-storage.adapter";

@Injectable()
export class StorageService implements StoragePort {
  private readonly logger = new Logger(StorageService.name);
  private adapter: StoragePort;

  constructor(
    private readonly localAdapter: LocalStorageAdapter,
    private readonly supabaseAdapter: SupabaseStorageAdapter,
  ) {
    if (config.storageDriver === "supabase" && hasSupabaseStorageCredentials(config)) {
      this.adapter = this.supabaseAdapter;
      this.logger.log("Using Supabase Storage adapter.");
    } else {
      this.adapter = this.localAdapter;
      if (config.storageDriver === "supabase") {
        this.logger.warn(
          "Supabase Storage requested without complete credentials; using Local File Storage adapter.",
        );
      } else {
        this.logger.log("Using Local File Storage adapter.");
      }
    }
  }

  async uploadFile(
    folder: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    try {
      return await this.adapter.uploadFile(folder, filename, buffer, mimeType);
    } catch (err: any) {
      if (!this.shouldFallBackToLocal(err)) throw err;

      this.logger.warn(
        `Supabase Storage unavailable during upload (${err.message}); retrying with Local File Storage adapter.`,
      );
      return this.localAdapter.uploadFile(folder, filename, buffer, mimeType);
    }
  }

  async getFile(storagePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      return await this.adapter.getFile(storagePath);
    } catch (err: any) {
      if (!this.shouldFallBackToLocal(err)) throw err;

      this.logger.warn(
        `Supabase Storage unavailable during read (${err.message}); retrying with Local File Storage adapter.`,
      );
      return this.localAdapter.getFile(storagePath);
    }
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      return await this.adapter.deleteFile(storagePath);
    } catch (err: any) {
      if (!this.shouldFallBackToLocal(err)) throw err;

      this.logger.warn(
        `Supabase Storage unavailable during delete (${err.message}); retrying with Local File Storage adapter.`,
      );
      return this.localAdapter.deleteFile(storagePath);
    }
  }

  private shouldFallBackToLocal(err: any): boolean {
    return (
      this.adapter === this.supabaseAdapter &&
      err?.message === "Supabase credentials not configured"
    );
  }
}
