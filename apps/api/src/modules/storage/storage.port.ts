export interface UploadResult {
  storagePath: string;
  publicUrl?: string;
  mimeType: string;
  fileSize: number;
  checksum?: string;
}

export interface StoragePort {
  uploadFile(
    folder: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult>;

  getFile(storagePath: string): Promise<{ buffer: Buffer; mimeType: string }>;

  deleteFile(storagePath: string): Promise<boolean>;
}
