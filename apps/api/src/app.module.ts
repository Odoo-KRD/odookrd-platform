import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { environmentValidationSchema } from './config/env.validation';
import { buildLoggerOptions } from './infrastructure/logging/logger.config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { HealthModule } from './modules/health/health.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TrainingModule } from './modules/training/training.module';
import { FilesModule } from './modules/files/files.module';

import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { UserAdministrationModule } from './modules/user-administration/user-administration.module';
@Module({
  imports: [
    UserAdministrationModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildLoggerOptions(config.get<string>('NODE_ENV') ?? 'development'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: environmentValidationSchema,
    }),

    DatabaseModule,
    HealthModule,
    AuthModule,
    AuthorizationModule,
    CompaniesModule,
    RolesModule,
    UsersModule,
    ServicesModule,
    SubscriptionsModule,
    SettingsModule,
    NotificationsModule,
    TrainingModule,
    FilesModule,
    WorkspaceModule,
  ],
})
export class AppModule {}
