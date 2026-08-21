import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { environmentValidationSchema } from './config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { HealthModule } from './modules/health/health.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
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
    SettingsModule,
  ],
})
export class AppModule {}
