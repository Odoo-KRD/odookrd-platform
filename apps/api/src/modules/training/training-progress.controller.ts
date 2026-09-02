import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { UpdateTrainingLessonProgressDto } from './dto/training-progress.dto';
import { TrainingProgressService } from './training-progress.service';

@Controller('training/progress')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_READ)
export class TrainingProgressController {
  constructor(private readonly progress: TrainingProgressService) {}

  @Get('continue')
  continueLearning(@CurrentUser() principal: AuthenticatedPrincipal) {
    return this.progress.continueLearning(principal);
  }

  @Get('courses/:slug')
  course(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
  ) {
    return this.progress.getCourse(principal, slug);
  }

  @Get('courses/:slug/lessons/:lessonId')
  lesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
  ) {
    return this.progress.getLesson(principal, slug, lessonId);
  }

  @Post('courses/:slug/lessons/:lessonId/start')
  startLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
  ) {
    return this.progress.startLesson(principal, slug, lessonId);
  }

  @Patch('courses/:slug/lessons/:lessonId')
  updateLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() body: UpdateTrainingLessonProgressDto,
  ) {
    return this.progress.updateLesson(principal, slug, lessonId, body);
  }

  @Post('courses/:slug/lessons/:lessonId/complete')
  completeLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
  ) {
    return this.progress.completeLesson(principal, slug, lessonId);
  }
}
