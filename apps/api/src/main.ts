import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { config } from "./config/env.config";
import { DatabaseService } from "./database/database.service";
import { runMigrations } from "./database/migrator";
import { runSeed } from "./database/seeds/seed";

async function bootstrap() {
  const logger = new Logger("PramaanAPI");
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or matched origins
      if (!origin) return callback(null, true);
      const allowed = Array.isArray(config.corsOrigin)
        ? config.corsOrigin
        : [config.corsOrigin];
      if (allowed.includes(origin) || allowed.includes("*") || origin.includes("localhost")) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "x-user-id",
      "x-demo-role",
      "x-user-role",
      "x-user-email",
      "x-user-name",
      "x-request-id",
      "x-correlation-id",
    ],
  });

  // OpenAPI Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Pramaan API")
    .setDescription(
      "Authoritative backend for Pramaan citizen verification, official confirmation, safety hub, and demo admin management.",
    )
    .setVersion("0.2.0")
    .addTag("Authentication")
    .addTag("Verification Session")
    .addTag("Official Confirmation")
    .addTag("Public Safety")
    .addTag("Activity & History")
    .addTag("Demo Admin")
    .addTag("Health & Diagnostics")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/v1/docs", app, document);

  // Attempt auto-migration and seed if DB is reachable
  const dbService = app.get(DatabaseService);
  if (dbService.isConnected) {
    logger.log("Checking and applying database migrations...");
    const migrated = await runMigrations().catch((err) => {
      logger.warn(`Auto-migration failed: ${err.message}`);
      return false;
    });

    if (migrated) {
      logger.log("Seeding synthetic demo records...");
      await runSeed().catch((err) => {
        logger.warn(`Auto-seed failed: ${err.message}`);
      });
    }
  }

  const port = config.port;
  await app.listen(port);

  logger.log(`🚀 Pramaan API is running on http://localhost:${port}/api/v1`);
  logger.log(`📚 OpenAPI documentation available at http://localhost:${port}/api/v1/docs`);
  logger.log(`🏥 Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap().catch((err) => {
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
