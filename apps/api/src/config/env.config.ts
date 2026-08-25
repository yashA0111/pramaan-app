import * as dotenv from "dotenv";
import * as path from "path";

// Load root .env first, then local api .env if present
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseStorageBucket: string;
  storageDriver: "local" | "supabase";
  localStorageDir: string;
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
    : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
  demoAdminEmails: (process.env.DEMO_ADMIN_EMAILS || "admin@pramaan.dev,demo-admin@pramaan.dev")
    .split(",")
    .map((e) => e.trim().toLowerCase()),
  biometricServiceUrl: process.env.BIOMETRIC_SERVICE_URL || "http://127.0.0.1:8000",
  biometricServiceToken: process.env.BIOMETRIC_SERVICE_TOKEN,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "pramaan-demo-assets",
  storageDriver: (process.env.STORAGE_DRIVER as "local" | "supabase") || "local",
  localStorageDir: process.env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), "uploads"),
};
