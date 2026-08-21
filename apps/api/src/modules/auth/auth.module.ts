import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { LoginThrottleService } from './login-throttle.service';
import { PasswordService } from './password.service';
import { PlatformAdminBootstrapService } from './platform-admin-bootstrap.service';
import { SessionService } from './session.service';

@Module({
  imports: [DatabaseModule, AuthorizationModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    SessionService,
    AuthenticatedGuard,
    PlatformAdminBootstrapService,
    LoginThrottleService,
  ],
  exports: [
    AuthService,
    PasswordService,
    SessionService,
    AuthenticatedGuard,
    PlatformAdminBootstrapService,
    LoginThrottleService,
  ],
})
export class AuthModule {}
