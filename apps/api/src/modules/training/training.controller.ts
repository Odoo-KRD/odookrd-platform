import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import {
  BatchTrainingCategoryStatusDto,
  BatchTrainingCourseStatusDto,
  CreateTrainingCategoryDto,
  CreateTrainingCourseDto,
  CreateTrainingLessonDto,
  CreateTrainingSectionDto,
  ListTrainingCategoriesQueryDto,
  ListTrainingCoursesQueryDto,
  UpdateTrainingCategoryDto,
  UpdateTrainingCourseDto,
  UpdateTrainingLessonDto,
  UpdateTrainingSectionDto,
  UpdateTrainingCourseStructureDto,
} from './dto/training-content.dto';
import { TrainingService } from './training.service';

@Controller('training')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.TRAINING_MANAGE)
export class TrainingController {
  constructor(private readonly training: TrainingService) {}

  @Get('categories')
  listCategories(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListTrainingCategoriesQueryDto,
  ) {
    return this.training.listCategories(principal, query);
  }

  @Post('categories')
  createCategory(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateTrainingCategoryDto,
  ) {
    return this.training.createCategory(principal, input);
  }

  @Post('categories/batch-status')
  batchCategoryStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: BatchTrainingCategoryStatusDto,
  ) {
    return this.training.batchCategoryStatus(principal, input);
  }

  @Get('categories/:categoryId')
  getCategory(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.training.getCategory(principal, categoryId);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() input: UpdateTrainingCategoryDto,
  ) {
    return this.training.updateCategory(principal, categoryId, input);
  }

  @Delete('categories/:categoryId')
  deleteCategory(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.training.deleteCategory(principal, categoryId);
  }

  @Get('courses')
  listCourses(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListTrainingCoursesQueryDto,
  ) {
    return this.training.listCourses(principal, query);
  }

  @Post('courses')
  createCourse(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateTrainingCourseDto,
  ) {
    return this.training.createCourse(principal, input);
  }

  @Post('courses/batch-status')
  batchCourseStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: BatchTrainingCourseStatusDto,
  ) {
    return this.training.batchCourseStatus(principal, input);
  }

  @Get('courses/:courseId')
  getCourse(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.training.getCourse(principal, courseId);
  }

  @Get('courses/:courseId/structure')
  getCourseStructure(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.training.getCourseStructure(principal, courseId);
  }

  @Patch('courses/:courseId/structure')
  updateCourseStructure(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() input: UpdateTrainingCourseStructureDto,
  ) {
    return this.training.updateCourseStructure(principal, courseId, input);
  }

  @Patch('courses/:courseId')
  updateCourse(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() input: UpdateTrainingCourseDto,
  ) {
    return this.training.updateCourse(principal, courseId, input);
  }

  @Delete('courses/:courseId')
  deleteCourse(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.training.deleteCourse(principal, courseId);
  }

  @Get('courses/:courseId/sections')
  listSections(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.training.listSections(principal, courseId);
  }

  @Post('courses/:courseId/sections')
  createSection(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() input: CreateTrainingSectionDto,
  ) {
    return this.training.createSection(principal, courseId, input);
  }

  @Get('courses/:courseId/sections/:sectionId')
  getSection(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.training.getSection(principal, courseId, sectionId);
  }

  @Patch('courses/:courseId/sections/:sectionId')
  updateSection(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() input: UpdateTrainingSectionDto,
  ) {
    return this.training.updateSection(principal, courseId, sectionId, input);
  }

  @Delete('courses/:courseId/sections/:sectionId')
  deleteSection(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.training.deleteSection(principal, courseId, sectionId);
  }

  @Get('courses/:courseId/sections/:sectionId/lessons')
  listLessons(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.training.listLessons(principal, courseId, sectionId);
  }

  @Post('courses/:courseId/sections/:sectionId/lessons')
  createLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() input: CreateTrainingLessonDto,
  ) {
    return this.training.createLesson(principal, courseId, sectionId, input);
  }

  @Get('courses/:courseId/sections/:sectionId/lessons/:lessonId')
  getLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.training.getLesson(principal, courseId, sectionId, lessonId);
  }

  @Delete('courses/:courseId/sections/:sectionId/lessons/:lessonId')
  deleteLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.training.deleteLesson(principal, courseId, sectionId, lessonId);
  }

  @Patch('courses/:courseId/sections/:sectionId/lessons/:lessonId')
  updateLesson(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() input: UpdateTrainingLessonDto,
  ) {
    return this.training.updateLesson(
      principal,
      courseId,
      sectionId,
      lessonId,
      input,
    );
  }
}
