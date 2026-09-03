import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  FileAssetKind,
  FileAssetStatus,
  TrainingCategoryStatus,
  TrainingContentStatus,
  TrainingCourseStatus,
} from '../../generated/prisma/enums';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type {
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
import { evaluateTrainingLessonReadiness } from './training-lesson-readiness';

const categorySelect = {
  id: true,
  key: true,
  name: true,
  nameTranslations: true,
  description: true,
  descriptionTranslations: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { courses: true } },
} satisfies Prisma.TrainingCategorySelect;

const courseSelect = {
  id: true,
  categoryId: true,
  slug: true,
  title: true,
  titleTranslations: true,
  summary: true,
  summaryTranslations: true,
  thumbnailUrl: true,
  coverImageAssetId: true,
  certificateEnabled: true,
  certificateTemplateId: true,
  status: true,
  sortOrder: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      key: true,
      name: true,
      nameTranslations: true,
      status: true,
    },
  },
  _count: { select: { sections: true, lessons: true } },
} satisfies Prisma.TrainingCourseSelect;

const sectionSelect = {
  id: true,
  courseId: true,
  title: true,
  titleTranslations: true,
  description: true,
  descriptionTranslations: true,
  richDescriptionTranslations: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { lessons: true } },
} satisfies Prisma.TrainingSectionSelect;

const lessonSelect = {
  id: true,
  courseId: true,
  sectionId: true,
  videoAssetId: true,
  contentType: true,
  documentAssetId: true,
  documentPageCount: true,
  articleContentTranslations: true,
  videoAsset: { select: { status: true } },
  documentAsset: { select: { status: true } },
  title: true,
  titleTranslations: true,
  description: true,
  descriptionTranslations: true,
  richDescriptionTranslations: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TrainingVideoLessonSelect;

type CategoryRecord = Prisma.TrainingCategoryGetPayload<{
  select: typeof categorySelect;
}>;
type CourseRecord = Prisma.TrainingCourseGetPayload<{
  select: typeof courseSelect;
}>;
type SectionRecord = Prisma.TrainingSectionGetPayload<{
  select: typeof sectionSelect;
}>;
type LessonRecord = Prisma.TrainingVideoLessonGetPayload<{
  select: typeof lessonSelect;
}>;

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(
    principal: AuthenticatedPrincipal,
    query: ListTrainingCategoriesQueryDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const search = query.search?.trim();
    const where: Prisma.TrainingCategoryWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { key: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trainingCategory.findMany({
        where,
        select: categorySelect,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCategory.count({ where }),
    ]);

    return {
      items: items.map((item) => this.presentCategory(item)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getCategory(principal: AuthenticatedPrincipal, categoryId: string) {
    this.assertPlatformAdministrator(principal);
    const category = await this.prisma.trainingCategory.findUnique({
      where: { id: categoryId },
      select: categorySelect,
    });

    if (!category) {
      throw new NotFoundException('Training category was not found.');
    }

    return this.presentCategory(category);
  }

  async createCategory(
    principal: AuthenticatedPrincipal,
    input: CreateTrainingCategoryDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('Training category name cannot be blank.');
    }

    const category = await this.prisma.$transaction(async (transaction) => {
      const duplicate = await transaction.trainingCategory.findUnique({
        where: { key: input.key },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          'A training category with this key already exists.',
        );
      }

      const created = await transaction.trainingCategory.create({
        data: {
          key: input.key,
          name,
          nameTranslations: normalizeLocalizedText(
            input.nameTranslations,
            name,
          ),
          description: this.optionalText(input.description),
          descriptionTranslations: normalizeLocalizedText(
            input.descriptionTranslations,
            input.description,
          ),
          status: input.status ?? TrainingCategoryStatus.ACTIVE,
          sortOrder: input.sortOrder ?? 0,
        },
        select: categorySelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_CATEGORY_CREATED,
          targetType: 'training_category',
          targetId: created.id,
          metadata: { key: created.key, status: created.status },
        },
      });

      return created;
    });

    return this.presentCategory(category);
  }

  async updateCategory(
    principal: AuthenticatedPrincipal,
    categoryId: string,
    input: UpdateTrainingCategoryDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const existing = await this.prisma.trainingCategory.findUnique({
      where: { id: categoryId },
      select: categorySelect,
    });

    if (!existing) {
      throw new NotFoundException('Training category was not found.');
    }

    const name = input.name?.trim();
    if (input.name !== undefined && !name) {
      throw new BadRequestException('Training category name cannot be blank.');
    }

    const category = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.trainingCategory.update({
        where: { id: categoryId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(input.nameTranslations !== undefined
            ? {
                nameTranslations: normalizeLocalizedText(
                  input.nameTranslations,
                  name ?? existing.name,
                ),
              }
            : {}),
          ...(input.description !== undefined
            ? { description: this.optionalText(input.description) }
            : {}),
          ...(input.descriptionTranslations !== undefined
            ? {
                descriptionTranslations: normalizeLocalizedText(
                  input.descriptionTranslations,
                  input.description !== undefined
                    ? input.description
                    : existing.description,
                ),
              }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.sortOrder !== undefined
            ? { sortOrder: input.sortOrder }
            : {}),
        },
        select: categorySelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_CATEGORY_UPDATED,
          targetType: 'training_category',
          targetId: updated.id,
          metadata: {
            key: updated.key,
            status: updated.status,
            sortOrder: updated.sortOrder,
          },
        },
      });

      return updated;
    });

    return this.presentCategory(category);
  }

  async batchCategoryStatus(
    principal: AuthenticatedPrincipal,
    input: BatchTrainingCategoryStatusDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const ids = this.uniqueBatchIds(input.ids);

    const existing = await this.prisma.trainingCategory.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException(
        'One or more training categories were not found.',
      );
    }

    const changedIds = existing
      .filter((item) => item.status !== input.status)
      .map((item) => item.id);

    if (changedIds.length > 0) {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.trainingCategory.updateMany({
          where: { id: { in: changedIds } },
          data: { status: input.status },
        });
        await transaction.auditLog.createMany({
          data: changedIds.map((id) => ({
            actorUserId: principal.userId,
            action: AUDIT_ACTIONS.TRAINING_CATEGORY_BATCH_STATUS_CHANGED,
            targetType: 'training_category',
            targetId: id,
            metadata: { status: input.status },
          })),
        });
      });
    }

    return {
      changed: changedIds.length,
      unchanged: ids.length - changedIds.length,
    };
  }

  async deleteCategory(
    principal: AuthenticatedPrincipal,
    categoryId: string,
  ): Promise<{ success: true }> {
    this.assertPlatformAdministrator(principal);

    await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.trainingCategory.findUnique({
        where: { id: categoryId },
        select: categorySelect,
      });

      if (!existing) {
        throw new NotFoundException('Training category was not found.');
      }

      if (existing.status !== TrainingCategoryStatus.INACTIVE) {
        throw new ConflictException(
          'Archive the training category before deleting it.',
        );
      }

      if (existing._count.courses > 0) {
        throw new ConflictException(
          'This training category contains courses and cannot be deleted. Keep it archived instead.',
        );
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_CATEGORY_DELETED,
          targetType: 'training_category',
          targetId: existing.id,
          metadata: { key: existing.key },
        },
      });

      await transaction.trainingCategory.delete({
        where: { id: existing.id },
      });
    });

    return { success: true };
  }

  async listCourses(
    principal: AuthenticatedPrincipal,
    query: ListTrainingCoursesQueryDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const search = query.search?.trim();
    const where: Prisma.TrainingCourseWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trainingCourse.findMany({
        where,
        select: courseSelect,
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCourse.count({ where }),
    ]);

    return {
      items: items.map((item) => this.presentCourse(item)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getCourse(principal: AuthenticatedPrincipal, courseId: string) {
    this.assertPlatformAdministrator(principal);
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
      select: courseSelect,
    });

    if (!course) {
      throw new NotFoundException('Training course was not found.');
    }

    return this.presentCourse(course);
  }

  async createCourse(
    principal: AuthenticatedPrincipal,
    input: CreateTrainingCourseDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const title = input.title.trim();
    if (!title) {
      throw new BadRequestException('Training course title cannot be blank.');
    }

    const course = await this.prisma.$transaction(async (transaction) => {
      await this.assertCategoryExists(transaction, input.categoryId);
      if (input.coverImageAssetId) {
        await this.assertCourseCoverImageAsset(
          transaction,
          input.coverImageAssetId,
        );
      }

      if (input.certificateEnabled) {
        if (!input.certificateTemplateId) {
          throw new BadRequestException(
            'Choose an active certificate template before enabling certificates.',
          );
        }
        await this.assertActiveCertificateTemplate(
          transaction,
          input.certificateTemplateId,
        );
      } else if (input.certificateTemplateId) {
        await this.assertCertificateTemplateExists(
          transaction,
          input.certificateTemplateId,
        );
      }

      const duplicate = await transaction.trainingCourse.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          'A training course with this slug already exists.',
        );
      }

      const status = input.status ?? TrainingCourseStatus.DRAFT;
      const created = await transaction.trainingCourse.create({
        data: {
          categoryId: input.categoryId,
          slug: input.slug,
          title,
          titleTranslations: normalizeLocalizedText(
            input.titleTranslations,
            title,
          ),
          summary: this.optionalText(input.summary),
          summaryTranslations: normalizeLocalizedText(
            input.summaryTranslations,
            input.summary,
          ),
          thumbnailUrl: this.optionalText(input.thumbnailUrl),
          coverImageAssetId: input.coverImageAssetId ?? null,
          certificateEnabled: input.certificateEnabled ?? false,
          certificateTemplateId: input.certificateTemplateId ?? null,
          status,
          sortOrder: input.sortOrder ?? 0,
          publishedAt:
            status === TrainingCourseStatus.PUBLISHED ? new Date() : null,
        },
        select: courseSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_COURSE_CREATED,
          targetType: 'training_course',
          targetId: created.id,
          metadata: {
            slug: created.slug,
            categoryId: created.categoryId,
            status: created.status,
          },
        },
      });

      return created;
    });

    return this.presentCourse(course);
  }

  async updateCourse(
    principal: AuthenticatedPrincipal,
    courseId: string,
    input: UpdateTrainingCourseDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const existing = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
      select: courseSelect,
    });

    if (!existing) {
      throw new NotFoundException('Training course was not found.');
    }

    const title = input.title?.trim();
    if (input.title !== undefined && !title) {
      throw new BadRequestException('Training course title cannot be blank.');
    }

    const course = await this.prisma.$transaction(async (transaction) => {
      if (input.categoryId && input.categoryId !== existing.categoryId) {
        await this.assertCategoryExists(transaction, input.categoryId);
      }
      if (
        input.coverImageAssetId !== undefined &&
        input.coverImageAssetId !== null &&
        input.coverImageAssetId !== existing.coverImageAssetId
      ) {
        await this.assertCourseCoverImageAsset(
          transaction,
          input.coverImageAssetId,
        );
      }

      const nextCertificateEnabled =
        input.certificateEnabled ?? existing.certificateEnabled;
      const nextCertificateTemplateId =
        input.certificateTemplateId !== undefined
          ? input.certificateTemplateId
          : existing.certificateTemplateId;

      if (nextCertificateEnabled) {
        if (!nextCertificateTemplateId) {
          throw new BadRequestException(
            'Choose an active certificate template before enabling certificates.',
          );
        }
        await this.assertActiveCertificateTemplate(
          transaction,
          nextCertificateTemplateId,
        );
      } else if (
        input.certificateTemplateId !== undefined &&
        input.certificateTemplateId !== null
      ) {
        await this.assertCertificateTemplateExists(
          transaction,
          input.certificateTemplateId,
        );
      }

      const nextStatus = input.status ?? existing.status;
      const publishedAt =
        nextStatus === TrainingCourseStatus.PUBLISHED
          ? (existing.publishedAt ?? new Date())
          : nextStatus === TrainingCourseStatus.DRAFT
            ? null
            : existing.publishedAt;

      const updated = await transaction.trainingCourse.update({
        where: { id: courseId },
        data: {
          ...(input.categoryId !== undefined
            ? { categoryId: input.categoryId }
            : {}),
          ...(title !== undefined ? { title } : {}),
          ...(input.titleTranslations !== undefined
            ? {
                titleTranslations: normalizeLocalizedText(
                  input.titleTranslations,
                  title ?? existing.title,
                ),
              }
            : {}),
          ...(input.summary !== undefined
            ? { summary: this.optionalText(input.summary) }
            : {}),
          ...(input.summaryTranslations !== undefined
            ? {
                summaryTranslations: normalizeLocalizedText(
                  input.summaryTranslations,
                  input.summary !== undefined
                    ? input.summary
                    : existing.summary,
                ),
              }
            : {}),
          ...(input.thumbnailUrl !== undefined
            ? { thumbnailUrl: this.optionalText(input.thumbnailUrl) }
            : {}),
          ...(input.coverImageAssetId !== undefined
            ? { coverImageAssetId: input.coverImageAssetId }
            : {}),
          ...(input.certificateEnabled !== undefined
            ? { certificateEnabled: input.certificateEnabled }
            : {}),
          ...(input.certificateTemplateId !== undefined
            ? { certificateTemplateId: input.certificateTemplateId }
            : {}),
          ...(input.status !== undefined
            ? { status: input.status, publishedAt }
            : {}),
          ...(input.sortOrder !== undefined
            ? { sortOrder: input.sortOrder }
            : {}),
        },
        select: courseSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_COURSE_UPDATED,
          targetType: 'training_course',
          targetId: updated.id,
          metadata: {
            slug: updated.slug,
            categoryId: updated.categoryId,
            status: updated.status,
            sortOrder: updated.sortOrder,
            certificateEnabled: updated.certificateEnabled,
            certificateTemplateId: updated.certificateTemplateId,
          },
        },
      });

      return updated;
    });

    return this.presentCourse(course);
  }

  async batchCourseStatus(
    principal: AuthenticatedPrincipal,
    input: BatchTrainingCourseStatusDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const ids = this.uniqueBatchIds(input.ids);

    const existing = await this.prisma.trainingCourse.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    });
    if (existing.length !== ids.length) {
      throw new NotFoundException(
        'One or more training courses were not found.',
      );
    }

    const changedIds = existing
      .filter((item) => item.status !== input.status)
      .map((item) => item.id);

    if (changedIds.length > 0) {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.trainingCourse.updateMany({
          where: { id: { in: changedIds } },
          data: {
            status: input.status,
            ...(input.status === TrainingCourseStatus.PUBLISHED
              ? { publishedAt: new Date() }
              : input.status === TrainingCourseStatus.DRAFT
                ? { publishedAt: null }
                : {}),
          },
        });
        await transaction.auditLog.createMany({
          data: changedIds.map((id) => ({
            actorUserId: principal.userId,
            action: AUDIT_ACTIONS.TRAINING_COURSE_BATCH_STATUS_CHANGED,
            targetType: 'training_course',
            targetId: id,
            metadata: { status: input.status },
          })),
        });
      });
    }

    return {
      changed: changedIds.length,
      unchanged: ids.length - changedIds.length,
    };
  }

  async getCourseStructure(
    principal: AuthenticatedPrincipal,
    courseId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertCourseExists(this.prisma, courseId);

    const sections = await this.prisma.trainingSection.findMany({
      where: { courseId },
      select: {
        ...sectionSelect,
        lessons: {
          select: lessonSelect,
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return {
      courseId,
      sections: sections.map((section) => {
        const { _count, ...rest } = section;
        return {
          ...rest,
          lessons: rest.lessons.map((lesson) => this.presentLesson(lesson)),
          lessonCount: _count.lessons,
        };
      }),
    };
  }

  async updateCourseStructure(
    principal: AuthenticatedPrincipal,
    courseId: string,
    input: UpdateTrainingCourseStructureDto,
  ) {
    this.assertPlatformAdministrator(principal);

    const [existingSections, existingLessons] = await this.prisma.$transaction([
      this.prisma.trainingSection.findMany({
        where: { courseId },
        select: { id: true },
      }),
      this.prisma.trainingVideoLesson.findMany({
        where: { courseId },
        select: { id: true },
      }),
    ]);

    const submittedSectionIds = input.sections.map((section) => section.id);
    const uniqueSectionIds = new Set(submittedSectionIds);
    if (uniqueSectionIds.size !== submittedSectionIds.length) {
      throw new BadRequestException(
        'Duplicate section identifiers are not allowed in course structure.',
      );
    }

    const existingSectionIds = new Set(
      existingSections.map((section) => section.id),
    );
    if (
      existingSectionIds.size !== uniqueSectionIds.size ||
      submittedSectionIds.some((id) => !existingSectionIds.has(id))
    ) {
      throw new BadRequestException(
        'Course structure must contain every section belonging to the course exactly once.',
      );
    }

    const submittedLessonIds = input.sections.flatMap((section) =>
      section.lessons.map((lesson) => lesson.id),
    );
    const uniqueLessonIds = new Set(submittedLessonIds);
    if (uniqueLessonIds.size !== submittedLessonIds.length) {
      throw new BadRequestException(
        'Duplicate lesson identifiers are not allowed in course structure.',
      );
    }

    const existingLessonIds = new Set(
      existingLessons.map((lesson) => lesson.id),
    );
    if (
      existingLessonIds.size !== uniqueLessonIds.size ||
      submittedLessonIds.some((id) => !existingLessonIds.has(id))
    ) {
      throw new BadRequestException(
        'Course structure must contain every lesson belonging to the course exactly once.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      for (const [sectionIndex, section] of input.sections.entries()) {
        await transaction.trainingSection.update({
          where: { id: section.id },
          data: { sortOrder: sectionIndex },
        });

        for (const [lessonIndex, lesson] of section.lessons.entries()) {
          await transaction.trainingVideoLesson.update({
            where: { id: lesson.id },
            data: { sectionId: section.id, sortOrder: lessonIndex },
          });
        }
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_COURSE_STRUCTURE_UPDATED,
          targetType: 'training_course',
          targetId: courseId,
          metadata: {
            sectionCount: input.sections.length,
            lessonCount: submittedLessonIds.length,
          },
        },
      });
    });

    return this.getCourseStructure(principal, courseId);
  }

  async deleteCourse(
    principal: AuthenticatedPrincipal,
    courseId: string,
  ): Promise<{ success: true }> {
    this.assertPlatformAdministrator(principal);

    await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.trainingCourse.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          slug: true,
          status: true,
        },
      });

      if (!existing) {
        throw new NotFoundException('Training course was not found.');
      }

      if (existing.status !== TrainingCourseStatus.ARCHIVED) {
        throw new ConflictException(
          'Archive the training course before deleting it.',
        );
      }

      const [
        companyAccess,
        serviceAccess,
        userAccess,
        lessonProgress,
        courseProgress,
        quizAttempts,
        completions,
        certificates,
      ] = await Promise.all([
        transaction.trainingCourseCompanyAccess.count({ where: { courseId } }),
        transaction.trainingCourseServiceAccess.count({ where: { courseId } }),
        transaction.trainingCourseUserAccess.count({ where: { courseId } }),
        transaction.trainingLessonProgress.count({ where: { courseId } }),
        transaction.trainingCourseProgress.count({ where: { courseId } }),
        transaction.trainingQuizAttempt.count({ where: { courseId } }),
        transaction.trainingCourseCompletion.count({ where: { courseId } }),
        transaction.trainingCertificate.count({ where: { courseId } }),
      ]);

      if (
        companyAccess > 0 ||
        serviceAccess > 0 ||
        userAccess > 0 ||
        lessonProgress > 0 ||
        courseProgress > 0 ||
        quizAttempts > 0 ||
        completions > 0 ||
        certificates > 0
      ) {
        throw new ConflictException(
          'This course has access assignments or learner history and cannot be deleted. Keep it archived instead.',
        );
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_COURSE_DELETED,
          targetType: 'training_course',
          targetId: existing.id,
          metadata: { slug: existing.slug },
        },
      });

      await transaction.trainingCourse.delete({
        where: { id: existing.id },
      });
    });

    return { success: true };
  }

  async listSections(principal: AuthenticatedPrincipal, courseId: string) {
    this.assertPlatformAdministrator(principal);
    await this.assertCourseExists(this.prisma, courseId);
    const items = await this.prisma.trainingSection.findMany({
      where: { courseId },
      select: sectionSelect,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return items.map((item) => this.presentSection(item));
  }

  async getSection(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const section = await this.prisma.trainingSection.findFirst({
      where: { id: sectionId, courseId },
      select: sectionSelect,
    });
    if (!section) {
      throw new NotFoundException('Training section was not found.');
    }
    return this.presentSection(section);
  }

  async createSection(
    principal: AuthenticatedPrincipal,
    courseId: string,
    input: CreateTrainingSectionDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const title = input.title.trim();
    if (!title) {
      throw new BadRequestException('Training section title cannot be blank.');
    }

    const section = await this.prisma.$transaction(async (transaction) => {
      await this.assertCourseExists(transaction, courseId);
      const created = await transaction.trainingSection.create({
        data: {
          courseId,
          title,
          titleTranslations: normalizeLocalizedText(
            input.titleTranslations,
            title,
          ),
          description: this.optionalText(input.description),
          descriptionTranslations: normalizeLocalizedText(
            input.descriptionTranslations,
            input.description,
          ),
          richDescriptionTranslations: this.normalizeLocalizedRichText(
            input.richDescriptionTranslations,
          ),
          status: input.status ?? TrainingContentStatus.DRAFT,
          sortOrder: input.sortOrder ?? 0,
        },
        select: sectionSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_SECTION_CREATED,
          targetType: 'training_section',
          targetId: created.id,
          metadata: { courseId, status: created.status },
        },
      });
      return created;
    });

    return this.presentSection(section);
  }

  async updateSection(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    input: UpdateTrainingSectionDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const existing = await this.prisma.trainingSection.findFirst({
      where: { id: sectionId, courseId },
      select: sectionSelect,
    });
    if (!existing) {
      throw new NotFoundException('Training section was not found.');
    }

    const title = input.title?.trim();
    if (input.title !== undefined && !title) {
      throw new BadRequestException('Training section title cannot be blank.');
    }

    const section = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.trainingSection.update({
        where: { id: sectionId },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(input.titleTranslations !== undefined
            ? {
                titleTranslations: normalizeLocalizedText(
                  input.titleTranslations,
                  title ?? existing.title,
                ),
              }
            : {}),
          ...(input.description !== undefined
            ? { description: this.optionalText(input.description) }
            : {}),
          ...(input.descriptionTranslations !== undefined
            ? {
                descriptionTranslations: normalizeLocalizedText(
                  input.descriptionTranslations,
                  input.description !== undefined
                    ? input.description
                    : existing.description,
                ),
              }
            : {}),
          ...(input.richDescriptionTranslations !== undefined
            ? {
                richDescriptionTranslations: this.normalizeLocalizedRichText(
                  input.richDescriptionTranslations,
                ),
              }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.sortOrder !== undefined
            ? { sortOrder: input.sortOrder }
            : {}),
        },
        select: sectionSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_SECTION_UPDATED,
          targetType: 'training_section',
          targetId: updated.id,
          metadata: {
            courseId,
            status: updated.status,
            sortOrder: updated.sortOrder,
          },
        },
      });
      return updated;
    });

    return this.presentSection(section);
  }

  async deleteSection(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
  ) {
    this.assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const section = await transaction.trainingSection.findFirst({
        where: { id: sectionId, courseId },
        select: {
          id: true,
          title: true,
          _count: { select: { lessons: true, quizzes: true } },
        },
      });
      if (!section) {
        throw new NotFoundException('Training section was not found.');
      }
      if (section._count.lessons > 0 || section._count.quizzes > 0) {
        throw new ConflictException(
          'This section contains learning content. Archive it or remove its content before permanent deletion.',
        );
      }

      await transaction.trainingSection.delete({ where: { id: sectionId } });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_SECTION_DELETED,
          targetType: 'training_section',
          targetId: sectionId,
          metadata: { courseId, title: section.title },
        },
      });

      return { id: sectionId, deleted: true };
    });
  }

  async listLessons(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertSectionExists(this.prisma, courseId, sectionId);
    const lessons = await this.prisma.trainingVideoLesson.findMany({
      where: { courseId, sectionId },
      select: lessonSelect,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return lessons.map((lesson) => this.presentLesson(lesson));
  }

  async getLesson(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: { id: lessonId, courseId, sectionId },
      select: lessonSelect,
    });
    if (!lesson) {
      throw new NotFoundException('Training lesson was not found.');
    }
    return this.presentLesson(lesson);
  }

  async createLesson(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    input: CreateTrainingLessonDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const title = input.title.trim();
    if (!title) {
      throw new BadRequestException('Training lesson title cannot be blank.');
    }
    if (input.status === TrainingContentStatus.PUBLISHED) {
      throw new ConflictException(
        'Create the lesson as a draft, configure its primary content, then publish it from the lesson review tab.',
      );
    }

    const created = await this.prisma.$transaction(async (transaction) => {
      await this.assertSectionExists(transaction, courseId, sectionId);
      const created = await transaction.trainingVideoLesson.create({
        data: {
          courseId,
          sectionId,
          videoAssetId: null,
          title,
          titleTranslations: normalizeLocalizedText(
            input.titleTranslations,
            title,
          ),
          description: this.optionalText(input.description),
          descriptionTranslations: normalizeLocalizedText(
            input.descriptionTranslations,
            input.description,
          ),
          richDescriptionTranslations: this.normalizeLocalizedRichText(
            input.richDescriptionTranslations,
          ),
          status: input.status ?? TrainingContentStatus.DRAFT,
          sortOrder: input.sortOrder ?? 0,
        },
        select: lessonSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_LESSON_CREATED,
          targetType: 'training_lesson',
          targetId: created.id,
          metadata: { courseId, sectionId, status: created.status },
        },
      });
      return created;
    });
    return this.presentLesson(created);
  }

  async updateLesson(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: UpdateTrainingLessonDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const existing = await this.prisma.trainingVideoLesson.findFirst({
      where: { id: lessonId, courseId, sectionId },
      select: lessonSelect,
    });
    if (!existing) {
      throw new NotFoundException('Training lesson was not found.');
    }

    const title = input.title?.trim();
    if (input.title !== undefined && !title) {
      throw new BadRequestException('Training lesson title cannot be blank.');
    }

    if (input.status === TrainingContentStatus.PUBLISHED) {
      const readiness = this.lessonReadiness(existing);
      if (!readiness.ready) {
        throw new ConflictException(
          `Lesson is not ready to publish: ${readiness.blockers.join(', ')}.`,
        );
      }
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.trainingVideoLesson.update({
        where: { id: lessonId },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(input.titleTranslations !== undefined
            ? {
                titleTranslations: normalizeLocalizedText(
                  input.titleTranslations,
                  title ?? existing.title,
                ),
              }
            : {}),
          ...(input.description !== undefined
            ? { description: this.optionalText(input.description) }
            : {}),
          ...(input.descriptionTranslations !== undefined
            ? {
                descriptionTranslations: normalizeLocalizedText(
                  input.descriptionTranslations,
                  input.description !== undefined
                    ? input.description
                    : existing.description,
                ),
              }
            : {}),
          ...(input.richDescriptionTranslations !== undefined
            ? {
                richDescriptionTranslations: this.normalizeLocalizedRichText(
                  input.richDescriptionTranslations,
                ),
              }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.sortOrder !== undefined
            ? { sortOrder: input.sortOrder }
            : {}),
        },
        select: lessonSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_LESSON_UPDATED,
          targetType: 'training_lesson',
          targetId: updated.id,
          metadata: {
            courseId,
            sectionId,
            status: updated.status,
            sortOrder: updated.sortOrder,
          },
        },
      });
      return updated;
    });
    return this.presentLesson(updated);
  }

  async deleteLesson(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const lesson = await transaction.trainingVideoLesson.findFirst({
        where: { id: lessonId, courseId, sectionId },
        select: { id: true, title: true },
      });
      if (!lesson) {
        throw new NotFoundException('Training lesson was not found.');
      }

      const progressCount = await transaction.trainingLessonProgress.count({
        where: { lessonId },
      });
      if (progressCount > 0) {
        throw new ConflictException(
          'This lesson has learner progress and cannot be permanently deleted. Archive it instead.',
        );
      }

      await transaction.trainingVideoLesson.delete({ where: { id: lessonId } });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_LESSON_DELETED,
          targetType: 'training_lesson',
          targetId: lessonId,
          metadata: { courseId, sectionId, title: lesson.title },
        },
      });

      return { id: lessonId, deleted: true };
    });
  }

  private lessonReadiness(record: LessonRecord) {
    return evaluateTrainingLessonReadiness({
      contentType: record.contentType,
      videoStatus: record.videoAsset?.status ?? null,
      documentStatus: record.documentAsset?.status ?? null,
      documentPageCount: record.documentPageCount,
      articleContentTranslations: record.articleContentTranslations,
      quizConfigured: false,
    });
  }

  private presentLesson(record: LessonRecord) {
    const readiness = this.lessonReadiness(record);
    const { videoAsset, documentAsset, ...lesson } = record;
    void videoAsset;
    void documentAsset;
    return { ...lesson, contentReady: readiness.ready };
  }

  private presentCategory(record: CategoryRecord) {
    const { _count, ...category } = record;
    return { ...category, courseCount: _count.courses };
  }

  private presentCourse(record: CourseRecord) {
    const { _count, ...course } = record;
    return {
      ...course,
      sectionCount: _count.sections,
      lessonCount: _count.lessons,
    };
  }

  private presentSection(record: SectionRecord) {
    const { _count, ...section } = record;
    return { ...section, lessonCount: _count.lessons };
  }

  private uniqueBatchIds(ids: string[]): string[] {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) {
      throw new BadRequestException('Duplicate identifiers are not allowed.');
    }
    return unique;
  }

  private async assertActiveCertificateTemplate(
    client:
      | Pick<PrismaService, 'trainingCertificateTemplate'>
      | Pick<Prisma.TransactionClient, 'trainingCertificateTemplate'>,
    templateId: string,
  ): Promise<void> {
    const template = await client.trainingCertificateTemplate.findFirst({
      where: { id: templateId, active: true },
      select: { id: true },
    });
    if (!template) {
      throw new BadRequestException(
        'Certificate template must be active and available.',
      );
    }
  }

  private async assertCertificateTemplateExists(
    client:
      | Pick<PrismaService, 'trainingCertificateTemplate'>
      | Pick<Prisma.TransactionClient, 'trainingCertificateTemplate'>,
    templateId: string,
  ): Promise<void> {
    const template = await client.trainingCertificateTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    });
    if (!template) {
      throw new BadRequestException('Certificate template was not found.');
    }
  }

  private async assertCourseCoverImageAsset(
    client:
      | Pick<PrismaService, 'fileAsset'>
      | Pick<Prisma.TransactionClient, 'fileAsset'>,
    fileId: string,
  ): Promise<void> {
    const asset = await client.fileAsset.findFirst({
      where: {
        id: fileId,
        accountScope: AccountScope.PLATFORM,
        companyId: null,
        kind: FileAssetKind.IMAGE,
        status: FileAssetStatus.READY,
      },
      select: { id: true },
    });

    if (!asset) {
      throw new BadRequestException(
        'Course cover must reference an active platform image asset.',
      );
    }
  }

  private normalizeLocalizedRichText(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue {
    if (value === undefined) return {};

    const serialized = JSON.stringify(value);
    if (serialized.length > 150_000) {
      throw new BadRequestException('Rich text content is too large.');
    }

    const allowedLocales = new Set(['ku', 'ar', 'en']);
    for (const [locale, document] of Object.entries(value)) {
      if (!allowedLocales.has(locale)) {
        throw new BadRequestException(
          'Rich text contains an unsupported locale.',
        );
      }
      if (!this.isRichTextDocument(document)) {
        throw new BadRequestException('Rich text document is invalid.');
      }
    }

    return value as Prisma.InputJsonValue;
  }

  private isRichTextDocument(value: unknown): boolean {
    if (!this.isPlainObject(value) || value.type !== 'doc') return false;

    let nodeCount = 0;
    let textLength = 0;
    const allowedNodeTypes = new Set([
      'doc',
      'paragraph',
      'text',
      'heading',
      'bulletList',
      'orderedList',
      'listItem',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'hardBreak',
      'image',
      'separator',
    ]);

    const visit = (node: unknown, depth: number): boolean => {
      if (depth > 20 || !this.isPlainObject(node)) return false;
      nodeCount += 1;
      if (nodeCount > 2_000) return false;

      if (typeof node.type !== 'string' || !allowedNodeTypes.has(node.type)) {
        return false;
      }

      if ('text' in node) {
        if (node.type !== 'text' || typeof node.text !== 'string') return false;
        textLength += node.text.length;
        if (textLength > 50_000) return false;
      }

      if ('marks' in node) {
        if (
          !Array.isArray(node.marks) ||
          node.marks.some((mark) => !this.isAllowedRichTextMark(mark))
        ) {
          return false;
        }
      }

      if (node.type === 'separator' && 'attrs' in node) {
        if (
          !this.isPlainObject(node.attrs) ||
          Object.keys(node.attrs).some((key) => key !== 'label') ||
          (node.attrs.label !== null &&
            node.attrs.label !== undefined &&
            (typeof node.attrs.label !== 'string' ||
              node.attrs.label.length > 200))
        ) {
          return false;
        }
      }

      if ('content' in node) {
        if (
          !Array.isArray(node.content) ||
          node.content.some((child) => !visit(child, depth + 1))
        ) {
          return false;
        }
      }

      return true;
    };

    return visit(value, 0);
  }

  private isAllowedRichTextMark(mark: unknown): boolean {
    if (!this.isPlainObject(mark) || typeof mark.type !== 'string') {
      return false;
    }

    if (['bold', 'italic', 'strike', 'code'].includes(mark.type)) {
      return (
        !('attrs' in mark) || mark.attrs === null || mark.attrs === undefined
      );
    }

    if (mark.type !== 'link' || !this.isPlainObject(mark.attrs)) {
      return false;
    }

    const allowedKeys = new Set(['href', 'target', 'rel', 'class', 'title']);
    if (Object.keys(mark.attrs).some((key) => !allowedKeys.has(key))) {
      return false;
    }

    const href = mark.attrs.href;
    if (
      typeof href !== 'string' ||
      href.length === 0 ||
      href.length > 2048 ||
      !this.isAllowedRichTextHref(href)
    ) {
      return false;
    }

    const target = mark.attrs.target;
    if (
      target !== null &&
      target !== undefined &&
      target !== '_blank' &&
      target !== '_self'
    ) {
      return false;
    }

    for (const key of ['rel', 'class', 'title'] as const) {
      const value = mark.attrs[key];
      if (
        value !== null &&
        value !== undefined &&
        (typeof value !== 'string' || value.length > 500)
      ) {
        return false;
      }
    }

    return true;
  }

  private isAllowedRichTextHref(href: string): boolean {
    if (
      /^\/api\/files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/content$/i.test(
        href,
      )
    ) {
      return true;
    }

    try {
      const url = new URL(href);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private optionalText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private assertPlatformAdministrator(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Training catalog administration is restricted to platform accounts.',
      );
    }
  }

  private async assertCategoryExists(
    client: Pick<Prisma.TransactionClient, 'trainingCategory'>,
    categoryId: string,
  ): Promise<void> {
    const category = await client.trainingCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException('Training category was not found.');
    }
  }

  private async assertCourseExists(
    client:
      | Pick<PrismaService, 'trainingCourse'>
      | Pick<Prisma.TransactionClient, 'trainingCourse'>,
    courseId: string,
  ): Promise<void> {
    const course = await client.trainingCourse.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Training course was not found.');
    }
  }

  private async assertSectionExists(
    client:
      | Pick<PrismaService, 'trainingSection'>
      | Pick<Prisma.TransactionClient, 'trainingSection'>,
    courseId: string,
    sectionId: string,
  ): Promise<void> {
    const section = await client.trainingSection.findFirst({
      where: { id: sectionId, courseId },
      select: { id: true },
    });
    if (!section) {
      throw new NotFoundException('Training section was not found.');
    }
  }
}
