import { AccountScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { TrainingEntitlementService } from './training-entitlement.service';
import { TrainingDashboardService } from './training-dashboard.service';
import type { TrainingProgressService } from './training-progress.service';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const USER_ID = '3b68c4f4-a83b-40d9-b434-b95000463013';

const principal: AuthenticatedPrincipal = {
  sessionId: 'session',
  userId: USER_ID,
  email: 'learner@example.com',
  accountScope: AccountScope.COMPANY,
  companyId: COMPANY_ID,
};

describe('TrainingDashboardService', () => {
  it('uses entitled courses, immutable completions, and central progress summaries', async () => {
    const context = {
      companyId: COMPANY_ID,
      userId: USER_ID,
      now: new Date('2026-09-05T12:00:00.000Z'),
      enabled: true,
      activeTrainingServiceIds: [],
    };
    const courses = [
      {
        id: 'course-a',
        slug: 'course-a',
        title: 'Course A',
        titleTranslations: {},
        coverImageAssetId: 'cover-a',
        category: {
          id: 'category',
          key: 'odoo',
          name: 'Odoo',
          nameTranslations: {},
        },
      },
      {
        id: 'course-b',
        slug: 'course-b',
        title: 'Course B',
        titleTranslations: {},
        coverImageAssetId: null,
        category: {
          id: 'category',
          key: 'odoo',
          name: 'Odoo',
          nameTranslations: {},
        },
      },
      {
        id: 'course-c',
        slug: 'course-c',
        title: 'Course C',
        titleTranslations: {},
        coverImageAssetId: null,
        category: {
          id: 'category',
          key: 'odoo',
          name: 'Odoo',
          nameTranslations: {},
        },
      },
    ];

    const database = {
      trainingCourse: {
        findMany: jest.fn().mockResolvedValue(courses),
      },
      trainingCourseCompletion: {
        findMany: jest.fn().mockResolvedValue([
          {
            courseId: 'course-b',
            completedAt: new Date('2026-09-04T12:00:00.000Z'),
            certificate: {
              id: 'certificate-b',
              status: 'ACTIVE',
            },
          },
        ]),
      },
    };
    const entitlements = {
      resolveCustomerContext: jest.fn().mockResolvedValue(context),
      customerCourseWhere: jest.fn().mockReturnValue({
        status: 'PUBLISHED',
      }),
    };
    const progressBySlug = {
      'course-a': {
        courseId: 'course-a',
        slug: 'course-a',
        status: 'IN_PROGRESS',
        completedLessons: 2,
        totalLessons: 4,
        percentage: 50,
        resumeLessonId: 'lesson-a',
        lastAccessedAt: '2026-09-05T11:00:00.000Z',
        lessons: [],
      },
      'course-b': {
        courseId: 'course-b',
        slug: 'course-b',
        status: 'COMPLETED',
        completedLessons: 4,
        totalLessons: 4,
        percentage: 100,
        resumeLessonId: null,
        lastAccessedAt: '2026-09-04T12:00:00.000Z',
        lessons: [],
      },
      'course-c': {
        courseId: 'course-c',
        slug: 'course-c',
        status: 'NOT_STARTED',
        completedLessons: 0,
        totalLessons: 4,
        percentage: 0,
        resumeLessonId: 'lesson-c',
        lastAccessedAt: null,
        lessons: [],
      },
    };
    const progress = {
      getCourseForContext: jest.fn(
        (
          _context: unknown,
          _courseId: string,
          slug: keyof typeof progressBySlug,
        ) => progressBySlug[slug],
      ),
    };

    const service = new TrainingDashboardService(
      database as unknown as PrismaService,
      entitlements as unknown as TrainingEntitlementService,
      progress as unknown as TrainingProgressService,
    );

    const result = await service.summary(principal);

    expect(entitlements.customerCourseWhere).toHaveBeenCalledWith(context);
    expect(progress.getCourseForContext).toHaveBeenCalledTimes(3);
    expect(database.trainingCourseCompletion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: COMPANY_ID,
          userId: USER_ID,
          courseId: {
            in: ['course-a', 'course-b', 'course-c'],
          },
        },
      }),
    );
    expect(result.metrics).toEqual({
      entitledCourses: 3,
      completed: 1,
      inProgress: 1,
      notStarted: 1,
      averageProgressPercentage: 50,
    });
    expect(result.courses[0].course.id).toBe('course-a');
    expect(result.courses[1].course.id).toBe('course-b');
    expect(result.courses[1].certificate?.id).toBe('certificate-b');
  });

  it('does not query training data when training is disabled for the company', async () => {
    const database = {
      trainingCourse: {
        findMany: jest.fn(),
      },
      trainingCourseCompletion: {
        findMany: jest.fn(),
      },
    };
    const entitlements = {
      resolveCustomerContext: jest.fn().mockResolvedValue({
        companyId: COMPANY_ID,
        userId: USER_ID,
        now: new Date(),
        enabled: false,
        activeTrainingServiceIds: [],
      }),
      customerCourseWhere: jest.fn(),
    };
    const progress = {
      getCourseForContext: jest.fn(),
    };

    const service = new TrainingDashboardService(
      database as unknown as PrismaService,
      entitlements as unknown as TrainingEntitlementService,
      progress as unknown as TrainingProgressService,
    );

    await expect(service.summary(principal)).resolves.toEqual({
      enabled: false,
      metrics: {
        entitledCourses: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        averageProgressPercentage: 0,
      },
      courses: [],
    });
    expect(database.trainingCourse.findMany).not.toHaveBeenCalled();
    expect(progress.getCourseForContext).not.toHaveBeenCalled();
  });
});
