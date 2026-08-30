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
import { AttachTrainingSlidesDto } from './dto/training-media.dto';
import {
  AddTrainingLessonResourceDto,
  ReorderTrainingLessonResourcesDto,
  SetTrainingLessonContentTypeDto,
  UpdateTrainingLessonArticleDto,
  UpdateTrainingLessonGeneralDto,
  UpdateTrainingLessonResourceDto,
} from './dto/training-lesson-editor.dto';
import { TrainingLessonEditorService } from './training-lesson-editor.service';
import { TrainingMediaService } from './training-media.service';

@Controller('training')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
export class TrainingLessonEditorController {
  constructor(
    private readonly editor: TrainingLessonEditorService,
    private readonly media: TrainingMediaService,
  ) {}

  @Get('courses/:courseId/sections/:sectionId/lessons/:lessonId/editor')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  getEditor(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.editor.getEditor(principal, courseId, sectionId, lessonId);
  }

  @Patch(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/general',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  updateGeneral(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: UpdateTrainingLessonGeneralDto,
  ) {
    return this.editor.updateGeneral(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Put(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/content-type',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  setContentType(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: SetTrainingLessonContentTypeDto,
  ) {
    return this.editor.setContentType(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Delete(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/content',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  clearContent(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.editor.clearContent(principal, courseId, sectionId, lessonId);
  }

  @Put('courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/article')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  updateArticle(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: UpdateTrainingLessonArticleDto,
  ) {
    return this.editor.updateArticle(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/document',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  async attachDocument(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: AttachTrainingSlidesDto,
  ) {
    await this.media.attachDocument(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
    return this.editor.getEditor(principal, courseId, sectionId, lessonId);
  }

  @Get('courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/review')
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  getReview(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.editor.getReview(principal, courseId, sectionId, lessonId);
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/resources',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  addResource(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: AddTrainingLessonResourceDto,
  ) {
    return this.editor.addResource(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }

  @Patch(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/resources/:resourceId',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  updateResource(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
    @Body() input: UpdateTrainingLessonResourceDto,
  ) {
    return this.editor.updateResource(
      principal,
      courseId,
      sectionId,
      lessonId,
      resourceId,
      input,
    );
  }

  @Delete(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/resources/:resourceId',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  deleteResource(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ) {
    return this.editor.deleteResource(
      principal,
      courseId,
      sectionId,
      lessonId,
      resourceId,
    );
  }

  @Post(
    'courses/:courseId/sections/:sectionId/lessons/:lessonId/editor/resources/reorder',
  )
  @RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
  reorderResources(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: ReorderTrainingLessonResourcesDto,
  ) {
    return this.editor.reorderResources(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }
}
