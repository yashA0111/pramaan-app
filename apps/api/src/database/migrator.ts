import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as path from "path";
import { config } from "../config/env.config";

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
    const migrationsFolder = path.resolve(__dirname, "migrations");
    await migrate(db, { migrationsFolder });
    console.log("✅ Drizzle database migrations completed successfully.");
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
