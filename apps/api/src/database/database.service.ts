import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../config/env.config";
import * as schema from "./schema";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public client: postgres.Sql | null = null;
  public db: PostgresJsDatabase<typeof schema> | null = null;
  public isConnected = false;

  async onModuleInit() {
    await this.connect();
  }

  async connect(): Promise<boolean> {
    const connStr = config.directDatabaseUrl || config.databaseUrl;
    if (!connStr) {
      this.logger.warn(
        "DATABASE_URL is not configured. Backend starting in memory/diagnostic mode.",
      );
      return false;
    }

    try {
      const sql = (typeof postgres === "function" ? postgres : (postgres as any).default) as typeof postgres;
      this.client = sql(connStr, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        onnotice: () => {}, // Suppress noisy PG notices
      });

      this.db = drizzle(this.client, { schema });

      // Test connection
      await this.client`SELECT 1`;
      this.isConnected = true;
      this.logger.log("Successfully connected to PostgreSQL database (Supabase).");
      return true;
    } catch (error: any) {
      this.logger.error(
        `Could not connect to PostgreSQL at ${connStr.replace(/:[^:@]+@/, ":***@")}: ${error.message}`,
      );
      this.isConnected = false;
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end();
      this.logger.log("PostgreSQL connection pool closed.");
    }
  }
}
