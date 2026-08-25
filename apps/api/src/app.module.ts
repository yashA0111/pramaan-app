import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { CorrelationIdInterceptor } from "./common/interceptors/correlation-id.interceptor";
import { DatabaseModule } from "./database/database.module";
import { ActivityModule } from "./modules/activity/activity.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ConfirmationModule } from "./modules/confirmation/confirmation.module";
import { CredentialsModule } from "./modules/credentials/credentials.module";
import { DemoAdminModule } from "./modules/demo-admin/demo-admin.module";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { SafetyModule } from "./modules/safety/safety.module";
import { StorageModule } from "./modules/storage/storage.module";
import { VerificationModule } from "./modules/verification/verification.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuditModule,
    StorageModule,
    AuthModule,
    CredentialsModule,
    IdentityModule,
    ConfirmationModule,
    VerificationModule,
    ActivityModule,
    SafetyModule,
    DemoAdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
