import { Injectable, Logger } from "@nestjs/common";
import { config } from "../../config/env.config";
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
    if (
      config.storageDriver === "supabase" &&
      config.supabaseUrl &&
      config.supabaseServiceRoleKey
    ) {
      this.adapter = this.supabaseAdapter;
      this.logger.log("Using Supabase Storage adapter.");
    } else {
      this.adapter = this.localAdapter;
      this.logger.log("Using Local File Storage adapter.");
    }
  }

  async uploadFile(
    folder: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    return this.adapter.uploadFile(folder, filename, buffer, mimeType);
  }

  async getFile(storagePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    return this.adapter.getFile(storagePath);
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    return this.adapter.deleteFile(storagePath);
  }
}
