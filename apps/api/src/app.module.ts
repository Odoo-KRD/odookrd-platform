import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'staging', 'production')
          .required(),

        PORT: Joi.number().port().default(4000),

        DATABASE_URL: Joi.string().uri().required(),
      }),
    }),

    HealthModule,
  ],
})
export class AppModule {}
