import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

export function configureApplication(app: INestApplication): void {
  app.use(helmet());

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
