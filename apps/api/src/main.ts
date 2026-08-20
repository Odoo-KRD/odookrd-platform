import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  configureApplication(app);

  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');

  await app.listen(port, '127.0.0.1');
}

void bootstrap();
