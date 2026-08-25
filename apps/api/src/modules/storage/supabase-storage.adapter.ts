import { Injectable, Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as crypto from "crypto";
import { config } from "../../config/env.config";
import { StoragePort, UploadResult } from "./storage.port";

@Injectable()
export class SupabaseStorageAdapter implements StoragePort {
  private readonly logger = new Logger(SupabaseStorageAdapter.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor() {
    this.bucket = config.supabaseStorageBucket;
    if (
      config.supabaseUrl &&
      config.supabaseServiceRoleKey &&
      !config.supabaseUrl.includes("[") &&
      !config.supabaseServiceRoleKey.includes("[")
    ) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
        this.logger.log(`Initialized Supabase Storage client for bucket: ${this.bucket}`);
      } catch (err: any) {
        this.logger.warn(`Could not initialize Supabase Storage: ${err.message}`);
      }
    }
  }

  async uploadFile(
    folder: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    if (!this.supabase) {
      throw new Error("Supabase credentials not configured");
    }

    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `${folder}/${safeFilename}`;

    const { error } = await this.supabase.storage.from(this.bucket).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Supabase storage upload error: ${error.message}`);
    }

    const { data: publicData } = this.supabase.storage.from(this.bucket).getPublicUrl(storagePath);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      storagePath,
      publicUrl: publicData.publicUrl,
      mimeType,
      fileSize: buffer.length,
      checksum,
    };
  }

  async getFile(storagePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (!this.supabase) {
      throw new Error("Supabase credentials not configured");
    }

    const { data, error } = await this.supabase.storage.from(this.bucket).download(storagePath);
    if (error || !data) {
      throw new Error(`Supabase storage download error: ${error?.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: data.type || "application/octet-stream",
    };
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    if (!this.supabase) return false;
    const { error } = await this.supabase.storage.from(this.bucket).remove([storagePath]);
    return !error;
  }
}
