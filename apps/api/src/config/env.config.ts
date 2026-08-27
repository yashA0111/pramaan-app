import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Find the repository environment file regardless of whether the API is
// launched from the workspace root or from apps/api.
for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
]) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  directDatabaseUrl: string;
  databasePoolerUrl: string;
  sessionSecret: string;
  corsOrigin: string | string[];
  demoAdminEmails: string[];
  biometricServiceUrl: string;
  biometricServiceToken?: string;
  biometricTimeoutMs: number;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseStorageBucket: string;
  storageDriver: "local" | "supabase";
  localStorageDir: string;
}

export function hasSupabaseStorageCredentials(
  appConfig: Pick<AppConfig, "supabaseUrl" | "supabaseServiceRoleKey">,
): appConfig is Pick<AppConfig, "supabaseUrl" | "supabaseServiceRoleKey"> & {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
} {
  return (
    isConfiguredSecret(appConfig.supabaseUrl) &&
    isConfiguredSecret(appConfig.supabaseServiceRoleKey)
  );
}

function isConfiguredSecret(value?: string): boolean {
  const normalized = normalizeEnvValue(value);
  return !!normalized && !normalized.includes("[") && !normalized.includes("]");
}

function envValue(name: string): string | undefined {
  return normalizeEnvValue(process.env[name]);
}

function normalizeEnvValue(value?: string): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || process.env.API_PORT || "3001", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  directDatabaseUrl: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "",
  databasePoolerUrl: process.env.DATABASE_POOLER_URL || "",
  sessionSecret: process.env.SESSION_SECRET || "pramaan-dev-secret-replace-in-production-32char",
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
      ],
  demoAdminEmails: (process.env.DEMO_ADMIN_EMAILS || "admin@pramaan.dev,demo-admin@pramaan.dev")
    .split(",")
    .map((e) => e.trim().toLowerCase()),
  biometricServiceUrl: process.env.BIOMETRIC_SERVICE_URL || "http://127.0.0.1:8000",
  biometricServiceToken: process.env.BIOMETRIC_SERVICE_TOKEN,
  biometricTimeoutMs: parseInt(process.env.BIOMETRIC_TIMEOUT_MS || "30000", 10),
  supabaseUrl: envValue("SUPABASE_URL"),
  supabaseServiceRoleKey: envValue("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: envValue("SUPABASE_STORAGE_BUCKET") || "pramaan-demo-assets",
  storageDriver: (envValue("STORAGE_DRIVER") as "local" | "supabase") || "local",
  localStorageDir: process.env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), "uploads"),
};
