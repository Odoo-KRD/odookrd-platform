import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import {
  ReorderTrainingQuizQuestionsDto,
  UpsertTrainingQuizDto,
  UpsertTrainingQuizQuestionDto,
} from './dto/training-quiz-admin.dto';
import { TrainingQuizAdminService } from './training-quiz-admin.service';

@Controller('training')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
export class TrainingQuizAdminController {
  constructor(private readonly quizzes: TrainingQuizAdminService) {}

  @Get('courses/:courseId/sections/:sectionId/lessons/:lessonId/quiz')
  getLessonQuiz(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.quizzes.getLessonQuiz(principal, courseId, sectionId, lessonId);
  }

  @Put('courses/:courseId/sections/:sectionId/lessons/:lessonId/quiz')
  upsertLessonQuiz(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: UpsertTrainingQuizDto,
  ) {
    return this.quizzes.upsertLessonQuiz(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Get('courses/:courseId/final-quiz')
  getFinalQuiz(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.quizzes.getFinalQuiz(principal, courseId);
  }

  @Put('courses/:courseId/final-quiz')
  upsertFinalQuiz(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() input: UpsertTrainingQuizDto,
  ) {
    return this.quizzes.upsertFinalQuiz(principal, courseId, input);
  }

  @Post('quizzes/:quizId/draft-from-published')
  createDraftFromPublished(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    return this.quizzes.createDraftFromPublished(principal, quizId);
  }

  @Post('quizzes/:quizId/questions')
  addQuestion(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() input: UpsertTrainingQuizQuestionDto,
  ) {
    return this.quizzes.addQuestion(principal, quizId, input);
  }

  @Patch('quizzes/:quizId/questions/reorder')
  reorderQuestions(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() input: ReorderTrainingQuizQuestionsDto,
  ) {
    return this.quizzes.reorderQuestions(principal, quizId, input);
  }

  @Patch('quizzes/:quizId/questions/:questionId')
  updateQuestion(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() input: UpsertTrainingQuizQuestionDto,
  ) {
    return this.quizzes.updateQuestion(principal, quizId, questionId, input);
  }

  @Delete('quizzes/:quizId/questions/:questionId')
  deleteQuestion(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.quizzes.deleteQuestion(principal, quizId, questionId);
  }

  @Post('quizzes/:quizId/publish')
  publish(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    return this.quizzes.publish(principal, quizId);
  }
}
