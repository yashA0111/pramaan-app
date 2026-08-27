import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config/env.config";

function findMigrationsFolder(): string {
  const candidatePaths = [
    path.resolve(__dirname, "migrations"),
    path.resolve(__dirname, "../../src/database/migrations"),
    path.resolve(process.cwd(), "dist/database/migrations"),
    path.resolve(process.cwd(), "src/database/migrations"),
    path.resolve(process.cwd(), "apps/api/src/database/migrations"),
    path.resolve(process.cwd(), "apps/api/dist/database/migrations"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(__dirname, "migrations");
}

export async function runMigrations(): Promise<boolean> {
  const connStr = config.directDatabaseUrl || config.databaseUrl;
  if (!connStr) {
    console.error("❌ DATABASE_URL is not set. Cannot run migrations.");
    return false;
  }

  console.log(`🔄 Running Drizzle migrations on PostgreSQL...`);
  const sql = (typeof postgres === "function" ? postgres : (postgres as any).default) as typeof postgres;
  const client = sql(connStr, { max: 1 });
  const db = drizzle(client);

  try {
    const migrationsFolder = findMigrationsFolder();
    await migrate(db, { migrationsFolder });
    console.log(`✅ Drizzle database migrations completed successfully using ${migrationsFolder}.`);
    return true;
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    return false;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
