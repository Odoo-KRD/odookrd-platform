import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { TrainingCourseCompletionService } from './training-course-completion.service';

@Controller('training/completions')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_READ)
export class TrainingCourseCompletionController {
  constructor(private readonly completions: TrainingCourseCompletionService) {}

  @Get('courses/:slug')
  course(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
  ) {
    return this.completions.getCourseStatus(principal, slug);
  }
}
