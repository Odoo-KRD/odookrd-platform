import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { environmentValidationSchema } from './config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

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
  ],
})
export class AppModule {}
