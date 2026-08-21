import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

import { apiLocaleMiddleware } from './i18n';
import { LocalizedContentInterceptor } from './i18n/localized-content';

export function configureApplication(app: INestApplication): void {
  app.use(helmet());
  app.use(apiLocaleMiddleware);
  app.useGlobalInterceptors(new LocalizedContentInterceptor());

  app.setGlobalPrefix('v1', {
    exclude: ['health/live', 'health/ready'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
