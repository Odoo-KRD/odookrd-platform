import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { SaveTrainingQuizAnswerDto } from './dto/training-quiz-attempt.dto';
import { TrainingQuizAttemptService } from './training-quiz-attempt.service';

@Controller('training/catalog/:slug/quizzes')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_READ)
export class TrainingQuizAttemptController {
  constructor(private readonly attempts: TrainingQuizAttemptService) {}

  @Get(':quizId')
  getQuiz(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    return this.attempts.getQuiz(principal, slug, quizId);
  }

  @Post(':quizId/attempts')
  startAttempt(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    return this.attempts.startAttempt(principal, slug, quizId);
  }

  @Get(':quizId/attempts/:attemptId')
  getAttempt(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.attempts.getAttempt(principal, slug, quizId, attemptId);
  }

  @Put(':quizId/attempts/:attemptId/answers/:questionId')
  saveAnswer(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() input: SaveTrainingQuizAnswerDto,
  ) {
    return this.attempts.saveAnswer(
      principal,
      slug,
      quizId,
      attemptId,
      questionId,
      input,
    );
  }

  @Post(':quizId/attempts/:attemptId/submit')
  submitAttempt(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.attempts.submitAttempt(principal, slug, quizId, attemptId);
  }

  @Get(':quizId/history')
  history(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('slug') slug: string,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    return this.attempts.history(principal, slug, quizId);
  }
}
