import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

async function bootstrap(): Promise<void> {
  // bufferLogs holds startup output until pino is resolved, so boot messages
  // are structured too rather than falling back to the default logger.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  configureApplication(app);

  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');

  await app.listen(port, '0.0.0.0');
}

void bootstrap();
