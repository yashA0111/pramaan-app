import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { config } from "../../config/env.config";
import { StoragePort, UploadResult } from "./storage.port";

@Injectable()
export class LocalStorageAdapter implements StoragePort {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = config.localStorageDir;
  }

  async uploadFile(
    folder: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    const targetDir = path.join(this.baseDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(targetDir, safeFilename);

    await fs.writeFile(filePath, buffer);

    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const relativePath = path.join(folder, safeFilename).replace(/\\/g, "/");

    this.logger.log(`Uploaded file to local storage: ${relativePath}`);

    return {
      storagePath: relativePath,
      publicUrl: `/api/v1/demo/assets/files/${relativePath}`,
      mimeType,
      fileSize: buffer.length,
      checksum,
    };
  }

  async getFile(storagePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(this.baseDir, normalized);
    const buffer = await fs.readFile(fullPath);

    let mimeType = "application/octet-stream";
    if (storagePath.endsWith(".jpg") || storagePath.endsWith(".jpeg")) mimeType = "image/jpeg";
    else if (storagePath.endsWith(".png")) mimeType = "image/png";
    else if (storagePath.endsWith(".webp")) mimeType = "image/webp";

    return { buffer, mimeType };
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
      const fullPath = path.join(this.baseDir, normalized);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
