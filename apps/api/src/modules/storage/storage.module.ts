import { Global, Module } from "@nestjs/common";
import { LocalStorageAdapter } from "./local-storage.adapter";
import { StorageService } from "./storage.service";
import { SupabaseStorageAdapter } from "./supabase-storage.adapter";

@Global()
@Module({
  providers: [LocalStorageAdapter, SupabaseStorageAdapter, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
